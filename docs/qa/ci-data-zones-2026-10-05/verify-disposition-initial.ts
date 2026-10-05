import { resolve, dirname } from "node:path";
import { stat } from "node:fs/promises";

const startedAt = new Date().toISOString();
const run = (args: string[]) => {
  const p = Bun.spawnSync(args, { stdout: "pipe", stderr: "pipe" });
  if (p.exitCode) throw new Error(new TextDecoder().decode(p.stderr));
  return new TextDecoder().decode(p.stdout).trim();
};
const docs = [
  "docs/developer/ci-efficiency.md",
  "docs/qa/ci-data-zones-2026-10-05/README.md",
  "docs/qa/ci-data-zones-2026-10-05/closure-summary.md",
  "docs/qa/ci-virtualized-zones-2026-10-05/README.md",
];
const reports = [
  "docs/qa/ci-data-zones-2026-10-05/closure-code/report-original.md",
  "docs/qa/ci-data-zones-2026-10-05/closure-adversarial/report-original.md",
];
const formatting = run(["bunx", "--bun", "prettier", "--check", ...docs]);
run(["git", "diff", "--check"]);
const changed = run(["git", "diff", "--name-only", "HEAD"]).split("\n").filter(Boolean);
if (changed.some(p => p !== docs[0] && !p.startsWith("docs/qa/ci-data-zones-2026-10-05/") && !p.startsWith("docs/qa/ci-virtualized-zones-2026-10-05/"))) throw Error("Unexpected tracked change");
const sourcePaths = ["web", "scripts", "tests", "e2e", ".github", "package.json", "bun.lock", "mise.toml"];
if (run(["git", "diff", "--name-only", "HEAD", "--", ...sourcePaths])) throw Error("Runtime/test/workflow delta");
if (run(["git", "ls-files", "--others", "--exclude-standard", "--", ...sourcePaths])) throw Error("New runtime/test/workflow source");
const links: { file: string; target: string }[] = [];
for (const file of [...docs, ...reports]) {
  const s = await Bun.file(file).text();
  for (const m of s.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = m[1].replace(/^<|>$/g, "").split("#")[0];
    if (!target || /^[a-z]+:\/\//i.test(target)) continue;
    await stat(resolve(dirname(file), decodeURIComponent(target)));
    links.push({ file, target });
  }
}
const output = {
  startedAt,
  endedAt: new Date().toISOString(),
  base: run(["git", "rev-parse", "HEAD"]),
  environment: { runtime: `Bun ${Bun.version}`, platform: process.platform, arch: process.arch },
  scope: "Documentation only; original report bytes preserved",
  formatting,
  diffCheck: "passed",
  runtimeTestWorkflowDelta: [],
  untrackedRuntimeTestWorkflowSource: [],
  relativeLinksChecked: links.length,
  documents: [...docs, ...reports].map(file => ({ file, blob: run(["git", "hash-object", file]) })),
  runtimeGate: "Retained PR41/fallback full gates; no new runtime checks, Actions or deployment for documentation",
};
await Bun.write("docs/qa/ci-data-zones-2026-10-05/final-verification.json", JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify(output));
