// Offline reconciliation of the saved final run. Does not execute tests/builds.
import { execFileSync } from "node:child_process";
const folder = import.meta.dir;
const repo = "/Users/tien/Developer/ChronoShift";
const head = "66e5fd32f2654e0a61d35ceae6e75b5e4561bc19";
const reviewedSource = "4ff0472089817193a39228d93ac062107c9b441b";
const base = "82843f46e554a04d7a9db9c8b0aaacb77466442e";
const git = (...args: string[]) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
const read = (file: string) => Bun.file(`${folder}/${file}`).json();
const run = await read("run.json"), jobs = await read("jobs.json"), artifacts = await read("artifacts.json");
const log = (await Bun.file(`${folder}/run.log`).text()).replace(/\x1b\[[0-9;]*m/g, "");
function browserRows(raw: string) {
  const cleaned = raw.replace(/\x1b\[[0-9;]*m/g, "");
  const start = cleaned.indexOf("Running 258 tests using 4 workers"), end = cleaned.indexOf("249 passed", start);
  if (start < 0 || end < 0) throw new Error("Complete inventory boundaries missing");
  return cleaned.slice(start, end).split("\n").flatMap((line) => {
    const m = line.match(/\s([✓×-])\s+(\d+)\s+\[([^\]]+)\]\s+›\s+(.+?):(\d+):(\d+)\s+›\s+(.+)/);
    if (!m) return [];
    const tail = m[7].trim().replace(/\s+\(\d+(?:\.\d+)?(?:ms|s|m)\)$/, "");
    return [{ symbol: m[1], ordinal: Number(m[2]), project: m[3], file: m[4], line: Number(m[5]), title: tail, retry: /retry #\d+/.test(tail) }];
  });
}
const rows = browserRows(log);
const prior = browserRows(await Bun.file(`${repo}/docs/qa/ci-efficiency-2026-10-05/fresh-code/candidate.log`).text());
const key = (row: any) => JSON.stringify([row.project, row.file, row.title]);
const inventory = new Set(rows.map(key)), expected = new Set(prior.map(key));
const byProject: Record<string, { passed: number; skipped: number; failed: number; retries: number }> = {};
for (const row of rows) {
  const entry = byProject[row.project] ??= { passed: 0, skipped: 0, failed: 0, retries: 0 };
  entry[row.symbol === "✓" ? "passed" : row.symbol === "-" ? "skipped" : "failed"]++;
  if (row.retry) entry.retries++;
}
const activeJobs = jobs.jobs.filter((job: any) => job.conclusion !== "skipped").map((job: any) => ({
  id: job.id, name: job.name, status: job.status, conclusion: job.conclusion, startedAt: job.started_at, completedAt: job.completed_at,
  runnerSeconds: (Date.parse(job.completed_at) - Date.parse(job.started_at)) / 1000,
  roundedMinutes: Math.ceil((Date.parse(job.completed_at) - Date.parse(job.started_at)) / 60000),
  intervalBeforeFirstStepSeconds: (Date.parse(job.steps[0].started_at) - Date.parse(job.started_at)) / 1000,
  runnerName: job.runner_name, labels: job.labels,
  steps: job.steps.map((step: any) => ({ name: step.name, conclusion: step.conclusion, startedAt: step.started_at, completedAt: step.completed_at, seconds: step.conclusion === "skipped" ? null : (Date.parse(step.completed_at) - Date.parse(step.started_at)) / 1000 }))
}));
const web = activeJobs.find((job: any) => job.name === "web");
const required = ["Run actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5", "Capture the checked-in corpus audit", "Run jdx/mise-action@5228313ee0372e111a38da051671ca30fc5a96db", "Run bun install --frozen-lockfile", "Verify the pinned browser image matches the dependency", "Run bun run format:check", "Unit tests and production build", "Verify the standalone conversion corpus audit", "Run bun run test:browser", "Record browser resource usage", "Verify repository-subpath deployment", "Upload the verified Pages build"];
const gates = required.map((name) => ({ name, conclusion: web.steps.find((step: any) => step.name === name)?.conclusion ?? "missing" }));
const paths = ["web", "e2e", "tests", "scripts", ".github/workflows/web.yml", ".github/workflows/pages.yml", "playwright.config.ts", "playwright.subpath.config.ts", "package.json", "bun.lock", ".github/dependabot.yml"];
const identities = paths.map((path) => ({ path, base: git("rev-parse", `${base}:${path}`), source: git("rev-parse", `${reviewedSource}:${path}`), head: git("rev-parse", `${head}:${path}`) }));
const counters = (text: string) => Object.fromEntries(text.split("\n").flatMap((line) => { const m = line.match(/^([A-Za-z0-9_.]+)\s+(\d+)$/); return m ? [[m[1], Number(m[2])]] : []; }));
const resource = [...log.matchAll(/\[ci-environment\]\s+(\{[^\n]+\})/g)].map((m) => JSON.parse(m[1]));
const before = resource.find((row) => row.phase === "before"), after = resource.find((row) => row.phase === "after");
const beforeCpu = counters(before.cgroup["cpu.stat"]), afterCpu = counters(after.cgroup["cpu.stat"]);
const beforeMemory = counters(before.cgroup["memory.events"]), afterMemory = counters(after.cgroup["memory.events"]);
const testedCommit = await read("tested-merge-commit.json");
const checkout = log.split("\n").filter((line) => /git log -1 --format|HEAD is now at|refs\/remotes\/pull\/39\/merge/.test(line));
const output = {
  observedAt: new Date().toISOString(), run: { id: run.id, attempt: run.run_attempt, head: run.head_sha, event: run.event, status: run.status, conclusion: run.conclusion, createdAt: run.created_at, updatedAt: run.updated_at, url: run.html_url },
  jobs: activeJobs, gates, allRequiredGatesSuccessful: gates.every((gate) => gate.conclusion === "success"),
  browser: { rows: rows.length, distinctOrdinals: new Set(rows.map((row) => row.ordinal)).size, distinctSemanticCases: inventory.size, firstAttemptRows: rows.filter((row) => !row.retry).length, firstPasses: rows.filter((row) => row.symbol === "✓" && !row.retry).length, skipped: rows.filter((row) => row.symbol === "-").length, failedRows: rows.filter((row) => row.symbol === "×").length, retries: rows.filter((row) => row.retry).length, byProject, equalInventoryToPR37: inventory.size === expected.size && [...inventory].every((id) => expected.has(id)), skipIdentityMatchesPR37: JSON.stringify(rows.filter((row) => row.symbol === "-").map(key).sort()) === JSON.stringify(prior.filter((row) => row.symbol === "-").map(key).sort()), rowsEvidence: rows },
  unitEvidence: log.split("\n").filter((line) => /\d+ pass$|\d+ fail$|Ran \d+ tests/.test(line)),
  browserSummaryEvidence: log.split("\n").filter((line) => /\b249 passed \(|\b9 skipped\b|Running 258 tests/.test(line)),
  subpathEvidence: log.split("\n").filter((line) => /\b1 passed \(/.test(line)),
  timingFlagEvidence: log.split("\n").filter((line) => /CHRONOSHIFT_CI_TIMING:/.test(line)),
  timingArtifactStep: web.steps.find((step: any) => step.name === "Retain bounded browser timing metadata"), failureDiagnosticStep: web.steps.find((step: any) => step.name === "Publish failed-attempt diagnostics"),
  artifactInventory: artifacts.artifacts.map((item: any) => ({ ...item, nominalConfiguredRetentionHours: 24, nominalProjectedByteHours: item.size_in_bytes * 24, apiExpiryHours: (Date.parse(item.expires_at) - Date.parse(item.created_at)) / 3600000 })),
  totalArtifactCount: artifacts.total_count, failureArtifactExists: artifacts.artifacts.some((item: any) => item.name.startsWith("chronoshift-web-failure")),
  source: { base, reviewedSource, head, identities, exactReviewedSourceBytes: identities.every((row) => row.source === row.head), unchangedBaseRuntimeTestsWorkflows: identities.filter((row) => row.path !== ".github/dependabot.yml").every((row) => row.base === row.head), nonDocsDiff: git("diff", "--name-only", base, head, "--", ".github", "e2e", "web", "tests", "scripts", "package.json", "bun.lock", "playwright.config.ts", "playwright.subpath.config.ts").split("\n"), testedMerge: testedCommit.sha, testedMergeTree: testedCommit.tree.sha, headTree: git("rev-parse", `${head}^{tree}`), checkoutEvidence: checkout },
  resource: { records: resource, bracketSeconds: (Date.parse(after.at) - Date.parse(before.at)) / 1000, cpuDelta: Object.fromEntries(Object.keys(afterCpu).map((key) => [key, afterCpu[key] - (beforeCpu[key] ?? 0)])), memoryEventsDelta: Object.fromEntries(Object.keys(afterMemory).map((key) => [key, afterMemory[key] - (beforeMemory[key] ?? 0)])) },
  limits: ["Timing is disabled: list logs/known marker-upload logic/artifact absence corroborate first attempts; no direct green-run marker or structured successful timing artifact is retained.", "API spans and rounded minutes are repository proxies, not account billing. No candidate paired main publication is included.", "Grouping changes future maintenance PR organization; no grouped PR/avoided gate or monthly savings has been observed.", "Artifact digest is API provenance only here; extraction/public file verification remains root-owned.", "Resource counters bracket whole browser/protocol/server processes; memory.peak is cumulative, not per-test attribution."]
};
await Bun.write(`${folder}/summary.json`, JSON.stringify(output, null, 2));
console.log(JSON.stringify({ ...output, browser: { ...output.browser, rowsEvidence: undefined }, resource: { ...output.resource, records: undefined }, timingFlagEvidence: undefined }, null, 2));
if (run.id !== 37284698483 || run.head_sha !== head || run.conclusion !== "success" || !output.allRequiredGatesSuccessful || rows.length !== 258 || output.browser.firstPasses !== 249 || output.browser.skipped !== 9 || output.browser.failedRows || output.browser.retries || !output.browser.equalInventoryToPR37 || !output.browser.skipIdentityMatchesPR37 || !output.source.exactReviewedSourceBytes || !output.source.unchangedBaseRuntimeTestsWorkflows || output.source.testedMergeTree !== output.source.headTree) process.exitCode = 1;
