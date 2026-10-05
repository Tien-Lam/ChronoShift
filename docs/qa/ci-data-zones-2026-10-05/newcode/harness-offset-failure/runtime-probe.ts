import { chromium, expect } from '@playwright/test';
import { resolve, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { PREVIEW_CSP } from '/Users/tien/Developer/ChronoShift/scripts/csp.ts';

const output = '/Users/tien/Developer/ChronoShift/docs/qa/ci-data-zones-2026-10-05/newcode';
const variants = [
  { name: 'baseline', root: '/tmp/chronoshift-virtualized-zones/baseline-runtime/dist', port: 4327 },
  { name: 'candidate', root: '/tmp/chronoshift-data-zones/candidate-runtime/dist', port: 4328 },
];
const mime: Record<string, string> = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const run: any = { startedAt: new Date().toISOString(), motion: 'no-preference', viewport: { width: 900, height: 2400 }, locale: 'en-AU', timezoneId: 'Australia/Sydney', conditions: [] };
const hash = async (path: string) => createHash('sha256').update(new Uint8Array(await Bun.file(path).arrayBuffer())).digest('hex');
const save = async () => Bun.write(`${output}/runtime-probe.json`, JSON.stringify(run, null, 2) + '\n');
const browser = await chromium.launch();
run.browser = browser.version();
try {
  for (const variant of variants) {
    const record: any = { ...variant, origin: `http://127.0.0.1:${variant.port}`, startedAt: new Date().toISOString(), observations: [], console: [], errors: [] };
    run.conditions.push(record);
    const server = Bun.serve({ hostname: '127.0.0.1', port: variant.port, async fetch(request) {
      const path = resolve(variant.root, new URL(request.url).pathname.slice(1) || 'index.html');
      if (!path.startsWith(variant.root + '/')) return new Response('Not found', { status: 404 });
      const file = Bun.file(path);
      if (!(await file.exists())) return new Response('Not found', { status: 404 });
      return new Response(file, { headers: { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Content-Security-Policy': PREVIEW_CSP, 'Cache-Control': 'no-cache' } });
    }});
    const context = await browser.newContext({ viewport: run.viewport, locale: run.locale, timezoneId: run.timezoneId, reducedMotion: 'no-preference', deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.on('console', message => { if (['error', 'warning'].includes(message.type())) record.console.push({ type: message.type(), text: message.text(), at: new Date().toISOString() }); });
    page.on('pageerror', error => record.errors.push({ text: error.message, at: new Date().toISOString() }));
    const input = page.locator('#target-zone');
    const ownedList = async (field: any) => {
      await expect(field).toHaveAttribute('aria-expanded', 'true');
      const id = await field.getAttribute('aria-controls');
      return page.locator(`[id="${id}"]`);
    };
    const rows = async (list: any) => list.locator('[role="option"]').evaluateAll((elements: Element[]) => elements.map(element => ({ value: element.getAttribute('data-value'), key: element.getAttribute('data-key'), label: element.querySelector('[slot="label"]')?.textContent, description: element.querySelector('[slot="description"]')?.textContent ?? null, selected: element.getAttribute('aria-selected'), position: element.getAttribute('aria-posinset'), size: element.getAttribute('aria-setsize'), labelLinked: element.getAttribute('aria-labelledby') === element.querySelector('[slot="label"]')?.id, descriptionLinked: element.querySelector('[slot="description"]') ? element.getAttribute('aria-describedby') === element.querySelector('[slot="description"]')?.id : !element.getAttribute('aria-describedby') })));
    const snap = async (label: string, field: any = input) => {
      record.observations.push({ label, at: new Date().toISOString(), value: await field.inputValue(), attributes: await field.evaluate((element: Element) => Object.fromEntries(element.getAttributeNames().filter(name => name.startsWith('aria-')).map(name => [name, element.getAttribute(name)]))), active: await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName), list: await field.getAttribute('aria-controls') ? await rows(await ownedList(field)) : null });
      await save();
    };
    try {
      record.artifacts = { shell: await hash(`${variant.root}/index.html`), sw: await hash(`${variant.root}/sw.js`), release: await Bun.file(`${variant.root}/release.json`).json() };
      await page.goto(record.origin);
      record.servedScripts = await page.locator('script[src]').evaluateAll(elements => elements.map(element => element.getAttribute('src')));
      await page.getByRole('button', { name: 'Show target timezones', exact: true }).click();
      let list = await ownedList(input);
      await expect(list.locator('[role="option"]')).toHaveCount(454);
      await snap('initial manual full');
      await input.press('ArrowDown');
      await input.press('End');
      const descendant = await input.getAttribute('aria-activedescendant');
      const last = list.locator('[role="option"]').last();
      await expect(last).toHaveAttribute('id', descendant!);
      const lastValue = await last.getAttribute('data-value');
      await input.press('Enter');
      await expect(input).toHaveValue(lastValue ?? '');
      await snap('End then Enter commits last original ID');
      await input.focus();
      await input.fill('tokyo');
      list = await ownedList(input);
      await expect.poll(() => list.locator('[role="option"]').count()).toBeGreaterThan(0);
      await snap('filtered tokyo label and description associations');
      await input.press('Tab');
      await expect(input).toHaveValue('tokyo');
      await snap('Tab preserves typed alias without focused suggestion');
      await input.focus();
      await input.fill('zz-unrecognized-review-zone');
      list = await ownedList(input);
      await expect(list.locator('[role="option"][data-value]')).toHaveCount(0);
      await expect(list.locator('[role="option"]')).toHaveCount(1);
      await expect(list.locator('.choice-empty')).toHaveText('No matches');
      await expect(input).toHaveAttribute('aria-invalid', 'true');
      await expect(page.locator('.target-field .choice-control')).toHaveAttribute('data-invalid', 'true');
      await input.press('Escape');
      await expect(input).toHaveValue('zz-unrecognized-review-zone');
      await snap('invalid custom Escape preserves and closes');
      await input.focus();
      await input.fill('UTC+05:30');
      await input.press('Tab');
      await expect(input).toHaveValue('UTC+05:30');
      await expect(input).not.toHaveAttribute('aria-invalid', 'true');
      await snap('custom fixed offset correction blur');
      await input.focus();
      await input.fill('');
      await input.press('Escape');
      await expect(input).toHaveValue('');
      await expect(input).not.toHaveAttribute('aria-invalid', 'true');
      await page.getByRole('button', { name: 'Show target timezones', exact: true }).click();
      list = await ownedList(input);
      await expect(list.locator('[role="option"]')).toHaveCount(454);
      await snap('empty fallback manual full recovery');
      await input.press('Escape');
      const summary = page.locator('summary').filter({ hasText: 'More options' });
      await summary.focus();
      await summary.press('Enter');
      await page.keyboard.press('Tab');
      await page.keyboard.type('Paris');
      const source = page.locator('#source-zone');
      await expect(source).toHaveValue('Paris');
      await expect(input).toHaveValue('');
      await snap('More options Enter immediate Tab typing owns source', source);
      let sourceList = await ownedList(source);
      await expect(sourceList.locator('[role="option"][data-value="Europe/Paris"]')).toHaveCount(1);
      await source.press('ArrowDown');
      await source.press('Enter');
      await expect(source).toHaveValue('Europe/Paris');
      await snap('source keyboard selection commits canonical ID', source);
      await page.getByRole('button', { name: 'Show source timezones', exact: true }).click();
      sourceList = await ownedList(source);
      await expect(sourceList.locator('[role="option"]')).toHaveCount(454);
      await snap('source full order intact after target filtered clones', source);
      await source.press('Escape');
      await page.getByRole('button', { name: 'Reset preferences', exact: true }).click();
      await expect(source).toHaveValue('');
      await expect(input).toHaveValue('');
      await snap('external reset target');
      await snap('external reset source', source);
      await source.focus();
      await source.fill('Europe/Paris');
      await source.press('Tab');
      await expect(source).toHaveValue('Europe/Paris');
      await expect(input).toHaveValue('');
      await snap('post-reset recovery source', source);
      record.passed = true;
    } catch (error) {
      record.passed = false;
      record.failure = { at: new Date().toISOString(), text: String(error), stack: error instanceof Error ? error.stack : undefined };
      await Bun.write(`${output}/${variant.name}-failure.html`, await page.content());
      await page.screenshot({ path: `${output}/${variant.name}-failure.png`, animations: 'allow' });
      console.error(`${variant.name} failure: ${String(error)}`);
    } finally {
      record.endedAt = new Date().toISOString();
      await context.close();
      server.stop(true);
      await save();
    }
  }
} finally {
  await browser.close();
  run.endedAt = new Date().toISOString();
  await save();
}
console.log(JSON.stringify({ startedAt: run.startedAt, endedAt: run.endedAt, browser: run.browser, conditions: run.conditions.map((condition: any) => ({ name: condition.name, passed: condition.passed, observations: condition.observations.length, failure: condition.failure, console: condition.console, errors: condition.errors })) }, null, 2));
