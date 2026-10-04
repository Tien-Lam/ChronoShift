import { test, expect } from "@playwright/test";

test("public Pages deployment converts fresh input after offline close and reopen", async ({
  page,
  context,
}) => {
  const requests: string[] = [];
  context.on("request", (request) => requests.push(request.url()));
  await page.goto("/ChronoShift/");
  await expect(page.getByText("Offline ready", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      async () => (await navigator.serviceWorker.getRegistration())!.scope,
    ),
  ).toBe("https://tien-lam.github.io/ChronoShift/");
  await page.close();
  await context.setOffline(true);
  const reopened = await context.newPage();
  await reopened.goto("/ChronoShift/");
  await reopened.getByLabel("Convert to").fill("UTC");
  await reopened
    .getByLabel("Message with a date or time")
    .fill("April 9, 2026 3:15:30pm in Tokyo");
  await reopened.getByRole("button", { name: "Convert", exact: true }).click();
  await expect(reopened.locator(".hero-time")).toHaveText(/6:15:30 am/i);
  expect(
    requests.every((url) =>
      url.startsWith("https://tien-lam.github.io/ChronoShift/"),
    ),
  ).toBe(true);
  expect(requests.some((url) => /Tokyo|15:30|April/.test(url))).toBe(false);
  await expect
    .poll(() =>
      reopened.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    )
    .toBe(true);
});

test("Pages serves scoped manifest, identifiable release and effective static CSP", async ({
  page,
}) => {
  const response = await page.goto("/ChronoShift/");
  expect(response!.status()).toBe(200);
  expect(response!.headers()["content-type"]).toContain("text/html");
  const manifestResponse = await page.request.get(
    "/ChronoShift/manifest.webmanifest",
  );
  expect(manifestResponse.ok()).toBe(true);
  expect(manifestResponse.headers()["content-type"]).toMatch(/json|manifest/);
  const manifest = await manifestResponse.json();
  expect(manifest.start_url).toBe("/ChronoShift/");
  expect(manifest.scope).toBe("/ChronoShift/");
  expect(manifest.share_target.method).toBe("POST");
  const release = await (
    await page.request.get("/ChronoShift/release.json")
  ).json();
  expect(release.sourceCommit).toMatch(/^[a-f0-9]{40}$/);
  if (process.env.HOSTED_EXPECTED_COMMIT)
    expect(release.sourceCommit).toBe(process.env.HOSTED_EXPECTED_COMMIT);
  expect(release.base).toBe("/ChronoShift/");
  const sw = await page.request.get("/ChronoShift/sw.js");
  expect(sw.headers()["content-type"]).toMatch(/javascript/);
  expect(
    await page.locator('meta[name="referrer"]').getAttribute("content"),
  ).toBe("no-referrer");
  const violation = await page.evaluate(
    () =>
      new Promise<string>((resolve) => {
        document.addEventListener(
          "securitypolicyviolation",
          (event) => resolve(event.effectiveDirective),
          { once: true },
        );
        const script = document.createElement("script");
        script.textContent = "window.__chronoshiftInlineProbe = true";
        document.head.append(script);
      }),
  );
  expect(violation).toBe("script-src-elem");
  expect(await page.evaluate(() => "__chronoshiftInlineProbe" in window)).toBe(
    false,
  );
});
