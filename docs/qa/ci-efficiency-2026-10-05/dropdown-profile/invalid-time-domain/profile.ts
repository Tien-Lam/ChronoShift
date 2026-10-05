// Bounded observational Chromium profile on unchanged production build.
// No screenshots, assertions changed, source edits, motion suppression or CI.
import { chromium, expect, type Page, type CDPSession } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { cpus, totalmem, release } from "node:os";
const folder = import.meta.dir;
const origin = "http://127.0.0.1:4298/";
const began = new Date().toISOString();
const get = async (path: string) => {
  const response = await fetch(new URL(path, origin));
  const body = await response.text();
  return {
    path,
    status: response.status,
    bytes: new TextEncoder().encode(body).length,
    sha256: new Bun.CryptoHasher("sha256").update(body).digest("hex"),
    body,
  };
};
const html = await get("index.html"),
  sw = await get("sw.js"),
  marker = await get("release.json");
const jsPath = html.body.match(/src="([^"]+\.js)"/)?.[1];
if (
  !jsPath ||
  !sw.body.includes("b5d1df7366de0c5f") ||
  !jsPath.includes("index-DHi9pTHJ.js")
)
  throw new Error("Unexpected origin/assets; refusing mixed-build profiling");
const js = await get(jsPath);
const head = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const browser = await chromium.launch();
const traceEvents: Record<string, unknown>[] = [];
const rows: Record<string, unknown>[] = [];
const messages: Record<string, unknown>[] = [];
const startedAssets = { html, sw, marker, js };
async function stable(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      ),
  );
}
async function metrics(cdp: CDPSession) {
  const { metrics } = await cdp.send("Performance.getMetrics");
  return Object.fromEntries(
    metrics.map((m: { name: string; value: number }) => [m.name, m.value]),
  );
}
try {
  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      viewport,
      reducedMotion: "no-preference",
      colorScheme: "dark",
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      const list: { directive: string; blockedURI: string }[] = [];
      (window as any).__profileCsp = list;
      document.addEventListener("securitypolicyviolation", (e) =>
        list.push({
          directive: e.effectiveDirective,
          blockedURI: e.blockedURI,
        }),
      );
    });
    page.on("pageerror", (e) =>
      messages.push({
        width: viewport.width,
        type: "pageerror",
        message: e.message,
      }),
    );
    await page.goto(origin);
    await expect(page.locator("main")).toHaveAttribute(
      "data-offline-ready", "true", { timeout: 20000 },
    );
    await page.getByText("More options", { exact: true }).click();
    await page.getByLabel("Appearance", { exact: true }).click();
    const cdp = await context.newCDPSession(page);
    await cdp.send("Performance.enable", { timeDomain: "threadTime" });
    cdp.on("Tracing.dataCollected", ({ value }) => traceEvents.push(...value));
    await cdp.send("Tracing.start", {
      categories: "devtools.timeline,v8,blink.user_timing,toplevel",
      transferMode: "ReportEvents",
    });
    const input = page.getByLabel("Convert to", { exact: true });
    const zoneButton = page.getByRole("button", {
      name: "Show target timezones",
      exact: true,
    });
    const themeButton = page.getByRole("button", { name: /Theme$/ });
    const popup = page.locator(".choice-popover:visible");
    async function measure(
      operation: string,
      iteration: number,
      action: () => Promise<void>,
      ready: () => Promise<void>,
    ) {
      const before = await metrics(cdp);
      const start = performance.now();
      const browserStart = await page.evaluate(() => performance.now());
      await page.evaluate(
        (label) => performance.mark(label),
        `${viewport.width}/${iteration}/${operation}/start`,
      );
      const actionStart = performance.now();
      await action();
      const actionMs = performance.now() - actionStart;
      await ready();
      await stable(page);
      const browserEnd = await page.evaluate(() => performance.now());
      await page.evaluate(
        (label) => performance.mark(label),
        `${viewport.width}/${iteration}/${operation}/end`,
      );
      const elapsedMs = performance.now() - start;
      const after = await metrics(cdp);
      const dom = await page.evaluate(() => {
        const box = [
          ...document.querySelectorAll<HTMLElement>(".choice-popover"),
        ].find((n) => n.getBoundingClientRect().height > 0);
        return {
          options: box?.querySelectorAll('[role="option"]').length ?? 0,
          descendants: box?.querySelectorAll("*").length ?? 0,
          liveAnimations: document
            .getAnimations()
            .filter((a) => a.playState === "running").length,
          popupAnimationMs: box
            ? getComputedStyle(box).animationDuration
            : null,
          reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
        };
      });
      const delta = Object.fromEntries(
        [
          "TaskDuration",
          "ScriptDuration",
          "LayoutDuration",
          "RecalcStyleDuration",
          "LayoutCount",
          "RecalcStyleCount",
        ].map((name) => [name, after[name] - before[name]]),
      );
      rows.push({
        width: viewport.width,
        iteration,
        operation,
        actionMs,
        elapsedMs,
        browserElapsedMs: browserEnd - browserStart,
        beforeTimestamp: before.Timestamp,
        afterTimestamp: after.Timestamp,
        delta,
        dom,
      });
    }
    for (let iteration = 0; iteration < 3; iteration++) {
      await themeButton.scrollIntoViewIfNeeded();
      await measure(
        "small-select-open",
        iteration,
        () => themeButton.click(),
        async () => {
          await expect(popup).toBeVisible();
          await expect(page.getByRole("option")).toHaveCount(3);
        },
      );
      await measure(
        "small-select-close",
        iteration,
        () => page.keyboard.press("Escape"),
        async () => {
          await expect(popup).toHaveCount(0);
        },
      );
      await input.scrollIntoViewIfNeeded();
      await input.fill("");
      await page.keyboard.press("Escape");
      await expect(popup).toHaveCount(0);
      await measure(
        "zone-all-open",
        iteration,
        () => zoneButton.click(),
        async () => {
          await expect(popup).toBeVisible();
          await expect
            .poll(() => page.getByRole("option").count())
            .toBeGreaterThan(400);
        },
      );
      await measure(
        "zone-filter",
        iteration,
        () => input.fill("Tokyo"),
        async () => {
          await expect(popup).toBeVisible();
          await expect
            .poll(() => page.getByRole("option").count())
            .toBeLessThan(20);
        },
      );
      await measure(
        "zone-clear-filter",
        iteration,
        () => input.fill(""),
        async () => {
          await expect
            .poll(() => page.getByRole("option").count())
            .toBeGreaterThan(400);
        },
      );
      await measure(
        "zone-all-close",
        iteration,
        () => page.keyboard.press("Escape"),
        async () => {
          await expect(popup).toHaveCount(0);
        },
      );
    }
    const done = new Promise<void>((resolve) =>
      cdp.once("Tracing.tracingComplete", () => resolve()),
    );
    await cdp.send("Tracing.end");
    await done;
    messages.push({
      width: viewport.width,
      type: "csp",
      violations: await page.evaluate(() => (window as any).__profileCsp),
    });
    await context.close();
  }
} finally {
  await browser.close();
  const endedAssets = await Promise.all([
    get("index.html"),
    get("sw.js"),
    get("release.json"),
    get(jsPath),
  ]);
  const identity = {
    began,
    ended: new Date().toISOString(),
    head,
    environment: {
      platform: process.platform,
      arch: process.arch,
      osRelease: release(),
      cpus: cpus().length,
      model: cpus()[0]?.model,
      totalMemoryBytes: totalmem(),
      bun: Bun.version,
      chromium: browser.version(),
    },
    origin,
    staticServer:
      "Bun serve-web; BASE_PATH=/; CHRONOSHIFT_TEST_SERVER=0; PORT=4298",
    motion:
      "no-preference; native CSS motion; no screenshot/Playwright trace stylesheet injection",
    performanceDomain:
      "CDP Performance.enable timeDomain=threadTime; durations in seconds; metric deltas cover action/ready/two-rAF instrumentation window, not Linux CI",
    assetsBefore: Object.fromEntries(
      Object.entries(startedAssets).map(([key, value]) => [
        key,
        { ...value, body: key === "marker" ? value.body : undefined },
      ]),
    ),
    assetsAfter: endedAssets.map((value) => ({
      ...value,
      body: value.path === "release.json" ? value.body : undefined,
    })),
    identicalAssetBytes: Object.values(startedAssets).every(
      (value, index) => value.sha256 === endedAssets[index].sha256,
    ),
    rows,
    messages,
  };
  await Bun.write(
    `${folder}/profile.json`,
    JSON.stringify(identity, null, 2) + "\n",
  );
  await Bun.write(
    `${folder}/chromium-timeline.json`,
    JSON.stringify({ traceEvents }) + "\n",
  );
  console.log(
    JSON.stringify(
      {
        began,
        ended: identity.ended,
        head,
        origin,
        identicalAssetBytes: identity.identicalAssetBytes,
        operations: rows.length,
        messages,
      },
      null,
      2,
    ),
  );
}
