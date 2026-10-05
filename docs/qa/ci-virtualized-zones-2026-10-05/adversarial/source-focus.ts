import {firefox,webkit,devices,expect} from "@playwright/test";
const start=new Date().toISOString(),records:any[]=[];
const save=()=>Bun.write(`${import.meta.dir}/source-focus-results.json`,JSON.stringify({start,end:new Date().toISOString(),records},null,2));
for(const build of [{name:"baseline",port:4321},{name:"candidate",port:4322}])for(const profile of [{name:"firefox",engine:firefox,device:"Desktop Firefox",viewport:{width:900,height:640}},{name:"iphone",engine:webkit,device:"iPhone 13"}]){
 const browser=await profile.engine.launch();
 for(const preparation of ["original-fill","native-source-focus"]){const rec:any={build:build.name,origin:`http://127.0.0.1:${build.port}`,profile:profile.name,browser:browser.version(),preparation,start:new Date().toISOString()};records.push(rec);const ctx=await browser.newContext({...devices[profile.device],...(profile.viewport?{viewport:profile.viewport}:{}),deviceScaleFactor:1,locale:"en-AU",timezoneId:"Australia/Sydney",reducedMotion:"no-preference"});const page=await ctx.newPage();page.setDefaultTimeout(10000);const errors:string[]=[];page.on("pageerror",e=>errors.push(e.message));
 await page.addInitScript(()=>{(window as any).__events=[];for(const event of ["focusin","scroll","input"]){document.addEventListener(event,e=>{const t=e.target as HTMLElement;(window as any).__events.push({at:performance.now(),event,id:t.id,scrollY,expanded:document.querySelector('#source-zone')?.getAttribute('aria-expanded'),controls:!!document.querySelector('#source-zone')?.getAttribute('aria-controls')})},true)}});
 try{await page.goto(rec.origin);await page.getByText("More options",{exact:true}).click();const source=page.locator("#source-zone"),target=page.locator("#target-zone");
  for(const input of [source,target]){await input.fill("UTC");await input.press("Tab");await expect(input).toHaveValue("UTC");}await page.getByLabel("Message with a date or time").fill("April 9, 2026 3pm UTC");
  for(const input of [target,source]){if(preparation==="native-source-focus"){await input.scrollIntoViewIfNeeded();await input.click();await expect(input).toHaveAttribute("aria-expanded","false");}
   await input.fill("CST");await input.press("Tab");await expect(input).toHaveValue("CST");
   if(preparation==="native-source-focus"){await input.scrollIntoViewIfNeeded();await input.click();await expect(input).toHaveAttribute("aria-expanded","false");}
   await input.fill("Asia/Tokyo");await expect(input).toHaveAttribute("aria-controls",/.+/);const list=page.locator(`[id="${await input.getAttribute("aria-controls")}"]`);const alias=list.getByRole("option",{name:"Osaka",exact:true});await page.mouse.move(0,0);await alias.hover();await expect(alias).toHaveAttribute("data-hovered","true");await input.press("Tab");await expect(input).toHaveValue("Asia/Tokyo");await expect(page.getByRole("listbox")).toHaveCount(0);
  }rec.status="pass";
 }catch(e){rec.status="fail";rec.error=String(e);rec.html=await page.locator("body").innerHTML();}finally{rec.events=await page.evaluate(()=>(window as any).__events);rec.pageErrors=errors;rec.end=new Date().toISOString();await save();await ctx.close();console.log(JSON.stringify({build:rec.build,profile:rec.profile,preparation,status:rec.status,start:rec.start,end:rec.end,error:rec.error}));}
 }await browser.close();
}await save();
