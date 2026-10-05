import { chromium, expect } from "@playwright/test";

const url = "https://tien-lam.github.io/ChronoShift/";
const expectedSource = process.env.HOSTED_EXPECTED_COMMIT;
if (!/^[a-f0-9]{40}$/.test(expectedSource || ""))
  throw Error("Supply HOSTED_EXPECTED_COMMIT");
const browser = await chromium.launch({ channel: "chrome" });
const context = await browser.newContext({
  viewport: { width: 606, height: 988 },
  locale: "en-AU",
  timezoneId: "Australia/Sydney",
});
const report: any = {
  began: new Date().toISOString(),
  expectedSource,
  browser: browser.version(),
  platform: process.platform,
  arch: process.arch,
  cases: [],
  pageErrors: [],
};
const page = await context.newPage();
page.on("pageerror", (error) => report.pageErrors.push(error.message));
try {
  const release = await (
    await context.request.get(url + "release.json")
  ).json();
  expect(release.sourceCommit).toBe(expectedSource);
  report.release = release;
  await page.goto(url);
  await expect(page.locator("main")).toHaveAttribute(
    "data-offline-ready",
    "true",
  );
  report.assets = await page
    .locator("script[src]")
    .evaluateAll((scripts) =>
      scripts.map((script) => script.getAttribute("src")),
    );
  await page.getByText("More options", { exact: true }).click();
  const target = page.getByLabel("Convert to", { exact: true });
  const source = page.getByLabel("Source timezone when none is given", {
    exact: true,
  });
  await source.fill("UTC");
  await source.press("Tab");
  await target.fill("UTC");
  await target.press("Tab");
  await page
    .getByLabel("Message with a date or time")
    .fill("April 9, 2026 3pm");
  for (const [field, input, other, expectedTime, expectedDate] of [
    ["target", target, source, "12:00 am", "10 Apr"],
    ["source", source, target, "6:00 am", "9 Apr"],
  ] as const) {
    if (field === "source") {
      await target.fill("UTC");
      await target.press("Tab");
    }
    const otherValue = await other.inputValue();
    await input.fill("CST");
    await input.press("Tab");
    await expect(page.locator(".result")).toHaveCount(0);
    await input.fill("Asia/Tokyo");
    await expect(input).toHaveAttribute("aria-controls", /.+/);
    const list = page.locator(
      `[id="${await input.getAttribute("aria-controls")}"]`,
    );
    const alias = list.getByRole("option", { name: "Osaka", exact: true });
    await page.mouse.move(1, 1);
    await alias.hover();
    await expect(alias).toHaveAttribute("data-hovered", "true");
    await expect(alias).not.toHaveAttribute("data-focused", "true");
    await expect(
      list.getByRole("option", { name: "Tokyo", exact: true }),
    ).toHaveAttribute("aria-selected", "true");
    await input.press("Tab");
    await expect(input).toHaveValue("Asia/Tokyo");
    await expect(other).toHaveValue(otherValue);
    await expect(page.locator(".hero-time")).toHaveText(expectedTime);
    await expect(page.locator(".result-date")).toContainText(expectedDate);
    await input.fill("Asia/Toky");
    await input.press("ArrowDown");
    await input.press("End");
    await expect(alias).toHaveAttribute("data-focused", "true");
    await input.press("Tab");
    await expect(input).toHaveValue("osaka");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await input.fill("Tokyo");
    await list.getByRole("option", { name: "Tokyo", exact: true }).click();
    await expect(input).toHaveValue("Asia/Tokyo");
    await expect(other).toHaveValue(otherValue);
    report.cases.push({
      field,
      canonicalStable: true,
      explicitSelections: true,
      expectedTime,
      expectedDate,
      completed: new Date().toISOString(),
    });
  }
  await expect(page.locator("main")).toHaveAttribute(
    "data-offline-ready",
    "true",
  );
  await expect(page.locator(".message.warning")).toHaveCount(0);
  expect(report.pageErrors).toEqual([]);
  report.passed = true;
} catch (error: any) {
  report.passed = false;
  report.error = error.stack || String(error);
  throw error;
} finally {
  report.ended = new Date().toISOString();
  await Bun.write(
    new URL("./selection-hosted.json", import.meta.url),
    JSON.stringify(report, null, 2) + "\n",
  );
  await browser.close();
}
