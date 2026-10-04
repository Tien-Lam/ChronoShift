import { chromium, firefox, webkit } from '/Users/tien/Developer/ChronoShift/node_modules/@playwright/test/index.mjs';
const out='/tmp/chronoshift-result-adversarial-captures',results=[];
for(const [engine,api] of Object.entries({chromium,firefox,webkit})){
 const browser=await api.launch();const context=await browser.newContext({viewport:{width:320,height:740},timezoneId:'Australia/Sydney',locale:'en-AU',colorScheme:'dark'}); const page=await context.newPage();
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('review clipboard fallback'))}}));
 await page.goto('http://127.0.0.1:4254/');await page.locator('main[data-offline-ready=true]').waitFor();
 for(const [name,text] of [['milliseconds','2026-04-09T15:59:59.123+02:00'],['dstfold','November 1, 2026 1:30am America/New_York'],['longquote','April 9, 2026 '+ ' '.repeat(450)+'11:00pm America/Los_Angeles - April 10, 2026 1:00am America/Los_Angeles']]){
 await page.getByLabel('Message with a date or time').fill(text);await page.getByRole('button',{name:'Convert',exact:true}).click(); await page.waitForFunction(()=>document.querySelectorAll('.result').length>0 && document.querySelector('.result-panel')?.getAttribute('aria-busy')==='false');
 await page.locator('.result-panel').scrollIntoViewIfNeeded();await page.locator('.result-panel').screenshot({path:`${out}/${engine}-320-dark-${name}.png`});
 const before=await page.locator('.result-panel').innerText(); const copies=[];
 for(const copy of await page.locator('.copy-button').all()){const label=await copy.getAttribute('aria-label');await copy.click();await page.getByLabel('Text to copy').waitFor();const payload=await page.getByLabel('Text to copy').inputValue(); copies.push({label,payload});}
 await page.setViewportSize({width:1440,height:900});const after=await page.locator('.result-panel').innerText();if(before!==after)throw new Error('resize changed result text'); await page.setViewportSize({width:320,height:740});
 const dims=await page.evaluate(()=>[...document.querySelectorAll('.hero-time,.hero-date,.copy-button,.result-source')].map(el=>{const r=el.getBoundingClientRect(),s=getComputedStyle(el);return {text:el.textContent,width:r.width,height:r.height,x:r.x,font:s.fontSize,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth}}));results.push({engine,name,text,before,copies,resizePreserved:before===after,dims});console.log(engine,name,before);
 }
 await context.close();await browser.close();
}
await Bun.write(`${out}/extra.json`,JSON.stringify(results,null,2));
