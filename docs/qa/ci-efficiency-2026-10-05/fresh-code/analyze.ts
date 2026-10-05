import { join } from "node:path";
import TimingReporter, { classifyTimingStep } from "../../../../e2e/timing-reporter";

const root = import.meta.dir;
const read = async (name: string) => Bun.file(join(root, name)).json();
const summaries = {} as Record<string, unknown>;
for (const name of ["baseline-pr", "baseline-pages", "candidate"]) {
  const jobs = (await read(`${name}-jobs.json`)).jobs;
  const artifacts = (await read(`${name}-artifacts.json`)).artifacts;
  const log = await Bun.file(join(root, `${name}.log`)).text();
  const rows = [...log.matchAll(/\t[^\t\n]+\t[^\n]*?\s([✓×-])\s+(\d+)\s+\[([^\]]+)\][^\n]*/g)].map((m) => ({ symbol: m[1], ordinal: Number(m[2]), project: m[3], retry: /retry #\d+/.test(m[0]) }));
  const perProject = {} as Record<string, Record<string, number>>;
  for (const row of rows) {
    const group = (perProject[row.project] ||= { passed: 0, skipped: 0, failed: 0 });
    group[row.symbol === "✓" ? "passed" : row.symbol === "-" ? "skipped" : "failed"]++;
  }
  summaries[name] = {
    jobs: jobs.map((job: any) => ({ name: job.name, status: job.conclusion, start: job.started_at, end: job.completed_at, seconds: (Date.parse(job.completed_at) - Date.parse(job.started_at)) / 1000, roundedMinutes: Math.ceil((Date.parse(job.completed_at) - Date.parse(job.started_at)) / 60000), steps: job.steps.filter((step: any) => /test:browser|failed-attempt|timing/.test(step.name)) })),
    artifacts: artifacts.map((a: any) => ({ name: a.name, size: a.size_in_bytes, digest: a.digest, actualRetentionHours: (Date.parse(a.expires_at) - Date.parse(a.created_at)) / 3600000 })),
    attemptsFromCompleteListLog: { count: rows.length, distinctOrdinals: new Set(rows.map((row) => row.ordinal)).size, maxOrdinal: Math.max(...rows.map((row) => row.ordinal)), retryRows: rows.filter((row) => row.retry).length, perProject },
    unitSummary: log.split("\n").filter((line) => /\d+ pass$|\d+ fail$|Ran \d+ tests/.test(line)).map((line) => line.split("\t").at(-1)),
  };
}
const metadata = await read("candidate-artifacts.json");
const zip = new Uint8Array(await Bun.file(join(root, "candidate-pages.zip")).arrayBuffer());
const digest = `sha256:${new Bun.CryptoHasher("sha256").update(zip).digest("hex")}`;
if (digest !== metadata.artifacts[0].digest) throw new Error("Candidate ZIP digest mismatch");

const sentinel = "PRIVATE_INPUT_SENTINEL";
const project = { name: "chromium", outputDir: root };
const reporter = new TimingReporter({ outputFile: join(root, "synthetic-timing.json") });
reporter.onBegin({ rootDir: process.cwd(), projects: [project], workers: 4 } as any);
const test = { id: sentinel, location: { file: join(process.cwd(), "e2e/controls.spec.ts"), line: 1, column: 1 }, parent: { project: () => project }, expectedStatus: "passed" };
for (let retry = 0; retry < 1002; retry++) {
  const result = { retry, status: "passed", startTime: new Date(0), duration: 12, workerIndex: 0, parallelIndex: 0 };
  for (const category of ["pw:api", "test.step", sentinel]) {
    reporter.onStepEnd(test as any, result as any, { category, title: `Fill "${sentinel}"`, duration: 12, steps: [], error: { message: sentinel } } as any);
  }
  reporter.onTestEnd(test as any, result as any);
}
reporter.onEnd({ status: "passed", startTime: new Date(0), duration: 13 } as any);
const output = await Bun.file(join(root, "synthetic-timing.json")).text();
const timing = JSON.parse(output);
if (output.includes(sentinel) || timing.attempts.length !== 1000 || timing.droppedAttempts !== 2) throw new Error("Sanitization or attempt cap failed");
const checks = { capturedAt: new Date().toISOString(), summaries, artifact: { bytes: zip.length, digest, matched: true }, syntheticTiming: { attempts: timing.attempts.length, dropped: timing.droppedAttempts, sentinelAbsent: true, classification: classifyTimingStep({ category: "pw:api", title: `Fill "${sentinel}"` }) } };
await Bun.write(join(root, "independent-summary.json"), JSON.stringify(checks, null, 2));
console.log(JSON.stringify(checks, null, 2));
