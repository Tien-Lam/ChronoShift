import { chromium, firefox, expect } from "@playwright/test";
const output = new URL("./", import.meta.url).pathname;
const began = new Date().toISOString(),
  results: any[] = [];
for (const [name, kind] of [
  ["chromium", chromium],
  ["firefox", firefox],
] as const) {
  const browser = await kind.launch();
  for (const action of ["target", "source", "calendar"]) {
    const context = await browser.newContext({
      viewport: { width: 280, height: 960 },
      locale: "en-AU",
      timezoneId: "Australia/Sydney",
    });
    const page = await context.newPage();
    const result: any = {
      browser: name,
      version: browser.version(),
      action,
      began: new Date().toISOString(),
    };
    try {
      await page.goto("http://127.0.0.1:4252/", {
        waitUntil: "domcontentloaded",
      });
      await expect(page.locator("#message")).toBeVisible();
      if (action !== "target")
        await page.getByText("More options", { exact: true }).click();
      if (action === "calendar")
        await page
          .getByRole("button", { name: /^Choose reference date/ })
          .click();
      else
        await page
          .locator(action === "target" ? "#target-zone" : "#source-zone")
          .fill("Tokyo");
      result.open = await page.evaluate(() => ({
        css: [...document.querySelectorAll('link[rel="stylesheet"]')].map(
          (el) => el.getAttribute("href"),
        ),
        workspace: getComputedStyle(document.querySelector(".workspace")!)
          .translate,
        popup: getComputedStyle(document.querySelector(".choice-popover")!)
          .translate,
        animations: document
          .getAnimations()
          .map((a) => ({
            state: a.playState,
            time: a.currentTime,
            duration: a.effect?.getTiming().duration,
          })),
      }));
      if (action === "calendar") {
        await page
          .locator(".calendar-day:not([data-outside-month])")
          .filter({ hasText: /^15$/ })
          .click({ timeout: 3000 });
        await expect(page.locator(".calendar-popover")).toHaveCount(0);
        await expect(
          page.locator('#reference-date [data-type="day"]'),
        ).toHaveAttribute("aria-valuenow", "15");
      } else {
        await page
          .getByRole("option", { name: /Tokyo/ })
          .click({ timeout: 3000 });
        await expect(
          page.locator(action === "target" ? "#target-zone" : "#source-zone"),
        ).toHaveValue("Asia/Tokyo");
      }
      result.passed = true;
    } catch (error) {
      result.passed = false;
      result.error = String(error);
      await page.screenshot({
        path: output + `early-${name}-${action}.png`,
        fullPage: true,
      });
    }
    result.ended = new Date().toISOString();
    results.push(result);
    console.log(JSON.stringify(result));
    await context.close();
  }
  await browser.close();
}
await Bun.write(
  output + "early-overlay-fixed.json",
  JSON.stringify({ began, ended: new Date().toISOString(), results }, null, 2),
);
if (results.some((r) => !r.passed)) process.exitCode = 1;
