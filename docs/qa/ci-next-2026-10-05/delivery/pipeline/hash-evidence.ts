import {readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='/tmp/chronoshift-ci-next-delivery/pipeline';
const began=new Date().toISOString();
const names=(await readdir(root)).filter(name=>name!=='all-evidence-digests.json').sort();
const files=await Promise.all(names.map(async name=>{const bytes=await Bun.file(root+'/'+name).bytes();return {name,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')};}));
await Bun.write(root+'/all-evidence-digests.json',JSON.stringify({began,ended:new Date().toISOString(),files},null,2)+'\n');
console.log(JSON.stringify({files:files.length}));
