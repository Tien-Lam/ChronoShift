import { chromium, firefox, webkit, expect } from '@playwright/test';
import { resolve, extname } from 'node:path';
import { writeFile } from 'node:fs/promises';
import { PREVIEW_CSP } from '../../../../scripts/csp';
import { enterReferenceDate, enterZone, choose } from '../../../../e2e/choices';

// Run only after root releases the serial measurement window. No build occurs.
const output = resolve(import.meta.dir);
const artifact = process.env.REVIEW_DIST;
if (!artifact) throw new Error('REVIEW_DIST must name the frozen candidate inventory');
const root = resolve(artifact);
const base = process.env.REVIEW_BASE || '/';
const mime: Record<string,string> = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.webmanifest':'application/manifest+json'};
const observations: any[] = [];
const run = {started: new Date().toISOString(), artifact: root, base, port:4311, motion:'no-preference', locale:'en-AU', timezone:'Australia/Sydney', observations};
for (const [name, engine] of [['chromium',chromium],['firefox',firefox],['webkit',webkit]] as const) {
  const server = Bun.serve({hostname:'127.0.0.1',port:4311,async fetch(req) {
    const url = new URL(req.url);
    const relative = url.pathname.slice(base.length) || 'index.html';
    const path = resolve(root,relative);
    if (!url.pathname.startsWith(base) || !path.startsWith(root+'/') || !['GET','HEAD'].includes(req.method)) return new Response('Not found',{status:404});
    const file = Bun.file(path);
    if (!(await file.exists())) return new Response('Not found',{status:404});
    return new Response(req.method === 'HEAD' ? null : file,{headers:{'Content-Type':mime[extname(path)] || 'application/octet-stream','Content-Security-Policy':PREVIEW_CSP,'Cache-Control':'no-cache'}});
  }});
  const origin = `http://127.0.0.1:4311${base}`;
  const browser = await engine.launch();
  const context = await browser.newContext({viewport:{width:900,height:640},deviceScaleFactor:1,locale:'en-AU',timezoneId:'Australia/Sydney',reducedMotion:'no-preference'});
  const record: any = {name,origin,version:browser.version(),started:new Date().toISOString(), errors:[],requests:[],steps:[]};
  observations.push(record);
  await context.tracing.start({screenshots:true,snapshots:true,sources:true});
  const page = await context.newPage();
  page.on('pageerror', error => record.errors.push({kind:'pageerror',message:error.message}));
  page.on('console', message => {if (message.type()==='error') record.errors.push({kind:'console',message:message.text()});});
  page.on('request', req => record.requests.push({url:req.url(),method:req.method()}));
  try {
    for (const key of ['Enter','Space']) {
      await page.goto(origin);
      await expect(page.locator('#source-zone')).toHaveCount(0);
      const summary = page.locator('.options > summary');
      await summary.focus();
      // There is intentionally no locator wait, sleep, or refocus after open.
      await page.keyboard.press(key);
      await page.keyboard.press('Tab');
      await page.keyboard.type('UTC');
      const immediate = await page.evaluate(() => ({active:document.activeElement?.id,value:(document.querySelector('#source-zone') as HTMLInputElement)?.value,open:(document.querySelector('.options') as HTMLDetailsElement).open}));
      expect(immediate).toEqual({active:'source-zone',value:'UTC',open:true});
      await page.keyboard.press('Tab');
      await expect(page.locator('#source-zone')).toHaveValue('UTC');
      record.steps.push({journey:`first-${key}-Tab-typing`,time:new Date().toISOString(),immediate});
    }
    await page.locator('#message').fill('April 9, 2026 3pm');
    await enterZone(page,'UTC');
    await choose(page,'Time display','24');
    await expect(page.locator('.hero-time')).toHaveText('15:00');
    await page.evaluate(() => { (window as any).originalSource = document.querySelector('#source-zone'); (window as any).originalDate = document.querySelector('#reference-date'); });
    const summary = page.locator('.options > summary');
    await summary.focus();
    for(let n=0;n<6;n++) await page.keyboard.press('Enter');
    await expect(page.locator('.options')).toHaveAttribute('open','');
    expect(await page.evaluate(() => (window as any).originalSource===document.querySelector('#source-zone') && (window as any).originalDate===document.querySelector('#reference-date'))).toBe(true);
    // Deliberate coalesced DOM control, separate from native key journeys.
    await page.evaluate(() => {const details=document.querySelector('.options') as HTMLDetailsElement;details.open=false;details.open=true;details.open=false;details.open=true;});
    await expect(page.locator('#source-zone')).toBeVisible();
    await enterReferenceDate(page,'2026-04-09');
    await page.locator('#message').fill('Tomorrow at 3pm');
    await expect(page.locator('.result-date')).toHaveText(/10 Apr(?:il)? 2026/);
    const day = page.locator('#reference-date [data-type="day"]');
    await day.click(); await day.press('Backspace');
    await summary.click();
    await page.locator('#message').fill('Tomorrow at 4pm');
    await expect(page.getByRole('alert')).toHaveText('Complete or clear the reference date to continue.');
    await expect(page.locator('.result')).toHaveCount(0);
    await page.setViewportSize({width:280,height:844});
    await summary.click();
    await expect(day).toHaveAttribute('data-placeholder','true');
    await expect(page.locator('#reference-date [data-type="year"]')).toHaveAttribute('aria-valuenow','2026');
    await expect(page.locator('#source-zone')).toHaveValue('UTC');
    expect(await page.evaluate(() => (window as any).originalDate===document.querySelector('#reference-date'))).toBe(true);
    await page.screenshot({path:resolve(output,`${name}-partial-dark-280.png`),fullPage:true});
    await enterReferenceDate(page,'2026-04-09');
    await expect(page.locator('.hero-time')).toHaveText('16:00');
    await expect(page.locator('.result-date')).toHaveText(/10 Apr(?:il)? 2026/);
    await page.getByRole('button',{name:/^Choose reference date/}).click();
    await expect(page.locator('.calendar-popover')).toBeVisible();
    record.calendar = await page.locator('.calendar-popover').evaluate(el => {const a=el.getBoundingClientRect(),b=el.querySelector('.calendar-grid')!.getBoundingClientRect();return {popover:{x:a.x,y:a.y,width:a.width,height:a.height},grid:{x:b.x,y:b.y,width:b.width,height:b.height},viewport:{width:innerWidth,height:innerHeight}};});
    await page.screenshot({path:resolve(output,`${name}-calendar-dark-280.png`),fullPage:true});
    await page.keyboard.press('Escape');
    await day.click();await day.press('Backspace');
    await expect(page.getByRole('alert')).toHaveText('Complete or clear the reference date to continue.');
    await page.getByRole('button',{name:'Reset preferences',exact:true}).click();
    for(const type of ['year','month','day']) await expect(page.locator(`#reference-date [data-type="${type}"]`)).toHaveAttribute('data-placeholder','true');
    await page.locator('#message').fill('April 9, 2026 3pm UTC');
    await expect(page.locator('.hero-time')).toBeVisible();
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.locator('#source-zone')).toHaveValue('');
    record.steps.push({journey:'rapid-toggle-partial-date-close-resize-reopen-reset',time:new Date().toISOString(),sameNode:true});
    await page.setViewportSize({width:900,height:640});
    await enterZone(page,'UTC');
    await enterZone(page,'Asia/Tokyo','Source timezone when none is given');
    await choose(page,'Numeric dates','dmy');
    await choose(page,'Time display','24');
    await page.reload();
    await expect(page.locator('#source-zone')).toHaveCount(0);
    await page.locator('#message').fill('04/09/2026 3pm');
    await expect(page.locator('.hero-time')).toHaveText('06:00');
    await expect(page.locator('.result-date')).toHaveText(/4 Sep(?:t(?:ember)?)? 2026/);
    await expect(page.locator('main')).toHaveAttribute('data-offline-ready','true');
    record.beforeOffline = await page.evaluate(async () => ({controller:navigator.serviceWorker.controller?.scriptURL, registration:!!(await navigator.serviceWorker.getRegistration()),storage:Object.keys(localStorage),assets:performance.getEntriesByType('resource').map((entry:any)=>entry.name)}));
    await page.close();
    server.stop(true);
    let rejected = false;try {await context.request.get(origin+'uncached',{timeout:2000});}catch {rejected=true;}expect(rejected).toBe(true);
    const reopened = await context.newPage();
    await reopened.goto(origin);
    await expect(reopened.locator('#source-zone')).toHaveCount(0);
    await reopened.locator('#message').fill('04/09/2026 4pm');
    await expect(reopened.locator('.hero-time')).toHaveText('07:00');
    await expect(reopened.locator('.result-date')).toHaveText(/4 Sep(?:t(?:ember)?)? 2026/);
    await reopened.locator('.options > summary').click();
    await expect(reopened.locator('#source-zone')).toHaveValue('Asia/Tokyo');
    record.steps.push({journey:'persisted-prefs-unopened-reload-stopped-origin-offline-reopen',time:new Date().toISOString(),uncachedRejected:rejected});
    record.status='pass';
  } catch(error) {
    record.status='fail';record.failure=String(error);await page.screenshot({path:resolve(output,`${name}-failure.png`),fullPage:true}).catch(()=>{});
  } finally {
    record.ended=new Date().toISOString();
    await context.tracing.stop({path:resolve(output,`${name}-trace.zip`)});
    await context.close();await browser.close();server.stop(true);
    await writeFile(resolve(output,'journeys.json'),JSON.stringify({...run,ended:new Date().toISOString()},null,2));
  }
}
if(observations.some(record => record.status !== 'pass')) process.exitCode=1;
