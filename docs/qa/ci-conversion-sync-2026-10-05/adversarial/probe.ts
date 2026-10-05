import { chromium, firefox, webkit, expect, type Page } from "@playwright/test";
import { fillSuccessfulConversion } from "../../../../e2e/conversion";

const directory = "docs/qa/ci-conversion-sync-2026-10-05/adversarial";
const origin = "http://127.0.0.1:4324/";
const start = new Date().toISOString();
const rows: any[] = [];
const errors: any[] = [];
async function record(engine: string, name: string, run: () => Promise<any>) {
  const startedAt = new Date().toISOString(), started = performance.now();
  try {
    const detail = await run();
    rows.push({ engine, name, outcome: "pass", startedAt, endedAt: new Date().toISOString(), elapsedMs: performance.now()-started, detail });
  } catch (error) {
    rows.push({ engine, name, outcome: "fail", startedAt, endedAt: new Date().toISOString(), elapsedMs: performance.now()-started, error: String(error) });
  }
  await Bun.write(`${directory}/raw.json`, JSON.stringify({ startedAt: start, endedAt: new Date().toISOString(), rows, errors }, null, 2));
  console.log(JSON.stringify(rows.at(-1)));
}
async function synthetic(page: Page, behavior: string, delay = 0) {
  await page.setContent('<label for="message">Message with a date or time</label><textarea id="message"></textarea><section class="result-panel" aria-busy="false"><span class="live-indicator" data-state="ready"></span><b class="hero-time">old</b></section>');
  await page.evaluate(({behavior, delay}) => {
    const native = MutationObserver;
    const active = new Set<MutationObserver>();
    const counts = { input: 0, pagehide: 0 };
    const input = document.querySelector<HTMLTextAreaElement>('#message')!;
    const panel = document.querySelector('.result-panel')!;
    (window as any).__reviewResources = { active, counts };
    window.MutationObserver = class extends native {
      observe(target: Node, options?: MutationObserverInit) { active.add(this); return super.observe(target, options); }
      disconnect() { active.delete(this); return super.disconnect(); }
    };
    for (const [target, name] of [[input, 'input'], [window, 'pagehide']] as const) {
      const add = target.addEventListener.bind(target), remove = target.removeEventListener.bind(target);
      target.addEventListener = ((type: string, listener: any, options: any) => { if (type === name) counts[name]++; return add(type, listener, options); }) as any;
      target.removeEventListener = ((type: string, listener: any, options: any) => { if (type === name) counts[name]--; return remove(type, listener, options); }) as any;
    }
    input.oninput = () => {
      if (behavior === 'nothing') return;
      if (behavior === 'detach') { panel.remove(); return; }
      if (behavior === 'replace') { panel.replaceWith(panel.cloneNode(true)); return; }
      panel.setAttribute('aria-busy', 'true');
      if (behavior === 'pending') return;
      const settle = () => {
        panel.querySelector('.hero-time')!.textContent = 'new';
        panel.querySelector('.live-indicator')!.setAttribute('data-state', behavior === 'error' ? 'error' : 'ready');
        panel.setAttribute('aria-busy', 'false');
      };
      if (delay) setTimeout(settle, delay); else settle();
    };
  }, {behavior,delay});
}
async function clean(page: Page) {
  const state = await page.evaluate(() => {
    const r = (window as any).__reviewResources;
    return { activeObservers: r.active.size, inputListeners: r.counts.input, pagehideListeners: r.counts.pagehide };
  });
  expect(state).toEqual({activeObservers:0,inputListeners:0,pagehideListeners:0});
  return state;
}
async function rejected(promise: Promise<unknown>, pattern: RegExp) {
  let error = '';
  try { await promise; } catch (e) { error = String(e); }
  expect(error).toMatch(pattern);
  return error;
}
for (const [engine,type] of Object.entries({chromium,firefox,webkit})) {
  const browser = await type.launch();
  const context = await browser.newContext({locale:'en-AU',timezoneId:'Australia/Sydney',viewport:{width:900,height:640},deviceScaleFactor:1,reducedMotion:'no-preference'});
  const page = await context.newPage();
  page.on('pageerror', error => errors.push({engine, error:String(error)}));
  await record(engine,'real first conversion and changed result',async()=>{
    await page.goto(origin);
    await expect(page.locator('main')).toHaveAttribute('data-offline-ready','true');
    for (const [input,time] of [['April 9, 2026 3pm UTC',/1:00 am/i],['April 9, 2026 4pm UTC',/2:00 am/i]] as const) {
      await fillSuccessfulConversion(page,input,remaining=>expect(page.locator('.hero-time')).toHaveText(time,{timeout:remaining()}));
      await expect(page.locator('.result')).toHaveCount(1);
      await expect(page.locator('.result-date')).toHaveText(/10 Apr(?:il)? 2026/);
    }
    return {servedRelease:await page.evaluate(()=>fetch('/release.json').then(r=>r.json())),motion:await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)};
  });
  await record(engine,'unsupported pending-panel action rejects before replacing input',async()=>{
    await page.getByLabel('Message with a date or time').fill('April 9, 2026 5pm UTC');
    expect(await page.locator('.result-panel').getAttribute('aria-busy')).toBe('true');
    const error=await rejected(fillSuccessfulConversion(page,'April 9, 2026 6pm UTC',remaining=>expect(page.locator('.hero-time')).toHaveText(/4:00 am/i,{timeout:remaining()})),/idle panel/);
    await expect(page.getByLabel('Message with a date or time')).toHaveValue('April 9, 2026 5pm UTC');
    await expect(page.locator('.hero-time')).toHaveText(/3:00 am/i);
    await expect(page.locator('.result')).toHaveCount(1);
    return {error,restriction:'idle changed-text ordinary conversions only'};
  });
  await record(engine,'real no-result failure then recovery',async()=>{
    await expect(page.locator('.result-panel')).toHaveAttribute('aria-busy','false');
    let assertions=0;
    const error=await rejected(fillSuccessfulConversion(page,'no timestamp present',async()=>{assertions++;}),/ordinary conversion failed/);
    expect(assertions).toBe(0);
    await expect(page.getByRole('alert')).toContainText('No timestamp');
    await fillSuccessfulConversion(page,'April 9, 2026 7pm UTC',remaining=>expect(page.locator('.hero-time')).toHaveText(/5:00 am/i,{timeout:remaining()}));
    return {error,assertions};
  });
  await record(engine,'real worker launch failure then same-runtime recovery',async()=>{
    await page.evaluate(()=>{
      const native=Worker;
      (window as any).__reviewNativeWorker=native;
      window.Worker=new Proxy(native,{construct(){throw new Error('adversarial injected worker launch failure');}});
    });
    const error=await rejected(fillSuccessfulConversion(page,'April 9, 2026 9pm UTC',async()=>{throw new Error('unexpected positive assertion');}),/ordinary conversion failed/);
    await expect(page.getByRole('alert')).toContainText('could not start conversion');
    await page.evaluate(()=>{window.Worker=(window as any).__reviewNativeWorker;delete (window as any).__reviewNativeWorker;});
    await fillSuccessfulConversion(page,'April 9, 2026 10pm UTC',remaining=>expect(page.locator('.hero-time')).toHaveText(/8:00 am/i,{timeout:remaining()}));
    return {error,faultInjection:true};
  });
  for (const [behavior,pattern] of [['coalesced',null],['nothing',/assertion deadline/],['pending',/assertion deadline/],['error',/ordinary conversion failed/],['detach',/owned panel/],['replace',/owned panel/]] as const) {
    await record(engine,`synthetic ${behavior} cycle cleanup`,async()=>{
      await synthetic(page,behavior);
      let assertions=0;
      const result=fillSuccessfulConversion(page,'synthetic changed input',async remaining=>{assertions++;await expect(page.locator('.hero-time')).toHaveText('new',{timeout:remaining()});},200);
      const error=pattern?await rejected(result,pattern):await result;
      expect(assertions).toBe(pattern?0:1);
      return {error,assertions,cleanup:await clean(page)};
    });
  }
  await record(engine,'action rejection retains error and cleanup',async()=>{
    await synthetic(page,'nothing');
    const original=page.getByLabel;
    (page as any).getByLabel=()=>({waitFor:async()=>{},fill:async()=>{throw new Error('adversarial action rejection');}});
    let error;
    try { error=await rejected(fillSuccessfulConversion(page,'new',async()=>{}),/adversarial action rejection/); } finally { page.getByLabel=original; }
    return {error,cleanup:await clean(page)};
  });
  await record(engine,'exact assertion rejection retains error and cleanup',async()=>{
    await synthetic(page,'coalesced');
    const error=await rejected(fillSuccessfulConversion(page,'new',async()=>{throw new Error('adversarial exact result rejected');}),/adversarial exact result rejected/);
    return {error,cleanup:await clean(page)};
  });
  await record(engine,'wait and exact assertion share one deadline',async()=>{
    await synthetic(page,'coalesced',150);
    let remainingSeen=0;
    const began=performance.now();
    const error=await rejected(fillSuccessfulConversion(page,'new',async remaining=>{remainingSeen=remaining();await expect(page.locator('.hero-time')).toHaveText('wrong independent result',{timeout:remaining()});},250),/toHaveText/);
    const elapsed=performance.now()-began;
    expect(remainingSeen).toBeGreaterThan(0);expect(remainingSeen).toBeLessThan(150);expect(elapsed).toBeLessThan(450);
    return {error,remainingSeen,elapsed,cleanup:await clean(page)};
  });
  await record(engine,'remaining deadline refreshes across multiple exact assertions',async()=>{
    await synthetic(page,'coalesced');
    const budgets:number[]=[];
    await fillSuccessfulConversion(page,'new',async remaining=>{
      budgets.push(remaining());
      await expect(page.locator('.hero-time')).toHaveText('new',{timeout:remaining()});
      await new Promise(resolve=>setTimeout(resolve,30));
      budgets.push(remaining());
      await expect(page.locator('.hero-time')).toHaveText('new',{timeout:remaining()});
    },250);
    expect(budgets[0]-budgets[1]).toBeGreaterThan(25);
    return {budgets,cleanup:await clean(page)};
  });
  await record(engine,'navigation rejects owned document and later real conversion works',async()=>{
    await synthetic(page,'pending');
    const action=fillSuccessfulConversion(page,'new',async()=>{},1000);
    const observation=rejected(action,/document|Execution context|disposed|destroyed|Target/);
    await expect(page.locator('.result-panel')).toHaveAttribute('aria-busy','true');
    await page.goto(origin);
    const error=await observation;
    await fillSuccessfulConversion(page,'April 9, 2026 8pm UTC',remaining=>expect(page.locator('.hero-time')).toHaveText(/6:00 am/i,{timeout:remaining()}));
    return {error};
  });
  await record(engine,'page closure rejects pending wait',async()=>{
    await synthetic(page,'pending');
    const observed=rejected(fillSuccessfulConversion(page,'new',async()=>{},1000),/closed|Target|disposed|destroyed|document/);
    await expect(page.locator('.result-panel')).toHaveAttribute('aria-busy','true');
    await page.close();
    return {error:await observed};
  });
  await context.close();await browser.close();
}
console.log(JSON.stringify({startedAt:start,endedAt:new Date().toISOString(),passed:rows.filter(r=>r.outcome==='pass').length,failed:rows.filter(r=>r.outcome==='fail').length,pageErrors:errors}));
