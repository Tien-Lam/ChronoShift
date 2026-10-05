import { join } from "node:path";
const base = import.meta.dir;
const evidence = await Bun.file(join(base, "manual-delivery.json")).json();
const log = await Bun.file(join(base, "manual.log")).text();
const rows = [...log.matchAll(/\t[^\t\n]+\t[^\n]*?\s([✓×-])\s+(\d+)\s+\[([^\]]+)\][^\n]*/g)].map((m) => ({ symbol: m[1], ordinal: Number(m[2]), project: m[3], retry: /retry #\d+/.test(m[0]) }));
const projects: any = {};
for (const row of rows) {
  const group = (projects[row.project] ||= { passed: 0, skipped: 0, failed: 0 });
  group[row.symbol === "✓" ? "passed" : row.symbol === "-" ? "skipped" : "failed"]++;
}
const activeJobs = evidence.jobs.jobs.filter((j: any) => j.conclusion !== "skipped").map((j: any) => ({ name: j.name, status: j.conclusion, start: j.started_at, end: j.completed_at, seconds: (Date.parse(j.completed_at) - Date.parse(j.started_at)) / 1000, roundedMinutes: Math.ceil((Date.parse(j.completed_at) - Date.parse(j.started_at)) / 60000) }));
const required = ["Run bun run format:check", "Unit tests and production build", "Verify the standalone conversion corpus audit", "Run bun run test:browser", "Verify repository-subpath deployment", "Upload the verified Pages build"];
const web = evidence.jobs.jobs.find((j: any) => j.name === "verify / web");
const prep = evidence.jobs.jobs.find((j: any) => j.name === "prepare");
const deploy = evidence.jobs.jobs.find((j: any) => j.name === "deploy");
const steps = web.steps.map((s: any) => ({ name: s.name, conclusion: s.conclusion }));
const gate = required.every((name) => steps.some((s: any) => s.name === name && s.conclusion === "success"));
const branch = prep.steps.find((s: any) => s.name === "Reuse the exact verified PR artifact").conclusion === "skipped" && prep.steps.filter((s: any) => s.name.startsWith("Run actions/deploy-pages@")).every((s: any) => s.conclusion === "skipped") && deploy.steps.some((s: any) => s.name.startsWith("Run actions/deploy-pages@") && s.conclusion === "success");
const failedArtifact = /chronoshift-web-failure/.test(JSON.stringify(evidence.artifactInventory));
const summary = { observedAt: new Date().toISOString(), run: evidence.run.id, activeJobs, totalSeconds: activeJobs.reduce((sum: number, job: any) => sum + job.seconds, 0), totalRoundedMinutes: activeJobs.reduce((sum: number, job: any) => sum + job.roundedMinutes, 0), gate, branch, steps, attempts: { rows: rows.length, distinctOrdinals: new Set(rows.map((row) => row.ordinal)).size, retries: rows.filter((row) => row.retry).length, projects }, unitSummary: log.split("\n").filter((line) => /\d+ pass$|\d+ fail$|Ran \d+ tests/.test(line)).map((line) => line.split("\t").at(-1)), subpathSummary: log.split("\n").filter((line) => /\s1 passed \(/.test(line)), failedArtifact, archive: { id: evidence.artifact.id, bytes: evidence.artifact.size_in_bytes, digest: evidence.artifact.digest, retentionHours: (Date.parse(evidence.artifact.expires_at) - Date.parse(evidence.artifact.created_at)) / 3600000, nominalByteHours: evidence.artifact.size_in_bytes * 336 } };
await Bun.write(join(base, "manual-summary.json"), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
if (!gate || !branch) process.exitCode = 1;
