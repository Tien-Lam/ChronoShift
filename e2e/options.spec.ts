import { test, expect, disconnect } from "./fixtures";
import { enterReferenceDate, enterZone } from "./choices";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const NativeDate = Date;
    window.Date = new Proxy(NativeDate, {
      construct(Target, args, newTarget) {
        return Reflect.construct(
          Target,
          args.length ? args : ["2026-07-01T12:00:00Z"],
          newTarget,
        );
      },
    });
  });
});

test("message defaults explain their purpose and preserve explicit zone and date interpretation", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(".message-defaults")).toContainText(
    "Without a timezone: Australia/Sydney (device)",
  );
  await expect(page.locator(".message-defaults")).toContainText(
    "Reference date: Today",
  );
  const change = page.getByRole("button", { name: "Change message defaults" });
  await change.focus();
  await change.press("Enter");
  const source = page.getByRole("combobox", { name: "Source timezone" });
  await expect(source).toBeFocused();
  await expect(source).toHaveAttribute("aria-describedby", "source-zone-help");
  await expect(source).toHaveAccessibleDescription(
    /For “3pm” without a timezone/,
  );
  await source.press("Escape");
  await expect(page.locator("#reference-date")).toHaveAccessibleName(
    "Reference date",
  );
  await expect(page.locator("#reference-date")).toHaveAccessibleDescription(
    /older message says “tomorrow”/,
  );
  await enterZone(page, "UTC");
  await enterZone(page, "America/Los_Angeles", "Source timezone");
  await enterReferenceDate(page, "2026-04-09");
  const input = page.getByLabel("Message with a date or time");
  await input.fill("3pm");
  await expect(page.locator(".hero-time")).toHaveText(/10:00 pm/i);
  await expect(page.locator(".result-date")).toContainText("9 Apr 2026");
  await expect(page.locator(".result")).toContainText(
    "Source timezone assumed: Los Angeles",
  );
  await expect(page.locator(".result")).toContainText(
    "Reference date used: 2026-04-09",
  );
  await input.fill("3pm in Tokyo");
  await expect(page.locator(".hero-time")).toHaveText(/6:00 am/i);
  await expect(page.locator(".result-date")).toContainText("10 Apr 2026");
  await expect(page.locator(".source-label")).toHaveText("Tokyo");
  await expect(page.locator(".result")).toContainText(
    "Reference date used: 2026-04-10",
  );
  await expect(page.locator(".result")).not.toContainText(
    "Source timezone assumed",
  );
  await input.fill("Tomorrow at 3pm");
  await expect(page.locator(".hero-time")).toHaveText(/10:00 pm/i);
  await expect(page.locator(".result-date")).toContainText("10 Apr 2026");
  await expect(page.locator(".result")).toContainText(
    "Reference date used: 2026-04-09",
  );
  await input.fill("July 15, 2026 at 3pm UTC");
  await expect(page.locator(".hero-time")).toHaveText(/3:00 pm/i);
  await expect(page.locator(".result-date")).toContainText(/15 Jul(?:y)? 2026/);
  await expect(page.locator(".result")).not.toContainText(
    "Reference date used",
  );
  await enterReferenceDate(page, "2024-01-01");
  await enterZone(page, "Asia/Tokyo", "Source timezone");
  await expect(page.locator(".hero-time")).toHaveText(/3:00 pm/i);
  await expect(page.locator(".result-date")).toContainText(/15 Jul(?:y)? 2026/);
});

test("closed options expose saved defaults, partial dates remain invalid, reset keeps the draft", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() =>
    localStorage.setItem(
      "chronoshift.preferences.v1",
      JSON.stringify({ source: "UTC", target: "UTC", hourCycle: "24" }),
    ),
  );
  await page.reload();
  await expect(page.locator(".message-defaults")).toContainText(
    "Without a timezone: UTC",
  );
  await page.getByRole("button", { name: "Change message defaults" }).click();
  await page.getByLabel("Source timezone", { exact: true }).press("Escape");
  await enterReferenceDate(page, "2026-04-09");
  const input = page.getByLabel("Message with a date or time");
  await input.fill("Tomorrow at 3pm");
  await expect(page.locator(".result-date")).toContainText("10 Apr 2026");
  const day = page.locator('#reference-date [data-type="day"]');
  await day.click();
  await day.press("Backspace");
  await expect(page.getByRole("alert")).toHaveText(
    "Complete or clear the reference date to continue.",
  );
  await expect(page.locator(".message-defaults")).toContainText(
    "Reference date: Complete or clear the date",
  );
  await page.getByText("More options", { exact: true }).click();
  await expect(page.locator(".message-defaults")).toContainText(
    "Reference date: Complete or clear the date",
  );
  await page.getByRole("button", { name: "Change message defaults" }).click();
  await page.getByLabel("Source timezone", { exact: true }).press("Escape");
  await page.getByRole("button", { name: "Reset preferences" }).click();
  await expect(input).toHaveValue("Tomorrow at 3pm");
  await expect(page.locator(".result-date")).toContainText(/2 Jul(?:y)? 2026/);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".message-defaults")).toContainText(
    "Reference date: Today",
  );
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("chronoshift.preferences.v1")),
    )
    .toBeNull();
});

test("message defaults remain usable offline through resize without storing or requesting message and reference date", async ({
  page,
  context,
  origin,
}) => {
  const requests: string[] = [];
  page.on("request", (request) =>
    requests.push(request.url() + (request.postData() || "")),
  );
  await page.goto("/");
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  await enterZone(page, "UTC");
  await page.getByRole("button", { name: "Change message defaults" }).click();
  await page.getByLabel("Source timezone", { exact: true }).press("Escape");
  await enterZone(page, "UTC", "Source timezone");
  await enterReferenceDate(page, "2026-04-09");
  await page.getByText("More options", { exact: true }).click();
  await disconnect(context, origin);
  const input = page.getByLabel("Message with a date or time");
  await input.fill("Tomorrow at 3pm");
  await expect(page.locator(".result-date")).toContainText("10 Apr 2026");
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(input).toHaveValue("Tomorrow at 3pm");
    await expect(page.locator(".hero-time")).toHaveText(/3:00 pm/i);
    await expect(page.locator(".message-defaults")).toContainText(
      "Reference date: 2026-04-09",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  const stored = await page.evaluate(() => ({
    local: JSON.stringify(localStorage),
    session: JSON.stringify(sessionStorage),
  }));
  expect(JSON.stringify(stored)).not.toContain("Tomorrow at 3pm");
  expect(JSON.stringify(stored)).not.toContain("2026-04-09");
  expect(requests.join("\n")).not.toContain("Tomorrow at 3pm");
  expect(requests.join("\n")).not.toContain("2026-04-09");
});
