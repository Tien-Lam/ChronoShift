import { join } from "node:path";
import { mkdir, readdir } from "node:fs/promises";
import { safeArchive } from "../../../../scripts/reuse-pages-artifact";

const base = import.meta.dir;
const api = "repos/Tien-Lam/ChronoShift";
const runId = process.env.REVIEW_PAGES_RUN || "37276181716";
const mode = process.env.REVIEW_MODE || "automatic";
const expectedSource = mode === "automatic" ? "997f3f2367bef1c877c207a4d89872992382d006" : "28059a91ec9984dea4d079b3f684b3a27af669f0";
const clock = () => new Date().toISOString();
const began = clock();
const commands: unknown[] = [];
async function command(args: string[]) {
  const start = clock();
  const p = Bun.spawn(args, { stdout: "pipe", stderr: "pipe" });
  const [bytes, stderr, code] = await Promise.all([new Response(p.stdout).arrayBuffer(), new Response(p.stderr).text(), p.exited]);
  commands.push({ args, start, end: clock(), code, stderr });
  if (code !== 0) throw new Error(stderr);
  return new Uint8Array(bytes);
}
async function gh(path: string) { return JSON.parse(new TextDecoder().decode(await command(["gh", "api", path]))); }
const hash = (bytes: Uint8Array) => new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
const [run, jobs, artifacts, main, head, source] = await Promise.all([
  gh(`${api}/actions/runs/${runId}`), gh(`${api}/actions/runs/${runId}/jobs?per_page=100`), gh(`${api}/actions/runs/${runId}/artifacts?per_page=100`),
  gh(`${api}/commits/28059a91ec9984dea4d079b3f684b3a27af669f0`), gh(`${api}/commits/b288920d072d6ebb6ca56d1ea83f7c95ea7bed02`), gh(`${api}/commits/${expectedSource}`),
]);
if (run.status !== "completed" || run.conclusion !== "success" || run.head_branch !== "main" || run.head_sha !== main.sha) throw new Error("Unexpected publication source/result");
if (jobs.jobs.length !== jobs.total_count || artifacts.artifacts.length !== artifacts.total_count) throw new Error("Incomplete inventory");
const tree = head.commit.tree.sha;
if (tree !== main.commit.tree.sha || tree !== source.commit.tree.sha) throw new Error("Source tree mismatch");
const meta = artifacts.artifacts.filter((a: any) => a.name === "github-pages");
if (meta.length !== 1 || meta[0].expired) throw new Error("Unexpected archive inventory");
const zip = await command(["gh", "api", `${api}/actions/artifacts/${meta[0].id}/zip`]);
if (`sha256:${hash(zip)}` !== meta[0].digest || zip.length !== meta[0].size_in_bytes) throw new Error("ZIP digest/size mismatch");
const zipPath = join(base, `${mode}-pages.zip`), tarPath = join(base, `${mode}-pages.tar`);
await Bun.write(zipPath, zip);
const members = new TextDecoder().decode(await command(["unzip", "-Z1", zipPath])).trim().split("\n");
if (members.length !== 1 || members[0] !== "artifact.tar") throw new Error("Unexpected ZIP wrapper");
await Bun.write(tarPath, await command(["unzip", "-p", zipPath, "artifact.tar"]));
const paths = new TextDecoder().decode(await command(["tar", "-tf", tarPath])).trim().split("\n");
const entries = new TextDecoder().decode(await command(["tar", "-tvf", tarPath])).trim().split("\n");
if (!safeArchive(paths, entries) || new Set(paths).size !== paths.length) throw new Error("Unsafe or duplicated archive");
const dest = join(base, `${mode}-site`);
await mkdir(dest, { recursive: true });
await command(["tar", "-xf", tarPath, "-C", dest]);
async function inventory(path = ""): Promise<any[]> {
  const out: any[] = [];
  for (const file of await readdir(join(dest, path), { withFileTypes: true })) {
    const rel = path + file.name;
    if (file.isDirectory()) out.push(...await inventory(rel + "/"));
    else {
      if (!file.isFile()) throw new Error("Nonregular extracted file");
      const body = new Uint8Array(await Bun.file(join(dest, rel)).arrayBuffer());
      const token = Date.now();
      const url = `https://tien-lam.github.io/ChronoShift/${rel}?fresh-code-review=${token}`;
      const start = clock();
      const response = await fetch(url, { cache: "no-store" });
      const live = new Uint8Array(await response.arrayBuffer());
      const liveHash = hash(live), expectedHash = hash(body);
      out.push({ path: rel, bytes: body.length, sha256: expectedHash, observedAt: { start, end: clock() }, public: { url: response.url, status: response.status, contentType: response.headers.get("content-type"), bytes: live.length, sha256: liveHash }, matched: response.ok && live.length === body.length && liveHash === expectedHash });
    }
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}
const files = await inventory();
const release = await Bun.file(join(dest, "release.json")).json();
if (release.sourceCommit !== expectedSource || release.base !== "/ChronoShift/") throw new Error("Unexpected release identity");
const rootResponse = await fetch(`https://tien-lam.github.io/ChronoShift/?fresh-code-review=${Date.now()}`, { cache: "no-store" });
const rootBody = new Uint8Array(await rootResponse.arrayBuffer());
const root = { status: rootResponse.status, bytes: rootBody.length, sha256: hash(rootBody), matched: rootResponse.ok && hash(rootBody) === files.find((f) => f.path === "index.html").sha256 };
const log = new TextDecoder().decode(await command(["gh", "run", "view", runId, "--log"]));
await Bun.write(join(base, `${mode}.log`), log);
const prior = new Uint8Array(await Bun.file(join(base, "candidate-pages.tar")).arrayBuffer());
const tar = new Uint8Array(await Bun.file(tarPath).arrayBuffer());
const findings = { began, ended: clock(), mode, run, jobs, artifact: meta[0], tree, release, paths, entries, commands, files, root, tarMatchesPR: hash(tar) === hash(prior), archiveSha256: hash(tar), allPublicMatches: files.every((f) => f.matched) && root.matched };
await Bun.write(join(base, `${mode}-delivery.json`), JSON.stringify(findings, null, 2));
console.log(JSON.stringify({ began, ended: findings.ended, run: run.id, artifactBytes: zip.length, release, tree, fileCount: files.length, allPublicMatches: findings.allPublicMatches, tarMatchesPR: findings.tarMatchesPR }));
if (!findings.allPublicMatches || (mode === "automatic" && !findings.tarMatchesPR)) process.exitCode = 1;
