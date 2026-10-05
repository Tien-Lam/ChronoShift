import {join} from 'node:path';
const mode=Bun.argv[2]||'reuse',runId=Bun.argv[3]||'37276181716',startedAt=new Date().toISOString();
const auditPath=join(import.meta.dir,'../root/publication-'+mode+'-audit.json');
const root=await Bun.file(auditPath).json(),own=await Bun.file(join(import.meta.dir,runId+'-verification.json')).json();
const script=await Bun.file(join(import.meta.dir,'../root/publication-audit.ts')).bytes();
const scriptSHA256=new Bun.CryptoHasher('sha256').update(script).digest('hex');
const sort=(files:any[])=>files.map(f=>({path:f.path,bytes:f.bytes,sha256:f.sha256})).sort((a,b)=>a.path.localeCompare(b.path));
const checks={
 scriptIdentity:scriptSHA256==='20ef907a5d6a0b4fe415b68b7392c68093bc009abcc1b3e270556c99a3f65724',
 runIdentity:root.pages.id===Number(runId)&&root.pages.head_sha===own.run.head&&root.pages.event===own.run.event&&root.pages.head_branch===own.run.branch,
 digestIdentity:root.artifacts.pages.meta.id===own.artifact.metadata.id&&root.artifacts.pages.meta.digest===own.artifact.metadata.digest&&root.artifacts.pages.zipSha256===own.artifact.zipSha256,
 filesIdentity:JSON.stringify(sort(root.artifacts.pages.files))===JSON.stringify(sort(own.artifact.files)),
 publicFileSet:JSON.stringify(root.publicFiles.map((x:any)=>x.path).sort())===JSON.stringify(own.publicFiles.map((x:any)=>x.path).sort()),
 publicActualBytes:root.publicFiles.every((r:any)=>{const actual=own.artifact.files.find((o:any)=>o.path===r.path);return r.status===200&&r.sha256===actual?.sha256&&r.bytes===actual?.bytes&&r.expectedSha256===actual?.sha256&&r.expectedBytes===actual?.bytes&&new URL(r.url).origin==='https://tien-lam.github.io';}),
 publicRootBytes:root.publicRoot.status===200&&root.publicRoot.sha256===own.publicRoot.expectedSha256&&root.publicRoot.expected===own.publicRoot.expectedSha256,
 releaseIdentity:JSON.stringify(root.artifacts.pages.release)===JSON.stringify(own.artifact.release),
 treeIdentity:Object.values(root.trees).every((t:any)=>t.tree===own.trees.publishing),
 fullNamedGateProof:root.ciJobs.jobs.some((j:any)=>j.name==='web'&&j.conclusion==='success'&&['Run bun run format:check','Unit tests and production build','Verify the standalone conversion corpus audit','Run bun run test:browser','Verify repository-subpath deployment','Upload the verified Pages build'].every(name=>j.steps.some((s:any)=>s.name===name&&s.conclusion==='success'))),
 detailedChecksAgree:root.checks.every((c:any)=>c.passed),
 actualOwnPublicChecks:own.publicFiles.every((x:any)=>x.matched)&&own.publicRoot.matched,
};
const result={startedAt,endedAt:new Date().toISOString(),auditPath,rootObservedStart:root.began,rootObservedEnd:root.ended,mode,runId,scriptSHA256,checks,allPassed:Object.values(checks).every(Boolean),rootGaps:root.gaps,rootRequiredStatusPolicy:root.requiredStatusPolicy,rootPages:root.pages,rootPublicFiles:root.publicFiles,rootPublicRoot:root.publicRoot};
await Bun.write(join(import.meta.dir,'root-'+mode+'-audit-review.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({mode,runId,checks,allPassed:result.allPassed,gaps:root.gaps},null,2));
