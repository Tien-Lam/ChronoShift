import { test, expect, disconnect, publishRelease } from "./fixtures";

const sourceURL = "https://github.com/Tien-Lam/time-to-local";

test.describe("About updates", () => {
  test.use({ isolatedOrigin: true });
  test("a waiting update stays explicit on About and preserves the draft and page", async ({
    page,
    context,
  }) => {
    await page.goto("/");
    await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
    const message = "Keep April 9, 2026 3pm UTC";
    await page.getByLabel("Message with a date or time").fill(message);
    await page.getByRole("link", { name: "About", exact: true }).click();
    await publishRelease(context, page.url(), "second");
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration())!.update();
    });
    const update = page.getByRole("button", { name: "Update now" });
    await expect(update).toBeVisible();
    await expect(page).toHaveTitle("About — Time to Local");
    await expect(page.getByLabel("Message with a date or time")).toHaveValue(
      message,
    );
    await page.evaluate(() => {
      const setItem = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === "chronoshift.update-draft") {
          Storage.prototype.setItem = setItem;
          throw new DOMException("Storage unavailable", "QuotaExceededError");
        }
        return setItem.call(this, key, value);
      };
    });
    await update.click();
    await expect(page.getByRole("status")).toContainText(
      "Copy your message somewhere safe, then clear it before updating.",
    );
    await expect(page).toHaveTitle("About — Time to Local");
    await expect(update).toBeVisible();
    await expect(page.getByLabel("Message with a date or time")).toHaveValue(
      message,
    );
    await Promise.all([page.waitForEvent("domcontentloaded"), update.click()]);
    await expect(page).toHaveTitle("About — Time to Local");
    expect(new URL(page.url()).hash).toBe("#about");
    await expect(page.getByRole("button", { name: "Update now" })).toHaveCount(
      0,
    );
    await expect
      .poll(() =>
        page.evaluate(() => sessionStorage.getItem("chronoshift.update-draft")),
      )
      .toBe(null);
    await page.getByRole("link", { name: "Back to converter" }).click();
    await expect(page.getByLabel("Message with a date or time")).toHaveValue(
      message,
    );
    await expect(page.locator(".hero-time")).toBeVisible();
  });
});

test("About is a plain local page and returning preserves the message and result", async ({
  page,
  context,
}) => {
  const requests: string[] = [];
  context.on("request", (request) => requests.push(request.url()));
  await page.addInitScript(() =>
    localStorage.setItem(
      "chronoshift.preferences.v1",
      JSON.stringify({ target: "UTC", hourCycle: "24" }),
    ),
  );
  await page.goto("/");
  const input = page.getByLabel("Message with a date or time");
  const message = "2026-04-09T23:59:59.123+00:00";
  await input.fill(message);
  await expect(page.locator(".hero-time")).toHaveText("23:59:59.123");
  const source = page.getByRole("link", { name: "GitHub", exact: true });
  await expect(source).toHaveAttribute("href", sourceURL);
  await expect(source).toHaveAttribute("rel", "noopener noreferrer");
  await page.getByRole("link", { name: "About", exact: true }).click();
  await expect(page).toHaveTitle("About — Time to Local");
  await expect(
    page.getByRole("heading", { name: "About Time to Local" }),
  ).toBeFocused();
  await expect(input).not.toBeVisible();
  await expect(page.getByRole("main")).toHaveCount(1);
  await expect(
    page.getByRole("link", { name: "View on GitHub" }),
  ).toHaveAttribute("href", sourceURL);
  await expect(
    page.getByText(/open source under the MIT license/),
  ).toBeVisible();
  await page.goBack();
  await expect(page).toHaveTitle("Time to Local — Time zone converter");
  await expect(input).toHaveValue(message);
  await expect(input).toBeFocused();
  await expect(page.locator(".hero-time")).toHaveText("23:59:59.123");
  await page.goForward();
  await expect(
    page.getByRole("heading", { name: "About Time to Local" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Back to converter" }).click();
  await expect(input).toHaveValue(message);
  await expect(input).toBeFocused();
  await expect(page.locator(".hero-time")).toHaveText("23:59:59.123");
  expect(requests.some((url) => url.startsWith("https://github.com/"))).toBe(
    false,
  );
});

test("direct About links reopen offline and return to a working converter", async ({
  page,
  context,
  origin,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "chronoshift.preferences.v1",
      JSON.stringify({ target: "UTC", hourCycle: "24" }),
    ),
  );
  await page.goto("/");
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  const aboutURL = new URL("#about", page.url()).href;
  await disconnect(context, origin);
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto(aboutURL);
  await expect(reopened).toHaveTitle("About — Time to Local");
  await expect(
    reopened.getByRole("heading", { name: "About Time to Local" }),
  ).toBeVisible();
  await reopened.getByRole("link", { name: "Back to converter" }).click();
  await reopened
    .getByLabel("Message with a date or time")
    .fill("April 9, 2026 3pm UTC");
  await expect(reopened.locator(".hero-time")).toHaveText("15:00");
});

test("About navigation dismisses a calendar portal and keeps unfinished reference input", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: /More options/ }).click();
  const year = page.locator('#reference-date [data-type="year"]');
  await year.focus();
  await page.keyboard.type("2026");
  await page.getByRole("button", { name: "Choose reference date" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.evaluate(() => {
    location.hash = "#about";
  });
  await expect(
    page.getByRole("heading", { name: "About Time to Local" }),
  ).toBeFocused();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("link", { name: "Back to converter" }).click();
  await expect(year).toHaveText("2026");
  await expect(
    page.getByRole("button", { name: /More options/ }),
  ).toHaveAttribute("aria-expanded", "true");
});
