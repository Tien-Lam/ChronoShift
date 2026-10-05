// Offline reconciliation of saved gh evidence. No GitHub mutations or tests.
import { execFileSync } from "node:child_process";
const folder = import.meta.dir;
const repo = "/Users/tien/Developer/ChronoShift";
const head = "a868e4b956caf5d227edc430fc7dca97c0dc2eb6";
const previous = "eef0d51ea3ca835dfe27d7e157c6bfad1610a7b3";
const approvedApp = "35e11bac657a0c379fda48af9b454e674d2ea854";
const git = (...args: string[]) =>
  execFileSync("git", args, { cwd: repo, encoding: "utf8" }).trim();
const read = (name: string) => Bun.file(`${folder}/${name}`).json();
const run = await read("run.json"),
  jobs = await read("jobs.json"),
  artifacts = await read("artifacts.json"),
  tested = await read("tested-source-commit.json");
const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
const log = strip(await Bun.file(`${folder}/run.log`).text());
function attempts(raw: string) {
  return strip(raw)
    .split("\n")
    .flatMap((line) => {
      const m = line.match(
        /\s([✓×✘-])\s+(\d+)\s+\[([^\]]+)\]\s+›\s+(.+?):(\d+):(\d+)\s+›\s+(.+)/,
      );
      if (!m) return [];
      // gh renders reusable workflow log steps as UNKNOWN STEP here. Identify
      // real list rows directly and exclude the separately gated subpath case.
      if (m[4] === "e2e/subpath.spec.ts") return [];
      const tail = m[7].trim().replace(/\s+\(\d+(?:\.\d+)?(?:ms|s|m)\)$/, "");
      const retry = Number(tail.match(/retry #(\d+)/)?.[1] ?? 0);
      return [
        {
          symbol: m[1],
          ordinal: Number(m[2]),
          project: m[3],
          file: m[4],
          line: Number(m[5]),
          title: tail.replace(/\s*\(retry #\d+\)/, ""),
          retry,
          rawLine: line,
        },
      ];
    });
}
const rows = attempts(log);
const prior = attempts(
  await Bun.file(
    `${repo}/docs/qa/actions-upgrade-2026-10-05/final-ci/run.log`,
  ).text(),
).filter((row) => !row.retry);
const finalCases = attempts(
  await Bun.file(
    `${repo}/docs/qa/copy-focus-2026-10-05/final-ci/run.log`,
  ).text(),
);
const key = (row: any) => JSON.stringify([row.project, row.file, row.title]);
const titles = [
  ...git("show", `${head}:e2e/copy-focus.spec.ts`).matchAll(
    /^test\("([^"]+)"/gm,
  ),
].map((m) => m[1]);
const projects = [
  "chromium",
  "firefox",
  "webkit",
  "android-emulation",
  "iphone-emulation",
];
const added = projects.flatMap((project) =>
  titles.map((title) =>
    key({ project, file: "e2e/copy-focus.spec.ts", title }),
  ),
);
const expected = new Set([...prior.map(key), ...added]);
const inventory = new Set(rows.map(key));
const byProject: Record<
  string,
  { passed: number; skipped: number; failed: number; retries: number }
> = {};
for (const row of rows) {
  const p = (byProject[row.project] ??= {
    passed: 0,
    skipped: 0,
    failed: 0,
    retries: 0,
  });
  p[
    row.symbol === "✓" ? "passed" : row.symbol === "-" ? "skipped" : "failed"
  ]++;
  if (row.retry) p.retries++;
}
const activeJobs = jobs.jobs
  .filter((job: any) => job.conclusion !== "skipped")
  .map((job: any) => ({
    id: job.id,
    name: job.name,
    conclusion: job.conclusion,
    startedAt: job.started_at,
    completedAt: job.completed_at,
    seconds: (Date.parse(job.completed_at) - Date.parse(job.started_at)) / 1000,
    roundedMinutes: Math.ceil(
      (Date.parse(job.completed_at) - Date.parse(job.started_at)) / 60000,
    ),
    beforeFirstStepSeconds:
      (Date.parse(job.steps[0].started_at) - Date.parse(job.started_at)) / 1000,
    steps: job.steps.map((step: any) => ({
      name: step.name,
      conclusion: step.conclusion,
      startedAt: step.started_at,
      completedAt: step.completed_at,
      seconds:
        step.conclusion === "skipped"
          ? null
          : (Date.parse(step.completed_at) - Date.parse(step.started_at)) /
            1000,
    })),
  }));
const web = activeJobs.find((job: any) => job.name === "verify / web");
const required = [
  "Run actions/configure-pages@45bfe0192ca1faeb007ade9deae92b16b8254a0d",
  "Run actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
  "Capture the checked-in corpus audit",
  "Run jdx/mise-action@7a4e45a543138629540c9a1616d08632b893e492",
  "Run bun install --frozen-lockfile",
  "Verify the pinned browser image matches the dependency",
  "Run bun run format:check",
  "Unit tests and production build",
  "Verify the standalone conversion corpus audit",
  "Run bun run test:browser",
  "Record browser resource usage",
  "Verify repository-subpath deployment",
  "Upload the verified Pages build",
];
const gates = required.map((name) => ({
  name,
  conclusion:
    web?.steps.find((step: any) => step.name === name)?.conclusion ?? "missing",
}));
const paths = [
  "web",
  "e2e",
  "tests",
  "scripts",
  "playwright.config.ts",
  "playwright.subpath.config.ts",
  "package.json",
  "bun.lock",
  ".github/dependabot.yml",
  ".github/workflows/web.yml",
  ".github/workflows/pages.yml",
];
const identities = paths.map((path) => ({
  path,
  previous: git("rev-parse", `${previous}:${path}`),
  head: git("rev-parse", `${head}:${path}`),
}));
const resources = [...log.matchAll(/\[ci-environment\]\s+(\{[^\n]+\})/g)].map(
  (m) => JSON.parse(m[1]),
);
const before = resources.find((row) => row.phase === "before"),
  after = resources.find((row) => row.phase === "after");
const counters = (raw: string) =>
  Object.fromEntries(
    raw.split("\n").flatMap((line) => {
      const m = line.match(/^([A-Za-z0-9_.]+)\s+(\d+)$/);
      return m ? [[m[1], Number(m[2])]] : [];
    }),
  );
const delta = (name: string) => {
  if (!before || !after) return null;
  const b = counters(before.cgroup[name]),
    a = counters(after.cgroup[name]);
  return Object.fromEntries(
    Object.keys(a).map((key) => [key, a[key] - (b[key] ?? 0)]),
  );
};
const flags = log
  .split("\n")
  .filter((line) => /CHRONOSHIFT_CI_TIMING:/.test(line));
const summary = {
  observedAt: new Date().toISOString(),
  run: {
    id: run.id,
    attempt: run.run_attempt,
    head: run.head_sha,
    event: run.event,
    status: run.status,
    conclusion: run.conclusion,
    createdAt: run.created_at,
    updatedAt: run.updated_at,
    url: run.html_url,
  },
  jobs: activeJobs,
  totalJobSeconds: activeJobs.reduce(
    (total: number, job: any) => total + job.seconds,
    0,
  ),
  totalRoundedMinutes: activeJobs.reduce(
    (total: number, job: any) => total + job.roundedMinutes,
    0,
  ),
  allActiveJobsSuccessful: activeJobs.every(
    (job: any) => job.conclusion === "success",
  ),
  manualBranches: {
    prepareSteps: activeJobs.find((job: any) => job.name === "prepare")?.steps,
    deploySteps: activeJobs.find((job: any) => job.name === "deploy")?.steps,
  },
  gates,
  allRequiredGatesSuccessful: gates.every((g) => g.conclusion === "success"),
  browser: {
    attempts: rows.length,
    distinctCases: inventory.size,
    firstPasses: rows.filter((row) => row.symbol === "✓" && !row.retry).length,
    skipped: rows.filter((row) => row.symbol === "-").length,
    failed: rows.filter((row) => row.symbol === "×" || row.symbol === "✘")
      .length,
    retries: rows.filter((row) => row.retry).length,
    byProject,
    expectedCases: expected.size,
    originalCaseCount: new Set(prior.map(key)).size,
    addedCases: added.length,
    titles,
    missingCases: [...expected].filter((id) => !inventory.has(id)),
    extraCases: [...inventory].filter((id) => !expected.has(id)),
    sameSkipIdentities:
      JSON.stringify(
        rows
          .filter((row) => row.symbol === "-")
          .map(key)
          .sort(),
      ) ===
      JSON.stringify(
        prior
          .filter((row) => row.symbol === "-")
          .map(key)
          .sort(),
      ),
    sameInventoryAsFinalCI:
      JSON.stringify([...inventory].sort()) ===
      JSON.stringify([...new Set(finalCases.map(key))].sort()),
  },
  unitEvidence: log
    .split("\n")
    .filter((line) => /\d+ pass$|\d+ fail$|Ran \d+ tests/.test(line)),
  browserSummaryEvidence: log
    .split("\n")
    .filter((line) => /264 passed \(|9 skipped|Running 273 tests/.test(line)),
  subpathEvidence: log.split("\n").filter((line) => /\b1 passed \(/.test(line)),
  timingFlagEvidence: flags,
  timingDisabled:
    flags.length > 0 &&
    flags.every((line) => /CHRONOSHIFT_CI_TIMING: 0$/.test(line)),
  containerUserEvidence: log
    .split("\n")
    .filter(
      (line) => /docker create/.test(line) && /--user 1001:1001/.test(line),
    ),
  timingArtifactStep: web?.steps.find(
    (step: any) => step.name === "Retain bounded browser timing metadata",
  ),
  failureDiagnosticStep: web?.steps.find(
    (step: any) => step.name === "Publish failed-attempt diagnostics",
  ),
  totalArtifactCount: artifacts.total_count,
  artifacts: artifacts.artifacts.map((a: any) => ({
    ...a,
    nominalRetentionHours: a.name.startsWith("chronoshift-web-failure")
      ? 72
      : 336,
    nominalProjectedByteHours:
      a.size_in_bytes *
      (a.name.startsWith("chronoshift-web-failure") ? 72 : 336),
  })),
  source: {
    head,
    expectedTree: "44a2096e710983603a85193c2cd33c05461145cb",
    headTree: git("rev-parse", `${head}^{tree}`),
    testedCommit: tested.sha,
    testedTree: tested.tree.sha,
    testedShaInCheckoutLog: log.includes(tested.sha),
    identities,
    approvedApp,
    approvedAppWebTree: git("rev-parse", `${approvedApp}:web`),
    finalWebTree: git("rev-parse", `${head}:web`),
    workflowBytesUnchanged: identities
      .filter((x) => x.path.startsWith(".github/workflows"))
      .every((x) => x.previous === x.head),
    nonDocsDelta: git(
      "diff",
      "--name-only",
      previous,
      head,
      "--",
      ".github",
      "e2e",
      "web",
      "tests",
      "scripts",
      "package.json",
      "bun.lock",
      "playwright.config.ts",
      "playwright.subpath.config.ts",
    ).split("\n"),
    finalTestSha256: new Bun.CryptoHasher("sha256")
      .update(git("show", `${head}:e2e/copy-focus.spec.ts`) + "\n")
      .digest("hex"),
  },
  resource: {
    records: resources,
    bracketSeconds:
      before && after
        ? (Date.parse(after.at) - Date.parse(before.at)) / 1000
        : null,
    cpuDelta: delta("cpu.stat"),
    memoryEventsDelta: delta("memory.events"),
  },
  limitations: [
    "Job spans and rounded minutes are proxies, not account billing or complete paired publication.",
    "Nominal artifact byte-hours do not establish actual storage billing or expiration.",
    "Root owns artifact extraction/public verification; no publication claimed here.",
    "Ordinary mode intentionally has no structured timing artifact or green marker file. Full raw attempt inventory and skipped diagnostic branch supply bounded retry/marker evidence.",
    "No causal performance or TIE375 acceptance claim; workload grew by fifteen regression cases.",
  ],
};
await Bun.write(
  `${folder}/attempts.json`,
  JSON.stringify(
    { observedAt: summary.observedAt, run: summary.run, evidence: rows },
    null,
    2,
  ),
);
await Bun.write(`${folder}/summary.json`, JSON.stringify(summary, null, 2));
console.log(
  JSON.stringify(
    {
      ...summary,
      timingFlagEvidence: undefined,
      resource: { ...summary.resource, records: undefined },
    },
    null,
    2,
  ),
);
if (
  run.id !== Number(process.argv[2]) ||
  run.event !== "workflow_dispatch" ||
  !summary.allActiveJobsSuccessful ||
  run.head_sha !== head ||
  run.conclusion !== "success" ||
  !summary.allRequiredGatesSuccessful ||
  rows.length !== 273 ||
  summary.browser.firstPasses !== 264 ||
  summary.browser.skipped !== 9 ||
  summary.browser.failed ||
  summary.browser.retries ||
  summary.browser.missingCases.length ||
  summary.browser.extraCases.length ||
  !summary.browser.sameSkipIdentities ||
  !summary.browser.sameInventoryAsFinalCI ||
  !summary.containerUserEvidence.length ||
  !summary.timingDisabled ||
  summary.source.testedTree !== summary.source.headTree ||
  summary.source.expectedTree !== summary.source.headTree ||
  !summary.source.testedShaInCheckoutLog ||
  !summary.source.workflowBytesUnchanged ||
  summary.source.approvedAppWebTree !== summary.source.finalWebTree ||
  summary.timingArtifactStep?.conclusion !== "skipped" ||
  summary.failureDiagnosticStep?.conclusion !== "skipped"
)
  process.exitCode = 1;
