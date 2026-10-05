// Saved evidence processing only. This initial head is supplemental, not final delivery.
import { execFileSync } from "node:child_process";
const folder = import.meta.dir, repo = "/Users/tien/Developer/ChronoShift";
const head = "79c114bbe6823f70456a53f2a10e5428fc6263b6", base = "0fb0b915a1e1f2ab19613ad1f8ac9dae0eec43cc";
const git = (...args: string[]) => execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
const read = (name: string) => Bun.file(`${folder}/${name}`).json();
const run = await read("run.json"), jobs = await read("jobs.json"), artifacts = await read("artifacts.json"), tested = await read("tested-merge-commit.json");
const strip = (raw: string) => raw.replace(/\x1b\[[0-9;]*m/g, "");
const log = strip(await Bun.file(`${folder}/run.log`).text());
function attempts(raw: string) {
  return strip(raw).split("\n").filter((line) => line.includes("\tRun bun run test:browser\t")).flatMap((line) => {
    const m = line.match(/\s([✓×✘-])\s+(\d+)\s+\[([^\]]+)\]\s+›\s+(.+?):(\d+):(\d+)\s+›\s+(.+)/);
    if (!m) return [];
    const tail = m[7].trim().replace(/\s+\(\d+(?:\.\d+)?(?:ms|s|m)\)$/, "");
    const retry = Number(tail.match(/retry #(\d+)/)?.[1] ?? 0);
    return [{ symbol: m[1], ordinal: Number(m[2]), project: m[3], file: m[4], line: Number(m[5]), title: tail.replace(/\s*\(retry #\d+\)/, ""), retry, rawLine: line }];
  });
}
const rows = attempts(log), prior = attempts(await Bun.file(`${repo}/docs/qa/ci-efficiency-2026-10-05/fresh-code/candidate.log`).text());
const key = (row: any) => JSON.stringify([row.project, row.file, row.title]);
const inventory = new Set(rows.map(key)), expected = new Set(prior.map(key));
const byProject: Record<string, { passed: number; skipped: number; failed: number; retries: number }> = {};
for (const row of rows) { const p = byProject[row.project] ??= { passed: 0, skipped: 0, failed: 0, retries: 0 }; p[row.symbol === "✓" ? "passed" : row.symbol === "-" ? "skipped" : "failed"]++; if (row.retry) p.retries++; }
const activeJobs = jobs.jobs.filter((job: any) => job.conclusion !== "skipped").map((job: any) => ({ id: job.id, name: job.name, conclusion: job.conclusion, startedAt: job.started_at, completedAt: job.completed_at, seconds: (Date.parse(job.completed_at) - Date.parse(job.started_at)) / 1000, roundedMinutes: Math.ceil((Date.parse(job.completed_at) - Date.parse(job.started_at)) / 60000), intervalBeforeFirstStepSeconds: (Date.parse(job.steps[0].started_at) - Date.parse(job.started_at)) / 1000, steps: job.steps.map((step: any) => ({ name: step.name, conclusion: step.conclusion, startedAt: step.started_at, completedAt: step.completed_at, seconds: step.conclusion === "skipped" ? null : (Date.parse(step.completed_at) - Date.parse(step.started_at)) / 1000 })) }));
const web = activeJobs.find((job: any) => job.name === "web");
const required = ["Run actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1", "Capture the checked-in corpus audit", "Run jdx/mise-action@7a4e45a543138629540c9a1616d08632b893e492", "Run bun install --frozen-lockfile", "Verify the pinned browser image matches the dependency", "Run bun run format:check", "Unit tests and production build", "Verify the standalone conversion corpus audit", "Run bun run test:browser", "Record browser resource usage", "Verify repository-subpath deployment", "Upload the verified Pages build"];
const gates = required.map((name) => ({ name, conclusion: web.steps.find((step: any) => step.name === name)?.conclusion ?? "missing" }));
const paths = ["web", "e2e", "tests", "scripts", "playwright.config.ts", "playwright.subpath.config.ts", "package.json", "bun.lock", ".github/dependabot.yml", ".github/workflows/web.yml", ".github/workflows/pages.yml"];
const identities = paths.map((path) => ({ path, base: git("rev-parse", `${base}:${path}`), head: git("rev-parse", `${head}:${path}`) }));
const resource = [...log.matchAll(/\[ci-environment\]\s+(\{[^\n]+\})/g)].map((m) => JSON.parse(m[1]));
const before = resource.find((row) => row.phase === "before"), after = resource.find((row) => row.phase === "after");
const counters = (raw: string) => Object.fromEntries(raw.split("\n").flatMap((line) => { const m = line.match(/^([A-Za-z0-9_.]+)\s+(\d+)$/); return m ? [[m[1], Number(m[2])]] : []; }));
const delta = (name: string) => { if (!before || !after) return null; const b = counters(before.cgroup[name]), a = counters(after.cgroup[name]); return Object.fromEntries(Object.keys(a).map((key) => [key, a[key] - (b[key] ?? 0)])); };
const flags = log.split("\n").filter((line) => /CHRONOSHIFT_CI_TIMING:/.test(line));
const summary = {
  observedAt: new Date().toISOString(), scope: "Initial supplemental run only; final reviewed delivery/upload conditional path remains pending.",
  run: { id: run.id, attempt: run.run_attempt, head: run.head_sha, event: run.event, status: run.status, conclusion: run.conclusion, createdAt: run.created_at, updatedAt: run.updated_at, url: run.html_url }, jobs: activeJobs, gates, allRequiredGatesSuccessful: gates.every((g) => g.conclusion === "success"),
  browser: { rows: rows.length, distinctOrdinals: new Set(rows.map((row) => row.ordinal)).size, distinctSemanticCases: inventory.size, firstAttemptRows: rows.filter((row) => !row.retry).length, firstPasses: rows.filter((row) => row.symbol === "✓" && !row.retry).length, skipped: rows.filter((row) => row.symbol === "-").length, failedRows: rows.filter((row) => row.symbol === "×" || row.symbol === "✘").length, retries: rows.filter((row) => row.retry).length, byProject, equalInventoryToPR37: inventory.size === expected.size && [...inventory].every((id) => expected.has(id)), skipIdentityMatchesPR37: JSON.stringify(rows.filter((row) => row.symbol === "-").map(key).sort()) === JSON.stringify(prior.filter((row) => row.symbol === "-").map(key).sort()) },
  unitEvidence: log.split("\n").filter((line) => /\d+ pass$|\d+ fail$|Ran \d+ tests/.test(line)), browserSummaryEvidence: log.split("\n").filter((line) => /249 passed \(|9 skipped|Running 258 tests/.test(line)), subpathEvidence: log.split("\n").filter((line) => /\b1 passed \(/.test(line)),
  timingFlagEvidence: flags, timingDisabled: flags.length > 0 && flags.every((line) => /CHRONOSHIFT_CI_TIMING: 0$/.test(line)), timingArtifactStep: web.steps.find((step: any) => step.name === "Retain bounded browser timing metadata"), failureDiagnosticStep: web.steps.find((step: any) => step.name === "Publish failed-attempt diagnostics"),
  totalArtifactCount: artifacts.total_count, artifacts: artifacts.artifacts.map((item: any) => ({ ...item, nominalRetentionHours: 24, nominalProjectedByteHours: item.size_in_bytes * 24, apiExpiryHours: (Date.parse(item.expires_at) - Date.parse(item.created_at)) / 3600000 })),
  source: { base, head, identities, unchangedRuntimeTestsConfigs: identities.filter((row) => !row.path.startsWith(".github/workflows/")).every((row) => row.base === row.head), testedMerge: tested.sha, testedTree: tested.tree.sha, headTree: git("rev-parse", `${head}^{tree}`), nonDocsDiff: git("diff", "--name-only", base, head, "--", ".github", "e2e", "web", "tests", "scripts", "package.json", "bun.lock", "playwright.config.ts", "playwright.subpath.config.ts").split("\n") },
  resource: { records: resource, bracketSeconds: before && after ? (Date.parse(after.at) - Date.parse(before.at)) / 1000 : null, cpuDelta: delta("cpu.stat"), memoryEventsDelta: delta("memory.events") },
  limits: ["No final-head adoption/static approval implied. Configure/deploy actions and conditional timing/failure uploads did not execute in this initial successful PR run.", "Timing disabled: parsed raw attempts and skipped failure-upload policy/artifact absence corroborate first attempts; no direct green marker/structured successful timing artifact retained.", "API spans/round-up minutes and nominal byte-hours are repository proxies, not account billing or complete paired publication.", "Artifact/public-byte verification remains root-owned; no extraction/public identity assertion here."]
};
await Bun.write(`${folder}/attempts.json`, JSON.stringify({ observedAt: summary.observedAt, run: summary.run, evidence: rows }, null, 2));
await Bun.write(`${folder}/summary.json`, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ ...summary, timingFlagEvidence: undefined, resource: { ...summary.resource, records: undefined } }, null, 2));
if (run.id !== 37285626930 || run.head_sha !== head || run.conclusion !== "success" || !summary.allRequiredGatesSuccessful || rows.length !== 258 || summary.browser.firstPasses !== 249 || summary.browser.skipped !== 9 || summary.browser.failedRows || summary.browser.retries || !summary.browser.equalInventoryToPR37 || !summary.browser.skipIdentityMatchesPR37 || !summary.timingDisabled || !summary.source.unchangedRuntimeTestsConfigs || summary.source.testedTree !== summary.source.headTree) process.exitCode = 1;
