// Offline archive/content reconciliation. No browser/runtime test is executed.
import { createHash } from "node:crypto";
const folder = import.meta.dir;
const summary = await Bun.file(`${folder}/summary.json`).json();
const rawAttempts = await Bun.file(`${folder}/attempts.json`).json();
const timing = await Bun.file(`${folder}/ci-timing.json`).json();
const zip = await Bun.file(`${folder}/timing.zip`).arrayBuffer();
const artifact = summary.artifacts.find((a: any) => a.name === "chronoshift-ci-timing-37288000068-1");
if (!artifact) throw new Error("Expected actual timing artifact missing");
const digest = `sha256:${createHash("sha256").update(new Uint8Array(zip)).digest("hex")}`;
const checks: { name: string; pass: boolean; details?: unknown }[] = [];
const check = (name: string, pass: boolean, details?: unknown) => checks.push({ name, pass, ...(details === undefined ? {} : { details }) });
const exactKeys = (value: any, keys: string[]) => value && typeof value === "object" && !Array.isArray(value) && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...keys].sort());
const finite = (n: unknown) => typeof n === "number" && Number.isFinite(n) && n >= 0;
const integer = (n: unknown) => finite(n) && Number.isInteger(n);
const date = (s: unknown) => typeof s === "string" && Number.isFinite(Date.parse(s));
check("Downloaded archive SHA256 equals artifact API digest", digest === artifact.digest, { actual: digest, expected: artifact.digest });
check("Downloaded archive bytes equal artifact API size", zip.byteLength === artifact.size_in_bytes, { actual: zip.byteLength, expected: artifact.size_in_bytes });
check("Archive contains only the declared timing JSON", (await Bun.file(`${folder}/timing-entries.txt`).text()).trim() === "ci-timing.json");
check("Timing upload executed successfully at flag1", summary.timingEnabled && summary.timingArtifactStep.conclusion === "success");
check("Exact bounded root schema", exactKeys(timing, ["schemaVersion", "status", "startTime", "durationMs", "workers", "maxAttempts", "droppedAttempts", "durationSemantics", "attempts"]));
check("Reporter metadata matches complete four-worker run", timing.schemaVersion === 1 && timing.status === "passed" && timing.workers === 4 && timing.maxAttempts === 1000 && timing.droppedAttempts === 0 && finite(timing.durationMs) && date(timing.startTime));
check("Inclusive/leaf semantics retained", timing.durationSemantics === "Step totals are inclusive and overlap nested steps; leaf totals exclude parent steps. Neither is CPU time or test wall time.");
check("All raw attempts retained within cap, including retry", Array.isArray(timing.attempts) && timing.attempts.length === rawAttempts.evidence.length && timing.attempts.length <= timing.maxAttempts);
const categories = new Set(["expect", "fixture", "hook", "pw:api", "test.step", "test.attach", "other"]);
const operations = new Set(["bounds", "viewport", "scroll", "select", "attribute", "text-read", "value-read", "wait", "navigate", "request", "context-create", "context-close", "page-create", "page-close", "browser-launch", "init-script", "offline", "route", "evaluate", "screenshot", "reload", "click", "tap", "fill", "press", "type", "hover", "focus", "pointer", "other-api"]);
const aggregateKeys = ["count", "totalMs", "maxMs", "leafCount", "leafTotalMs", "failedCount"];
const projects = ["foldable", "chromium", "firefox", "webkit", "android-emulation", "iphone-emulation"];
const issues: { index: number; field: string }[] = [];
const problem = (index: number, field: string, valid: boolean) => { if (!valid) issues.push({ index, field }); };
const identity = (project: string, file: string, line: number, retry: number) => JSON.stringify([project, file.replace(/^e2e\//, ""), line, retry]);
const rawKeys = rawAttempts.evidence.map((row: any) => identity(row.project, row.file, row.line, row.retry)).sort();
const timingKeys: string[] = [], ids: string[] = [];
const counts: Record<string, number> = {};
const byProject: Record<string, Record<string, number>> = {};
for (const [index, row] of timing.attempts.entries()) {
  problem(index, "attempt schema", exactKeys(row, ["testId", "project", "projectIndex", "location", "retry", "status", "expectedStatus", "startTime", "durationMs", "workerIndex", "parallelIndex", "categories", "operations"]));
  problem(index, "hashed identity", typeof row.testId === "string" && /^[0-9a-f]{16}$/.test(row.testId));
  ids.push(row.testId);
  problem(index, "project identity", projects[row.projectIndex] === row.project);
  problem(index, "location schema", exactKeys(row.location, ["file", "line", "column"]));
  problem(index, "bounded source file", typeof row.location.file === "string" && row.location.file.length <= 240 && !row.location.file.startsWith("/") && !row.location.file.split("/").includes("..") && !/[:\\]/.test(row.location.file));
  problem(index, "numeric metadata", integer(row.location.line) && row.location.line > 0 && integer(row.location.column) && integer(row.retry) && row.retry <= 1 && integer(row.workerIndex) && integer(row.parallelIndex) && row.parallelIndex < 4 && finite(row.durationMs) && date(row.startTime));
  problem(index, "recognized metadata status", ["passed", "skipped", "failed", "timedOut", "interrupted"].includes(row.status) && ["passed", "skipped", "failed"].includes(row.expectedStatus));
  timingKeys.push(identity(row.project, row.location.file, row.location.line, row.retry));
  counts[row.status] = (counts[row.status] ?? 0) + 1;
  const group = byProject[row.project] ??= {};
  group[row.status] = (group[row.status] ?? 0) + 1;
  for (const [kind, groups] of [["categories", row.categories], ["operations", row.operations]] as const) {
    problem(index, `${kind} container`, groups && typeof groups === "object" && !Array.isArray(groups));
    for (const [label, value] of Object.entries(groups) as [string, any][]) {
      const [category, operation, ...extra] = label.split("/");
      const allowed = kind === "categories" ? categories.has(label) : extra.length === 0 && categories.has(category) && (category === "pw:api" ? operations.has(operation) : operation === category);
      problem(index, `${kind} fixed label`, allowed);
      problem(index, `${kind} numeric aggregate`, exactKeys(value, aggregateKeys) && integer(value.count) && integer(value.leafCount) && integer(value.failedCount) && finite(value.totalMs) && finite(value.maxMs) && finite(value.leafTotalMs) && value.leafCount <= value.count && value.failedCount <= value.count && value.maxMs <= value.totalMs + 1e-6 && value.leafTotalMs <= value.totalMs + 1e-6);
    }
  }
}
check("258 unique hashed case identities across259 attempts", new Set(ids).size === 258 && ids.length === 259);
check("Structured attempts biject raw project/file/line/retry identities", JSON.stringify(timingKeys.sort()) === JSON.stringify(rawKeys));
check("Structured counts honestly retain248 first passes/one failed original/one passed retry/nine skips", counts.passed === 249 && counts.skipped === 9 && counts.failed === 1 && Object.keys(counts).length === 3 && timing.attempts.filter((row: any) => row.retry > 0).length === 1 && timing.attempts.filter((row: any) => row.status === "passed" && row.retry === 0).length === 248, counts);
check("Bounded fixed-field metadata; no titles/selectors/inputs/error payloads or raw step names", issues.length === 0, issues);
const output = { observedAt: new Date().toISOString(), run: summary.run, archive: { artifactId: artifact.id, bytes: zip.byteLength, digest }, timingContentSha256: createHash("sha256").update(await Bun.file(`${folder}/ci-timing.json`).bytes()).digest("hex"), durationMs: timing.durationMs, startTime: timing.startTime, byProject, checks, allPassed: checks.every((item) => item.pass), limits: ["Digest covers the actual downloaded archive; privacy validation covers this report's schema/values, not arbitrary future reporter modifications.", "Counter timing is inclusive/overlapping and not CPU attribution; no speed claim follows from a successful upload.", "allPassed here validates artifact consistency/bounds, NOT a first-attempt-clean suite: one unexpected original and one passed retry are preserved.", "Failure upload actually ran because an unexpected-attempt marker existed despite eventual workflow success; failure-archive verification is separate."] };
await Bun.write(`${folder}/timing-validation.json`, JSON.stringify(output, null, 2));
console.log(JSON.stringify(output, null, 2));
if (!output.allPassed) process.exitCode = 1;
