const path = 'e2e/controls.spec.ts';
const source = await Bun.file(path).text();
const block = source.slice(source.indexOf('test("hovering timezone suggestions'));
await Bun.write(`${import.meta.dir}/reopen.spec.ts`, `import { test, expect } from '../../../../e2e/fixtures';
import { enterZone } from '../../../../e2e/choices';
test.use({origin: {url: 'http://127.0.0.1:' + process.env.PLAYWRIGHT_PORT + '/', stop: async () => {}}});
test.afterEach(async ({page}) => console.log(JSON.stringify({actualUrl:page.url(), assets:await page.locator('script[src]').evaluateAll(elements => elements.map(el => el.getAttribute('src')))})));
${block}`);
