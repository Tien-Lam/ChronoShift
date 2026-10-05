import base from "../../../playwright.config";
import { defineConfig } from "@playwright/test";
import { resolve } from "node:path";
const root = resolve(import.meta.dir, "../../..");
const output = resolve(
  import.meta.dir,
  "controls",
  process.env.ZONE_CONTROL_BLOCK!,
);
export default defineConfig({
  ...base,
  testDir: resolve(root, "e2e"),
  testMatch: "**/controls.spec.ts",
  grep: process.env.ZONE_CONTROL_GREP
    ? new RegExp(process.env.ZONE_CONTROL_GREP)
    : undefined,
  projects: base.projects!.filter((project) => project.name !== "foldable"),
  workers: 4,
  retries: 0,
  globalSetup: resolve(import.meta.dir, "verify-served.ts"),
  outputDir: resolve(output, "results"),
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: resolve(output, "html") }],
    [resolve(root, "e2e/attempt-reporter.ts")],
    ["json", { outputFile: resolve(output, "report.json") }],
  ],
  webServer: { ...(base.webServer as any), cwd: root },
});
