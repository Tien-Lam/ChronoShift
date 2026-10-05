import {join} from "node:path";
const gh="/Users/tien/.local/share/mise/installs/gh/2.100.0/gh_2.100.0_macOS_arm64/bin/gh";
async function read(args:string[]){const start=new Date().toISOString(),p=Bun.spawn([gh,...args],{stdout:"pipe",stderr:"pipe"});const[stdout,stderr,code]=await Promise.all([new Response(p.stdout).text(),new Response(p.stderr).text(),p.exited]);return {args,start,end:new Date().toISOString(),stdout,stderr,code};}
const [caches,prs]=await Promise.all([
 read(["api","repos/Tien-Lam/ChronoShift/actions/caches?per_page=100"]),
 read(["pr","list","--repo","Tien-Lam/ChronoShift","--state","open","--limit","100","--json","number,state"]),
]);
if(caches.code||prs.code)throw new Error(JSON.stringify({caches,prs}));
const current=JSON.parse(caches.stdout),open=JSON.parse(prs.stdout);
const root=await Bun.file(join(import.meta.dir,"../root/cache-cleanup.json")).json();
const sum=(rows:any[])=>rows.reduce((s,c)=>s+c.sizeInBytes,0);
const identity=(c:any)=>JSON.stringify([c.id,c.key,c.ref,c.sizeInBytes]);
const retained=root.before.filter((b:any)=>!root.deleted.some((d:any)=>d.id===b.id));
const report={at:new Date().toISOString(),reads:{caches,prs},recomputed:{before:sum(root.before),after:sum(root.after),deleted:sum(root.deleted),percent:(1-sum(root.after)/sum(root.before))*100},deletedIds:root.deleted.map((c:any)=>c.id),retainedExact:retained.every((r:any)=>root.after.some((a:any)=>identity(a)===identity(r))),currentComplete:current.total_count===current.actions_caches.length,currentIds:current.actions_caches.map((c:any)=>c.id),currentBytes:current.actions_caches.reduce((s:number,c:any)=>s+c.size_in_bytes,0),currentMatchesRootAfter:root.after.every((a:any)=>current.actions_caches.some((c:any)=>c.id===a.id&&c.key===a.key&&c.ref===a.ref&&c.size_in_bytes===a.sizeInBytes)),deletedAbsent:root.deleted.every((d:any)=>!current.actions_caches.some((c:any)=>c.id===d.id)),dependabot17to21StillOpen:[17,18,19,20,21].every(id=>open.some((p:any)=>p.number===id&&p.state==="OPEN")),scope:"read-only; root driver inspected but never executed; cache snapshot is separate from paired minute/artifact-byte-hour acceptance"};
await Bun.write(join(import.meta.dir,"cache-review.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify({...report,reads:undefined},null,2));
