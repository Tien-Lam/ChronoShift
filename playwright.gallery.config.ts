import { defineConfig } from "@playwright/test";
const port = process.env.GALLERY_PORT || "44101";
export default defineConfig({
  testDir: "./e2e/gallery",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  expect: { timeout: 10000 },
  outputDir: ".work/TIE-390/gallery-results",
  reporter: [
    ["list"],
    ["json", { outputFile: ".work/TIE-390/gallery-results.json" }],
  ],
  // Missing baselines fail. Updates must be captured as ignored candidates and reviewed.
  updateSnapshots: "none",
  snapshotPathTemplate: "{testDir}/goldens/{arg}{ext}",
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    browserName: "chromium",
    viewport: { width: 960, height: 900 },
    deviceScaleFactor: 1,
    locale: "en-AU",
    timezoneId: "Australia/Sydney",
    colorScheme: "dark",
    reducedMotion: "reduce",
    serviceWorkers: "block",
  },
  webServer: {
    command: `bunx --bun vite --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}/__gallery/`,
    reuseExistingServer: false,
  },
});
