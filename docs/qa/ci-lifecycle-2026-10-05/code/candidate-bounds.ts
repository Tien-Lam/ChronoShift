import {chromium,expect} from '@playwright/test';
import {consoleDiagnostics} from '../../../../e2e/console';
const browser=await chromium.launch();const all:any={started:new Date().toISOString(),revision:(await Bun.$`git rev-parse HEAD`.text()).trim(),browser:browser.version(),runs:[]};
for(const mode of ['transient-drop','transport-throw','permanent-drop','abort-pending','external-lifecycle','integrity-false']){
 const c=await browser.newContext({baseURL:'http://127.0.0.1:4262/'});
 await c.addInitScript(()=>{
  const w=window as any;w.calls=[];w.controllers=[];w.action='normal';w.actionStart=0;
  sessionStorage.setItem('chronoshift-detailed-logs','true');
  const AC=AbortController;window.AbortController=class extends AC{constructor(){super();w.controllers.push(this)}};
  const timer=window.setTimeout;window.setTimeout=((h,d,...a)=>timer(h,d===15000?200:d,...a)) as typeof setTimeout;
  const post=ServiceWorker.prototype.postMessage;w.originalPost=post;
  ServiceWorker.prototype.postMessage=function(message,...args){
   if(message?.type==='CHECK_READY'&&w.action!=='normal'){
    w.calls.push({at:performance.now(),since:performance.now()-w.actionStart,action:w.action,controller:this===navigator.serviceWorker.controller});
    if(w.action==='drop')return;
    if(w.action==='drop-once'){w.action='capture';return;}
    if(w.action==='throw-once'){w.action='capture';throw new Error('Injected transport loss');}
   }
   return post.call(this,message,...args);
  } as typeof post;
 });
 const p=await c.newPage();const logs=consoleDiagnostics(p);const errors:string[]=[];p.on('pageerror',e=>errors.push(e.message));
 await c.request.post('__test-release',{data:'first'});await p.goto('/');await expect(p.locator('main')).toHaveAttribute('data-offline-ready','true');
 const begin=Date.now();
 if(mode==='integrity-false'){
  await p.evaluate(async()=>{await(await caches.open('chronoshift-test-first')).put('/release.json',new Response('corrupt'));});await c.setOffline(true);
 }
 await p.evaluate(mode=>{const w=window as any;w.calls=[];w.actionStart=performance.now();w.action=mode==='transport-throw'?'throw-once':mode==='integrity-false'?'capture':mode==='transient-drop'?'drop-once':'drop';window.dispatchEvent(new PageTransitionEvent('pageshow'));},mode);
 await expect(p.locator('main')).toHaveAttribute('data-offline-ready','false');
 if(mode==='abort-pending') await p.evaluate(()=>{for(const c of(window as any).controllers)c.abort()});
 if(mode==='external-lifecycle') await p.evaluate(()=>{(window as any).action='capture';window.dispatchEvent(new PageTransitionEvent('pageshow'))});
 if(['transient-drop','transport-throw','external-lifecycle'].includes(mode))await expect(p.locator('main')).toHaveAttribute('data-offline-ready','true');
 await p.waitForTimeout(mode==='permanent-drop'?6300:1400);
 const state=await p.evaluate(async()=>{const w=window as any;const r=await navigator.serviceWorker.getRegistration();const direct=await new Promise<any>(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=e=>{channel.port1.close();resolve(e.data)};w.originalPost.call(navigator.serviceWorker.controller,{type:'CHECK_READY',detailedLogs:true},[channel.port2]);});return{calls:w.calls,ready:document.querySelector('main')?.getAttribute('data-offline-ready'),warning:document.querySelector('.message.warning')?.textContent,controllerState:navigator.serviceWorker.controller?.state,active:r?.active?.state,waiting:r?.waiting?.state,caches:await caches.keys(),direct};});
 const expected=mode==='permanent-drop'?3:mode==='abort-pending'||mode==='integrity-false'?1:2;
 expect(state.calls.length).toBe(expected);expect(state.calls.every((x:any)=>x.controller)).toBe(true);
 expect(state.ready).toBe(['permanent-drop','abort-pending','integrity-false'].includes(mode)?'false':'true');
 expect(state.direct.ready).toBe(mode!=='integrity-false');await logs.flush();expect(errors).toEqual([]);
 all.runs.push({mode,elapsedMs:Date.now()-begin,state,logs:[...logs],errors});await c.close();
}
await browser.close();await Bun.write('docs/qa/ci-lifecycle-2026-10-05/code/candidate-bounds.json',JSON.stringify(all,null,2));console.log(JSON.stringify(all.runs.map((r:any)=>({mode:r.mode,elapsedMs:r.elapsedMs,calls:r.state.calls,ready:r.state.ready,directReady:r.state.direct.ready})),null,2));
