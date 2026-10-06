import { describe, expect, test } from "bun:test";
import { convert, MAX_INPUT } from "../web/src/engine/convert";
import { copyText, formatResult } from "../web/src/engine/time";
import { offsetZone, resolveCity } from "../web/src/engine/zones";
import fixtures from "./fixtures/temporal.json";
import type { ConversionOptions } from "../web/src/engine/types";
const options: ConversionOptions = {
  now: "2026-04-06T12:00:00Z",
  sourceZone: "UTC",
  targetZone: "Australia/Sydney",
  locale: "en-AU",
  hourCycle: "24",
  dateOrder: "mdy",
};
describe("independently specified temporal fixtures", () => {
  for (const f of fixtures)
    test(f.name, () => {
      const result = convert(f.text, {
        ...options,
        ...f,
        dateOrder: ("dateOrder" in f ? f.dateOrder : options.dateOrder) as
          "mdy" | "dmy",
      });
      expect(
        result.results.flatMap((r) => (r.instant ? [r.instant] : [])),
      ).toEqual(f.instants);
      expect(
        result.results.flatMap((r) => (r.dateOnly ? [r.dateOnly] : [])),
      ).toEqual(("dates" in f ? f.dates : []) || []);
      if ("warning" in f)
        expect(result.warnings.join("\n")).toContain(f.warning!);
      else expect(result.warnings).toEqual([]);
      if ("assumption" in f)
        expect(
          result.results.flatMap((r) => r.assumptions).join("\n"),
        ).toContain(f.assumption!);
      if ("occurrences" in f)
        expect(result.results[0].occurrences).toBe(f.occurrences!);
    });
});
test("formatting rolls into next day and copy includes full context", () => {
  const result = convert("April 9, 2026 3pm EST", options).results[0];
  const display = formatResult(result, options);
  expect(display.time).toBe("06:00");
  expect(display.date).toContain("10 Apr 2026");
  expect(display.dateShift).toBe(1);
  expect(copyText(result, options)).toContain("UTC+10:00");
  expect(copyText(result, options)).toContain("EST");
});
test("negative fractional offset never invents a location", () => {
  expect(offsetZone(-210)).toBe("-03:30");
  const result = convert("April 9, 2026 3pm UTC-03:30", options).results[0];
  expect(result.sourceLabel).toBe("UTC-03:30");
  expect(formatResult(result, { ...options, targetZone: "-03:30" }).zone).toBe(
    "UTC-03:30",
  );
});
test("short fuzzy city and unknown guesses are rejected", () => {
  expect(resolveCity("Tok")).toEqual({ zones: [] });
  expect(resolveCity("Atlantis")).toEqual({ zones: [] });
});
test("valid input at limit converts; arbitrary numbers and milliseconds stay unparsed", () => {
  const text = "April 9, 2026 3pm UTC";
  expect(
    convert(text + " ".repeat(MAX_INPUT - text.length), options).results[0]
      .instant,
  ).toBe("2026-04-09T15:00:00Z");
  for (const text of [
    "1775736000000",
    "1200000000",
    "2082758400",
    "Room 1500",
    "$15.00",
  ])
    expect(convert(text, options).results.filter((r) => r.instant)).toEqual([]);
});
test("range keeps textual identities and both endpoints", () => {
  const results = convert("April 9, 2026 11pm-1am UTC", options).results;
  expect(results.map((r) => r.endpoint)).toEqual(["start", "end"]);
  expect(results.map((r) => r.sourceIndex)).toEqual([0, 0]);
  expect(results.map((r) => r.original)).toEqual([
    "April 9, 2026 11pm-1am UTC",
    "April 9, 2026 11pm-1am UTC",
  ]);
});
test("input limit and invalid target give actionable errors", () => {
  expect(() => convert("x".repeat(MAX_INPUT + 1), options)).toThrow("10,000");
  expect(() =>
    convert("3pm UTC", { ...options, targetZone: "Atlantis" }),
  ).toThrow("valid timezone");
});
test("reference date override leaves source zone independent of target", () => {
  const result = convert("Tomorrow at 9am UTC", {
    ...options,
    referenceDate: "2026-07-01",
    targetZone: "Asia/Tokyo",
  });
  expect(result.results[0].instant).toBe("2026-07-02T09:00:00Z");
});
test("reference assumptions describe incomplete dates without claiming fully specified dates used the reference", () => {
  const fixed = { ...options, referenceDate: "2026-04-09" };
  for (const text of ["July 15, 2026 at 3pm UTC", "July 15, 2026"])
    expect(convert(text, fixed).results[0].assumptions).toEqual([]);
  expect(convert("July 15 at 3pm UTC", fixed).results[0].assumptions).toEqual([
    "Year assumed: 2026",
    "Reference date used: 2026-04-09",
  ]);
  expect(
    convert("April 9, 2026\nMeet at 3pm UTC", fixed).results[0].assumptions,
  ).toEqual(["Date from message context: 2026-04-09"]);
});
