import { expect, test, disconnect } from "./fixtures";
import { enterReferenceDate, enterZone } from "./choices";

test("initial styles work without a CSS request and date controls load on demand", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ serviceWorkers: "block" });
  try {
    const page = await context.newPage();
    const dateRequests: string[] = [];
    page.on("request", (request) => {
      if (/\/DateChoice-[^/]+\.js$/.test(request.url()))
        dateRequests.push(request.url());
    });
    await page.route("**/*.css", (route) => route.abort());
    const response = await page.goto(baseURL!);
    await expect(page.getByLabel("Message with a date or time")).toBeVisible();
    expect(await page.locator('head link[rel="stylesheet"]').count()).toBe(0);
    const styles = await page
      .locator("head style[data-app-styles]")
      .allTextContents();
    expect(styles.join("\n")).toContain("--control-height:");
    for (const css of styles) {
      const hash = await page.evaluate(async (css) => {
        const bytes = await crypto.subtle.digest(
          "SHA-256",
          new TextEncoder().encode(css!),
        );
        return btoa(String.fromCharCode(...new Uint8Array(bytes)));
      }, css);
      expect(response!.headers()["content-security-policy"]).toContain(
        `'sha256-${hash}'`,
      );
    }
    expect(
      await page
        .locator(".input-panel")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
    ).not.toBe("rgba(0, 0, 0, 0)");
    const initialRequests = [...dateRequests];
    await page.getByRole("button", { name: /Adjust interpretation/ }).click();
    await expect(
      page.getByRole("button", { name: "Choose reference date" }),
    ).toBeVisible();
    expect(dateRequests.length).toBeGreaterThan(initialRequests.length);
  } finally {
    await context.close();
  }
});

test("first date-control use after offline reopen loads from the verified cache", async ({
  page,
  context,
  origin,
  baseURL,
}) => {
  await page.goto("/");
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  await page.close();
  await disconnect(context, origin);
  const reopened = await context.newPage();
  await reopened.goto(baseURL!);
  await expect(
    reopened.locator('main[data-offline-ready="true"]'),
  ).toBeVisible();
  await enterZone(reopened, "UTC");
  await reopened.getByRole("button", { name: /More options/ }).click();
  await enterZone(reopened, "UTC", "Source timezone");
  await enterReferenceDate(reopened, "2026-04-09");
  await reopened
    .getByLabel("Message with a date or time")
    .fill("Tomorrow at 3pm");
  await expect(reopened.locator(".hero-time")).toHaveText(/3:00 pm/i);
  await expect(reopened.locator(".result-date")).toContainText("10 Apr 2026");
});

test("failed date loading preserves the converter and retries without losing the draft", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ serviceWorkers: "block" });
  try {
    const page = await context.newPage();
    let failed = false;
    const html = await (await page.request.get(baseURL!)).text();
    const eager = [
      ...html.matchAll(/<link\b[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g),
    ].map((match) => new URL(match[1], baseURL).href);
    await page.route(/\/assets\/DateChoice-[^/]+\.js(?:\?.*)?$/, (route) => {
      if (eager.includes(route.request().url())) return route.continue();
      if (!failed) {
        failed = true;
        return route.abort();
      }
      return route.continue();
    });
    await page.goto(baseURL!);
    const message = page.getByLabel("Message with a date or time");
    const draft = "April 9, 2026 3pm UTC";
    await message.fill(draft);
    await page.getByRole("button", { name: /Adjust interpretation/ }).click();
    await expect(page.getByText("Date controls could not load.")).toBeVisible();
    await expect(message).toHaveValue(draft);
    await expect(page.locator(".hero-time")).not.toHaveText("");
    await page.getByRole("button", { name: "Retry date controls" }).click();
    await expect(
      page.getByRole("button", { name: "Choose reference date" }),
    ).toBeVisible();
    await expect(message).toHaveValue(draft);
    await page.getByRole("button", { name: /Adjust interpretation/ }).click();
    await page.getByRole("button", { name: /Adjust interpretation/ }).click();
    await expect(
      page.getByRole("button", { name: "Choose reference date" }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test("a timed-out date request cannot replace edits made after a successful retry", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ serviceWorkers: "block" });
  let release!: () => void;
  const stalled = new Promise<void>((resolve) => {
    release = resolve;
  });
  try {
    const page = await context.newPage();
    await page.addInitScript(() => {
      const schedule = window.setTimeout.bind(window);
      window.setTimeout = ((
        handler: TimerHandler,
        delay?: number,
        ...args: any[]
      ) =>
        schedule(
          handler,
          delay === 12_000 ? 200 : delay,
          ...args,
        )) as typeof window.setTimeout;
    });
    const html = await (await page.request.get(baseURL!)).text();
    const eager = [
      ...html.matchAll(/<link\b[^>]*rel="modulepreload"[^>]*href="([^"]+)"/g),
    ].map((match) => new URL(match[1], baseURL).href);
    let delayed = false;
    let originalFinished!: () => void;
    const finished = new Promise<void>((resolve) => {
      originalFinished = resolve;
    });
    await page.route(
      /\/assets\/DateChoice-[^/]+\.js(?:\?.*)?$/,
      async (route) => {
        if (!eager.includes(route.request().url()) && !delayed) {
          delayed = true;
          await stalled;
          await route.continue();
          originalFinished();
        } else await route.continue();
      },
    );
    await page.goto(baseURL!);
    await page.getByRole("button", { name: /More options/ }).click();
    await expect(page.getByText("Date controls could not load.")).toBeVisible();
    await page.getByRole("button", { name: "Retry date controls" }).click();
    await expect(
      page.getByRole("button", { name: "Choose reference date" }),
    ).toBeVisible();
    await enterReferenceDate(page, "2026-04-09");
    const day = page.locator('#reference-date [data-type="day"]');
    await day.click();
    await day.press("Backspace");
    await expect(page.locator(".message-defaults")).toContainText(
      "Complete or clear the date",
    );
    release();
    await finished;
    await page.getByRole("button", { name: /More options/ }).click();
    await page.getByRole("button", { name: /More options/ }).click();
    await expect(day).toHaveAttribute("data-placeholder", "true");
    await expect(page.locator(".message-defaults")).toContainText(
      "Complete or clear the date",
    );
  } finally {
    release();
    await context.close();
  }
});
