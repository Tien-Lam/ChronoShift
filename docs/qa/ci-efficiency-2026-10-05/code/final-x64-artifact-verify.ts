import { strict as assert } from 'node:assert';
const dir='docs/qa/ci-efficiency-2026-10-05/code';
const began=new Date().toISOString();
const commands:any[]=[];
async function run(args:string[]){const began=new Date().toISOString();const p=Bun.spawn(args,{stdout:'pipe',stderr:'pipe'});const [bytes,stderr,code]=await Promise.all([new Response(p.stdout).arrayBuffer(),new Response(p.stderr).text(),p.exited]);commands.push({args,began,end:new Date().toISOString(),code,stderr});assert.equal(code,0);return new Uint8Array(bytes);}
const hash=(bytes:Uint8Array)=>new Bun.CryptoHasher('sha256').update(bytes).digest('hex');
const meta=(await Bun.file(dir+'/final-x64-artifacts.json').json()).artifacts[0];
const zip=new Uint8Array(await Bun.file(dir+'/final-x64-pages.zip').arrayBuffer());assert.equal('sha256:'+hash(zip),meta.digest);
assert.equal(new TextDecoder().decode(await run(['unzip','-Z1',dir+'/final-x64-pages.zip'])).trim(),'artifact.tar');
const tar=dir+'/final-x64-pages.tar';
const paths=new TextDecoder().decode(await run(['tar','-tf',tar])).trim().split('\n');
const entries=new TextDecoder().decode(await run(['tar','-tvf',tar])).trim().split('\n');assert(entries.every(x=>x[0]==='-'||x[0]==='d'));assert.equal(entries.length,paths.length);assert.equal(new Set(paths.map(x=>x.replace(/\/$/,''))).size,paths.length);assert(paths.every(x=>x.startsWith('./')&&!x.split('/').includes('..')&&!/[\\\r\n\0]/.test(x)));
const files:any[]=[];const bytesMap=new Map<string,Uint8Array>();for(const path of paths.filter(x=>!x.endsWith('/'))){const bytes=await run(['tar','-xOf',tar,path]);bytesMap.set(path,bytes);files.push({path,bytes:bytes.length,sha256:hash(bytes)});}
const read=(path:string)=>new TextDecoder().decode(bytesMap.get('./'+path)!);
const release=JSON.parse(read('release.json'));assert.equal(release.base,'/ChronoShift/');assert(/^[a-f0-9]{40}$/.test(release.sourceCommit));
const commits:any[]=[];for(const sha of ['b288920d072d6ebb6ca56d1ea83f7c95ea7bed02',release.sourceCommit])commits.push(JSON.parse(new TextDecoder().decode(await run(['gh','api','repos/Tien-Lam/ChronoShift/commits/'+sha]))));assert.equal(commits[0].commit.tree.sha,commits[1].commit.tree.sha);
const sw=read('sw.js');assert.equal(sw.match(/const VERSION = '([^']+)'/)?.[1],'870b29e6e2bb56d0');const integrity=JSON.parse(sw.match(/const INTEGRITY = (\{.*\});/)![1]);const precache=JSON.parse(sw.match(/const PRECACHE = (\[.*\]);/)![1]);assert.equal(precache.length,13);assert.equal(Object.keys(integrity).length,13);for(const path of precache){assert(path.startsWith('/ChronoShift/'));assert.equal(integrity[path],hash(bytesMap.get('./'+path.slice('/ChronoShift/'.length))!));}
const out={began,ended:new Date().toISOString(),meta,zipSha256:hash(zip),tarSha256:hash(new Uint8Array(await Bun.file(tar).arrayBuffer())),paths,files,release,sourceTrees:commits.map(x=>({sha:x.sha,tree:x.commit.tree.sha,parents:x.parents.map((p:any)=>p.sha)})),version:sw.match(/const VERSION = '([^']+)'/)?.[1],precache,integrity,commands};await Bun.write(dir+'/final-x64-artifact-verification.json',JSON.stringify(out,null,2));console.log(JSON.stringify({began:out.began,ended:out.ended,zipSha256:out.zipSha256,release,files:files.length,integrity:precache.length,sourceTrees:out.sourceTrees}));
