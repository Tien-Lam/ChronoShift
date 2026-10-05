import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  timeout: 30000,
  expect: { timeout: 10000 },
  workers: 1,
  retries: 0,
  outputDir: "./results",
  reporter: [["list"], ["json", { outputFile: "./report.json" }]],
  use: {
    ...devices["Desktop Safari"],
    viewport: { width: 900, height: 640 },
    locale: "en-AU",
    timezoneId: "Australia/Sydney",
    reducedMotion: "no-preference",
    baseURL: "http://127.0.0.1:4317",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    cwd: "/Users/tien/Developer/ChronoShift",
    command: "PORT=4317 CHRONOSHIFT_TEST_SERVER=1 bun scripts/serve-web.ts",
    url: "http://127.0.0.1:4317",
    reuseExistingServer: false,
  },
});
