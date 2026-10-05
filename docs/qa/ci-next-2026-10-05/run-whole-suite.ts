import { cp, mkdir, rename } from "node:fs/promises";
import { resolve, join } from "node:path";
const root = resolve(import.meta.dir, "../../..");
const output = join(import.meta.dir, "whole-suite");
const rows: any[] = [];
await mkdir(output, { recursive: true });
const originals = join(output, "original-dist");
await rename(join(root, "dist"), originals);
try {
  for (const [index, variant] of ["baseline", "candidate", "candidate", "baseline"].entries()) {
    const block = `${index + 1}-${variant}`;
    const folder = join(output, block);
    await mkdir(folder, { recursive: true });
    await cp(`/tmp/chronoshift-ci-next-${variant}-dist`, join(root, "dist"), { recursive: true });
    const artifactPaths = ["index.html", "release.json", "sw.js", ...Array.from((await Bun.file(join(root, "dist/index.html")).text()).matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g), (m) => m[1].slice(1))];
    const identity = Object.fromEntries(await Promise.all(artifactPaths.map(async (path) => [path, new Bun.CryptoHasher("sha256").update(await Bun.file(join(root, "dist", path)).arrayBuffer()).digest("hex")])));
    const startedAt = new Date().toISOString();
    const started = performance.now();
    const log = Bun.file(join(folder, "run.log"));
    const child = Bun.spawn(["bunx", "--bun", "playwright", "test", "--config=docs/qa/ci-next-2026-10-05/whole-suite.config.ts"], {
      cwd: root,
      env: { ...process.env, CI: "1", PLAYWRIGHT_PORT: "4187", CI_RENDER_BLOCK: block, CHRONOSHIFT_CI_TIMING: "0" },
      stdout: log,
      stderr: log,
    });
    const exitCode = await child.exited;
    const row = { block, variant, startedAt, endedAt: new Date().toISOString(), elapsedMs: performance.now() - started, exitCode, identity };
    rows.push(row);
    await Bun.write(join(output, "clocks.json"), JSON.stringify(rows, null, 2));
    console.log(JSON.stringify(row));
    await rename(join(root, "dist"), join(folder, "served-dist"));
    if (exitCode !== 0) throw Error(`Stop after failed complete block ${block}; retained all output`);
  }
} finally {
  // The run's dist moved into its evidence folder; restore the original build.
  if (await Bun.file(join(root, "dist/index.html")).exists()) await rename(join(root, "dist"), join(output, "interrupted-dist"));
  await rename(originals, join(root, "dist"));
}
