import {chromium} from '/Users/tien/Developer/ChronoShift/node_modules/playwright/index.mjs';
const browser=await chromium.launch({channel:'chrome',headless:true});
const ctx=await browser.newContext();
await ctx.addInitScript(()=>sessionStorage.setItem('chronoshift-detailed-logs','true'));
const page=await ctx.newPage();const cdp=await ctx.newCDPSession(page);let label='fresh';const logs:any[]=[];
page.on('console',async m=>{if(m.text().startsWith('[ChronoShift]'))logs.push({label,event:m.text(),fields:await m.args()[1]?.jsonValue()})});
async function snap(){return await page.evaluate(async()=>{const r=await navigator.serviceWorker.getRegistration();return {at:performance.now(),controller:navigator.serviceWorker.controller?.scriptURL||null,active:r?.active?.state,waiting:r?.waiting?.state,installing:r?.installing?.state,ready:document.querySelector('main')?.getAttribute('data-offline-ready'),warning:[...document.querySelectorAll('.message.warning')].map(e=>e.textContent)}})}
const results:any={browser:browser.version(),cases:[]};
await page.goto('https://tien-lam.github.io/ChronoShift/');await page.waitForFunction(()=>document.querySelector('main')?.getAttribute('data-offline-ready')==='true');results.cases.push({label,snapshot:await snap()});
results.release=await (await ctx.request.get('https://tien-lam.github.io/ChronoShift/release.json')).json();
label='CDP Page.reload ignoreCache true';await cdp.send('Page.reload',{ignoreCache:true});await page.waitForTimeout(12000);
await page.getByLabel('Convert to',{exact:true}).fill('Europe/London');await page.getByLabel('Convert to',{exact:true}).press('Tab');await page.waitForTimeout(1000);
await page.getByLabel('Message with a date or time').fill('June 18, 2026 at 5:20pm Tokyo');await page.getByRole('button',{name:'Convert',exact:true}).click();await page.waitForTimeout(4000);
results.cases.push({label,snapshot:await snap(),result:await page.locator('.hero-time').textContent()});await page.screenshot({path:'/tmp/chronoshift-uncontrolled-adversarial-hosted-before.png',fullPage:true});
label='CDP Network.setBypassServiceWorker true';await cdp.send('Network.setBypassServiceWorker',{bypass:true});await page.reload();await page.waitForTimeout(17000);results.cases.push({label,snapshot:await snap()});
label='bypass disabled and normal reload';await cdp.send('Network.setBypassServiceWorker',{bypass:false});await page.reload();await page.waitForTimeout(1000);results.cases.push({label,snapshot:await snap()});results.logs=logs;
await Bun.write('/tmp/chronoshift-uncontrolled-adversarial-hosted-before.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));await browser.close();
