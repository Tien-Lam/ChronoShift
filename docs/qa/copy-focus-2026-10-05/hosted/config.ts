import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "copy-focus.spec.ts",
  timeout: 60000,
  expect: { timeout: 20000 },
  workers: 2,
  retries: 0,
  reporter: [
    ["line"],
    [
      "json",
      { outputFile: new URL("./report.json", import.meta.url).pathname },
    ],
  ],
  outputDir: "./results",
  use: {
    baseURL: "https://tien-lam.github.io",
    locale: "en-AU",
    timezoneId: "Australia/Sydney",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "hosted-chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "hosted-webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
