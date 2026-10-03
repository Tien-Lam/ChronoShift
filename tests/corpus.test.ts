import { expect, test } from "bun:test";
import corpus from "./fixtures/android-corpus.json";
import { convert } from "../web/src/engine/convert";
test("all imported Android inputs execute the real browser engine without crashing", () => {
  expect(corpus.cases.length).toBeGreaterThanOrEqual(300);
  for (const fixture of corpus.cases)
    expect(() =>
      convert(fixture.input, {
        now: "2026-04-06T12:00:00Z",
        sourceZone: "UTC",
        targetZone: "Australia/Sydney",
      }),
    ).not.toThrow();
});
