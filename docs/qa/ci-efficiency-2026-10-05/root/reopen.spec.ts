import { test, expect } from '../../../../e2e/fixtures';
import { enterZone } from '../../../../e2e/choices';
test.use({origin: {url: 'http://127.0.0.1:' + process.env.PLAYWRIGHT_PORT + '/', stop: async () => {}}});
test.afterEach(async ({page}) => console.log(JSON.stringify({actualUrl:page.url(), assets:await page.locator('script[src]').evaluateAll(elements => elements.map(el => el.getAttribute('src')))})));
test("hovering timezone suggestions preserves typed values while explicit selections still commit", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByText("More options", { exact: true }).click();
  await enterZone(page, "UTC", "Source timezone when none is given");
  await enterZone(page, "UTC");
  await page
    .getByLabel("Message with a date or time")
    .fill("April 9, 2026 3pm UTC");
  for (const label of ["Convert to", "Source timezone when none is given"]) {
    const input = page.getByLabel(label, { exact: true });
    const other = page.getByLabel(
      label === "Convert to"
        ? "Source timezone when none is given"
        : "Convert to",
      { exact: true },
    );
    const otherValue = await other.inputValue();
    await enterZone(page, "CST", label);
    await input.fill("Asia/Tokyo");
    await expect(input).toHaveAttribute("aria-controls", /.+/);
    const suggestions = page.locator(
      `[id="${await input.getAttribute("aria-controls")}"]`,
    );
    const alias = suggestions.getByRole("option", {
      name: "Osaka",
      exact: true,
    });
    // Leave any prior pointer position so this exercises a fresh hover event.
    await page.mouse.move(0, 0);
    await alias.hover();
    await expect(alias).toHaveAttribute("data-hovered", "true");
    await input.press("Tab");
    await expect(input).toHaveValue("Asia/Tokyo");
    await expect(other).toHaveValue(otherValue);
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(page.locator(".hero-time")).toHaveText(/12:00 am/i);
    await expect(page.locator(".result-date")).toContainText("10 Apr");

    // Navigation and selection are deliberate actions, unlike mere hover.
    await input.fill("Asia/Toky");
    await input.press("ArrowDown");
    await input.press("End");
    await expect(alias).toHaveAttribute("data-focused", "true");
    await input.press("Tab");
    await expect(input).toHaveValue("osaka");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    // A real pointer interaction brings the field into view before typing.
    // Focusing an offscreen input with fill() can scroll its ancestor after
    // opening the popup; React Aria intentionally dismisses on that scroll.
    await input.scrollIntoViewIfNeeded();
    await input.click();
    await expect(input).toHaveAttribute("aria-expanded", "false");
    await input.fill("Tokyo");
    await expect(input).toHaveAttribute("aria-expanded", "true");
    const reopenedSuggestions = page.locator(
      `[id="${await input.getAttribute("aria-controls")}"]`,
    );
    await expect(reopenedSuggestions).toBeVisible();
    await reopenedSuggestions
      .getByRole("option", { name: "Tokyo", exact: true })
      .click();
    await expect(input).toHaveValue("Asia/Tokyo");
    await expect(other).toHaveValue(otherValue);
  }
});
