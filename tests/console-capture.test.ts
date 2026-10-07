import { expect, test } from "bun:test";
import type { ConsoleMessage, Page } from "@playwright/test";
import { consoleDiagnostics } from "../e2e/console";

function fixture() {
  let emit!: (message: ConsoleMessage) => void;
  const records = consoleDiagnostics({
    on(_event: "console", listener: (message: ConsoleMessage) => void) {
      emit = listener;
    },
  } as Page);
  return {
    records,
    emit: (text: string, value: Promise<unknown>) =>
      emit({
        text: () => text,
        args: () => [{ jsonValue: () => value }],
      } as ConsoleMessage),
  };
}

test("navigation-lost console payload retains a stable event and flush waits for full metadata", async () => {
  const { records, emit } = fixture();
  let complete!: (value: unknown) => void;
  emit(
    "[Time to Local] conversion.complete",
    new Promise((resolve) => {
      complete = resolve;
    }),
  );
  emit(
    "[Time to Local] offline.register-attempt",
    Promise.reject(
      new Error(
        "jsonValue: Execution context was destroyed, most likely because of a navigation",
      ),
    ),
  );
  expect([...records]).toEqual([
    "[Time to Local] conversion.complete",
    "[Time to Local] offline.register-attempt",
  ]);
  let flushed = false;
  const flush = records.flush().then(() => {
    flushed = true;
  });
  await Promise.resolve();
  expect(flushed).toBe(false);
  complete({ results: 1, privateSentinel: "captured" });
  await flush;
  expect(records.length).toBe(2);
  expect(records[0]).toContain("privateSentinel");
  expect(records[1]).toBe(
    "[Time to Local] offline.register-attempt [payload unavailable: navigation]",
  );
});

test("unexpected capture failure is surfaced by flush instead of being swallowed", async () => {
  const { records, emit } = fixture();
  const error = new Error("Unexpected serialization failure");
  emit("[Time to Local] conversion.complete", Promise.reject(error));
  try {
    await records.flush();
    throw new Error("Expected failure");
  } catch (result) {
    expect(result).toBeInstanceOf(AggregateError);
    expect((result as AggregateError).errors).toEqual([error]);
  }
});
