import config from './playwright.config';
export default {
  ...config,
  testDir: './e2e',
  outputDir: process.env.RUNTIME_PROBE_OUTPUT,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: process.env.RUNTIME_PROBE_OUTPUT + '/html' }],
    ['./e2e/attempt-reporter.ts'],
    ['./e2e/timing-reporter.ts'],
  ],
};
