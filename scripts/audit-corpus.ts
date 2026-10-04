import corpus from "../tests/fixtures/resilience-corpus.json";
import { convert } from "../web/src/engine/convert";
import { Temporal } from "@js-temporal/polyfill";
const reference = {
  now: "2026-04-06T12:00:00Z",
  sourceZone: "UTC",
  targetZone: "Australia/Sydney",
  dateOrder: "mdy" as const,
};
const rows = corpus.cases.map((c) => {
  try {
    const output = convert(c.input, reference);
    const local = output.results.flatMap((r) =>
      r.instant
        ? [Temporal.Instant.from(r.instant).toZonedDateTimeISO(r.sourceZone)]
        : [],
    );
    const missing = c.expected.filter(
      (e) => !local.some((t) => t.hour === e.hour && t.minute === e.minute),
    );
    return {
      id: c.id,
      input: c.input,
      legacyExpectedCount: c.legacyExpectedCount,
      actualCount: output.results.length,
      missingLocalTimes: missing,
      warnings: output.warnings,
      dates: output.results.flatMap((r) => (r.dateOnly ? [r.dateOnly] : [])),
    };
  } catch (error) {
    return { id: c.id, input: c.input, error: String(error) };
  }
});
const differences = rows.filter(
  (r) =>
    "error" in r ||
    r.actualCount !== r.legacyExpectedCount ||
    r.missingLocalTimes?.length ||
    r.warnings?.length,
);
const errors = rows.filter((r) => "error" in r);
await Bun.write(
  "docs/planning/corpus-audit.json",
  JSON.stringify(
    {
      reference,
      total: rows.length,
      crashes: errors.length,
      legacyCountDifferences: rows.filter(
        (r) => "actualCount" in r && r.actualCount !== r.legacyExpectedCount,
      ).length,
      note: "This inventories actual browser engine output. Count matches and local clock matches are not exact date/zone accuracy evidence. Reviewed exact fixtures are in tests/fixtures/temporal.json. Differences include intentional ambiguity, deduplication and date-only changes as well as parser gaps.",
      differences,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `${rows.length} real inputs exercised; ${errors.length} crashes; ${differences.length} cases need review of legacy expectations or parser gaps.`,
);
if (errors.length) process.exitCode = 1;
