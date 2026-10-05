import { join } from "node:path";
import { execFileSync } from "node:child_process";
const root=execFileSync("git",["rev-parse","--show-toplevel"],{encoding:"utf8"}).trim();
const commit="0f0d9d3ec38b8b53cd42b8413e52c7a0d5067318";
const paths=["e2e/conversion.ts","e2e/app.spec.ts","e2e/privacy.spec.ts","e2e/responsive.spec.ts","e2e/controls.spec.ts"];
const hash=(bytes:ArrayBuffer|Uint8Array)=>new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
const runs=[];
for(const folder of ["implementation","final-implementation"]){
  const timing=await Bun.file(join(import.meta.dir,folder,"results/ci-timing.json")).json();
  const byProject:Record<string,any>={};
  for(const row of timing.attempts){const g=byProject[row.project]??={attempts:0,passed:0,failed:0,skipped:0,retries:0};g.attempts++;if(row.status==="passed")g.passed++;else if(row.status==="skipped")g.skipped++;else g.failed++;if(row.retry>0)g.retries++;}
  const source=await Promise.all(paths.map(async path=>{const name=path.split("/").at(-1)!;const snapshot=new Uint8Array(await Bun.file(join(import.meta.dir,folder,name)).arrayBuffer());const committed=execFileSync("git",["show",`${commit}:${path}`],{cwd:root});return {path,sha256:hash(snapshot),matchesFinalCommit:hash(snapshot)===hash(committed)};}));
  runs.push({folder,status:timing.status,began:timing.startTime,durationMs:timing.durationMs,ended:new Date(new Date(timing.startTime).getTime()+timing.durationMs).toISOString(),workers:timing.workers,attempts:timing.attempts.length,uniqueCases:new Set(timing.attempts.map((a:any)=>a.testId)).size,droppedAttempts:timing.droppedAttempts,firstAttempts:timing.attempts.filter((a:any)=>a.retry===0).length,retries:timing.attempts.filter((a:any)=>a.retry>0).length,failedAttempts:timing.attempts.filter((a:any)=>!["passed","skipped"].includes(a.status)).length,failureMarkerExists:await Bun.file(join(import.meta.dir,folder,"results/attempt-failures.json")).exists(),byProject,source});
}
const sourcesCurrent=await Promise.all(paths.map(async path=>({path,matchesFinalCommit:hash(await Bun.file(join(root,path)).arrayBuffer())===hash(execFileSync("git",["show",`${commit}:${path}`],{cwd:root}))})));
const out={observedAt:new Date().toISOString(),base:"82843f46e554a04d7a9db9c8b0aaacb77466442e",finalCommit:commit,runtimeSource:"28059a91ec9984dea4d079b3f684b3a27af669f0",runtimeWebTree:execFileSync("git",["rev-parse",`${commit}:web`],{encoding:"utf8"}).trim(),finalJsSha256:hash(await Bun.file(join(root,"dist/assets/index-DHi9pTHJ.js")).arrayBuffer()),conditions:{CI:"1",CHRONOSHIFT_CI_TIMING:"1",workers:4,profiles:["chromium","firefox","webkit","android-emulation","iphone-emulation"],normalMotion:"Existing config/use preserved; tests retain their original explicit reduced-motion journeys",rootBase:"/",fixtureTestMode:1,initialPort:4299,finalPort:4301,hardware:"Darwin arm64 Apple M4 Pro; local installed engines, not pinned Linux image"},runs,sourcesCurrent,verdict:"Selected final source passes60 affected existing cases at exact final file identity; broader115 earlier-source passes retained separately. Required complete hosted gate/reviewer lifecycle probes remain root-owned; no Linux savings or TIE375 completion claim."};
await Bun.write(join(import.meta.dir,"implementation-summary.json"),JSON.stringify(out,null,2));console.log(JSON.stringify(out,null,2));
