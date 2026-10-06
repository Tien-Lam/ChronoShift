import { test, expect } from "./fixtures";

test("useful date shifts, assumptions and repeated mentions remain visible", async ({
  page,
}) => {
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
  await page.goto("/");
  const input = page.getByLabel("Message with a date or time");
  await input.fill("April 9, 2026 3pm EST");
  await expect(page.locator(".hero-time")).toHaveText("06:00");
  await expect(page.locator(".result-date")).toHaveText("Fri, 10 Apr 2026");
  await expect(page.locator(".day-shift")).toHaveText("+1 day");
  await expect(page.locator(".source-label")).toHaveText("EST");
  await page.locator(".copy-button").click();
  expect(await page.evaluate(() => (window as any).__copied)).toContain(
    "06:00 · Fri, 10 Apr 2026 · UTC+10:00 Sydney",
  );
  await input.fill("April 9, 2026 3pm");
  await expect(page.locator(".hero-time")).toHaveText("01:00");
  await expect(page.locator(".assumption")).toHaveText(
    "Source timezone assumed: UTC",
  );
  await page.locator(".copy-button").click();
  expect(await page.evaluate(() => (window as any).__copied)).toContain(
    "Source timezone assumed: UTC",
  );
  await input.fill("April 9, 2026 3pm UTC; April 9, 2026 3pm UTC");
  await expect(page.locator(".result")).toHaveCount(1);
  await expect(page.locator(".assumption")).toHaveText("Mentioned 2 times");
  await expect(page.locator(".range-label")).toHaveCount(0);
  await expect(page.locator(".ambiguity")).toHaveCount(0);
});
