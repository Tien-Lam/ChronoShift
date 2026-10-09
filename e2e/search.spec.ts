import { expect, test } from "@playwright/test";
import { enterZone } from "./choices";

test("initial HTML is readable without JavaScript", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto(baseURL!);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Time zone converter",
    );
    // Playwright's text selector skips noscript even with scripting disabled.
    await expect(page.locator(".javascript-notice")).toBeVisible();
    await expect(page.locator(".javascript-notice")).toHaveText(
      "Enable JavaScript to use the converter.",
    );
    await expect(page.locator(".converter-intro")).toBeVisible();
    await expect(page.locator(".converter-guide")).toBeVisible();
    await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
      "href",
      "https://timetolocal.com/",
    );
    await expect(page.locator('head meta[name="description"]')).toHaveAttribute(
      "content",
      /Convert dates and times in messages/,
    );
  } finally {
    await context.close();
  }
});

test("discovery endpoints and rendered metadata retain the public canonical URL", async ({
  page,
}) => {
  const robots = await page.request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(robots.headers()["content-type"]).toContain("text/plain");
  expect(await robots.text()).toContain(
    "Sitemap: https://timetolocal.com/sitemap.xml",
  );
  const sitemap = await page.request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  expect(sitemap.headers()["content-type"]).toContain("application/xml");
  expect(await sitemap.text()).toContain("<loc>https://timetolocal.com/</loc>");
  const response = await page.goto("/");
  const data = await page
    .locator('head script[type="application/ld+json"]')
    .textContent();
  expect(JSON.parse(data!)).toEqual({
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Time to Local",
    url: "https://timetolocal.com/",
  });
  expect(response!.headers()["content-security-policy"]).not.toContain(
    "'unsafe-inline'",
  );
  await expect(page.locator(".converter-intro")).toHaveCount(1);
  await expect(page.locator(".converter-guide")).toHaveCount(1);
  await expect(page.locator(".javascript-notice")).not.toBeVisible();
  await enterZone(page, "UTC");
  await page
    .getByLabel("Message with a date or time")
    .fill("April 9, 2026 3pm in Tokyo");
  await expect(page.locator(".hero-time")).toHaveText(/6:00 am/i);
  await page.getByRole("link", { name: "About", exact: true }).click();
  await expect(page).toHaveTitle("About — Time to Local");
  await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute(
    "href",
    "https://timetolocal.com/",
  );
  await page.getByRole("link", { name: "Back to converter" }).click();
  await expect(page.locator(".hero-time")).toHaveText(/6:00 am/i);
});
