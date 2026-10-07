import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

type Run = {
  id: number;
  workflow_id: number;
  path: string;
  event: string;
  status: string;
  conclusion: string;
  head_sha: string;
  head_repository: { id: number };
};
type Job = {
  name: string;
  conclusion: string;
  steps: { name: string; conclusion: string }[];
};
type Artifact = {
  id: number;
  name: string;
  expired: boolean;
  size_in_bytes: number;
  digest: string;
};
const requiredSteps = [
  "Run bun run format:check",
  "Unit tests and production build",
  "Verify the standalone conversion corpus audit",
  "Run bun run test:browser",
  "Preserve the verified root build",
  "Verify repository-subpath deployment",
  "Restore the verified root build",
  "Upload the verified static build",
];

export function trustedRun(
  run: Run,
  repositoryId: number,
  workflowId: number,
  jobs: Job[],
): boolean {
  return (
    run.workflow_id === workflowId &&
    run.path === ".github/workflows/web.yml" &&
    run.event === "pull_request" &&
    run.status === "completed" &&
    run.conclusion === "success" &&
    run.head_repository?.id === repositoryId &&
    /^[a-f0-9]{40}$/.test(run.head_sha) &&
    jobs.some(
      (job) =>
        job.name === "web" &&
        job.conclusion === "success" &&
        requiredSteps.every((name) =>
          job.steps.some(
            (step) => step.name === name && step.conclusion === "success",
          ),
        ),
    )
  );
}
export function safeArchive(paths: string[], entries: string[]): boolean {
  return (
    paths.length > 0 &&
    paths.every(
      (path) =>
        path.startsWith("./") &&
        !path.split("/").some((part) => part === "..") &&
        !/[\r\n\\]/.test(path),
    ) &&
    entries.length === paths.length &&
    entries.every((entry) => entry.startsWith("-") || entry.startsWith("d"))
  );
}
export function releaseMatches(
  release: { sourceCommit?: string; base?: string },
  sourceTree: string,
  expectedTree: string,
): boolean {
  return (
    /^[a-f0-9]{40}$/.test(release.sourceCommit || "") &&
    release.base === "/" &&
    /^[a-f0-9]{40}$/.test(expectedTree) &&
    sourceTree === expectedTree
  );
}
async function command(args: string[], cwd?: string): Promise<Uint8Array> {
  const process = Bun.spawn(args, { cwd, stdout: "pipe", stderr: "pipe" });
  const [bytes, error, code] = await Promise.all([
    new Response(process.stdout).arrayBuffer(),
    new Response(process.stderr).text(),
    process.exited,
  ]);
  if (code !== 0) throw new Error(`${args[0]} failed: ${error}`);
  return new Uint8Array(bytes);
}
async function gh<T>(path: string): Promise<T> {
  return JSON.parse(
    new TextDecoder().decode(await command(["gh", "api", path])),
  ) as T;
}
async function reuse(): Promise<boolean> {
  const repo = process.env.GITHUB_REPOSITORY;
  const sha = process.env.GITHUB_SHA;
  if (
    !repo ||
    !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo) ||
    !/^[a-f0-9]{40}$/.test(sha || "")
  )
    throw new Error("Missing repository/source SHA");
  const root = `repos/${repo}`;
  const [repository, workflow, commit] = await Promise.all([
    gh<{ id: number }>(root),
    gh<{ id: number }>(`${root}/actions/workflows/web.yml`),
    gh<{ commit: { tree: { sha: string } } }>(`${root}/commits/${sha}`),
  ]);
  const tree = commit.commit.tree.sha;
  const localTree = new TextDecoder()
    .decode(await command(["git", "rev-parse", "HEAD^{tree}"]))
    .trim();
  if (tree !== localTree)
    throw new Error("Checkout does not match the publishing tree");
  const runs = await gh<{ workflow_runs: Run[] }>(
    `${root}/actions/workflows/${workflow.id}/runs?event=pull_request&status=success&per_page=30`,
  );
  for (const run of runs.workflow_runs) {
    if (run.head_repository?.id !== repository.id) continue;
    const head = await gh<{ commit: { tree: { sha: string } } }>(
      `${root}/commits/${run.head_sha}`,
    );
    if (head.commit.tree.sha !== tree) continue;
    const [jobs, artifacts] = await Promise.all([
      gh<{ total_count: number; jobs: Job[] }>(
        `${root}/actions/runs/${run.id}/jobs?per_page=100`,
      ),
      gh<{ total_count: number; artifacts: Artifact[] }>(
        `${root}/actions/runs/${run.id}/artifacts?per_page=100`,
      ),
    ]);
    if (
      jobs.total_count !== jobs.jobs.length ||
      artifacts.total_count !== artifacts.artifacts.length ||
      !trustedRun(run, repository.id, workflow.id, jobs.jobs)
    )
      continue;
    const artifact = artifacts.artifacts.find(
      (a) => a.name === "verified-site" && !a.expired,
    );
    if (
      !artifact ||
      !/^sha256:[a-f0-9]{64}$/.test(artifact.digest) ||
      artifact.size_in_bytes > 8_000_000
    )
      continue;
    const temporary = await mkdtemp(join(tmpdir(), "chronoshift-publish-"));
    try {
      const zip = await command([
        "gh",
        "api",
        `${root}/actions/artifacts/${artifact.id}/zip`,
      ]);
      if (
        zip.length > 8_000_000 ||
        `sha256:${new Bun.CryptoHasher("sha256").update(zip).digest("hex")}` !==
          artifact.digest
      )
        throw new Error("Artifact digest mismatch");
      const archive = join(temporary, "artifact.zip"),
        tar = join(temporary, "artifact.tar");
      await Bun.write(archive, zip);
      const members = new TextDecoder()
        .decode(await command(["unzip", "-Z1", archive]))
        .trim()
        .split("\n");
      if (members.length !== 1 || members[0] !== "artifact.tar")
        throw new Error("Unexpected artifact archive");
      const bytes = await command(["unzip", "-p", archive, "artifact.tar"]);
      if (bytes.length > 10_000_000)
        throw new Error("Pages artifact too large");
      await Bun.write(tar, bytes);
      const paths = new TextDecoder()
        .decode(await command(["tar", "-tf", tar]))
        .trim()
        .split("\n");
      const entries = new TextDecoder()
        .decode(await command(["tar", "-tvf", tar]))
        .trim()
        .split("\n");
      if (!safeArchive(paths, entries))
        throw new Error("Unsafe artifact paths or links");
      const destination = join(temporary, "site");
      await mkdir(destination);
      await command(["tar", "-xf", tar, "-C", destination]);
      const release = (await Bun.file(
        join(destination, "release.json"),
      ).json()) as { sourceCommit: string; base: string };
      if (!/^[a-f0-9]{40}$/.test(release.sourceCommit || ""))
        throw new Error("Invalid artifact source commit");
      const tested = await gh<{ commit: { tree: { sha: string } } }>(
        `${root}/commits/${release.sourceCommit}`,
      );
      if (!releaseMatches(release, tested.commit.tree.sha, tree))
        throw new Error("Tested artifact tree differs from main");
      await rm(resolve("dist"), { recursive: true, force: true });
      await mkdir("dist");
      await command(["tar", "-xf", tar, "-C", resolve("dist")]);
      console.log(
        `Reusing verified Web run ${run.id}, source ${release.sourceCommit}, tree ${tree}`,
      );
      return true;
    } finally {
      await rm(temporary, { recursive: true, force: true });
    }
  }
  console.log(
    "No reusable verified artifact; complete verification is required.",
  );
  return false;
}
if (import.meta.main) {
  let matched = false;
  try {
    matched = await reuse();
  } catch (error) {
    console.warn(
      `Artifact reuse unavailable: ${error instanceof Error ? error.message : "unknown error"}. Complete verification will run.`,
    );
  }
  if (process.env.GITHUB_OUTPUT) {
    const file = Bun.file(process.env.GITHUB_OUTPUT);
    const previous = (await file.exists()) ? await file.text() : "";
    await Bun.write(file, previous + `reused=${matched}\n`);
  }
  if (process.env.REQUIRE_REUSE === "1" && !matched) process.exitCode = 1;
}
