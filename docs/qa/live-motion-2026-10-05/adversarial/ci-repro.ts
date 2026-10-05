import {chromium,firefox} from 'playwright';
import {expect} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
const out='docs/qa/live-motion-2026-10-05/adversarial';
const popupOpacity=process.argv.includes('--popup-opacity');
const candidate=process.argv.includes('--candidate');
const reportFile=popupOpacity?'ci-popup-opacity':candidate?'ci-candidate':'ci-repro';
const report:any={start:new Date().toISOString(),cases:[]};
for(const [engine,launcher] of [['chromium',chromium],['firefox',firefox]] as const){
 if(popupOpacity&&engine!=='firefox')continue;
 const browser=await launcher.launch();
 for(const reduced of [false,true]){
  if((popupOpacity||candidate)&&reduced)continue;
  const started=Date.now();const context=await browser.newContext({viewport:{width:900,height:640},locale:'en-AU',timezoneId:'Australia/Sydney',reducedMotion:reduced?'reduce':'no-preference'});
  const page=await context.newPage();page.setDefaultTimeout(5000);
  if(popupOpacity)await page.route('**/assets/*.css',async route=>{const response=await route.fetch();const css=await response.text();if(!css.includes('.choice-popover[data-entering]'))throw Error('popover rule missing');await route.fulfill({response,body:css+'.choice-popover[data-entering]{animation-name:overlay-opacity}@keyframes overlay-opacity{from{opacity:.8}to{opacity:1}}'});});
  const label=`ci-${engine}-${candidate?'candidate':popupOpacity?'popup-opacity':reduced?'reduced':'motion'}`;const record:any={label,browser:browser.version(),reduced,popupOpacity,candidate,errors:[]};
  page.on('pageerror',e=>record.errors.push(e.message));
  let stage='start';
  try{
   await page.goto('http://127.0.0.1:4254');
   await page.evaluate(()=>{const w=window as any;w.ciEvents=[];for(const type of ['pointerdown','pointerup','click','focusin','focusout','keydown'])document.addEventListener(type,e=>w.ciEvents.push({ms:performance.now(),type,target:(e.target as Element)?.className,text:(e.target as Element)?.textContent?.slice(0,70),key:(e as KeyboardEvent).key}),true);});
   await page.getByText('More options',{exact:true}).click();
   const target=page.getByLabel('Convert to',{exact:true}),source=page.getByLabel('Source timezone when none is given',{exact:true});
   await source.fill('UTC');await target.fill('Tokyo');await expect(page.getByRole('option',{name:/Tokyo/})).toHaveCount(1);await target.press('ArrowDown');await target.press('Enter');await expect(target).toHaveValue('Asia/Tokyo');await expect(source).toHaveValue('UTC');await expect(page.getByRole('listbox')).toHaveCount(0);
   await page.getByLabel('Message with a date or time').fill('April 9, 2026 3pm UTC');await expect(page.locator('.hero-time')).toHaveText(/12:00 am/i);
   await target.fill('UTC');await expect(page.getByRole('listbox')).toBeVisible();await target.press('Escape');await expect(page.getByRole('listbox')).toHaveCount(0);await expect(page.locator('.hero-time')).toHaveText(/3:00 pm/i);
   await target.click();await target.fill('Definitely/Not-A-Timezone');await expect(page.getByText('No matches',{exact:true})).toBeVisible();await expect(page.locator('[role="option"][data-value]')).toHaveCount(0);await target.press('Escape');await expect(target).toHaveValue('Definitely/Not-A-Timezone');await expect(target).toHaveAttribute('aria-invalid','true');await expect(page.locator('.result')).toHaveCount(0);await expect(page.getByRole('alert')).toContainText(/timezone/i);
   await target.fill('+05:45');await target.press('Escape');await expect(target).toHaveValue('+05:45');await expect(target).not.toHaveAttribute('aria-invalid','true');await expect(page.locator('.hero-time')).toHaveText(/8:45 pm/i);await expect(source).toHaveValue('UTC');
   await target.fill('');await target.press('Escape');stage='empty-toggle';await page.getByRole('button',{name:'Show target timezones',exact:true}).click();await expect(page.getByRole('option').first()).toBeVisible();
   stage='resize';await page.setViewportSize({width:280,height:960});const popup=page.locator('.choice-popover:visible');await expect(popup).toBeVisible();await expect.poll(async()=>{const b=await popup.boundingBox();return !!b&&b.x>=0&&b.x+b.width<=281;}).toBe(true);
   const bounds=(await popup.boundingBox())!,control=(await target.boundingBox())!;expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(961);expect(bounds.width).toBeGreaterThanOrEqual(Math.min(control.width,256)-1);
   const style=await popup.evaluate(e=>{const c=getComputedStyle(e);return {background:c.backgroundColor,border:c.borderTopWidth,radius:c.borderTopLeftRadius,overflow:e.scrollWidth>e.clientWidth};});expect(style.background).not.toBe('rgba(0, 0, 0, 0)');expect(style.border).toBe('1px');expect(parseFloat(style.radius)).toBeGreaterThanOrEqual(8);expect(style.overflow).toBe(false);await expect(target).toHaveValue('');
   await target.press('Escape');await target.fill('Tokyo');
   await page.evaluate(()=>{const w=window as any;w.ciFrames=[];let count=0;function frame(){const option=document.querySelector('[role=option]'),popup=document.querySelector('.choice-popover');const b=option?.getBoundingClientRect();const hit=b?document.elementFromPoint(b.x+b.width/2,b.y+b.height/2):null;w.ciFrames.push({ms:performance.now(),input:(document.querySelector('#target-zone') as HTMLInputElement).value,scrollY,popup:popup?.getBoundingClientRect().toJSON(),option:b?.toJSON(),hit:hit?.className,hitTag:hit?.tagName,htmlPointer:getComputedStyle(document.documentElement).pointerEvents,bodyPointer:getComputedStyle(document.body).pointerEvents,animations:document.getAnimations().map(a=>({name:(a as CSSAnimation).animationName,time:a.currentTime,state:a.playState,target:((a.effect as KeyframeEffect).target as Element)?.className}))});if(count++<60)requestAnimationFrame(frame);}frame();});
   stage='Tokyo-pointer';await page.getByRole('option',{name:/Tokyo/}).click();stage='Tokyo-value';await expect(target).toHaveValue('Asia/Tokyo');await expect(page.locator('.hero-time')).toHaveText(/12:00 am/i);
   await source.fill('New York');await page.getByRole('option',{name:/New York/}).click();await expect(source).toHaveValue('America/New_York');await expect(target).toHaveValue('Asia/Tokyo');await expect(page.locator('.hero-time')).toHaveText(/12:00 am/i);record.verdict='pass';
  }catch(e){record.verdict='fail';record.stage=stage;record.error=String(e);}
  record.state=await page.evaluate(()=>({text:document.body.innerText,events:(window as any).ciEvents,frames:(window as any).ciFrames,html:document.querySelector('.choice-popover')?.outerHTML}));record.elapsedMs=Date.now()-started;
  await page.screenshot({path:`${out}/${label}.png`,fullPage:true});report.cases.push(record);await writeFile(`${out}/${reportFile}.json`,JSON.stringify(report,null,2));console.log({label,verdict:record.verdict,stage:record.stage,elapsedMs:record.elapsedMs,error:record.error});await context.close();
 }
 await browser.close();
}
report.finished=new Date().toISOString();await writeFile(`${out}/${reportFile}.json`,JSON.stringify(report,null,2));
