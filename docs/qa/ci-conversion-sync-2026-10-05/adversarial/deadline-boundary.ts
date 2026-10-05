import { chromium, expect } from "@playwright/test";
import { fillSuccessfulConversion } from "../../../../e2e/conversion";
const startedAt = new Date().toISOString();
const browser = await chromium.launch();
const context = await browser.newContext({ locale: "en-AU", timezoneId: "Australia/Sydney", viewport: { width: 900, height: 640 }, reducedMotion: "no-preference" });
const page = await context.newPage();
await page.setContent('<label for="message">Message with a date or time</label><textarea id="message"></textarea><section class="result-panel" aria-busy="false"><span class="live-indicator" data-state="ready"></span><b class="hero-time">old result</b></section>');
let error = "", assertions = 0;
const observationStartedAt = new Date().toISOString();
const began = performance.now();
try { await fillSuccessfulConversion(page, "changed text has no pending cycle", async () => { assertions++; }); } catch (failure) { error = String(failure); }
const elapsedMs = performance.now() - began;
expect(error).toContain("assertion deadline");
expect(assertions).toBe(0);
expect(elapsedMs).toBeGreaterThan(9800);
expect(elapsedMs).toBeLessThan(11500);
await page.evaluate(() => {
  document.querySelector<HTMLTextAreaElement>("#message")!.oninput = () => {
    const panel = document.querySelector(".result-panel")!;
    panel.setAttribute("aria-busy", "true");
    panel.querySelector(".hero-time")!.textContent = "recovered exact result";
    panel.setAttribute("aria-busy", "false");
  };
});
await fillSuccessfulConversion(page, "another changed text", remaining => expect(page.locator(".hero-time")).toHaveText("recovered exact result", { timeout: remaining() }));
await Bun.write("docs/qa/ci-conversion-sync-2026-10-05/adversarial/deadline-boundary.json", JSON.stringify({ startedAt, observationStartedAt, endedAt: new Date().toISOString(), elapsedMs, assertions, error, recovered: true, browser: browser.version(), defaultDeadlineMs: 10000 }, null, 2));
await context.close();
await browser.close();
