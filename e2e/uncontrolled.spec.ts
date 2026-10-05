import { test, expect, publishRelease, disconnect } from "./fixtures";
import { enterZone } from "./choices";
import { consoleDiagnostics } from "./console";
import type { Page } from "@playwright/test";
const clientTest = test.extend({ isolatedOrigin: true });
const evidence = new WeakMap<Page, ReturnType<typeof consoleDiagnostics>>();
clientTest.beforeEach(async ({ page, browserName }) => {
  test.skip(
    browserName !== "chromium",
    "Force refresh is exercised through Chrome's CDP",
  );
  evidence.set(page, consoleDiagnostics(page));
  await page.addInitScript(() => {
    sessionStorage.setItem("chronoshift-detailed-logs", "true");
    (window as any).initialControl = !!navigator.serviceWorker.controller;
    const native = window.setTimeout;
    window.setTimeout = ((
      handler: TimerHandler,
      delay?: number,
      ...args: any[]
    ) =>
      native(
        handler,
        delay === 15000 ? 200 : delay,
        ...args,
      )) as typeof setTimeout;
  });
});
clientTest.afterEach(async ({ page }, testInfo) => {
  const logs = evidence.get(page);
  let captureError: unknown;
  try {
    await logs?.flush();
  } catch (error) {
    captureError = error;
  }
  if (testInfo.status === testInfo.expectedStatus && !captureError) return;
  let snapshot: unknown;
  try {
    snapshot = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      const describe = (worker?: ServiceWorker | null) =>
        worker ? { scriptURL: worker.scriptURL, state: worker.state } : null;
      const cacheNames = await caches.keys();
      return {
        at: new Date().toISOString(),
        controller: describe(navigator.serviceWorker.controller),
        active: describe(registration?.active),
        installing: describe(registration?.installing),
        waiting: describe(registration?.waiting),
        ready: document
          .querySelector("main")
          ?.getAttribute("data-offline-ready"),
        warnings: Array.from(
          document.querySelectorAll(".message.warning"),
          (e) => e.textContent,
        ),
        caches: await Promise.all(
          cacheNames.map(async (name) => ({
            name,
            entries: (await (await caches.open(name)).keys()).map(
              (r) => new URL(r.url).pathname,
            ),
          })),
        ),
      };
    });
  } catch {
    snapshot = { unavailable: "document-ended-before-snapshot" };
  }
  // A genuine serialization error still fails teardown; navigation loss is
  // retained by the console helper as explicitly unavailable metadata.
  await testInfo.attach("offline-lifecycle", {
    body: JSON.stringify(
      { snapshot, logs: logs?.slice(-200), captureFailed: !!captureError },
      null,
      2,
    ),
    contentType: "application/json",
  });
  if (captureError) throw captureError;
});
async function hardReload(
  page: import("@playwright/test").Page,
  context: import("@playwright/test").BrowserContext,
) {
  const cdp = await context.newCDPSession(page);
  await Promise.all([
    page.waitForEvent("domcontentloaded"),
    cdp.send("Page.reload", { ignoreCache: true }),
  ]);
  await cdp.detach();
  expect(await page.evaluate(() => (window as any).initialControl)).toBe(false);
}
async function convert(page: import("@playwright/test").Page) {
  await page
    .getByLabel("Message with a date or time")
    .fill("June 18, 2026 at 5:20pm Tokyo");
  await enterZone(page, "Europe/London");
  await expect(page.locator(".hero-time")).toHaveText(/9:20 am/i);
}
clientTest(
  "an activated worker reclaims a hard-refreshed tab without reloading its draft",
  async ({ page, context, origin }) => {
    await page.goto("/");
    await expect(page.locator("main")).toHaveAttribute(
      "data-offline-ready",
      "true",
    );
    await hardReload(page, context);
    await convert(page);
    await expect(page.locator("main")).toHaveAttribute(
      "data-offline-ready",
      "true",
    );
    expect(
      await page.evaluate(() => !!navigator.serviceWorker.controller),
    ).toBe(true);
    await page.waitForTimeout(400);
    await expect(page.locator(".message.warning")).toHaveCount(0);
    await expect(page.getByLabel("Message with a date or time")).toHaveValue(
      "June 18, 2026 at 5:20pm Tokyo",
    );
    await page.close();
    await disconnect(context, origin);
    const reopened = await context.newPage();
    await reopened.goto("/");
    await convert(reopened);
    await expect(reopened.locator("main")).toHaveAttribute(
      "data-offline-ready",
      "true",
    );
  },
);
clientTest(
  "an explicit update recovers a timed-out readiness probe without another reload",
  async ({ page, context, baseURL }) => {
    await page.addInitScript(() => {
      const original = ServiceWorker.prototype.postMessage;
      let delayedUntil = 0;
      ServiceWorker.prototype.postMessage = function (
        this: ServiceWorker,
        message: any,
        ...args: any[]
      ) {
        if (
          message?.type === "CHECK_READY" &&
          sessionStorage.getItem("delay-update-probe")
        ) {
          delayedUntil ||= performance.now() + 350;
          setTimeout(
            () => {
              sessionStorage.removeItem("delay-update-probe");
              original.call(this, message, ...args);
            },
            Math.max(0, delayedUntil - performance.now()),
          );
          return;
        }
        return original.call(this, message, ...args);
      } as typeof original;
    });
    await publishRelease(context, baseURL!, "first-no-claim");
    await page.goto("/");
    await expect(page.locator("main")).toHaveAttribute(
      "data-offline-ready",
      "true",
    );
    const retained = await context.newPage();
    await retained.goto("/");
    await publishRelease(context, baseURL!, "second");
    await hardReload(page, context);
    await convert(page);
    await expect(
      page.getByRole("button", { name: "Update now" }),
    ).toBeVisible();
    await expect(page.locator(".message.warning")).toContainText(
      "Offline access is unavailable in this tab.",
    );
    await page.evaluate(() =>
      sessionStorage.setItem("delay-update-probe", "true"),
    );
    await Promise.all([
      page.waitForEvent("domcontentloaded"),
      page.getByRole("button", { name: "Update now" }).click(),
    ]);
    await expect(page.locator(".message.warning")).toContainText(
      "Offline assets could not be confirmed.",
    );
    const state = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      const response = await new Promise<any>((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = (event) => {
          channel.port1.close();
          resolve(event.data);
        };
        navigator.serviceWorker.controller!.postMessage(
          { type: "CHECK_READY" },
          [channel.port2],
        );
      });
      return {
        controlled: !!navigator.serviceWorker.controller,
        activeState: registration!.active!.state,
        response,
      };
    });
    expect(state.controlled).toBe(true);
    expect(state.activeState).toBe("activated");
    expect(state.response).toMatchObject({
      ready: true,
      version: "test-second",
    });
    await expect(page.locator("main")).toHaveAttribute(
      "data-offline-ready",
      "true",
    );
    await expect(page.locator(".message.warning")).toHaveCount(0);
    await expect(page.getByLabel("Message with a date or time")).toHaveValue(
      "June 18, 2026 at 5:20pm Tokyo",
    );
    await expect(page.locator(".hero-time")).toHaveText(/9:20 am/i);
    await retained.close();
  },
);
clientTest(
  "an older active worker cannot mark an uncontrolled tab ready or activate its waiting update",
  async ({ page, context, baseURL }) => {
    await publishRelease(context, baseURL!, "first-no-claim");
    await page.goto("/");
    await expect(page.locator("main")).toHaveAttribute(
      "data-offline-ready",
      "true",
    );
    // Retain a controlled old tab so normal browser activation cannot replace it.
    const retained = await context.newPage();
    await retained.goto("/");
    await publishRelease(context, baseURL!, "second");
    await hardReload(page, context);
    await convert(page);
    await expect(
      page.getByRole("button", { name: "Update now" }),
    ).toBeVisible();
    await expect(page.locator(".message.warning")).toContainText(
      "Offline access is unavailable in this tab.",
    );
    await page.waitForTimeout(400);
    await expect(page.locator("main")).toHaveAttribute(
      "data-offline-ready",
      "false",
    );
    expect(
      await page.evaluate(() => navigator.serviceWorker.controller),
    ).toBeNull();
    expect(
      await page.evaluate(
        async () =>
          (await navigator.serviceWorker.getRegistration())!.waiting!.state,
      ),
    ).toBe("installed");
    await expect(page.locator(".hero-time")).toHaveText(/9:20 am/i);
    await Promise.all([
      page.waitForEvent("domcontentloaded"),
      page.getByRole("button", { name: "Update now" }).click(),
    ]);
    await expect(page.getByLabel("Message with a date or time")).toHaveValue(
      "June 18, 2026 at 5:20pm Tokyo",
    );
    await expect(page.locator("main")).toHaveAttribute(
      "data-offline-ready",
      "true",
    );
    await expect(page.locator(".message.warning")).toHaveCount(0);
    await retained.close();
  },
);
