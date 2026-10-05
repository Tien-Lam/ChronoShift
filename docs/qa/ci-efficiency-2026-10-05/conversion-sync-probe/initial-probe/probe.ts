import { chromium, firefox, webkit, devices, expect, type Page } from "@playwright/test";
import { cpus, totalmem, release } from "node:os";
import { execFileSync } from "node:child_process";
import { choose, enterZone } from "../../../../e2e/choices";
const folder = import.meta.dir;
const began = new Date().toISOString();
const root = execFileSync("git",["rev-parse","--show-toplevel"],{encoding:"utf8"}).trim();
const head = execFileSync("git",["rev-parse","HEAD"],{encoding:"utf8"}).trim();
const rows: any[] = [], errors: any[] = [], browsers: any[] = [];
let origin = "", assetsBefore: any, assetsAfter: any, serverStoppedAt: string | undefined;
const server = Bun.spawn([process.execPath,"scripts/serve-web.ts"],{cwd:root,env:{...process.env,PORT:"0",BASE_PATH:"/",CHRONOSHIFT_TEST_SERVER:"0"},stdout:"pipe",stderr:"pipe"});
const serverErrors = new Response(server.stderr).text();
const expectedDate = new Intl.DateTimeFormat("en-AU",{timeZone:"UTC",weekday:"short",day:"numeric",month:"short",year:"numeric"}).format(new Date("2026-06-18T08:20:00Z"));
async function assets() {
  const get = async (path: string) => { const response=await fetch(new URL(path,origin));const bytes=new Uint8Array(await response.arrayBuffer());return {path,status:response.status,bytes:bytes.length,sha256:new Bun.CryptoHasher("sha256").update(bytes).digest("hex"),body:new TextDecoder().decode(bytes)}; };
  const html=await get("index.html"),sw=await get("sw.js"),marker=await get("release.json");
  const jsPath=html.body.match(/src="([^"]+\.js)"/)?.[1];
  if (!jsPath?.includes("index-DHi9pTHJ.js")||!sw.body.includes("b5d1df7366de0c5f")||JSON.parse(marker.body).sourceCommit!=="28059a91ec9984dea4d079b3f684b3a27af669f0") throw new Error("Unexpected exact root-build identity");
  const js=await get(jsPath);
  if(js.sha256!=="b2ec5e8a200f317d260cd7e596c1f9a8d417f55f4379803a39867553791ae640")throw new Error("Unexpected JS bytes");
  return {html,sw,marker,js};
}
async function assertResult(page: Page,time: string) {
  await expect(page.locator(".hero-time")).toHaveText(time,{timeout:10000});
  await expect(page.locator(".result-date")).toHaveText(expectedDate,{timeout:10000});
  await expect(page.locator(".result-zone")).toHaveText("UTC",{timeout:10000});
  await expect(page.locator(".result")).toHaveCount(1,{timeout:10000});
}
try {
  const reader=server.stdout.getReader();let output="";
  while(!origin){const {value,done}=await reader.read();if(done)throw new Error("Owned server exited before readiness");output+=new TextDecoder().decode(value);origin=output.match(/http:\/\/127\.0\.0\.1:\d+\//)?.[0]||"";}
  await Bun.write(`${folder}/server-start.log`,output);
  assetsBefore=await assets();
  for(const [name,type,device] of [["chromium",chromium,devices["Desktop Chrome"]],["firefox",firefox,devices["Desktop Firefox"]],["webkit",webkit,devices["Desktop Safari"]]] as const) {
    const browser=await type.launch();browsers.push({name,version:browser.version(),executable:type.executablePath()});
    const context=await browser.newContext({...device,viewport:{width:900,height:640},deviceScaleFactor:1,locale:"en-AU",timezoneId:"Australia/Sydney",reducedMotion:"no-preference",colorScheme:"dark"});
    const page=await context.newPage();page.on("pageerror",error=>errors.push({profile:name,type:"pageerror",at:new Date().toISOString(),message:error.message}));
    try {
      await page.goto(origin);
      await expect(page.locator("main")).toHaveAttribute("data-offline-ready","true",{timeout:20000});
      await enterZone(page,"UTC");
      await page.getByText("More options",{exact:true}).click();
      await choose(page,"Time display","24");
      const input=page.getByLabel("Message with a date or time");
      await input.fill("June 18, 2026 at 5:19pm Tokyo");await assertResult(page,"08:19");
      for(let block=0;block<3;block++) for(const [index,mode] of ["A","B","B","A"].entries()) {
        const minute=20+block*4+index,time=`08:${minute}`,text=`June 18, 2026 at 5:${minute}pm Tokyo`;
        const at=new Date().toISOString();
        await page.evaluate(()=>{
          const w=window as any;
          const record:any={armedAt:performance.now(),events:[],pendingAt:null,settledAt:null,settledIdentity:null};
          let resolve:any,reject:any;
          const done=new Promise<void>((yes,no)=>{resolve=yes;reject=no;});
          // Both modes have identical recording; only B awaits this promise.
          done.catch(()=>{});
          const panel=document.querySelector(".result-panel")!;
          const read=()=>{
            const busy=panel.getAttribute("aria-busy"),state=document.querySelector(".live-indicator")?.getAttribute("data-state");
            record.events.push({at:performance.now(),busy,state});
            if(busy==="true"&&record.pendingAt===null)record.pendingAt=performance.now();
            if(record.pendingAt!==null&&busy==="false"&&state==="ready"&&record.settledAt===null){
              record.settledAt=performance.now();record.settledIdentity={time:document.querySelector(".hero-time")?.textContent,date:document.querySelector(".result-date")?.textContent,zone:document.querySelector(".result-zone")?.textContent};observer.disconnect();clearTimeout(timer);resolve();
            }
          };
          const observer=new MutationObserver(read);observer.observe(panel,{subtree:true,attributes:true,childList:true,characterData:true});
          const timer=setTimeout(()=>{observer.disconnect();record.error="Observer did not see pending-to-ready completion";reject(new Error(record.error));},10000);
          record.cleanup=()=>{clearTimeout(timer);observer.disconnect();};w.__conversionProbe={record,done};
        });
        const start=performance.now();await input.fill(text);const fillEnd=performance.now();
        if(mode==="B")await page.evaluate(()=>(window as any).__conversionProbe.done);
        const assertStart=performance.now();await assertResult(page,time);const assertEnd=performance.now();
        const record=await page.evaluate(()=>{const {record}= (window as any).__conversionProbe;record.assertionObservedAt=performance.now();record.cleanup();delete record.cleanup;return {...record,identity:{time:document.querySelector(".hero-time")?.textContent,date:document.querySelector(".result-date")?.textContent,zone:document.querySelector(".result-zone")?.textContent},input:(document.querySelector("#message") as HTMLTextAreaElement)?.value,reducedMotion:matchMedia("(prefers-reduced-motion: reduce)").matches};});
        if(record.pendingAt===null||record.settledAt===null||record.settledIdentity.time!==time||record.identity.time!==time||record.identity.date!==expectedDate||record.identity.zone!=="UTC")throw new Error(`Incomplete/wrong completion for ${name}/${block}/${index}`);
        rows.push({profile:name,block,index,mode,at,text,expected:{time,date:expectedDate,zone:"UTC"},fillMs:fillEnd-start,observerWaitMs:assertStart-fillEnd,assertionMs:assertEnd-assertStart,totalMs:assertEnd-start,postSettleObservationMs:record.assertionObservedAt-record.settledAt,record});
        console.log(JSON.stringify({profile:name,block,index,mode,totalMs:assertEnd-start,postSettleObservationMs:record.assertionObservedAt-record.settledAt}));
        await Bun.write(`${folder}/raw.json`,JSON.stringify({began,head,origin,expectedDate,rows,errors,browsers,assetsBefore},null,2));
      }
    } finally {await context.close();await browser.close();}
  }
  assetsAfter=await assets();
} catch(error) {errors.push({type:"probe",at:new Date().toISOString(),message:error instanceof Error?error.stack:String(error)});console.error(error);process.exitCode=1;}
finally {
  server.kill("SIGTERM");await server.exited;serverStoppedAt=new Date().toISOString();
  await Bun.write(`${folder}/server-stderr.log`,await serverErrors);
  const environment={platform:process.platform,arch:process.arch,osRelease:release(),bun:Bun.version,cpus:cpus().length,cpuModel:cpus()[0]?.model,memoryBytes:totalmem(),CI:process.env.CI||null,viewport:{width:900,height:640},deviceScaleFactor:1,locale:"en-AU",timezoneId:"Australia/Sydney",reducedMotion:"no-preference",colorScheme:"dark",concurrency:1};
  await Bun.write(`${folder}/raw.json`,JSON.stringify({began,ended:new Date().toISOString(),head,origin,expectedDate,rows,errors,browsers,assetsBefore,assetsAfter,environment,serverStoppedAt,serverExitCode:server.exitCode,assetsStable:assetsAfter&&Object.keys(assetsBefore).every(key=>assetsBefore[key].sha256===assetsAfter[key].sha256)},null,2));
}
