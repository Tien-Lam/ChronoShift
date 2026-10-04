import { test, expect, publishRelease, disconnect } from "./fixtures";
import { enterZone } from "./choices";

const installTest = test.extend({ isolatedOrigin: true });

installTest.beforeEach(async ({ page }) => {
  // Exercise the real lifecycle beyond its deadline without adding 15s to CI.
  await page.addInitScript(() => {
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

async function convert(page: import("@playwright/test").Page) {
  await page
    .getByLabel("Message with a date or time")
    .fill("June 18, 2026 at 5:20pm Tokyo");
  await enterZone(page, "Europe/London");
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await expect(page.locator(".hero-time")).toHaveText(/9:20 am/i);
}

installTest(
  "a transient initial registration failure retries before any controller exists",
  async ({ page }) => {
    await page.addInitScript(() => {
      const register = navigator.serviceWorker.register.bind(
        navigator.serviceWorker,
      );
      (window as any).registrationAttempts = 0;
      navigator.serviceWorker.register = async (...args) => {
        if (++(window as any).registrationAttempts === 1)
          throw new TypeError("Transient first registration failure");
        return register(...args);
      };
    });
    await page.goto("/");
    await convert(page);
    await expect(page.locator("main")).toHaveAttribute(
      "data-offline-ready",
      "true",
    );
    expect(
      await page.evaluate(() => (window as any).registrationAttempts),
    ).toBe(2);
    await expect(page.locator(".message.warning")).toHaveCount(0);
    await expect(page.locator(".hero-time")).toHaveText(/9:20 am/i);
  },
);

installTest(
  "slow first installation clears its expired warning without losing conversion",
  async ({ page, context, origin, baseURL }) => {
    await publishRelease(context, baseURL!, "offline-delayed");
    await page.goto("/");
    await expect(page.locator(".message.warning")).toContainText(
      "Offline setup is incomplete.",
    );
    await convert(page);
    await expect(page.locator("main")).toHaveAttribute(
      "data-offline-ready",
      "true",
    );
    await expect(page.locator(".message.warning")).toHaveCount(0);
    await expect(page.locator(".hero-time")).toHaveText(/9:20 am/i);
    await page.close();
    await disconnect(context, origin);
    const reopened = await context.newPage();
    await reopened.goto("/");
    await convert(reopened);
  },
);

installTest(
  "a stale mutable asset is refetched and checked before offline readiness",
  async ({ page, context, baseURL }) => {
    await publishRelease(context, baseURL!, "offline-stale");
    await page.goto("/");
    await expect(page.locator("main")).toHaveAttribute(
      "data-offline-ready",
      "true",
    );
    await expect(page.locator(".message.warning")).toHaveCount(0);
    const html = await page.evaluate(async () => {
      const cache = await caches.open(
        (await caches.keys()).find(
          (key) => key.startsWith("chronoshift-") && !key.includes("staging"),
        )!,
      );
      return (await cache.match("/index.html"))!.text();
    });
    expect(html).toContain("ChronoShift");
    expect(html).not.toContain("Stale release");
    await convert(page);
  },
);

installTest(
  "a rejected first installation retries without reloading or clearing input",
  async ({ page, context, baseURL }) => {
    await publishRelease(context, baseURL!, "offline-interrupted");
    await page.goto("/");
    await expect(page.locator(".message.warning")).toContainText(
      "Offline setup is incomplete.",
    );
    await convert(page);
    await expect(page.locator("main")).toHaveAttribute(
      "data-offline-ready",
      "true",
    );
    await expect(page.locator(".message.warning")).toHaveCount(0);
    await expect(page.getByLabel("Message with a date or time")).toHaveValue(
      "June 18, 2026 at 5:20pm Tokyo",
    );
  },
);

installTest(
  "persistently wrong release bytes never activate or claim offline readiness",
  async ({ page, context, baseURL }) => {
    await publishRelease(context, baseURL!, "offline-corrupt");
    await page.goto("/");
    await expect(page.locator(".message.warning")).toContainText(
      "Offline setup is incomplete.",
    );
    await convert(page);
    // Wait through both bounded retries; genuine integrity failure remains visible.
    await page.waitForTimeout(5000);
    await expect(page.locator("main")).toHaveAttribute(
      "data-offline-ready",
      "false",
    );
    await expect(page.locator(".message.warning")).toContainText(
      "Offline setup is incomplete.",
    );
    expect(
      await page.evaluate(() => navigator.serviceWorker.controller),
    ).toBeNull();
    expect(
      await page.evaluate(async () =>
        (await caches.keys()).filter((key) => key.includes("staging")),
      ),
    ).toEqual([]);
  },
);
