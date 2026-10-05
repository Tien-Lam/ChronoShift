import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "retention.spec.ts",
  outputDir: "/tmp/chronoshift-ci-retention-results",
  retries: 1,
  workers: 1,
  reporter: [
    ["list"],
    ["../../../e2e/attempt-reporter.ts"],
  ],
  use: { screenshot: "only-on-failure", trace: "on-first-retry" },
});
