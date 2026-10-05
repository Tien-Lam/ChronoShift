const folder = import.meta.dir;
const args = ["bun", "run", "test:hosted", `--output=${folder}/hosted-fallback-results`];
const began = new Date().toISOString();
const child = Bun.spawn(args, {
  cwd: "/Users/tien/Developer/ChronoShift",
  env: {...process.env, HOSTED_EXPECTED_COMMIT: "cf4d5b9244278da591a33c1952283e76acb6116c"},
  stdout: "inherit", stderr: "inherit",
});
const exitCode = await child.exited;
await Bun.write(`${folder}/hosted-fallback-clocks.json`, JSON.stringify({
  began, ended: new Date().toISOString(), exitCode, args,
  expectedRelease: "cf4d5b9244278da591a33c1952283e76acb6116c",
  environment: {platform: process.platform, arch: process.arch, bun: Bun.version},
  gaps: ["Pixel viewport is emulation, not a physical phone or installed app."],
}, null, 2));
process.exitCode = exitCode;
