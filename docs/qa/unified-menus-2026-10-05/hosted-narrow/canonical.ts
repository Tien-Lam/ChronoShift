import { chromium,expect } from '/Users/tien/Developer/ChronoShift/node_modules/@playwright/test/index.mjs';
import { choose } from '/Users/tien/Developer/ChronoShift/e2e/choices.ts';
import { writeFile } from 'node:fs/promises';
const root='/tmp/chronoshift-menu-hosted-narrow';
const expected='1ef1aa07b3e3a2d7cf657150fc6083aa8987699b';
const browser=await chromium.launch();
const context=await browser.newContext({viewport:{width:280,height:960},deviceScaleFactor:1,locale:'en-AU',timezoneId:'Australia/Sydney'});
const page=await context.newPage();
const errors:string[]=[];
page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));
page.on('console',e=>{if(e.type()==='error')errors.push(`console: ${e.text()}`);});
await page.addInitScript(()=>{(window as any).__normalCsp=[];document.addEventListener('securitypolicyviolation',e=>(window as any).__normalCsp.push({directive:e.effectiveDirective,blockedURI:e.blockedURI}));});
const report:any={expectedRelease:expected,browser:await browser.version(),physicalDevice:false,viewport:{width:280,height:960},screenshotDuringTimedPopupPhase:false,startedAt:new Date().toISOString(),states:[]};
try{
await page.goto('https://tien-lam.github.io/ChronoShift/');
await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
report.releaseBefore=await page.evaluate(async()=>(await fetch('release.json',{cache:'no-store'})).json());expect(report.releaseBefore.sourceCommit).toBe(expected);
await page.getByText('More options',{exact:true}).click();
await page.getByLabel('Appearance',{exact:true}).click();
await page.getByLabel('Message with a date or time').fill('August 20, 2027 3pm in Tokyo');
for(const theme of ['light','dark']){
  await choose(page,'Theme',theme);
  const target=page.getByLabel('Convert to',{exact:true});
  await target.fill('Chatham');
  const option=page.locator('[role="option"][data-value="Pacific/Chatham"]');
  await expect(option).toBeVisible();await option.click();
  await expect(target).toHaveValue('Pacific/Chatham');
  await expect(page.locator('.choice-popover:visible')).toHaveCount(0);
  await page.waitForTimeout(3000);
  await expect(target).toHaveValue('Pacific/Chatham');
  await page.getByRole('button',{name:'Show target timezones',exact:true}).click();
  await expect(page.locator('.choice-popover:visible')).toBeVisible();
  await expect(option).toHaveAttribute('aria-selected','true');
  const before=await page.locator('.choice-popover:visible').boundingBox();
  await page.waitForTimeout(3000);
  await expect(page.locator('.choice-popover:visible')).toBeVisible();
  await expect(option).toHaveAttribute('aria-selected','true');
  const after=await page.locator('.choice-popover:visible').boundingBox();
  await page.locator('.convert-button').click();
  await expect(page.locator('.choice-popover:visible')).toHaveCount(0);
  await expect(page.locator('.hero-time')).toHaveText(/6:45 pm/i);
  await expect(page.locator('.result-date')).toHaveText(/20 Aug(?:ust)? 2027/);
  report.states.push({theme,typed:'Chatham',selected:'Pacific/Chatham',waitAfterSelectionMs:3000,waitAfterArrowMs:3000,remainedOpen:true,before,after,actualInnerWidth:await page.evaluate(()=>innerWidth),result:await page.locator('.hero-time').innerText(),date:await page.locator('.result-date').innerText()});
  // Capture only after the timed open-menu acceptance and Convert assertions.
  await page.screenshot({path:`${root}/${theme}-canonical-after-convert.png`});
}
report.releaseAfter=await page.evaluate(async()=>(await fetch('release.json',{cache:'no-store'})).json());expect(report.releaseAfter.sourceCommit).toBe(expected);
report.errors=errors;report.normalCsp=await page.evaluate(()=>(window as any).__normalCsp);expect(errors).toEqual([]);expect(report.normalCsp).toEqual([]);report.passed=true;
}catch(e){report.passed=false;report.failure=String(e);report.errors=errors;report.normalCsp=await page.evaluate(()=>(window as any).__normalCsp).catch(()=>null);throw e;}
finally{report.finishedAt=new Date().toISOString();await writeFile(`${root}/canonical-observations.json`,JSON.stringify(report,null,2));await browser.close();}
console.log(JSON.stringify({passed:report.passed,states:report.states.length,normalErrors:report.errors,normalCsp:report.normalCsp,release:report.releaseAfter.sourceCommit}));
