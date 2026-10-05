import { resolve } from "node:path";
const release = Bun.argv[2];
if (!/^[a-f0-9]{40}$/.test(release || ""))
  throw new Error("Supply exact release SHA");
const cwd = resolve(import.meta.dir, "../../../..");
const args = [
  "bunx",
  "--bun",
  "playwright",
  "test",
  "--config=docs/qa/copy-focus-2026-10-05/hosted/config.ts",
];
const started = new Date().toISOString();
const child = Bun.spawn(args, {
  cwd,
  env: {
    ...process.env,
    HOSTED_EXPECTED_COMMIT: release,
    CHRONOSHIFT_COPY_FOCUS_EVIDENCE: "1",
  },
  stdout: "inherit",
  stderr: "inherit",
});
const exitCode = await child.exited;
await Bun.write(
  new URL("clocks.json", import.meta.url),
  JSON.stringify(
    {
      started,
      ended: new Date().toISOString(),
      cwd,
      args,
      expectedRelease: release,
      exitCode,
      environment: {
        platform: process.platform,
        arch: process.arch,
        bun: Bun.version,
      },
    },
    null,
    2,
  ),
);
process.exitCode = exitCode;
