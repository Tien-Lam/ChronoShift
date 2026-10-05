import { mkdtemp, mkdir, readdir, lstat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const repository = "Tien-Lam/ChronoShift",
  api = "repos/" + repository;
const expectedHead = "9c7965acfbcbe034471ad427625eb624792812eb";
const ciRunId = "37268219679";
const mergeSha = process.env.AUDIT_MERGE_SHA;
const pagesRunId = process.env.AUDIT_PAGES_RUN;
const expectedRelease = process.env.AUDIT_RELEASE_SHA;
if (!/^[a-f0-9]{40}$/.test(mergeSha || "") || !/^\d+$/.test(pagesRunId || ""))
  throw Error("Supply AUDIT_MERGE_SHA and AUDIT_PAGES_RUN");
const evidence: any = {
  began: new Date().toISOString(),
  environment: {
    platform: process.platform,
    arch: process.arch,
    bun: Bun.version,
  },
  repository,
  expectedHead,
  ciRunId,
  initialCandidate: {
    head: "a565ed03095022f14b827d270564fd6da1d5c23a",
    ciRunId: "37266848464",
    outcome: "superseded/canceled by console-hook review fix",
  },
  retainedFailure: {
    head: "842b89d89758a0361915221c6b541deff5257a49",
    ciRunId: "37266977058",
    outcome:
      "failed both attempts of iPhone timezone recovery; retained trace established hover/Tab cause, fixed in final head",
    artifactId: 11326857491,
    zipSha256:
      "a9264148787132933f3223b254fd4b0847228bbcdfeeb81e70b4fa236747fcb8",
  },
  mergeSha,
  pagesRunId,
  expectedRelease:
    expectedRelease || "derived independently from downloaded release.json",
  commands: [],
  checks: [],
  gaps: [],
};
const output = new URL("./publication-audit.json", import.meta.url).pathname;
const scratch = await mkdtemp(
  join(tmpdir(), "chronoshift-independent-publication-"),
);
evidence.scratch = scratch;
function verify(name: string, condition: boolean, detail?: any) {
  evidence.checks.push({ name, passed: condition, detail });
  if (!condition) throw Error(name);
}
async function command(args: string[], allowFailure = false) {
  const began = new Date().toISOString();
  const p = Bun.spawn(args, { stdout: "pipe", stderr: "pipe" });
  const [bytes, error, code] = await Promise.all([
    new Response(p.stdout).arrayBuffer(),
    new Response(p.stderr).text(),
    p.exited,
  ]);
  evidence.commands.push({
    args,
    began,
    ended: new Date().toISOString(),
    code,
    ...(error ? { stderr: error } : {}),
  });
  if (code && !allowFailure)
    throw Error(args.slice(0, 3).join(" ") + " failed " + error);
  return { bytes: new Uint8Array(bytes), code };
}
async function gh(path: string) {
  return JSON.parse(
    new TextDecoder().decode((await command(["gh", "api", path])).bytes),
  );
}
async function ghOptional(path: string) {
  const result = await command(["gh", "api", path], true);
  return {
    exitCode: result.code,
    value: JSON.parse(new TextDecoder().decode(result.bytes)),
  };
}
const hash = (bytes: Uint8Array) =>
  new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
async function tree(sha: string) {
  const commit = await gh(api + "/commits/" + sha);
  return {
    ref: sha,
    sha: commit.sha,
    tree: commit.commit.tree.sha,
    parents: commit.parents.map((parent: any) => parent.sha),
  };
}
async function inventory(folder: string, prefix = ""): Promise<any[]> {
  const items = [];
  for (const entry of await readdir(join(folder, prefix), {
    withFileTypes: true,
  })) {
    const path = prefix + entry.name;
    const details = await lstat(join(folder, path));
    verify(
      "extracted member regular or directory " + path,
      details.isFile() || details.isDirectory(),
    );
    if (details.isDirectory())
      items.push(...(await inventory(folder, path + "/")));
    else {
      const bytes = new Uint8Array(
        await Bun.file(join(folder, path)).arrayBuffer(),
      );
      items.push({ path, bytes: bytes.length, sha256: hash(bytes) });
    }
  }
  return items.sort((a, b) => a.path.localeCompare(b.path));
}
async function artifact(runId: string, label: string) {
  const list = await gh(
    api + "/actions/runs/" + runId + "/artifacts?per_page=100",
  );
  verify(
    label + " artifact list complete",
    list.total_count === list.artifacts.length,
  );
  const candidates = list.artifacts.filter(
    (item: any) => item.name === "github-pages",
  );
  verify(label + " exactly one Pages artifact", candidates.length === 1);
  const meta = candidates[0];
  verify(
    label + " nonexpired digest metadata",
    !meta.expired &&
      /^sha256:[a-f0-9]{64}$/.test(meta.digest) &&
      meta.size_in_bytes < 8000000,
    meta,
  );
  const archive = join(scratch, label + ".zip");
  const zip = (
    await command(["gh", "api", api + "/actions/artifacts/" + meta.id + "/zip"])
  ).bytes;
  verify(
    label + " zip digest matches GitHub",
    "sha256:" + hash(zip) === meta.digest,
    { actual: "sha256:" + hash(zip), bytes: zip.length, expected: meta.digest },
  );
  await Bun.write(archive, zip);
  const outer = new TextDecoder()
    .decode((await command(["unzip", "-Z1", archive])).bytes)
    .trim()
    .split("\n");
  verify(
    label + " single artifact.tar wrapper",
    outer.length === 1 && outer[0] === "artifact.tar",
    outer,
  );
  const tar = join(scratch, label + ".tar");
  const bytes = (await command(["unzip", "-p", archive, "artifact.tar"])).bytes;
  verify(label + " bounded tar", bytes.length < 10000000, {
    bytes: bytes.length,
    sha256: hash(bytes),
  });
  await Bun.write(tar, bytes);
  const paths = new TextDecoder()
    .decode((await command(["tar", "-tf", tar])).bytes)
    .trim()
    .split("\n");
  const entries = new TextDecoder()
    .decode((await command(["tar", "-tvf", tar])).bytes)
    .trim()
    .split("\n");
  const normalized = paths.map((path) => path.replace(/\/$/, ""));
  verify(
    label + " safe unique tar names",
    paths.length > 0 &&
      new Set(normalized).size === paths.length &&
      paths.every(
        (path) =>
          path.startsWith("./") &&
          !/[\r\n\\\0]/.test(path) &&
          !path.split("/").some((part) => part === ".."),
      ),
    paths,
  );
  verify(
    label + " no tar links or special entries",
    entries.length === paths.length &&
      entries.every((entry) => entry[0] === "-" || entry[0] === "d"),
    entries,
  );
  const destination = join(scratch, label);
  await mkdir(destination);
  await command(["tar", "-xf", tar, "-C", destination]);
  const files = await inventory(destination);
  const release = await Bun.file(join(destination, "release.json")).json();
  return {
    meta,
    zipSha256: hash(zip),
    tarSha256: hash(bytes),
    paths,
    entries,
    files,
    release,
    destination,
  };
}
try {
  const [repo, workflow, ci, pages, pr, headChecks, requiredPolicy] =
    await Promise.all([
      gh(api),
      gh(api + "/actions/workflows/web.yml"),
      gh(api + "/actions/runs/" + ciRunId),
      gh(api + "/actions/runs/" + pagesRunId),
      gh(api + "/pulls/36"),
      gh(api + "/commits/" + expectedHead + "/check-runs?per_page=100"),
      ghOptional(api + "/branches/main/protection/required_status_checks"),
    ]);
  evidence.repositoryId = repo.id;
  evidence.workflow = { id: workflow.id, path: workflow.path };
  const compact = (run: any) => ({
    id: run.id,
    name: run.name,
    path: run.path,
    event: run.event,
    status: run.status,
    conclusion: run.conclusion,
    head_sha: run.head_sha,
    head_branch: run.head_branch,
    workflow_id: run.workflow_id,
    repositoryId: run.head_repository?.id,
    created_at: run.created_at,
    updated_at: run.updated_at,
    html_url: run.html_url,
    run_attempt: run.run_attempt,
  });
  evidence.ci = compact(ci);
  evidence.pages = compact(pages);
  evidence.pr = {
    number: pr.number,
    state: pr.state,
    merged: pr.merged,
    merge_commit_sha: pr.merge_commit_sha,
    head: pr.head.sha,
    headRepositoryId: pr.head.repo?.id,
    base: pr.base.ref,
  };
  evidence.requiredStatusPolicy = requiredPolicy;
  verify(
    "trusted complete successful Web PR run",
    ci.id === Number(ciRunId) &&
      ci.path === ".github/workflows/web.yml" &&
      ci.event === "pull_request" &&
      ci.status === "completed" &&
      ci.conclusion === "success" &&
      ci.head_sha === expectedHead &&
      ci.workflow_id === workflow.id &&
      ci.head_repository?.id === repo.id,
  );
  verify(
    "successful main Pages push",
    pages.path === ".github/workflows/pages.yml" &&
      pages.event === "push" &&
      pages.status === "completed" &&
      pages.conclusion === "success" &&
      pages.head_branch === "main" &&
      pages.head_sha === mergeSha &&
      pages.head_repository?.id === repo.id,
  );
  verify(
    "PR merged exactly the reviewed candidate",
    pr.merged &&
      pr.head.sha === expectedHead &&
      pr.head.repo?.id === repo.id &&
      pr.base.ref === "main" &&
      pr.merge_commit_sha === mergeSha,
  );
  const [
    ciJobs,
    pagesJobs,
    headTree,
    mergeTree,
    mainTree,
    ciArtifact,
    pagesArtifact,
  ] = await Promise.all([
    gh(api + "/actions/runs/" + ciRunId + "/jobs?per_page=100"),
    gh(api + "/actions/runs/" + pagesRunId + "/jobs?per_page=100"),
    tree(expectedHead),
    tree(mergeSha!),
    tree("main"),
    artifact(ciRunId, "ci"),
    artifact(pagesRunId!, "pages"),
  ]);
  evidence.ciJobs = ciJobs;
  evidence.pagesJobs = pagesJobs;
  evidence.headChecks = headChecks;
  verify(
    "complete CI job inventory",
    ciJobs.total_count === ciJobs.jobs.length,
  );
  const required = [
    "Run bun run format:check",
    "Unit tests and production build",
    "Verify the standalone conversion corpus audit",
    "Run bun run test:browser",
    "Verify repository-subpath deployment",
    "Upload the verified Pages build",
  ];
  const web = ciJobs.jobs.find((job: any) => job.name === "web");
  verify(
    "all full gate steps success",
    web?.conclusion === "success" &&
      required.every((name) =>
        web.steps.some(
          (step: any) => step.name === name && step.conclusion === "success",
        ),
      ),
    required.map((name) => ({
      name,
      step: web?.steps.find((step: any) => step.name === name),
    })),
  );
  verify(
    "candidate successful Web check present",
    headChecks.total_count === headChecks.check_runs.length &&
      headChecks.check_runs.some(
        (check: any) =>
          check.name === "web" &&
          check.conclusion === "success" &&
          check.status === "completed" &&
          check.details_url.includes("/runs/" + ciRunId + "/"),
      ),
  );
  if (requiredPolicy.exitCode === 0) {
    for (const check of requiredPolicy.value.checks || [])
      verify(
        "branch-required check " + check.context,
        headChecks.check_runs.some(
          (item: any) =>
            item.name === check.context && item.conclusion === "success",
        ),
      );
  } else
    evidence.gaps.push(
      "main has no branch-protection required status checks (HTTP404 Branch not protected); full named gate steps and Web check independently verified.",
    );
  verify(
    "complete Pages job inventory",
    pagesJobs.total_count === pagesJobs.jobs.length,
  );
  const prep = pagesJobs.jobs.find((job: any) => job.name === "prepare"),
    deploy = pagesJobs.jobs.find((job: any) => job.name === "deploy");
  verify(
    "prepare and deploy succeeded",
    prep?.conclusion === "success" && deploy?.conclusion === "success",
  );
  const log = new TextDecoder().decode(
    (
      await command([
        "gh",
        "run",
        "view",
        pagesRunId!,
        "--repo",
        repository,
        "--log",
      ])
    ).bytes,
  );
  const reuse = log
    .split("\n")
    .filter((line) => line.includes("Reusing verified Web run"));
  evidence.reuseLog = reuse;
  verify(
    "Pages logs exact trusted artifact reuse",
    reuse.some(
      (line) =>
        line.includes("run " + ciRunId + ",") &&
        line.includes("tree " + headTree.tree),
    ),
  );
  evidence.artifacts = { ci: ciArtifact, pages: pagesArtifact };
  verify(
    "CI and Pages extracted file inventories match",
    JSON.stringify(ciArtifact.files) === JSON.stringify(pagesArtifact.files),
  );
  verify(
    "CI and Pages release metadata match",
    JSON.stringify(ciArtifact.release) ===
      JSON.stringify(pagesArtifact.release),
  );
  verify(
    "release expected base and source shape",
    ciArtifact.release.base === "/ChronoShift/" &&
      /^[a-f0-9]{40}$/.test(ciArtifact.release.sourceCommit),
  );
  if (expectedRelease)
    verify(
      "release matches explicitly expected source",
      ciArtifact.release.sourceCommit === expectedRelease,
    );
  const tested = await tree(ciArtifact.release.sourceCommit);
  evidence.trees = { head: headTree, merge: mergeTree, main: mainTree, tested };
  verify(
    "reviewed head tested release merge and current main exact trees",
    headTree.tree === mergeTree.tree &&
      headTree.tree === mainTree.tree &&
      headTree.tree === tested.tree,
    evidence.trees,
  );
  const root = "https://tien-lam.github.io/ChronoShift/";
  const token = Date.now().toString();
  const live = await Promise.all(
    pagesArtifact.files.map(async (file: any) => {
      const url = root + file.path + "?publication-audit=" + token;
      const response = await fetch(url, { cache: "no-store" });
      const body = new Uint8Array(await response.arrayBuffer());
      const record = {
        path: file.path,
        url: response.url,
        status: response.status,
        contentType: response.headers.get("content-type"),
        cacheControl: response.headers.get("cache-control"),
        sha256: hash(body),
        bytes: body.length,
        expectedSha256: file.sha256,
        expectedBytes: file.bytes,
        matched:
          response.ok &&
          hash(body) === file.sha256 &&
          body.length === file.bytes,
      };
      return record;
    }),
  );
  evidence.publicFiles = live;
  verify(
    "every public artifact file exact bytes",
    live.every((file) => file.matched),
    live,
  );
  const response = await fetch(root + "?publication-audit=" + token, {
    cache: "no-store",
  });
  const body = new Uint8Array(await response.arrayBuffer());
  const index = pagesArtifact.files.find(
    (file: any) => file.path === "index.html",
  );
  evidence.publicRoot = {
    status: response.status,
    sha256: hash(body),
    expected: index.sha256,
    bytes: body.length,
  };
  verify(
    "public root exact index bytes",
    response.ok && hash(body) === index.sha256,
  );
  evidence.verdict =
    "approved: exact trusted tested artifact and reviewed source tree deployed";
  evidence.gaps.push(
    "This audit establishes byte/source/workflow identity only; hosted behavior, browser lifecycle/device acceptance remain in separate evidence.",
  );
} catch (error) {
  evidence.verdict = "audit failed";
  evidence.error = String(error);
  process.exitCode = 1;
}
evidence.ended = new Date().toISOString();
await Bun.write(output, JSON.stringify(evidence, null, 2));
console.log(
  JSON.stringify(
    {
      began: evidence.began,
      ended: evidence.ended,
      verdict: evidence.verdict,
      error: evidence.error,
      checks: evidence.checks.map(({ name, passed }: any) => ({
        name,
        passed,
      })),
      trees: evidence.trees,
      publicFiles: evidence.publicFiles?.map(({ path, matched }: any) => ({
        path,
        matched,
      })),
      gaps: evidence.gaps,
    },
    null,
    2,
  ),
);
