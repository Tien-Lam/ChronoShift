import { webkit, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const out = 'docs/qa/copy-focus-2026-10-05/adversarial-disabled';
const origin = 'http://127.0.0.1:4318/';
await mkdir(out, { recursive: true });
const startedAt = new Date().toISOString();
const browser = await webkit.launch();
const results: any[] = [];
const cases = ['body-fallback'];

for (const name of cases) {
  const begunAt = new Date().toISOString();
  const context = await browser.newContext({ viewport: { width: 900, height: 640 }, deviceScaleFactor: 2, locale: 'en-AU', timezoneId: 'Australia/Sydney', reducedMotion: 'no-preference' });
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  const page = await context.newPage();
  const diagnostics: any[] = [], warnings: string[] = [], errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', async message => {
    if (message.type() === 'warning' || message.type() === 'error') warnings.push(message.text());
    if (message.text().startsWith('[ChronoShift] copy.')) diagnostics.push({ event: message.text().split(' ')[1], fields: await message.args()[1]?.jsonValue() });
  });
  await context.addInitScript(({ hold }) => {
    sessionStorage.removeItem('chronoshift-detailed-logs');
    const nativeFrame = window.requestAnimationFrame.bind(window);
    const state: any = { events: [], writes: [], held: [], holding: hold, armed: false, callbackSources: [] };
    const identity = (node: any) => node ? { tag: node.tagName || node.nodeName, id: node.id || '', label: node.getAttribute?.('aria-label') || '' } : null;
    for (const type of ['focus', 'blur', 'pointerdown', 'keydown']) document.addEventListener(type, event => {
      state.events.push({ at: performance.now(), type, target: identity(event.target), active: identity(document.activeElement), key: type === 'keydown' ? (event as KeyboardEvent).key : undefined });
    }, true);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => {
      state.writes.push({ at: performance.now(), active: identity(document.activeElement) });
      state.armed = true;
      return Promise.reject(new Error('Independent manual-copy control'));
    } } });
    window.requestAnimationFrame = callback => {
      const source = String(callback);
      if (state.holding && state.armed && /\.focus\(/.test(source) && /\.select\(/.test(source)) {
        state.armed = false;
        state.callbackSources.push(source);
        state.held.push(callback);
        return 900000 + state.held.length;
      }
      return nativeFrame(callback);
    };
    state.release = (index: number) => new Promise<void>(resolve => nativeFrame(time => {
      const callback = state.held[index];
      if (!callback) throw Error('Missing held focus callback ' + index);
      state.held[index] = null;
      callback(time);
      nativeFrame(() => resolve());
    }));
    (window as any).__adversarial = state;
  }, { hold: !['body-fallback', 'original-fill'].includes(name) });
  const item: any = { name, begunAt, attempt: 0, browser: browser.version(), platform: process.platform, origin, configuration: { viewport: { width: 900, height: 640 }, deviceScaleFactor: 2, locale: 'en-AU', timezoneId: 'Australia/Sydney', reducedMotion: 'no-preference', trace: true, clipboard: 'immediate rejection', holdOnlyFocusSelectFrame: !['body-fallback', 'original-fill'].includes(name) } };
  try {
    await page.goto(origin);
    await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
    const release = await (await page.request.get(origin + 'release.json')).json();
    const scripts = await page.locator('script[type="module"][src]').evaluateAll(elements => elements.map(element => (element as HTMLScriptElement).src));
    item.release = release;
    item.assets = [];
    for (const url of scripts) { const response = await page.request.get(url); const body = await response.body(); item.assets.push({ url, status: response.status(), sha256: new Bun.CryptoHasher('sha256').update(body).digest('hex') }); }
    expect(release.sourceCommit).toBe('35e11bac657a0c379fda48af9b454e674d2ea854');
    expect(item.assets[0].sha256).toBe('764439adde23302a0e40ff2c221e8fe13055671a6285ac16d528344cf06befc9');
    expect(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(false);
    const target = page.getByLabel('Convert to', { exact: true });
    const draft = page.getByLabel('Message with a date or time');
    await target.fill('UTC'); await target.press('Tab'); await expect(target).toHaveValue('UTC');
    await draft.fill('April 9, 2026 3pm UTC');
    await expect(page.locator('.hero-time')).toContainText(/3:00 pm/i);
    const copy = page.getByRole('button', { name: 'Copy UTC', exact: true });
    if (name === 'body-fallback') await page.evaluate(() => (document.activeElement as HTMLElement)?.blur());
    else if (name !== 'original-fill') await copy.focus();
    await copy.click();
    const manual = page.getByLabel('Text to copy');
    await expect(manual).toBeVisible();
    if (!['body-fallback', 'original-fill'].includes(name)) await expect.poll(() => page.evaluate(() => (window as any).__adversarial.held.length)).toBe(1);
    if (name === 'body-fallback') {
      await expect(manual).toBeFocused();
      expect(await manual.evaluate((element: HTMLTextAreaElement) => element.selectionEnd - element.selectionStart === element.value.length)).toBe(true);
      item.initialBodyOwner = await page.evaluate(() => (window as any).__adversarial.writes[0].active.tag === 'BODY');
      expect(item.initialBodyOwner).toBe(true);
    } else if (name === 'different-focus') {
      await draft.focus(); await page.evaluate(() => (window as any).__adversarial.release(0));
      await expect(draft).toBeFocused(); await expect(draft).toHaveValue('April 9, 2026 3pm UTC');
      await expect(target).toHaveValue('UTC');
      await manual.focus(); expect(await manual.evaluate((e: HTMLTextAreaElement) => e.selectionEnd - e.selectionStart === e.value.length)).toBe(true);
    } else if (name === 'away-back') {
      await draft.focus(); await copy.focus(); await page.evaluate(() => (window as any).__adversarial.release(0)); await expect(copy).toBeFocused();
    } else if (name === 'same-owner-pointer') {
      const box = (await copy.boundingBox())!; await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.mouse.down();
      await expect(copy).toBeFocused(); await page.evaluate(() => (window as any).__adversarial.release(0)); await expect(copy).toBeFocused();
      await page.mouse.move(1, 1); await page.mouse.up();
      expect(await page.evaluate(() => (window as any).__adversarial.writes.length)).toBe(1);
    } else if (name === 'same-owner-key') {
      await page.keyboard.down('Shift'); await page.evaluate(() => (window as any).__adversarial.release(0)); await expect(copy).toBeFocused(); await page.keyboard.up('Shift');
      await expect(target).toHaveValue('UTC');
    } else if (name === 'superseding') {
      await copy.click(); await expect.poll(() => page.evaluate(() => (window as any).__adversarial.held.length)).toBe(2);
      await page.evaluate(() => (window as any).__adversarial.release(0)); await expect(copy).toBeFocused();
      await page.evaluate(() => (window as any).__adversarial.release(1)); await expect(manual).toBeFocused();
      expect(await manual.evaluate((e: HTMLTextAreaElement) => e.selectionEnd - e.selectionStart === e.value.length)).toBe(true);
    } else if (name === 'invalidated') {
      await target.fill('CST'); await target.press('Tab'); await expect(target).toHaveValue('CST');
      await page.evaluate(() => (window as any).__adversarial.release(0)); await expect(manual).toHaveCount(0); await expect(page.locator('.result')).toHaveCount(0);
      await expect(page.getByRole('alert')).toContainText('Choose a timezone');
      await target.fill('Asia/Tokyo'); await target.press('Tab'); await expect(page.locator('.hero-time')).toContainText(/12:00 am/i); await expect(page.locator('.source-label')).toHaveText('UTC');
    } else {
      await target.fill('CST'); await target.press('Tab'); await expect(target).toHaveValue('CST');
      await expect(manual).toHaveCount(0); await expect(page.locator('.result')).toHaveCount(0);
      await expect(page.getByRole('alert')).toContainText('Choose a timezone');
      await target.fill('Asia/Tokyo'); await target.press('Tab'); await expect(page.locator('.hero-time')).toContainText(/12:00 am/i); await expect(page.locator('.source-label')).toHaveText('UTC');
    }
    await expect(draft).toHaveValue('April 9, 2026 3pm UTC');
    item.status = 'passed';
  } catch (error) { item.status = 'failed'; item.error = String(error); }
  item.observed = await page.evaluate(() => { const s = (window as any).__adversarial; const active = document.activeElement; return { events: s.events, writes: s.writes, callbackSources: s.callbackSources, active: { tag: active?.tagName, id: active?.id }, pendingFrames: s.held.filter(Boolean).length, target: (document.getElementById('target-zone') as HTMLInputElement)?.value, reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches }; });
  expect(diagnostics).toHaveLength(0); item.diagnostics = diagnostics; item.warnings = warnings; item.errors = errors;
  if (item.status === 'passed' && (warnings.length || errors.length)) { item.status = 'failed'; item.error = 'Unexpected console warning/error or pageerror'; }
  item.endedAt = new Date().toISOString();
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: true });
  await context.tracing.stop({ path: `${out}/${name}-trace.zip` });
  results.push(item); await Bun.write(`${out}/results.json`, JSON.stringify({ startedAt, origin, source: '35e11bac657a0c379fda48af9b454e674d2ea854', appBlob: '8bec3cbf656e92265f9f586fb9443de6e3c5aecc', results }, null, 2) + '\n');
  console.log(JSON.stringify({ name, status: item.status, begunAt, endedAt: item.endedAt, writes: item.observed.writes, diagnostics, error: item.error }));
  await context.close();
}
await browser.close();
if (results.some(item => item.status !== 'passed')) process.exitCode = 1;
