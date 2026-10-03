import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/hosted.spec.ts",
  timeout: 60000,
  expect: { timeout: 20000 },
  workers: 2,
  use: {
    baseURL: "https://tien-lam.github.io",
    locale: "en-AU",
    timezoneId: "Australia/Sydney",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "hosted-desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "hosted-phone", use: { ...devices["Pixel 7"] } },
  ],
});
