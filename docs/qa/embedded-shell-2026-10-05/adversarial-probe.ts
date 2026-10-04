import { chromium } from '@playwright/test';
import { resolve, extname } from 'node:path';
const root=resolve(process.env.ADVERSARIAL_DIST||'dist');
const base='/ChronoShift/';
let mode='transformed';
const requests:any[]=[];
const mime:any={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json','.json':'application/json'};
const server=Bun.serve({hostname:'127.0.0.1',port:4327,async fetch(request){
  const url=new URL(request.url), relative=url.pathname.slice(base.length)||'index.html';
  if(!url.pathname.startsWith(base)) return new Response('Not found',{status:404});
  const path=resolve(root,relative),file=Bun.file(path);
  if(!path.startsWith(root+'/')||!await file.exists()) return new Response('Not found',{status:404});
  const original=await file.arrayBuffer();
  let body:any=original;
  if(mode==='transformed'&&relative==='index.html')body=(await file.text()).replace('<head>','<head>\n<!-- privacy filter inspected this HTML -->');
  if(mode==='immutable-corrupt'&&relative.startsWith('assets/worker-')&&relative.endsWith('.js'))body=(await file.text())+'\n// benign but noncanonical JavaScript bytes';
  requests.push({at:Date.now(),mode,path:url.pathname,query:url.search,originalHash:Bun.hash(original).toString(),servedHash:Bun.hash(body).toString()});
  return new Response(body,{headers:{'Content-Type':mime[extname(path)]||'application/octet-stream','Cache-Control':'no-store'}});
}});
const browser=await chromium.launch({channel:'chrome',headless:true});
const report:any={browser:browser.version(),source:'f0d3759c270b6ebaeb4995a32c481fe1ec1ffd39',dist:root,cases:[]};
for(const scenario of ['transformed','immutable-corrupt']){
  mode=scenario;requests.length=0;
  const context=await browser.newContext();
  await context.addInitScript(()=>sessionStorage.setItem('chronoshift-detailed-logs','true'));
  const page=await context.newPage();
  const logs:any[]=[];
  page.on('console',async msg=>logs.push({at:Date.now(),type:msg.type(),text:msg.text(),args:await Promise.all(msg.args().map(v=>v.jsonValue().catch(()=>null)))}));
  page.on('pageerror',error=>logs.push({at:Date.now(),type:'pageerror',text:error.message}));
  const cdp=await context.newCDPSession(page);
  await cdp.send('ServiceWorker.enable');
  cdp.on('ServiceWorker.workerErrorReported',value=>logs.push({at:Date.now(),type:'workererror',value}));
  const started=Date.now();
  await page.goto(server.url+base.slice(1));
  if(scenario==='dom-only') await page.evaluate(()=>{const x=document.createElement('style');x.textContent='body { --simulated-userscript: 1; }';document.head.append(x);document.head.append(document.createComment('privacy filter DOM addition'));});
  await page.getByLabel('Message with a date or time').fill('June 18, 2026 at 5:20pm Tokyo');
  const target=page.getByLabel('Convert to',{exact:true});await target.fill('Europe/London');await target.press('Tab');
  await page.getByRole('button',{name:'Convert',exact:true}).click();
  await page.waitForTimeout(21000);
  const state=await page.evaluate(async()=>({ready:document.querySelector('main')?.getAttribute('data-offline-ready'),warning:document.querySelector('.message.warning')?.textContent||null,result:document.querySelector('.hero-time')?.textContent,draft:(document.querySelector('textarea') as HTMLTextAreaElement)?.value,controlled:!!navigator.serviceWorker.controller,caches:await caches.keys(),registrations:(await navigator.serviceWorker.getRegistrations()).map(r=>({active:r.active?.state,waiting:r.waiting?.state,installing:r.installing?.state}))}));
  const elapsedMs=Date.now()-started;
  const recovery:any[]=[];
  if(scenario==='transformed'){
    const canonical=await Bun.file(resolve(root,'index.html')).text();
    for(const fault of ['missing','corrupt']){
      const repair=await page.evaluate(async(fault)=>{
        const name=(await caches.keys()).find(n=>n.startsWith('chronoshift-')&&!n.includes('staging'))!;
        const cache=await caches.open(name);
        if(fault==='missing')await cache.delete('/ChronoShift/index.html');
        else await cache.put('/ChronoShift/index.html',new Response('<html>unsafe replacement shell</html>',{headers:{'Content-Type':'text/html'}}));
        return true;
      },fault);
      await context.setOffline(true);
      const checked=await page.evaluate(async()=>{
        const result:any=await new Promise(resolve=>{const channel=new MessageChannel();channel.port1.onmessage=e=>{channel.port1.close();resolve(e.data);};navigator.serviceWorker.controller!.postMessage({type:'CHECK_READY',repairIfMissing:true,detailedLogs:true},[channel.port2]);});
        const cache=(await caches.open((await caches.keys()).find(n=>n.startsWith('chronoshift-')&&!n.includes('staging'))!));
        const shell=await cache.match('/ChronoShift/index.html');
        return {result,html:await shell!.text(),contentType:shell!.headers.get('content-type')};
      });
      if(checked.html!==canonical||checked.result.ready!==true)throw new Error(`shell ${fault} repair failed`);
      recovery.push({fault,...checked});
      await context.setOffline(false);
    }
    await page.close();await context.setOffline(true);
    const reopened=await context.newPage();await reopened.goto(server.url+base.slice(1));
    await reopened.getByLabel('Message with a date or time').fill('June 18, 2026 at 5:20pm Tokyo');
    const next=reopened.getByLabel('Convert to',{exact:true});await next.fill('Europe/London');await next.press('Tab');
    await reopened.getByRole('button',{name:'Convert',exact:true}).click();
    await reopened.locator('.hero-time').waitFor();
    recovery.push({offlineReopenResult:await reopened.locator('.hero-time').textContent(),warning:await reopened.locator('.message.warning').count(),ready:await reopened.locator('main').getAttribute('data-offline-ready')});
    await reopened.screenshot({path:'/tmp/chronoshift-html-candidate-offline.png'});
  }else await page.screenshot({path:`/tmp/chronoshift-html-candidate-${scenario}.png`});
  report.cases.push({scenario,elapsedMs,state,recovery,logs,requests:[...requests]});
  await context.close();
}
await browser.close();server.stop();
await Bun.write('/tmp/chronoshift-html-after.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({browser:report.browser,cases:report.cases.map((c:any)=>({scenario:c.scenario,elapsedMs:c.elapsedMs,state:c.state,workerErrors:c.logs.filter((l:any)=>l.type==='workererror')}))},null,2));
