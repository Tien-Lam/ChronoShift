import { readdir } from "node:fs/promises";
import { join } from "node:path";

const startedAt = new Date().toISOString();
const root = process.cwd();
const data = join(root, "docs/qa/ci-data-zones-2026-10-05");
const out = import.meta.dir;
const assertions: string[] = [];
const assert = (ok: boolean, message: string) => {
  if (!ok) throw Error(message);
  assertions.push(message);
};
const json = (path: string) => Bun.file(path).json();
const keys = (obj: object) => Object.keys(obj).sort();
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const mean = (rows: number[]) => rows.reduce((s, v) => s + v, 0) / rows.length;
const clocks = await json(join(data, "controls/clocks.json"));
const comparison = await json(join(data, "controls/comparison.json"));
const controlRows = [];
let expectedIds: string[] | undefined;
for (const clock of clocks) {
  const folder = join(data, "controls", clock.block);
  const report = await json(join(folder, "report.json"));
  const served = await json(join(folder, "served.json"));
  const log = await Bun.file(join(folder, "run.log")).text();
  const tests: any[] = [];
  function walk(suite: any, parents: string[]) {
    const titles = [...parents, suite.title].filter(Boolean);
    for (const spec of suite.specs ?? []) for (const test of spec.tests) tests.push({ spec, test, titles });
    for (const child of suite.suites ?? []) walk(child, titles);
  }
  report.suites.forEach((suite: any) => walk(suite, []));
  const ids = tests.map(({ spec, test, titles }) => [test.projectName, spec.file, ...titles, spec.title].join("|")).sort();
  assert(tests.length === 20 && new Set(ids).size === 20, `${clock.block}: exactly20 unique identities`);
  if (!expectedIds) expectedIds = ids;
  assert(same(ids, expectedIds), `${clock.block}: same complete identities`);
  assert(tests.every(({ test }) => test.results.length === 1 && test.results[0].status === "passed" && test.results[0].retry === 0), `${clock.block}: all structured first attempts pass`);
  assert(log.includes("20 passed") && !/\(retry #|\d+ failed|\d+ flaky/.test(log), `${clock.block}: full log agrees with structured attempts`);
  assert(report.errors.length === 0 && clock.exitCode === 0, `${clock.block}: clean runner errors/exit`);
  assert(!(await Bun.file(join(folder, "results/attempt-failures.json")).exists()), `${clock.block}: absent failed-attempt marker`);
  const beforeKeys = keys(clock.before);
  assert(beforeKeys.length === 14 && same(clock.before, clock.after), `${clock.block}:14 unchanged pre/post files`);
  assert(served.rows.length === 14 && same(served.rows.map((r: any) => r.path).sort(), beforeKeys), `${clock.block}: exhaustive distinct served set`);
  assert(served.rows.every((r: any) => r.status === 200 && r.servedHash === r.fileHash && r.fileHash === clock.before[r.path]), `${clock.block}: all HTTP hashes equal`);
  assert(Date.parse(clock.endedAt) >= Date.parse(clock.startedAt) && Number.isFinite(clock.elapsedMs) && clock.elapsedMs > 0, `${clock.block}: finite positive monotonic duration and UTC clock order`);
  const artifacts = await readdir(join(folder, "results"), { recursive: true });
  assert(!artifacts.some((p) => /trace\.zip|test-failed|error-context/.test(p)), `${clock.block}: no failure or retry attachments`);
  controlRows.push({ block: clock.block, variant: clock.variant, elapsedMs: clock.elapsedMs, reportDurationMs: report.stats.duration, artifacts: artifacts.length });
}
const matched = controlRows.slice(1);
assert(same(matched.map((r) => r.variant), ["baseline", "candidate", "candidate", "baseline"]), "Controls: predeclared matched ABBA excluding initial candidate");
const baseline = mean(matched.filter((r) => r.variant === "baseline").map((r) => r.elapsedMs));
const candidate = mean(matched.filter((r) => r.variant === "candidate").map((r) => r.elapsedMs));
assert(baseline === comparison.baselineMeanMs && candidate === comparison.candidateMeanMs, "Controls: independent arithmetic equals retained means");
const closed = await json(join(data, "closed-probe.json"));
const closedSummary = await json(join(data, "closed-comparison.json"));
assert(closed.rows.length === 36 && closed.phases.length === 4, "Closed:36 rows/four phases");
const tuples = new Set<string>();
const versions = new Map<string, string>();
for (const [p, phase] of closed.phases.entries()) {
  assert(phase.phase === p && phase.variant === ["baseline", "candidate", "candidate", "baseline"][p], `Closed phase${p}: explicit expected identity`);
  assert(keys(phase.before).length === 14 && same(phase.before, phase.after), `Closed phase${p}:14 unchanged files`);
  assert(same(phase.served.map((r: any) => r.path).sort(), keys(phase.before)), `Closed phase${p}: exhaustive distinct HTTP paths`);
  assert(phase.served.every((r: any) => r.status === 200 && r.fileHash === r.servedHash && r.fileHash === phase.before[r.path]), `Closed phase${p}: every hash reconciles`);
}
for (const row of closed.rows) {
  const phase = closed.phases[row.phase];
  const tuple = [row.phase, row.engine, row.sample].join("|");
  assert(!!phase && row.variant === phase.variant && ["chromium", "firefox", "webkit"].includes(row.engine) && Number.isInteger(row.sample) && row.sample >= 0 && row.sample <= 2 && !tuples.has(tuple), `Closed ${tuple}: exact unique membership`);
  tuples.add(tuple);
  assert(row.origin === phase.origin && !!phase.before[row.script.slice(1)], `Closed ${tuple}: origin/script inventory`);
  assert(Date.parse(row.startedAt) >= Date.parse(phase.startedAt) && Date.parse(row.endedAt) <= Date.parse(phase.endedAt) && Date.parse(row.endedAt) >= Date.parse(row.startedAt), `Closed ${tuple}: real clocks nested in phase`);
  assert(row.errors.length === 0 && row.edits.map((r: any) => r.day).join(",") === "9,10,11", `Closed ${tuple}: three exact edits/no page errors`);
  if (versions.has(row.engine)) assert(versions.get(row.engine) === row.browserVersion, `Closed ${tuple}: stable browser version`);
  versions.set(row.engine, row.browserVersion);
}
for (const group of closedSummary.groups) {
  const rows = closed.rows.filter((r: any) => r.engine === group.engine && r.variant === group.variant);
  assert(rows.length === 6 && mean(rows.map((r: any) => r.readyMs)) === group.readyMs.mean, `Closed ${group.engine}/${group.variant}: six contexts/exact ready mean`);
  if (group.engine === "chromium") for (const key of ["ScriptDuration", "TaskDuration", "LayoutDuration", "RecalcStyleDuration"]) {
    const values = rows.flatMap((r: any) => r.edits.map((edit: any) => edit.afterMetrics[key] - edit.beforeMetrics[key]));
    assert(values.length === 18 && values.every((v: number) => Number.isFinite(v) && v >= 0), `Closed ${group.variant}/${key}:18 finite nonnegative deltas`);
    assert(Math.abs(mean(values) - group.rendererCountersSeconds[key].changes.mean) < 1e-12, `Closed ${group.variant}/${key}: independently reconciled counter mean within floating-point summation tolerance`);
  }
}
const pair = await json(join(root, "docs/qa/ci-next-2026-10-05/delivery/paired-metrics.json"));
for (const name of ["baseline", "candidate"]) {
  const sample = pair[name];
  assert(sample.runnerSeconds === sample.runs.reduce((s: number, r: any) => s + r.jobs.reduce((j: number, k: any) => j + k.runnerSeconds, 0), 0), `${name}: runner seconds includes every job`);
  assert(sample.roundedRunnerMinutes === sample.runs.reduce((s: number, r: any) => s + r.jobs.reduce((j: number, k: any) => j + Math.ceil(k.runnerSeconds / 60), 0), 0), `${name}: rounded per job`);
  assert(Math.abs(sample.projectedArtifactByteHours - sample.runs.flatMap((r: any) => r.artifacts).reduce((s: number, a: any) => s + a.bytes * a.retentionHours, 0)) < 0.0001, `${name}: artifact projection recomputed`);
}
const percentSaved = (b: number, c: number) => (b-c)/b*100;
const metrics = { seconds: [pair.baseline.runnerSeconds, pair.candidate.runnerSeconds], rounded: [pair.baseline.roundedRunnerMinutes, pair.candidate.roundedRunnerMinutes], roundedReduction: percentSaved(pair.baseline.roundedRunnerMinutes, pair.candidate.roundedRunnerMinutes), artifactProjectionReduction: percentSaved(pair.baseline.projectedArtifactByteHours, pair.candidate.projectedArtifactByteHours) };
assert(metrics.roundedReduction === 12.5 && metrics.artifactProjectionReduction >= 63.055 && metrics.artifactProjectionReduction < 63.065, "Pair:12.5% rounded proxy/63.06% rounded artifact projection");
const files = ["web/src/components/Choices.tsx", "e2e/controls.spec.ts", "docs/developer/ci-efficiency.md", "docs/qa/ci-data-zones-2026-10-05/restoration.json", "docs/qa/ci-data-zones-2026-10-05/analyze-controls.ts", "docs/qa/ci-data-zones-2026-10-05/analyze-closed.ts", "docs/qa/ci-data-zones-2026-10-05/closed-probe.json", "docs/qa/ci-data-zones-2026-10-05/closed-comparison.json", "docs/qa/ci-data-zones-2026-10-05/controls/clocks.json", "docs/qa/ci-data-zones-2026-10-05/controls/comparison.json", "docs/qa/ci-next-2026-10-05/delivery/paired-metrics.json"];
const hashes = Object.fromEntries(await Promise.all(files.map(async (p) => [p, new Bun.CryptoHasher("sha256").update(await Bun.file(join(root,p)).arrayBuffer()).digest("hex")])));
const result = { startedAt, endedAt: new Date().toISOString(), environment: { bun: Bun.version, platform: process.platform, arch: process.arch }, assertions, controlRows, controlMean: { baseline, candidate, percentSaved: percentSaved(baseline,candidate) }, closedClockWindow: [closed.startedAt, closed.endedAt], browserVersions: Object.fromEntries(versions), metrics, hashes, limits: ["Readback only; no new browser/CI/network run", "Raw attachment headers reconciled; no visual acceptance inspected", "Main-origin hashes complete; dedicated fixture requests not all hashed", "This readback supports bounded observations and declared successful pair proxies, not Linux candidate/full-suite or monthly invoice savings"] };
await Bun.write(join(out, "readback.json"), JSON.stringify(result, null, 2));
console.log(JSON.stringify({ assertions: assertions.length, controlMean: result.controlMean, metrics, startedAt, endedAt: result.endedAt }));
