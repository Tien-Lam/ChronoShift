import {mkdir} from "node:fs/promises";
import {join} from "node:path";
const dir=join(import.meta.dir,"arm-execution");await mkdir(dir,{recursive:true});
const gh="/Users/tien/.local/share/mise/installs/gh/2.100.0/gh_2.100.0_macOS_arm64/bin/gh";
const runId="37274080414",root="repos/Tien-Lam/ChronoShift",head="52e8d9c3bc2ba50f6ba2990dde5a128a37849172";
async function command(args:string[],name:string){
  const start=new Date().toISOString(),p=Bun.spawn([gh,...args],{stdout:"pipe",stderr:"pipe"});
  const [stdout,stderr,code]=await Promise.all([new Response(p.stdout).text(),new Response(p.stderr).text(),p.exited]);
  const metadata={args,start,end:new Date().toISOString(),code,stderr,sha256:new Bun.CryptoHasher("sha256").update(stdout).digest("hex"),bytes:Buffer.byteLength(stdout)};
  await Bun.write(join(dir,name),stdout);await Bun.write(join(dir,name+".read.json"),JSON.stringify(metadata,null,2)+"\n");
  if(code!==0)throw new Error(JSON.stringify(metadata));return stdout;
}
const run=JSON.parse(await command(["api",`${root}/actions/runs/${runId}`],"run.json"));
if(run.status!=="completed"){console.log(JSON.stringify({pending:true,status:run.status,head:run.head_sha}));process.exit(0);}
const [jobsText,artifactsText,log]=await Promise.all([
 command(["api",`${root}/actions/runs/${runId}/jobs?per_page=100`],"jobs.json"),
 command(["api",`${root}/actions/runs/${runId}/artifacts?per_page=100`],"artifacts.json"),
 command(["run","view",runId,"--repo","Tien-Lam/ChronoShift","--log"],"run.log"),
]);
const jobs=JSON.parse(jobsText),artifacts=JSON.parse(artifactsText);
function parse(text:string){return text.split("\n").filter(line=>line.includes("\tRun bun run test:browser\t")).flatMap(line=>{
 const m=line.match(/(✓|✘|-)\s+\d+\s+\[([^\]]+)\] › (.+?):(\d+):(\d+) › (.*)/);
 if(!m)return[];const title=m[6].replace(/ \([\d.]+(?:s|ms|m)\)$/,""),retry=title.match(/ \(retry #(\d+)\)$/);
 return [{symbol:m[1],project:m[2],file:m[3],line:Number(m[4]),column:Number(m[5]),title:title.replace(/ \(retry #\d+\)$/,""),retry:retry?Number(retry[1]):0}];
});}
const actual=parse(log),baseline=parse(await Bun.file(join(import.meta.dir,"../control-linux.log")).text());
const key=(x:any)=>`${x.project}\t${x.file}\t${x.title}`;
const expectedKeys=new Set(baseline.map(key)),actualKeys=new Set(actual.map(key));
const profiles:any={};for(const x of actual){const p=(profiles[x.project]||={passed:0,skipped:0,failed:0,retries:0});p[x.symbol==="✓"?"passed":x.symbol==="-"?"skipped":"failed"]++;if(x.retry)p.retries++;}
const required=["Run bun run format:check","Unit tests and production build","Verify the standalone conversion corpus audit","Run bun run test:browser","Verify repository-subpath deployment","Upload the verified Pages build"];
const web=jobs.jobs.find((j:any)=>j.name==="web");
const metadata=log.split("\n").filter(line=>line.includes("[ci-environment] ")).map(line=>JSON.parse(line.slice(line.indexOf("[ci-environment] ")+17)));
const summary={runId,head,run:{event:run.event,path:run.path,head:run.head_sha,conclusion:run.conclusion,attempt:run.run_attempt},jobsComplete:jobs.total_count===jobs.jobs.length,artifactsComplete:artifacts.total_count===artifacts.artifacts.length,job:web?{id:web.id,conclusion:web.conclusion,labels:web.labels,started_at:web.started_at,completed_at:web.completed_at,seconds:(Date.parse(web.completed_at)-Date.parse(web.started_at))/1000,steps:web.steps}:null,required:required.map(name=>({name,conclusion:web?.steps.find((s:any)=>s.name===name)?.conclusion})),attempts:actual.length,unique:actualKeys.size,baselineAttempts:baseline.length,baselineUnique:expectedKeys.size,missing:[...expectedKeys].filter(k=>!actualKeys.has(k)),added:[...actualKeys].filter(k=>!expectedKeys.has(k)),profiles,skipped:actual.filter(x=>x.symbol==="-"),failed:actual.filter(x=>x.symbol==="✘"),retries:actual.filter(x=>x.retry>0),resourceObservations:metadata,artifacts:artifacts.artifacts.map((a:any)=>({id:a.id,name:a.name,expired:a.expired,bytes:a.size_in_bytes,digest:a.digest,created:a.created_at,expires:a.expires_at})),summaries:log.split("\n").filter(line=>/\b(\d+ passed|\d+ skipped|\d+ pass|\d+ fail)\b/.test(line)),retryMarkers:log.split("\n").filter(line=>/retry #|flaky|failed-attempt marker/i.test(line))};
await Bun.write(join(dir,"review.json"),JSON.stringify(summary,null,2)+"\n");
await Bun.write(join(dir,"attempts.json"),JSON.stringify(actual,null,2)+"\n");
console.log(JSON.stringify(summary,null,2));
