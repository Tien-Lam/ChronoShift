import { createHash } from "node:crypto";
import { convert } from "../../web/src/engine/convert";
import type { TimeResult } from "../../web/src/engine/types";

const base = import.meta.dir;
const bytes = await Bun.file(base + "/holdout.json").bytes();
const holdout = JSON.parse(new TextDecoder().decode(bytes));
const inference = await Bun.file(base + "/inference.json").json();
const digest = createHash("sha256").update(bytes).digest("hex");
if (digest !== inference.holdoutSha256)
  throw new Error("Holdout changed after model inference");
const predictionByName = new Map<string, any>(
  inference.predictions.map((p: any) => [p.name, p]),
);
const numberWords: Record<string, number> = Object.fromEntries(
  [
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
  ].map((w, i) => [w, i + 1]),
);

function normalizations(text: string) {
  const edits: {
    start: number;
    end: number;
    replacement: string;
    rule: string;
  }[] = [];
  for (const m of text.matchAll(
    /\bhalf\s+past\s+(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|\d{1,2})\s*(am|pm)\b/gi,
  )) {
    const hour = numberWords[m[1].toLowerCase()] || Number(m[1]);
    if (hour < 1 || hour > 12) continue;
    edits.push({
      start: m.index,
      end: m.index + m[0].length,
      replacement: hour + ":30" + m[2].toLowerCase(),
      rule: "explicit AM/PM half-past clock",
    });
  }
  for (const m of text.matchAll(/\bquarter\s+to\s+noon\b/gi))
    edits.push({
      start: m.index,
      end: m.index + m[0].length,
      replacement: "11:45am",
      rule: "quarter before noon",
    });
  return edits.sort((a, b) => a.start - b.start);
}

function apply(text: string, edits: ReturnType<typeof normalizations>) {
  let normalized = "",
    previous = 0;
  const mapping: {
    originalStart: number;
    originalEnd: number;
    start: number;
    end: number;
  }[] = [];
  for (const e of edits) {
    normalized += text.slice(previous, e.start);
    const start = normalized.length;
    normalized += e.replacement;
    mapping.push({
      originalStart: e.start,
      originalEnd: e.end,
      start,
      end: normalized.length,
    });
    previous = e.end;
  }
  normalized += text.slice(previous);
  function originalIndex(index: number) {
    let delta = 0;
    for (const m of mapping) {
      if (index < m.start) break;
      if (index < m.end) return m.originalStart;
      delta += m.originalEnd - m.originalStart - (m.end - m.start);
    }
    return index + delta;
  }
  return { normalized, originalIndex };
}

function run(
  text: string,
  fixture: any,
  edits: ReturnType<typeof normalizations>,
) {
  const { normalized, originalIndex } = apply(text, edits);
  const output = convert(normalized, {
    now: fixture.now,
    sourceZone: holdout.sourceZone,
    targetZone: holdout.targetZone,
  });
  return {
    results: output.results.map((r: TimeResult) => ({
      instant: r.instant || null,
      dateOnly: r.dateOnly || null,
      sourceZone: r.sourceZone,
      interpretation: r.interpretation || null,
      endpoint: r.endpoint || null,
      sourceIndex: originalIndex(r.sourceIndex),
      original: text.slice(
        originalIndex(r.sourceIndex),
        originalIndex(r.sourceIndex + r.original.length),
      ),
    })),
    warnings: output.warnings,
    clockRewrites: edits,
  };
}
const same = (a: unknown, b: unknown) =>
  JSON.stringify(a) === JSON.stringify(b);
function score(actual: ReturnType<typeof run>, fixture: any) {
  const instants = actual.results.flatMap((r) =>
    r.instant ? [r.instant] : [],
  );
  const dates = actual.results.flatMap((r) => (r.dateOnly ? [r.dateOnly] : []));
  const endpoints = actual.results.map((r) => r.endpoint);
  const errors = instants.filter((i) => !fixture.instants.includes(i));
  return {
    exact:
      same(instants, fixture.instants) &&
      same(dates, fixture.dates) &&
      (!fixture.endpoints || same(endpoints, fixture.endpoints)) &&
      (!fixture.warning ||
        actual.warnings.some((w) => w.includes(fixture.warning))),
    instantOrderMatches: same(instants, fixture.instants),
    dateOnlyMatches: same(dates, fixture.dates),
    endpointsMatch: fixture.endpoints
      ? same(endpoints, fixture.endpoints)
      : null,
    warningMatches: fixture.warning
      ? actual.warnings.some((w) => w.includes(fixture.warning))
      : null,
    unexpectedInstants: errors,
    missingInstants: fixture.instants.filter(
      (i: string) => !instants.includes(i),
    ),
  };
}
let trueSpans = 0,
  predictedSpans = 0,
  goldSpans = 0;
const cases = holdout.cases.map((f: any) => {
  const prediction = predictionByName.get(f.name);
  if (!prediction) throw new Error("Missing real prediction: " + f.name);
  const spans = prediction.entities;
  for (const e of spans) {
    if (
      !Number.isInteger(e.start) ||
      !Number.isInteger(e.end) ||
      f.text.slice(e.start, e.end) !== e.text ||
      !holdout.labels.includes(e.label)
    )
      throw new Error("Invalid model span: " + f.name);
  }
  const key = (e: any) => e.start + ":" + e.end + ":" + e.label;
  const gold = new Set<string>(f.spans.map(key)),
    detected = new Set<string>(spans.map(key));
  goldSpans += gold.size;
  predictedSpans += detected.size;
  trueSpans += [...detected].filter((k) => gold.has(k)).length;
  const edits = normalizations(f.text);
  const gated = edits.filter((e) =>
    spans.some(
      (s: any) => s.label === "time" && s.start <= e.start && s.end >= e.end,
    ),
  );
  const baseline = run(f.text, f, []);
  const control = run(f.text, f, edits);
  const hybrid = run(f.text, f, gated);
  return {
    name: f.name,
    family: f.family,
    text: f.text,
    gold: {
      instants: f.instants,
      dates: f.dates,
      endpoints: f.endpoints || null,
      warning: f.warning || null,
      spans: f.spans,
    },
    realModelSpans: spans,
    nativeInferenceMs: prediction.nativeInferenceMs,
    baseline: { ...baseline, score: score(baseline, f) },
    deterministicControl: { ...control, score: score(control, f) },
    mlGatedHybrid: { ...hybrid, score: score(hybrid, f) },
  };
});
const summary = (group: typeof cases) =>
  Object.fromEntries(
    ["baseline", "deterministicControl", "mlGatedHybrid"].map((method) => {
      const rows = group.map((c: any) => c[method]);
      return [
        method,
        {
          messages: rows.length,
          exactMessages: rows.filter((r) => r.score.exact).length,
          unexpectedInstantCount: rows.reduce(
            (n, r) => n + r.score.unexpectedInstants.length,
            0,
          ),
          missingInstantCount: rows.reduce(
            (n, r) => n + r.score.missingInstants.length,
            0,
          ),
        },
      ];
    }),
  );
const report = {
  measuredAt: new Date().toISOString(),
  holdoutSha256: digest,
  engineRevision: Bun.spawnSync(["git", "rev-parse", "HEAD"])
    .stdout.toString()
    .trim(),
  method:
    "Production full-text deterministic conversion versus the same converter with two generic explicit spoken-clock normalization rules, versus those identical rules gated by real frozen-threshold native GLiNER TIME spans. Baseline full text remains available; no candidate is shipped. Rule scope was motivated by desired-extension gold, so control/hybrid results are exploratory and not an independent normalizer accuracy estimate. No training or model threshold tuning. Ordered instants/date-only/range endpoints and warning obligations are checked exactly; original indices are mapped across rewrites.",
  spanMetrics: {
    gold: goldSpans,
    predicted: predictedSpans,
    truePositive: trueSpans,
    precision: trueSpans / predictedSpans,
    recall: trueSpans / goldSpans,
    f1: (2 * trueSpans) / (predictedSpans + goldSpans),
  },
  launchStyle: summary(cases.filter((c: any) => c.family !== "spoken")),
  desiredSpokenExtension: summary(
    cases.filter((c: any) => c.family === "spoken"),
  ),
  cases,
};
await Bun.write(
  base + "/comparison.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      spanMetrics: report.spanMetrics,
      launchStyle: report.launchStyle,
      desiredSpokenExtension: report.desiredSpokenExtension,
      failures: cases
        .filter((c: any) => !c.baseline.score.exact)
        .map((c: any) => ({ name: c.name, baseline: c.baseline })),
    },
    null,
    2,
  ),
);
