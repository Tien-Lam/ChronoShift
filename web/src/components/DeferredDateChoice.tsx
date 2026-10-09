import { useEffect, useState } from "react";
import type { DateChoiceProps } from "./DateChoice";
import { ActionButton } from "./ui/ActionButton";
import { dateControlUrl } from "virtual:date-control-url";
// Keep styling available even if the dynamic JS request fails or is retried.
import "./DateChoice.css";

type DateControl = typeof import("./DateChoice").DateChoice;
let loadedControl: DateControl | undefined;

export function DeferredDateChoice(props: DateChoiceProps) {
  const [Control, setControl] = useState(() => loadedControl);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (Control) return;
    let active = true;
    setFailed(false);
    const timeout = setTimeout(() => {
      if (!active) return;
      active = false;
      setFailed(true);
    }, 12_000);
    const url = new URL(dateControlUrl, location.href);
    // Chromium caches a rejected module load. A user-requested retry needs a
    // distinct URL for the same immutable file; no message/date enters it.
    if (attempt) url.searchParams.set("date-control-retry", String(attempt));
    const load = import(/* @vite-ignore */ url.href) as Promise<
      typeof import("./DateChoice")
    >;
    void load.then(
      (module) => {
        clearTimeout(timeout);
        loadedControl = module.DateChoice;
        if (active) setControl(() => module.DateChoice);
      },
      () => {
        clearTimeout(timeout);
        if (active) setFailed(true);
      },
    );
    return () => {
      clearTimeout(timeout);
      active = false;
    };
  }, [Control, attempt]);

  if (Control) return <Control {...props} />;
  return (
    <div className="date-choice">
      <span className="date-choice-label">{props.label}</span>
      <div className="date-choice-control date-choice-pending">
        <p role="status">
          {failed ? "Unable to load dates." : "Loading date controls…"}
        </p>
        {failed && (
          <ActionButton
            type="button"
            aria-label="Retry date controls"
            className="date-choice-retry"
            onPress={() => setAttempt((value) => value + 1)}
          >
            Retry
          </ActionButton>
        )}
      </div>
    </div>
  );
}
