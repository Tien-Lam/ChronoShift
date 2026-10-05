import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
const output = fileURLToPath(new URL("./retention-results", import.meta.url));
export default defineConfig({
  testDir: ".",
  testMatch: "retention.spec.ts",
  retries: 1,
  workers: 1,
  reporter: [
    ["list"],
    [
      fileURLToPath(
        new URL("../../../../e2e/attempt-reporter.ts", import.meta.url),
      ),
    ],
  ],
  use: { screenshot: "only-on-failure", trace: "on-first-retry" },
  outputDir: output,
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
