import { createHash } from "node:crypto";
import { join } from "node:path";
const root = "/tmp/chronoshift-ci-next-delivery/pipeline";
const began = new Date().toISOString();
const run = await Bun.file(join(root, "final-run.json")).json();
const jobs = await Bun.file(join(root, "final-jobs.json")).json();
const artifacts = await Bun.file(join(root, "final-artifacts.json")).json();
const raw = await Bun.file(join(root, "final-run.log")).text();
const clean = raw.replace(/\u001b\[[0-9;]*m/g, "").replace(/\uFEFF/g, "");
const lines = clean.split("\n").map((line) => {
  const [job, step, ...parts] = line.split("\t");
  const body = parts.join("\t");
  const match = body.match(/^([0-9T:.+-]+Z)\s+(.*)$/);
  return { job, step, at: match?.[1] || null, text: match?.[2] || body, raw: line };
});
const browser = lines.filter((line) => line.step === "Run bun run test:browser");
const attemptRows = browser.flatMap((line) => {
  const match = line.text.match(/^\s*([✓✘×x-])\s+(\d+)\s+\[([^\]]+)\]\s+›\s+(.*?)\s+›\s+(.*)$/);
  if (!match) return [];
  const title = match[5].replace(/\s+\([\d.]+(?:ms|s)\)$/, "");
  return [{ at: line.at, symbol: match[1], ordinal: Number(match[2]), project: match[3], location: match[4], title, retry: /retry\s*#?\s*[1-9]/i.test(match[5]), raw: line.raw }];
});
const expectedSkips = ["firefox", "webkit", "iphone-emulation"].flatMap((project) => [
  "an activated worker reclaims a hard-refreshed tab without reloading its draft",
  "an explicit update recovers a timed-out readiness probe without another reload",
  "an older active worker cannot mark an uncontrolled tab ready or activate its waiting update",
].map((title) => ({ project, title })));
const actualSkips = attemptRows.filter((row) => row.symbol === "-").map(({ project, title }) => ({ project, title }));
const key = (row: { project: string; title: string }) => row.project + "|" + row.title;
const unique = new Set(attemptRows.map(key));
const skippedMatch = JSON.stringify(expectedSkips.map(key).sort()) === JSON.stringify(actualSkips.map(key).sort());
const resource = browser.flatMap((line) => {
  const offset = line.text.indexOf("[ci-environment]");
  if (offset < 0) return [];
  return [JSON.parse(line.text.slice(offset + "[ci-environment]".length).trim())];
}).concat(lines.filter((line) => line.step === "Record browser resource usage").flatMap((line) => {
  const offset = line.text.indexOf("[ci-environment]");
  return offset < 0 ? [] : [JSON.parse(line.text.slice(offset + "[ci-environment]".length).trim())];
}));
const before = resource.find((r) => r.phase === "before"), after = resource.find((r) => r.phase === "after");
function counters(text: string | null) { return Object.fromEntries((text || "").split("\n").filter(Boolean).map((line) => { const [key, value] = line.split(/\s+/); return [key, Number(value)]; })); }
const beforeCpu = counters(before?.cgroup?.["cpu.stat"]), afterCpu = counters(after?.cgroup?.["cpu.stat"]);
const bracketSeconds = before && after ? (Date.parse(after.at) - Date.parse(before.at)) / 1000 : null;
const cpuSeconds = before && after ? (afterCpu.usage_usec - beforeCpu.usage_usec) / 1e6 : null;
const validResource = Number.isFinite(bracketSeconds) && bracketSeconds! > 0 && Number.isFinite(cpuSeconds) && cpuSeconds! >= 0;
const required = ["Run bun run format:check", "Unit tests and production build", "Verify the standalone conversion corpus audit", "Run bun run test:browser", "Verify repository-subpath deployment", "Upload the verified Pages build"];
const job = jobs.jobs.find((job: any) => job.name === "web");
const failures = [];
function require(condition: boolean, description: string) { if (!condition) failures.push(description); }
require(run.head_sha === "cb8206c280494341632821d13b4e90f8f1c3a3e9", "Wrong final PR head");
require(run.event === "pull_request" && run.status === "completed" && run.conclusion === "success", "Full final PR run not successful/completed");
require(jobs.total_count === jobs.jobs.length && job?.conclusion === "success", "Incomplete jobs or unsuccessful web job");
require(required.every((name) => job?.steps.some((step: any) => step.name === name && step.conclusion === "success")), "Required gate steps missing/not successful");
require(attemptRows.length === 273 && unique.size === 273 && attemptRows.filter((r) => r.symbol === "✓").length === 264 && skippedMatch, "Browser first-attempt inventory/skips do not reconcile");
require(attemptRows.every((r) => !r.retry && ["✓", "-"].includes(r.symbol)), "Unexpected browser attempt/retry row");
const browserRetryLines = browser.filter((line) => /retry\s*#?\s*[1-9]|^\s*\d+\s+(?:flaky|failed)\b|^\s*(?:Retry|Error:|TimeoutError:)|^\s*[✘×x]\s+\d/i.test(line.text));
require(browserRetryLines.length === 0, "Browser failure/retry/flaky evidence needs reconciliation");
const unitLines = lines.filter((line) => line.step === "Unit tests and production build");
require(unitLines.some((line) => /^\s*116 pass\b/.test(line.text)), "116 unit pass summary missing");
require(unitLines.some((line) => /^\s*0 fail\b/.test(line.text)), "Zero unit failure summary missing");
const subpath = lines.filter((line) => line.step === "Verify repository-subpath deployment");
require(subpath.some((line) => /^\s*1 passed\b/.test(line.text)), "Separate subpath summary missing");
const failureStep = job?.steps.find((s: any) => s.name === "Publish failed-attempt diagnostics");
require(failureStep?.conclusion === "skipped", "Failure/retry marker upload did not remain skipped");
require(artifacts.total_count === artifacts.artifacts.length && artifacts.artifacts.some((a: any) => a.name === "github-pages" && !a.expired), "Missing/incomplete Pages artifacts");
require(!artifacts.artifacts.some((a: any) => /^chronoshift-web-failure-/.test(a.name)), "Unexpected failure artifact");
require(validResource, "Invalid/unavailable CPU bracket");
const checkout = lines.filter((line) => line.step?.startsWith("Run actions/checkout@"));
const checkoutEvidence = checkout.filter((line) => /--filter=blob:none|sparse|\bcheckout\b|git version|Checking out|git-path|rev-parse HEAD/.test(line.text));
require(checkout.some((line) => line.text.includes("--filter=blob:none")), "Actual checkout blob:none fetch absent");
require(checkout.some((line) => /config.*core\.sparseCheckout.*true/.test(line.text)), "Actual sparse setup absent");
const runnerSeconds = job ? (Date.parse(job.completed_at) - Date.parse(job.started_at)) / 1000 : null;
const stepTimes = job?.steps.map((s: any) => ({ name: s.name, conclusion: s.conclusion, seconds: s.started_at && s.completed_at ? (Date.parse(s.completed_at) - Date.parse(s.started_at)) / 1000 : null }));
const output = { began, ended: new Date().toISOString(), sourceHead: run.head_sha, configured: 273, attemptCount: attemptRows.length, uniqueScenarioCount: unique.size, passed: attemptRows.filter((r) => r.symbol === "✓").length, skipped: actualSkips, skipsMatchIndependentList: skippedMatch, retryRows: attemptRows.filter((r) => r.retry), browserRetryLines, runnerSeconds, roundedMinutes: runnerSeconds === null ? null : Math.ceil(runnerSeconds / 60), stepTimes, resource: { valid: validResource, bracketSeconds, cpuProcessorSeconds: cpuSeconds, averageProcessors: validResource ? cpuSeconds! / bracketSeconds! : null, before, after }, checkoutEvidence, unitSummaries: unitLines.filter((line) => /pass|fail|Ran 116 tests/.test(line.text)), subpathSummaries: subpath.filter((line) => /passed|Running .*tests/.test(line.text)), failureDiagnosticStep: failureStep, artifacts: artifacts.artifacts, failures, limits: ["Whole-second API job/step durations are runner-cost observations, not exact command CPU attribution.", "Resource bracket is browser-step before/after counters, not a profiler of individual tests; no invalid weighted samples are used.", "No timing reporter was requested by ready-for-review; structured first-attempt details derive from the full retained list log, marker upload step and artifact list.", "Failure marker absence is inferred from the skipped conditional upload and absence of failure artifacts; raw successful test-results files are not uploaded.", "No pair/monthly/20% claim is made; additional canceled investigations are accounted separately."] };
await Bun.write(join(root, "analysis.json"), JSON.stringify(output, null, 2) + "\n");
await Bun.write(join(root, "browser-attempts.json"), JSON.stringify(attemptRows, null, 2) + "\n");
const digestNames = ["final-run.json", "final-jobs.json", "final-artifacts.json", "final-run.log", "analysis.json", "browser-attempts.json"];
await Bun.write(join(root, "evidence-digests.json"), JSON.stringify(await Promise.all(digestNames.map(async (name) => ({ name, bytes: (await Bun.file(join(root, name)).bytes()).length, sha256: createHash("sha256").update(await Bun.file(join(root, name)).bytes()).digest("hex") }))), null, 2) + "\n");
console.log(JSON.stringify({ failures, attempts: attemptRows.length, unique: unique.size, runnerSeconds, validResource }));
process.exitCode = failures.length ? 1 : 0;
