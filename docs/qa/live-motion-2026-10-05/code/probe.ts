import { chromium, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const output = new URL('./', import.meta.url).pathname;
const browser = await chromium.launch();
const results: any[] = [];
const began = new Date().toISOString();
const A = 'April 9, 2026 at 3pm UTC';
const B = 'April 10, 2026 at 6pm UTC';
async function state(page: Page) {
  return page.evaluate(() => {
    const indicator = document.querySelector('.live-indicator');
    return {
      state: indicator?.getAttribute('data-state'),
      label: indicator?.textContent?.trim(),
      busy: document.querySelector('.result-panel')?.getAttribute('aria-busy'),
      results: [...document.querySelectorAll('.result')].map(el => el.textContent),
      errors: [...document.querySelectorAll('.error')].map(el => el.textContent),
      text: (document.querySelector('#message') as HTMLTextAreaElement).value,
      telemetry: (window as any).__review.events,
    };
  });
}
async function ready(page: Page, original: string) {
  await expect(page.locator('.live-indicator')).toHaveAttribute('data-state', 'ready');
  await expect(page.locator('.result-source')).toContainText(original);
  await expect(page.locator('.copy-button')).toHaveCount(1);
}
async function pending(page: Page) {
  await expect(page.locator('.live-indicator')).toHaveAttribute('data-state', 'pending', { timeout: 150 });
  await expect(page.locator('.result-panel')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('.copy-button')).toHaveCount(0);
}
async function setMode(page: Page, changes: any) {
  await page.evaluate(changes => Object.assign((window as any).__review, changes), changes);
}
async function waitNative(page: Page, count: number) {
  await page.waitForFunction(count => (window as any).__review.events.filter((event: any) => event.kind === 'native-complete').length >= count, count);
}
async function run(name: string, fn: (page: Page) => Promise<any>, options: any = {}) {
  if (process.env.REVIEW_CASE && name !== process.env.REVIEW_CASE) return;
  const context = await browser.newContext({ locale:'en-AU', timezoneId:'Australia/Sydney', viewport:{width:1000,height:900}, ...options });
  const errors: string[] = [];
  await context.addInitScript(() => {
    const state = (window as any).__review = {delayMs:0, mode:'normal', events:[], pasteValue:'', pasteDelay:0};
    localStorage.setItem('chronoshift.preferences.v1', JSON.stringify({target:'UTC',source:'UTC',hourCycle:'24',dateOrder:'mdy',theme:'dark'}));
    const Native = window.Worker;
    window.Worker = new Proxy(Native, { construct(Target, args) {
      if (state.mode === 'constructor') throw new Error('deliberate review constructor failure');
      const worker = Reflect.construct(Target, args) as Worker;
      let handler: any, errorHandler: any;
      Object.defineProperty(worker, 'onmessage', { configurable:true, get:()=>handler, set(value) { handler=value; } });
      Object.defineProperty(worker, 'onerror', { configurable:true, get:()=>errorHandler, set(value) { errorHandler=value; } });
      worker.addEventListener('message', event => {
        const callback = handler;
        const delay = state.delayMs;
        state.events.push({kind:'native-complete',at:performance.now(),id:event.data.id,delay});
        setTimeout(() => { state.events.push({kind:'delivered',at:performance.now(),id:event.data.id}); callback?.(event); }, delay);
      });
      worker.addEventListener('error', event => errorHandler?.(event));
      const post = worker.postMessage.bind(worker), terminate = worker.terminate.bind(worker);
      worker.postMessage = (data: any) => {
        state.events.push({kind:'posted',at:performance.now(),id:data.id,text:data.text,target:data.options.targetZone});
        if (state.mode === 'worker-error') setTimeout(() => errorHandler?.(new Event('error')), 20);
        else post(data);
      };
      worker.terminate = () => { state.events.push({kind:'terminated',at:performance.now()}); terminate(); };
      return worker;
    } });
    Object.defineProperty(navigator, 'clipboard', { configurable:true, value:{
      readText:()=>new Promise(resolve=>setTimeout(()=>resolve(state.pasteValue),state.pasteDelay)),
      writeText:async (value:string)=>{state.events.push({kind:'copied',value});},
    } });
    document.addEventListener('input', event => {
      if ((event.target as HTMLElement)?.id === 'message') state.events.push({kind:'input',at:performance.now()});
    }, true);
    new MutationObserver(() => {
      const indicator = document.querySelector('.live-indicator');
      const next = indicator?.getAttribute('data-state');
      if (next && next !== state.lastState) {
        state.lastState=next;
        state.events.push({kind:'state',state:next,at:performance.now()});
      }
    }).observe(document, {subtree:true,childList:true,attributes:true,attributeFilter:['data-state']});
  });
  const page = await context.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', event => {if (event.type() === 'error') errors.push(event.text());});
  const started = new Date().toISOString();
  try {
    await page.goto('http://127.0.0.1:4252/');
    await expect(page.locator('#message')).toBeVisible();
    const evidence = await fn(page);
    results.push({name,passed:true,started,ended:new Date().toISOString(),evidence,errors});
  } catch (error) {
    results.push({name,passed:false,started,ended:new Date().toISOString(),error:String(error),state:await state(page).catch(()=>null),errors});
    await page.screenshot({path:output+name.replaceAll(/[^a-z0-9]/gi,'-')+'.png',fullPage:true});
  }
  await context.close();
}
await run('debounce-worker-idle-phases', async page => {
  await setMode(page,{delayMs:500});
  await page.locator('#message').fill(A);
  await pending(page);
  const immediate = await state(page);
  await page.waitForTimeout(150);
  const debounce = await state(page);
  if (debounce.telemetry.some((event:any)=>event.kind==='posted')) throw new Error('worker posted before 250ms debounce');
  await waitNative(page,1);
  const working = await state(page);
  if (working.state!=='pending') throw new Error('worker delay did not retain pending');
  await ready(page,A);
  const completed = await state(page);
  await page.locator('#message').fill('   ');
  await expect(page.locator('.live-indicator')).toHaveAttribute('data-state','idle');
  await expect(page.locator('.copy-button')).toHaveCount(0);
  await page.waitForTimeout(350);
  return {immediate,debounce,working,completed,whitespace:await state(page)};
});
await run('retained-stale-success-latest-owner', async page => {
  await setMode(page,{delayMs:1000});
  await page.locator('#message').fill(A); await waitNative(page,1);
  await setMode(page,{delayMs:0});
  await page.locator('#message').fill(B); await pending(page); await ready(page,B);
  await page.waitForTimeout(1100); await ready(page,B);
  return state(page);
});
await run('clear-cancels-retained-completion', async page => {
  await setMode(page,{delayMs:800});
  await page.locator('#message').fill(A); await waitNative(page,1);
  await page.getByRole('button',{name:'Clear',exact:true}).click();
  await expect(page.locator('.live-indicator')).toHaveAttribute('data-state','idle');
  await page.waitForTimeout(1000);
  await expect(page.locator('.copy-button')).toHaveCount(0);
  return state(page);
});
await run('composition-pause-cancel-recover', async page => {
  await setMode(page,{delayMs:600});
  await page.locator('#message').fill(A); await waitNative(page,1);
  await page.locator('#message').dispatchEvent('compositionstart');
  await expect(page.locator('.live-indicator')).toHaveAttribute('data-state','paused');
  await page.locator('#message').fill(B);
  await page.waitForTimeout(900);
  const paused = await state(page);
  if(paused.state!=='paused'||paused.results.length)throw new Error('conversion ran during composition');
  await setMode(page,{delayMs:0});
  await page.locator('#message').dispatchEvent('compositionend');
  await pending(page); await ready(page,B);
  return {paused,recovered:await state(page)};
});
await run('validation-and-worker-error-recovery', async page => {
  const journeys:any[]=[];
  await page.locator('#message').fill('x'.repeat(10001)); await pending(page);
  await expect(page.locator('.error')).toContainText('under 10,000'); journeys.push(await state(page));
  await page.locator('#message').fill('no timestamp here'); await pending(page);
  await expect(page.locator('.error')).toContainText('No timestamp found'); journeys.push(await state(page));
  await setMode(page,{mode:'constructor'}); await page.locator('#message').fill(A); await pending(page);
  await expect(page.locator('.error')).toContainText('could not start'); journeys.push(await state(page));
  await setMode(page,{mode:'worker-error'}); await page.locator('#message').fill(B); await pending(page);
  await expect(page.locator('.error')).toContainText('Could not convert'); journeys.push(await state(page));
  await setMode(page,{mode:'normal'}); await page.locator('#message').fill(A); await ready(page,A);
  journeys.push(await state(page)); return journeys;
});
await run('invalid-zone-cancels-and-recovers', async page => {
  await setMode(page,{delayMs:800}); await page.locator('#message').fill(A); await waitNative(page,1);
  await page.locator('#target-zone').fill('NotARealTimezone'); await pending(page);
  await expect(page.locator('.error')).toContainText('Choose a timezone');
  await page.waitForTimeout(1000); const invalid = await state(page);
  if(invalid.state!=='error'||invalid.results.length||invalid.busy!=='false')throw new Error('invalid target pending/results leaked');
  await setMode(page,{delayMs:0}); await page.locator('#target-zone').fill('UTC');
  await pending(page); await ready(page,A); return {invalid,recovered:await state(page)};
});
await run('clipboard-conflict-explicit-replacement', async page => {
  await page.locator('#message').fill(A); await ready(page,A);
  await setMode(page,{pasteValue:B,pasteDelay:700});
  await page.getByRole('button',{name:'Paste',exact:true}).click();
  await page.locator('#message').fill('April 11, 2026 at 9pm UTC');
  await ready(page,'April 11, 2026 at 9pm UTC');
  await expect(page.locator('.import-choice')).toBeVisible();
  const preserved = await state(page);
  await page.getByRole('button',{name:'Replace with imported text'}).click();
  await pending(page); await ready(page,B); return {preserved,replaced:await state(page)};
});
await run('partial-reference-date-and-reset', async page => {
  await page.locator('#message').fill(A); await ready(page,A);
  await page.getByText('More options',{exact:true}).click();
  const day = page.locator('#reference-date [data-type="day"]');
  await day.click();
  await day.press('9');
  await expect(page.locator('.error')).toContainText('Complete or clear the reference date');
  const partial = await state(page);
  await page.getByRole('button',{name:'Reset preferences'}).click();
  await pending(page);
  await expect(page.locator('.live-indicator')).toHaveAttribute('data-state','ready');
  await expect(page.locator('.copy-button')).toHaveCount(1);
  return {partial,recovered:await state(page)};
});
await run('reduced-motion-pseudo-elements', async page => {
  await setMode(page,{delayMs:400}); await page.locator('#message').fill(A); await pending(page);
  const active = await page.evaluate(() => ({
    label:document.querySelector('.live-indicator')?.textContent,
    animations:[...document.querySelectorAll('*')].flatMap(el=>[null,'::before','::after'].map(pseudo=>{
      const style=getComputedStyle(el,pseudo);return {tag:el.tagName,cls:el.className,pseudo,animation:style.animationName,transition:style.transitionDuration,transform:style.transform};
    })).filter(item=>item.animation!=='none'||item.transition.split(',').some(value=>parseFloat(value)>0)),
  }));
  if(active.animations.length)throw new Error('movement persists under reduced motion '+JSON.stringify(active.animations));
  await ready(page,A); await page.screenshot({path:output+'reduced-motion-ready.png',fullPage:true});
  return {active,ready:await state(page)};
},{reducedMotion:'reduce'});
const environment = {browser:await browser.version(),platform:process.platform,arch:process.arch,began,ended:new Date().toISOString()};
await browser.close();
await writeFile(output+(process.env.REVIEW_CASE ? 'probe-'+process.env.REVIEW_CASE+'-results.json' : 'probe-results.json'),JSON.stringify({environment,results},null,2));
console.log(JSON.stringify({environment,results:results.map(({name,passed,error,errors})=>({name,passed,error,errors}))},null,2));
if(results.some(result=>!result.passed))process.exitCode=1;
