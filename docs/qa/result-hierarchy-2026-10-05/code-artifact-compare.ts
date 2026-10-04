import {writeFile} from 'node:fs/promises';
async function command(args:string[]){const p=Bun.spawn(args,{stdout:'pipe',stderr:'pipe'});const bytes=await new Response(p.stdout).arrayBuffer();if(await p.exited)throw new Error(await new Response(p.stderr).text());return new Uint8Array(bytes);}
const source='/tmp/chronoshift-result-code-pr-artifact.tar',published='/tmp/chronoshift-result-code-pages-artifact.tar';
const sourceNames=new TextDecoder().decode(await command(['tar','-tf',source])).trim().split('\n').filter(p=>!p.endsWith('/')).sort();
const publishedNames=new TextDecoder().decode(await command(['tar','-tf',published])).trim().split('\n').filter(p=>!p.endsWith('/')).sort();
if(JSON.stringify(sourceNames)!==JSON.stringify(publishedNames))throw new Error('Artifact file inventory differs');
const files=[];
for(const name of sourceNames){const digest=[];for(const file of [source,published])digest.push(new Bun.CryptoHasher('sha256').update(await command(['tar','-xOf',file,name])).digest('hex'));if(digest[0]!==digest[1])throw new Error(`File differs: ${name}`);files.push({name,sha256:digest[0]});}
const result={time:new Date().toISOString(),sourceArtifactId:11313091969,publishedArtifactId:11313386176,allFilesIdentical:true,files};
await writeFile('/tmp/chronoshift-result-code-artifact-compare.json',JSON.stringify(result,null,2));console.log(JSON.stringify({allFilesIdentical:true,count:files.length}));
