import { defineConfig, devices } from "@playwright/test";
const port = process.env.PLAYWRIGHT_PORT || "4173";
// CSS layout, touch and accessibility checks do not need high-density raster
// output. Keep the native profile density locally; CI uses 1x mobile pixels
// to avoid software-rendering millions of extra pixels for every interaction.
const mobileRaster = process.env.CI ? { deviceScaleFactor: 1 } : {};
// Routine desktop interactions need a desktop layout, not a large framebuffer.
// The responsive suite independently exercises widths through 1920px.
const desktopWindow = process.env.CI
  ? { viewport: { width: 900, height: 640 } }
  : {};
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
  // Four workers outperform oversubscription on the measured Linux runner.
  workers: process.env.CI ? 4 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["./e2e/attempt-reporter.ts"],
    ...(process.env.CHRONOSHIFT_CI_TIMING === "1"
      ? ([["./e2e/timing-reporter.ts"]] as [string][])
      : []),
  ],
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
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...desktopWindow,
        ...(process.env.PLAYWRIGHT_CHROMIUM_CHANNEL
          ? { channel: process.env.PLAYWRIGHT_CHROMIUM_CHANNEL }
          : {}),
      },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"], ...desktopWindow },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"], ...desktopWindow },
    },
    {
      name: "android-emulation",
      use: { ...devices["Pixel 7"], ...mobileRaster },
    },
    {
      name: "iphone-emulation",
      use: {
        ...devices["iPhone 13"],
        ...mobileRaster,
        defaultBrowserType: "webkit",
      },
    },
  ],
  webServer: {
    command: `PORT=${port} CHRONOSHIFT_TEST_SERVER=1 bun scripts/serve-web.ts`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
});
