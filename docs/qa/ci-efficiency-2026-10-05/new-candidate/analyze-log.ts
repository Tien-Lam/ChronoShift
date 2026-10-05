import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const folder = import.meta.dir;
function parse(path: string) {
  const lines = readFileSync(path, "utf8").split("\n");
  const attempts = lines.flatMap((line) => {
    if (!line.includes("\tRun bun run test:browser\t")) return [];
    const match = line.match(
      /Z\s+([✓✘-])\s+(\d+)\s+\[([^\]]+)\] › (\S+):(\d+):(\d+) › (.+)$/, 
    );
    if (!match) return [];
    const [, symbol, index, project, file, sourceLine, column, payload] = match;
    const duration = payload.match(/ \(([\d.]+)(ms|s|m)\)$/);
    const withoutDuration = duration ? payload.slice(0, -duration[0].length) : payload;
    const retry = withoutDuration.match(/ \(retry #(\d+)\)$/);
    const title = retry ? withoutDuration.slice(0, -retry[0].length) : withoutDuration;
    return [{
      index: Number(index), project, file, line: Number(sourceLine), column: Number(column),
      title, retry: retry ? Number(retry[1]) : 0,
      status: symbol === "✓" ? "passed" : symbol === "✘" ? "failed" : "skipped",
      durationMs: duration ? Number(duration[1]) * ({ms:1,s:1000,m:60000}[duration[2]]!) : null,
      logTimestamp: line.match(/\t(\d{4}-\d\d-\d\dT[^ ]+) /)?.[1],
    }];
  });
  const inventory = new Map<string, typeof attempts[number]>();
  for (const attempt of attempts) inventory.set(`${attempt.project}\0${attempt.file}\0${attempt.title}`, attempt);
  const byProject: Record<string, Record<string, number>> = {};
  for (const attempt of inventory.values()) {
    const group = byProject[attempt.project] ||= { passed: 0, failed: 0, skipped: 0 };
    group[attempt.status]++;
  }
  return {
    inventory, attempts, byProject,
    configuredLine: lines.find(line => line.includes("Running 258 tests using 4 workers")),
    summaryLines: lines.filter(line => line.includes("\tRun bun run test:browser\t") && /\s\d+ (passed|skipped|flaky|failed)(\s|$)/.test(line)),
    retryEvidenceLines: lines.filter(line => line.includes("\tRun bun run test:browser\t") && /retry|flaky|✘|Error:|Timeout|Call log:|attachment|trace\.zip|\.png/.test(line)),
  };
}
const control = parse(join(folder, "../control-linux.log"));
const candidate = parse(join(folder, "run.log"));
const keys = (value: ReturnType<typeof parse>) => new Set(value.inventory.keys());
const controlKeys = keys(control), candidateKeys = keys(candidate);
const missing = [...controlKeys].filter(key => !candidateKeys.has(key));
const added = [...candidateKeys].filter(key => !controlKeys.has(key));
const skippedChanges = [...controlKeys].filter(key => candidateKeys.has(key) &&
  (control.inventory.get(key)!.status === "skipped") !== (candidate.inventory.get(key)!.status === "skipped"));
const summary = {
  measuredAt: new Date().toISOString(),
  configuredLine: candidate.configuredLine,
  attempts: candidate.attempts.length, uniqueCases: candidate.inventory.size,
  initialAttempts: candidate.attempts.filter(a => a.retry === 0).length,
  retriedAttempts: candidate.attempts.filter(a => a.retry > 0).length,
  failedAttempts: candidate.attempts.filter(a => a.status === "failed").length,
  byProject: candidate.byProject,
  summaryLines: candidate.summaryLines,
  missing, added, skippedChanges,
  equalInventory: missing.length === 0 && added.length === 0 && skippedChanges.length === 0 && candidate.inventory.size === 258,
  passedAttemptSumMs: candidate.attempts.filter(a => a.status === "passed").reduce((n,a)=>n+(a.durationMs||0),0),
  durationLimit: "List reporter durations are rounded, overlap concurrent workers and include waits; skipped attempt duration is not printed. Not CPU time.",
};
writeFileSync(join(folder,"attempts.json"),JSON.stringify(candidate.attempts,null,2)+"\n");
writeFileSync(join(folder,"retry-evidence.json"),JSON.stringify(candidate.retryEvidenceLines,null,2)+"\n");
writeFileSync(join(folder,"attempt-summary.json"),JSON.stringify(summary,null,2)+"\n");
console.log(JSON.stringify(summary,null,2));
if (!summary.equalInventory || summary.initialAttempts !== 258) process.exitCode = 1;
