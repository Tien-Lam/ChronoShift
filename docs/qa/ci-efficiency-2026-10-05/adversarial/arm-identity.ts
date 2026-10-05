import {mkdir} from "node:fs/promises";
import {join} from "node:path";
const dir=join(import.meta.dir,"arm"); await mkdir(dir,{recursive:true});
const pin="sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27";
const accept="application/vnd.docker.distribution.manifest.list.v2+json, application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.v2+json, application/vnd.oci.image.manifest.v1+json";
const reads:any[]=[];
async function registry(kind:string,digest:string,label:string) {
  const start=new Date().toISOString(),url=`https://mcr.microsoft.com/v2/playwright/${kind}/${digest}`;
  const r=await fetch(url,{headers:{Accept:accept}});
  const bytes=new Uint8Array(await r.arrayBuffer());
  const computed="sha256:"+new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
  const record={start,end:new Date().toISOString(),url,status:r.status,bytes:bytes.length,digest,computed,contentType:r.headers.get("content-type"),dockerContentDigest:r.headers.get("docker-content-digest")};
  reads.push(record); await Bun.write(join(dir,`${label}.json`),bytes);
  if(!r.ok||computed!==digest)throw new Error(JSON.stringify(record));
  return JSON.parse(new TextDecoder().decode(bytes));
}
const index=await registry("manifests",pin,"index");
const arm=index.manifests.find((x:any)=>x.platform.os==="linux"&&x.platform.architecture==="arm64");
if(!arm)throw new Error("No ARM descriptor in exact pinned index");
const manifest=await registry("manifests",arm.digest,"manifest-arm");
const config=await registry("blobs",manifest.config.digest,"config-arm");
if(config.os!=="linux"||config.architecture!=="arm64")throw new Error("ARM config mismatch");
const gh="/Users/tien/.local/share/mise/installs/gh/2.100.0/gh_2.100.0_macOS_arm64/bin/gh";
const releases=await Promise.all([
  ["bun","repos/oven-sh/bun/releases/tags/bun-v1.4.0"],
  ["gh","repos/cli/cli/releases/tags/v2.100.0"],
].map(async([label,route])=>{
  const start=new Date().toISOString(),p=Bun.spawn([gh,"api",route],{stdout:"pipe",stderr:"pipe"});
  const [stdout,stderr,code]=await Promise.all([new Response(p.stdout).text(),new Response(p.stderr).text(),p.exited]);
  await Bun.write(join(dir,`${label}-release.json`),stdout);
  const data=code===0?JSON.parse(stdout):null;
  return {start,end:new Date().toISOString(),route,code,stderr,assets:data?.assets?.filter((a:any)=>/linux.*(aarch64|arm64)/.test(a.name)).map((a:any)=>({name:a.name,size:a.size,digest:a.digest}))};
}));
const nodeStart=new Date().toISOString();
const nodeUrl="https://nodejs.org/dist/v26.8.1/SHASUMS256.txt";
const nr=await fetch(nodeUrl);const nodeSums=await nr.text();
await Bun.write(join(dir,"node-shasums.txt"),nodeSums);
const node={start:nodeStart,end:new Date().toISOString(),url:nodeUrl,status:nr.status,armLines:nodeSums.split("\n").filter(s=>s.includes("linux-arm64"))};
const report={head:"52e8d9c3bc2ba50f6ba2990dde5a128a37849172",pin,arm,reads,config:{architecture:config.architecture,os:config.os,created:config.created,env:config.config.Env,history:config.history.filter((h:any)=>/playwright|npm|pwuser|useradd/.test(h.created_by))},releases,node,scope:"Metadata/download availability only; no image pull or browser execution"};
await Bun.write(join(dir,"identity.json"),JSON.stringify(report,null,2)+"\n");
console.log(JSON.stringify(report,null,2));
