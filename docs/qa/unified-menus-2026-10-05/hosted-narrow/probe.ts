import { chromium, expect } from '/Users/tien/Developer/ChronoShift/node_modules/@playwright/test/index.mjs';
import { choose, enterZone } from '/Users/tien/Developer/ChronoShift/e2e/choices.ts';
import { writeFile } from 'node:fs/promises';
const directory = '/tmp/chronoshift-menu-hosted-narrow';
const expected = '1ef1aa07b3e3a2d7cf657150fc6083aa8987699b';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: {width: 280, height: 960}, deviceScaleFactor: 1, locale:'en-AU', timezoneId:'Australia/Sydney' });
const page = await context.newPage();
const errors: string[] = [];
const requests: string[] = [];
page.on('pageerror', error => errors.push(`pageerror: ${error.message}`));
page.on('console', message => { if(message.type()==='error') errors.push(`console: ${message.text()}`); });
context.on('request', request => requests.push(request.url()));
await page.addInitScript(() => {
  (window as any).__normalCsp = [];
  document.addEventListener('securitypolicyviolation', e => (window as any).__normalCsp.push({directive:e.effectiveDirective,blockedURI:e.blockedURI}));
});
const observations: any = { expectedRelease: expected, browser: await browser.version(), conditions: {viewport:{width:280,height:960},deviceScaleFactor:1,locale:'en-AU',timezone:'Australia/Sydney',physicalDevice:false,online:true}, startedAt: new Date().toISOString(), states: [] };
try {
  await page.goto('https://tien-lam.github.io/ChronoShift/');
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  observations.releaseBefore = await page.evaluate(async () => (await fetch('release.json',{cache:'no-store'})).json());
  expect(observations.releaseBefore.sourceCommit).toBe(expected);
  expect(observations.releaseBefore.base).toBe('/ChronoShift/');
  observations.actualViewport = await page.evaluate(() => ({innerWidth,innerHeight,clientWidth:document.documentElement.clientWidth}));
  expect(observations.actualViewport.innerWidth).toBe(280);
  const draft = 'April 9, 2026 3pm UTC';
  await page.getByLabel('Message with a date or time').fill(draft);
  await enterZone(page,'Pacific/Chatham');
  await page.getByRole('button',{name:'Convert',exact:true}).click();
  const priorResult = await page.locator('.hero-time').innerText();
  await page.getByText('More options',{exact:true}).click();
  await page.getByLabel('Appearance',{exact:true}).click();
  for(const theme of ['dark','light']) {
    await choose(page,'Theme',theme);
    await expect(page.locator('html')).toHaveAttribute('data-theme',theme);
    const fields = await page.evaluate(() => ['theme','target-zone','source-zone','reference-date','date-order','time-format'].map(id => {
      const element=document.getElementById(id)!;
      const css=getComputedStyle(element.querySelector('.date-input')||element);
      const rect=element.getBoundingClientRect();
      const label=(id==='reference-date'?element.closest('.date-choice')!.querySelector('.date-choice-label')!:document.querySelector(`label[for="${id}"]`)! ).getBoundingClientRect();
      return {id,x:rect.x,width:rect.width,height:rect.height,labelDelta:rect.x-label.x,font:css.fontSize,lineHeight:css.lineHeight,inset:css.paddingInlineStart};
    }));
    for(const f of fields) { expect(f.height).toBe(44);expect(f.labelDelta).toBe(0);expect(f.font).toBe('16px');expect(f.lineHeight).toBe('24px');expect(f.inset).toBe('12px'); }
    let themeBackground: string|undefined;
    for(const control of ['theme','date-order','time-format','target-zone','source-zone','reference-date']) {
      const field = page.locator(`#${control}`);
      if(control==='target-zone') await page.getByRole('button',{name:'Show target timezones',exact:true}).click();
      else if(control==='source-zone') await page.getByRole('button',{name:'Show source timezones',exact:true}).click();
      else if(control==='reference-date') await page.getByRole('button',{name:/^Choose reference date/}).click();
      else await field.click();
      const popup=page.locator('.choice-popover:visible');
      await expect(popup).toBeVisible();
      await expect.poll(async () => { const b=await popup.boundingBox(); return !!b&&b.x>=0&&b.x+b.width<=281; }).toBe(true);
      const bounds=(await popup.boundingBox())!;
      const fieldBounds=(await field.boundingBox())!;
      expect(bounds.y).toBeGreaterThanOrEqual(0);expect(bounds.y+bounds.height).toBeLessThanOrEqual(961);
      const alignedLeft=Math.max(12,Math.min(fieldBounds.x,280-bounds.width-12));
      expect(Math.abs(bounds.x-alignedLeft)).toBeLessThanOrEqual(1);
      if(control==='reference-date') {expect(bounds.width).toBeLessThanOrEqual(302);await expect(page.getByRole('grid')).toBeVisible();}
      else {expect(Math.abs(bounds.width-Math.min(fieldBounds.width,256))).toBeLessThanOrEqual(1);await expect(page.getByRole('listbox')).toBeVisible();}
      const style=await popup.evaluate(element => {const css=getComputedStyle(element);return {background:css.backgroundColor,border:css.borderTopWidth,radius:css.borderTopLeftRadius,scrollWidth:element.scrollWidth,clientWidth:element.clientWidth};});
      expect(style.border).toBe('1px');expect(parseFloat(style.radius)).toBeGreaterThanOrEqual(8);expect(style.scrollWidth).toBeLessThanOrEqual(style.clientWidth);
      if(control==='theme')themeBackground=style.background;
      expect(style.background).toBe(themeBackground);
      let selectedChatham:any;
      if(control==='target-zone') {
        const selected=page.locator('[role="option"][data-value="Pacific/Chatham"]');
        await expect(selected).toHaveAttribute('aria-selected','true');
        selectedChatham={selected:await selected.getAttribute('aria-selected'),bounds:await selected.boundingBox()};
        expect(selectedChatham.bounds.y).toBeGreaterThanOrEqual(bounds.y);
        expect(selectedChatham.bounds.y+selectedChatham.bounds.height).toBeLessThanOrEqual(bounds.y+bounds.height);
      }
      const screenshot=`${theme}-280-${control}.png`;
      await page.screenshot({path:`${directory}/${screenshot}`});
      observations.states.push({theme,control,actualWidth:await page.evaluate(()=>innerWidth),fields,bounds,fieldBounds,alignedLeft,style,selectedChatham,screenshot});
      await page.keyboard.press('Escape');
      await expect(page.locator('.choice-popover:visible')).toHaveCount(0);
      await expect(page.getByLabel('Message with a date or time')).toHaveValue(draft);
      await expect(page.locator('.hero-time')).toHaveText(priorResult);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    }
  }
  // Confirm deep selected-item arrow reentry survives a subsequent real reopen.
  await page.getByRole('button',{name:'Show target timezones',exact:true}).click();
  await expect(page.locator('[role="option"][data-value="Pacific/Chatham"]')).toHaveAttribute('aria-selected','true');
  await expect(page.locator('.choice-popover:visible')).toBeVisible();
  await page.keyboard.press('Escape');
  observations.selectedReentry={input:await page.locator('#target-zone').inputValue(),popupRemainedOpen:true};
  await enterZone(page,'UTC');
  const unseen='August 20, 2027 3pm in Tokyo';
  await page.getByLabel('Message with a date or time').fill(unseen);
  await page.getByRole('button',{name:'Convert',exact:true}).click();
  await expect(page.locator('.hero-time')).toHaveText(/6:00 am/i);
  await expect(page.locator('.result-date')).toHaveText(/20 Aug(?:ust)? 2027/);
  const freshResult=await page.locator('.hero-time').innerText();
  observations.conversion={input:unseen,target:'UTC',result:freshResult,date:await page.locator('.result-date').innerText()};
  observations.resize=[];
  for(const width of [1280,280]) {
    await page.setViewportSize({width,height:960});
    expect(await page.evaluate(()=>innerWidth)).toBe(width);
    await expect(page.getByLabel('Message with a date or time')).toHaveValue(unseen);
    await expect(page.locator('.hero-time')).toHaveText(freshResult);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    observations.resize.push({width,draftPreserved:true,resultPreserved:true});
  }
  observations.releaseAfter=await page.evaluate(async()=>(await fetch('release.json',{cache:'no-store'})).json());
  expect(observations.releaseAfter.sourceCommit).toBe(expected);
  observations.normalCsp=await page.evaluate(()=>(window as any).__normalCsp);
  observations.errors=errors;
  expect(observations.normalCsp).toEqual([]);expect(errors).toEqual([]);
  observations.firstPartyOnly=requests.every(url=>url.startsWith('https://tien-lam.github.io/ChronoShift/'));
  expect(observations.firstPartyOnly).toBe(true);
  observations.passed=true;
} catch(error) { observations.passed=false;observations.failure=String(error);observations.errors=errors;observations.normalCsp=await page.evaluate(()=>(window as any).__normalCsp).catch(()=>null);throw error; }
finally { observations.finishedAt=new Date().toISOString(); await writeFile(`${directory}/observations.json`,JSON.stringify(observations,null,2)); await browser.close(); }
console.log(JSON.stringify({passed:observations.passed,states:observations.states.length,release:observations.releaseAfter.sourceCommit,browser:observations.browser,normalErrors:observations.errors,normalCsp:observations.normalCsp,actualViewport:observations.actualViewport}));
