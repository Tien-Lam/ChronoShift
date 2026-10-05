// Analyze saved workflow_dispatch API/log evidence, without changing the normal pair.
export {};
const folder = import.meta.dir;
const [run, jobs, artifacts, normal, attempts, log] = await Promise.all([
  Bun.file(`${folder}/run.json`).json(),
  Bun.file(`${folder}/jobs.json`).json(),
  Bun.file(`${folder}/artifacts.json`).json(),
  Bun.file(`${folder}/../../ci-efficiency-current.json`).json(),
  Bun.file(`${folder}/attempt-summary.json`).json(),
  Bun.file(`${folder}/run.log`).text(),
]);
if (
  run.id !== 37276826095 ||
  run.head_sha !== "28059a91ec9984dea4d079b3f684b3a27af669f0" ||
  run.event !== "workflow_dispatch" ||
  run.status !== "completed" ||
  run.conclusion !== "success"
)
  throw new Error("Manual fallback is not the exact successful main dispatch");
if (
  jobs.total_count !== jobs.jobs.length ||
  artifacts.total_count !== artifacts.artifacts.length
)
  throw new Error("Refusing partial job/artifact inventory");
const measuredJobs = jobs.jobs
  .filter((j: { conclusion: string }) => j.conclusion !== "skipped")
  .map(
    (j: {
      id: number;
      name: string;
      conclusion: string;
      started_at: string;
      completed_at: string;
      steps: {
        name: string;
        conclusion: string;
        started_at: string;
        completed_at: string;
      }[];
    }) => {
      const seconds =
        (Date.parse(j.completed_at) - Date.parse(j.started_at)) / 1000;
      if (!Number.isFinite(seconds) || seconds < 0)
        throw new Error("Invalid job clocks");
      return {
        id: j.id,
        name: j.name,
        conclusion: j.conclusion,
        startedAt: j.started_at,
        completedAt: j.completed_at,
        seconds,
        roundedMinutes: Math.ceil(seconds / 60),
        steps: j.steps.map((s) => ({
          name: s.name,
          conclusion: s.conclusion,
          seconds:
            s.conclusion === "skipped"
              ? null
              : (Date.parse(s.completed_at) - Date.parse(s.started_at)) / 1000,
        })),
      };
    },
  );
if (
  measuredJobs
    .map((j: { name: string }) => j.name)
    .sort()
    .join(",") !== "deploy,prepare,verify / web"
)
  throw new Error("Fallback did not execute all three expected jobs");
const totalSeconds = measuredJobs.reduce(
  (a: number, j: { seconds: number }) => a + j.seconds,
  0,
);
const totalMinutes = measuredJobs.reduce(
  (a: number, j: { roundedMinutes: number }) => a + j.roundedMinutes,
  0,
);
const artifactRows = artifacts.artifacts.map(
  (a: {
    id: number;
    name: string;
    size_in_bytes: number;
    digest: string;
    created_at: string;
    expires_at: string;
  }) => {
    const hours =
      (Date.parse(a.expires_at) - Date.parse(a.created_at)) / 3600000;
    return {
      id: a.id,
      name: a.name,
      bytes: a.size_in_bytes,
      digest: a.digest,
      retentionHours: hours,
      projectedByteHours: a.size_in_bytes * hours,
    };
  },
);
const result = {
  analyzedAt: new Date().toISOString(),
  runId: run.id,
  head: run.head_sha,
  event: run.event,
  createdAt: run.created_at,
  updatedAt: run.updated_at,
  conclusion: run.conclusion,
  jobs: measuredJobs,
  additionalValidationRunnerSeconds: totalSeconds,
  additionalValidationRoundedMinutes: totalMinutes,
  artifacts: artifactRows,
  additionalValidationProjectedArtifactByteHours: artifactRows.reduce(
    (a: number, b: { projectedByteHours: number }) => a + b.projectedByteHours,
    0,
  ),
  browser: {
    uniqueCases: attempts.uniqueCases,
    attempts: attempts.attempts,
    initialAttempts: attempts.initialAttempts,
    failedAttempts: attempts.failedAttempts,
    retriedAttempts: attempts.retriedAttempts,
    byProject: attempts.byProject,
    equalInventory: attempts.equalInventory,
    otherGatesMatch: attempts.otherGatesMatch,
  },
  timingEnvironmentLines: log
    .split("\n")
    .filter((line) => /CHRONOSHIFT_CI_TIMING:/.test(line)),
  timingReporterLines: log
    .split("\n")
    .filter((line) => line.includes("[ci-timing]")),
  normalSuccessfulPairUnchanged: {
    runIds: normal.candidate.runs.map((r: { id: number }) => r.id),
    runnerSeconds: normal.candidate.runnerSeconds,
    roundedMinutes: normal.candidate.roundedRunnerMinutes,
    isFaster: normal.isFaster,
    meetsTwentyPercentQuotaAndStorageTarget:
      normal.meetsTwentyPercentQuotaAndStorageTarget,
  },
  normalPairPlusManualValidation: {
    runnerSeconds: normal.candidate.runnerSeconds + totalSeconds,
    roundedMinutes: normal.candidate.roundedRunnerMinutes + totalMinutes,
  },
  limits: [
    "Manual full fallback is additional validation, not a replacement cheaper acceptance pair. Normal successful pair JSON remains unchanged.",
    "All passing and failed attempts must be reconciled independently of workflow conclusion. No missing capability or retry is inferred from success.",
    "Artifact bytes multiplied by configured retention are projected usage, not actual accrued account or monthly billing.",
    "Exact archive/public-file trust and final hosted acceptance remain root audit evidence; this report records actual pipeline execution.",
  ],
};
await Bun.write(
  `${folder}/cost-summary.json`,
  JSON.stringify(result, null, 2) + "\n",
);
console.log(JSON.stringify(result, null, 2));
