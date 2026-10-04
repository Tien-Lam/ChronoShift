import { test, expect } from "@playwright/test";
test("subpath scope, manifest and worker survive offline restart", async ({
  page,
  context,
}) => {
  await page.goto("/ChronoShift/");
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  const manifest = await (
    await page.request.get("/ChronoShift/manifest.webmanifest")
  ).json();
  expect(manifest.start_url).toBe("/ChronoShift/");
  expect(manifest.scope).toBe("/ChronoShift/");
  expect(manifest.share_target.action).toBe("/ChronoShift/share");
  expect(
    await page.evaluate(
      async () => (await navigator.serviceWorker.getRegistration())!.scope,
    ),
  ).toBe("http://127.0.0.1:4174/ChronoShift/");
  await page.close();
  await context.setOffline(true);
  const reopened = await context.newPage();
  await reopened.goto("/ChronoShift/");
  await reopened.getByLabel("Convert to").fill("UTC");
  await reopened
    .getByLabel("Message with a date or time")
    .fill("April 9, 2026 3pm in Tokyo");
  await reopened.getByRole("button", { name: "Convert", exact: true }).click();
  await expect(reopened.locator(".hero-time")).toHaveText(/6:00 am/i);
  await reopened.evaluate(() => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/ChronoShift/share";
    form.enctype = "multipart/form-data";
    const input = document.createElement("input");
    input.name = "text";
    input.value = "July 15, 2026 3pm CST";
    form.append(input);
    document.body.append(form);
    form.requestSubmit();
  });
  await expect(reopened.getByLabel("Message with a date or time")).toHaveValue(
    "July 15, 2026 3pm CST",
  );
  expect(reopened.url()).toBe("http://127.0.0.1:4174/ChronoShift/");
});
