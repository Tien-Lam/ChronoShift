import { join } from "node:path";
const report = await Bun.file(
  join(import.meta.dir, "closed-probe.json"),
).json();
if (
  report.rows.length !== 36 ||
  report.phases.length !== 4 ||
  report.phases.map((row: any) => row.variant).join(",") !==
    "baseline,candidate,candidate,baseline"
)
  throw Error("Incomplete ABBA");
const identities = new Set();
const variants = ["baseline", "candidate", "candidate", "baseline"];
const engines = ["chromium", "firefox", "webkit"];
const versions = new Map<string, string>();
for (const row of report.rows) {
  const identity = [row.phase, row.variant, row.engine, row.sample].join("|");
  const phase = report.phases[row.phase];
  if (
    identities.has(identity) ||
    !Number.isInteger(row.phase) ||
    row.phase < 0 ||
    row.phase > 3 ||
    row.variant !== variants[row.phase] ||
    !engines.includes(row.engine) ||
    !Number.isInteger(row.sample) ||
    row.sample < 0 ||
    row.sample > 2 ||
    !phase ||
    phase.phase !== row.phase ||
    row.origin !== phase.origin ||
    typeof row.script !== "string" ||
    !phase.before[row.script.slice(1)] ||
    !Number.isFinite(Date.parse(row.startedAt)) ||
    !Number.isFinite(Date.parse(row.endedAt)) ||
    Date.parse(row.startedAt) < Date.parse(phase.startedAt) ||
    Date.parse(row.endedAt) > Date.parse(phase.endedAt) ||
    Date.parse(row.endedAt) < Date.parse(row.startedAt) ||
    row.errors.length ||
    row.edits.length !== 3 ||
    row.edits.map((edit: any) => edit.day).join(",") !== "9,10,11"
  )
    throw Error("Invalid observation identity");
  if (
    versions.has(row.engine) &&
    versions.get(row.engine) !== row.browserVersion
  )
    throw Error("Browser version changed between samples");
  versions.set(row.engine, row.browserVersion);
  identities.add(identity);
}
for (const [index, phase] of report.phases.entries()) {
  if (
    phase.phase !== index ||
    phase.variant !== variants[index] ||
    Object.keys(phase.before).length !== 14 ||
    new Set(phase.served.map((row: any) => row.path)).size !== 14 ||
    JSON.stringify(phase.before) !== JSON.stringify(phase.after) ||
    phase.served.length !== 14 ||
    phase.served.some(
      (row: any) =>
        row.status !== 200 ||
        row.fileHash !== row.servedHash ||
        row.fileHash !== phase.before[row.path],
    )
  )
    throw Error("Artifact identity mismatch");
}
const stats = (values: number[]) => {
  if (
    !values.length ||
    values.some((value) => !Number.isFinite(value) || value < 0)
  )
    throw Error("Invalid elapsed observations");
  const sorted = [...values].sort((a, b) => a - b);
  return {
    count: sorted.length,
    mean: sorted.reduce((sum, value) => sum + value, 0) / sorted.length,
    median: (sorted[(sorted.length - 1) >> 1] + sorted[sorted.length >> 1]) / 2,
    min: sorted[0],
    max: sorted.at(-1),
  };
};
const groups: any[] = [];
for (const engine of ["chromium", "firefox", "webkit"])
  for (const variant of ["baseline", "candidate"]) {
    const rows = report.rows.filter(
      (row: any) => row.engine === engine && row.variant === variant,
    );
    if (rows.length !== 6) throw Error("Missing engine/variant samples");
    const group: any = {
      engine,
      variant,
      readyMs: stats(rows.map((row: any) => row.readyMs)),
      firstEditMs: stats(rows.map((row: any) => row.edits[0].elapsedMs)),
      laterEditMs: stats(
        rows.flatMap((row: any) =>
          row.edits.slice(1).map((edit: any) => edit.elapsedMs),
        ),
      ),
    };
    if (engine === "chromium") {
      group.rendererCountersSeconds = {};
      for (const key of [
        "ScriptDuration",
        "TaskDuration",
        "LayoutDuration",
        "RecalcStyleDuration",
      ]) {
        const changes = rows.flatMap((row: any) =>
          row.edits.map(
            (edit: any) => edit.afterMetrics[key] - edit.beforeMetrics[key],
          ),
        );
        group.rendererCountersSeconds[key] = changes.some(
          (value: number) => !Number.isFinite(value) || value < 0,
        )
          ? {
              valid: false,
              rawChanges: changes,
              reason:
                "Nonfinite or decreasing cumulative counter; no time-weighted conclusion",
            }
          : { valid: true, changes: stats(changes) };
      }
    }
    groups.push(group);
  }
const result = {
  analyzedAt: new Date().toISOString(),
  scope: report.scope,
  matched36UniqueObservations: true,
  groups,
  gaps: [
    "Six fresh contexts per variant/engine is bounded exploration, not a robust p95",
    "Locator elapsed includes poll/automation/debounce and cannot isolate collection work",
    "Counters cover Chromium renderer only; no initialization counter subtraction or whole-system extrapolation",
    "No Linux, whole-suite or successful publication-pair savings established",
  ],
};
await Bun.write(
  join(import.meta.dir, "closed-comparison.json"),
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result));
