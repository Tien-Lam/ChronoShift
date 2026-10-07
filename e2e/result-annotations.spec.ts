import type { Page } from "@playwright/test";
import { test, expect, publishRelease } from "./fixtures";

async function configureAnnotations(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "chronoshift.preferences.v1",
      JSON.stringify({
        target: "Australia/Sydney",
        source: "UTC",
        hourCycle: "24",
      }),
    );
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (value: string) => {
          (window as any).__copied = value;
        },
      },
    });
  });
}

test("useful date shifts, assumptions and repeated mentions remain visible", async ({
  page,
}) => {
  await configureAnnotations(page);
  await page.goto("/");
  await expectAnnotations(page);
});

async function expectAnnotations(page: Page) {
  const input = page.getByLabel("Message with a date or time");
  await input.fill("April 9, 2026 3pm EST");
  await expect(page.locator(".hero-time")).toHaveText("06:00");
  await expect(page.locator(".result-date")).toHaveText("Fri, 10 Apr 2026");
  await expect(page.locator(".day-shift")).toHaveText("+1 day");
  await expect(page.locator(".source-label")).toHaveText("EST");
  await page.locator(".result .copy-button").click();
  expect(await page.evaluate(() => (window as any).__copied)).toContain(
    "06:00 · Fri, 10 Apr 2026 · UTC+10:00 Sydney",
  );
  await input.fill("April 9, 2026 3pm");
  await expect(page.locator(".hero-time")).toHaveText("01:00");
  await expect(page.locator(".assumption")).toHaveText(
    "Source timezone assumed: UTC",
  );
  await page.locator(".result .copy-button").click();
  expect(await page.evaluate(() => (window as any).__copied)).toContain(
    "Source timezone assumed: UTC",
  );
  await input.fill("April 9, 2026 3pm UTC; April 9, 2026 3pm UTC");
  await expect(page.locator(".result")).toHaveCount(1);
  await expect(page.locator(".assumption")).toHaveText("Mentioned 2 times");
  await expect(page.locator(".range-label")).toHaveCount(0);
  await expect(page.locator(".ambiguity")).toHaveCount(0);
}

test.describe("with a waiting update", () => {
  test.use({ isolatedOrigin: true });
  test("result annotations copy correctly while Update now remains available", async ({
    page,
    context,
    baseURL,
  }, info) => {
    await configureAnnotations(page);
    await publishRelease(context, baseURL!, "first");
    await page.goto("/");
    await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
    await publishRelease(context, baseURL!, "second");
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration())!.update();
    });
    const update = page.getByRole("button", { name: "Update now" });
    await expect(update).toBeVisible();
    await info.attach("waiting-copy-actions", {
      body: Buffer.from(
        JSON.stringify(
          await page.evaluate(async () => {
            const registration =
              await navigator.serviceWorker.getRegistration();
            return {
              timeOrigin: performance.timeOrigin,
              time: performance.now(),
              source: document
                .querySelector("script[src]")
                ?.getAttribute("src"),
              active: registration?.active?.state,
              waiting: registration?.waiting?.state,
            };
          }),
        ),
      ),
      contentType: "application/json",
    });
    await expectAnnotations(page);
    await expect(update).toBeVisible();
    expect(
      await page.evaluate(
        async () =>
          (await navigator.serviceWorker.getRegistration())?.waiting?.state,
      ),
    ).toBe("installed");
  });
});
