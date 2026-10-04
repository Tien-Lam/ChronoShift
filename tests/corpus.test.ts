import { expect, test } from "bun:test";
import corpus from "./fixtures/resilience-corpus.json";
import { convert } from "../web/src/engine/convert";
test("all resilience corpus inputs execute the browser engine without crashing", () => {
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
