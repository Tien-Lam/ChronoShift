const root='/tmp/chronoshift-ci-next-delivery/pipeline';
const began=new Date().toISOString();
async function run(prefix:string) {
  const r=await Bun.file(root+'/'+prefix+'-run.json').json();
  const j=await Bun.file(root+'/'+prefix+'-jobs.json').json();
  if(j.total_count!==j.jobs.length) throw new Error('Incomplete job pagination');
  const jobs=j.jobs.map((job:any)=>{
    const rawSeconds=(Date.parse(job.completed_at)-Date.parse(job.started_at))/1000;
    const chargedProxy=job.conclusion!=='skipped' && job.steps.length>0;
    if(chargedProxy && rawSeconds<0) throw new Error('Negative active-job timing');
    return {id:job.id,name:job.name,conclusion:job.conclusion,start:job.started_at,end:job.completed_at,stepCount:job.steps.length,rawSeconds,runnerSecondsProxy:chargedProxy?rawSeconds:0,roundedMinutesProxy:chargedProxy?Math.ceil(rawSeconds/60):0,excluded:!chargedProxy};
  });
  return {id:r.id,event:r.event,head:r.head_sha,conclusion:r.conclusion,jobs,seconds:jobs.reduce((s:any,j:any)=>s+j.runnerSecondsProxy,0),roundedMinutes:jobs.reduce((s:any,j:any)=>s+j.roundedMinutesProxy,0)};
}
const baselineWeb=await run('baseline-web'), baselinePages=await run('baseline-pages'), finalWeb=await run('final'), finalPages=await run('pages'), canceledRequest=await run('request'), sticky=await run('sticky');
const baseline={web:baselineWeb,pages:baselinePages,seconds:baselineWeb.seconds+baselinePages.seconds,roundedMinutes:baselineWeb.roundedMinutes+baselinePages.roundedMinutes};
const ordinary={web:finalWeb,pages:finalPages,seconds:finalWeb.seconds+finalPages.seconds,roundedMinutes:finalWeb.roundedMinutes+finalPages.roundedMinutes};
const comparison={runnerSecondsChangePercent:100*(ordinary.seconds-baseline.seconds)/baseline.seconds,roundedMinutesReductionPercent:100*(baseline.roundedMinutes-ordinary.roundedMinutes)/baseline.roundedMinutes,meets20PercentRoundedTarget:ordinary.roundedMinutes<=baseline.roundedMinutes*.8,meets20PercentSecondsTarget:ordinary.seconds<=baseline.seconds*.8,pagesSecondsReductionPercent:100*(baselinePages.seconds-finalPages.seconds)/baselinePages.seconds};
if(baseline.seconds!==307 || baseline.roundedMinutes!==8 || ordinary.seconds!==380 || ordinary.roundedMinutes!==7 || canceledRequest.seconds!==26 || sticky.seconds!==0) throw new Error('Unexpected ledger total');
const result={began,ended:new Date().toISOString(),baseline,ordinary,comparison,separateValidationLedger:{canceledLabelRequest:canceledRequest,stickyDraftSourcePush:sticky},limits:['Per-job whole-second API durations and upward minute rounding are an observational proxy, not GitHub billing records.','One ordinary before/after pair cannot establish monthly savings, causal performance improvement, or stable runner variance.','The prior source revision and workflow differ; no hypothetical avoided draft runs are added.','Zero-step skipped jobs are excluded, including hosted Pages deploy whose completed timestamp precedes started timestamp by one second.','The canceled 26-second request is additional investigation cost, excluded from the ordinary pair.','Other validation costs are owned by the root ledger; this is not an exhaustive cost total for the project or task.']};
await Bun.write(root+'/pair-metrics.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({baselineSeconds:baseline.seconds,baselineRoundedMinutes:baseline.roundedMinutes,ordinarySeconds:ordinary.seconds,ordinaryRoundedMinutes:ordinary.roundedMinutes,comparison,separateCanceledSeconds:canceledRequest.seconds}));
