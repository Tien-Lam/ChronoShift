import { chromium, firefox, webkit, expect, type Page } from '/Users/tien/Developer/ChronoShift/node_modules/@playwright/test/index.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
const out='/tmp/chronoshift-live-code';
const runs:any[]=[];
const url='http://127.0.0.1:4252';
async function zone(p:Page,v:string,label='Convert to') { const x=p.getByLabel(label,{exact:true}); await x.fill(v); await x.press('Tab'); }
async function fmt(p:Page,v:string) {await p.getByRole('button',{name:/Time display$/}).click(); await p.locator(`[role=option][data-value="${v}"]`).click();}
for(const [name,type] of Object.entries({chromium,firefox,webkit})) {
 const start=new Date().toISOString(); const browser=await type.launch();
 const context=await browser.newContext({locale:'en-AU',timezoneId:'Australia/Sydney'});
 const p=await context.newPage(); const errors:string[]=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{
  localStorage.setItem('chronoshift.preferences.v1',JSON.stringify({target:'UTC',source:'UTC',hourCycle:'24',dateOrder:'mdy',theme:'dark'}));
  const s=window as any;s.log=[];s.hold=false;s.saved=[];s.fault='';s.terminated=0;
  const Native=Worker;
  window.Worker=new Proxy(Native,{construct(T,args){if(s.fault==='constructor')throw new Error('Injected constructor fault');const w=Reflect.construct(T,args);
    return new Proxy(w,{get(t,key){if(key==='postMessage')return (...xs:any[])=>{s.log.push(xs[0]);if(s.fault==='post')throw new Error('Injected post fault');return t.postMessage(...xs);};if(key==='terminate')return ()=>{s.terminated++;t.terminate();};const v=Reflect.get(t,key,t);return typeof v==='function'?v.bind(t):v;},
     set(t,key,v){if(key==='onmessage') t.onmessage=(e:any)=>{if(s.hold)s.saved.push(()=>v(e));else v(e);};else if(key==='onerror'){s.failRuntime=v;Reflect.set(t,key,v,t);}else Reflect.set(t,key,v,t);return true;}});
  }});
  Object.defineProperty(navigator,'clipboard',{value:{readText:()=>new Promise(r=>s.importResolve=r),writeText:()=>new Promise((r,j)=>{s.copyResolve=r;s.copyReject=j;})}});
 });
 try {
  await p.goto(url);await expect(p.locator('main[data-offline-ready=true]')).toBeVisible();
  const input=p.getByLabel('Message with a date or time');
  await expect(p.getByRole('button',{name:'Convert',exact:true})).toHaveCount(0);
  await input.fill('April 9, 2026 3pm UTC');
  await expect(p.locator('.hero-time')).toHaveText('15:00');
  await p.locator('.copy-button').first().click();
  await input.fill('June 18, 2026 9am UTC');
  await p.evaluate(()=>(window as any).copyReject(new Error('Injected stale copy rejection')));
  await expect(p.locator('.hero-time')).toHaveText('09:00');
  await expect(p.getByLabel('Text to copy')).toHaveCount(0);
  // Pending import starts before automatic conversion, then completes after it without a user edit.
  await input.fill('June 18, 2026 10am UTC');
  await p.getByRole('button',{name:'Paste',exact:true}).click();
  await expect(p.locator('.hero-time')).toHaveText('10:00');
  await p.evaluate(()=>(window as any).importResolve('July 15, 2026 4pm UTC'));
  await expect(input).toHaveValue('July 15, 2026 4pm UTC');
  await expect(p.getByRole('button',{name:'Replace with imported text'})).toHaveCount(0);
  await expect(p.locator('.hero-time')).toHaveText('16:00');
  // A user edit and return to the prior value still conflicts with a delayed import.
  await p.getByRole('button',{name:'Paste',exact:true}).click();
  await input.fill('X');await input.fill('July 15, 2026 4pm UTC');
  await p.evaluate(()=>(window as any).importResolve('August 4, 2026 5pm UTC'));
  await expect(p.getByRole('button',{name:'Replace with imported text'})).toBeVisible();
  await p.getByRole('button',{name:'Dismiss imported text'}).click();
  // Delayed already-completed worker response loses ownership on target mutation.
  await p.evaluate(()=>{(window as any).hold=true});
  await input.fill('April 9, 2026 3pm UTC');
  await expect.poll(()=>p.evaluate(()=>(window as any).saved.length)).toBeGreaterThan(0);
  await zone(p,'Asia/Tokyo');
  await p.evaluate(()=>{const s=window as any;s.hold=false;s.saved.splice(0).forEach((f:any)=>f());});
  await expect(p.locator('.hero-time')).toHaveText('00:00');
  await expect(p.locator('.result-date')).toContainText('10 Apr');
  // Invalid timezone clears and later correction converts without a submit.
  await zone(p,'CST');await expect(p.locator('.result')).toHaveCount(0);await expect(p.getByRole('alert')).toContainText('Choose a timezone');
  await zone(p,'UTC');await expect(p.locator('.hero-time')).toHaveText('15:00');
  // Constructor and postMessage rejection each recover on a later edit.
  for(const fault of ['constructor','post']){
   await p.evaluate(f=>(window as any).fault=f,fault);
   await input.fill('April 9, 2026 4pm UTC');await expect(p.getByRole('alert')).toContainText('could not start');
   await expect(p.locator('.result-panel')).toHaveAttribute('aria-busy','false');
   await p.evaluate(()=>(window as any).fault='');await input.fill('April 9, 2026 3pm UTC');await expect(p.locator('.hero-time')).toHaveText('15:00');
  }
  // Runtime error callback recovery with a queued result that cannot revive after Clear.
  await p.evaluate(()=>{(window as any).hold=true});await input.fill('April 9, 2026 4pm UTC');
  await expect.poll(()=>p.evaluate(()=>(window as any).saved.length)).toBeGreaterThan(0);
  await p.evaluate(()=>(window as any).failRuntime(new Event('error')));
  await expect(p.getByRole('alert')).toContainText('Edit it to try again');
  await p.getByRole('button',{name:'Clear',exact:true}).click();
  await p.evaluate(()=>{const s=window as any;s.hold=false;s.saved.splice(0).forEach((f:any)=>f());});
  await expect(p.locator('.result')).toHaveCount(0);await expect(p.getByRole('alert')).toHaveCount(0);
  // Synthetic IME start and delayed response then no intermediate worker launches.
  await p.evaluate(()=>{(window as any).hold=true});await input.fill('April 9, 2026 3pm UTC');
  await expect.poll(()=>p.evaluate(()=>(window as any).saved.length)).toBeGreaterThan(0);
  await input.dispatchEvent('compositionstart');await input.evaluate((el:any)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')!.set!.call(el,'April 9, 2026 5pm UTC');el.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertCompositionText',data:'April 9, 2026 5pm UTC',isComposing:true}));});
  const count=await p.evaluate(()=>(window as any).log.length);
  await p.evaluate(()=>{const s=window as any;s.hold=false;s.saved.splice(0).forEach((f:any)=>f());});
  await p.waitForTimeout(400);expect(await p.evaluate(()=>(window as any).log.length)).toBe(count);await expect(p.locator('.result')).toHaveCount(0);
  await input.dispatchEvent('compositionend');await expect(p.locator('.hero-time')).toHaveText('17:00');
  // Empty/oversized recovery and persisted update handoff auto conversion.
  await input.fill('  ');await expect(p.locator('.result')).toHaveCount(0);await expect(p.getByRole('alert')).toHaveCount(0);
  await input.fill('x'.repeat(10001));await expect(p.getByRole('alert')).toContainText('10,000');
  await input.fill('June 18, 2026 9am UTC');await expect(p.locator('.hero-time')).toHaveText('09:00');
  await p.evaluate(()=>sessionStorage.setItem('chronoshift.update-draft',JSON.stringify({text:'June 18, 2026 6pm UTC',created:Date.now()})));
  await p.reload();await expect(input).toHaveValue('June 18, 2026 6pm UTC');await expect(p.locator('.hero-time')).toHaveText('18:00');
  expect(errors).toEqual([]);
  runs.push({name,start,end:new Date().toISOString(),result:'pass',errors});
 }catch(e){runs.push({name,start,end:new Date().toISOString(),result:'fail',error:String(e),errors});await p.screenshot({path:`${out}/${name}-failure.png`,fullPage:true});}
 await browser.close();
}
writeFileSync(`${out}/independent-results.json`,JSON.stringify(runs,null,2));
console.log(JSON.stringify(runs,null,2));if(runs.some(r=>r.result==='fail'))process.exitCode=1;
