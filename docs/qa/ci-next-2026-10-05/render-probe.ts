import { chromium, firefox, webkit, expect } from "@playwright/test";
import { join, resolve } from "node:path";
import { PREVIEW_CSP } from "../../../scripts/csp";
import { choose, enterZone } from "../../../e2e/choices";

const dir = resolve(import.meta.dir);
const raw: any = {
  startedAt: new Date().toISOString(),
  checkout: Bun.spawnSync(["git", "rev-parse", "HEAD"]).stdout.toString().trim(),
  patch: Bun.spawnSync(["git", "diff", "--", "web"]).stdout.toString(),
  platform: process.platform,
  architecture: process.arch,
  rows: [],
  errors: [],
  artifacts: {},
};
const servers: Record<string, ReturnType<typeof Bun.serve>> = {};
const roots = {
  baseline: "/tmp/chronoshift-ci-next-baseline-dist",
  candidate: resolve("dist"),
};
for (const [variant, root] of Object.entries(roots)) {
  const html = await Bun.file(join(root, "index.html")).text();
  const paths = ["index.html", "sw.js", "release.json", ...Array.from(html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g), (m) => m[1].slice(1))];
  raw.artifacts[variant] = Object.fromEntries(await Promise.all(paths.map(async (path) => [path, new Bun.CryptoHasher("sha256").update(await Bun.file(join(root, path)).arrayBuffer()).digest("hex")])));
  servers[variant] = Bun.serve({ hostname: "127.0.0.1", port: 0, async fetch(request) {
    const path = new URL(request.url).pathname.slice(1) || "index.html";
    const file = Bun.file(join(root, path));
    if (!(await file.exists())) return new Response("Not found", { status: 404 });
    const type = path.endsWith(".js") ? "text/javascript" : path.endsWith(".css") ? "text/css" : path.endsWith(".webmanifest") ? "application/manifest+json" : file.type;
    return new Response(file, { headers: { "Content-Type": type, "Content-Security-Policy": PREVIEW_CSP, "Cache-Control": "no-cache" } });
  }});
}
try {
  for (const [engine, type] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await type.launch();
    raw[engine] = browser.version();
    try {
      for (const [block, variant] of ["baseline", "candidate", "candidate", "baseline"].entries()) {
        const context = await browser.newContext({ viewport: { width: 900, height: 640 }, deviceScaleFactor: 1, locale: "en-AU", timezoneId: "Australia/Sydney", reducedMotion: "no-preference" });
        const page = await context.newPage();
        page.on("pageerror", (error) => raw.errors.push({ engine, variant, message: error.message }));
        try {
          await page.goto(servers[variant].url.href);
          await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
          await enterZone(page, "UTC");
          await page.getByText("More options", { exact: true }).click();
          await choose(page, "Time display", "24");
          await page.getByLabel("Message with a date or time").fill("June 18, 2026 at 1pm in Tokyo");
          await expect(page.locator(".hero-time")).toHaveText("04:00");
          const cdp = engine === "chromium" ? await context.newCDPSession(page) : undefined;
          await cdp?.send("Performance.enable", { timeDomain: "threadTicks" });
          for (let index = 0; index < 6; index++) {
            const text = `June 18, 2026 at 3:${20 + index}pm in Tokyo`;
            const expected = `06:${20 + index}`;
            await page.evaluate(() => {
              const panel = document.querySelector(".result-panel")!;
              const observed: any = { armed: performance.now(), pending: null, settled: null };
              (window as any).__renderProbe = observed;
              const observer = new MutationObserver(() => {
                if (panel.getAttribute("aria-busy") === "true" && observed.pending === null) observed.pending = performance.now();
                if (observed.pending !== null && panel.getAttribute("aria-busy") === "false" && panel.querySelector(".hero-time")) {
                  observed.settled = performance.now();
                  observer.disconnect();
                }
              });
              observer.observe(panel, { subtree: true, childList: true, attributes: true });
              (window as any).__renderProbeObserver = observer;
            });
            const before = cdp ? await cdp.send("Performance.getMetrics") : undefined;
            const started = performance.now();
            await page.getByLabel("Message with a date or time").fill(text);
            await expect(page.locator(".hero-time")).toHaveText(expected);
            await expect(page.locator(".result-date")).toHaveText(/18 Jun(?:e)? 2026/);
            await expect(page.locator(".result-zone")).toHaveText("UTC");
            await expect(page.locator(".result")).toHaveCount(1);
            const elapsedMs = performance.now() - started;
            const after = cdp ? await cdp.send("Performance.getMetrics") : undefined;
            const observation = await page.evaluate(() => {
              (window as any).__renderProbeObserver.disconnect();
              return { ...(window as any).__renderProbe, motionReduced: matchMedia("(prefers-reduced-motion: reduce)").matches, input: (document.querySelector("textarea") as HTMLTextAreaElement).value, time: document.querySelector(".hero-time")?.textContent };
            });
            if (observation.pending === null || observation.settled === null) throw Error("Missing owned conversion transition");
            raw.rows.push({ engine, variant, block, index, text, expected, elapsedMs, before, after, observation, at: new Date().toISOString() });
          }
          await cdp?.detach();
        } finally { await context.close(); }
      }
    } finally { await browser.close(); }
  }
} catch (error) {
  raw.errors.push({ message: String(error) });
  throw error;
} finally {
  for (const server of Object.values(servers)) await server.stop(true);
  raw.endedAt = new Date().toISOString();
  await Bun.write(join(dir, "render-probe-raw.json"), JSON.stringify(raw, null, 2));
  console.log(JSON.stringify({ startedAt: raw.startedAt, endedAt: raw.endedAt, rows: raw.rows.length, errors: raw.errors.length }));
}
