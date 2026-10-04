import {webkit,chromium,devices,expect} from '/Users/tien/Developer/ChronoShift/node_modules/@playwright/test/index.mjs';
import {writeFileSync} from 'node:fs';
const reports=[];
for(const [name,type,options] of [['iphone',webkit,devices['iPhone 13']],['desktop',chromium,{}]] as const){
const b=await type.launch();const c=await b.newContext({...options,locale:'en-AU',timezoneId:'Australia/Sydney'});const p=await c.newPage();
await p.goto('http://127.0.0.1:4252');await expect(p.locator('main[data-offline-ready=true]')).toBeVisible();
await p.evaluate(async()=>{
 localStorage.setItem('chronoshift.preferences.v1',JSON.stringify({target:'UTC',source:'UTC',hourCycle:'12',dateOrder:'mdy',theme:'dark'}));
 sessionStorage.setItem('chronoshift.update-draft',JSON.stringify({text:'June 18, 2026 9am UTC',created:Date.now()}));
 await new Promise<void>((resolve,reject)=>{const r=indexedDB.open('chronoshift-handoff',1);r.onupgradeneeded=()=>r.result.createObjectStore('messages');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('messages','readwrite');tx.objectStore('messages').put({text:'April 9, 2026 3pm UTC',created:Date.now()},'late-share');tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>reject(tx.error);};});
});
await p.addInitScript(()=>{const open=IDBFactory.prototype.open;IDBFactory.prototype.open=function(...args:any[]){const request=open.apply(this,args as any),listen=request.addEventListener.bind(request);Object.defineProperty(request,'onsuccess',{set(callback){listen('success',event=>(window as any).deliver=()=>callback.call(request,event));}});return request;};});
await p.goto('http://127.0.0.1:4252/?share=late-share');await expect.poll(()=>p.evaluate(()=>typeof (window as any).deliver)).toBe('function');
const input=p.getByLabel('Message with a date or time');await expect(input).toHaveValue('June 18, 2026 9am UTC');
const transient=await p.locator('.result').count();
// Hold the real share beyond the debounce; restored draft must convert first.
await p.waitForTimeout(600);await expect(p.locator('.hero-time')).toHaveText(/9:00 am/i);await expect(p.locator('.result-date')).toContainText('18 Jun');
await p.evaluate(()=>(window as any).deliver());await expect(p.getByRole('button',{name:'Replace with imported text'})).toBeVisible();
await expect(p.locator('.result')).toHaveCount(1);await expect(p.locator('.hero-time')).toHaveText(/9:00 am/i);await expect(p.locator('.result-source')).toContainText('June 18, 2026 9am UTC');
await p.getByRole('button',{name:'Dismiss imported text'}).click();await p.waitForTimeout(400);await expect(input).toHaveValue('June 18, 2026 9am UTC');await expect(p.locator('.hero-time')).toHaveText(/9:00 am/i);
reports.push({profile:name,engine:b.version(),initialTransientCount:transient,after600msCount:1,afterShareCount:1,afterDismissDraft:'June18 9am preserved',result:'pass',checkedAt:new Date().toISOString()});await b.close();}
writeFileSync('/tmp/chronoshift-live-code/final-import-independent.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports,null,2));
