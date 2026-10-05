import { chromium, firefox, webkit, expect, type Page } from "@playwright/test";
import { fillSuccessfulConversion } from "../../../../e2e/conversion";
import { writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { enterZone } from "../../../../e2e/choices";

const output = new URL("lifecycle-results.json", import.meta.url);
const start = new Date().toISOString();
const head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const helperHash = createHash("sha256").update(await Bun.file("e2e/conversion.ts").text()).digest("hex");
const results: object[] = [];
const modes = ["coalesced", "error", "pending-timeout", "idle-timeout", "removed", "pagehide", "action-rejection", "assertion-rejection", "delayed-wrong-oracle"];

for (const [name, engine] of Object.entries({ chromium, firefox, webkit })) {
  const browser = await engine.launch();
  try {
    for (const mode of modes) {
      const context = await browser.newContext({ locale: "en-AU", timezoneId: "Australia/Sydney", viewport: { width: 900, height: 640 }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
      const page = await context.newPage();
      const pageErrors: string[] = [];
      page.on("pageerror", (e) => pageErrors.push(e.message));
      await page.setContent('<label for="message">Message with a date or time</label><textarea id="message"></textarea><section class="result-panel" aria-busy="false"><span class="live-indicator" data-state="ready"></span><div class="hero-time">old</div></section>');
      await page.evaluate((mode) => {
        const state = window as any;
        const observers = new Set<MutationObserver>();
        const timers = new Set<number>();
        const Native = MutationObserver;
        window.MutationObserver = class extends Native {
          observe(...args: Parameters<MutationObserver["observe"]>) { observers.add(this); return super.observe(...args); }
          disconnect() { observers.delete(this); super.disconnect(); }
        };
        const nativeSet = window.setTimeout.bind(window);
        const nativeClear = window.clearTimeout.bind(window);
        window.setTimeout = ((callback: TimerHandler, ms?: number, ...args: any[]) => {
          const id = nativeSet(() => { timers.delete(id); if (typeof callback === "function") callback(...args); }, ms);
          timers.add(id);
          return id;
        }) as typeof setTimeout;
        window.clearTimeout = ((id?: number) => { if (id !== undefined) timers.delete(id); nativeClear(id); }) as typeof clearTimeout;
        state.lifecycleCounts = () => ({ observers: observers.size, timers: timers.size });
        document.querySelector("#message")!.addEventListener("input", () => {
          const panel = document.querySelector(".result-panel")!;
          if (mode === "removed") { panel.remove(); return; }
          if (mode === "pagehide") { dispatchEvent(new Event("pagehide")); return; }
          if (mode === "idle-timeout") return;
          panel.setAttribute("aria-busy", "true");
          panel.querySelector(".live-indicator")!.setAttribute("data-state", "pending");
          if (mode === "pending-timeout") return;
          if (mode === "delayed-wrong-oracle") {
            setTimeout(() => {
              panel.setAttribute("aria-busy", "false");
              panel.querySelector(".live-indicator")!.setAttribute("data-state", "ready");
              panel.querySelector(".hero-time")!.textContent = "new";
            }, 160);
            return;
          }
          panel.setAttribute("aria-busy", "false");
          panel.querySelector(".live-indicator")!.setAttribute("data-state", mode === "error" ? "error" : "ready");
          panel.querySelector(".hero-time")!.textContent = "new";
        });
      }, mode);
      let callbacks = 0;
      let remaining: number | undefined;
      let failure: string | undefined;
      const actualStart = new Date().toISOString();
      const elapsedStart = performance.now();
      // Isolate action rejection without waiting for the full locator timeout.
      const actionPage = mode === "action-rejection" ? new Proxy(page, {
        get(target, property) {
          if (property === "getByLabel") return () => ({ fill: async () => { throw new Error("synthetic-action-rejection"); } });
          const value = Reflect.get(target, property, target);
          return typeof value === "function" ? value.bind(target) : value;
        },
      }) as Page : page;
      try {
        await fillSuccessfulConversion(actionPage, "synthetic-new-text", async (timeout) => {
          callbacks++;
          remaining = timeout();
          if (mode === "assertion-rejection") throw new Error("synthetic-assertion-rejection");
          await expect(page.locator(".hero-time")).toHaveText(mode === "delayed-wrong-oracle" ? "wrong-oracle" : "new", { timeout: timeout() });
        }, 200);
      } catch (e) { failure = (e as Error).message; }
      const elapsedMs = performance.now() - elapsedStart;
      const actualEnd = new Date().toISOString();
      const resources = await page.evaluate(() => (window as any).lifecycleCounts());
      const shouldPass = mode === "coalesced";
      const expectedCallbacks = ["coalesced", "assertion-rejection", "delayed-wrong-oracle"].includes(mode) ? 1 : 0;
      const deadlineBounded = !["pending-timeout", "idle-timeout", "delayed-wrong-oracle"].includes(mode) || elapsedMs < 500;
      const passed = (!!failure !== shouldPass) && callbacks === expectedCallbacks && resources.observers === 0 && resources.timers === 0 && pageErrors.length === 0 && deadlineBounded;
      results.push({ engine: name, version: browser.version(), mode, actualStart, actualEnd, elapsedMs, failure, callbacks, remaining, resources, pageErrors, deadlineBounded, passed });
      await context.close();
    }
    const context = await browser.newContext({ locale: "en-AU", timezoneId: "Australia/Sydney", viewport: { width: 900, height: 640 }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
    const page = await context.newPage();
    const pageErrors: string[] = [];
    page.on("pageerror", (e) => pageErrors.push(e.message));
    const actualStart = new Date().toISOString();
    await page.goto("http://127.0.0.1:4322/");
    await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
    await enterZone(page, "UTC");
    await fillSuccessfulConversion(page, "June 18, 2026 at 5:20pm in Tokyo", (remaining) => expect(page.locator(".hero-time")).toHaveText(/8:20 am/i, { timeout: remaining() }));
    await expect(page.locator(".result-date")).toHaveText(/18 Jun(?:e)? 2026/);
    await expect(page.locator(".result-zone")).toContainText("UTC");
    await expect(page.locator(".result")).toHaveCount(1);
    results.push({ engine: name, version: browser.version(), mode: "production-real-worker", actualStart, actualEnd: new Date().toISOString(), pageErrors, passed: pageErrors.length === 0 });
    await context.close();
  } finally { await browser.close(); }
}

const helperHashAfter = createHash("sha256").update(await Bun.file("e2e/conversion.ts").text()).digest("hex");
writeFileSync(output, JSON.stringify({ start, end: new Date().toISOString(), head, helperHash, helperHashAfter, environment: { platform: process.platform, arch: process.arch, bun: Bun.version, concurrency: 1, normalMotion: true }, results }, null, 2));
if (helperHashAfter !== helperHash) throw new Error("Helper changed during probe; preserve results");
if (results.some((r: any) => !r.passed)) throw new Error("Lifecycle probe failed; preserve results");
console.log(`Lifecycle probe: ${results.length} cases passed`);
