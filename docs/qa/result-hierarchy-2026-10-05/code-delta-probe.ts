import { chromium, webkit, devices, expect } from '/Users/tien/Developer/ChronoShift/node_modules/@playwright/test/index.mjs';
import { writeFile } from 'node:fs/promises';
const release=await (await fetch('http://127.0.0.1:4250/release.json')).json();
expect(release.sourceCommit).toBe('150875f7906093ed20b94d76533e0f523f4a9430');
const records:any[]=[];
for (const [engine,device] of [[chromium,devices['Pixel 7']],[webkit,devices['iPhone 13']]] as const) {
 const browser=await engine.launch();
 const context=await browser.newContext({...device,locale:'en-AU',timezoneId:'Australia/Sydney'});
 const page=await context.newPage(); const errors:string[]=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('Review fallback'))}}));
 await page.goto('http://127.0.0.1:4250/');
 await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
 const target=page.getByLabel('Convert to',{exact:true}); await target.fill('UTC'); await target.press('Tab');
 for (const width of [280,320,359,360,390]) {
  await page.setViewportSize({width,height:844});
  for (const [input,kind] of [['2026-04-09T23:59:59.123Z','fractional'],['April 9, 2026','date-only']]) {
   await page.getByLabel('Message with a date or time').fill(input);
   await page.getByRole('button',{name:'Convert',exact:true}).click();
   await expect(page.locator('.result')).toHaveCount(1);
   if(kind==='fractional') await expect(page.locator('.hero-time')).toHaveText(/11:59:59[,.]123 pm/i);
   else await expect(page.locator('.hero-date')).toHaveText('Thursday, 9 April 2026');
   const value=await page.evaluate(()=>{
    const top=document.querySelector('.result-top')!, output=top.querySelector('.result-output')!,copy=top.querySelector('.copy-button')!,hero=output.querySelector('.hero-time,.hero-date')!;
    const text=hero.textContent!,range=document.createRange();range.setStart(hero.firstChild!,0);range.setEnd(hero.firstChild!,text.replace(/\s*[ap]m$/i,'').length);
    const css=getComputedStyle(hero);
    return {text,columns:getComputedStyle(top).gridTemplateColumns,copy:copy.getBoundingClientRect().toJSON(),output:output.getBoundingClientRect().toJSON(),hero:hero.getBoundingClientRect().toJSON(),lineHeight:parseFloat(css.lineHeight),numericRects:[...range.getClientRects()].map(r=>r.toJSON()),scrollWidth:document.documentElement.scrollWidth,width:innerWidth};
   });
   expect(value.scrollWidth).toBeLessThanOrEqual(width);
   expect(value.copy.height).toBeGreaterThanOrEqual(44);
   expect(value.copy.width).toBeGreaterThanOrEqual(44);
   if(width<=359) expect(value.copy.top).toBeGreaterThanOrEqual(value.output.bottom);
   if(kind==='fractional') expect(new Set(value.numericRects.map(r=>r.top)).size).toBe(1);
   if(kind==='date-only'&&width===280) expect(value.hero.height).toBeLessThanOrEqual(2*value.lineHeight+0.1);
   await page.getByRole('button',{name:/^Copy /}).click();
   await expect(page.getByLabel('Text to copy')).toBeVisible();
   const payload=await page.getByLabel('Text to copy').inputValue();
   if(kind==='fractional') expect(payload).toMatch(/^11:59:59\.123 pm · Thu, 9 Apr 2026 · UTC\n2026-04-09T23:59:59\.123Z — UTC\+00:00$/);
   else expect(payload).toBe('Thursday, 9 April 2026 · Date only\nApril 9, 2026 — Date only');
   records.push({engine:engine.name(),browser:browser.version(),device:device.userAgent,kind,width,...value,payload});
  }
 }
 expect(errors).toEqual([]);
 await context.close(); await browser.close();
}
await writeFile('/tmp/chronoshift-result-code-delta-probe.json',JSON.stringify({time:new Date().toISOString(),release,records},null,2));
console.log(JSON.stringify({release,cases:records.length,browsers:[...new Set(records.map(r=>r.engine+' '+r.browser))]}));
