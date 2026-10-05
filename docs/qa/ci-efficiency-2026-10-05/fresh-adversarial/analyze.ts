import {join} from 'node:path';
import {trustedRun,safeArchive,releaseMatches} from '../../../../scripts/reuse-pages-artifact';
const startedAt=new Date().toISOString(),dir=import.meta.dir;
const commands:any[]=[];
async function command(args:string[]) {const start=new Date().toISOString();const p=Bun.spawn(args,{stdout:'pipe',stderr:'pipe'});const [raw,error,code]=await Promise.all([new Response(p.stdout).arrayBuffer(),new Response(p.stderr).text(),p.exited]);commands.push({args,start,end:new Date().toISOString(),code,error});if(code!==0)throw Error(error);return new Uint8Array(raw);}
async function json(args:string[]){return JSON.parse(new TextDecoder().decode(await command(args)));}
const run=await Bun.file(join(dir,'37274709527-run.json')).json(),jobs=await Bun.file(join(dir,'37274709527-jobs.json')).json(),artifacts=await Bun.file(join(dir,'37274709527-artifacts.json')).json();
const artifact=artifacts.artifacts[0];const root='repos/Tien-Lam/ChronoShift';
const archive=await command(['gh','api',`${root}/actions/artifacts/${artifact.id}/zip`]);await Bun.write(join(dir,'candidate-pages.zip'),archive);
const digest='sha256:'+new Bun.CryptoHasher('sha256').update(archive).digest('hex');
const memberList=new TextDecoder().decode(await command(['unzip','-Z1',join(dir,'candidate-pages.zip')])).trim().split('\n');
const tar=await command(['unzip','-p',join(dir,'candidate-pages.zip'),'artifact.tar']);await Bun.write(join(dir,'candidate-pages.tar'),tar);
const paths=new TextDecoder().decode(await command(['tar','-tf',join(dir,'candidate-pages.tar')])).trim().split('\n');
const entries=new TextDecoder().decode(await command(['tar','-tvf',join(dir,'candidate-pages.tar')])).trim().split('\n');
const release=await json(['tar','-xOf',join(dir,'candidate-pages.tar'),'./release.json']);
const [repo,workflow,head,source]=await Promise.all([json(['gh','api',root]),json(['gh','api',root+'/actions/workflows/web.yml']),json(['gh','api',root+'/commits/'+run.head_sha]),json(['gh','api',root+'/commits/'+release.sourceCommit])]);
const log=(await Bun.file(join(dir,'37274709527.log')).text()).replace(/\x1b\[[0-9;]*m/g,'');
const matches=log.split('\n').filter(l=>l.includes('\tRun bun run test:browser\t')).map(l=>l.match(/(✓|✘|×|-)\s+(\d+)\s+\[([^\]]+)\]\s+›\s+(e2e\/.*)$/)).filter(Boolean).map(m=>({status:m![1],id:+m![2],project:m![3],test:m![4]}));
const retries=log.split('\n').filter(l=>/retry #|\(retry|Retry #/.test(l));
const duration=(job:any)=>(Date.parse(job.completed_at)-Date.parse(job.started_at))/1000;
const baselinePRJobs=await Bun.file(join(dir,'37131752983-jobs.json')).json();
const baselinePagesJobs=await Bun.file(join(dir,'37131749773-jobs.json')).json();
const baselineJobs=baselinePRJobs.jobs.concat(baselinePagesJobs.jobs);
const baselineArtifacts=[{bytes:561341,retentionHours:336,origin:'baseline PR API and raw upload log'},{bytes:530892,retentionHours:336,origin:'baseline Pages verification API and raw upload log'},{bytes:220772,retentionHours:336,origin:'baseline Pages build raw upload log; no longer listed by artifacts API'}];
const projectedCandidateArtifacts=[{bytes:artifact.size_in_bytes,retentionHours:24,origin:'actual candidate PR API/zip'},{bytes:artifact.size_in_bytes,retentionHours:336,origin:'projection assuming same-sized reused/main zip; main publication pending'}];
const baselineByteHours=baselineArtifacts.reduce((s,x)=>s+x.bytes*x.retentionHours,0),projectedCandidateByteHours=projectedCandidateArtifacts.reduce((s,x)=>s+x.bytes*x.retentionHours,0);
const result={startedAt,endedAt:new Date().toISOString(),commands,artifact:{id:artifact.id,bytes:archive.length,apiDigest:artifact.digest,digest,digestMatches:digest===artifact.digest,memberList,tarBytes:tar.length,safeArchive:safeArchive(paths,entries),paths,release,headTree:head.commit.tree.sha,releaseTree:source.commit.tree.sha,releaseMatches:releaseMatches(release,source.commit.tree.sha,head.commit.tree.sha),trustedRun:trustedRun(run,repo.id,workflow.id,jobs.jobs)},attempts:{total:matches.length,uniqueIds:new Set(matches.map(m=>m.id)).size,passes:matches.filter(m=>m.status==='✓').length,skips:matches.filter(m=>m.status==='-'),failures:matches.filter(m=>m.status==='✘'||m.status==='×'),retries,rows:matches,failedMarkerUploadStep:jobs.jobs[0].steps.find((s:any)=>s.name==='Publish failed-attempt diagnostics'),uploadedNames:artifacts.artifacts.map((a:any)=>a.name),structuredAttemptsAvailable:false,limitation:'ci-timing disabled and successful workflow does not retain HTML/structured attempts; full log and upload condition independently reconciled'},cost:{baselineSeconds:baselineJobs.reduce((s:number,j:any)=>s+duration(j),0),baselineRoundedMinutes:baselineJobs.reduce((s:number,j:any)=>s+Math.ceil(duration(j)/60),0),candidatePRSeconds:duration(jobs.jobs[0]),candidatePRRoundedMinutes:Math.ceil(duration(jobs.jobs[0])/60),targetRoundedMinutes:8*.8,baselineArtifacts,projectedCandidateArtifacts,baselineByteHours,projectedCandidateByteHours,projectedArtifactReductionPercent:100*(1-projectedCandidateByteHours/baselineByteHours),coverageCaveat:'Baseline PR/main browser runs each report68 passes plus1 subpath pass; candidate reports249 passes/9 existing skips plus1 subpath pass. Historical baseline is not equal case inventory.'}};
await Bun.write(join(dir,'analysis.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({artifact:result.artifact,attempts:{...result.attempts,rows:undefined},cost:result.cost},null,2));
