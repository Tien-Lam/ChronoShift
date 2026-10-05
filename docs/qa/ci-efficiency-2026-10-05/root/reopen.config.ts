import base from '../../../../playwright.config.ts';
import { defineConfig } from '@playwright/test';
export default defineConfig({
  ...base,
  testDir: import.meta.dir,
  testMatch: 'reopen.spec.ts',
  workers: 1,
  retries: 0,
  repeatEach: 3,
  webServer: undefined,
  reporter: 'list',
  outputDir: '/tmp/chronoshift-reopen-proof',
  projects: base.projects!.filter(p => p.name === 'iphone-emulation'),
  use: {
    ...base.use,
    baseURL: `http://127.0.0.1:${process.env.PLAYWRIGHT_PORT}`,
    trace: 'off',
    screenshot: 'off',
  },
});
