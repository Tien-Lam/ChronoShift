const folder = import.meta.dir;
const args = ["bun", "run", "test:hosted", `--output=${folder}/hosted-reuse-results`];
const began = new Date().toISOString();
const child = Bun.spawn(args, {
  cwd: "/Users/tien/Developer/ChronoShift",
  env: {...process.env, HOSTED_EXPECTED_COMMIT: "8fd325dd79afdd6dcf33e77503aca7f97541d25c"},
  stdout: "inherit", stderr: "inherit",
});
const exitCode = await child.exited;
await Bun.write(`${folder}/hosted-reuse-clocks.json`, JSON.stringify({
  began, ended: new Date().toISOString(), exitCode, args,
  expectedRelease: "8fd325dd79afdd6dcf33e77503aca7f97541d25c",
  environment: {platform: process.platform, arch: process.arch, bun: Bun.version},
  gaps: ["Pixel viewport is emulation, not a physical phone or installed app."],
}, null, 2));
process.exitCode = exitCode;
