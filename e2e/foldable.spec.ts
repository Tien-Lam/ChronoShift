import { test, expect } from "@playwright/test";

test("input and results avoid a vertical hinge and survive folding", async ({
  page,
  context,
}) => {
  const cdp = await context.newCDPSession(page);
  await page.goto("/");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 824,
    height: 800,
    deviceScaleFactor: 1,
    mobile: true,
    screenWidth: 824,
    screenHeight: 800,
    // Chrome 153 ignores the standalone display-feature override. The
    // documented metrics parameter populates the real segment API correctly.
    displayFeature: { orientation: "vertical", offset: 400, maskLength: 24 },
  });
  await expect
    .poll(() =>
      page.evaluate(
        () => matchMedia("(horizontal-viewport-segments: 2)").matches,
      ),
    )
    .toBe(true);
  await page
    .getByLabel("Message with a date or time")
    .fill("April 9, 2026 3pm in Tokyo");
  await page.getByLabel("Convert to").fill("UTC");
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await expect(page.locator(".hero-time")).toHaveText(/6:00 am/i);
  const input = await page.locator(".input-panel").boundingBox();
  const result = await page.locator(".result-panel").boundingBox();
  expect(input!.x + input!.width).toBeLessThanOrEqual(400);
  expect(result!.x).toBeGreaterThanOrEqual(424);
  expect(result!.x + result!.width).toBeLessThanOrEqual(824);
  await page.getByLabel("Appearance", { exact: true }).click();
  await page.getByLabel("Theme", { exact: true }).selectOption("light");
  await page.getByLabel("Appearance", { exact: true }).click();
  expect(
    (await page.locator(".input-panel").boundingBox())!.x +
      (await page.locator(".input-panel").boundingBox())!.width,
  ).toBeLessThanOrEqual(400);
  expect(
    (await page.locator(".result-panel").boundingBox())!.x,
  ).toBeGreaterThanOrEqual(424);
  await expect(page.locator(".hero-time")).toHaveText(/6:00 am/i);
  for (const locator of [
    page.locator(".topbar"),
    page.locator(".appearance"),
    page.locator("footer"),
  ]) {
    const bounds = await locator.boundingBox();
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(400);
  }
  await cdp.send("Emulation.clearDisplayFeaturesOverride");
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByLabel("Message with a date or time")).toHaveValue(
    "April 9, 2026 3pm in Tokyo",
  );
  await expect(page.locator(".hero-time")).toHaveText(/6:00 am/i);
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
});

test("tabletop posture confines the scrollable task to the upper screen", async ({
  page,
  context,
}) => {
  const cdp = await context.newCDPSession(page);
  await page.goto("/");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 800,
    height: 824,
    deviceScaleFactor: 1,
    mobile: true,
    screenWidth: 800,
    screenHeight: 824,
    displayFeature: { orientation: "horizontal", offset: 400, maskLength: 24 },
  });
  await expect
    .poll(() =>
      page.evaluate(
        () => matchMedia("(vertical-viewport-segments: 2)").matches,
      ),
    )
    .toBe(true);
  expect((await page.locator("#root").boundingBox())!.height).toBe(400);
  await page
    .getByLabel("Message with a date or time")
    .fill("April 9, 2026 3pm UTC");
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  const copy = page.getByRole("button", { name: /^Copy / });
  await copy.scrollIntoViewIfNeeded();
  await expect(copy).toBeVisible();
  const bounds = await copy.boundingBox();
  expect(bounds!.y).toBeGreaterThanOrEqual(0);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(400);
  await cdp.send("Emulation.clearDisplayFeaturesOverride");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 800,
    height: 824,
    deviceScaleFactor: 1,
    mobile: true,
  });
  await expect(page.locator(".hero-time")).toBeVisible();
});

test("notch and home-indicator safe areas inset the task", async ({
  page,
  context,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setSafeAreaInsetsOverride", {
    insets: { top: 32, left: 28, right: 44, bottom: 34 },
  });
  await page.goto("/");
  const panel = await page.locator(".input-panel").boundingBox();
  expect(panel!.x).toBeGreaterThanOrEqual(28);
  expect(panel!.x + panel!.width).toBeLessThanOrEqual(390 - 44);
  expect(
    await page
      .locator(".topbar")
      .evaluate((el) => getComputedStyle(el).paddingTop),
  ).toBe("32px");
  expect(
    await page
      .locator("main")
      .evaluate((el) => getComputedStyle(el).paddingBottom),
  ).toBe("34px");
});
