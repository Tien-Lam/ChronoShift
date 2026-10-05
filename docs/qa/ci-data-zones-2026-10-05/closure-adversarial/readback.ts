import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dir, "..");
const read = (p: string) => JSON.parse(readFileSync(join(root, p), "utf8"));
const check = (ok: boolean, message: string) => { if (!ok) throw Error(message); };
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const sorted = (a: string[]) => [...a].sort();
function assets(before: Record<string, string>, after: Record<string, string>, rows: any[]) {
  const keys = sorted(Object.keys(before));
  check(keys.length === 14 && same(keys, sorted(Object.keys(after))), "inventory keys");
  check(same(keys, sorted(rows.map((r) => r.path))) && new Set(rows.map((r) => r.path)).size === 14, "served keys");
  check(keys.every((k) => before[k] === after[k]), "pre/post hashes");
  check(rows.every((r) => r.status === 200 && r.fileHash === r.servedHash && r.fileHash === before[r.path]), "response hashes");
}
const clocks = read("controls/clocks.json").filter((c: any) => Number(c.block.split("-")[0]) >= 2);
check(clocks.length === 4 && clocks.map((c: any) => c.variant).join() === "baseline,candidate,candidate,baseline", "controls ABBA");
let reference: string[] | undefined;
const controls = clocks.map((clock: any) => {
  const report = read(`controls/${clock.block}/report.json`);
  const served = read(`controls/${clock.block}/served.json`);
  const log = readFileSync(join(root, "controls", clock.block, "run.log"), "utf8");
  const ids: string[] = [];
  let attachments = 0;
  function walk(s: any, parents: string[]) {
    const titles = [...parents, s.title].filter(Boolean);
    for (const spec of s.specs ?? []) for (const t of spec.tests) {
      check(t.results.length === 1 && t.results[0].retry === 0 && t.results[0].status === "passed", "first attempts");
      check((t.results[0].errors ?? []).length === 0, "attempt errors");
      ids.push([t.projectName, spec.file, ...titles, spec.title].join("|"));
      attachments += (t.results[0].attachments ?? []).length;
    }
    for (const child of s.suites ?? []) walk(child, titles);
  }
  report.suites.forEach((s: any) => walk(s, []));
  check(ids.length === 20 && new Set(ids).size === 20, "20 identities");
  check(!report.errors.length && report.stats.expected === 20 && report.stats.unexpected === 0 && report.stats.flaky === 0 && report.stats.skipped === 0, "stats");
  check(report.config.projects.every((p: any) => p.retries === 0), "retry config");
  check(/20 passed/.test(log) && !/\b(?:failed|timedOut|Retry #)\b/.test(log), "complete list log");
  check(!existsSync(join(root, "controls", clock.block, "results/attempt-failures.json")), "failure marker");
  check(clock.exitCode === 0 && Date.parse(clock.endedAt) >= Date.parse(clock.startedAt), "control clocks");
  assets(clock.before, clock.after, served.rows);
  const current = sorted(ids);
  if (reference) check(same(reference, current), "matching control IDs");
  reference = current;
  return { block: clock.block, startedAt: clock.startedAt, endedAt: clock.endedAt, passes: ids.length, retries: 0, attachments, assets: 14 };
});
const raw = read("closed-probe.json");
check(raw.rows.length === 36 && raw.phases.length === 4, "closed completeness");
const variants = ["baseline", "candidate", "candidate", "baseline"];
const identities = new Set<string>();
const versions = new Map<string, string>();
let edits = 0;
for (const [i, p] of raw.phases.entries()) {
  check(p.phase === i && p.variant === variants[i], "closed phase");
  assets(p.before, p.after, p.served);
  check(Date.parse(p.startedAt) >= Date.parse(raw.startedAt) && Date.parse(p.endedAt) <= Date.parse(raw.endedAt), "phase clock bounds");
}
for (const r of raw.rows) {
  const p = raw.phases[r.phase];
  check(p && r.variant === variants[r.phase] && ["chromium", "firefox", "webkit"].includes(r.engine) && [0, 1, 2].includes(r.sample), "row identity");
  const id = [r.phase, r.variant, r.engine, r.sample].join("|");
  check(!identities.has(id), "distinct rows"); identities.add(id);
  check(r.origin === p.origin && p.before[r.script.slice(1)], "row origin/script");
  check(r.script === (r.variant === "baseline" ? "/assets/index-B3d9YDa-.js" : "/assets/index-B5lUMAkf.js"), "variant script");
  check(!r.errors.length && r.edits.length === 3 && r.edits.map((e: any) => e.day).join() === "9,10,11", "edits/errors");
  check(Date.parse(r.startedAt) >= Date.parse(p.startedAt) && Date.parse(r.endedAt) <= Date.parse(p.endedAt) && Date.parse(r.endedAt) >= Date.parse(r.startedAt), "row clocks");
  check(!versions.has(r.engine) || versions.get(r.engine) === r.browserVersion, "versions"); versions.set(r.engine, r.browserVersion);
  for (const e of r.edits) {
    check(Number.isFinite(e.elapsedMs) && e.elapsedMs >= 0, "elapsed");
    if (r.engine === "chromium") for (const k of ["ScriptDuration", "TaskDuration", "LayoutDuration", "RecalcStyleDuration"]) {
      const v = e.afterMetrics[k] - e.beforeMetrics[k];
      check(Number.isFinite(v) && v >= 0, "counter difference");
    }
  }
  edits += r.edits.length;
}
const means = (engine: string, variant: string, key: string) => {
  const values = raw.rows.filter((r: any) => r.engine === engine && r.variant === variant).flatMap((r: any) => r.edits.map((e: any) => e.afterMetrics[key] - e.beforeMetrics[key]));
  check(values.length === 18, "counter group completeness");
  return values.reduce((a: number, b: number) => a + b, 0) * 1000 / values.length;
};
console.log(JSON.stringify({ generatedAt: new Date().toISOString(), controls, totalControlPasses: controls.reduce((n: number, c: any) => n + c.passes, 0), closed: { startedAt: raw.startedAt, endedAt: raw.endedAt, uniqueRows: identities.size, edits, versions: Object.fromEntries(versions), scriptMeanMs: { baseline: means("chromium", "baseline", "ScriptDuration"), candidate: means("chromium", "candidate", "ScriptDuration") }, taskMeanMs: { baseline: means("chromium", "baseline", "TaskDuration"), candidate: means("chromium", "candidate", "TaskDuration") } }, allChecksPassed: true }, null, 2));
