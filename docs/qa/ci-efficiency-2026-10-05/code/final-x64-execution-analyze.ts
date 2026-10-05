import { strict as assert } from 'node:assert';
const dir='docs/qa/ci-efficiency-2026-10-05/code';
const began=new Date().toISOString();
function parse(raw:string){
  const rows:any[]=[];
  for(const line of raw.split('\n')){
    const parts=line.split('\t');if(parts[1]!=='Run bun run test:browser')continue;
    const text=parts.slice(2).join('\t').replace(/\x1b\[[0-9;]*[A-Za-z]/g,'').replace(/\uFEFF/g,'');
    const m=text.match(/^(\S+Z)\s+([✓✘-])\s+(\d+) \[([^\]]+)\] › (e2e\/[^ ]+:\d+:\d+) › (.*)$/);if(!m)continue;
    const duration=m[6].match(/ \(([\d.]+(?:ms|s|m))\)$/)?.[1]??null;
    const titled=duration?m[6].replace(/ \(([\d.]+(?:ms|s|m))\)$/,''):m[6];
    const title=titled.replace(/ \(retry #\d+\)$/,'');const retry=Number(titled.match(/retry #(\d+)/)?.[1]||0);
    rows.push({time:m[1],status:m[2]==='✓'?'passed':m[2]==='-'?'skipped':'failed',number:Number(m[3]),project:m[4],location:m[5],title,retry,duration,key:m[4]+'|'+m[5]+'|'+title});
  }
  return rows;
}
const log=await Bun.file(dir+'/final-x64-execution.log').text();const attempts=parse(log);const initial=attempts.filter(x=>x.retry===0);
assert.equal(initial.length,258);assert.equal(new Set(initial.map(x=>x.key)).size,258);
const control=parse(await Bun.file('docs/qa/ci-efficiency-2026-10-05/control-linux.log').text());assert.equal(control.length,258);assert.deepEqual(initial.map(x=>x.key).sort(),control.map(x=>x.key).sort());
const run=await Bun.file(dir+'/final-x64-run.json').json();const jobs=await Bun.file(dir+'/final-x64-jobs.json').json();const artifacts=await Bun.file(dir+'/final-x64-artifacts.json').json();assert.equal(run.head_sha,'b288920d072d6ebb6ca56d1ea83f7c95ea7bed02');assert.equal(run.status,'completed');assert.equal(jobs.total_count,jobs.jobs.length);assert.equal(jobs.jobs.length,1);assert.equal(artifacts.total_count,artifacts.artifacts.length);
const web=jobs.jobs[0];const seconds=(a:string,b:string)=>(Date.parse(b)-Date.parse(a))/1000;const browser=web.steps.find((x:any)=>x.name==='Run bun run test:browser');
const resources=log.split('\n').filter(x=>x.includes('[ci-environment]')).map(x=>JSON.parse(x.slice(x.indexOf('[ci-environment]')+'[ci-environment]'.length).trim()));assert.equal(resources.length,2);assert(resources.every(x=>x.architecture==='x64'));
const projects=Object.fromEntries([...new Set(initial.map(x=>x.project))].map(name=>[name,{initial:initial.filter(x=>x.project===name).length,passedInitial:initial.filter(x=>x.project===name&&x.status==='passed').length,skippedInitial:initial.filter(x=>x.project===name&&x.status==='skipped').length,failedInitial:initial.filter(x=>x.project===name&&x.status==='failed').length}]));
const required=['Run bun run format:check','Unit tests and production build','Verify the standalone conversion corpus audit','Run bun run test:browser','Verify repository-subpath deployment','Upload the verified Pages build'];
const out={began,ended:new Date().toISOString(),run:{id:run.id,head:run.head_sha,status:run.status,conclusion:run.conclusion,attempt:run.run_attempt},job:{id:web.id,start:web.started_at,end:web.completed_at,seconds:seconds(web.started_at,web.completed_at),roundedMinutes:Math.ceil(seconds(web.started_at,web.completed_at)/60),labels:web.labels,conclusion:web.conclusion},browser:{start:browser.started_at,end:browser.completed_at,seconds:seconds(browser.started_at,browser.completed_at),conclusion:browser.conclusion},counts:{initial:initial.length,unique:new Set(initial.map(x=>x.key)).size,initialPasses:initial.filter(x=>x.status==='passed').length,initialSkips:initial.filter(x=>x.status==='skipped').length,initialFailures:initial.filter(x=>x.status==='failed').length,retryAttempts:attempts.filter(x=>x.retry>0).length,totalAttempts:attempts.length},projects,identityHash:new Bun.CryptoHasher('sha256').update(initial.map(x=>x.key).sort().join('\n')).digest('hex'),sameControlIdentitySet:true,unexpected:attempts.filter(x=>x.retry>0||x.status==='failed'),resources,requiredSteps:required.map(name=>web.steps.find((x:any)=>x.name===name)),artifacts:artifacts.artifacts,diagnosticsStep:web.steps.find((x:any)=>x.name==='Publish failed-attempt diagnostics'),timingStep:web.steps.find((x:any)=>x.name==='Retain bounded browser timing metadata'),cdpPasses:initial.filter(x=>x.status==='passed'&&(x.project==='foldable'||x.location.startsWith('e2e/uncontrolled.spec.ts')))};
await Bun.write(dir+'/final-x64-attempts.json',JSON.stringify(attempts,null,2));await Bun.write(dir+'/final-x64-summary.json',JSON.stringify(out,null,2));console.log(JSON.stringify({began:out.began,ended:out.ended,run:out.run,job:out.job,browser:out.browser,counts:out.counts,projects,unexpected:out.unexpected,identityHash:out.identityHash,cdpPasses:out.cdpPasses.length}));
