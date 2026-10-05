import { test, expect, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const copyLogs = new WeakMap<Page, unknown[]>();
const logReads = new WeakMap<Page, Promise<void>[]>();

test.beforeEach(async ({ page }) => {
  const records: unknown[] = [],
    reads: Promise<void>[] = [];
  copyLogs.set(page, records);
  logReads.set(page, reads);
  page.on("console", (message) => {
    if (!message.text().startsWith("[ChronoShift] copy.")) return;
    reads.push(
      Promise.all(message.args().map((arg) => arg.jsonValue())).then(
        (values) => {
          records.push(values);
        },
      ),
    );
  });
  await page.addInitScript(() => {
    const state = ((window as any).copyProbe = {
      delayed: false,
      pending: [] as { resolve: () => void; reject: () => void }[],
      hold: false,
      held: undefined as FrameRequestCallback | undefined,
      released: false,
    });
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () =>
          state.delayed
            ? new Promise<void>((resolve, reject) =>
                state.pending.push({
                  resolve,
                  reject: () => reject(new Error("controlled rejection")),
                }),
              )
            : Promise.reject(new Error("controlled immediate rejection")),
      },
    });
    const nativeFrame = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) => {
      // Scheduling injection applies only to the application copy callback.
      // Other native frames, including motion/layout, continue unchanged.
      if (state.hold && String(callback).includes("copy.focus-applied")) {
        state.hold = false;
        state.held = callback;
        return 999999;
      }
      return nativeFrame(callback);
    };
    (window as any).releaseCopyFrame = () => {
      if (!state.held) throw new Error("no held copy frame");
      const callback = state.held;
      state.held = undefined;
      nativeFrame((at) => {
        callback(at);
        state.released = true;
      });
    };
  });
});

test.afterEach(async ({ page }, info) => {
  await Promise.all(logReads.get(page) || []);
  const environment = await page.evaluate(() => ({
    origin: location.origin,
    userAgent: navigator.userAgent,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    activeField: document.activeElement?.id || document.activeElement?.tagName,
  }));
  const path = info.outputPath("probe-evidence.json");
  await writeFile(
    path,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        retry: info.retry,
        status: info.status,
        environment,
        copyLogs: copyLogs.get(page) || [],
      },
      null,
      2,
    ),
  );
  await info.attach("probe-evidence", {
    path,
    contentType: "application/json",
  });
});

async function setup(page: Page, logs = false) {
  if (logs)
    await page.addInitScript(() =>
      sessionStorage.setItem("chronoshift-detailed-logs", "true"),
    );
  await page.goto("/");
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  const release = await page.request.get("/release.json");
  expect((await release.json()).sourceCommit).toBe(
    "35e11bac657a0c379fda48af9b454e674d2ea854",
  );
  const target = page.getByLabel("Convert to", { exact: true });
  await target.fill("UTC");
  await target.press("Tab");
  await expect(target).toHaveValue("UTC");
  await page
    .getByLabel("Message with a date or time")
    .fill("April 9, 2026 3pm UTC");
  await expect(page.locator(".hero-time")).toHaveText(/3:00 pm/i);
  expect(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  ).toBe(false);
}
const copy = (page: Page) =>
  page.getByRole("button", { name: "Copy UTC", exact: true });
const target = (page: Page) => page.getByLabel("Convert to", { exact: true });
async function hold(page: Page) {
  await page.evaluate(() => {
    (window as any).copyProbe.hold = true;
  });
}
async function release(page: Page) {
  await page.evaluate(() => (window as any).releaseCopyFrame());
  await page.waitForFunction(() => (window as any).copyProbe.released);
}
async function reject(page: Page, index: number) {
  await page.evaluate(
    (i) => (window as any).copyProbe.pending[i].reject(),
    index,
  );
}
async function delayed(page: Page) {
  await page.evaluate(() => {
    (window as any).copyProbe.delayed = true;
  });
}
async function settleLogs(page: Page) {
  await Promise.all(logReads.get(page) || []);
  return copyLogs.get(page) || [];
}

test("probe uninterrupted fallback selects exact copy text with diagnostics disabled", async ({
  page,
}) => {
  await setup(page);
  await copy(page).click();
  const field = page.getByLabel("Text to copy");
  await expect(field).toBeFocused();
  await expect(field).toHaveValue(
    "3:00 pm · Thu, 9 Apr 2026 · UTC\nApril 9, 2026 3pm UTC — UTC",
  );
  expect(
    await field.evaluate((el: HTMLTextAreaElement) => [
      el.selectionStart,
      el.selectionEnd,
      el.value.length,
    ]),
  ).toEqual([
    0,
    await field.inputValue().then((v) => v.length),
    await field.inputValue().then((v) => v.length),
  ]);
  expect(await settleLogs(page)).toEqual([]);
});

test("probe held native fallback frame yields to target keyboard entry and exact correction", async ({
  page,
}) => {
  await setup(page, true);
  await hold(page);
  await copy(page).click();
  await expect(page.getByLabel("Text to copy")).toBeVisible();
  await target(page).focus();
  await release(page);
  await expect(target(page)).toBeFocused();
  await target(page).press("ControlOrMeta+A");
  await page.keyboard.type("CST");
  await target(page).press("Tab");
  await expect(target(page)).toHaveValue("CST");
  await expect(page.locator(".result")).toHaveCount(0);
  await expect(page.getByLabel("Text to copy")).toHaveCount(0);
  await expect(page.getByRole("alert")).toContainText("Choose a timezone");
  await target(page).fill("Asia/Tokyo");
  await target(page).press("Tab");
  await expect(target(page)).toHaveValue("Asia/Tokyo");
  await expect(page.locator(".hero-time")).toHaveText(/12:00 am/i);
  await expect(page.locator(".result-date")).toContainText("10 Apr");
  await expect(page.locator(".source-label")).toHaveText("UTC");
  const logs = JSON.stringify(await settleLogs(page));
  expect(logs).toContain("new-interaction");
  expect(logs).not.toContain("copy.focus-applied");
  expect(logs).not.toContain("April 9, 2026 3pm UTC");
  expect(logs).not.toContain("Asia/Tokyo");
});

test("probe delayed rejection after focus-only handoff retains fallback without stealing focus", async ({
  page,
}) => {
  await setup(page, true);
  await delayed(page);
  await copy(page).click();
  await target(page).focus();
  await reject(page, 0);
  await expect(page.getByLabel("Text to copy")).toBeVisible();
  await expect
    .poll(async () => JSON.stringify(await settleLogs(page)))
    .toContain("new-interaction");
  await expect(target(page)).toBeFocused();
  await expect(target(page)).toHaveValue("UTC");
  expect(JSON.stringify(await settleLogs(page))).not.toContain(
    "copy.focus-applied",
  );
});

test("probe invalidation suppresses delayed clipboard rejection", async ({
  page,
}) => {
  await setup(page, true);
  await delayed(page);
  await copy(page).click();
  await target(page).fill("CST");
  await target(page).press("Tab");
  await reject(page, 0);
  await expect(target(page)).toHaveValue("CST");
  await expect(page.getByRole("alert")).toContainText("Choose a timezone");
  await expect(page.getByLabel("Text to copy")).toHaveCount(0);
  await expect(page.locator(".notice")).toHaveText("");
  expect(JSON.stringify(await settleLogs(page))).not.toContain(
    "copy.focus-scheduled",
  );
});

test("probe latest successful copy owns outcome after earlier late rejection", async ({
  page,
}) => {
  await setup(page, true);
  await delayed(page);
  await copy(page).click();
  await copy(page).click();
  await page.evaluate(() => (window as any).copyProbe.pending[1].resolve());
  await expect(page.locator(".notice")).toHaveText(
    "Copied with the date and timezone.",
  );
  await reject(page, 0);
  await expect(page.locator(".notice")).toHaveText(
    "Copied with the date and timezone.",
  );
  await expect(page.getByLabel("Text to copy")).toHaveCount(0);
  expect(JSON.stringify(await settleLogs(page))).not.toContain(
    "copy.focus-scheduled",
  );
});

test("probe old queued frame cannot target newer fallback field", async ({
  page,
}) => {
  await setup(page, true);
  await hold(page);
  await copy(page).click();
  await expect(page.getByLabel("Text to copy")).toBeVisible();
  await target(page).fill("Asia/Tokyo");
  await target(page).press("Tab");
  await expect(page.getByLabel("Text to copy")).toHaveCount(0);
  await expect(page.locator(".hero-time")).toHaveText(/12:00 am/i);
  await copy(page).click();
  const field = page.getByLabel("Text to copy");
  await expect(field).toBeFocused();
  await expect(field).toHaveValue(/UTC\+09:00.*Tokyo/s);
  await target(page).focus();
  await release(page);
  await expect(target(page)).toBeFocused();
  await expect
    .poll(async () => JSON.stringify(await settleLogs(page)))
    .toContain("superseded");
});

test("probe focus away and back does not revive queued focus ownership", async ({
  page,
}) => {
  await setup(page, true);
  await hold(page);
  await copy(page).click();
  await expect(page.getByLabel("Text to copy")).toBeVisible();
  await page.getByLabel("Message with a date or time").focus();
  await copy(page).focus();
  await release(page);
  await expect(copy(page)).toBeFocused();
  await expect
    .poll(async () => JSON.stringify(await settleLogs(page)))
    .toContain("new-interaction");
  expect(JSON.stringify(await settleLogs(page))).not.toContain(
    "copy.focus-applied",
  );
});
