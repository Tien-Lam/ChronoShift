import { chromium, expect } from '/Users/tien/Developer/ChronoShift/node_modules/@playwright/test/index.mjs';
import { writeFile } from 'node:fs/promises';
const browser = await chromium.launch();
const page = await browser.newPage({viewport: {width:280,height:844}, locale:'en-AU', timezoneId:'Australia/Sydney'});
const errors:string[]=[];
page.on('pageerror',error=>errors.push(error.message));
await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{value:{writeText:()=>Promise.reject(new Error('Review fallback'))}}));
const release = await (await page.request.get('http://127.0.0.1:4250/release.json')).json();
expect(release.sourceCommit).toBe('ba32383c5609f72a6fa551bbddd6b53df74bd80e');
await page.goto('http://127.0.0.1:4250/');
await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
const target=page.getByLabel('Convert to',{exact:true});
await target.fill('UTC'); await target.press('Tab');
const records:any[]=[];
for (const input of ['April 9, 2026','2026-04-09T15:00:30.123+02:00','April 9, 2026 3pm to 5pm UTC','July 15, 2026 3pm CST']) {
 await page.getByLabel('Message with a date or time').fill(input);
 await page.getByRole('button',{name:'Convert',exact:true}).click();
 await expect(page.locator('.result').first()).toBeVisible();
 if (input==='April 9, 2026') {
  await expect(page.locator('.hero-time')).toHaveCount(0);
  await expect(page.locator('.hero-date')).toHaveText('Thursday, 9 April 2026');
  await expect(page.locator('.result-zone')).toHaveText('Date only');
  await expect(page.locator('.assumption')).toHaveText('A date without a time cannot be shifted between timezones.');
 }
 if (input.startsWith('2026-')) await expect(page.locator('.hero-time')).toHaveText(/1:00:30[,.]123 pm/i);
 await page.getByRole('button',{name:/^Copy /}).first().click();
 await expect(page.getByLabel('Text to copy')).toBeVisible();
 records.push({input, manualCopy:await page.getByLabel('Text to copy').inputValue(), ...await page.evaluate(()=>({scrollWidth:document.documentElement.scrollWidth,width:innerWidth,groups:[...document.querySelectorAll('.result-group')].map(g=>({text:g.textContent, children:[...g.children].map(e=>e.className),outputs:[...g.querySelectorAll('.result-top')].map(e=>({children:[...e.children].map(x=>x.className),rect:e.getBoundingClientRect().toJSON()}))}))}))});
 expect(records.at(-1).scrollWidth).toBeLessThanOrEqual(280);
}
expect(errors).toEqual([]);
await writeFile('/tmp/chronoshift-result-code-probe.json',JSON.stringify({time:new Date().toISOString(),browser:browser.version(),release,errors,records},null,2));
console.log(JSON.stringify({browser:browser.version(), release, cases:records.length,errors}));
await browser.close();
