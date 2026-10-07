// Read-only GitHub Actions benchmark. GitHub operations always use gh.
// Compare equivalent successful push + PR pairs, including every runner job.
export {};
type Step = {
  name: string;
  conclusion: string;
  started_at: string;
  completed_at: string;
};
type Job = Step & { steps: Step[] };
type Artifact = {
  name: string;
  size_in_bytes: number;
  created_at: string;
  expires_at: string;
};
type Run = {
  id: number;
  name: string;
  html_url: string;
  head_sha: string;
  event: string;
  status: string;
  conclusion: string;
  created_at: string;
  updated_at: string;
};
const args = Bun.argv.slice(2);
const consolidatedPreview = args.includes("--consolidated-preview");
function argument(flag: string): string {
  const value = args[args.indexOf(flag) + 1];
  if (!args.includes(flag) || !value || value.startsWith("--"))
    throw new Error(`Missing ${flag}`);
  return value;
}
function ids(flag: string): string[] {
  const values = argument(flag).split(",");
  if (!values.every((id) => /^\d+$/.test(id)))
    throw new Error(`${flag} must contain comma-separated run IDs`);
  return values;
}
async function gh<T>(path: string): Promise<T> {
  const child = Bun.spawn(["gh", "api", path], {
    stdout: "pipe",
    stderr: "pipe",
  });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ]);
  if (code !== 0) throw new Error(`gh api failed: ${stderr}`);
  return JSON.parse(stdout) as T;
}
function seconds(start: string, end: string): number {
  const value = (Date.parse(end) - Date.parse(start)) / 1000;
  if (!Number.isFinite(value) || value < 0)
    throw new Error(`Invalid timestamps: ${start}, ${end}`);
  return value;
}
async function measure(runId: string) {
  const path = `repos/Tien-Lam/time-to-local/actions/runs/${runId}`;
  const [run, jobs, artifacts] = await Promise.all([
    gh<Run>(path),
    gh<{ total_count: number; jobs: Job[] }>(`${path}/jobs?per_page=100`),
    gh<{ total_count: number; artifacts: Artifact[] }>(
      `${path}/artifacts?per_page=100`,
    ),
  ]);
  if (run.status !== "completed" || run.conclusion !== "success")
    throw new Error(`Run ${runId} must have completed successfully`);
  if (
    jobs.total_count !== jobs.jobs.length ||
    artifacts.total_count !== artifacts.artifacts.length
  )
    throw new Error(`Run ${runId} needs pagination; refusing partial metrics`);
  const measuredJobs = jobs.jobs
    .filter((job) => job.conclusion !== "skipped")
    .map((job) => ({
      name: job.name,
      runnerSeconds: seconds(job.started_at, job.completed_at),
      steps: job.steps
        .filter((step) => step.conclusion !== "skipped")
        .map((step) => ({
          name: step.name,
          seconds: seconds(step.started_at, step.completed_at),
        })),
    }));
  return {
    id: run.id,
    workflow: run.name,
    url: run.html_url,
    sourceCommit: run.head_sha,
    event: run.event,
    elapsedSeconds: seconds(run.created_at, run.updated_at),
    jobs: measuredJobs,
    runnerSeconds: measuredJobs.reduce(
      (sum, job) => sum + job.runnerSeconds,
      0,
    ),
    roundedRunnerMinutes: measuredJobs.reduce(
      (sum, job) => sum + Math.ceil(job.runnerSeconds / 60),
      0,
    ),
    artifacts: artifacts.artifacts.map((artifact) => ({
      name: artifact.name,
      bytes: artifact.size_in_bytes,
      retentionHours: seconds(artifact.created_at, artifact.expires_at) / 3600,
    })),
  };
}
async function batch(flag: string) {
  const results = await Promise.allSettled(ids(flag).map(measure));
  const errors = results.filter((result) => result.status === "rejected");
  if (errors.length)
    throw new AggregateError(
      errors.map((result) => result.reason),
      `Could not measure ${flag}`,
    );
  const runs = results.map((result) => {
    if (result.status !== "fulfilled") throw new Error("Missing run");
    return result.value;
  });
  return {
    runs,
    runnerSeconds: runs.reduce((sum, run) => sum + run.runnerSeconds, 0),
    roundedRunnerMinutes: runs.reduce(
      (sum, run) => sum + run.roundedRunnerMinutes,
      0,
    ),
    artifactBytes: runs.reduce(
      (sum, run) =>
        sum + run.artifacts.reduce((n, artifact) => n + artifact.bytes, 0),
      0,
    ),
    projectedArtifactByteHours: runs.reduce(
      (sum, run) =>
        sum +
        run.artifacts.reduce(
          (n, artifact) => n + artifact.bytes * artifact.retentionHours,
          0,
        ),
      0,
    ),
  };
}
const baseline = await batch("--baseline"),
  candidate = await batch("--candidate");
// Do not compare fewer events against more events or count canceled jobs as wins.
const events = (runs: typeof baseline.runs) =>
  runs
    .map((run) => `${run.workflow}:${run.event}`)
    .sort()
    .join(",");
if (consolidatedPreview) {
  // One publishing push and its PR now share a single verified pipeline.
  // Accept only the explicit replacement topology, never arbitrary fewer runs.
  const run = candidate.runs[0];
  if (
    events(baseline.runs) !== "GitHub Pages:push,Web:pull_request" ||
    candidate.runs.length !== 1 ||
    run.workflow !== "Web" ||
    run.event !== "pull_request" ||
    run.jobs
      .map((job) => job.name)
      .sort()
      .join(",") !== "deploy-preview,web" ||
    run.artifacts.length !== 1 ||
    run.artifacts[0].name !== "github-pages"
  )
    throw new Error(
      "Expected a full PR verification + preview publication pipeline",
    );
  const steps = run.jobs.find((job) => job.name === "web")!.steps;
  for (const name of [
    "Verify preview matches the publishing branch",
    "Run bun run test:browser",
    "Verify repository-subpath deployment",
    "Upload the verified Pages build",
  ])
    if (!steps.some((step) => step.name === name))
      throw new Error(`Consolidated pipeline did not execute ${name}`);
} else if (events(baseline.runs) !== events(candidate.runs))
  throw new Error(
    "Compare the same workflow/event mix or use the explicit consolidated preview mode",
  );
function reduction(before: number, after: number): number {
  if (!before) throw new Error("A zero baseline cannot demonstrate savings");
  return Math.round((1 - after / before) * 10000) / 100;
}
const reductions = {
  runnerSecondsPercent: reduction(
    baseline.runnerSeconds,
    candidate.runnerSeconds,
  ),
  roundedRunnerMinutesPercent: reduction(
    baseline.roundedRunnerMinutes,
    candidate.roundedRunnerMinutes,
  ),
  projectedArtifactByteHoursPercent: reduction(
    baseline.projectedArtifactByteHours,
    candidate.projectedArtifactByteHours,
  ),
};
const report = {
  measuredAt: new Date().toISOString(),
  scope: consolidatedPreview
    ? "One publishing push plus its PR: duplicate workflows before, one tree-verified PR/publication pipeline after"
    : "One successful push publication and its successful pull-request verification, before and after optimization",
  consolidatedPreview,
  caveats: [
    "This public repository uses free standard hosted runners; runner usage is not a dollar billing statement.",
    "Rounded minutes are a per-job cost proxy, not an account billing export.",
    "Artifact byte-hours project full configured retention, not already accrued monthly storage.",
    "A paired sample includes queue variability; it is not a guarantee for every future run or the entire account.",
  ],
  baseline,
  candidate,
  reductions,
  meetsTwentyPercentTarget: Object.values(reductions).every(
    (value) => value >= 20,
  ),
  // Keep the stricter all-metric result visible. The requested cost/quota goal
  // applies to rounded minutes and storage; raw time separately shows speed.
  meetsTwentyPercentQuotaAndStorageTarget:
    reductions.roundedRunnerMinutesPercent >= 20 &&
    reductions.projectedArtifactByteHoursPercent >= 20,
  isFaster: reductions.runnerSecondsPercent > 0,
};
await Bun.write(argument("--output"), JSON.stringify(report, null, 2) + "\n");
console.log(
  JSON.stringify(
    {
      reductions,
      meetsTwentyPercentTarget: report.meetsTwentyPercentTarget,
      meetsTwentyPercentQuotaAndStorageTarget:
        report.meetsTwentyPercentQuotaAndStorageTarget,
      isFaster: report.isFaster,
    },
    null,
    2,
  ),
);
if (!report.meetsTwentyPercentQuotaAndStorageTarget || !report.isFaster)
  process.exitCode = 1;
