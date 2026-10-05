import { createHash } from "node:crypto";
import { test, expect } from "./fixtures";
import { enterZone } from "./choices";

test("a deferred manual-copy focus frame cannot steal a new target fill", async ({
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
        record("armed");
      },
      snapshot() {
        return {
          held: !!held,
          active: owner(),
          targetValue: (
            document.getElementById("target-zone") as HTMLInputElement | null
          )?.value,
          manualVisible: !!document.getElementById("manual-copy"),
          events: [...events],
          motion: matchMedia("(prefers-reduced-motion: reduce)").matches,
        };
      },
      cleanup() {
        if (held) nativeCancel(held.id);
        held = null;
        armed = false;
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
      // The app's deferred copy callback contains exactly these two ref calls.
      // Match its methods rather than a minifier-specific ref name; all other
      // animation/React Aria callbacks remain on the native scheduler.
      const copyFrame =
        armed &&
        source.length < 200 &&
        /\.current\?\.focus\(\)/.test(source) &&
        /\.current\?\.select\(\)/.test(source);
      if (!copyFrame) return nativeFrame(callback);
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
          if (event === "focusin" && target === "target-zone" && held) {
            const frame = held;
            held = null;
            record("release-at-target-focus", target);
            frame.callback(frame.time);
            record("after-copy-frame-release", target);
          }
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
    const target = page.getByLabel("Convert to", { exact: true });
    await target.fill("CST");
    const afterFill = await page.evaluate(() =>
      (window as any).__copyFocusProbe.snapshot(),
    );
    expect.soft(afterFill.active).toBe("target-zone");
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
    await info.attach("copy-focus-observation", {
      body: Buffer.from(
        JSON.stringify(
          { began, ended: new Date().toISOString(), baseURL, assets, probe },
          null,
          2,
        ),
      ),
      contentType: "application/json",
    });
    await page
      .evaluate(() => (window as any).__copyFocusProbe.cleanup())
      .catch(() => undefined);
  }
});
