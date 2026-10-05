import { cp, mkdir, rename, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
const root = resolve(import.meta.dir, "../../..");
const output = join(import.meta.dir, "controls");
const original = "/tmp/chronoshift-virtualized-zones/root-original-dist";
await mkdir(output, { recursive: true });
await rename(join(root, "dist"), original);
const rows: any[] = (await Bun.file(join(output, "clocks.json")).exists())
  ? await Bun.file(join(output, "clocks.json")).json()
  : [];
const priorBlocks = rows.length;
const variants = Bun.argv.slice(2).length
  ? Bun.argv.slice(2)
  : ["baseline", "candidate"];
if (variants.some((variant) => !["baseline", "candidate"].includes(variant)))
  throw Error("Unknown variant");
async function files(dir: string): Promise<string[]> {
  return (
    await Promise.all(
      (await readdir(dir, { withFileTypes: true })).map((e) =>
        e.isDirectory() ? files(join(dir, e.name)) : [join(dir, e.name)],
      ),
    )
  ).flat();
}
async function inventory() {
  return Object.fromEntries(
    await Promise.all(
      (await files(join(root, "dist")))
        .sort()
        .map(async (p) => [
          p.slice(join(root, "dist").length + 1),
          new Bun.CryptoHasher("sha256")
            .update(await Bun.file(p).arrayBuffer())
            .digest("hex"),
        ]),
    ),
  );
}
try {
  for (const [i, variant] of variants.entries()) {
    const block = `${priorBlocks + i + 1}-${variant}`;
    const folder = join(output, block);
    await mkdir(folder, { recursive: true });
    await cp(
      `/tmp/chronoshift-virtualized-zones/${variant}-runtime/dist`,
      join(root, "dist"),
      { recursive: true },
    );
    const before = await inventory();
    const startedAt = new Date().toISOString(),
      started = performance.now();
    const log = Bun.file(join(folder, "run.log"));
    const child = Bun.spawn(
      [
        "bunx",
        "--bun",
        "playwright",
        "test",
        "--config=docs/qa/ci-virtualized-zones-2026-10-05/controls.config.ts",
      ],
      {
        cwd: root,
        env: {
          ...process.env,
          CI: "1",
          PLAYWRIGHT_PORT: "4191",
          ZONE_CONTROL_BLOCK: block,
          CHRONOSHIFT_CI_TIMING: "0",
        },
        stdout: log,
        stderr: log,
      },
    );
    const exitCode = await child.exited;
    const endedAt = new Date().toISOString(),
      elapsedMs = performance.now() - started;
    const after = await inventory();
    const row = {
      block,
      variant,
      grep: process.env.ZONE_CONTROL_GREP || null,
      startedAt,
      endedAt,
      elapsedMs,
      exitCode,
      before,
      after,
    };
    rows.push(row);
    await Bun.write(join(output, "clocks.json"), JSON.stringify(rows, null, 2));
    console.log(
      JSON.stringify({ block, startedAt, endedAt, elapsedMs, exitCode }),
    );
    await rename(
      join(root, "dist"),
      `/tmp/chronoshift-virtualized-zones/served-${block}-dist`,
    );
    if (exitCode !== 0)
      throw Error(`Stop after failed block ${block}; original output retained`);
    if (JSON.stringify(before) !== JSON.stringify(after))
      throw Error(`Changed files in ${block}`);
  }
} finally {
  if (await Bun.file(join(root, "dist/index.html")).exists())
    await rename(
      join(root, "dist"),
      "/tmp/chronoshift-virtualized-zones/interrupted-dist",
    );
  await rename(original, join(root, "dist"));
}
