import base from "../../../playwright.config";
import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";
const root = resolve(import.meta.dir, "../../..");
const output = resolve(import.meta.dir, "whole-suite", process.env.CI_RENDER_BLOCK!);
export default defineConfig({
  ...base,
  testDir: resolve(root, "e2e"),
  retries: 0,
  workers: 4,
  outputDir: resolve(output, "results"),
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: resolve(output, "html") }],
    [resolve(root, "e2e/attempt-reporter.ts")],
    ["json", { outputFile: resolve(output, "report.json") }],
  ],
  webServer: { ...base.webServer as any, cwd: root },
});
