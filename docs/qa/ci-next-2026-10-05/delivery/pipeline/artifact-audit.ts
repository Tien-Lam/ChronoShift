import {createHash} from 'node:crypto';
const root='/tmp/chronoshift-ci-next-delivery/pipeline';
const began=new Date().toISOString();
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
async function command(argv:string[]) {
  const process=Bun.spawn(argv,{stdout:'pipe',stderr:'pipe'});
  const bytes=await new Response(process.stdout).bytes();
  const stderr=await new Response(process.stderr).text();
  const code=await process.exited;
  if(code!==0) throw new Error(`${JSON.stringify(argv)} failed ${code}: ${stderr}`);
  return bytes;
}
async function inventory(tar:string) {
  const paths=new TextDecoder().decode(await command(['tar','-tf',tar])).trim().split('\n');
  const types=new TextDecoder().decode(await command(['tar','-tvf',tar])).trim().split('\n');
  if(paths.length!==types.length || paths.some(p=>!p.startsWith('./') || p.includes('\\') || p.split('/').includes('..')) || types.some(p=>!['d','-'].includes(p[0]))) throw new Error('Unsafe archive paths/types');
  const files=paths.filter((p,i)=>types[i][0]==='-');
  return {paths,types,files:await Promise.all(files.map(async path=>{const bytes=await command(['tar','-xOf',tar,path]);return {path,bytes:bytes.length,sha256:hash(bytes)};}))};
}
const metadata=await Bun.file(root+'/pages-artifacts.json').json();
const artifact=metadata.artifacts.find((a:any)=>a.name==='github-pages');
const zip=await Bun.file(root+'/pages-final.zip').bytes();
const zipMembers=new TextDecoder().decode(await command(['unzip','-Z1',root+'/pages-final.zip'])).trim().split('\n');
if(zipMembers.length!==1 || zipMembers[0]!=='artifact.tar') throw new Error('Unexpected zip members');
if(zip.length!==artifact.size_in_bytes || 'sha256:'+hash(zip)!==artifact.digest) throw new Error('ZIP metadata digest/size mismatch');
const tar=await command(['unzip','-p',root+'/pages-final.zip','artifact.tar']);
await Bun.write(root+'/pages-final.tar',tar);
const pr=await inventory(root+'/final-pages.tar'), pages=await inventory(root+'/pages-final.tar');
await Bun.write(root+'/pages-final-paths.txt',pages.paths.join('\n')+'\n');
await Bun.write(root+'/pages-final-entries.txt',pages.types.join('\n')+'\n');
const pagesRelease=JSON.parse(new TextDecoder().decode(await command(['tar','-xOf',root+'/pages-final.tar','./release.json'])));
await Bun.write(root+'/pages-release.json',JSON.stringify(pagesRelease,null,2)+'\n');
const prRelease=await Bun.file(root+'/release.json').json();
const tested=await Bun.file(root+'/tested-merge-commit.json').json(), main=await Bun.file(root+'/main-commit.json').json();
pr.files.sort((a,b)=>a.path.localeCompare(b.path));
pages.files.sort((a,b)=>a.path.localeCompare(b.path));
const sameFiles=JSON.stringify(pr.files)===JSON.stringify(pages.files);
const changed=pages.files.filter(p=>{const old=pr.files.find(f=>f.path===p.path);return !old || old.sha256!==p.sha256 || old.bytes!==p.bytes;});
const expectedTree='e42d8c81cc83befed6ff9d57dbf56066c7238d07';
if(tested.commit.tree.sha!==expectedTree || main.commit.tree.sha!==expectedTree || prRelease.sourceCommit!==tested.sha || prRelease.base!=='/ChronoShift/' || pagesRelease.sourceCommit!==tested.sha || pagesRelease.base!=='/ChronoShift/') throw new Error('Provenance mismatch');
if(!sameFiles) throw new Error('PR/publication files differ');
const result={began,ended:new Date().toISOString(),pagesArtifact:{id:artifact.id,bytes:zip.length,digest:'sha256:'+hash(zip),matchesMetadata:true,expires_at:artifact.expires_at},prArtifact:await Bun.file(root+'/zip-identity.json').json(),testedMerge:{sha:tested.sha,tree:tested.commit.tree.sha,parents:tested.parents.map((p:any)=>p.sha)},main:{sha:main.sha,tree:main.commit.tree.sha},prRelease,pagesRelease,sameFiles,changed,pr,pages,limits:['Archive metadata and ZIP compression can differ; all regular-file bytes are compared independently.','This audits downloaded artifacts and hosted reuse logs, not live HTTP responses or browser behavior.']};
await Bun.write(root+'/artifact-audit.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({sameFiles,fileCount:pages.files.length,treeMatches:true,pagesDigest:result.pagesArtifact.digest}));
