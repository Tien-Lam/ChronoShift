import { chromium, firefox, webkit, expect } from "@playwright/test";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const scratch = "/tmp/chronoshift-ci-critical";
const output = join(
  root,
  "docs/qa/ci-critical-path-2026-10-05/cold-probe.json",
);
const started = new Date().toISOString();
const rows: object[] = [];
const hashes: Record<string, object[]> = {};
async function inventory(dir: string, prefix = ""): Promise<object[]> {
  const entries: object[] = [];
  for (const entry of await readdir(join(dir, prefix), {
    withFileTypes: true,
  })) {
    const relative = join(prefix, entry.name);
    if (entry.isDirectory()) entries.push(...(await inventory(dir, relative)));
    else if (entry.isFile()) {
      const bytes = await readFile(join(dir, relative));
      entries.push({
        path: relative,
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      });
    } else throw new Error("Unexpected source member " + relative);
  }
  return entries;
}
for (const version of ["baseline", "candidate"]) {
  hashes[version] = await inventory(join(scratch, version + "-runtime/dist"));
}
let active: ReturnType<typeof Bun.spawn> | undefined;
async function stop() {
  active?.kill("SIGTERM");
  if (active) await active.exited;
  active = undefined;
}
async function server(version: string) {
  active = Bun.spawn(["bun", join(root, "scripts/serve-web.ts")], {
    cwd: join(scratch, version + "-runtime"),
    env: {
      ...process.env,
      PORT: "0",
      BASE_PATH: "/",
      CHRONOSHIFT_TEST_SERVER: "0",
    },
    stdout: "pipe",
    stderr: "inherit",
  });
  const reader = active.stdout.getReader();
  let text = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) throw new Error("Server exited before origin");
    text += new TextDecoder().decode(value);
    const match = text.match(/http:\/\/127\.0\.0\.1:\d+\//);
    if (match) {
      reader.releaseLock();
      return match[0];
    }
  }
}
try {
  for (const [phase, version] of [
    "baseline",
    "candidate",
    "candidate",
    "baseline",
  ].entries()) {
    const url = await server(version);
    for (const [engine, type] of Object.entries({
      chromium,
      firefox,
      webkit,
    })) {
      const browser = await type.launch();
      try {
        for (let sample = 0; sample < 6; sample++) {
          const context = await browser.newContext({
            locale: "en-AU",
            timezoneId: "Australia/Sydney",
            viewport: { width: 900, height: 640 },
            deviceScaleFactor: 1,
          });
          const page = await context.newPage();
          const errors: string[] = [];
          page.on("pageerror", (error) => errors.push(error.message));
          const began = new Date().toISOString();
          const start = performance.now();
          await page.goto(url);
          await expect(page.locator("main")).toHaveAttribute(
            "data-offline-ready",
            "true",
          );
          const readyMs = performance.now() - start;
          const navigation = await page.evaluate(() => {
            const nav = performance.getEntriesByType(
              "navigation",
            )[0] as PerformanceNavigationTiming;
            return {
              domInteractive: nav.domInteractive,
              domComplete: nav.domComplete,
              loadEventEnd: nav.loadEventEnd,
            };
          });
          const convertStart = performance.now();
          await page
            .getByLabel("Message with a date or time")
            .fill("April 9, 2026 3pm UTC");
          await expect(page.locator(".hero-time")).toHaveText(/1:00 am/i);
          await expect(page.locator(".result-date")).toHaveText(
            /10 April? 2026/,
          );
          const firstConversionMs = performance.now() - convertStart;
          const openStart = performance.now();
          await page.getByText("More options", { exact: true }).press("Enter");
          await expect(
            page.getByLabel("Source timezone when none is given", {
              exact: true,
            }),
          ).toBeVisible();
          const firstOpenMs = performance.now() - openStart;
          const field = page.getByLabel("Source timezone when none is given", {
            exact: true,
          });
          await field.fill("Asia/Tokyo");
          await field.press("Tab");
          await expect(field).toHaveValue("Asia/Tokyo");
          await page.getByText("More options", { exact: true }).press("Enter");
          await expect(field).toBeHidden();
          await page.getByText("More options", { exact: true }).press("Enter");
          await expect(field).toHaveValue("Asia/Tokyo");
          expect(errors).toEqual([]);
          rows.push({
            phase,
            version,
            engine,
            browserVersion: browser.version(),
            sample,
            url,
            began,
            ended: new Date().toISOString(),
            readyMs,
            navigation,
            firstConversionMs,
            firstOpenMs,
            script: await page
              .locator("script[type=module]")
              .getAttribute("src"),
            errors,
          });
          await context.close();
        }
      } finally {
        await browser.close();
      }
    }
    await stop();
    console.log(JSON.stringify({ phase, version, completedRows: rows.length }));
  }
} finally {
  await stop();
  await writeFile(
    output,
    JSON.stringify(
      {
        started,
        ended: new Date().toISOString(),
        environment: {
          bun: Bun.version,
          platform: process.platform,
          arch: process.arch,
        },
        order: "ABBA; six fresh contexts per browser/phase",
        hashes,
        rows,
        gaps: [
          "Local macOS ARM desktop 1x profiles, not Linux CI or physical phones",
          "Root base, fresh caches, no faults; readyness locator includes assertion observation delay",
          "Build release identifier is the base SHA in both artifacts; file inventories distinguish actual candidate bytes",
        ],
      },
      null,
      2,
    ),
  );
}
