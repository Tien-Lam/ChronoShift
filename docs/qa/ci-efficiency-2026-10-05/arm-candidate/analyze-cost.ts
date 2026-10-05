const folder = import.meta.dir;
const run = await Bun.file(`${folder}/run.json`).json();
const jobs = await Bun.file(`${folder}/jobs.json`).json();
const artifacts = await Bun.file(`${folder}/artifacts.json`).json();
if (
  run.head_sha !== "52e8d9c3bc2ba50f6ba2990dde5a128a37849172" ||
  run.status !== "completed"
)
  throw new Error("Exact candidate has not completed");
if (
  jobs.total_count !== jobs.jobs.length ||
  artifacts.total_count !== artifacts.artifacts.length
)
  throw new Error("Refusing partial metadata");
const seconds = (start: string, end: string) => {
  const value = (Date.parse(end) - Date.parse(start)) / 1000;
  if (!Number.isFinite(value) || value < 0)
    throw new Error("Invalid final timestamp");
  return value;
};
const measuredJobs = jobs.jobs
  .filter((j: any) => j.conclusion !== "skipped")
  .map((j: any) => ({
    id: j.id,
    name: j.name,
    conclusion: j.conclusion,
    startedAt: j.started_at,
    completedAt: j.completed_at,
    runnerSeconds: seconds(j.started_at, j.completed_at),
    roundedMinutes: Math.ceil(seconds(j.started_at, j.completed_at) / 60),
    intervalBeforeFirstStepSeconds: seconds(
      j.started_at,
      j.steps.find(
        (s: any) => s.started_at && s.started_at !== "0001-01-01T00:00:00Z",
      ).started_at,
    ),
    steps: j.steps
      .filter((s: any) => s.conclusion !== "skipped")
      .map((s: any) => ({
        name: s.name,
        conclusion: s.conclusion,
        seconds: seconds(s.started_at, s.completed_at),
      })),
  }));
const runnerSeconds = measuredJobs.reduce(
  (n: number, j: any) => n + j.runnerSeconds,
  0,
);
const roundedMinutes = measuredJobs.reduce(
  (n: number, j: any) => n + j.roundedMinutes,
  0,
);
const output = {
  capturedAt: new Date().toISOString(),
  runId: run.id,
  head: run.head_sha,
  conclusion: run.conclusion,
  runCreatedAt: run.created_at,
  runUpdatedAt: run.updated_at,
  runElapsedSeconds: seconds(run.created_at, run.updated_at),
  jobs: measuredJobs,
  runnerSeconds,
  roundedMinutes,
  artifacts: artifacts.artifacts.map((a: any) => ({
    name: a.name,
    id: a.id,
    bytes: a.size_in_bytes,
    digest: a.digest,
    createdAt: a.created_at,
    expiresAt: a.expires_at,
    configuredRetentionHours: seconds(a.created_at, a.expires_at) / 3600,
    projectedByteHours:
      (a.size_in_bytes * seconds(a.created_at, a.expires_at)) / 3600,
  })),
  webOnlyComparisons: [
    {
      label: "Original expanded-suite published Web",
      seconds: 301,
      roundedMinutes: 6,
    },
    {
      label: "Four-worker instrumented Linux control Web",
      seconds: 356,
      roundedMinutes: 6,
    },
  ].map((b) => ({
    ...b,
    rawSecondsReduction: b.seconds - runnerSeconds,
    rawPercentReduction: (1 - runnerSeconds / b.seconds) * 100,
    roundedMinuteReduction: b.roundedMinutes - roundedMinutes,
    roundedPercentReduction: (1 - roundedMinutes / b.roundedMinutes) * 100,
  })),
  limits: [
    "Web-only comparison; matching main publication pending. Do not infer complete-pair acceptance.",
    "Different source/optional instrumentation conditions; do not isolate causal speedup from this comparison.",
    "API job spans include interval before the first step, as the existing metric script does.",
    "Rounded minutes and configured artifact byte-hours are repository proxies, not an account billing statement.",
  ],
};
await Bun.write(
  `${folder}/cost-summary.json`,
  JSON.stringify(output, null, 2) + "\n",
);
console.log(JSON.stringify(output, null, 2));
