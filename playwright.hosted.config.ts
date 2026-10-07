import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/hosted.spec.ts",
  timeout: 60000,
  expect: { timeout: 20000 },
  workers: 2,
  use: {
    baseURL: process.env.HOSTED_URL || "https://timetolocal.com",
    locale: "en-AU",
    timezoneId: "Australia/Sydney",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "hosted-desktop",
      use: {
        ...devices["Desktop Chrome"],
        ...(process.env.PLAYWRIGHT_CHROMIUM_CHANNEL
          ? { channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL }
          : {}),
      },
    },
    { name: "hosted-phone", use: { ...devices["Pixel 7"] } },
  ],
});
