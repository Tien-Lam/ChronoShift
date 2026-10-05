import { mkdtemp, mkdir, readdir, readFile, rm, symlink, writeFile, chmod } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// Synthetic gh transport only: actual helper, git, unzip and tar run unchanged.
const root = "/Users/tien/Developer/ChronoShift";
const evidence = resolve(import.meta.dir);
const bun = process.execPath;
const helper = join(root, "scripts/reuse-pages-artifact.ts");
const started = new Date().toISOString();
const scratch = await mkdtemp(join(tmpdir(), "chronoshift-adversarial-reuse-"));
async function command(args: string[], cwd: string, env?: Record<string, string | undefined>) {
  const child = Bun.spawn(args, { cwd, env, stdout: "pipe", stderr: "pipe" });
  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(), new Response(child.stderr).text(), child.exited,
  ]);
  return { stdout, stderr, code };
}
async function must(args: string[], cwd: string) {
  const out = await command(args, cwd);
  if (out.code !== 0) throw new Error(JSON.stringify({ args, ...out }));
  return out.stdout.trim();
}
const head = await must(["git", "rev-parse", "HEAD"], root);
const tree = await must(["git", "rev-parse", "HEAD^{tree}"], root);
const gitDir = await must(["git", "rev-parse", "--absolute-git-dir"], root);
const helperHash = new Bun.CryptoHasher("sha256").update(await readFile(helper)).digest("hex");
const rootDistBefore = await inventory(join(root, "dist"));
async function inventory(directory: string, prefix = ""): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name), key = prefix + entry.name;
    if (entry.isDirectory()) Object.assign(result, await inventory(path, key + "/"));
    else if (entry.isFile()) result[key] = new Bun.CryptoHasher("sha256").update(await readFile(path)).digest("hex");
    else throw new Error(`Unexpected non-file inventory member ${key}`);
  }
  return result;
}
const requiredSteps = ["Run bun run format:check", "Unit tests and production build", "Verify the standalone conversion corpus audit", "Run bun run test:browser", "Verify repository-subpath deployment", "Upload the verified Pages build"];
const cases = [
  ["valid", true], ["missing", false], ["expired", false], ["different-run-tree", false],
  ["wrong-digest", false], ["unsafe-symlink", false], ["api-error", false],
  ["different-release-tree", false], ["missing-browser-step", false], ["partial-job-list", false],
  ["unexpected-zip-member", false], ["different-checkout-tree", false],
] as const;
const results: unknown[] = [];
const repo = "synthetic/ChronoShift", apiRoot = `repos/${repo}`;
const runSha = "a".repeat(40), otherTree = "b".repeat(40);
try {
  for (const [name, expected] of cases) {
    const start = new Date().toISOString(), cwd = join(scratch, name), bin = join(cwd, "bin"), site = join(cwd, "site");
    await mkdir(bin, { recursive: true }); await mkdir(site);
    await mkdir(join(site, "assets"));
    await writeFile(join(site, "release.json"), JSON.stringify({ sourceCommit: name === "different-release-tree" ? "c".repeat(40) : head, base: "/ChronoShift/" }));
    await writeFile(join(site, "index.html"), '<!doctype html><script type="module" src="/ChronoShift/assets/app.js"></script>');
    await writeFile(join(site, "assets/app.js"), 'document.body.textContent="synthetic static fixture";');
    if (name === "unsafe-symlink") await symlink("../../outside-must-not-extract", join(site, "unsafe-link"));
    await must(["tar", "-cf", join(cwd, "artifact.tar"), "-C", site, "./"], cwd);
    await must(["zip", "-q", "artifact.zip", "artifact.tar"], cwd);
    if (name === "unexpected-zip-member") {
      await writeFile(join(cwd, "extra.txt"), "unexpected");
      await must(["zip", "-q", "artifact.zip", "extra.txt"], cwd);
    }
    const archive = await readFile(join(cwd, "artifact.zip"));
    const zipHash = new Bun.CryptoHasher("sha256").update(archive).digest("hex");
    const artifact = { id: 31, name: "github-pages", expired: name === "expired", size_in_bytes: archive.length, digest: `sha256:${name === "wrong-digest" ? "0".repeat(64) : zipHash}` };
    const run = { id: 21, workflow_id: 11, path: ".github/workflows/web.yml", event: "pull_request", status: "completed", conclusion: "success", head_sha: runSha, head_repository: { id: 1 } };
    const jobs = [{ name: "web", conclusion: "success", steps: requiredSteps.filter(step => !(name === "missing-browser-step" && step === "Run bun run test:browser")).map(step => ({ name: step, conclusion: "success" })) }];
    const fixture = {
      [apiRoot]: { id: 1 },
      [`${apiRoot}/actions/workflows/web.yml`]: { id: 11 },
      [`${apiRoot}/commits/${head}`]: { commit: { tree: { sha: name === "different-checkout-tree" ? otherTree : tree } } },
      [`${apiRoot}/commits/${"c".repeat(40)}`]: { commit: { tree: { sha: otherTree } } },
      [`${apiRoot}/commits/${runSha}`]: { commit: { tree: { sha: name === "different-run-tree" ? otherTree : tree } } },
      [`${apiRoot}/actions/workflows/11/runs?event=pull_request&status=success&per_page=30`]: { workflow_runs: [run] },
      [`${apiRoot}/actions/runs/21/jobs?per_page=100`]: { total_count: name === "partial-job-list" ? 2 : 1, jobs },
      [`${apiRoot}/actions/runs/21/artifacts?per_page=100`]: { total_count: name === "missing" ? 0 : 1, artifacts: name === "missing" ? [] : [artifact] },
    };
    await writeFile(join(cwd, "fixture.json"), JSON.stringify({ name, responses: fixture, head, tree, otherTree }, null, 2));
    const fake = `#!${bun}\nimport { appendFileSync } from "node:fs";\nconst fixture=await Bun.file(process.env.MOCK_FIXTURE).json();\nconst args=process.argv.slice(2);\nappendFileSync(process.env.MOCK_REQUESTS, JSON.stringify({at:new Date().toISOString(),args})+"\\n");\nconst route=args[1];\nif(args[0]!=="api") throw new Error("Unexpected synthetic command");\nif(fixture.name==="api-error" && route.includes("/jobs?")){console.error("Synthetic HTTP 503");process.exit(1);}\nif(route.endsWith("/zip")){process.stdout.write(await Bun.file(process.env.MOCK_ZIP).arrayBuffer());}\nelse if(Object.hasOwn(fixture.responses,route)){process.stdout.write(JSON.stringify(fixture.responses[route]));}\nelse {console.error("Unknown synthetic route "+route);process.exit(1);}\n`;
    await writeFile(join(bin, "gh"), fake); await chmod(join(bin, "gh"), 0o755);
    await mkdir(join(cwd, "dist")); await writeFile(join(cwd, "dist/sentinel.txt"), "must survive every false outcome");
    await writeFile(join(cwd, "output.txt"), "prior=value\n");
    const before = await inventory(join(cwd, "dist"));
    const env = { ...process.env, PATH: `${bin}:${process.env.PATH}`, GIT_DIR: gitDir, GIT_WORK_TREE: cwd, GITHUB_REPOSITORY: repo, GITHUB_SHA: head, GITHUB_OUTPUT: join(cwd, "output.txt"), GH_TOKEN: undefined, GITHUB_TOKEN: undefined, REQUIRE_REUSE: undefined, MOCK_FIXTURE: join(cwd, "fixture.json"), MOCK_REQUESTS: join(cwd, "requests.jsonl"), MOCK_ZIP: join(cwd, "artifact.zip") };
    const outcome = await command([bun, helper], cwd, env);
    const output = await readFile(join(cwd, "output.txt"), "utf8"), after = await inventory(join(cwd, "dist"));
    const expectedInventory = expected ? await inventory(site) : before;
    const passed = outcome.code === 0 && output === `prior=value\nreused=${expected}\n` && JSON.stringify(after) === JSON.stringify(expectedInventory);
    const record = { name, expectedReused: expected, passed, start, end: new Date().toISOString(), ...outcome, output, outputSha256: new Bun.CryptoHasher("sha256").update(output).digest("hex"), zipSha256: zipHash, zipBytes: archive.length, beforeInventory: before, afterInventory: after, requests: (await readFile(join(cwd, "requests.jsonl"), "utf8")).trim().split("\n").map(line => JSON.parse(line)) };
    results.push(record);
    await mkdir(join(evidence, "cases", name), { recursive: true });
    for (const file of ["fixture.json", "artifact.zip", "artifact.tar", "requests.jsonl", "output.txt"]) await writeFile(join(evidence, "cases", name, file), await readFile(join(cwd, file)));
    await writeFile(join(evidence, "cases", name, "outcome.json"), JSON.stringify(record, null, 2) + "\n");
  }
} finally { await rm(scratch, { recursive: true, force: true }); }
const endHead = await must(["git", "rev-parse", "HEAD"], root);
const rootDistAfter = await inventory(join(root, "dist"));
const final = { started, ended: new Date().toISOString(), head, tree, endHead, helperHash, bun, runtime: Bun.version, gh: "synthetic mock (no network; actual gh not invoked)", actualTools: {git:await must(["git", "--version"], root), tar:await must(["tar", "--version"], root)}, context: "Reused independent reviewer context; no peer report read", sourceStable: head === endHead, rootDistUnchanged: JSON.stringify(rootDistBefore) === JSON.stringify(rootDistAfter), results };
await writeFile(join(evidence, "results.json"), JSON.stringify(final, null, 2) + "\n");
console.log(JSON.stringify({started, ended:final.ended, head, cases:results.length, passed:results.filter((r:any)=>r.passed).length, sourceStable:final.sourceStable, rootDistUnchanged:final.rootDistUnchanged}));
if (!final.sourceStable || !final.rootDistUnchanged || results.some((r:any)=>!r.passed)) process.exitCode=1;
