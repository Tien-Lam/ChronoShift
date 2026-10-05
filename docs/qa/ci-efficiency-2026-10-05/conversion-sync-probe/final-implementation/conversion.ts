import type { Page } from "@playwright/test";

// Ordinary positive conversions only. Keep the caller's exact result assertion;
// this observes completion without changing debounce, workers or application state.
export async function fillSuccessfulConversion(
  page: Page,
  text: string,
  assertResult: (remainingTimeout: () => number) => Promise<unknown>,
  timeout = 10_000,
) {
  if (!text.trim() || !Number.isFinite(timeout) || timeout <= 0)
    throw new Error(
      "Conversion observation requires nonempty text and a deadline",
    );
  // Match fill's ordinary mounting/visibility precondition before inspecting
  // ownership. This does not wait for a prior conversion to become idle.
  const input = page.getByLabel("Message with a date or time");
  await input.waitFor({ state: "visible" });
  const observation = await page.evaluateHandle((nextText) => {
    const panels = document.querySelectorAll(".result-panel");
    const input = document.querySelector<HTMLTextAreaElement>("#message");
    if (panels.length !== 1 || !input)
      throw new Error(
        "Conversion observation requires one owned panel and input",
      );
    const panel = panels[0];
    if (panel.getAttribute("aria-busy") !== "false")
      throw new Error("Conversion observation requires an idle panel");
    if (input.value === nextText)
      throw new Error("Conversion observation requires changed input text");

    let resolve!: () => void;
    let reject!: (error: Error) => void;
    const settled = new Promise<void>((yes, no) => {
      resolve = yes;
      reject = no;
    });
    // Observation can fail while fill is still running. Consume that rejection
    // now; awaiting the same promise afterwards still propagates its failure.
    void settled.catch(() => {});
    let finished = false;
    let ownsInput = false;
    let sawBusy = false;
    let sawIdle = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ownsPanel = () =>
      panel.isConnected &&
      document.querySelectorAll(".result-panel").length === 1 &&
      document.querySelector(".result-panel") === panel &&
      document.querySelector("#message") === input;
    const cleanup = () => {
      if (timer !== undefined) clearTimeout(timer);
      observer.disconnect();
      ownershipObserver.disconnect();
      input.removeEventListener("input", onInput, true);
      window.removeEventListener("pagehide", onPageHide);
    };
    const fail = (message: string) => {
      if (finished) return;
      finished = true;
      cleanup();
      reject(new Error(message));
    };
    const onInput = () => {
      if (input.value === nextText) ownsInput = true;
      else fail("Conversion observation lost its input action");
    };
    const onPageHide = () => fail("Conversion observation lost its document");
    const observer = new MutationObserver((records) => {
      if (!ownsPanel()) {
        fail("Conversion observation lost its owned panel");
        return;
      }
      const busyRecords = records.filter(
        (record) =>
          record.target === panel && record.attributeName === "aria-busy",
      );
      for (let index = 0; index < busyRecords.length; index++) {
        const before = busyRecords[index].oldValue;
        const after =
          busyRecords[index + 1]?.oldValue ?? panel.getAttribute("aria-busy");
        // Reconstruct coalesced false -> true -> false writes even when the
        // callback sees only the final idle attribute.
        if (before === "false" && after === "true" && ownsInput) sawBusy = true;
        if (before === "true" && after === "false" && sawBusy) sawIdle = true;
      }
      if (!ownsInput || !sawBusy || !sawIdle) return;
      const state = panel
        .querySelector(".live-indicator")
        ?.getAttribute("data-state");
      if (panel.getAttribute("aria-busy") !== "false") return;
      if (state === "error") {
        fail("Observed ordinary conversion failed");
        return;
      }
      if (state !== "ready") return;
      finished = true;
      cleanup();
      resolve();
    });
    const ownershipObserver = new MutationObserver(() => {
      if (!ownsPanel()) fail("Conversion observation lost its owned panel");
    });
    input.addEventListener("input", onInput, true);
    window.addEventListener("pagehide", onPageHide);
    observer.observe(panel, {
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      childList: true,
      characterData: true,
    });
    ownershipObserver.observe(document.documentElement, {
      subtree: true,
      childList: true,
    });
    // Fill uses Playwright's inherited action/test timeout. Observation and the
    // existing exact assertions share their original post-fill assertion budget.
    return {
      wait(remaining: number) {
        if (timer !== undefined) clearTimeout(timer);
        if (!finished)
          timer = setTimeout(
            () =>
              fail("Conversion did not settle within the assertion deadline"),
            remaining,
          );
        return settled;
      },
      dispose() {
        fail("Conversion observation disposed");
      },
    };
  }, text);
  try {
    await input.fill(text);
    const deadline = performance.now() + timeout;
    await observation.evaluate(
      (owned, remaining) => owned.wait(remaining),
      timeout,
    );
    const remaining = () => {
      const available = deadline - performance.now();
      if (available <= 0)
        throw new Error("Conversion exhausted the original assertion deadline");
      return available;
    };
    await assertResult(remaining);
  } finally {
    await observation.evaluate((owned) => owned.dispose()).catch(() => {});
    await observation.dispose();
  }
}
