import { chromium } from 'playwright';
import { writeFile } from 'node:fs/promises';
const out = 'docs/qa/live-motion-2026-10-05/adversarial';
const started = new Date();
const browser = await chromium.launch();
const observations: any = {started: started.toISOString(), browser: browser.version(), cases: [], errors: [], requests: []};
const context = await browser.newContext({ viewport: {width:1280,height:900}, locale:'en-AU', timezoneId:'Australia/Sydney' });
const page = await context.newPage();
page.setDefaultTimeout(5000);
page.on('pageerror', e => observations.errors.push({kind:'pageerror',message:e.message}));
page.on('console', e => {if(['error','warning'].includes(e.type())) observations.errors.push({kind:e.type(),message:e.text()});});
page.on('request', r => observations.requests.push({url:r.url(), method:r.method()}));
await page.goto('http://127.0.0.1:4254');
await page.waitForTimeout(700);
async function snapshot() {
 return await page.evaluate(() => {
  const result = document.querySelector('.result-panel')!;
  const indicator = document.querySelector('.live-indicator')!;
  const rect = (e:Element) => {const b=e.getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height};};
  return {busy:result.getAttribute('aria-busy'), state:indicator.getAttribute('data-state'), indicator:indicator.textContent,
   body:document.body.innerText, copy:[...document.querySelectorAll('.copy-button')].map(e=>({text:e.textContent,disabled:(e as HTMLButtonElement).disabled})),
   indicatorRect:rect(indicator), resultRect:rect(result), pageWidth:document.documentElement.scrollWidth, viewport:innerWidth,
   times:[...document.querySelectorAll('.hero-time')].map(e=>({text:e.textContent,box:rect(e),lineHeight:getComputedStyle(e).lineHeight,fontSize:getComputedStyle(e).fontSize})),
   animations:document.getAnimations().map(a=>({target:(a.effect as KeyframeEffect)?.target instanceof Element ? ((a.effect as KeyframeEffect).target as Element).className:null,name:(a as CSSAnimation).animationName,playState:a.playState,currentTime:a.currentTime,timing:a.effect?.getComputedTiming()})),
   pseudo:[...document.querySelectorAll('.live-dots span,.live-indicator,.result-panel,.result')].map(e=>({target:e.className,before:getComputedStyle(e,'::before').animationName,after:getComputedStyle(e,'::after').animationName,animation:getComputedStyle(e).animationName,transition:getComputedStyle(e).transitionDuration})),
  };
 });
}
async function timeline(label:string, action:()=>Promise<any>) {
 await page.evaluate(() => {
  const w=window as any; w.motionSamples=[]; w.motionStart=performance.now(); w.motionRecording=true;
  function frame(){if(!w.motionRecording)return; const panel=document.querySelector('.result-panel'), live=document.querySelector('.live-indicator');
   w.motionSamples.push({ms:performance.now()-w.motionStart,busy:panel?.getAttribute('aria-busy'),state:live?.getAttribute('data-state'),text:live?.textContent,copies:document.querySelectorAll('.copy-button').length,times:[...document.querySelectorAll('.hero-time')].map(e=>e.textContent),animations:document.getAnimations().map(a=>({name:(a as CSSAnimation).animationName,time:a.currentTime,state:a.playState}))}); requestAnimationFrame(frame);}; requestAnimationFrame(frame);
 });
 await action();
 await page.waitForTimeout(60);
 const early=await snapshot();
 await page.screenshot({path:`${out}/${label}-early.png`,fullPage:true});
 await page.waitForTimeout(1000);
 const settled=await snapshot();
 const samples=await page.evaluate(()=>{const w=window as any;w.motionRecording=false;return w.motionSamples;});
 observations.cases.push({label,early,settled,samples});
 await writeFile(`${out}/observations.json`,JSON.stringify(observations,null,2));
 await page.screenshot({path:`${out}/${label}-settled.png`,fullPage:true});
 return settled;
}
await timeline('desktop-first',()=>page.locator('textarea').fill('July 15 2026 at 3:05:07.123pm UTC'));
await timeline('desktop-rapid',async()=>{await page.locator('textarea').fill('July 15 2026 at 9am UTC');await page.waitForTimeout(90);await page.locator('textarea').fill('July 15 2026 at 11am UTC');await page.waitForTimeout(90);await page.locator('textarea').fill('July 15 2026 at 6pm UTC');});
await page.getByRole('combobox',{name:'Convert to',exact:true}).fill('London');
await page.getByRole('option').filter({hasText:'London'}).first().click();
await page.waitForTimeout(800);
observations.cases.push({label:'target-London',settled:await snapshot()});
await page.locator('summary').filter({hasText:'More options'}).click();
await page.getByRole('combobox',{name:'Source timezone when none is given',exact:true}).fill('Tokyo');
await page.getByRole('option').filter({hasText:'Tokyo'}).first().click();
await timeline('source-Tokyo',()=>page.locator('textarea').fill('July 15 2026 at 6pm'));
await timeline('invalid',()=>page.locator('textarea').fill('no date or time exists here'));
await timeline('recover',()=>page.locator('textarea').fill('July 15 2026 at 6pm UTC'));
await timeline('clear-ready',()=>page.getByRole('button',{name:'Clear',exact:true}).click());
await timeline('clear-pending',async()=>{await page.locator('textarea').fill('July 15 2026 at 9am UTC');await page.waitForTimeout(60);await page.getByRole('button',{name:'Clear',exact:true}).click();});
await page.locator('summary').filter({hasText:'More options'}).click();
for(const theme of ['Dark','Light']){
 await page.locator('.appearance > summary').click();
 await page.getByRole('button',{name:/Theme/}).click();await page.getByRole('option',{name:theme,exact:true}).click();
 await page.locator('.appearance > summary').click();
 for(const width of [1280,390,280]){
  await page.setViewportSize({width,height:900});
  await timeline(`${theme}-${width}-precision`,()=>page.locator('textarea').fill('July 15 2026 at 3:05:07.123pm UTC'));
  await page.waitForTimeout(2200); observations.cases.push({label:`${theme}-${width}-idle`,settled:await snapshot()});
  await page.getByRole('button',{name:'Show target timezones',exact:true}).click(); await page.waitForTimeout(200);
  observations.cases.push({label:`${theme}-${width}-zones`,popup:await page.locator('.choice-popover').evaluateAll(els=>els.map(e=>({html:e.outerHTML,rect:e.getBoundingClientRect().toJSON(),scrollHeight:e.scrollHeight}))),settled:await snapshot()});
  await page.screenshot({path:`${out}/${theme}-${width}-zones.png`,fullPage:true});await page.keyboard.press('Escape');
  await page.locator('summary').filter({hasText:'More options'}).click();
  await page.getByRole('button',{name:/Choose reference date/}).click();await page.waitForTimeout(200);
  observations.cases.push({label:`${theme}-${width}-calendar`,popup:await page.locator('[role=dialog]').evaluateAll(els=>els.map(e=>({html:e.outerHTML,rect:e.getBoundingClientRect().toJSON(),scrollHeight:e.scrollHeight}))),settled:await snapshot()});
  await page.screenshot({path:`${out}/${theme}-${width}-calendar.png`,fullPage:true});await page.keyboard.press('Escape');
  await page.locator('summary').filter({hasText:'More options'}).click();
 }
}
await page.emulateMedia({reducedMotion:'reduce'});
await timeline('reduced-280',()=>page.locator('textarea').fill('July 15 2026 at 9am UTC'));
await page.getByRole('button',{name:'Show target timezones',exact:true}).click();observations.cases.push({label:'reduced-popup',settled:await snapshot()});await page.keyboard.press('Escape');
observations.finished=new Date().toISOString();observations.elapsedMs=Date.now()-started.getTime();
await writeFile(`${out}/observations.json`,JSON.stringify(observations,null,2));
console.log(JSON.stringify({elapsedMs:observations.elapsedMs,browser:observations.browser,cases:observations.cases.length,errors:observations.errors}));
await browser.close();
