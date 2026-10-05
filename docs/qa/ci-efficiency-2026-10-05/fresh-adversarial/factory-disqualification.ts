import { resolve } from 'node:path';
import { cpus, release, totalmem } from 'node:os';
import { testReleases } from '../../../../scripts/test-releases';

const root = resolve(import.meta.dir, '../../../../');
const dist = resolve(root, 'dist');
const mode = process.argv[2];
const hash = (bytes: string | Uint8Array) => new Bun.CryptoHasher('sha256').update(bytes).digest('hex');
async function inventory() {
  const paths = [...new Bun.Glob('**/*').scanSync({cwd:dist, onlyFiles:true})].sort();
  return await Promise.all(paths.map(async path => {
    const bytes = await Bun.file(resolve(dist,path)).bytes();
    return {path,bytes:bytes.length,sha256:hash(bytes)};
  }));
}
if (mode === 'fresh' || mode === 'warm') {
  const began = new Date().toISOString();
  const rows = [];
  for (let iteration=0;iteration<(mode==='fresh'?1:4);iteration++) {
    const startClock=new Date().toISOString();
    const cpuBefore=process.cpuUsage();
    const start=performance.now();
    const fixtures=await testReleases(dist);
    const wallMs=performance.now()-start;
    const cpu=process.cpuUsage(cpuBefore);
    const endClock=new Date().toISOString();
    // Hashing/checking the generated output occurs after the measured factory window.
    const maps=[...fixtures.releases.entries()].map(([version,map])=>({version,entries:[...map.entries()].map(([path,body])=>({path,bytes:new TextEncoder().encode(body).length,sha256:hash(body)})).sort((a,b)=>a.path.localeCompare(b.path))}));
    const immutable=[...fixtures.immutable.entries()].map(([path,body])=>({path,bytes:new TextEncoder().encode(body).length,sha256:hash(body)})).sort((a,b)=>a.path.localeCompare(b.path));
    rows.push({iteration,condition:iteration===0?'first-factory-call-in-fresh-process':'repeated-call-in-same-process',startClock,endClock,wallMs,
      processUserCpuMs:cpu.user/1000,processSystemCpuMs:cpu.system/1000,processCpuMs:(cpu.user+cpu.system)/1000,
      outputHash:hash(JSON.stringify({maps,immutable})),releaseCount:maps.length,immutableCount:immutable.length});
  }
  console.log(JSON.stringify({began,ended:new Date().toISOString(),mode,pid:process.pid,rows},null,2));
} else {
  const began=new Date().toISOString();
  const before=await inventory();
  const records=[];
  for(let block=1;block<=3;block++)for(const condition of ['fresh','warm']) {
    const child=Bun.spawn([process.execPath,import.meta.filename,condition],{cwd:root,stdout:'pipe',stderr:'pipe'});
    const [stdout,stderr,exitCode]=await Promise.all([new Response(child.stdout).text(),new Response(child.stderr).text(),child.exited]);
    await Bun.write(resolve(import.meta.dir,`factory-disqualification-${block}-${condition}.json`),stdout);
    if(exitCode!==0||stderr)throw new Error(`Factory probe failed: ${condition}, ${exitCode}, ${stderr}`);
    records.push({...JSON.parse(stdout),block});
  }
  const after=await inventory();
  const rows=records.flatMap(r=>r.rows.map((row:any)=>({...row,block:r.block,mode:r.mode,pid:r.pid})));
  const summaries=['fresh','warm'].map(condition=>{
    const selected=rows.filter(r=>condition==='fresh'?r.mode==='fresh':r.mode==='warm'&&r.iteration>0);
    const values=(key:string)=>selected.map(r=>r[key]).sort((a,b)=>a-b);
    const median=(key:string)=>values(key)[Math.floor(selected.length/2)];
    return{condition,count:selected.length,medianWallMs:median('wallMs'),minWallMs:values('wallMs')[0],maxWallMs:values('wallMs').at(-1),medianProcessCpuMs:median('processCpuMs'),maxProcessCpuMs:values('processCpuMs').at(-1)};
  });
  const result={began,ended:new Date().toISOString(),environment:{bun:Bun.version,bunExecutable:process.execPath,platform:process.platform,arch:process.arch,kernelRelease:release(),cpuModel:cpus()[0]?.model,logicalCpus:cpus().length,totalMemoryBytes:totalmem()},
    dist,source:await Bun.file(resolve(dist,'release.json')).json(),factorySourceHash:hash(await Bun.file(resolve(root,'scripts/test-releases.ts')).bytes()),
    inputInventoryBefore:before,inputInventoryAfter:after,inputBytesUnchanged:JSON.stringify(before)===JSON.stringify(after),
    generatedOutputHashes:[...new Set(rows.map(r=>r.outputHash))],summaries,rows,
    limits:['Factory-window wall/process CPU only; child process/module startup excluded.','Before-inventory hashing warms filesystem data; OS page cache is uncontrolled, so fresh means process-fresh, not cold disk.','Process CPU includes all Bun threads and can exceed wall time; it is not exclusive main-thread CPU.','Output hashing outside measured windows may warm later process repetitions. No source, dist, server, browser or CI changes.']};
  await Bun.write(resolve(import.meta.dir,'factory-disqualification.json'),JSON.stringify(result,null,2));
  console.log(JSON.stringify({began,ended:result.ended,source:result.source,environment:result.environment,inputBytesUnchanged:result.inputBytesUnchanged,generatedOutputHashes:result.generatedOutputHashes,summaries},null,2));
}
