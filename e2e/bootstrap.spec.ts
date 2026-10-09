import { test, expect } from "@playwright/test";

for (const failure of ["entry", "dependency"]) {
  test(`startup ${failure} failure offers a fresh-document retry`, async ({
    browser,
    baseURL,
  }) => {
    const context = await browser.newContext({ serviceWorkers: "block" });
    try {
      const page = await context.newPage();
      const pageErrors: string[] = [];
      page.on("pageerror", (error) => pageErrors.push(error.message));
      await page.addInitScript(() => {
        localStorage.setItem(
          "chronoshift.preferences.v1",
          JSON.stringify({ source: "UTC", target: "UTC" }),
        );
      });
      let mountRequested = false;
      let rejected = false;
      page.on("request", (request) => {
        if (/\/Mount-[^/]+\.js$/.test(request.url())) mountRequested = true;
      });
      await page.route(/\/assets\/(Mount|shared)-[^/]+\.js$/, (route) => {
        const isMount = /\/Mount-[^/]+\.js$/.test(route.request().url());
        const matches =
          failure === "entry" ? isMount : mountRequested && !isMount;
        if (matches && !rejected) {
          rejected = true;
          return route.abort();
        }
        return route.continue();
      });
      await page.goto(baseURL!);
      await expect(page.getByRole("alert")).toContainText(
        "Unable to start the converter.",
      );
      expect(rejected).toBe(true);
      await expect(page.locator(".converter-intro")).toBeVisible();
      await expect(page.locator(".workspace")).toHaveAttribute("inert", "");
      await page.getByRole("button", { name: "Retry", exact: true }).click();
      await expect(page.locator("main")).toHaveAttribute(
        "data-app-ready",
        "true",
      );
      await expect(page.locator(".startup-notice")).toHaveCount(0);
      await expect(page.getByLabel("Convert to", { exact: true })).toHaveValue(
        "UTC",
      );
      await page
        .getByLabel("Message with a date or time")
        .fill("April 9, 2026 3pm UTC");
      await expect(page.locator(".hero-time")).toHaveText(/3:00 pm/i);
      expect(pageErrors).toEqual([]);
    } finally {
      await context.close();
    }
  });
}

test("a timed-out startup cannot activate late and explicit retry restores the route", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ serviceWorkers: "block" });
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  try {
    const page = await context.newPage();
    await page.addInitScript(() => {
      const original = window.setTimeout;
      window.setTimeout = ((
        handler: TimerHandler,
        delay?: number,
        ...args: unknown[]
      ) =>
        original(
          handler,
          delay === 12_000 ? 200 : delay,
          ...args,
        )) as typeof original;
      localStorage.setItem(
        "chronoshift.preferences.v1",
        JSON.stringify({ source: "UTC", target: "Asia/Tokyo", theme: "light" }),
      );
    });
    let first = true;
    await page.route(/\/assets\/Mount-[^/]+\.js$/, async (route) => {
      if (first) {
        first = false;
        await held;
      }
      await route.continue();
    });
    await page.goto(new URL("#about", baseURL!).href);
    await expect(page.locator(".startup-notice")).toBeVisible();
    const loaded = page.waitForResponse(/\/assets\/Mount-[^/]+\.js$/);
    release();
    const response = await loaded;
    // Let the late module finish evaluating before verifying expired ownership.
    await page.evaluate(async (url) => {
      await import(url);
    }, response.url());
    await expect(page.locator("main")).toHaveAttribute(
      "data-app-ready",
      "false",
    );
    await expect(page.locator(".workspace")).toHaveAttribute("inert", "");
    await page.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(page.locator("main")).toHaveAttribute(
      "data-app-ready",
      "true",
    );
    await expect(
      page.getByRole("heading", { name: "About Time to Local" }),
    ).toBeVisible();
    await expect(page.locator(".startup-notice")).toHaveCount(0);
    await page.getByRole("link", { name: "Back to converter" }).click();
    await expect(page.getByLabel("Convert to", { exact: true })).toHaveValue(
      "Asia/Tokyo",
    );
  } finally {
    release();
    await context.close();
  }
});
