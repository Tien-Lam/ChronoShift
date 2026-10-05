import { chromium, firefox, webkit, expect } from '@playwright/test';
import { resolve, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { PREVIEW_CSP } from '/Users/tien/Developer/ChronoShift/scripts/csp.ts';

const output = '/Users/tien/Developer/ChronoShift/docs/qa/ci-virtualized-zones-2026-10-05/code';
const startedAt = new Date().toISOString();
const versions = [
  { name: 'baseline', port: 4323, root: '/tmp/chronoshift-virtualized-zones/baseline-runtime/dist' },
  { name: 'candidate', port: 4324, root: '/tmp/chronoshift-virtualized-zones/candidate-runtime/dist' },
];
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const servers = versions.map(v => Bun.serve({ hostname: '127.0.0.1', port: v.port, async fetch(request) {
  const name = new URL(request.url).pathname.slice(1) || 'index.html';
  const path = resolve(v.root, name);
  if (!path.startsWith(v.root + '/')) return new Response('Not found', { status: 404 });
  const file = Bun.file(path);
  if (!(await file.exists())) return new Response('Not found', { status: 404 });
  return new Response(file, { headers: { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Content-Security-Policy': PREVIEW_CSP, 'Cache-Control': 'no-cache' } });
}}));
const result: any = { startedAt, environment: { platform: process.platform, arch: process.arch, bun: Bun.version }, versions: [], cases: [] };
for (const version of versions) {
  const origin = `http://127.0.0.1:${version.port}`;
  const html = await (await fetch(origin)).text();
  const js = html.match(/src="([^"]+\.js)"/)?.[1];
  const css = html.match(/href="([^"]+\.css)"/)?.[1];
  const sw = await (await fetch(origin + '/sw.js')).text();
  result.versions.push({ ...version, origin, js, css, workerVersion: sw.match(/const VERSION = '([^']+)'/)?.[1], htmlSha256: createHash('sha256').update(html).digest('hex'), swSha256: createHash('sha256').update(sw).digest('hex'), jsSha256: createHash('sha256').update(await (await fetch(origin + js)).text()).digest('hex'), cssSha256: createHash('sha256').update(await (await fetch(origin + css)).text()).digest('hex'), release: await (await fetch(origin + '/release.json')).json() });
}
async function observation(page, field) {
  return page.evaluate(id => {
    const input = document.getElementById(id)!;
    const owned = input.getAttribute('aria-controls');
    const list = owned ? document.getElementById(owned) : null;
    const active = input.getAttribute('aria-activedescendant');
    const item = active ? document.getElementById(active) : null;
    const l = list?.getBoundingClientRect(); const r = item?.getBoundingClientRect();
    const row = r && { top: r.top, bottom: r.bottom, left: r.left, right: r.right, height: r.height, width: r.width };
    return { time: performance.now(), documentScroll: scrollY, viewport: [innerWidth, innerHeight], field: id, expanded: input.getAttribute('aria-expanded'), owned, active, focusedValue: item?.getAttribute('data-value'), position: item?.getAttribute('aria-posinset'), setSize: item?.getAttribute('aria-setsize'), mounted: list?.querySelectorAll('[role=option][data-value]').length, scrollTop: list?.scrollTop, clientHeight: list?.clientHeight, scrollHeight: list?.scrollHeight, list: l && { top: l.top, bottom: l.bottom, width: l.width, height: l.height }, row, visible: !!l && !!r && r.height > 0 && r.top >= Math.max(0, l.top) - 1 && r.bottom <= Math.min(innerHeight, l.bottom) + 1, value: (input as HTMLInputElement).value, activeElement: document.activeElement?.id };
  }, field);
}
try {
  for (const [engine, browserType] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await browserType.launch();
    result.environment[engine] = browser.version();
    for (const version of versions) for (const field of ['target-zone', 'source-zone']) {
      const context = await browser.newContext({ viewport: { width: 900, height: 640 }, locale: 'en-AU', timezoneId: 'Australia/Sydney', reducedMotion: 'no-preference', deviceScaleFactor: 1 });
      const page = await context.newPage(); page.setDefaultTimeout(2500);
      const record: any = { engine, version: version.name, field, startedAt: new Date().toISOString(), steps: [], console: [], pageErrors: [] };
      page.on('console', message => { if (message.type() === 'error' || message.type() === 'warning') record.console.push({ type: message.type(), text: message.text(), at: new Date().toISOString() }); });
      page.on('pageerror', error => record.pageErrors.push(error.message));
      await page.addInitScript(() => { window.__reviewCsp = []; window.__reviewEvents = []; document.addEventListener('securitypolicyviolation', e => window.__reviewCsp.push({ directive: e.effectiveDirective, blocked: e.blockedURI })); document.addEventListener('keydown', e => window.__reviewEvents.push({ time: performance.now(), event: 'keydown', key: e.key, id: e.target.id, scrollY })); document.addEventListener('scroll', e => window.__reviewEvents.push({ time: performance.now(), event: 'scroll', id: e.target.id, className: e.target.className, scrollY }), true); });
      try {
        await page.goto(`http://127.0.0.1:${version.port}`);
        if (field === 'source-zone') await page.getByText('More options', { exact: true }).click();
        const input = page.locator(`#${field}`);
        await input.scrollIntoViewIfNeeded(); await input.click();
        await page.getByRole('button', { name: field === 'source-zone' ? 'Show source timezones' : 'Show target timezones', exact: true }).click();
        await expect(input).toHaveAttribute('aria-expanded', 'true');
        async function key(keyName) {
          const before = await observation(page, field);
          await input.press(keyName);
          await expect.poll(async () => (await observation(page, field)).focusedValue, { timeout: 2500 }).not.toBe(before.focusedValue);
          await expect.poll(async () => (await observation(page, field)).visible, { timeout: 2500 }).toBe(true);
          const after = await observation(page, field);
          record.steps.push({ key: keyName, before, after });
          if (keyName.startsWith('Page') && before.focusedValue === after.focusedValue && after.position !== '1' && after.position !== after.setSize) throw new Error('Page navigation did not advance an interior focused option');
        }
        await key('Home');
        for (let i = 0; i < 8; i++) await key('PageDown');
        await key('End'); await key('PageUp'); await key('PageUp'); await key('Home');
        for (let i = 0; i < 4; i++) await key('PageDown');
        const resizeBefore = await observation(page, field);
        await page.setViewportSize({ width: 280, height: 960 });
        await key('PageDown');
        record.steps.push({ resizeBefore, resizeAfter: await observation(page, field) });
        for (let i = 0; i < 4; i++) await key('PageDown');
        for (let i = 0; i < 4; i++) await key('PageUp');
        const selected = (await observation(page, field)).focusedValue;
        await input.press('Enter'); await expect(input).toHaveValue(selected);
        await expect(input).toHaveAttribute('aria-expanded', 'false');
        record.final = await observation(page, field); record.pass = true;
      } catch (error) { record.pass = false; record.error = String(error); record.failure = await observation(page, field); }
      record.csp = await page.evaluate(() => window.__reviewCsp);
      record.events = await page.evaluate(() => window.__reviewEvents);
      record.endedAt = new Date().toISOString(); result.cases.push(record);
      await context.close();
    }
    await browser.close();
  }
} finally {
  result.endedAt = new Date().toISOString();
  await Bun.write(`${output}/page-navigation-corrected.json`, JSON.stringify(result, null, 2) + '\n');
  for (const server of servers) server.stop(true);
}
console.log(JSON.stringify({ startedAt, endedAt: result.endedAt, environment: result.environment, cases: result.cases.map(c => ({ engine: c.engine, version: c.version, field: c.field, pass: c.pass, error: c.error, pageErrors: c.pageErrors, csp: c.csp, console: c.console })) }, null, 2));
