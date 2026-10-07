import { test, expect } from "@playwright/test";
import { enterZone } from "./choices";

const hostedOrigin = new URL(
  process.env.HOSTED_URL || "https://timetolocal.com",
).origin;

test("public deployment converts fresh input after offline close and reopen", async ({
  page,
  context,
}) => {
  const requests: string[] = [];
  context.on("request", (request) => requests.push(request.url()));
  await page.goto("/");
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  expect(
    await page.evaluate(
      async () => (await navigator.serviceWorker.getRegistration())!.scope,
    ),
  ).toBe(`${hostedOrigin}/`);
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
  await reopened.goto("/");
  await enterZone(reopened, "UTC");
  await reopened
    .getByLabel("Message with a date or time")
    .fill("April 9, 2026 3:15:30pm in Tokyo");
  await expect(reopened.locator(".hero-time")).toHaveText(/6:15:30 am/i);
  expect(requests.every((url) => url.startsWith(`${hostedOrigin}/`))).toBe(
    true,
  );
  expect(requests.some((url) => /Tokyo|15:30|April/.test(url))).toBe(false);
  await expect
    .poll(() =>
      reopened.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    )
    .toBe(true);
});

test("host serves scoped manifest, identifiable release and effective static CSP", async ({
  page,
}) => {
  const response = await page.goto("/");
  expect(response!.status()).toBe(200);
  expect(response!.headers()["content-type"]).toContain("text/html");
  const manifestResponse = await page.request.get("/manifest.webmanifest");
  expect(manifestResponse.ok()).toBe(true);
  expect(manifestResponse.headers()["content-type"]).toMatch(/json|manifest/);
  const manifest = await manifestResponse.json();
  expect(manifest.start_url).toBe("/");
  expect(manifest.scope).toBe("/");
  expect(manifest.share_target.method).toBe("POST");
  const release = await (await page.request.get("/release.json")).json();
  expect(release.sourceCommit).toMatch(/^[a-f0-9]{40}$/);
  if (process.env.HOSTED_EXPECTED_COMMIT)
    expect(release.sourceCommit).toBe(process.env.HOSTED_EXPECTED_COMMIT);
  expect(release.base).toBe("/");
  const sw = await page.request.get("/sw.js");
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

test("host applies security and cache headers without missing-asset fallbacks", async ({
  request,
}) => {
  for (const path of [
    "/",
    "/sw.js",
    "/manifest.webmanifest",
    "/release.json",
  ]) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const headers = response.headers();
    expect(headers["content-security-policy"]).toContain(
      "frame-ancestors 'none'",
    );
    expect(headers["referrer-policy"]).toBe("no-referrer");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["cache-control"]).toContain("must-revalidate");
    expect(headers["cache-control"]).not.toContain("immutable");
  }
  const html = await (await request.get("/")).text();
  const asset = html.match(/src="([^\"]+\.js)"/)?.[1];
  expect(asset).toBeTruthy();
  const response = await request.get(asset!);
  expect(response.headers()["content-type"]).toMatch(/javascript/);
  expect(response.headers()["cache-control"]).toContain("immutable");
  for (const path of [
    "/assets/missing-script.js",
    "/_headers",
    "/_redirects",
  ]) {
    expect((await request.get(path)).status()).toBe(404);
  }
  if (hostedOrigin === "https://timetolocal.com") {
    const redirect = await request.get("https://www.timetolocal.com/", {
      maxRedirects: 0,
    });
    expect(redirect.status()).toBe(301);
    expect(redirect.headers().location).toBe("https://timetolocal.com/");
  }
});
