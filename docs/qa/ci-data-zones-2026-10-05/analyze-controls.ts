import { join } from "node:path";

const output = join(import.meta.dir, "controls");
const clocks = await Bun.file(join(output, "clocks.json")).json();
const runs: any[] = [];
let reference: string[] | undefined;
for (const clock of clocks.filter(
  (row: any) => Number(row.block.split("-")[0]) >= 2,
)) {
  const folder = join(output, clock.block);
  const report = await Bun.file(join(folder, "report.json")).json();
  const served = await Bun.file(join(folder, "served.json")).json();
  const cases: any[] = [];
  function walk(suite: any, parents: string[]) {
    const titles = [...parents, suite.title].filter(Boolean);
    for (const spec of suite.specs || [])
      for (const test of spec.tests) {
        if (
          test.results.length !== 1 ||
          test.results[0].retry !== 0 ||
          test.results[0].status !== "passed"
        )
          throw Error(`Non-passing first attempt in ${clock.block}`);
        cases.push({
          identity: [test.projectName, spec.file, ...titles, spec.title].join(
            "|",
          ),
          durationMs: test.results[0].duration,
        });
      }
    for (const child of suite.suites || []) walk(child, titles);
  }
  for (const suite of report.suites) walk(suite, []);
  if (
    cases.length !== 20 ||
    new Set(cases.map((row) => row.identity)).size !== 20 ||
    report.errors.length ||
    clock.exitCode !== 0
  )
    throw Error(`Incomplete block ${clock.block}`);
  if (
    JSON.stringify(clock.before) !== JSON.stringify(clock.after) ||
    served.rows.length !== 14 ||
    served.rows.some(
      (row: any) =>
        row.status !== 200 ||
        row.fileHash !== row.servedHash ||
        row.fileHash !== clock.before[row.path],
    )
  )
    throw Error(`Artifact identity mismatch in ${clock.block}`);
  if (await Bun.file(join(folder, "results/attempt-failures.json")).exists())
    throw Error(`Unexpected failure marker in ${clock.block}`);
  const identities = cases.map((row) => row.identity).sort();
  if (reference && JSON.stringify(reference) !== JSON.stringify(identities))
    throw Error("Case identity mismatch");
  reference = identities;
  runs.push({ ...clock, reportDurationMs: report.stats.duration, cases });
}
if (
  runs.length !== 4 ||
  runs.map((row) => row.variant).join(",") !==
    "baseline,candidate,candidate,baseline"
)
  throw Error("Missing matched ABBA blocks");
const mean = (variant: string, field: string) => {
  const rows = runs.filter((row) => row.variant === variant);
  return rows.reduce((sum, row) => sum + row[field], 0) / rows.length;
};
const baselineMeanMs = mean("baseline", "elapsedMs"),
  candidateMeanMs = mean("candidate", "elapsedMs");
const result = {
  analyzedAt: new Date().toISOString(),
  scope:
    "Local macOS ARM64 control-suite ABBA, 20 cases/five profiles, four workers, CI geometry/1x mobile pixels, normal motion, retries zero. Root pre/post inventories and all 14 main-origin HTTP assets match. Dedicated fixture requests are not all individually hashed. Initial candidate block excluded by predeclared plan. No Linux, whole-suite or publishing-pair saving established.",
  baselineMeanMs,
  candidateMeanMs,
  savedMs: baselineMeanMs - candidateMeanMs,
  percentSaved: ((baselineMeanMs - candidateMeanMs) / baselineMeanMs) * 100,
  baselineReportMeanMs: mean("baseline", "reportDurationMs"),
  candidateReportMeanMs: mean("candidate", "reportDurationMs"),
  allIdentitiesEqual: true,
  runs,
};
await Bun.write(
  join(output, "comparison.json"),
  JSON.stringify(result, null, 2),
);
console.log(
  JSON.stringify({
    baselineMeanMs,
    candidateMeanMs,
    savedMs: result.savedMs,
    percentSaved: result.percentSaved,
    allIdentitiesEqual: true,
  }),
);
