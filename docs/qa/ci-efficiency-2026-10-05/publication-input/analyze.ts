// Read-only analysis of saved gh snapshots; no network, build or test execution.
export {};
const root = import.meta.dir;
const read = (name: string) => Bun.file(`${root}/${name}`).json();
const metric = await Bun.file(`${root}/../ci-efficiency-current.json`).json();
const historicalLog = await Bun.file(`${root}/37131749773.log`).text();
const missingArtifactLines = historicalLog
  .split("\n")
  .filter(
    (line) =>
      line.startsWith("build\t") &&
      /retention-days: 14|Uploaded bytes 220772|Final size is 220772 bytes|Artifact ID is 11276513957/.test(
        line,
      ),
  );
if (
  !missingArtifactLines.some((line) => line.includes("retention-days: 14")) ||
  !missingArtifactLines.some((line) =>
    line.includes("Artifact ID is 11276513957"),
  )
)
  throw new Error("Historical missing artifact evidence is incomplete");
const baselinePagesArtifacts = await read("37131749773-artifacts.json");
if (
  baselinePagesArtifacts.artifacts.some(
    (a: { id: number }) => a.id === 11276513957,
  )
)
  throw new Error(
    "Missing historical artifact is now in API; avoid double counting",
  );
const missingArtifact = {
  id: 11276513957,
  name: "github-pages",
  bytes: 220772,
  configuredRetentionHours: 14 * 24,
  projectedByteHours: 220772 * 14 * 24,
  source:
    "Original Pages build upload log, absent from surviving artifacts API",
};
const fullOriginalBaselineByteHours =
  metric.baseline.projectedArtifactByteHours +
  missingArtifact.projectedByteHours;
const percent = (before: number, after: number) => (1 - after / before) * 100;
const experimentIds = [
  37269816926, 37270362546, 37272392986, 37273144333, 37274080414,
];
const experiments = await Promise.all(
  experimentIds.map(async (id) => {
    const [run, jobs, artifacts] = await Promise.all([
      read(`${id}-run.json`),
      read(`${id}-jobs.json`),
      read(`${id}-artifacts.json`),
    ]);
    if (
      jobs.total_count !== jobs.jobs.length ||
      artifacts.total_count !== artifacts.artifacts.length
    )
      throw new Error(`Partial API inventory: ${id}`);
    const runnerJobs = jobs.jobs.filter(
      (j: { conclusion: string }) => j.conclusion !== "skipped",
    );
    const seconds = runnerJobs.map(
      (j: { started_at: string; completed_at: string }) =>
        (Date.parse(j.completed_at) - Date.parse(j.started_at)) / 1000,
    );
    return {
      id,
      head: run.head_sha,
      event: run.event,
      conclusion: run.conclusion,
      runnerSeconds: seconds.reduce((a: number, b: number) => a + b, 0),
      roundedMinutes: seconds.reduce(
        (a: number, b: number) => a + Math.ceil(b / 60),
        0,
      ),
      artifactProjectedByteHours: artifacts.artifacts.reduce(
        (
          sum: number,
          a: { size_in_bytes: number; created_at: string; expires_at: string },
        ) =>
          sum +
          (a.size_in_bytes *
            (Date.parse(a.expires_at) - Date.parse(a.created_at))) /
            3600000,
        0,
      ),
      artifacts: artifacts.artifacts.map(
        (a: { id: number; name: string; size_in_bytes: number }) => ({
          id: a.id,
          name: a.name,
          bytes: a.size_in_bytes,
        }),
      ),
    };
  }),
);
const analysis = {
  analyzedAt: new Date().toISOString(),
  strictExitCode: Number(await Bun.file(`${root}/strict-exit-code.txt`).text()),
  baselineSurvivingAPI: {
    runnerSeconds: metric.baseline.runnerSeconds,
    roundedMinutes: metric.baseline.roundedRunnerMinutes,
    projectedByteHours: metric.baseline.projectedArtifactByteHours,
  },
  candidateSuccessfulPair: {
    runnerSeconds: metric.candidate.runnerSeconds,
    roundedMinutes: metric.candidate.roundedRunnerMinutes,
    projectedByteHours: metric.candidate.projectedArtifactByteHours,
    reductions: metric.reductions,
  },
  missingOriginalArtifact: missingArtifact,
  originalFullArtifactProjection: {
    baselineProjectedByteHours: fullOriginalBaselineByteHours,
    candidateProjectedByteHours: metric.candidate.projectedArtifactByteHours,
    reductionPercent: percent(
      fullOriginalBaselineByteHours,
      metric.candidate.projectedArtifactByteHours,
    ),
    note: "Adds only the log-proven missing Pages artifact. Surviving artifacts retain actual API expiration-hour fractions. Original nominal 14-day all-artifact baseline separately equals 441169680 byte-hours.",
  },
  experimentsExcludedFromSuccessfulPair: experiments,
  additionalExperimentTotals: {
    runnerSeconds: experiments.reduce((a, b) => a + b.runnerSeconds, 0),
    roundedMinutes: experiments.reduce((a, b) => a + b.roundedMinutes, 0),
    artifactProjectedByteHours: experiments.reduce(
      (a, b) => a + b.artifactProjectedByteHours,
      0,
    ),
  },
  pairPlusTheseExperiments: {
    runnerSeconds:
      metric.candidate.runnerSeconds +
      experiments.reduce((a, b) => a + b.runnerSeconds, 0),
    roundedMinutes:
      metric.candidate.roundedRunnerMinutes +
      experiments.reduce((a, b) => a + b.roundedMinutes, 0),
  },
  limits: [
    "Pair is one successful PR/main sample. Baseline browser inventory was 68 plus subpath; current is 258 configured plus subpath. Expansion is explicit, no monthly/account-wide inference.",
    "Five earlier same-branch PR37 experiment runs add real cost and are excluded from the successful-pair acceptance metric, not erased. Every observed artifact including diagnostics is counted.",
    "Manual complete fallback validation has not yet been supplied; its cost will be a separate appended record.",
    "This is not a complete account investigation cost total: older reports, other PRs, canceled jobs, local reviews and future runs are not enumerated here.",
  ],
};
await Bun.write(
  `${root}/historical-missing-artifact.log`,
  missingArtifactLines.join("\n") + "\n",
);
await Bun.write(
  `${root}/analysis.json`,
  JSON.stringify(analysis, null, 2) + "\n",
);
console.log(JSON.stringify(analysis, null, 2));
