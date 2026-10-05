import {mkdir,chmod} from 'node:fs/promises';
import {join,resolve} from 'node:path';
import {trustedRun,safeArchive,releaseMatches} from '../../../../scripts/reuse-pages-artifact';
import {classifyTimingStep} from '../../../../e2e/timing-reporter';
const start=new Date().toISOString(), directory=import.meta.dir;
const sha='b288920d072d6ebb6ca56d1ea83f7c95ea7bed02';
async function command(args:string[], options:any={}) {
 const p=Bun.spawn(args,{stdout:'pipe',stderr:'pipe',...options});
 const [bytes,error,code]=await Promise.all([new Response(p.stdout).arrayBuffer(),new Response(p.stderr).text(),p.exited]);
 return {bytes:new Uint8Array(bytes),text:new TextDecoder().decode(bytes),error,code};
}
const tree=(await command(['git','rev-parse',sha+'^{tree}'])).text.trim();
const run={id:1,workflow_id:2,path:'.github/workflows/web.yml',event:'pull_request',status:'completed',conclusion:'success',head_sha:sha,head_repository:{id:3}};
const job={name:'web',conclusion:'success',steps:['Run bun run format:check','Unit tests and production build','Verify the standalone conversion corpus audit','Run bun run test:browser','Verify repository-subpath deployment','Upload the verified Pages build'].map(name=>({name,conclusion:'success'}))};
const unit:any[]=[];
function check(name:string,actual:boolean,expected=false){unit.push({name,actual,expected,passed:actual===expected});}
check('trusted positive control',trustedRun(run,3,2,[job]),true);
for(const [name,patch] of Object.entries({fork:{head_repository:{id:4}},wrongWorkflow:{workflow_id:4},wrongPath:{path:'other'},push:{event:'push'},incomplete:{status:'in_progress'},failed:{conclusion:'failure'},malformedSHA:{head_sha:'INVALID'}}))check(name,trustedRun({...run,...patch},3,2,[job]));
for(const conclusion of ['failure','skipped','cancelled'])check(`partial gate ${conclusion}`,trustedRun(run,3,2,[{...job,steps:job.steps.map((s,i)=>i===3?{...s,conclusion}:s)}]));
check('archive positive',safeArchive(['./','./index.html'],['drwxr-xr-x owner ./','-rw-r--r-- owner ./index.html']),true);
for(const path of ['/tmp/escape','./../escape','./x/../../escape','./x\\escape','./x\nescape'])check(`unsafe path ${JSON.stringify(path)}`,safeArchive([path],['-rw-r--r-- owner x']));
for(const entry of ['lrwxrwxrwx owner x','hrw-r--r-- owner x','prw-r--r-- owner x','crw-r--r-- owner x'])check(`unsafe entry ${entry}`,safeArchive(['./x'],[entry]));
check('release positive',releaseMatches({sourceCommit:sha,base:'/ChronoShift/'},tree,tree),true);
check('release tree mismatch',releaseMatches({sourceCommit:sha,base:'/ChronoShift/'},'c'.repeat(40),tree));
check('release base mismatch',releaseMatches({sourceCommit:sha,base:'/'},tree,tree));
const labels=['Fill April 9 private input','Navigate https://example.org/?private=secret','malicious private value'];
const classification=labels.map(title=>({title,classified:classifyTimingStep({category:'pw:api',title})}));
check('fixed timing operation labels only',classification.every(x=>['fill','navigate','other-api'].includes(x.classified.operation)),true);
const mockDirectory=join(directory,'mock-bin');await mkdir(mockDirectory,{recursive:true});
const mock=join(mockDirectory,'gh');
await Bun.write(mock,`#!/usr/bin/env bun\nconst d=await Bun.file(process.env.MOCK_FILE).json(); const p=Bun.argv.at(-1); if(d.fail===p){console.error('injected API failure'); process.exit(1);} if(p.endsWith('/zip')){process.stdout.write(await Bun.file(d.zip).arrayBuffer());}else if(!(p in d.responses)){console.error('unexpected endpoint '+p);process.exit(2);}else{console.log(JSON.stringify(d.responses[p]));}\n`);await chmod(mock,0o755);
const scenarios:any[]=[];
for(const name of ['no-artifact','expired-artifact','malformed-digest','oversize-artifact','wrong-head-tree','wrong-workflow','fork','missing-gate','pagination-gap','api-failure','digest-mismatch','wrong-zip-member','unsafe-tar','wrong-release-base','wrong-release-tree']){
 const cwd=join(directory,'negative-cases',name);await mkdir(cwd,{recursive:true});
 const src=join(cwd,'site');await mkdir(src);
 await Bun.write(join(src,'release.json'),JSON.stringify({sourceCommit:sha,base:name==='wrong-release-base'?'/':'/ChronoShift/'}));
 await Bun.write(join(src,'index.html'),'synthetic rejected fixture');
 if(name==='unsafe-tar')await command(['ln','-s','/tmp/escape',join(src,'link')]);
 const tar=join(cwd,'artifact.tar'),zip=join(cwd,'fixture.zip');
 await command(['tar','-cf',tar,'-C',src,'.']);
 if(name==='wrong-zip-member'){await Bun.write(join(cwd,'unexpected'),'unexpected');await command(['zip','-q',zip,'unexpected'],{cwd});}
 else await command(['zip','-q',zip,'artifact.tar'],{cwd});
 const bytes=await Bun.file(zip).bytes();
 const artifact={id:1,name:'github-pages',expired:name==='expired-artifact',size_in_bytes:name==='oversize-artifact'?8_000_001:bytes.length,digest:name==='malformed-digest'?'bad':name==='digest-mismatch'?'sha256:'+'0'.repeat(64):'sha256:'+new Bun.CryptoHasher('sha256').update(bytes).digest('hex')};
 const root='repos/Tien-Lam/ChronoShift';
 const localRun={...run,...(name==='wrong-workflow'?{workflow_id:4}:{}),...(name==='fork'?{head_repository:{id:4}}:{}),...(name==='wrong-head-tree'||name==='wrong-release-tree'?{head_sha:'a'.repeat(40)}:{})};
 const responses:any={
 [root]:{id:3},[root+'/actions/workflows/web.yml']:{id:2},[root+'/commits/'+sha]:{commit:{tree:{sha:name==='wrong-release-tree'?'b'.repeat(40):tree}}},
 [root+'/commits/'+'a'.repeat(40)]:{commit:{tree:{sha:name==='wrong-head-tree'?'b'.repeat(40):tree}}},
 [root+'/actions/workflows/2/runs?event=pull_request&status=success&per_page=30']:{workflow_runs:[localRun]},
 [root+'/actions/runs/1/jobs?per_page=100']:{total_count:name==='pagination-gap'?2:1,jobs:[{...job,steps:name==='missing-gate'?job.steps.slice(1):job.steps}]},
 [root+'/actions/runs/1/artifacts?per_page=100']:{total_count:name==='no-artifact'?0:1,artifacts:name==='no-artifact'?[]:[artifact]},
 };
 // Wrong-release-tree specifically changes tested release after main/head pass.
 if(name==='wrong-release-tree'){
  await Bun.write(join(src,'release.json'),JSON.stringify({sourceCommit:'c'.repeat(40),base:'/ChronoShift/'}));
  await command(['tar','-cf',tar,'-C',src,'.']);await command(['zip','-q',zip,'artifact.tar'],{cwd});
  const data=await Bun.file(zip).bytes();artifact.digest='sha256:'+new Bun.CryptoHasher('sha256').update(data).digest('hex');artifact.size_in_bytes=data.length;
  responses[root+'/commits/'+sha]={commit:{tree:{sha:tree}}};responses[root+'/commits/'+'c'.repeat(40)]={commit:{tree:{sha:'b'.repeat(40)}}};
 }
 const config=join(cwd,'mock.json');await Bun.write(config,JSON.stringify({responses,zip,fail:name==='api-failure'?root+'/actions/workflows/web.yml':null}));
 const output=join(cwd,'github-output');
 const startedAt=new Date().toISOString();
 const result=await command(['bun',resolve('scripts/reuse-pages-artifact.ts')],{cwd,env:{...process.env,PATH:mockDirectory+':'+process.env.PATH,TMPDIR:cwd,GITHUB_REPOSITORY:'Tien-Lam/ChronoShift',GITHUB_SHA:sha,GITHUB_OUTPUT:output,MOCK_FILE:config}});
 const endedAt=new Date().toISOString();
 const reused=await Bun.file(output).text();
 scenarios.push({name,startedAt,endedAt,code:result.code,stdout:result.text,stderr:result.error,output:reused,passed:result.code===0&&reused==='reused=false\n'&&!(await Bun.file(join(cwd,'dist/release.json')).exists())});
}
const results={startedAt:start,endedAt:new Date().toISOString(),sha,tree,unit,classification,scenarios,allPassed:[...unit,...scenarios].every(x=>x.passed)};
await Bun.write(join(directory,'negative-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({unit:unit.length,scenarios:scenarios.length,allPassed:results.allPassed}));
