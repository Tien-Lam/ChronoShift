import { test, expect, publishRelease, disconnect } from "./fixtures";
import { enterZone } from "./choices";
const clientTest = test.extend({ isolatedOrigin: true });
clientTest.beforeEach(async ({ page, browserName }) => {
  test.skip(
    browserName !== "chromium",
    "Force refresh is exercised through Chrome's CDP",
  );
  await page.addInitScript(() => {
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
  await page.getByRole("button", { name: "Convert", exact: true }).click();
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
