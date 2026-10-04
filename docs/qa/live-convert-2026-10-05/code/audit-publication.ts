import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {join} from 'node:path';
const base='/tmp/chronoshift-live-code';
async function cmd(args:string[]){const p=Bun.spawn(args,{stdout:'pipe',stderr:'pipe'});const [out,err,code]=await Promise.all([new Response(p.stdout).arrayBuffer(),new Response(p.stderr).text(),p.exited]);if(code!==0)throw new Error(`${args[0]} failed: ${err}`);return new Uint8Array(out);}
const sha=(x:Uint8Array)=>new Bun.CryptoHasher('sha256').update(x).digest('hex');
const reports:any[]=[];
for(const name of ['ci','pages']){
 const zip=join(base,`${name}-artifact.zip`),meta=JSON.parse(await readFile(join(base,`${name}-artifacts.json`),'utf8')).artifacts[0];
 if(`sha256:${sha(await Bun.file(zip).bytes())}`!==meta.digest)throw new Error('ZIP digest mismatch');
 const names=new TextDecoder().decode(await cmd(['unzip','-Z1',zip])).trim().split('\n');if(JSON.stringify(names)!=='["artifact.tar"]')throw new Error('Unexpected ZIP member');
 const tar=join(base,`${name}-artifact.tar`);await writeFile(tar,await cmd(['unzip','-p',zip,'artifact.tar']));
 const paths=new TextDecoder().decode(await cmd(['tar','-tf',tar])).trim().split('\n');const entries=new TextDecoder().decode(await cmd(['tar','-tvf',tar])).trim().split('\n');
 if(!paths.every(p=>p.startsWith('./')&&!p.split('/').includes('..')&&!/[\r\\]/.test(p))||!entries.every(e=>/^[-d]/.test(e)))throw new Error('Unsafe TAR members');
 const root=join(base,`${name}-verified`);await mkdir(root,{recursive:true});await cmd(['tar','-xf',tar,'-C',root]);
 const files:any={};for await(const path of new Bun.Glob('**/*').scan({cwd:root,onlyFiles:true})){const x=await Bun.file(join(root,path)).bytes();files[path]={size:x.length,sha256:sha(x)};}
 reports.push({name,artifactId:meta.id,archiveDigest:meta.digest,root,files});
}
const canonical=(files:any)=>JSON.stringify(Object.fromEntries(Object.entries(files).sort(([a],[b])=>a.localeCompare(b))));
if(canonical(reports[0].files)!==canonical(reports[1].files))throw new Error('CI/Pages file inventories differ');
const rootGiven='/tmp/chronoshift-live-ci-artifact';const rootFiles:any={};for await(const path of new Bun.Glob('**/*').scan({cwd:rootGiven,onlyFiles:true})){const x=await Bun.file(join(rootGiven,path)).bytes();rootFiles[path]={size:x.length,sha256:sha(x)};}if(canonical(rootFiles)!==canonical(reports[0].files))throw new Error('Root-provided artifact differs');
const liveResults=await Promise.all(Object.entries(reports[1].files).map(async([path,v]:any)=>{const r=await fetch(`https://tien-lam.github.io/ChronoShift/${path}?reviewAudit=${Date.now()}`,{cache:'no-store'});const bytes=new Uint8Array(await r.arrayBuffer());const digest=sha(bytes);if(!r.ok||digest!==v.sha256)throw new Error(`Hosted mismatch ${path} ${r.status} ${digest}`);return {path,status:r.status,size:bytes.length,sha256:digest,contentType:r.headers.get('content-type')};}));
const release=JSON.parse(await readFile(join(reports[1].root,'release.json'),'utf8'));const result={checkedAt:new Date().toISOString(),artifacts:reports,rootArtifactMatches:true,allFileBytesMatch:true,release,live:liveResults};await writeFile(join(base,'publication-audit.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({checkedAt:result.checkedAt,artifactIds:reports.map(r=>r.artifactId),files:liveResults.length,allFileBytesMatch:true,release}));
