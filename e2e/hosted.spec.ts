import { test, expect } from "@playwright/test";
import { enterZone } from "./choices";

test("public Pages deployment converts fresh input after offline close and reopen", async ({
  page,
  context,
}) => {
  const requests: string[] = [];
  context.on("request", (request) => requests.push(request.url()));
  await page.goto("/ChronoShift/");
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  expect(
    await page.evaluate(
      async () => (await navigator.serviceWorker.getRegistration())!.scope,
    ),
  ).toBe("https://tien-lam.github.io/ChronoShift/");
  await page
    .getByLabel("Message with a date or time")
    .fill("June 18, 2026 at 5:20pm in Tokyo");
  for (const [zone, expected] of [
    ["UTC", /8:20 am/i],
    ["Europe/London", /9:20 am/i],
    ["America/Los_Angeles", /1:20 am/i],
  ] as const) {
    await enterZone(page, zone);
    await expect(page.locator(".hero-time")).toHaveText(expected);
    await expect(page.locator("main")).toHaveAttribute(
      "data-offline-ready",
      "true",
    );
    await expect(
      page.getByText("Offline setup is incomplete.", { exact: false }),
    ).toHaveCount(0);
  }
  // The reported warning appears after 10–20s; fast smoke alone missed it.
  await page.waitForTimeout(21000);
  await expect(page.locator("main")).toHaveAttribute(
    "data-offline-ready",
    "true",
  );
  await expect(page.locator(".message.warning")).toHaveCount(0);
  await enterZone(page, "Europe/London");
  await expect(page.locator(".hero-time")).toHaveText(/9:20 am/i);
  await page.close();
  await context.setOffline(true);
  const reopened = await context.newPage();
  await reopened.goto("/ChronoShift/");
  await enterZone(reopened, "UTC");
  await reopened
    .getByLabel("Message with a date or time")
    .fill("April 9, 2026 3:15:30pm in Tokyo");
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
  const inlineStyle = await page.evaluate(
    () =>
      new Promise<{ directive: string; hasSheet: boolean }>((resolve) => {
        const style = document.createElement("style");
        style.textContent = "body { outline: 99px solid magenta !important; }";
        const onViolation = (event: SecurityPolicyViolationEvent) => {
          if (event.effectiveDirective !== "style-src-elem") return;
          document.removeEventListener("securitypolicyviolation", onViolation);
          resolve({
            directive: event.effectiveDirective,
            hasSheet: style.sheet !== null,
          });
        };
        document.addEventListener("securitypolicyviolation", onViolation);
        document.head.append(style);
      }),
  );
  expect(inlineStyle).toEqual({ directive: "style-src-elem", hasSheet: false });
});
