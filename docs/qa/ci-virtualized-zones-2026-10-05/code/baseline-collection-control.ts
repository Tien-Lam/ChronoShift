import { chromium, firefox, webkit, expect } from '@playwright/test';
import { resolve, extname } from 'node:path';
import { PREVIEW_CSP } from '/Users/tien/Developer/ChronoShift/scripts/csp.ts';
const output = '/Users/tien/Developer/ChronoShift/docs/qa/ci-virtualized-zones-2026-10-05/code';
const root = '/tmp/chronoshift-virtualized-zones/baseline-runtime/dist';
const startedAt = new Date().toISOString();
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = Bun.serve({ hostname: '127.0.0.1', port: 4323, async fetch(request) {
  const path = resolve(root, new URL(request.url).pathname.slice(1) || 'index.html');
  if (!path.startsWith(root + '/')) return new Response('Not found', { status: 404 });
  const file = Bun.file(path); if (!(await file.exists())) return new Response('Not found', { status: 404 });
  return new Response(file, { headers: { 'Content-Type': mime[extname(path)] || 'application/octet-stream', 'Content-Security-Policy': PREVIEW_CSP } });
}});
const result: any = { startedAt, origin: 'http://127.0.0.1:4323', root, engines: {} };
try {
  for (const [engine, browserType] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await browserType.launch();
    const page = await browser.newPage({ viewport: { width: 900, height: 2400 }, locale: 'en-AU', timezoneId: 'Australia/Sydney', reducedMotion: 'no-preference', deviceScaleFactor: 1 });
    await page.goto(result.origin);
    await page.getByRole('button', { name: 'Show target timezones', exact: true }).click();
    const input = page.locator('#target-zone');
    await expect(input).toHaveAttribute('aria-expanded', 'true');
    const id = await input.getAttribute('aria-controls');
    const list = page.locator(`[id="${id}"]`);
    await expect.poll(() => list.locator('[role=option][data-value]').count()).toBeGreaterThan(400);
    result.engines[engine] = { version: browser.version(), options: await list.locator('[role=option][data-value]').evaluateAll(rows => rows.map(row => ({ value: row.getAttribute('data-value'), height: row.getBoundingClientRect().height }))) };
    await browser.close();
  }
} finally { server.stop(true); }
result.endedAt = new Date().toISOString();
const comparisons = [];
for (const file of ['page-navigation-corrected', 'page-navigation-tall-control']) {
  const run = await Bun.file(`${output}/${file}.json`).json();
  for (const condition of run.cases) {
    const options = result.engines[condition.engine].options;
    const positions = new Map(options.map((option, i) => [option.value, i + 1]));
    for (const [index, step] of condition.steps.entries()) {
      if (!step.key?.startsWith('Page')) continue;
      const before = positions.get(step.before.focusedValue); const after = positions.get(step.after.focusedValue);
      comparisons.push({ file, engine: condition.engine, version: condition.version, field: condition.field, step: index, key: step.key, beforeValue: step.before.focusedValue, afterValue: step.after.focusedValue, beforePosition: before, afterPosition: after, rowAdvance: Math.abs(after - before), beforeRow: step.before.row, afterRow: step.after.row, clientHeight: step.after.clientHeight, visible: step.after.visible });
    }
  }
}
result.comparisons = comparisons;
await Bun.write(`${output}/baseline-collection-control.json`, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ startedAt, endedAt: result.endedAt, engines: Object.fromEntries(Object.entries(result.engines).map(([name, value]) => [name, { version: value.version, count: value.options.length }])), candidateSingleRow: comparisons.filter(c => c.version === 'candidate' && c.rowAdvance === 1), baselineSingleRow: comparisons.filter(c => c.version === 'baseline' && c.rowAdvance === 1) }, null, 2));
