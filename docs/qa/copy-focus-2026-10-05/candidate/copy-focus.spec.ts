import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import { enterZone } from "./choices";

async function installCopyFocusProbe(page: Page) {
  await page.addInitScript(() => {
    const nativeFrame = window.requestAnimationFrame.bind(window);
    const nativeCancel = window.cancelAnimationFrame.bind(window);
    const events: object[] = [];
    let held: {
      callback: FrameRequestCallback;
      time: number;
      id: number;
    } | null = null;
    let armed = false;
    let collecting = false;
    let matchingFrames = 0;
    let rememberedOwner: Element | null = null;
    let deferred = false;
    let rejectPending: ((error: Error) => void) | null = null;
    const owner = () => {
      const element = document.activeElement;
      if (element?.id === "target-zone") return "target-zone";
      if (element?.id === "manual-copy") return "manual-copy";
      if (element?.matches("button.copy-button")) return "copy-button";
      if (element?.matches("summary")) return "summary";
      if (element === document.body) return "body";
      return "other";
    };
    const record = (event: string, target?: string) => {
      if (events.length < 100)
        events.push({ event, target, active: owner(), at: performance.now() });
    };
    const state = {
      deferNextCopy() {
        deferred = true;
      },
      rejectPendingCopy() {
        if (!rejectPending) throw new Error("No pending controlled copy");
        const reject = rejectPending;
        rejectPending = null;
        record("late-copy-rejection");
        reject(new Error("Delayed manual copy test"));
      },
      rememberOwner() {
        rememberedOwner = document.activeElement;
      },
      restoreOwner() {
        if (!(rememberedOwner instanceof HTMLElement))
          throw new Error("No remembered owner");
        rememberedOwner.focus();
      },
      arm() {
        armed = true;
        collecting = true;
        matchingFrames = 0;
        record("armed");
      },
      snapshot() {
        return {
          held: !!held,
          matchingFrames,
          active: owner(),
          sameRememberedOwner: document.activeElement === rememberedOwner,
          targetValue: (
            document.getElementById("target-zone") as HTMLInputElement | null
          )?.value,
          manualVisible: !!document.getElementById("manual-copy"),
          events: [...events],
          motion: matchMedia("(prefers-reduced-motion: reduce)").matches,
        };
      },
      release() {
        return new Promise<void>((resolve) => {
          const frame = held;
          held = null;
          collecting = false;
          if (!frame) {
            record("copy-frame-already-cancelled");
            resolve();
            return;
          }
          // Release on a real native frame after the target's complete focus
          // dispatch. App capture listeners see the new intent first.
          nativeFrame((time) => {
            record("release-after-target-focus");
            frame.callback(time);
            record("after-copy-frame-release");
            resolve();
          });
        });
      },
      cleanup() {
        if (held) nativeCancel(held.id);
        held = null;
        armed = false;
        collecting = false;
        window.requestAnimationFrame = nativeFrame;
        window.cancelAnimationFrame = nativeCancel;
      },
    };
    (window as any).__copyFocusProbe = state;
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () => {
          record("clipboard-write-called");
          if (deferred) {
            deferred = false;
            record("clipboard-write-pending");
            return new Promise<void>((_, reject) => {
              rejectPending = reject;
            });
          }
          record("clipboard-write-rejected");
          return Promise.reject(new Error("Manual copy test"));
        },
      },
    });
    window.requestAnimationFrame = (callback) => {
      const source = Function.prototype.toString.call(callback);
      // Collect matching methods during this copy only; allow candidate guards
      // and local element variables without depending on minified ref names.
      // Every nonmatching callback remains on the native scheduler.
      const copyFrame = /\.focus\(/.test(source) && /\.select\(/.test(source);
      if (!collecting || !copyFrame) return nativeFrame(callback);
      matchingFrames++;
      record("matching-copy-frame");
      if (!armed) return nativeFrame(callback);
      armed = false;
      record("copy-frame-registered");
      const id = nativeFrame((time) => {
        held = { callback, time, id };
        record("copy-frame-held");
      });
      return id;
    };
    window.cancelAnimationFrame = (id) => {
      nativeCancel(id);
      if (held?.id === id) {
        record("copy-frame-cancelled");
        held = null;
      }
    };
    for (const event of ["focusin", "focusout", "beforeinput", "input"]) {
      document.addEventListener(
        event,
        (e) => {
          const element = e.target as HTMLElement;
          const target =
            element.id === "target-zone"
              ? "target-zone"
              : element.id === "manual-copy"
                ? "manual-copy"
                : "other";
          if (target !== "other") record(event, target);
        },
        true,
      );
    }
  });
}

const journeyStarts = new WeakMap<Page, string>();
test.beforeEach(async ({ page }) => {
  journeyStarts.set(page, new Date().toISOString());
  await installCopyFocusProbe(page);
});
test.afterEach(async ({ page, baseURL }, info) => {
  const began = journeyStarts.get(page);
  const assets: { path: string; bytes: number; sha256: string }[] = [];
  const paths = await page
    .locator("script[src],link[rel=stylesheet]")
    .evaluateAll((elements) =>
      elements.map((element) =>
        element.tagName === "SCRIPT"
          ? (element as HTMLScriptElement).src
          : (element as HTMLLinkElement).href,
      ),
    )
    .catch(() => []);
  for (const url of paths) {
    const response = await page.request.get(url);
    const bytes = await response.body();
    assets.push({
      path: new URL(url).pathname,
      bytes: bytes.length,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    });
  }
  const probe = await page
    .evaluate(() => (window as any).__copyFocusProbe.snapshot())
    .catch(() => ({ unavailable: true }));
  const browserEnvironment = await page
    .evaluate(() => ({
      url: location.href,
      userAgent: navigator.userAgent,
      locale: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      raster: devicePixelRatio,
    }))
    .catch(() => ({ unavailable: true }));
  const observation = info.outputPath("copy-focus-observation.json");
  mkdirSync(dirname(observation), { recursive: true });
  writeFileSync(
    observation,
    JSON.stringify(
      {
        began,
        ended: new Date().toISOString(),
        baseURL,
        assets,
        probe,
        browserEnvironment,
        viewport: page.viewportSize(),
      },
      null,
      2,
    ),
  );
  await info.attach("copy-focus-observation", {
    path: observation,
    contentType: "application/json",
  });
  await page
    .evaluate(() => (window as any).__copyFocusProbe.cleanup())
    .catch(() => undefined);
});

async function seed(page: Page) {
  await page.goto("/");
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  await enterZone(page, "UTC");
  await page
    .getByLabel("Message with a date or time")
    .fill("April 9, 2026 3pm UTC");
  await expect(page.locator(".hero-time")).toContainText(/3:00 pm/i);
}
async function holdFallback(page: Page) {
  await page.evaluate(() => (window as any).__copyFocusProbe.arm());
  await page.getByRole("button", { name: "Copy UTC", exact: true }).click();
  await expect(page.getByLabel("Text to copy")).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).__copyFocusProbe.snapshot().held),
    )
    .toBe(true);
  expect(
    await page.evaluate(
      () => (window as any).__copyFocusProbe.snapshot().matchingFrames,
    ),
  ).toBe(1);
}

async function release(page: Page) {
  await page.evaluate(() => (window as any).__copyFocusProbe.release());
}
async function rememberOwner(page: Page) {
  await page.evaluate(() => (window as any).__copyFocusProbe.rememberOwner());
}
async function expectOwnerRetained(page: Page) {
  expect(
    await page.evaluate(
      () => (window as any).__copyFocusProbe.snapshot().sameRememberedOwner,
    ),
  ).toBe(true);
}

test("a deferred manual-copy focus frame cannot steal a new target keyboard edit", async ({
  page,
}) => {
  await seed(page);
  await holdFallback(page);
  const target = page.getByLabel("Convert to", { exact: true });
  await target.click();
  await expect(target).toBeFocused();
  await page.keyboard.press("ControlOrMeta+A");
  await release(page);
  expect
    .soft(
      await page.evaluate(
        () => (window as any).__copyFocusProbe.snapshot().active,
      ),
    )
    .toBe("target-zone");
  // A physical keyboard insertion does not reacquire focus after the frame.
  await page.keyboard.insertText("CST");
  await target.press("Tab");
  await expect(target).toHaveValue("CST");
  await expect(page.locator(".result")).toHaveCount(0);
  await expect(page.getByLabel("Text to copy")).toHaveCount(0);
  await expect(page.getByRole("alert")).toContainText("Choose a timezone");
  await enterZone(page, "Asia/Tokyo");
  await expect(page.locator(".hero-time")).toContainText(/12:00 am/i);
  await expect(page.locator(".result-date")).toContainText(/10 Apr/);
  await expect(page.locator(".source-label")).toHaveText("UTC");
  await page.getByRole("button", { name: "Copy UTC", exact: true }).click();
  await expect(page.getByLabel("Text to copy")).toHaveValue(
    /UTC\+09:00.*Tokyo/s,
  );
});

test("an unchanged copy owner still receives selected manual fallback text", async ({
  page,
}) => {
  await seed(page);
  await holdFallback(page);
  await release(page);
  const manual = page.getByLabel("Text to copy");
  await expect(manual).toBeFocused();
  expect(
    await manual.evaluate((element: HTMLTextAreaElement) => ({
      start: element.selectionStart,
      end: element.selectionEnd,
      length: element.value.length,
    })),
  ).toEqual({
    start: 0,
    end: (await manual.inputValue()).length,
    length: (await manual.inputValue()).length,
  });
});

test("focus-only handoff is retained before any value changes", async ({
  page,
}) => {
  await seed(page);
  await holdFallback(page);
  const target = page.getByLabel("Convert to", { exact: true });
  await target.focus();
  await release(page);
  await expect(target).toBeFocused();
  await expect(target).toHaveValue("UTC");
  await expect(page.getByLabel("Text to copy")).toBeVisible();
});

test("focus away and back does not revive the older copy frame", async ({
  page,
}) => {
  await seed(page);
  await page.getByRole("button", { name: "Copy UTC", exact: true }).focus();
  await holdFallback(page);
  await rememberOwner(page);
  await page.getByLabel("Convert to", { exact: true }).focus();
  // Return to the exact original owner, not merely the same owner label.
  await page.evaluate(() => (window as any).__copyFocusProbe.restoreOwner());
  await expectOwnerRetained(page);
  await release(page);
  await expectOwnerRetained(page);
});

test("same-owner keyboard intent keeps the newer owner", async ({ page }) => {
  await seed(page);
  await holdFallback(page);
  await rememberOwner(page);
  await page.keyboard.press("Shift");
  await release(page);
  await expectOwnerRetained(page);
});

test("same-owner pointer intent keeps the newer owner", async ({ page }) => {
  await seed(page);
  const copy = page.getByRole("button", { name: "Copy UTC", exact: true });
  await copy.focus();
  await holdFallback(page);
  await rememberOwner(page);
  const box = await copy.boundingBox();
  if (!box) throw new Error("Copy has no visible bounds");
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  try {
    await release(page);
    await expectOwnerRetained(page);
  } finally {
    await page.mouse.up();
  }
});

test("a newer copy request makes the older held frame inert", async ({
  page,
}) => {
  await seed(page);
  await holdFallback(page);
  await page.getByRole("button", { name: "Copy UTC", exact: true }).click();
  await expect(page.getByLabel("Text to copy")).toBeFocused();
  await rememberOwner(page);
  await release(page);
  await expectOwnerRetained(page);
  await expect(page.getByLabel("Text to copy")).toBeVisible();
});

test("late clipboard rejection cannot restore a fallback invalidated by a target edit", async ({
  page,
}) => {
  await seed(page);
  await page.evaluate(() => (window as any).__copyFocusProbe.deferNextCopy());
  await page.getByRole("button", { name: "Copy UTC", exact: true }).click();
  await enterZone(page, "CST");
  await page.evaluate(() =>
    (window as any).__copyFocusProbe.rejectPendingCopy(),
  );
  await expect(page.getByLabel("Convert to", { exact: true })).toHaveValue(
    "CST",
  );
  await expect(page.locator(".result")).toHaveCount(0);
  await expect(page.getByLabel("Text to copy")).toHaveCount(0);
  await expect(page.getByRole("alert")).toContainText("Choose a timezone");
});
