import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";

const startedAt = new Date().toISOString();
const sources = [
  "docs/qa/ci-efficiency-2026-10-05/control-linux-timing.json",
  "docs/qa/actions-upgrade-2026-10-05/final-ci/ci-timing.json",
];
const records = [];
for (const path of sources) {
  const bytes = await Bun.file(path).arrayBuffer();
  const raw = JSON.parse(new TextDecoder().decode(bytes));
  const operations: Record<string, { count: number; leafMs: number; inclusiveMs: number }> = {};
  const events: { at: number; delta: number }[] = [];
  const projects: Record<string, any> = {};
  let totalMs = 0;
  for (const attempt of raw.attempts) {
    const start = Date.parse(attempt.startTime);
    const end = start + attempt.durationMs;
    if (attempt.durationMs > 0) events.push({ at: start, delta: 1 }, { at: end, delta: -1 });
    totalMs += attempt.durationMs;
    const project = (projects[attempt.project] ||= { count: 0, durationMs: 0, first: start, last: end });
    project.count++;
    project.durationMs += attempt.durationMs;
    project.first = Math.min(project.first, start);
    project.last = Math.max(project.last, end);
    for (const [label, value] of Object.entries(attempt.operations) as any) {
      const group = (operations[label] ||= { count: 0, leafMs: 0, inclusiveMs: 0 });
      group.count += value.count;
      group.leafMs += value.leafTotalMs;
      group.inclusiveMs += value.totalMs;
    }
  }
  events.sort((a, b) => a.at - b.at || a.delta - b.delta);
  const occupancyMs: Record<number, number> = {};
  let active = 0, previous = events[0].at;
  for (const event of events) {
    occupancyMs[active] = (occupancyMs[active] || 0) + event.at - previous;
    active += event.delta;
    previous = event.at;
  }
  const spanMs = events.at(-1)!.at - events[0].at;
  records.push({ path, sha256: createHash("sha256").update(new Uint8Array(bytes)).digest("hex"), startTime: raw.startTime, durationMs: raw.durationMs, workers: raw.workers, attempts: raw.attempts.length, uniqueCases: new Set(raw.attempts.map((a: any) => a.testId)).size, retries: raw.attempts.filter((a: any) => a.retry > 0).length, failures: raw.attempts.filter((a: any) => a.status === "failed").length, skips: raw.attempts.filter((a: any) => a.status === "skipped").length, dropped: raw.droppedAttempts, totalAttemptMs: totalMs, spanMs, occupancyMs, occupiedCapacityFraction: totalMs / (spanMs * raw.workers), fixedDurationIdealMs: totalMs / raw.workers, idealizedGapMs: raw.durationMs - totalMs / raw.workers, projects, operations });
}
const logPath = "docs/qa/copy-focus-2026-10-05/final-ci/run.log";
const log = await Bun.file(logPath).text();
const rows = [];
for (const line of log.split("\n")) {
  if (!line.startsWith("web\tRun bun run test:browser\t")) continue;
  const row = line.match(/([✓-])\s+(\d+) \[([^\]]+)\] › e2e\/([^:]+):\d+:\d+ › (.*)$/);
  if (!row) continue;
  const duration = row[5].match(/ \(([\d.]+)(ms|s)\)$/);
  if (row[1] === "✓" && !duration) throw new Error("Passing row missing duration");
  rows.push({ status: row[1] === "✓" ? "passed" : "skipped", ordinal: Number(row[2]), project: row[3], file: row[4], durationMs: duration ? Number(duration[1]) * (duration[2] === "s" ? 1000 : 1) : null, themedSweep: row[5].startsWith("themed choices align") });
}
if (rows.length !== 273 || new Set(rows.map(r => r.ordinal)).size !== 273) throw new Error("Latest log inventory mismatch");
const familyMs: Record<string, number> = {};
for (const row of rows) familyMs[row.file] = (familyMs[row.file] || 0) + (row.durationMs || 0);
const sourceHashes: Record<string, string> = {};
for (const path of ["playwright.config.ts", "playwright.subpath.config.ts", "e2e/fixtures.ts", "e2e/choices.ts", "e2e/controls.spec.ts", "e2e/timing-reporter.ts", "scripts/serve-web.ts", "scripts/test-releases.ts", ".github/workflows/web.yml", "tests/fixtures/temporal.json", "tests/fixtures/resilience-corpus.json"]) sourceHashes[path] = createHash("sha256").update(new Uint8Array(await Bun.file(path).arrayBuffer())).digest("hex");
const latest = { logPath, sha256: createHash("sha256").update(log).digest("hex"), rows: rows.length, passes: rows.filter(r => r.status === "passed").length, skips: rows.filter(r => r.status === "skipped").length, totalRoundedPassingMs: rows.reduce((sum, r) => sum + (r.durationMs || 0), 0), familyMs, themedSweeps: rows.filter(r => r.themedSweep), rows };
writeFileSync("docs/qa/ci-critical-path-2026-10-05/harness/aggregate.json", JSON.stringify({ startedAt, completedAt: new Date().toISOString(), environment: { platform: process.platform, arch: process.arch, bun: Bun.version }, semantics: "Read-only offline arithmetic. Concurrent attempt/operation sums are neither CPU time nor removable wall time. No browser/build/Actions execution.", sourceHashes, records, latest }, null, 2) + "\n");
console.log(JSON.stringify({ clocks: [startedAt, new Date().toISOString()], records: records.map(({ operations, projects, ...record }) => record), latest: { ...latest, rows: undefined } }, null, 2));
