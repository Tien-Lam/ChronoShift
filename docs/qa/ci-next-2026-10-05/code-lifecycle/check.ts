import { chromium, firefox, expect, type Page } from "@playwright/test";
import { resolve, relative, extname } from "node:path";
import { PREVIEW_CSP } from "../../../../scripts/csp";
import { choose, enterZone } from "../../../../e2e/choices";

// Deliberately standalone: never invokes the project build or whole gate.
const output = resolve(import.meta.dir);
const root = resolve(process.env.CHRONOSHIFT_REVIEW_DIST || "dist");
const expectedBlobs = [
  "8a72819c1c20cc6e20b168578d76e71e80e9af29",
  "61cfa2b0e23279b9986d816119f0d722272c6bfd",
];
const raw: any = {
  startedAt: new Date().toISOString(),
  platform: process.platform,
  architecture: process.arch,
  root,
  port: 4198,
  expectedBlobs,
  cases: [],
  errors: [],
  served: {},
};
const hash = async (file: string) =>
  new Bun.CryptoHasher("sha256")
    .update(await Bun.file(file).arrayBuffer())
    .digest("hex");
const git = (...args: string[]) => {
  const result = Bun.spawnSync(["git", ...args]);
  if (result.exitCode) throw Error(result.stderr.toString());
  return result.stdout.toString().trim();
};
raw.head = git("rev-parse", "HEAD");
raw.sourceBlobs = git(
  "hash-object",
  "web/src/App.tsx",
  "web/src/components/Choices.tsx",
).split("\n");
expect(raw.sourceBlobs).toEqual(expectedBlobs);
raw.assetsBefore = {};
for await (const path of new Bun.Glob("**/*").scan({
  cwd: root,
  onlyFiles: true,
}))
  raw.assetsBefore[path] = await hash(resolve(root, path));
raw.release = await Bun.file(resolve(root, "release.json")).json();
const mime: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json",
};
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 4198,
  async fetch(request) {
    const path = resolve(
      root,
      new URL(request.url).pathname.slice(1) || "index.html",
    );
    if (!path.startsWith(root + "/"))
      return new Response("Not found", { status: 404 });
    const file = Bun.file(path);
    if (!(await file.exists()))
      return new Response("Not found", { status: 404 });
    const key = relative(root, path);
    raw.served[key] = await hash(path);
    return new Response(request.method === "HEAD" ? null : file, {
      headers: {
        "Content-Type": mime[extname(path)] || file.type,
        "Content-Security-Policy": PREVIEW_CSP,
        "Cache-Control": "no-cache",
        "X-Content-Type-Options": "nosniff",
      },
    });
  },
});

async function ready(page: Page) {
  await page.goto(server.url.href);
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  await page.getByText("More options", { exact: true }).click();
}
async function prefs(page: Page, expected: object) {
  await expect
    .poll(() =>
      page.evaluate(() =>
        JSON.parse(localStorage.getItem("chronoshift.preferences.v1") || "{}"),
      ),
    )
    .toEqual(expected);
}
async function exact(
  page: Page,
  time: string | RegExp,
  date: RegExp,
  zone: string,
) {
  await expect(page.locator(".result")).toHaveCount(1);
  await expect(page.locator(".hero-time")).toHaveText(time);
  await expect(page.locator(".result-date")).toHaveText(date);
  await expect(page.locator(".result-zone")).toHaveText(zone);
  await expect(page.locator(".result-panel")).toHaveAttribute(
    "aria-busy",
    "false",
  );
}
async function releaseWorker(page: Page) {
  await page.evaluate(() => {
    const state = window as any;
    const callback = state.heldWorker.shift();
    if (!callback) throw Error("No captured native worker callback");
    callback();
    state.releasedWorker++;
  });
}

const conditions = [
  {
    name: "reset/current preferences and both zone callbacks reject a captured old worker completion",
    async run(page: Page) {
      await ready(page);
      await enterZone(page, "UTC");
      await enterZone(page, "Asia/Tokyo", "Source timezone when none is given");
      await choose(page, "Time display", "24");
      await choose(page, "Numeric dates", "dmy");
      await page.evaluate(() => ((window as any).holdWorker = true));
      await page
        .getByLabel("Message with a date or time")
        .fill("04/09/2026 3pm");
      await expect
        .poll(() => page.evaluate(() => (window as any).heldWorker.length))
        .toBe(1);
      await page.evaluate(() => ((window as any).holdWorker = false));
      await page
        .getByRole("button", { name: "Reset preferences", exact: true })
        .click();
      await expect(page.getByLabel("Convert to", { exact: true })).toHaveValue(
        "",
      );
      await expect(
        page.getByLabel("Source timezone when none is given", { exact: true }),
      ).toHaveValue("");
      await enterZone(
        page,
        "America/New_York",
        "Source timezone when none is given",
      );
      await enterZone(page, "UTC");
      await exact(page, /7:00 pm/i, /9 Apr(?:il)? 2026/, "UTC");
      await prefs(page, {
        target: "UTC",
        source: "America/New_York",
        hourCycle: "auto",
        dateOrder: "mdy",
        theme: "dark",
      });
      await releaseWorker(page);
      await exact(page, /7:00 pm/i, /9 Apr(?:il)? 2026/, "UTC");
      await expect(page.getByLabel("Convert to", { exact: true })).toHaveValue(
        "UTC",
      );
      await expect(
        page.getByLabel("Source timezone when none is given", { exact: true }),
      ).toHaveValue("America/New_York");
      await enterZone(page, "Definitely/Invalid");
      await expect(page.getByRole("alert")).toContainText(/timezone/i);
      await expect(page.locator(".result")).toHaveCount(0);
      await enterZone(page, "+05:45");
      await exact(page, /12:45 am/i, /10 Apr(?:il)? 2026/, "UTC+05:45");
      await expect(
        page.getByLabel("Source timezone when none is given", { exact: true }),
      ).toHaveValue("America/New_York");
    },
  },
  {
    name: "delayed import and copy rejection retain ownership through changed source and target",
    async run(page: Page) {
      await ready(page);
      await enterZone(page, "UTC");
      await enterZone(page, "Asia/Tokyo", "Source timezone when none is given");
      await choose(page, "Time display", "24");
      await page
        .getByLabel("Message with a date or time")
        .fill("June 18, 2026 3pm");
      await exact(page, "06:00", /18 Jun(?:e)? 2026/, "UTC");
      await page.getByRole("button", { name: "Paste", exact: true }).click();
      await expect
        .poll(() => page.evaluate(() => typeof (window as any).resolveImport))
        .toBe("function");
      await enterZone(
        page,
        "America/New_York",
        "Source timezone when none is given",
      );
      await exact(page, "19:00", /18 Jun(?:e)? 2026/, "UTC");
      await page.evaluate(() =>
        (window as any).resolveImport("April 9, 2026 3pm UTC"),
      );
      await expect(
        page.getByRole("button", { name: "Replace with imported text" }),
      ).toBeVisible();
      await expect(page.getByLabel("Message with a date or time")).toHaveValue(
        "June 18, 2026 3pm",
      );
      await page.getByRole("button", { name: "Dismiss imported text" }).click();
      await page.getByRole("button", { name: /^Copy / }).click();
      await expect
        .poll(() => page.evaluate(() => typeof (window as any).rejectCopy))
        .toBe("function");
      await enterZone(page, "+05:45");
      await exact(page, "00:45", /19 Jun(?:e)? 2026/, "UTC+05:45");
      const message = page.getByLabel("Message with a date or time");
      await message.click();
      await page.evaluate(() =>
        (window as any).rejectCopy(new Error("Injected held-copy rejection")),
      );
      // Observe beyond the deferred focus boundary without reacquiring focus.
      await page.evaluate(
        () =>
          new Promise<void>((done) =>
            requestAnimationFrame(() => requestAnimationFrame(() => done())),
          ),
      );
      await expect(message).toBeFocused();
      await expect(page.getByLabel("Text to copy")).toHaveCount(0);
      await expect(page.locator(".notice")).toHaveText("");
      await message.press("End");
      await message.press("Space");
      await expect(message).toHaveValue("June 18, 2026 3pm ");
      await exact(page, "00:45", /19 Jun(?:e)? 2026/, "UTC+05:45");
    },
  },
  {
    name: "open full popup survives unrelated native worker completion and remains operable",
    async run(page: Page) {
      await ready(page);
      await enterZone(page, "UTC");
      await enterZone(page, "Asia/Tokyo", "Source timezone when none is given");
      await choose(page, "Time display", "24");
      await page.evaluate(() => ((window as any).holdWorker = true));
      await page
        .getByLabel("Message with a date or time")
        .fill("June 18, 2026 3pm");
      await expect
        .poll(() => page.evaluate(() => (window as any).heldWorker.length))
        .toBe(1);
      await page
        .getByRole("button", { name: "Show target timezones", exact: true })
        .click();
      const target = page.getByLabel("Convert to", { exact: true });
      const listId = await target.getAttribute("aria-controls");
      expect(listId).toBeTruthy();
      const list = page.locator(`[id="${listId}"]`);
      await expect(list.getByRole("option")).toHaveCount(454);
      await releaseWorker(page);
      await exact(page, "06:00", /18 Jun(?:e)? 2026/, "UTC");
      await expect(target).toHaveValue("UTC");
      await expect(target).toHaveAttribute("aria-expanded", "true");
      await expect(list.getByRole("option")).toHaveCount(454);
      await page.keyboard.press("Escape");
      await expect(target).toBeFocused();
      await page.evaluate(() => ((window as any).holdWorker = false));
      await target.fill("Tokyo");
      await target.press("ArrowDown");
      await target.press("Enter");
      await expect(target).toHaveValue("Asia/Tokyo");
      await expect(
        page.getByLabel("Source timezone when none is given", { exact: true }),
      ).toHaveValue("Asia/Tokyo");
      await exact(page, "15:00", /18 Jun(?:e)? 2026/, "UTC+09:00 Tokyo");
    },
  },
];

try {
  for (const [engine, type] of Object.entries({ chromium, firefox })) {
    const browser = await type.launch();
    raw[engine] = browser.version();
    try {
      for (const condition of conditions) {
        const row: any = {
          engine,
          name: condition.name,
          startedAt: new Date().toISOString(),
          errors: [],
          csp: [],
        };
        raw.cases.push(row);
        const context = await browser.newContext({
          viewport: { width: 900, height: 900 },
          deviceScaleFactor: 1,
          locale: "en-AU",
          timezoneId: "Australia/Sydney",
          reducedMotion: "no-preference",
        });
        await context.addInitScript(() => {
          const state = window as any;
          state.holdWorker = false;
          state.heldWorker = [];
          state.releasedWorker = 0;
          const Native = Worker;
          window.Worker = new Proxy(Native, {
            construct(Target, args) {
              const worker = Reflect.construct(Target, args);
              return new Proxy(worker, {
                get(target, property) {
                  const value = Reflect.get(target, property, target);
                  return typeof value === "function"
                    ? value.bind(target)
                    : value;
                },
                set(target, property, value) {
                  if (property === "onmessage")
                    target.onmessage = (event: MessageEvent) => {
                      if (state.holdWorker)
                        state.heldWorker.push(() => value(event));
                      else value(event);
                    };
                  else Reflect.set(target, property, value, target);
                  return true;
                },
              });
            },
          });
          Object.defineProperty(navigator, "clipboard", {
            configurable: true,
            value: {
              readText: () =>
                new Promise<string>((done) => (state.resolveImport = done)),
              writeText: () =>
                new Promise<void>((_, reject) => (state.rejectCopy = reject)),
            },
          });
          state.csp = [];
          document.addEventListener("securitypolicyviolation", (event) =>
            state.csp.push({
              directive: event.effectiveDirective,
              blockedURI: event.blockedURI,
            }),
          );
        });
        const page = await context.newPage();
        page.on("pageerror", (error) => row.errors.push(error.message));
        try {
          await condition.run(page);
          row.csp = await page.evaluate(() => (window as any).csp);
          expect(row.errors).toEqual([]);
          expect(row.csp).toEqual([]);
          row.motionReduced = await page.evaluate(
            () => matchMedia("(prefers-reduced-motion: reduce)").matches,
          );
          expect(row.motionReduced).toBe(false);
          row.outcome = "passed";
        } catch (error) {
          row.outcome = "failed";
          row.failure = String(error);
          await Bun.write(
            resolve(output, `${engine}-${raw.cases.length}-failure.html`),
            await page.content(),
          );
          await page.screenshot({
            path: resolve(output, `${engine}-${raw.cases.length}-failure.png`),
          });
          raw.errors.push({
            engine,
            name: condition.name,
            message: String(error),
          });
        } finally {
          row.endedAt = new Date().toISOString();
          await context.close();
        }
      }
    } finally {
      await browser.close();
    }
  }
  raw.assetsAfter = {};
  for await (const path of new Bun.Glob("**/*").scan({
    cwd: root,
    onlyFiles: true,
  }))
    raw.assetsAfter[path] = await hash(resolve(root, path));
  expect(raw.assetsAfter).toEqual(raw.assetsBefore);
  expect(
    git(
      "hash-object",
      "web/src/App.tsx",
      "web/src/components/Choices.tsx",
    ).split("\n"),
  ).toEqual(expectedBlobs);
} catch (error) {
  raw.errors.push({ message: String(error) });
} finally {
  await server.stop(true);
  raw.endedAt = new Date().toISOString();
  await Bun.write(resolve(output, "raw.json"), JSON.stringify(raw, null, 2));
  console.log(
    JSON.stringify({
      startedAt: raw.startedAt,
      endedAt: raw.endedAt,
      cases: raw.cases.length,
      errors: raw.errors.length,
    }),
  );
}
if (raw.errors.length) process.exitCode = 1;
