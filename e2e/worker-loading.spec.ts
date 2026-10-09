import { test, expect, publishRelease } from "./fixtures";
import { enterZone } from "./choices";

test.use({ isolatedOrigin: true, serviceWorkers: "block" });

test("a failed conversion module returns an error and a new edit retries with a fresh worker", async ({
  page,
  context,
  baseURL,
}) => {
  await page.goto("/");
  await enterZone(page, "UTC");
  await publishRelease(context, baseURL!, "conversion-unavailable");
  const message = page.getByLabel("Message with a date or time");
  await message.fill("April 9, 2026 3pm UTC");
  await expect(page.getByRole("alert")).toContainText(
    "Could not convert this message. Edit it to try again.",
  );
  await expect(message).toHaveValue("April 9, 2026 3pm UTC");
  await publishRelease(context, baseURL!, "current");
  await message.fill("April 9, 2026 4pm UTC");
  await expect(page.locator(".hero-time")).toHaveText(/4:00 pm/i);
  await expect(page.getByRole("alert")).toHaveCount(0);
});
