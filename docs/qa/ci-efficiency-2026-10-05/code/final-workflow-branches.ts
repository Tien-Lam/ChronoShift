import { strict as assert } from 'node:assert';
const began=new Date().toISOString();
const pages=Bun.YAML.parse(await Bun.file('.github/workflows/pages.yml').text()) as any;
const web=Bun.YAML.parse(await Bun.file('.github/workflows/web.yml').text()) as any;
const evidence:any={began,head:'8a4ebec0881f8363ffd19f833bbf29a44e77885a',expressions:{main:pages.jobs.prepare.if,verify:pages.jobs.verify.if,deploy:pages.jobs.deploy.if,timing:web.jobs.web.env.CHRONOSHIFT_CI_TIMING},branches:[],timing:[]};
function evaluate(expression:string,state:any){return Function('github','needs','steps','always','cancelled',`return (${expression})`)(state.github,state.needs,state.steps,()=>true,()=>state.cancelled);}
for(const reused of ['true','false','']) for(const result of ['success','failure','cancelled']) for(const verify of ['success','failure','skipped']) for(const cancelled of [false,true]) {
  const state={github:{ref:'refs/heads/main'},needs:{prepare:{result,outputs:{reused}},verify:{result:verify}},cancelled};
  const observed={verify:evaluate(pages.jobs.verify.if,state),deploy:evaluate(pages.jobs.deploy.if,state)};
  assert.equal(observed.verify,result==='success'&&reused!=='true');
  assert.equal(observed.deploy,!cancelled&&result==='success'&&reused!=='true'&&verify==='success');
  evidence.branches.push({reused,prepare:result,verify,cancelled,...observed});
}
for(const ref of ['refs/heads/main','refs/heads/topic','refs/tags/release'])assert.equal(evaluate(pages.jobs.prepare.if,{github:{ref}}),ref==='refs/heads/main');
assert.equal(pages.jobs.prepare.steps.find((x:any)=>x.id==='reuse').if,"github.event_name == 'push'");
assert.equal(pages.jobs.prepare.steps.find((x:any)=>x.id==='deployment').if,"steps.reuse.outputs.reused == 'true'");
assert.equal(pages.jobs.prepare.permissions.pages,'write');assert.equal(pages.jobs.prepare.permissions['id-token'],'write');
assert.deepEqual(pages.jobs.verify.permissions,{contents:'read',pages:'read'});assert.equal(pages.jobs.verify.uses,'./.github/workflows/web.yml');assert.equal(pages.jobs.verify.with['publish-pages'],true);
assert.equal(pages.concurrency.group,'pages-publication');assert.equal(pages.concurrency['cancel-in-progress'],false);
for(const job of [pages.jobs.prepare,pages.jobs.deploy]) {assert.equal(job.environment.name,'github-pages');assert.equal(job.concurrency.group,'github-pages');assert.equal(job.concurrency['cancel-in-progress'],false);}
const timingExpression=web.jobs.web.env.CHRONOSHIFT_CI_TIMING.slice(3,-2).replaceAll('inputs.ci-timing',"inputs['ci-timing']").replaceAll('github.event.pull_request.labels.*.name','labels');
for(const event of ['pull_request','push','workflow_dispatch'])for(const input of [false,true])for(const labels of [[],['ci-timing'],['other']]) {
  const actual=Function('inputs','github','labels','contains',`return (${timingExpression})`)({'ci-timing':input},{event_name:event},labels,(xs:string[],v:string)=>xs.some(x=>x.toLowerCase()===v.toLowerCase()));
  const expected=input||(event==='pull_request'&&labels.includes('ci-timing'))?'1':'0';assert.equal(actual,expected);evidence.timing.push({event,input,labels,actual});
}
assert.equal(web.on.workflow_call.inputs['ci-timing'].default,false);
assert.equal(Object.hasOwn(web.on,'pull_request_target'),false);
evidence.status='passed';evidence.ended=new Date().toISOString();await Bun.write('docs/qa/ci-efficiency-2026-10-05/code/final-workflow-branches.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify({status:evidence.status,began,evidenceEnd:evidence.ended,branches:evidence.branches.length,timing:evidence.timing.length}));
