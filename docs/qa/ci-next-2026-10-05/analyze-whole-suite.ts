import { resolve, join } from "node:path";
const root = resolve(import.meta.dir, "whole-suite");
const clocks = await Bun.file(join(root, "clocks.json")).json();
const runs: any[] = [];
let reference: string[] | undefined;
for (const clock of clocks) {
  const report = await Bun.file(join(root, clock.block, "report.json")).json();
  const cases: any[] = [];
  const walk = (suite: any, parents: string[]) => {
    const titles = [...parents, suite.title].filter(Boolean);
    for (const spec of suite.specs || []) for (const test of spec.tests) {
      if (test.results.length !== 1 || test.results[0].retry !== 0 || !["passed", "skipped"].includes(test.results[0].status)) throw Error("Unexpected attempt");
      cases.push({ identity: [test.projectName, spec.file, ...titles, spec.title].join("|"), status: test.results[0].status, durationMs: test.results[0].duration });
    }
    for (const child of suite.suites || []) walk(child, titles);
  };
  for (const suite of report.suites) walk(suite, []);
  if (cases.length !== 273 || cases.filter((c) => c.status === "passed").length !== 264 || cases.filter((c) => c.status === "skipped").length !== 9 || report.errors.length || clock.exitCode !== 0) throw Error("Incomplete full block");
  const identity = cases.map((c) => `${c.identity}|${c.status}`).sort();
  if (reference && JSON.stringify(identity) !== JSON.stringify(reference)) throw Error("Case/skip identity mismatch");
  reference = identity;
  if (await Bun.file(join(root, clock.block, "results/attempt-failures.json")).exists()) throw Error("Unexpected failure marker");
  runs.push({ ...clock, reportDurationMs: report.stats.duration, cases, firstPasses: 264, skips: 9, failures: 0, retries: 0 });
}
if (runs.length !== 4) throw Error("Missing ABBA blocks");
const mean = (v: string) => { const rows = runs.filter((r) => r.variant === v); return rows.reduce((a, b) => a + b.elapsedMs, 0) / rows.length; };
const baseline = mean("baseline"), candidate = mean("candidate");
const summary = { analyzedAt: new Date().toISOString(), scope: "Local Darwin ARM64 full273-case ABBA with fourworkers/CIviewports/normalmotion, list+HTML+attempt+JSON reporters, retries0. Not Linux publishing-pair/CIgoal evidence. Native sample's App/Choices source scopes preserved; workflow-only sparse changes during comparison do not affect these served builds.", baselineMeanMs: baseline, candidateMeanMs: candidate, meanSavedMs: baseline - candidate, percentSaved: (baseline - candidate) / baseline * 100, allIdentitiesAndSkipsEqual: true, runs };
await Bun.write(join(root, "reconciliation.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ baselineMeanMs: baseline, candidateMeanMs: candidate, meanSavedMs: baseline - candidate, percentSaved: summary.percentSaved, blocks: runs.map((r) => ({ block: r.block, firstPasses: r.firstPasses, skips: r.skips, failures: r.failures, retries: r.retries, elapsedMs: r.elapsedMs })), allIdentitiesAndSkipsEqual: true }));
