import { resolve } from "node:path";

// Independent expectations from the reviewed official tags and workflow blobs.
// Do not derive expected pins or conditions from the input job evidence.
const pins = {
  checkout: "3d3c42e5aac5ba805825da76410c181273ba90b1",
  mise: "7a4e45a543138629540c9a1616d08632b893e492",
  configure: "45bfe0192ca1faeb007ade9deae92b16b8254a0d",
  pagesUpload: "fc324d3547104276b827a68afc52ff2a11cc49c9",
  deploy: "368f82528645a54fb793d4d04e342629a3f51346",
  upload: "043fb46d1a93c77aae656e7c1c64a875d1fc6a0a",
};
const workflowHashes = {
  web: "67132c1065583edff041336b3731951989fa36cbf66fdccb237018c58a091854",
  pages: "3123f5b0bba0f6d0928f8f76747605babb31d6d5ace90fb473fe71cc08aa0e6f",
};
type Step = {
  name: string;
  status: string;
  conclusion: string | null;
  number: number;
  started_at: string | null;
  completed_at: string | null;
};
type Job = {
  id: number;
  run_id: number;
  run_attempt: number;
  head_sha: string;
  name: string;
  status: string;
  conclusion: string | null;
  labels: string[];
  steps: Step[];
};
type Jobs = { total_count: number; jobs: Job[] };
type Action = keyof typeof pins;
const [ciPath, pagesPath, mode, outputPath] = Bun.argv.slice(2);
const began = new Date().toISOString();
const report: Record<string, any> = {
  began,
  helperSha256: new Bun.CryptoHasher("sha256")
    .update(new Uint8Array(await Bun.file(new URL(import.meta.url)).arrayBuffer()))
    .digest("hex"),
  mode,
  environment: {
    platform: process.platform,
    arch: process.arch,
    bun: Bun.version,
  },
  inputs: { ciPath, pagesPath },
  expectedPins: pins,
  workflowHashes,
  checks: [],
  executions: [],
  conditionalObservations: [],
  diagnosticObservations: [],
  previousDirectUploadEvidence: {
    sourceHead: "eef0d51ea3ca835dfe27d7e157c6bfad1610a7b3",
    ciRun: 37288000068,
    ciAttempt: 1,
    timingArtifact: 11336030084,
    failedAttemptArtifact: 11335666301,
    evidence: "docs/qa/actions-upgrade-2026-10-05/final-ci/run.log",
    acceptance:
      "Separate retained eef timing and real flaky-success diagnostic uploads used the identical approved workflows. This invocation does not re-audit those logs/artifacts or treat them as current-head execution.",
  },
  gaps: [
    "Job evidence plus exact workflow hashes attributes named steps to pins; named steps do not independently expose an action SHA in the jobs API.",
    "The reviewed Web workflow configures UID/GID 1001 and the pinned container; actual container UID, mount ownership and checkout credential cleanup require runner logs.",
    "Timing upload success does not establish artifact contents, the failed-attempt diagnostics journey, zero retries, deployment timeout/cancellation or rollback.",
    "Source-tree/artifact digest/public bytes, complete gate attempts and hosted offline/explicit-update acceptance remain separate publication evidence.",
  ],
};
function check(name: string, passed: boolean, detail?: unknown) {
  report.checks.push({
    name,
    passed,
    ...(detail === undefined ? {} : { detail }),
  });
}
const hash = (bytes: Uint8Array) =>
  new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
function positive(value: string | undefined, name: string): number {
  const result = Number(value);
  if (!/^\d+$/.test(value || "") || !Number.isSafeInteger(result) || result < 1)
    throw new Error(`Supply a positive ${name}`);
  return result;
}
function sha(value: string | undefined, name: string): string {
  if (!/^[a-f0-9]{40}$/.test(value || ""))
    throw new Error(`Supply an exact ${name}`);
  return value!;
}
function binary(value: string | undefined, name: string): boolean {
  const supplied = value ?? "0";
  if (!["0", "1"].includes(supplied))
    throw new Error(`Supply ${name}=0 or ${name}=1`);
  return supplied === "1";
}
async function load(path: string, key: "ciJobs" | "pagesJobs"): Promise<Jobs> {
  const bytes = new Uint8Array(await Bun.file(path).arrayBuffer());
  report.inputs[key] = { path: resolve(path), sha256: hash(bytes) };
  const parsed = JSON.parse(new TextDecoder().decode(bytes));
  const result = parsed[key] || parsed;
  if (
    !Number.isSafeInteger(result.total_count) ||
    !Array.isArray(result.jobs) ||
    result.jobs.some((job: any) => !Array.isArray(job.steps))
  )
    throw new Error(`Invalid saved ${key} inventory`);
  check(`${key} complete inventory`, result.total_count === result.jobs.length);
  check(
    `${key} unique job IDs`,
    new Set(result.jobs.map((job: Job) => job.id)).size === result.jobs.length,
  );
  return result;
}
function identity(
  jobs: Jobs,
  stage: string,
  run: number,
  head: string,
  attempt: number,
) {
  check(
    `${stage} expected run/head/attempt`,
    jobs.jobs.length > 0 &&
      jobs.jobs.every(
        (job) =>
          job.run_id === run &&
          job.head_sha === head &&
          job.run_attempt === attempt &&
          job.status === "completed",
      ),
    { run, head, attempt },
  );
}
function job(jobs: Jobs, name: string, stage: string): Job | undefined {
  const found = jobs.jobs.filter((item) => item.name === name);
  check(`${stage} exactly one ${name} job`, found.length === 1);
  const value = found[0];
  check(`${stage} ${name} job succeeded`, value?.conclusion === "success");
  return value;
}
function action(
  owner: Job | undefined,
  stage: string,
  kind: Action,
  stepName: string,
) {
  const matches = owner?.steps.filter((step) => step.name === stepName) || [];
  const step = matches[0];
  const start = Date.parse(step?.started_at || ""),
    end = Date.parse(step?.completed_at || "");
  const passed =
    matches.length === 1 &&
    owner?.conclusion === "success" &&
    step?.status === "completed" &&
    step.conclusion === "success" &&
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    end >= start;
  check(`${stage} ${kind} actually succeeded`, passed);
  report.executions.push({
    stage,
    action: kind,
    pin: pins[kind],
    job: owner?.name,
    jobId: owner?.id,
    stepName,
    matches: matches.length,
    conclusion: step?.conclusion ?? "missing",
    started: step?.started_at,
    ended: step?.completed_at,
    passed,
  });
}
const runName = (repository: string, pin: string) => `Run ${repository}@${pin}`;
function common(owner: Job | undefined, stage: string) {
  action(owner, stage, "checkout", runName("actions/checkout", pins.checkout));
  action(owner, stage, "mise", runName("jdx/mise-action", pins.mise));
}
function diagnostics(owner: Job | undefined, stage: string) {
  const steps =
    owner?.steps.filter(
      (step) => step.name === "Publish failed-attempt diagnostics",
    ) || [];
  report.diagnosticObservations.push({
    stage,
    matches: steps.length,
    conclusion: steps[0]?.conclusion ?? "missing",
    acceptance:
      "Not asserted: inspect full logs/markers and artifact contents separately.",
  });
}
try {
  if (
    !ciPath ||
    !pagesPath ||
    !outputPath ||
    !["reuse", "fallback"].includes(mode)
  )
    throw new Error(
      "Usage: bun action-execution-audit.ts CI_JSON PAGES_JSON reuse|fallback OUTPUT_JSON",
    );
  // Expected identities are supplied independently by the delivery owner.
  const expected = {
    head: sha(process.env.AUDIT_HEAD_SHA, "AUDIT_HEAD_SHA"),
    main: sha(process.env.AUDIT_MERGE_SHA, "AUDIT_MERGE_SHA"),
    ciRun: positive(process.env.AUDIT_CI_RUN, "AUDIT_CI_RUN"),
    pagesRun: positive(process.env.AUDIT_PAGES_RUN, "AUDIT_PAGES_RUN"),
    ciAttempt: positive(
      process.env.AUDIT_CI_ATTEMPT || "1",
      "AUDIT_CI_ATTEMPT",
    ),
    pagesAttempt: positive(
      process.env.AUDIT_PAGES_ATTEMPT || "1",
      "AUDIT_PAGES_ATTEMPT",
    ),
    ciTiming: binary(process.env.AUDIT_CI_TIMING, "AUDIT_CI_TIMING"),
  };
  report.expected = expected;
  report.timingMode = expected.ciTiming ? "instrumented" : "ordinary";
  for (const name of ["web", "pages"] as const) {
    const file = new URL(
      `../../../../.github/workflows/${name}.yml`,
      import.meta.url,
    );
    const actual = hash(new Uint8Array(await Bun.file(file).arrayBuffer()));
    check(
      `${name} exact approved workflow bytes`,
      actual === workflowHashes[name],
      {
        actual,
        expected: workflowHashes[name],
      },
    );
  }
  const ci = await load(ciPath, "ciJobs"),
    pages = await load(pagesPath, "pagesJobs");
  identity(ci, "final gate", expected.ciRun, expected.head, expected.ciAttempt);
  identity(
    pages,
    "Pages",
    expected.pagesRun,
    expected.main,
    expected.pagesAttempt,
  );
  check("final gate exactly one job", ci.jobs.length === 1);
  const web = job(ci, "web", "final gate");
  common(web, "final gate");
  action(web, "final gate", "pagesUpload", "Upload the verified Pages build");
  const timingStepName = "Retain bounded browser timing metadata";
  if (expected.ciTiming) {
    action(web, "final gate", "upload", timingStepName);
  } else {
    const found =
      web?.steps.filter((step) => step.name === timingStepName) || [];
    const passed =
      found.length === 1 &&
      found[0].status === "completed" &&
      found[0].conclusion === "skipped";
    check("ordinary final gate direct timing upload skipped", passed);
    report.conditionalObservations.push({
      stage: "final gate",
      action: "upload",
      pin: pins.upload,
      stepName: timingStepName,
      expected: "skipped",
      matches: found.length,
      conclusion: found[0]?.conclusion ?? "missing",
      passed,
      actualExecution: false,
    });
    report.gaps.push(
      "Ordinary final gate deliberately skips direct upload-artifact v7 timing execution. The separate retained eef upload proof is historical evidence, not actual execution on this head.",
    );
  }
  diagnostics(web, "final gate");
  const prepare = job(pages, "prepare", "Pages");
  check(
    "preparation used Slim runner",
    prepare?.labels.includes("ubuntu-slim") === true,
  );
  common(prepare, "Slim preparation");
  const deploymentName = runName("actions/deploy-pages", pins.deploy);
  const executedDeploys = pages.jobs.flatMap((owner) =>
    owner.steps.filter(
      (step) => step.name === deploymentName && step.conclusion === "success",
    ),
  );
  check(
    "exactly one successful v5 deployment step",
    executedDeploys.length === 1,
  );
  if (mode === "reuse") {
    check(
      "reuse only preparation executed",
      pages.jobs.filter((owner) => owner.conclusion !== "skipped").length === 1,
    );
    action(
      prepare,
      "Slim reuse",
      "configure",
      runName("actions/configure-pages", pins.configure),
    );
    action(
      prepare,
      "Slim reuse",
      "pagesUpload",
      "Upload the verified Pages build",
    );
    action(prepare, "Slim reuse", "deploy", deploymentName);
  } else {
    check(
      "fallback exactly three executed jobs",
      pages.jobs.length === 3 &&
        pages.jobs.every((owner) => owner.conclusion === "success"),
    );
    for (const name of [
      runName("actions/configure-pages", pins.configure),
      "Upload the verified Pages build",
      deploymentName,
    ]) {
      const found = prepare?.steps.filter((step) => step.name === name) || [];
      check(
        `fallback Slim ${name} skipped`,
        found.length === 1 && found[0].conclusion === "skipped",
      );
    }
    const verify = job(pages, "verify / web", "fallback");
    common(verify, "UID1001 configured fallback");
    action(
      verify,
      "UID1001 configured fallback",
      "configure",
      runName("actions/configure-pages", pins.configure),
    );
    action(
      verify,
      "UID1001 configured fallback",
      "pagesUpload",
      "Upload the verified Pages build",
    );
    diagnostics(verify, "fallback");
    const deploy = job(pages, "deploy", "fallback");
    action(deploy, "separate fallback deployment", "deploy", deploymentName);
  }
  report.verdict = report.checks.every((item: any) => item.passed)
    ? "approved: required upgraded action steps executed successfully in the selected paths"
    : "blocked: expected upgraded action execution evidence is missing or mismatched";
} catch (error) {
  report.verdict = "blocked: action execution audit could not complete";
  report.error = error instanceof Error ? error.message : "Unknown audit error";
}
report.ended = new Date().toISOString();
if (outputPath)
  await Bun.write(outputPath, JSON.stringify(report, null, 2) + "\n");
console.log(
  JSON.stringify(
    {
      verdict: report.verdict,
      began,
      ended: report.ended,
      failedChecks: report.checks.filter((item: any) => !item.passed),
      error: report.error,
    },
    null,
    2,
  ),
);
if (!String(report.verdict).startsWith("approved:")) process.exitCode = 1;
