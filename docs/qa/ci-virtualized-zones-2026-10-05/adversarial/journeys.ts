import { chromium, firefox, webkit, devices, expect, type Page, type Locator } from "@playwright/test";
import { createHash } from "node:crypto";
const out=import.meta.dir;
const records:any[]=[];
const logicalOrders:Record<string,string[]>={};
const utc=()=>new Date().toISOString();
const save=async()=>Bun.write(`${out}/journeys-results.json`,JSON.stringify({start, finish:utc(), records},null,2));
const start=utc();
const profiles=[
 {name:"chromium",engine:chromium,device:"Desktop Chrome",viewport:{width:900,height:640}},
 {name:"firefox",engine:firefox,device:"Desktop Firefox",viewport:{width:900,height:640}},
 {name:"iphone",engine:webkit,device:"iPhone 13"},
];
async function owned(page:Page,input:Locator){
 await expect(input).toHaveAttribute("aria-expanded","true");
 const id=await input.getAttribute("aria-controls");
 expect(id).toBeTruthy();
 const list=page.locator(`[id="${id}"]`); await expect(list).toBeVisible(); return list;
}
async function focusReady(input:Locator){ await input.scrollIntoViewIfNeeded(); await input.click(); }
async function prepare(page:Page){await page.getByText("More options",{exact:true}).click();}
async function active(page:Page,input:Locator,list:Locator){
 await expect.poll(async()=>input.getAttribute("aria-activedescendant")).toBeTruthy();
 const id=await input.getAttribute("aria-activedescendant"); const option=list.locator(`[id="${id}"]`);
 await expect(option).toHaveAttribute("data-focused","true");
 const geometry=await option.evaluate(el=>{const l=el.closest('[role="listbox"]')!;const r=el.getBoundingClientRect(),b=l.getBoundingClientRect();return {row:{x:r.x,y:r.y,w:r.width,h:r.height},list:{x:b.x,y:b.y,w:b.width,h:b.height},inside:r.top>=Math.max(0,b.top)-1&&r.bottom<=Math.min(innerHeight,b.bottom)+1,value:el.getAttribute("data-value"),pos:el.getAttribute("aria-posinset"),size:el.getAttribute("aria-setsize")}});
 expect(geometry.inside).toBe(true); return geometry;
}
async function logical(page:Page,rec:any,order:string[]){
 const input=page.locator("#target-zone");await focusReady(input);await input.fill("");await page.getByRole("button",{name:"Show target timezones",exact:true}).click();
 const list=await owned(page,input);
 if(!order.length)order.push(...await list.locator('[role="option"][data-value]').evaluateAll(es=>es.map(e=>e.getAttribute("data-value")!)));
 expect(order.length).toBeGreaterThan(400);rec.logicalCount=order.length;rec.initialMounted=await list.locator('[role="option"][data-value]').count();rec.interior=[];
 await input.press("ArrowDown");
 for(const index of [Math.floor(order.length/4),Math.floor(order.length/2),Math.floor(order.length*3/4)]){
  await input.press("Home");for(let i=0;i<index;i++)await input.press("ArrowDown");
  const state=await active(page,input,list);expect(state.value).toBe(order[index]);rec.interior.push(state);
 }
 await input.press("Enter");await expect(input).toHaveValue(order[Math.floor(order.length*3/4)]);
 await expect(page.getByRole("listbox")).toHaveCount(0);
}
async function filtering(page:Page,rec:any){
 const input=page.locator("#target-zone");await focusReady(input);await input.fill("Argentina");let list=await owned(page,input);
 await input.press("ArrowDown");await input.press("End");rec.fewLast=await active(page,input,list);await input.press("Home");rec.fewFirst=await active(page,input,list);
 await input.fill("zzzz-no-timezone-match");list=await owned(page,input);await expect(list.locator('[role="option"][data-value]')).toHaveCount(0);await expect(list.getByText("No matches",{exact:true})).toBeVisible();
 await input.fill("");list=await owned(page,input);await input.press("ArrowDown");await input.press("End");rec.fullLast=await active(page,input,list);await input.press("Enter");await expect(input).toHaveValue(rec.fullLast.value);
 await focusReady(input);await input.fill("+05:45");await input.press("Tab");await expect(input).toHaveValue("+05:45");
}
async function reopen(page:Page,rec:any){
 await prepare(page);const results=[];
 for(const id of ["target-zone","source-zone"]){const input=page.locator(`#${id}`),other=page.locator(id==="target-zone"?"#source-zone":"#target-zone");const otherValue=await other.inputValue();
  await focusReady(input);await input.fill("Asia/Tokyo");let list=await owned(page,input);const alias=list.getByRole("option",{name:"Osaka",exact:true});await page.mouse.move(0,0);await alias.hover();await expect(alias).toHaveAttribute("data-hovered","true");await input.press("Tab");await expect(input).toHaveValue("Asia/Tokyo");await expect(page.getByRole("listbox")).toHaveCount(0);
  await input.fill("Asia/Toky");list=await owned(page,input);await input.press("ArrowDown");await input.press("End");await expect(list.getByRole("option",{name:"Osaka",exact:true})).toHaveAttribute("data-focused","true");await input.press("Tab");await expect(input).toHaveValue("osaka");await expect(page.getByRole("listbox")).toHaveCount(0);
  await focusReady(input);await expect(input).toHaveAttribute("aria-expanded","false");await input.fill("Tokyo");list=await owned(page,input);await list.getByRole("option",{name:"Tokyo",exact:true}).click();await expect(input).toHaveValue("Asia/Tokyo");await expect(other).toHaveValue(otherValue);results.push({id,value:await input.inputValue(),other:await other.inputValue()});
 }rec.fields=results;
}
async function eagerTab(page:Page,rec:any){
 await page.getByLabel("Appearance",{exact:true}).click();rec.keys=[];
 for(const key of ["Enter","Space"]){const trigger=page.locator("#theme");await trigger.focus();await trigger.press(key);await expect(page.getByRole("option")).toHaveCount(3);await trigger.press("Tab");const message=page.getByLabel("Message with a date or time");await expect(message).toBeFocused();await message.pressSequentially("April 9, 2026 3pm UTC");await expect(message).toHaveValue("April 9, 2026 3pm UTC");rec.keys.push(key);await message.fill("");}
}
async function dismissal(page:Page,rec:any){
 await prepare(page);const input=page.locator("#source-zone");await focusReady(input);await input.fill("Argentina");await owned(page,input);rec.openScrollY=await page.evaluate(()=>scrollY);
 await page.getByLabel("Message with a date or time").scrollIntoViewIfNeeded();await expect(input).toHaveAttribute("aria-expanded","false");rec.closedScrollY=await page.evaluate(()=>scrollY);await focusReady(input);await input.fill("Tokyo");const list=await owned(page,input);await list.getByRole("option",{name:"Tokyo",exact:true}).click();await expect(input).toHaveValue("Asia/Tokyo");
}
async function scrollPointer(page:Page,rec:any){
 const input=page.locator("#target-zone");await focusReady(input);await input.fill("");await page.getByRole("button",{name:"Show target timezones",exact:true}).click();const list=await owned(page,input);const b=(await list.boundingBox())!;await page.mouse.move(b.x+b.width/2,b.y+b.height/2);rec.wheelStart=utc();await page.mouse.wheel(0,620);rec.wheelDone=utc();
 const value=await list.evaluate(l=>{const b=l.getBoundingClientRect();const es=[...l.querySelectorAll('[role="option"][data-value]')];return es.find(e=>{const r=e.getBoundingClientRect();return r.top>=b.top&&r.bottom<=b.bottom})?.getAttribute("data-value")});expect(value).toBeTruthy();rec.chosen=value;rec.pointerStart=utc();await list.locator(`[data-value="${value}"]`).click();rec.pointerDone=utc();await expect(input).toHaveValue(value!);
}
async function resize(page:Page,rec:any){
 const input=page.locator("#target-zone");await focusReady(input);await input.fill("America/Argentina/Rio_Gallegos");await owned(page,input);rec.geometry=[];
 for(const viewport of [{width:280,height:960},{width:740,height:360},{width:280,height:960}]){await page.setViewportSize(viewport);const list=await owned(page,input);await expect.poll(()=>list.locator('[role="option"][data-value]').count()).toBeGreaterThan(0);
  const g=await list.evaluate(l=>{const b=l.getBoundingClientRect();return {viewport:{width:innerWidth,height:innerHeight},list:{x:b.x,y:b.y,w:b.width,h:b.height},scrollWidth:l.scrollWidth,clientWidth:l.clientWidth,rows:[...l.querySelectorAll('[role="option"][data-value]')].map(e=>{const r=e.getBoundingClientRect(),p=e.parentElement!.getBoundingClientRect();return{value:e.getAttribute("data-value"),x:r.x,y:r.y,w:r.width,h:r.height,parentHeight:p.height,scrollWidth:e.scrollWidth,clientWidth:e.clientWidth}})}});expect(g.scrollWidth).toBeLessThanOrEqual(g.clientWidth);for(const row of g.rows){expect(row.scrollWidth).toBeLessThanOrEqual(row.clientWidth);expect(row.h).toBeGreaterThanOrEqual(44);}rec.geometry.push(g);
 }
 const list=await owned(page,input);await input.press("ArrowDown");rec.focus=await active(page,input,list);await input.press("Enter");await expect(input).toHaveValue("America/Argentina/Rio_Gallegos");rec.normalBeforeScreenshot=await diagnostics(page);await focusReady(input);await input.fill("Argentina");await owned(page,input);await page.screenshot({path:`${out}/${rec.build}-${rec.profile}-narrow.png`});
}
async function diagnostics(page:Page){return page.evaluate(()=>({csp:(window as any).__reviewCsp,scroll:(window as any).__reviewScroll}));}
for(const build of [{name:"baseline",port:4321},{name:"candidate",port:4322}]){
 const origin=`http://127.0.0.1:${build.port}`;const identities:any={kind:"identity",build:build.name,origin,utc:utc(),files:[]};
 for(const path of ["/","/release.json","/sw.js"]){const r=await fetch(origin+path),data=await r.text();identities.files.push({path,status:r.status,bytes:Buffer.byteLength(data),sha256:createHash("sha256").update(data).digest("hex"),...(path==="/release.json"?{data:JSON.parse(data)}:{})});if(path==="/")for(const a of data.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)){const path=a[1],r=await fetch(origin+path),data=await r.text();identities.files.push({path,status:r.status,bytes:Buffer.byteLength(data),sha256:createHash("sha256").update(data).digest("hex")});}}
 records.push(identities);await save();
 for(const profile of profiles){const browser=await profile.engine.launch();const order=logicalOrders[profile.name]??=[];
  for(const [name,fn] of Object.entries({logical,filtering,reopen,eagerTab,...(profile.name!=="iphone"?{scrollPointer}:{}),resize,...(profile.name==="iphone"?{dismissal}: {})})){
   const rec:any={build:build.name,origin,profile:profile.name,browser:browser.version(),journey:name,start:utc(),faultInjection:false};records.push(rec);const context=await browser.newContext({...devices[profile.device],...(profile.viewport?{viewport:profile.viewport}:{}),deviceScaleFactor:1,locale:"en-AU",timezoneId:"Australia/Sydney",reducedMotion:"no-preference"});const page=await context.newPage();page.setDefaultTimeout(5000);const errors:string[]=[],consoleErrors:string[]=[];page.on("pageerror",e=>errors.push(e.message));page.on("console",m=>{if(m.type()==="error")consoleErrors.push(m.text())});
   await page.addInitScript(()=>{(window as any).__reviewCsp=[];(window as any).__reviewScroll=[];document.addEventListener("securitypolicyviolation",e=>(window as any).__reviewCsp.push({at:performance.now(),directive:e.effectiveDirective,blocked:e.blockedURI}));document.addEventListener("scroll",e=>(window as any).__reviewScroll.push({at:performance.now(),target:(e.target as HTMLElement).id||((e.target as HTMLElement).getAttribute?.("role"))||"document",y:scrollY}),true)});
   try{await page.goto(origin);await fn(page,rec,order);rec.status="pass";}catch(e){rec.status="fail";rec.error=String(e);rec.failureHtml=await page.locator("body").innerHTML();}finally{rec.beforeCaptureDiagnostics=await diagnostics(page);rec.pageErrors=errors;rec.consoleErrors=consoleErrors;rec.end=utc();await save();await context.close();console.log(JSON.stringify({build:rec.build,profile:rec.profile,journey:rec.journey,status:rec.status,start:rec.start,end:rec.end,error:rec.error}));}
  }await browser.close();
 }
}
await save();
console.log(JSON.stringify({start,end:utc(),failed:records.filter(r=>r.status==="fail").length}));
