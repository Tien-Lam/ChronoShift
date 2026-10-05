import { resolve } from "node:path";

const [release, mode] = Bun.argv.slice(2);
if (
  !/^[a-f0-9]{40}$/.test(release || "") ||
  !["reuse", "fallback"].includes(mode)
)
  throw new Error(
    "Supply the exact published source SHA and reuse/fallback mode",
  );
const folder = import.meta.dir;
const cwd = resolve(folder, "../../../..");
const args = [
  "bun",
  "run",
  "test:hosted",
  `--output=${folder}/hosted-${mode}-results`,
];
const started = new Date().toISOString();
const processHandle = Bun.spawn(args, {
  cwd,
  env: { ...process.env, HOSTED_EXPECTED_COMMIT: release },
  stdout: "inherit",
  stderr: "inherit",
});
const exitCode = await processHandle.exited;
const ended = new Date().toISOString();
await Bun.write(
  `${folder}/hosted-${mode}-clocks.json`,
  JSON.stringify(
    {
      started,
      ended,
      cwd,
      args,
      expectedSource: release,
      exitCode,
      environment: {
        platform: process.platform,
        arch: process.arch,
        bun: Bun.version,
      },
      limitations: [
        "Command clocks bracket process execution; individual tests have their own runner durations.",
        "Phone emulation is not physical phone evidence.",
      ],
    },
    null,
    2,
  ),
);
process.exitCode = exitCode;
