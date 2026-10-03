import { defineConfig, devices } from "@playwright/test";
const port = process.env.PLAYWRIGHT_PORT || "4173";
export default defineConfig({
  testDir: "./e2e",
  testIgnore: [
    "**/subpath.spec.ts",
    "**/foldable.spec.ts",
    "**/hosted.spec.ts",
  ],
  timeout: 30000,
  expect: { timeout: 10000 },
  fullyParallel: true,
  // Standard Linux runners for this public repository have four CPU cores.
  workers: process.env.CI ? 4 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    locale: "en-AU",
    timezoneId: "Australia/Sydney",
    trace: process.env.CI ? "on-first-retry" : "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "foldable",
      testMatch: "**/foldable.spec.ts",
      testIgnore: [],
      use: { ...devices["Desktop Chrome"] },
    },
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "android-emulation", use: { ...devices["Pixel 7"] } },
    {
      name: "iphone-emulation",
      use: { ...devices["iPhone 13"], defaultBrowserType: "webkit" },
    },
  ],
  webServer: {
    command: `PORT=${port} CHRONOSHIFT_TEST_SERVER=1 bun scripts/serve-web.ts`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
});
