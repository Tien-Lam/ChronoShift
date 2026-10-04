import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/subpath.spec.ts",
  timeout: 30000,
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:4174",
    locale: "en-AU",
    timezoneId: "Australia/Sydney",
  },
  webServer: {
    command: "PORT=4174 BASE_PATH=/ChronoShift/ bun scripts/serve-web.ts",
    url: "http://127.0.0.1:4174/ChronoShift/",
    reuseExistingServer: false,
  },
});
