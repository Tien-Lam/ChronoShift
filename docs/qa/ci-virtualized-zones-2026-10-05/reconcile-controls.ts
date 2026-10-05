import { join } from "node:path";
const output = join(import.meta.dir, "controls");
const started = new Date().toISOString();
const clocks = await Bun.file(join(output, "clocks.json")).json();
const summaries = [];
for (const clock of clocks) {
  const report = await Bun.file(
    join(output, clock.block, "report.json"),
  ).json();
  const served = await Bun.file(
    join(output, clock.block, "served.json"),
  ).json();
  const cases: any[] = [];
  const visit = (suite: any) => {
    for (const spec of suite.specs || [])
      for (const test of spec.tests || [])
        cases.push({
          file: spec.file,
          title: spec.title,
          project: test.projectName,
          expectedStatus: test.expectedStatus,
          attempts: test.results.map((r: any) => ({
            status: r.status,
            retry: r.retry,
            duration: r.duration,
            errors: r.errors,
          })),
        });
    for (const child of suite.suites || []) visit(child);
  };
  for (const suite of report.suites) visit(suite);
  const identities = cases
    .map((c) => `${c.file}:${c.title}:${c.project}`)
    .sort();
  summaries.push({
    block: clock.block,
    exitCode: clock.exitCode,
    startedAt: clock.startedAt,
    endedAt: clock.endedAt,
    elapsedMs: clock.elapsedMs,
    cases: cases.length,
    uniqueIdentities: new Set(identities).size,
    identities,
    attemptCounts: Object.fromEntries(
      ["passed", "failed", "skipped", "timedOut", "interrupted"].map(
        (status) => [
          status,
          cases.flatMap((c) => c.attempts).filter((a) => a.status === status)
            .length,
        ],
      ),
    ),
    retries: cases.flatMap((c) => c.attempts).filter((a) => a.retry > 0).length,
    failures: cases.filter((c) =>
      c.attempts.some((a: any) => a.status !== "passed"),
    ),
    globalErrors: report.errors,
    frozenInventoryUnchanged:
      JSON.stringify(clock.before) === JSON.stringify(clock.after),
    servedFiles: served.rows.length,
    allServedHashesMatch: served.rows.every(
      (r: any) => r.status === 200 && r.fileHash === r.servedHash,
    ),
  });
}
const result = {
  started,
  ended: new Date().toISOString(),
  summaries,
  sameCompleteIdentities:
    summaries.length === 2 &&
    JSON.stringify(summaries[0].identities) ===
      JSON.stringify(summaries[1].identities),
  performanceComparisonValid: false,
  reason:
    "Both unchanged full controls sweeps have an original failed Firefox source-field opening assertion; candidate block was independent correctness only, not a successful comparison.",
};
await Bun.write(
  join(import.meta.dir, "controls-summary.json"),
  JSON.stringify(result, null, 2),
);
console.log(
  JSON.stringify({
    ...result,
    summaries: summaries.map(({ identities, failures, ...rest }) => ({
      ...rest,
      failures: failures.map(({ title, project }) => ({ title, project })),
    })),
  }),
);
