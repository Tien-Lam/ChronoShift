import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { Conversion, ConversionOptions, TimeResult } from "./engine/types";
import { MAX_INPUT } from "./engine/limits";
import { copyText, formatResult } from "./engine/time";
import { resolveCity, validZone, zoneName } from "./engine/zones";
import {
  DEFAULTS,
  deviceTimezone,
  loadPreferences,
  resetPreferences,
  savePreferences,
} from "./platform/preferences";
import {
  clearAbandonedShares,
  consumeShare,
  consumeUpdate,
  preserveForUpdate,
} from "./platform/handoff";
import { setupOffline } from "./platform/offline";
import type { OfflineState } from "./platform/offline";
import { ChoiceSelect, ZoneChoice } from "./components/Choices";
import { DateChoice } from "./components/DateChoice";

const examples = [
  "April 9 at 9am PT / 12pm ET",
  "Tomorrow at 3pm in Tokyo",
  "July 15 at 3pm CST",
];
function resolveZone(value: string, fallback: string): string | undefined {
  if (!value.trim()) return fallback;
  if (validZone(value.trim())) return value.trim();
  const cities = resolveCity(value).zones;
  return cities.length === 1 ? cities[0] : undefined;
}

export default function App() {
  const [text, setText] = useState("");
  const [prefs, setPrefs] = useState(loadPreferences);
  const [device, setDevice] = useState(deviceTimezone);
  const [referenceDate, setReferenceDate] = useState("");
  const [referenceReset, setReferenceReset] = useState(0);
  const referenceValid = useRef(true);
  const [conversion, setConversion] = useState<Conversion>({
    results: [],
    warnings: [],
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [preferenceError, setPreferenceError] = useState(false);
  const [manualCopy, setManualCopy] = useState("");
  const [pendingImport, setPendingImport] = useState<{
    text: string;
    source: "Shared" | "Clipboard";
  }>();
  const [offline, setOffline] = useState<OfflineState>({ ready: false });
  const [installPrompt, setInstallPrompt] = useState<any>();
  const [installHelp, setInstallHelp] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null),
    copyField = useRef<HTMLTextAreaElement>(null);
  const worker = useRef<Worker | null>(null),
    request = useRef(0);
  const importRequest = useRef(0);
  const copyRequest = useRef(0);
  const draft = useRef(text);
  draft.current = text;
  const shareRead = useRef(false);
  const sourceZone = resolveZone(prefs.source, device),
    targetZone = resolveZone(prefs.target, device);
  const displayOptions: ConversionOptions = {
    sourceZone: sourceZone || device,
    targetZone: targetZone || device,
    hourCycle: prefs.hourCycle,
    dateOrder: prefs.dateOrder,
    referenceDate: referenceDate || undefined,
    locale: navigator.language || "en-AU",
  };

  useEffect(() => {
    const controller = new AbortController();
    setupOffline(setOffline, controller.signal);
    const refresh = () => {
      setDevice(deviceTimezone());
    };
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    window.addEventListener("focus", refresh);
    const prompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    window.addEventListener("beforeinstallprompt", prompt);
    return () => {
      controller.abort();
      worker.current?.terminate();
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("beforeinstallprompt", prompt);
    };
  }, []);
  useEffect(() => {
    if (shareRead.current) return;
    shareRead.current = true;
    const restore = consumeUpdate();
    if (restore) setText(restore);
    const params = new URLSearchParams(location.search),
      key = params.get("share");
    if (!key) clearAbandonedShares().catch(() => {});
    if (key) {
      const importId = ++importRequest.current,
        version = request.current;
      history.replaceState(null, "", location.pathname);
      consumeShare(key)
        .then((message) => {
          if (importId !== importRequest.current) return;
          if (message) {
            receiveImport(message, "Shared", version, !!restore);
          } else
            setNotice("The shared text expired. Paste it here to continue.");
        })
        .catch(() => {
          if (importId === importRequest.current)
            setNotice(
              "Could not receive shared text. Paste it here to continue.",
            );
        });
    }
  }, []);
  useEffect(() => {
    if (targetZone && sourceZone) setPreferenceError(!savePreferences(prefs));
  }, [prefs, targetZone, sourceZone]);
  useLayoutEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const theme =
        prefs.theme === "system"
          ? media.matches
            ? "dark"
            : "light"
          : prefs.theme;
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.design = "command";
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute("content", theme === "dark" ? "#0a0a0b" : "#fafafa");
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [prefs.theme]);

  function edit(value: string) {
    copyRequest.current++;
    request.current++;
    worker.current?.terminate();
    worker.current = null;
    setBusy(false);
    setText(value);
    setConversion({ results: [], warnings: [] });
    setError("");
    setManualCopy("");
  }
  function invalidate() {
    copyRequest.current++;
    request.current++;
    worker.current?.terminate();
    worker.current = null;
    setBusy(false);
    setConversion({ results: [], warnings: [] });
    setError("");
    setManualCopy("");
  }
  const referenceValidityChanged = useCallback((valid: boolean) => {
    referenceValid.current = valid;
    if (!valid) invalidate();
  }, []);
  function run() {
    copyRequest.current++;
    setNotice("");
    setManualCopy("");
    if (!text.trim()) {
      setError("Paste or type a message with a time to get started.");
      input.current?.focus();
      return;
    }
    if (text.length > MAX_INPUT) {
      setError(
        "Keep the message under 10,000 characters. Shorten it and try again.",
      );
      return;
    }
    if (!targetZone || !sourceZone) {
      setError(
        "Choose a timezone from the list, or enter a city with one known timezone.",
      );
      return;
    }
    if (!referenceValid.current) {
      setError("Complete or clear the reference date before converting.");
      return;
    }
    request.current++;
    const id = request.current;
    worker.current?.terminate();
    setBusy(true);
    setError("");
    setConversion({ results: [], warnings: [] });
    try {
      const current = new Worker(
        new URL("./engine/worker.ts", import.meta.url),
        { type: "module" },
      );
      worker.current = current;
      current.onmessage = (event) => {
        if (event.data.id !== request.current) return;
        setBusy(false);
        if (event.data.error) setError(event.data.error);
        else {
          setConversion(event.data.conversion);
          if (
            !event.data.conversion.results.length &&
            !event.data.conversion.warnings.length
          )
            setError(
              "No timestamp found. Try a date and time, such as “April 9 at 3pm PT”.",
            );
        }
        current.terminate();
        worker.current = null;
      };
      current.onerror = () => {
        if (id !== request.current) return;
        setBusy(false);
        setError("Could not start conversion. Choose Convert to try again.");
        current.terminate();
        worker.current = null;
      };
      current.postMessage({
        id,
        text,
        options: { ...displayOptions, now: new Date().toISOString() },
      });
    } catch {
      setBusy(false);
      setError(
        "This browser could not start conversion. Reload and try again.",
      );
    }
  }
  function receiveImport(
    value: string,
    source: "Shared" | "Clipboard",
    version: number,
    preserveDraft = false,
  ) {
    if (preserveDraft || version !== request.current) {
      setPendingImport({ text: value, source });
      return;
    }
    edit(value);
    if (source === "Shared") setNotice("Shared text is ready. Choose Convert.");
    else input.current?.focus();
  }
  async function paste() {
    const importId = ++importRequest.current,
      version = request.current;
    setPendingImport(undefined);
    try {
      const value = await navigator.clipboard.readText();
      if (importId !== importRequest.current) return;
      receiveImport(value, "Clipboard", version);
    } catch {
      if (importId !== importRequest.current) return;
      setNotice(
        "Paste directly into the message box using your keyboard or touch menu.",
      );
      input.current?.focus();
    }
  }
  async function copy(result: TimeResult) {
    if (!targetZone || !sourceZone) return;
    const copyId = ++copyRequest.current;
    const value = copyText(result, displayOptions);
    try {
      await navigator.clipboard.writeText(value);
      if (copyId !== copyRequest.current) return;
      setNotice("Copied with the date and timezone.");
      setManualCopy("");
    } catch {
      if (copyId !== copyRequest.current) return;
      setManualCopy(value);
      setNotice(
        "Select the text below and copy it using your keyboard or touch menu.",
      );
      requestAnimationFrame(() => {
        copyField.current?.focus();
        copyField.current?.select();
      });
    }
  }
  function update() {
    const pending = offline.update;
    if (pending?.state !== "installed") return;
    if (draft.current && !preserveForUpdate(draft.current)) {
      setNotice(
        "Copy your message somewhere safe, then clear it before updating. This browser cannot preserve it during a reload.",
      );
      return;
    }
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => location.reload(),
      { once: true },
    );
    pending.postMessage({ type: "ACTIVATE_UPDATE" });
  }
  const groups = targetZone
    ? [...new Set(conversion.results.map((r) => r.group))]
    : [];
  return (
    <>
      <header className="topbar">
        <a
          className="brand"
          href={import.meta.env.BASE_URL}
          aria-label="ChronoShift home"
        >
          <span className="brand-clock" aria-hidden="true" />
          ChronoShift
        </a>
        <div className="header-tools">
          <details
            className="appearance"
            onKeyDown={(event) => {
              if (
                event.key === "Escape" &&
                !document.querySelector(".choice-popover")
              ) {
                event.currentTarget.open = false;
                event.currentTarget.querySelector("summary")?.focus();
              }
            }}
          >
            <summary aria-label="Appearance">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="8" />
                <path
                  d="M12 4a8 8 0 0 0 0 16Z"
                  fill="currentColor"
                  stroke="none"
                />
              </svg>
              <span className="appearance-label">Appearance</span>
            </summary>
            <div className="appearance-fields">
              <label htmlFor="theme">Theme</label>
              <ChoiceSelect
                id="theme"
                label="Theme"
                value={prefs.theme}
                onChange={(theme) =>
                  setPrefs({
                    ...prefs,
                    theme: theme as "dark" | "light" | "system",
                  })
                }
                options={[
                  { id: "dark", label: "Dark" },
                  { id: "light", label: "Light" },
                  { id: "system", label: "System" },
                ]}
              />
            </div>
          </details>
        </div>
      </header>
      <main data-offline-ready={offline.ready}>
        <h1 className="sr-only">Time zone converter</h1>
        <div
          className={`workspace ${conversion.results.length ? "has-results" : ""}`}
        >
          <section className="input-panel" aria-labelledby="input-title">
            <div className="panel-heading">
              <h2 id="input-title">Time zone converter</h2>
            </div>
            <label htmlFor="message">Message with a date or time</label>
            <textarea
              ref={input}
              id="message"
              value={text}
              placeholder="e.g. Let's meet tomorrow at 3pm PT"
              onChange={(e) => edit(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  run();
                }
              }}
              spellCheck={false}
              aria-describedby="input-help"
            />
            <div className="input-tools">
              <div>
                <button type="button" className="text-button" onClick={paste}>
                  Paste
                </button>
                {text && (
                  <button
                    type="button"
                    className="text-button muted"
                    onClick={() => {
                      edit("");
                      input.current?.focus();
                    }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <span
                id="input-help"
                className={text.length > MAX_INPUT ? "limit exceeded" : "limit"}
              >
                {text.length > 8000
                  ? `${text.length.toLocaleString()} / 10,000`
                  : "Ctrl / ⌘ + Enter"}
              </span>
            </div>
            <div className="target-field">
              <label htmlFor="target-zone">Convert to</label>
              <div className="conversion-controls">
                <ZoneChoice
                  id="target-zone"
                  label="Convert to"
                  value={prefs.target}
                  onChange={(target) => {
                    copyRequest.current++;
                    setPrefs({ ...prefs, target });
                    setError("");
                    setManualCopy("");
                    setNotice("");
                  }}
                  invalid={!targetZone}
                  describedBy="target-zone-help"
                  placeholder={`Your timezone · ${zoneName(device)}`}
                  triggerLabel="Show target timezones"
                />
                <button
                  type="button"
                  className="convert-button"
                  onClick={run}
                  aria-busy={busy}
                >
                  {busy ? "Converting…" : "Convert"}
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14m-5-5 5 5-5 5" />
                  </svg>
                </button>
              </div>
              <span className="field-note" id="target-zone-help">
                {targetZone
                  ? `${zoneName(targetZone)} · ${targetZone}`
                  : "Choose a timezone or city from the list"}
              </span>
            </div>

            <details className="options">
              <summary>More options</summary>
              <div className="option-fields">
                <label htmlFor="source-zone">
                  Source timezone when none is given
                </label>
                <ZoneChoice
                  id="source-zone"
                  label="Source timezone when none is given"
                  value={prefs.source}
                  onChange={(source) => {
                    setPrefs({ ...prefs, source });
                    invalidate();
                  }}
                  placeholder={`Device timezone · ${device}`}
                  triggerLabel="Show source timezones"
                />
                <DateChoice
                  key={referenceReset}
                  id="reference-date"
                  label="Reference date for this message"
                  value={referenceDate}
                  onChange={(date) => {
                    setReferenceDate(date);
                    invalidate();
                  }}
                  onValidityChange={referenceValidityChanged}
                />
                <span className="field-note">
                  Leave empty to use today. Useful for an older message.
                </span>
                <label htmlFor="date-order">Numeric dates</label>
                <ChoiceSelect
                  id="date-order"
                  label="Numeric dates"
                  value={prefs.dateOrder}
                  onChange={(dateOrder) => {
                    setPrefs({
                      ...prefs,
                      dateOrder: dateOrder as "mdy" | "dmy",
                    });
                    invalidate();
                  }}
                  options={[
                    { id: "mdy", label: "Month / day (04/09 = April 9)" },
                    { id: "dmy", label: "Day / month (04/09 = 4 September)" },
                  ]}
                />
                <label htmlFor="time-format">Time display</label>
                <ChoiceSelect
                  id="time-format"
                  label="Time display"
                  value={prefs.hourCycle}
                  onChange={(hourCycle) => {
                    copyRequest.current++;
                    setManualCopy("");
                    setNotice("");
                    setPrefs({
                      ...prefs,
                      hourCycle: hourCycle as "auto" | "12" | "24",
                    });
                  }}
                  options={[
                    { id: "auto", label: "Use my device format" },
                    { id: "12", label: "12-hour (3:00 PM)" },
                    { id: "24", label: "24-hour (15:00)" },
                  ]}
                />
                <button
                  type="button"
                  className="text-button"
                  onClick={() => {
                    resetPreferences();
                    setPrefs({ ...DEFAULTS });
                    setReferenceDate("");
                    referenceValid.current = true;
                    setReferenceReset((version) => version + 1);
                    invalidate();
                    setNotice("Preferences reset.");
                  }}
                >
                  Reset preferences
                </button>
              </div>
            </details>
            {!text && (
              <details className="examples">
                <summary>Try an example</summary>
                {examples.map((example) => (
                  <button
                    type="button"
                    key={example}
                    onClick={() => {
                      edit(example);
                      input.current?.focus();
                    }}
                  >
                    {example}
                    <span aria-hidden="true">↗</span>
                  </button>
                ))}
              </details>
            )}
          </section>
          <section
            className="result-panel"
            aria-labelledby="result-title"
            aria-busy={busy}
          >
            <div className="panel-heading">
              <h2 id="result-title">Converted time</h2>
            </div>
            <div role="status" className="sr-only">
              {busy
                ? "Converting message"
                : targetZone && conversion.results.length
                  ? `${conversion.results.length} time interpretations found`
                  : ""}
            </div>
            {error && (
              <div className="message error" role="alert">
                {error}
              </div>
            )}
            {!targetZone && !!conversion.results.length && !error && (
              <p className="message warning" role="alert">
                Choose a timezone to see and copy the converted time.
              </p>
            )}
            {conversion.warnings.map((w) => (
              <div key={w} className="message warning" role="alert">
                {w}
              </div>
            ))}
            {!conversion.results.length &&
              !error &&
              !conversion.warnings.length && (
                <div className="result-placeholder">
                  <span className="large-clock" aria-hidden="true" />
                  <h3>{busy ? "Finding your time…" : "Ready to convert"}</h3>
                  <p>Date, time and timezone appear here.</p>
                </div>
              )}
            {groups.map((group) => {
              const entries = conversion.results.filter(
                (r) => r.group === group,
              );
              return (
                <article className="result-group" key={group}>
                  <div className="result-source">
                    <p>
                      “{entries[0].original}”
                      {entries[0].endpoint ? ` · ${entries[0].endpoint}` : ""}
                    </p>
                    {entries.length > 1 && (
                      <span className="ambiguity">
                        {entries.length} possible interpretations
                      </span>
                    )}
                  </div>
                  {entries.map((result) => {
                    const d = formatResult(result, displayOptions);
                    return (
                      <div className="result" key={result.id}>
                        <div className="result-top">
                          <span className="source-label">
                            {result.interpretation || result.sourceLabel}
                          </span>
                          <button
                            type="button"
                            className="copy-button"
                            onClick={() => copy(result)}
                            aria-label={`Copy ${result.interpretation || result.sourceLabel}${result.endpoint ? " " + result.endpoint : ""}`}
                          >
                            Copy
                          </button>
                        </div>
                        {d.time && <div className="hero-time">{d.time}</div>}
                        <p className="result-date">{d.date}</p>
                        <p className="result-zone">
                          {d.zone}
                          {d.dateShift !== 0 && (
                            <span className="day-shift">
                              {d.dateShift > 0 ? "+" : ""}
                              {d.dateShift} day
                              {Math.abs(d.dateShift) !== 1 ? "s" : ""}
                            </span>
                          )}
                        </p>
                        {result.dateOnly && (
                          <p className="assumption">
                            A date without a time cannot be shifted between
                            timezones.
                          </p>
                        )}
                        {result.assumptions.map((a) => (
                          <p className="assumption" key={a}>
                            {a}
                          </p>
                        ))}
                        {result.occurrences > 1 && (
                          <p className="assumption">
                            Mentioned {result.occurrences} times
                          </p>
                        )}
                      </div>
                    );
                  })}
                </article>
              );
            })}
          </section>
        </div>
        <div role="status" className="notice">
          {notice}
        </div>
        {pendingImport && (
          <div className="import-choice">
            <p role="status">
              {pendingImport.source} text arrived. Replace the current message?
            </p>
            <div>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  edit(pendingImport.text);
                  setPendingImport(undefined);
                  setNotice("Imported text is ready. Choose Convert.");
                  input.current?.focus();
                }}
              >
                Replace with imported text
              </button>
              <button
                type="button"
                className="text-button muted"
                onClick={() => setPendingImport(undefined)}
              >
                Dismiss imported text
              </button>
            </div>
          </div>
        )}
        {preferenceError && (
          <p className="message warning">
            Preferences cannot be saved in this browser. Conversion still works.
          </p>
        )}
        {manualCopy && (
          <div className="manual-copy">
            <label htmlFor="manual-copy">Text to copy</label>
            <textarea
              ref={copyField}
              id="manual-copy"
              value={manualCopy}
              readOnly
              onFocus={(e) => e.target.select()}
            />
          </div>
        )}
        {offline.error && <p className="message warning">{offline.error}</p>}
        {offline.update && (
          <div className="update-banner">
            <p>
              A new version is ready. Your message will be kept when you update.
            </p>
            <button className="copy-button" type="button" onClick={update}>
              Update now
            </button>
          </div>
        )}
        <footer>
          <p>Your text stays on this device.</p>
          <button
            type="button"
            className="text-button"
            onClick={async () => {
              if (installPrompt) {
                await installPrompt.prompt();
                setInstallPrompt(undefined);
              } else setInstallHelp(!installHelp);
            }}
          >
            Keep ChronoShift handy
          </button>
        </footer>
        {installHelp && (
          <div className="install-help">
            <h2>Use it anytime</h2>
            <p>
              Open your browser’s menu and choose <strong>Install app</strong>,{" "}
              <strong>Add to Home Screen</strong>, or{" "}
              <strong>Add to Dock</strong>, if offered. On iPhone, look in the
              Share menu.
            </p>
            <p>
              You can also bookmark this page. If you clear browser storage,
              open it online again before using it offline.
            </p>
            {!offline.ready && (
              <p>
                Keep this page open online to finish saving it for offline use.
              </p>
            )}
            <button
              className="text-button"
              type="button"
              onClick={() => setInstallHelp(false)}
            >
              Got it
            </button>
          </div>
        )}
      </main>
    </>
  );
}
