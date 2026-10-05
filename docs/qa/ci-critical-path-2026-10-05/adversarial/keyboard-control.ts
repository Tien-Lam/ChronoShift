import { chromium, expect } from '@playwright/test';
import { resolve, extname } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { PREVIEW_CSP } from '../../../../scripts/csp';
const output=resolve(import.meta.dir), observations:any[]=[];
const started=new Date().toISOString();
const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.webmanifest':'application/manifest+json'};
const browser=await chromium.launch();
for(const mode of ['baseline','candidate']) {
 const root=resolve(`/tmp/chronoshift-ci-critical/${mode}-runtime/dist`);
 const server=Bun.serve({hostname:'127.0.0.1',port:4311,async fetch(req){const relative=new URL(req.url).pathname.slice(1)||'index.html',path=resolve(root,relative),file=Bun.file(path);if(!path.startsWith(root+'/')||!(await file.exists()))return new Response('Not found',{status:404});return new Response(file,{headers:{'Content-Type':mime[extname(path)]||'application/octet-stream','Content-Security-Policy':PREVIEW_CSP,'Cache-Control':'no-cache'}});}});
 for(const key of ['Enter','Space']) for(let attempt=0;attempt<3;attempt++) {
 const context=await browser.newContext({viewport:{width:900,height:640},deviceScaleFactor:1,locale:'en-AU',timezoneId:'Australia/Sydney',reducedMotion:'no-preference'});
 await context.tracing.start({screenshots:true,snapshots:true,sources:true});
 await context.addInitScript(()=>{const records:any[]=[];(window as any).breadcrumbs=records;const describe=()=>({active:document.activeElement?.id,tag:document.activeElement?.tagName,text:document.activeElement?.tagName==='SUMMARY'?document.activeElement.textContent:undefined,mounted:!!document.querySelector('#source-zone'),open:(document.querySelector('.options')as HTMLDetailsElement)?.open});for(const name of ['keydown','keyup','focus','toggle'])document.addEventListener(name,(event)=>{if(records.length<100)records.push({event:name,key:(event as KeyboardEvent).key,time:performance.now(),...describe()});},true);new MutationObserver(()=>{if(records.length<100)records.push({event:'mutation',time:performance.now(),...describe()});}).observe(document,{childList:true,subtree:true});});
 const page=await context.newPage();await page.goto('http://127.0.0.1:4311/');
 const summary=page.locator('.options > summary');await summary.focus();
 const before=await page.evaluate(()=>({mounted:!!document.querySelector('#source-zone'),active:document.activeElement?.textContent}));
 await page.keyboard.press(key);await page.keyboard.press('Tab');await page.keyboard.type('UTC');
 const immediate=await page.evaluate(()=>({active:document.activeElement?.id,tag:document.activeElement?.tagName,text:document.activeElement?.tagName==='SUMMARY'?document.activeElement.textContent:undefined,value:(document.querySelector('#source-zone')as HTMLInputElement)?.value,open:(document.querySelector('.options')as HTMLDetailsElement)?.open,mounted:!!document.querySelector('#source-zone')}));
 await expect(page.locator('#source-zone')).toBeVisible();
 const settled=await page.evaluate(()=>({active:document.activeElement?.id,tag:document.activeElement?.tagName,text:document.activeElement?.tagName==='SUMMARY'?document.activeElement.textContent:undefined,value:(document.querySelector('#source-zone')as HTMLInputElement)?.value,breadcrumbs:(window as any).breadcrumbs}));
 const passed=immediate.active==='source-zone'&&immediate.value==='UTC';
 const row={mode,root,key,attempt,at:new Date().toISOString(),before,immediate,settled,passed};observations.push(row);
 if(!passed)await page.screenshot({path:resolve(output,`${mode}-${key}-${attempt}-keyboard.png`),fullPage:true});
 await context.tracing.stop({path:resolve(output,`${mode}-${key}-${attempt}-keyboard-trace.zip`)});await context.close();
 await writeFile(resolve(output,'keyboard-control.json'),JSON.stringify({started,ended:new Date().toISOString(),version:browser.version(),observations},null,2));
 }
 server.stop(true);
}
await browser.close();
