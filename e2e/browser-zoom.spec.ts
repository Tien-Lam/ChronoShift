import { test, expect } from "./fixtures";
import { choose } from "./choices";
import { chromium, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

// Chromium's ChromeZoomLevelPrefs stores default zoom by storage-partition key.
// The default partition has relative path '' -> key 'x'. This is actual browser
// page zoom in full Chromium, not CSS zoom, pinch scale or a device-scale override.
// Audited chrome/browser/ui/zoom/chrome_zoom_level_prefs.cc at Chromium revision
// 59acba6a99d42807886e27609fea33ccd91f3285; see ui-gallery.md for provenance/limits.
async function metrics(page: Page) {
  return page.evaluate(() => ({
    outer: outerWidth,
    inner: innerWidth,
    dpr: devicePixelRatio,
    pinch: visualViewport?.scale,
    cssZoom: getComputedStyle(document.documentElement).zoom,
  }));
}

test("actual Chromium browser zoom preserves narrow precision, controls and draft through window resizing", async ({
  baseURL,
}, info) => {
  test.skip(
    info.project.name !== "chromium",
    "Actual page-zoom preference is specific to full Chromium, not other engines/mobile emulation.",
  );
  const makeContext = async (factor: number, name: string) => {
    const profile = info.outputPath(name);
    await mkdir(`${profile}/Default`, { recursive: true });
    await writeFile(
      `${profile}/Default/Preferences`,
      JSON.stringify({
        partition: {
          default_zoom_level: { x: Math.log(factor) / Math.log(1.2) },
        },
      }),
    );
    return chromium.launchPersistentContext(profile, {
      channel: "chromium",
      headless: true,
      viewport: null,
      // Remove the runner device preset; the browser computes DPR from page zoom.
      deviceScaleFactor: undefined,
      args: ["--window-size=1000,900"],
      locale: "en-AU",
      timezoneId: "Australia/Sydney",
      reducedMotion: "no-preference",
    });
  };
  const control = await makeContext(1, "zoom-100-profile");
  try {
    const page = await control.newPage();
    await page.goto(baseURL!);
    const m = await metrics(page);
    expect(m.outer).toBe(1000);
    expect(m.inner).toBe(1000);
    expect(m.dpr).toBe(1);
    expect(m.pinch).toBe(1);
    expect(m.cssZoom).toBe("1");
    await info.attach("actual-100-percent-control", {
      body: JSON.stringify(m),
      contentType: "application/json",
    });
  } finally {
    await control.close();
  }
  const context = await makeContext(2, "zoom-200-profile");
  try {
    await context.addInitScript(() =>
      localStorage.setItem(
        "chronoshift.preferences.v1",
        JSON.stringify({ target: "UTC", hourCycle: "24", theme: "light" }),
      ),
    );
    const page = await context.newPage();
    await page.goto(baseURL!);
    const session = await context.newCDPSession(page);
    const { windowId } = await session.send("Browser.getWindowForTarget");
    for (const physicalWidth of [560, 780, 1920, 560]) {
      await session.send("Browser.setWindowBounds", {
        windowId,
        bounds: { width: physicalWidth, height: 900 },
      });
      await expect
        .poll(() => page.evaluate(() => innerWidth))
        .toBe(physicalWidth / 2);
      const m = await metrics(page);
      expect(m.outer).toBe(physicalWidth);
      expect(m.dpr).toBe(2);
      expect(m.pinch).toBe(1);
      expect(m.cssZoom).toBe("1");
      await info.attach(`actual-200-percent-${physicalWidth}-${Date.now()}`, {
        body: JSON.stringify(m),
        contentType: "application/json",
      });
      const message = page.getByLabel("Message with a date or time");
      const text = "2026-04-09T23:59:59.123+00:00";
      if (!(await message.inputValue())) await message.fill(text);
      await expect(message).toHaveValue(text);
      await expect(page.locator(".hero-time")).toHaveText("23:59:59.123");
      const geometry = await page.locator(".result").evaluate((card) => {
        const node = card.querySelector(".time-number")!.firstChild!;
        const tops = [...node.textContent!].map((_, index) => {
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + 1);
          return range.getBoundingClientRect().top;
        });
        const copy = card
          .querySelector(".copy-button")!
          .getBoundingClientRect();
        const panel = card.closest(".result-panel")!.getBoundingClientRect();
        return {
          tops,
          copy: {
            left: copy.left,
            right: copy.right,
            width: copy.width,
            height: copy.height,
          },
          panel: { left: panel.left, right: panel.right },
        };
      });
      expect(
        Math.max(...geometry.tops) - Math.min(...geometry.tops),
      ).toBeLessThan(2);
      expect(geometry.copy.left).toBeGreaterThanOrEqual(geometry.panel.left);
      expect(geometry.copy.right).toBeLessThanOrEqual(geometry.panel.right);
      expect(geometry.copy.height).toBeGreaterThanOrEqual(44);
      for (const theme of ["light", "dark"]) {
        await page.locator(".appearance summary").click();
        await choose(page, "Theme", theme);
        await page.locator(".appearance summary").click();
        await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
        await expect(message).toHaveValue(text);
        await expect(page.locator(".hero-time")).toHaveText("23:59:59.123");
        await page.screenshot({
          path: info.outputPath(
            `actual-zoom-200-${physicalWidth}-${theme}.png`,
          ),
          fullPage: true,
        });
      }
    }
  } finally {
    await context.close();
  }
});
