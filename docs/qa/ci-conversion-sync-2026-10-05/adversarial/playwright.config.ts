import { defineConfig } from "@playwright/test";
import base from "../../../../playwright.config";
const directory = `${process.cwd()}/docs/qa/ci-conversion-sync-2026-10-05/adversarial`;
export default defineConfig({
  ...base,
  testDir: `${process.cwd()}/e2e`,
  outputDir: `${directory}/test-results`,
  workers: 3,
  retries: 0,
  reporter: [
    ["list"],
    ["json", { outputFile: `${directory}/playwright-results.json` }],
    [`${process.cwd()}/e2e/attempt-reporter.ts`, { outputFile: `${directory}/attempt-failures.json` }],
  ],
  webServer: { ...base.webServer, reuseExistingServer: true },
});
