import {chromium, expect} from '/Users/tien/Developer/ChronoShift/node_modules/@playwright/test/index.mjs';
import {readFileSync,writeFileSync} from 'node:fs';
const source=readFileSync('/Users/tien/Developer/ChronoShift/scripts/verify-hosted-rollout.ts','utf8');
const restored=source.slice(source.indexOf('    const manual ='),source.indexOf('    await expect(page.locator(".hero-time"))',source.indexOf('    const manual =')));
const off=source.slice(source.indexOf('    const offlineManual ='),source.indexOf('    await expect(page.locator(".hero-time"))',source.indexOf('    const offlineManual =')));
const b=await chromium.launch();const results=[];
for(const [branch,block] of [['restored',restored],['offline',off]]){
 const run=new Function('page',`return (async()=>{${block}})()`);
 // Retained release trigger surface: neither result nor auto conversion exists before click.
 const manualPage=await b.newPage();await manualPage.setContent('<button>Convert</button><div class="hero-time"></div>');
 await manualPage.evaluate(()=>{(window as any).clicks=0;document.querySelector('button')!.addEventListener('click',()=>{(window as any).clicks++;document.querySelector('.hero-time')!.textContent='6:00 am';});});
 await run(manualPage);await expect(manualPage.locator('.hero-time')).toHaveText('6:00 am');expect(await manualPage.evaluate(()=>(window as any).clicks)).toBe(1);await manualPage.close();
 const livePage=await b.newPage();await livePage.goto('http://127.0.0.1:4252');await livePage.getByLabel('Convert to',{exact:true}).fill('UTC');await livePage.getByLabel('Convert to',{exact:true}).press('Tab');await livePage.locator('#message').fill('April 9, 2026 3pm in Tokyo');await run(livePage);await expect(livePage.locator('.hero-time')).toHaveText(/6:00 am/i);await livePage.close();
 results.push({branch,manual:'pass, conditional click exactly once',live:'pass, real candidate auto-conversion'});
}
await b.close();writeFileSync('/tmp/chronoshift-live-code/rollout-branches.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));
