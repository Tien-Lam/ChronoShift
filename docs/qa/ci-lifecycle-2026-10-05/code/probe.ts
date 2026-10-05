import { chromium, expect } from '@playwright/test';
import { consoleDiagnostics } from '../../../../e2e/console';
import { enterZone } from '../../../../e2e/choices';
const url='http://127.0.0.1:4262/';
const browser=await chromium.launch();
const result:any={started:new Date().toISOString(),browser:browser.version(),platform:process.platform,baseCommit:(await Bun.$`git rev-parse HEAD`.text()).trim(),build:await Bun.file('dist/release.json').json(),runs:[]};
for (const delayed of [false,true]) {
 const context=await browser.newContext({baseURL:url,locale:'en-AU',timezoneId:'Australia/Sydney'});
 await context.addInitScript(({delayed})=>{
  sessionStorage.setItem('chronoshift-detailed-logs','true');
  (window as any).initialControl=!!navigator.serviceWorker.controller;
  const native=window.setTimeout;
  window.setTimeout=((handler,delay,...args)=>native(handler,delay===15000?200:delay,...args)) as typeof setTimeout;
  const post=ServiceWorker.prototype.postMessage;
  ServiceWorker.prototype.postMessage=function(message:any,...args:any[]){
   if(delayed && sessionStorage.getItem('delay-next-probes') && message?.type==='CHECK_READY') {
    native(()=>post.call(this,message,...args),350);
   } else post.call(this,message,...args);
  };
 },{delayed});
 const page=await context.newPage();const logs=consoleDiagnostics(page);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const start=Date.now();const snapshots:any[]=[];
 const snapshot=async(label:string)=>snapshots.push({label,ms:Date.now()-start,...await page.evaluate(async()=>{
  const r=await navigator.serviceWorker.getRegistration(); const describe=(w:ServiceWorker|null|undefined)=>w?{state:w.state,url:w.scriptURL}:null;
  const direct=await new Promise<any>(resolve=>{const c=new MessageChannel();const t=setTimeout(()=>resolve({timeout:true}),2000);c.port1.onmessage=e=>{clearTimeout(t);c.port1.close();resolve(e.data)};r!.active!.postMessage({type:'CHECK_READY',detailedLogs:true},[c.port2]);});
  return {ready:document.querySelector('main')?.getAttribute('data-offline-ready'),warning:document.querySelector('.message.warning')?.textContent,initialControl:(window as any).initialControl,controller:describe(navigator.serviceWorker.controller),active:describe(r?.active),waiting:describe(r?.waiting),installing:describe(r?.installing),caches:await caches.keys(),direct};
 })});
 await context.request.post('__test-release',{data:'first-no-claim'});await page.goto('/');await expect(page.locator('main')).toHaveAttribute('data-offline-ready','true');await snapshot('old-controlled');
 const retained=await context.newPage();await retained.goto('/');await context.request.post('__test-release',{data:'second'});
 const cdp=await context.newCDPSession(page);await Promise.all([page.waitForEvent('domcontentloaded'),cdp.send('Page.reload',{ignoreCache:true})]);await cdp.detach();
 await page.getByLabel('Message with a date or time').fill('June 18, 2026 at 5:20pm Tokyo');await enterZone(page,'Europe/London');await expect(page.locator('.hero-time')).toHaveText(/9:20 am/i);await expect(page.getByRole('button',{name:'Update now'})).toBeVisible();await expect(page.locator('.message.warning')).toContainText('Offline access is unavailable in this tab.');await snapshot('old-uncontrolled-waiting');
 if(delayed) await page.evaluate(()=>sessionStorage.setItem('delay-next-probes','true'));
 const clicked=Date.now();await Promise.all([page.waitForEvent('domcontentloaded'),page.getByRole('button',{name:'Update now'}).click()]);
 await expect(page.getByLabel('Message with a date or time')).toHaveValue('June 18, 2026 at 5:20pm Tokyo');
 await page.waitForTimeout(800);await snapshot('updated-after-probe-deadline');
 if(delayed){await page.waitForTimeout(10200);await snapshot('updated-after-original-assertion-window');await page.evaluate(()=>{sessionStorage.removeItem('delay-next-probes');window.dispatchEvent(new PageTransitionEvent('pageshow'))});}
 await expect(page.locator('main')).toHaveAttribute('data-offline-ready','true');await snapshot('recovered-or-normal-ready');await logs.flush();
 result.runs.push({delayed,updateMs:Date.now()-clicked,snapshots,logs:[...logs],errors,draft:await page.getByLabel('Message with a date or time').inputValue(),result:await page.locator('.hero-time').textContent()});
 await retained.close();await context.close();
}
await browser.close();await Bun.write('docs/qa/ci-lifecycle-2026-10-05/code/probe.json',JSON.stringify(result,null,2));console.log(JSON.stringify({browser:result.browser,runs:result.runs.map((r:any)=>({delayed:r.delayed,updateMs:r.updateMs,states:r.snapshots.map((s:any)=>({label:s.label,ms:s.ms,ready:s.ready,controller:s.controller?.state,direct:s.direct.ready})),errors:r.errors}))},null,2));
