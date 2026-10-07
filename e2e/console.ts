import type { Page } from "@playwright/test";

// Console argument handles belong to the emitting document and can disappear
// on reload. Reserve a stable event slot before asynchronously reading them.
export function consoleDiagnostics(page: Pick<Page, "on">) {
  const records: string[] = [];
  const pending = new Set<Promise<void>>();
  const failures: unknown[] = [];
  page.on("console", (message) => {
    const text = message.text();
    if (!text.startsWith("[Time to Local]")) return;
    const index = records.push(text) - 1;
    const capture = (async () => {
      try {
        records[index] = JSON.stringify(
          await Promise.all(message.args().map((arg) => arg.jsonValue())),
        );
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !error.message.includes("Execution context was destroyed")
        )
          failures.push(error);
        else records[index] = `${text} [payload unavailable: navigation]`;
        // Navigation lost the payload: retain the event, without inventing
        // metadata or claiming the details were captured.
      }
    })();
    pending.add(capture);
    void capture.then(() => pending.delete(capture));
  });
  return Object.assign(records, {
    async flush() {
      while (pending.size) await Promise.all(pending);
      if (failures.length)
        throw new AggregateError(failures, "Console capture failed");
    },
  });
}
