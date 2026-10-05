import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { test, expect } from "./fixtures";
import { enterZone } from "./choices";

test("a deferred manual-copy focus frame cannot steal a new target keyboard edit", async ({
  page,
  baseURL,
}, info) => {
  const began = new Date().toISOString();
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
  const assets: { path: string; bytes: number; sha256: string }[] = [];
  try {
    await page.goto("/");
    await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
    const paths = await page
      .locator("script[src],link[rel=stylesheet]")
      .evaluateAll((elements) =>
        elements.map((element) =>
          element.tagName === "SCRIPT"
            ? (element as HTMLScriptElement).src
            : (element as HTMLLinkElement).href,
        ),
      );
    for (const url of paths) {
      const response = await page.request.get(url);
      const bytes = await response.body();
      assets.push({
        path: new URL(url).pathname,
        bytes: bytes.length,
        sha256: createHash("sha256").update(bytes).digest("hex"),
      });
    }
    await enterZone(page, "UTC");
    await page
      .getByLabel("Message with a date or time")
      .fill("April 9, 2026 3pm UTC");
    await expect(page.locator(".hero-time")).toContainText(/3:00 pm/i);
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
    const target = page.getByLabel("Convert to", { exact: true });
    await target.click();
    await expect(target).toBeFocused();
    await page.keyboard.press("ControlOrMeta+A");
    await page.evaluate(() => (window as any).__copyFocusProbe.release());
    const afterFrame = await page.evaluate(() =>
      (window as any).__copyFocusProbe.snapshot(),
    );
    expect.soft(afterFrame.active).toBe("target-zone");
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
  } finally {
    const probe = await page
      .evaluate(() => (window as any).__copyFocusProbe.snapshot())
      .catch(() => ({ unavailable: true }));
    const observation = info.outputPath("copy-focus-observation.json");
    mkdirSync(dirname(observation), { recursive: true });
    writeFileSync(
      observation,
      JSON.stringify(
        { began, ended: new Date().toISOString(), baseURL, assets, probe },
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
  }
});
