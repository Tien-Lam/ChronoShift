import { mkdir } from "node:fs/promises";
import { join } from "node:path";
const dir = join(import.meta.dir, "no-runtime");
await mkdir(dir, { recursive: true });
const gh = "/Users/tien/.local/share/mise/installs/gh/2.100.0/gh_2.100.0_macOS_arm64/bin/gh";
const reads = [
  ["checkout", "repos/actions/checkout/contents/action.yml?ref=34e114876b0b11c390a56381ad16ebd13914f8d5"],
  ["mise", "repos/jdx/mise-action/contents/action.yml?ref=5228313ee0372e111a38da051671ca30fc5a96db"],
  ["configure", "repos/actions/configure-pages/contents/action.yml?ref=983d7736d9b0ae728b81ab479565c72886d7745b"],
  ["upload", "repos/actions/upload-pages-artifact/contents/action.yml?ref=7b1f4a764d45c48632c6b24a0339c27f5614fb0b"],
  ["deploy", "repos/actions/deploy-pages/contents/action.yml?ref=d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e"],
  ["slim", "repos/actions/runner-images/contents/images/ubuntu-slim/ubuntu-slim-Readme.md"],
  ["artifact", "repos/actions/upload-artifact/contents/action.yml?ref=ea165f8d65b6e75b540449e92b4886f43607fa02"],
  ["deploy-source", "repos/actions/deploy-pages/contents/src/index.js?ref=d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e"],
] as const;
const results = await Promise.all(reads.map(async ([name, route]) => {
  const start = new Date().toISOString();
  const p = Bun.spawn([gh, "api", route], {stdout:"pipe", stderr:"pipe"});
  const [stdout, stderr, code] = await Promise.all([new Response(p.stdout).text(), new Response(p.stderr).text(), p.exited]);
  await Bun.write(join(dir, `${name}.json`), stdout);
  if (code === 0) {
    const response = JSON.parse(stdout);
    await Bun.write(join(dir, `${name}.txt`), Buffer.from(response.content, "base64"));
  }
  return { name, route, start, end:new Date().toISOString(), code, stderr };
}));
await Bun.write(join(dir, "reads.json"), JSON.stringify(results,null,2)+"\n");
console.log(JSON.stringify(results));
