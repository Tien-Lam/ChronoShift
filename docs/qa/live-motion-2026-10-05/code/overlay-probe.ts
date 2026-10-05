import { chromium, firefox, expect, type Page } from "@playwright/test";
expect.configure({ timeout: 2000 });
const output = new URL("./", import.meta.url).pathname;
const started = new Date().toISOString();
const results: any[] = [];
const selectedVariants = (
  process.env.OVERLAY_VARIANTS ||
  "candidate,reduced,overlay-only-disabled,press-only-disabled"
).split(",");
async function snapshot(page: Page) {
  return page.evaluate(() => {
    const rect = (el: Element | null) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const s = getComputedStyle(el);
      return {
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        top: s.top,
        left: s.left,
        translate: s.translate,
        animation: s.animationName,
        position: s.position,
      };
    };
    return {
      scrollX,
      scrollY,
      target: (document.querySelector("#target-zone") as HTMLInputElement)
        ?.value,
      expanded: document
        .querySelector("#target-zone")
        ?.getAttribute("aria-expanded"),
      active: document.activeElement?.outerHTML,
      popup: rect(document.querySelector(".choice-popover")),
      option: rect(document.querySelector('[role="option"]')),
      events: (window as any).__overlayEvents,
    };
  });
}
async function journey(page: Page, entry: any) {
  await page.goto("http://127.0.0.1:4252/");
  await page.getByText("More options", { exact: true }).click();
  const target = page.getByLabel("Convert to", { exact: true }),
    source = page.getByLabel("Source timezone when none is given", {
      exact: true,
    });
  await source.fill("UTC");
  await target.fill("Tokyo");
  await expect(page.getByRole("option", { name: /Tokyo/ })).toHaveCount(1);
  await target.press("ArrowDown");
  await target.press("Enter");
  await expect(target).toHaveValue("Asia/Tokyo");
  await page.locator("#message").fill("April 9, 2026 3pm UTC");
  await expect(page.locator(".hero-time")).toHaveText(/12:00 am/i);
  await target.fill("UTC");
  await expect(page.getByRole("listbox")).toBeVisible();
  await target.press("Escape");
  await expect(page.locator(".hero-time")).toHaveText(/3:00 pm/i);
  await target.click();
  await target.fill("Definitely/Not-A-Timezone");
  await expect(page.getByText("No matches", { exact: true })).toBeVisible();
  await target.press("Escape");
  await expect(page.getByRole("alert")).toContainText(/timezone/i);
  await target.fill("+05:45");
  await target.press("Escape");
  await expect(page.locator(".hero-time")).toHaveText(/8:45 pm/i);
  await target.fill("");
  await target.press("Escape");
  entry.stage = "empty-button-open";
  await page
    .getByRole("button", { name: "Show target timezones", exact: true })
    .click();
  await expect(page.getByRole("option").first()).toBeVisible();
  await page.setViewportSize({ width: 280, height: 960 });
  const popup = page.locator(".choice-popover:visible");
  await expect(popup).toBeVisible();
  await expect
    .poll(async () => {
      const r = await popup.boundingBox();
      return !!r && r.x >= 0 && r.x + r.width <= 281;
    })
    .toBe(true);
  const bounds = (await popup.boundingBox())!,
    control = (await target.boundingBox())!;
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(961);
  expect(bounds.width).toBeGreaterThanOrEqual(Math.min(control.width, 256) - 1);
  await popup.evaluate((el) => ({
    bg: getComputedStyle(el).backgroundColor,
    border: getComputedStyle(el).borderTopWidth,
    radius: getComputedStyle(el).borderTopLeftRadius,
    overflow: el.scrollWidth > el.clientWidth,
  }));
  await target.press("Escape");
  await target.fill("Tokyo");
  entry.stage = "narrow-tokyo-pointer";
  entry.before = await snapshot(page);
  await page.getByRole("option", { name: /Tokyo/ }).click({ timeout: 3000 });
  entry.after = await snapshot(page);
  await expect(target).toHaveValue("Asia/Tokyo", { timeout: 1200 });
  await expect(page.locator(".hero-time")).toHaveText(/12:00 am/i);
  entry.stage = "narrow-source-new-york";
  await source.fill("New York");
  await page.getByRole("option", { name: /New York/ }).click({ timeout: 3000 });
  await expect(source).toHaveValue("America/New_York");
  await expect(target).toHaveValue("Asia/Tokyo");
}
for (const [name, browserType] of [
  ["chromium", chromium],
  ["firefox", firefox],
] as const) {
  const browser = await browserType.launch();
  for (const variant of selectedVariants) {
    for (let i = 0; i < Number(process.env.OVERLAY_RUNS || 3); i++) {
      const entry: any = {
        browser: name,
        version: browser.version(),
        variant,
        i,
        began: new Date().toISOString(),
      };
      const context = await browser.newContext({
        locale: "en-AU",
        timezoneId: "Australia/Sydney",
        viewport: { width: 900, height: 640 },
        ...(variant === "reduced" ? { reducedMotion: "reduce" as const } : {}),
      });
      if (variant !== "candidate" && variant !== "reduced")
        await context.route("**/*.css", async (route) => {
          const response = await route.fetch();
          const css = await response.text();
          await route.fulfill({
            response,
            body:
              css +
              (variant === "overlay-only-disabled"
                ? "\n.choice-popover[data-entering]{animation:none!important;}"
                : variant === "press-only-disabled"
                  ? "\nbutton,summary{translate:none!important;}"
                  : variant === "both-disabled"
                    ? "\nbutton,summary{translate:none!important;}.choice-popover[data-entering]{animation:none!important;}"
                    : "\nbutton,summary{translate:none!important;}.choice-popover[data-entering]{animation:review-opacity 140ms ease!important;translate:none!important;}@keyframes review-opacity{from{opacity:.8}to{opacity:1}}"),
          });
        });
      await context.addInitScript(() => {
        const events: any[] = ((window as any).__overlayEvents = []);
        for (const type of [
          "pointerdown",
          "pointerup",
          "click",
          "focusin",
          "focusout",
          "scroll",
        ])
          document.addEventListener(
            type,
            (event) => {
              const target = event.target as Element;
              events.push({
                type,
                at: performance.now(),
                target: target?.tagName,
                id: target?.id,
                cls:
                  typeof target?.className === "string" ? target.className : "",
                x: (event as MouseEvent).clientX,
                y: (event as MouseEvent).clientY,
                scrollY,
              });
              if (events.length > 90) events.shift();
            },
            true,
          );
      });
      const page = await context.newPage();
      try {
        await journey(page, entry);
        entry.passed = true;
      } catch (error) {
        entry.passed = false;
        entry.error = String(error);
        entry.failure = await snapshot(page);
        await page.screenshot({
          path: output + `overlay-${name}-${variant}-${i}.png`,
          fullPage: true,
        });
      }
      entry.ended = new Date().toISOString();
      results.push(entry);
      console.log(
        JSON.stringify({
          browser: name,
          variant,
          i,
          passed: entry.passed,
          stage: entry.stage,
          error: entry.error,
        }),
      );
      await context.close();
    }
  }
  await browser.close();
}
await Bun.write(
  output +
    "overlay-probe-" +
    (process.env.OVERLAY_LABEL || "initial") +
    ".json",
  JSON.stringify(
    { started, ended: new Date().toISOString(), results },
    null,
    2,
  ),
);
