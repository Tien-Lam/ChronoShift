// Read-only arithmetic over saved complete-suite records; no browser or CI run.
const began = new Date().toISOString();
const folder = `${import.meta.dir}/..`;
const raw = await Bun.file(`${folder}/control-linux-timing.json`).bytes();
const p = JSON.parse(new TextDecoder().decode(raw));
const start = Date.parse(p.startTime);
const events = p.attempts.flatMap((a:any)=>[{t:Date.parse(a.startTime),d:1},{t:Date.parse(a.startTime)+a.durationMs,d:-1}]).sort((a:any,b:any)=>a.t-b.t||a.d-b.d);
let active=0,last=events[0].t;
const occupiedByConcurrency:Record<string,number>={};
for(const event of events){occupiedByConcurrency[active]=(occupiedByConcurrency[active]||0)+event.t-last; active+=event.d;last=event.t;}
const totalTestMs=p.attempts.reduce((sum:number,a:any)=>sum+a.durationMs,0);
const groups=[...new Set(p.attempts.map((a:any)=>a.project))].map(project=>{
  const rows=p.attempts.filter((a:any)=>a.project===project);
  return{project,count:rows.length,startFromSuiteMs:Math.min(...rows.map((a:any)=>Date.parse(a.startTime)))-start,
    endFromSuiteMs:Math.max(...rows.map((a:any)=>Date.parse(a.startTime)+a.durationMs))-start,
    sumTestMs:rows.reduce((sum:number,a:any)=>sum+a.durationMs,0)};
});
const operationTotals:Record<string,{count:number,leafTotalMs:number,totalMs:number}>={};
for(const a of p.attempts)for(const [key,value]of Object.entries(a.operations)as [string,any][]){const v=operationTotals[key]||={count:0,leafTotalMs:0,totalMs:0};v.count+=value.count;v.leafTotalMs+=value.leafTotalMs;v.totalMs+=value.totalMs;}
const result={began,ended:new Date().toISOString(),environment:{bun:Bun.version,platform:process.platform,arch:process.arch},
  inputSHA256:new Bun.CryptoHasher('sha256').update(raw).digest('hex'),sourceCapture:p.startTime,status:p.status,workers:p.workers,dropped:p.droppedAttempts,
  count:p.attempts.length,distinctIds:new Set(p.attempts.map((a:any)=>a.testId)).size,
  passed:p.attempts.filter((a:any)=>a.status==='passed').length,skipped:p.attempts.filter((a:any)=>a.status==='skipped').length,
  nonZeroRetries:p.attempts.filter((a:any)=>a.retry!==0).length,invalidDurations:p.attempts.filter((a:any)=>!Number.isFinite(a.durationMs)||a.durationMs<0).length,
  suiteDurationMs:p.durationMs,totalTestMs,idealFourSlotFloorMs:totalTestMs/4,
  idealizedGapMs:p.durationMs-totalTestMs/4,
  observedAttemptSpanMs:events.at(-1).t-events[0].t,occupiedByConcurrency,
  slotOccupancy:totalTestMs/(4*(events.at(-1).t-events[0].t)),groups,operationTotals};
await Bun.write(`${import.meta.dir}/remaining-opportunities-check.json`,JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,operationTotals:undefined},null,2));
