import { chromium, firefox, webkit, expect, type Page } from "@playwright/test";
import { join, resolve, extname } from "node:path";
import { PREVIEW_CSP } from "../../../../scripts/csp";
import { choose, enterZone } from "../../../../e2e/choices";

if (process.env.CHRONOSHIFT_ADVERSARIAL_RELEASE !== "1")
  throw new Error("Execution on hold: explicit root release required");
const out = resolve(import.meta.dir);
const root = resolve("dist");
const expectedBlobs = {
  "web/src/App.tsx": "8a72819c1c20cc6e20b168578d76e71e80e9af29",
  "web/src/components/Choices.tsx": "61cfa2b0e23279b9986d816119f0d722272c6bfd",
};
const git = (...args: string[]) => {
  const result = Bun.spawnSync(["git", ...args]);
  if (result.exitCode) throw new Error(result.stderr.toString());
  return result.stdout.toString().trim();
};
for (const [path, blob] of Object.entries(expectedBlobs))
  expect(git("hash-object", path)).toBe(blob);
async function assetHashes() {
  const paths = Array.from(new Bun.Glob("**/*").scanSync({ cwd: root, onlyFiles: true })).sort();
  return Object.fromEntries(await Promise.all(paths.map(async (path) => [path,
    new Bun.CryptoHasher("sha256").update(await Bun.file(join(root, path)).arrayBuffer()).digest("hex")])));
}
const raw: any = {
  startedAt: new Date().toISOString(),
  checkout: git("rev-parse", "HEAD"), expectedBlobs,
  platform: process.platform, architecture: process.arch, bun: Bun.version,
  serverRoot: root, motion: "no-preference", viewport: { width: 900, height: 960 },
  release: await Bun.file(join(root, "release.json")).json(),
  assetsBefore: await assetHashes(), rows: [], errors: [],
};
expect(raw.release.base).toBe("/");
const server = Bun.serve({ hostname: "127.0.0.1", port: 4277, async fetch(request) {
  const path = resolve(root, new URL(request.url).pathname.slice(1) || "index.html");
  if (!path.startsWith(root + "/")) return new Response("Not found", { status: 404 });
  const file = Bun.file(path);
  if (!(await file.exists())) return new Response("Not found", { status: 404 });
  const type = ({ ".js": "text/javascript", ".css": "text/css", ".webmanifest": "application/manifest+json" } as Record<string, string>)[extname(path)] || file.type;
  return new Response(file, { headers: { "Content-Type": type, "Content-Security-Policy": PREVIEW_CSP, "Cache-Control": "no-cache" } });
}});
raw.origin = server.url.href;
const sourceLabel = "Source timezone when none is given";
const target = (page: Page) => page.getByLabel("Convert to", { exact: true });
const source = (page: Page) => page.getByLabel(sourceLabel, { exact: true });
async function ownedList(page: Page, label: string) {
  const input = page.getByLabel(label, { exact: true });
  await expect(input).toHaveAttribute("aria-expanded", "true");
  const id = await input.getAttribute("aria-controls");
  expect(id).toBeTruthy();
  const list = page.locator(`[id=${JSON.stringify(id)}]`);
  await expect(list).toBeVisible();
  return list;
}
async function exactResult(page: Page, time: string, date: RegExp, zone: string) {
  await expect(page.locator(".result-panel")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator(".result")).toHaveCount(1);
  await expect(page.locator(".hero-time")).toHaveText(time);
  await expect(page.locator(".result-date")).toHaveText(date);
  await expect(page.locator(".result-zone")).toHaveText(zone);
  await expect(page.getByRole("alert")).toHaveCount(0);
}
async function setup(page: Page) {
  await page.goto(server.url.href);
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  await page.getByText("More options", { exact: true }).click();
  await choose(page, "Time display", "24");
  await enterZone(page, "UTC", sourceLabel);
  await enterZone(page, "Asia/Tokyo");
  await page.getByLabel("Message with a date or time").fill("April 9, 2026 3pm UTC");
  await exactResult(page, "00:00", /10 Apr(?:il)? 2026/, "UTC+09:00 Tokyo");
}
async function openCompletion(page: Page, row: any) {
  await setup(page);
  row.transitions = [];
  for (const label of ["Convert to", sourceLabel]) {
    const input = page.getByLabel(label, { exact: true });
    const other = label === "Convert to" ? source(page) : target(page);
    const otherValue = await other.inputValue();
    await input.scrollIntoViewIfNeeded();
    await enterZone(page, "CST", label);
    await input.click();
    await input.fill("Asia/Tokyo");
    const list = await ownedList(page, label);
    await expect(page.locator(".result-panel")).toHaveAttribute("aria-busy", "true");
    const alias = list.getByRole("option", { name: "Osaka", exact: true });
    await page.mouse.move(0, 0);
    await alias.hover();
    await expect(alias).toHaveAttribute("data-hovered", "true");
    // Establish this competing condition before conversion settles, rather
    // than passing a journey that only happened to hover afterwards.
    await expect(page.locator(".result-panel")).toHaveAttribute("aria-busy", "true");
    const before = await input.getAttribute("aria-controls");
    const pendingAt = new Date().toISOString();
    await exactResult(page, "00:00", /10 Apr(?:il)? 2026/, "UTC+09:00 Tokyo");
    await expect(input).toBeFocused();
    await expect(input).toHaveAttribute("aria-controls", before!);
    await expect(list).toBeVisible();
    await input.press("Tab");
    await expect(input).toHaveValue("Asia/Tokyo");
    await expect(other).toHaveValue(otherValue);
    await expect(input).toHaveAttribute("aria-expanded", "false");
    row.transitions.push({ label, pendingAt, settledAt: new Date().toISOString(), listId: before });
    await input.scrollIntoViewIfNeeded();
    await input.click();
    await input.fill("Asia/Toky");
    const keyboardList = await ownedList(page, label);
    await input.press("ArrowDown");
    await input.press("End");
    await expect(keyboardList.getByRole("option", { name: "Osaka", exact: true })).toHaveAttribute("data-focused", "true");
    await input.press("Tab");
    await expect(input).toHaveValue("osaka");
    await expect(other).toHaveValue(otherValue);
    await exactResult(page, "00:00", /10 Apr(?:il)? 2026/, "UTC+09:00 Tokyo");
    await enterZone(page, "Asia/Tokyo", label);
  }
}
async function deviceChange(page: Page, row: any) {
  await page.addInitScript(() => {
    const original = Intl.DateTimeFormat.prototype.resolvedOptions;
    (window as any).__deviceZone = "Australia/Sydney";
    Intl.DateTimeFormat.prototype.resolvedOptions = function () {
      return { ...original.call(this), timeZone: (window as any).__deviceZone };
    };
  });
  await page.goto(server.url.href);
  await page.getByText("More options", { exact: true }).click();
  await choose(page, "Time display", "24");
  await page.getByLabel("Message with a date or time").fill("June 18, 2026 3pm UTC");
  await exactResult(page, "01:00", /19 Jun(?:e)? 2026/, "UTC+10:00 Sydney");
  await page.evaluate(() => { (window as any).__deviceZone = "Asia/Tokyo"; window.dispatchEvent(new Event("focus")); });
  await expect(target(page)).toHaveValue("");
  await expect(source(page)).toHaveValue("");
  await expect(target(page)).toHaveAttribute("placeholder", "Your timezone · Tokyo");
  await expect(source(page)).toHaveAttribute("placeholder", "Device timezone · Asia/Tokyo");
  await exactResult(page, "00:00", /19 Jun(?:e)? 2026/, "UTC+09:00 Tokyo");
  await enterZone(page, "UTC");
  await page.getByLabel("Message with a date or time").fill("June 18, 2026 3pm");
  await exactResult(page, "06:00", /18 Jun(?:e)? 2026/, "UTC");
  await page.evaluate(() => { (window as any).__deviceZone = "America/New_York"; window.dispatchEvent(new Event("focus")); });
  await expect(target(page)).toHaveValue("UTC");
  await expect(source(page)).toHaveValue("");
  await expect(target(page)).toHaveAttribute("placeholder", "Your timezone · New York");
  await expect(source(page)).toHaveAttribute("placeholder", "Device timezone · America/New_York");
  await exactResult(page, "19:00", /18 Jun(?:e)? 2026/, "UTC");
  row.faultInjection = "Only resolvedOptions().timeZone changed; existing focus refresh dispatched";
}
async function customReset(page: Page, row: any) {
  await setup(page);
  await enterZone(page, "America/New_York", sourceLabel);
  await choose(page, "Numeric dates", "dmy");
  await page.getByLabel("Appearance", { exact: true }).click();
  await choose(page, "Theme", "light");
  await page.getByRole("button", { name: "Reset preferences", exact: true }).click();
  await expect(target(page)).toHaveValue("");
  await expect(source(page)).toHaveValue("");
  expect(await page.evaluate(() => localStorage.getItem("chronoshift.preferences.v1"))).toBeNull();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await choose(page, "Time display", "24");
  await enterZone(page, "UTC", sourceLabel);
  await target(page).fill("Definitely/Not-A-Timezone");
  await expect(await ownedList(page, "Convert to")).toContainText("No matches");
  await target(page).press("Tab");
  await expect(target(page)).toHaveValue("Definitely/Not-A-Timezone");
  await expect(target(page)).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator(".result")).toHaveCount(0);
  await expect(page.getByRole("alert")).toContainText(/timezone/i);
  await target(page).fill("+05:45");
  await page.getByLabel("Message with a date or time").click();
  await expect(target(page)).toHaveValue("+05:45");
  await expect(target(page)).not.toHaveAttribute("aria-invalid", "true");
  await exactResult(page, "20:45", /9 Apr(?:il)? 2026/, "UTC+05:45");
  await enterZone(page, "");
  await exactResult(page, "01:00", /10 Apr(?:il)? 2026/, "UTC+10:00 Sydney");
  await target(page).click();
  await target(page).fill("Tokyo");
  await (await ownedList(page, "Convert to")).getByRole("option", { name: "Tokyo", exact: true }).click();
  await expect(target(page)).toHaveValue("Asia/Tokyo");
  await expect(source(page)).toHaveValue("UTC");
  await exactResult(page, "00:00", /10 Apr(?:il)? 2026/, "UTC+09:00 Tokyo");
  row.preferences = await page.evaluate(() => JSON.parse(localStorage.getItem("chronoshift.preferences.v1") || "null"));
  expect(row.preferences).toEqual({ target: "Asia/Tokyo", source: "UTC", hourCycle: "24", dateOrder: "mdy", theme: "dark" });
  await page.reload();
  await page.getByText("More options", { exact: true }).click();
  await expect(target(page)).toHaveValue("Asia/Tokyo");
  await expect(source(page)).toHaveValue("UTC");
  await page.getByLabel("Message with a date or time").fill("April 9, 2026 3pm UTC");
  await exactResult(page, "00:00", /10 Apr(?:il)? 2026/, "UTC+09:00 Tokyo");
}
async function themeResize(page: Page, row: any) {
  await setup(page);
  await page.getByLabel("Appearance", { exact: true }).click();
  await choose(page, "Theme", "system");
  await page.getByLabel("Appearance", { exact: true }).click();
  await target(page).scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Show target timezones", exact: true }).click();
  const list = await ownedList(page, "Convert to");
  const id = await target(page).getAttribute("aria-controls");
  await expect(list.getByRole("option")).toHaveCount(454);
  await expect(list.locator('[data-value="Pacific/Chatham"] [slot="label"]')).toHaveText("Chatham");
  await expect(list.locator('[data-value="Pacific/Chatham"] [slot="description"]')).toHaveText("Pacific/Chatham");
  row.geometry = [];
  for (const [scheme, width] of [["light", 900], ["dark", 280], ["light", 900]] as const) {
    await page.emulateMedia({ colorScheme: scheme, reducedMotion: "no-preference" });
    await page.setViewportSize({ width, height: 960 });
    await expect(page.locator("html")).toHaveAttribute("data-theme", scheme);
    await expect(target(page)).toHaveAttribute("aria-controls", id!);
    await expect(list).toBeVisible();
    await expect(list.getByRole("option")).toHaveCount(454);
    const popup = list.locator("..");
    await expect.poll(async () => {
      const b = await popup.boundingBox();
      return !!b && b.x >= 0 && b.x + b.width <= width + 1 && b.y >= 0 && b.y + b.height <= 961;
    }).toBe(true);
    const geometry = await popup.evaluate((el) => {
      const b = el.getBoundingClientRect();
      const css = getComputedStyle(el);
      return { bounds: { x: b.x, y: b.y, width: b.width, height: b.height }, horizontalOverflow: el.scrollWidth > el.clientWidth,
        background: css.backgroundColor, border: css.borderTopWidth,
        clippedRows: Array.from(el.querySelectorAll(".choice-item-text")).filter(item => item.scrollWidth > item.clientWidth).length,
        reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches };
    });
    expect(geometry.horizontalOverflow).toBe(false);
    expect(geometry.clippedRows).toBe(0);
    expect(geometry.border).toBe("1px");
    expect(geometry.reducedMotion).toBe(false);
    row.geometry.push({ scheme, width, ...geometry, control: await target(page).boundingBox(), listId: id });
    await expect(target(page)).toHaveValue("Asia/Tokyo");
    await expect(source(page)).toHaveValue("UTC");
    await exactResult(page, "00:00", /10 Apr(?:il)? 2026/, "UTC+09:00 Tokyo");
    row.capturePhase = true;
    await page.evaluate(() => { (window as any).__reviewCapturePhase = true; });
    await page.screenshot({ path: join(out, `${row.engine}-${scheme}-${width}.png`) });
    await page.evaluate(() => { (window as any).__reviewCapturePhase = false; });
    row.capturePhase = false;
  }
  await target(page).press("Escape");
  await expect(target(page)).toHaveAttribute("aria-expanded", "false");
  await target(page).press("ArrowDown");
  await expect(await ownedList(page, "Convert to")).toBeVisible();
  await target(page).press("Escape");
  await expect(target(page)).toHaveValue("Asia/Tokyo");
}
const journeys = { openCompletion, deviceChange, customReset, themeResize };
try {
  for (const [engine, type] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await type.launch();
    raw[engine] = browser.version();
    try {
      for (const [condition, journey] of Object.entries(journeys)) {
        const row: any = { engine, condition, startedAt: new Date().toISOString(), status: "running", pageErrors: [], consoleErrors: [], csp: [] };
        raw.rows.push(row);
        const context = await browser.newContext({ viewport: raw.viewport, deviceScaleFactor: 1, locale: "en-AU", timezoneId: "Australia/Sydney", reducedMotion: "no-preference", colorScheme: "dark" });
        const page = await context.newPage();
        page.on("pageerror", error => row.pageErrors.push(error.message));
        page.on("console", message => { if (message.type() === "error") row.consoleErrors.push({ message: message.text(), capturePhase: !!row.capturePhase }); });
        await page.exposeFunction("recordReviewCsp", (event: any) => row.csp.push(event));
        await page.addInitScript(() => document.addEventListener("securitypolicyviolation", event => (window as any).recordReviewCsp({ directive: event.effectiveDirective, blockedURI: event.blockedURI, capturePhase: !!(window as any).__reviewCapturePhase })));
        try {
          await journey(page, row);
          expect(row.pageErrors).toEqual([]);
          expect(row.consoleErrors.filter((entry: any) => !entry.capturePhase)).toEqual([]);
          expect(row.csp.filter((entry: any) => !entry.capturePhase)).toEqual([]);
          row.status = "passed";
        } catch (error) {
          row.status = "failed";
          row.failure = String(error);
          raw.errors.push({ engine, condition, message: String(error) });
        } finally {
          row.endedAt = new Date().toISOString();
          await context.close();
          await Bun.write(join(out, "raw.json"), JSON.stringify(raw, null, 2));
        }
      }
    } finally { await browser.close(); }
  }
} finally {
  await server.stop(true);
  raw.assetsAfter = await assetHashes();
  raw.endedAt = new Date().toISOString();
  await Bun.write(join(out, "raw.json"), JSON.stringify(raw, null, 2));
}
expect(raw.assetsAfter).toEqual(raw.assetsBefore);
expect(raw.errors).toEqual([]);
console.log(JSON.stringify({ startedAt: raw.startedAt, endedAt: raw.endedAt, rows: raw.rows.length, errors: raw.errors.length }));
