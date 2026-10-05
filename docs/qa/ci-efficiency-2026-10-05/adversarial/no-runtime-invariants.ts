import { join } from "node:path";
const root = "/Users/tien/Developer/ChronoShift";
const base = "7059da3125ada61123f91d1267bbee9a6f4792ef";
const head = "e632d2f5bb8ff3cfc8c447ab87ae081078ca04c2";
async function run(args: string[]) {
  const start = new Date().toISOString();
  const p = Bun.spawn(args, {cwd:root, stdout:"pipe", stderr:"pipe"});
  const [stdout, stderr, code] = await Promise.all([new Response(p.stdout).text(),new Response(p.stderr).text(),p.exited]);
  return {args,start,end:new Date().toISOString(),stdout,stderr,code};
}
const results = await Promise.all([
  run(["git","diff","--exit-code",base,head,"--","web","bun.lock","mise.toml","tests/fixtures","scripts/reuse-pages-artifact.ts","e2e/fixtures.ts","e2e/attempt-reporter.ts","playwright.subpath.config.ts"]),
  run(["git","diff","--name-only",base,head,"--",".",":!docs"]),
  run(["git","rev-parse","HEAD","HEAD^{tree}"]),
  run([process.execPath,"scripts/ci-environment.ts","before"]),
  run([process.execPath,"scripts/ci-environment.ts","after"]),
]);
const report = {platform:process.platform,bun:Bun.version,base,head,results};
await Bun.write(join(import.meta.dir,"no-runtime","invariants.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(results.map(({args,code,stdout})=>({args,code,stdout}))));
