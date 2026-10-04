import { chromium, firefox, webkit, expect } from "@playwright/test";
import type { Browser, Page } from "@playwright/test";
import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";

// Deliberately separate from CI: timing on a named device is evidence, not a
// shared-runner correctness gate. Uses the production page and disposable worker.
const engines = { chromium, firefox, webkit };
const requested = Bun.argv[2] || "chromium";
if (!(requested in engines))
  throw new Error("Choose chromium, firefox or webkit");
const engine = engines[requested as keyof typeof engines];
const output = Bun.argv[3] || "docs/planning/browser-performance-baseline.json";
async function inventory(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      return entry.isDirectory() ? inventory(path) : Promise.resolve([path]);
    }),
  );
  return nested.flat();
}
function summary(samples: number[]) {
  const sorted = [...samples].sort((a, b) => a - b);
  return {
    runs: sorted.length,
    p50Ms: +sorted[Math.floor(sorted.length * 0.5)].toFixed(2),
    p95Ms: +sorted[Math.ceil(sorted.length * 0.95) - 1].toFixed(2),
    maxMs: +sorted.at(-1)!.toFixed(2),
  };
}
const child = spawn("bun", ["scripts/serve-web.ts"], {
  env: {
    ...process.env,
    PORT: "0",
    BASE_PATH: "/",
    CHRONOSHIFT_TEST_SERVER: "0",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let stopped = false;
async function stop() {
  if (
    stopped ||
    child.exitCode !== null ||
    child.signalCode !== null ||
    !child.pid
  )
    return;
  stopped = true;
  const done = new Promise<void>((resolve) =>
    child.once("close", () => resolve()),
  );
  child.kill("SIGTERM");
  await done;
}
let browser: Browser | undefined;
try {
  const url = await new Promise<string>((resolve, reject) => {
    let log = "";
    child.stdout.on("data", (chunk) => {
      log += chunk;
      const match = log.match(/http:\/\/127\.0\.0\.1:\d+\//);
      if (match) resolve(match[0]);
    });
    child.once("error", reject);
    child.once("exit", (code) => reject(new Error(`Preview exited: ${code}`)));
  });
  browser = await engine.launch();
  const options = {
    locale: "en-AU",
    timezoneId: "Australia/Sydney",
    viewport: { width: 390, height: 844 },
  };
  const cold = [],
    ready = [];
  for (let i = 0; i < 10; i++) {
    const fresh = await browser.newContext(options),
      page = await fresh.newPage();
    const start = performance.now();
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("button", { name: "Convert", exact: true }),
    ).toBeVisible();
    cold.push(performance.now() - start);
    await expect(
      page.getByText("Offline ready", { exact: true }),
    ).toBeVisible();
    ready.push(performance.now() - start);
    await fresh.close();
  }
  const context = await browser.newContext(options),
    page = await context.newPage();
  await page.goto(url);
  await expect(page.getByText("Offline ready", { exact: true })).toBeVisible();
  const release = await (
    await context.request.get(url + "release.json")
  ).json();
  async function measure(page: Page, text: string) {
    await page.getByLabel("Message with a date or time").fill(text);
    await page.evaluate(() => {
      (window as any).__benchmarkDone = new Promise((resolve, reject) => {
        document.addEventListener(
          "click",
          () => {
            const start = performance.now(),
              region = document.querySelector(".result-panel")!;
            let busy = false,
              frame = 0,
              previous = start,
              maxGap = 0;
            const tick = (now: number) => {
              maxGap = Math.max(maxGap, now - previous);
              previous = now;
              frame = requestAnimationFrame(tick);
            };
            frame = requestAnimationFrame(tick);
            const timer = setTimeout(() => {
              observer.disconnect();
              cancelAnimationFrame(frame);
              reject(new Error("Conversion timeout"));
            }, 15000);
            const observer = new MutationObserver(() => {
              if (region.getAttribute("aria-busy") === "true") busy = true;
              else if (busy) {
                observer.disconnect();
                clearTimeout(timer);
                cancelAnimationFrame(frame);
                resolve({
                  elapsed: performance.now() - start,
                  maxFrameGap: Math.max(maxGap, performance.now() - previous),
                });
              }
            });
            observer.observe(region, {
              attributes: true,
              childList: true,
              subtree: true,
            });
          },
          { capture: true, once: true },
        );
      });
    });
    await page.getByRole("button", { name: "Convert", exact: true }).click();
    const timing = (await page.evaluate(
      () => (window as any).__benchmarkDone,
    )) as { elapsed: number; maxFrameGap: number };
    await expect(page.locator(".result").first()).toBeVisible();
    await expect(page.locator(".message.error")).toHaveCount(0);
    return timing;
  }
  const phrase = "April 9, 2026 3pm EST; tomorrow at 9am in Tokyo. ";
  const workloads = [2000, 10000].map((length) => ({
    name: `meeting-${length}`,
    text: phrase.repeat(Math.floor(length / phrase.length)).padEnd(length, " "),
    budget: length === 2000 ? 250 : 1000,
  }));
  workloads.push({
    name: "noisy-10000",
    text:
      "build 1.2.3 ID 12345678 price $123; ".repeat(400).slice(0, 9978) +
      " April 9, 2026 3pm UTC",
    budget: 1000,
  });
  const conversions = [];
  for (const design of ["command"]) {
    for (const workload of workloads) {
      const samples = [],
        gaps = [];
      for (let i = 0; i < 35; i++) {
        const timing = await measure(page, workload.text);
        if (i >= 5) {
          samples.push(timing.elapsed);
          gaps.push(timing.maxFrameGap);
        }
      }
      const conversion = summary(samples);
      conversions.push({
        design,
        workload: workload.name,
        characters: workload.text.length,
        conversion,
        maxFrameGap: summary(gaps),
        provisionalBudgetMs: workload.budget,
        meetsBudgetOnThisMachine: conversion.p95Ms < workload.budget,
      });
    }
  }
  await page.close();
  await stop();
  if (requested !== "webkit") await context.setOffline(true);
  await expect(
    context.request.get(url + "uncached", { timeout: 2000 }),
  ).rejects.toThrow();
  const offline = [];
  for (let i = 0; i < 10; i++) {
    const reopened = await context.newPage(),
      start = performance.now();
    await reopened.goto(url, { waitUntil: "domcontentloaded" });
    await expect(
      reopened.getByRole("button", { name: "Convert", exact: true }),
    ).toBeVisible();
    offline.push(performance.now() - start);
    await measure(reopened, "April 10, 2026 10am UTC");
    await reopened.close();
  }
  const offlineAssets = await Promise.all(
    (await inventory("dist")).sort().map(async (path) => {
      const bytes = await Bun.file(path).bytes();
      return {
        name: relative("dist", path).replaceAll("\\", "/"),
        bytes: bytes.length,
        gzipBytes: Bun.gzipSync(bytes).length,
      };
    }),
  );
  // Preserve the original JS/CSS-only fields for comparison with older reports.
  const assets = offlineAssets
    .filter((asset) => /^assets\/[^/]+\.(js|css)$/.test(asset.name))
    .map((asset) => ({ ...asset, name: asset.name.slice("assets/".length) }));
  const report = {
    measuredAt: new Date().toISOString(),
    release,
    environment: `${process.platform}/${process.arch}, ${requested} ${browser.version()}, Bun ${Bun.version}`,
    device:
      "Development computer, 390×844 CSS-pixel viewport. No mobile hardware, CPU or network emulation.",
    method:
      "Ten fresh browser contexts for cold local HTTP navigation, ten offline cached reopenings; Playwright wall-clock navigation-to-visible-form/complete-cache includes automation overhead. Five warmups + thirty timed conversions per Glass Command workload use the production disposable worker and real result DOM; click capture to DOM completion includes worker startup, parsing and rendering. Frame gaps are diagnostic, not an input responsiveness certification. Local gzip estimates exclude HTTP headers. assets/totalGzipBytes cover only top-level dist/assets JS/CSS; offlineAssets/totalOfflineGzipBytes cover every final dist file including HTML, manifests, icons, notices, release metadata and the service worker. Fixed synthetic workloads are not worst-case proof.",
    assets,
    totalGzipBytes: assets.reduce((sum, asset) => sum + asset.gzipBytes, 0),
    offlineAssets,
    totalOfflineGzipBytes: offlineAssets.reduce(
      (sum, asset) => sum + asset.gzipBytes,
      0,
    ),
    coldOnlineNavigationToForm: summary(cold),
    coldOnlineNavigationToOfflineReady: summary(ready),
    warmOfflineNavigationToForm: summary(offline),
    conversions,
    pending: [
      "Named physical-phone startup/conversion p95",
      "Real virtual-keyboard and Clear responsiveness",
      "Representative phone network conditions",
    ],
  };
  await Bun.write(output, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close();
  await stop();
}
