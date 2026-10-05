import { chromium, firefox, webkit } from "playwright";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const repository = "/Users/tien/Developer/ChronoShift";
const output = join(
  repository,
  "docs/qa/actions-upgrade-2026-10-05/code/worker-startup",
);
const began = new Date().toISOString();
const hash = async (path: string) =>
  new Bun.CryptoHasher("sha256")
    .update(await Bun.file(path).arrayBuffer())
    .digest("hex");
const assets = await readdir(join(repository, "dist/assets"));
const workers = assets.filter((name) => /^worker-.*\.js$/.test(name));
if (workers.length !== 1)
  throw new Error("expected one current production worker");
const workerPath = "assets/" + workers[0];
const fixturePath = join(repository, "tests/fixtures/temporal.json");
const sourceFixtures = await Bun.file(fixturePath).json();
const names = [
  "fixed EST in spring",
  "regional PT summer",
  "quarter hour offset",
  "relative in Tokyo",
];
const fixtures = names.map((name) => {
  const fixture = sourceFixtures.find((item: any) => item.name === name);
  if (!fixture || fixture.warning || fixture.dates)
    throw new Error("expected unambiguous instant fixture " + name);
  return {
    name,
    text: fixture.text,
    options: {
      now: "2026-04-06T12:00:00Z",
      sourceZone: "UTC",
      targetZone: "Australia/Sydney",
      locale: "en-AU",
      hourCycle: "24",
      dateOrder: "mdy",
    },
    expected: { instants: fixture.instants, dates: [], warnings: [] },
  };
});
const identity = {
  release: await Bun.file(join(repository, "dist/release.json")).json(),
  workerPath,
  workerSha256: await hash(join(repository, "dist", workerPath)),
  appPath: "assets/index-B3d9YDa-.js",
  appSha256: await hash(join(repository, "dist/assets/index-B3d9YDa-.js")),
  fixtureSha256: await hash(fixturePath),
  scriptSha256: await hash(import.meta.path),
};
if (
  identity.release.sourceCommit !==
    "35e11bac657a0c379fda48af9b454e674d2ea854" ||
  identity.workerSha256 !==
    "e17b01198be6045d352561d10fe1f6004eb83d106b13f16ef027f0ec36230704" ||
  identity.appSha256 !==
    "764439adde23302a0e40ff2c221e8fe13055671a6285ac16d528344cf06befc9"
)
  throw new Error("production build identity changed");
const report: any = {
  began,
  identity,
  fixtures,
  environment: {
    platform: process.platform,
    arch: process.arch,
    bun: Bun.version,
    playwright: (
      await Bun.file(
        join(repository, "node_modules/playwright/package.json"),
      ).json()
    ).version,
  },
  conditions: {
    samplesPerCondition: 12,
    enginesSerial: true,
    requestsSerial: true,
    motion: "no-preference",
    serviceWorkers: "block",
    viewport: { width: 900, height: 640 },
    raster: 1,
    requestTimeoutMs: 5000,
    warmup:
      "one initial fresh request, then one prime of the reused worker; both exact-checked and separately retained",
    timing:
      "same-page performance.now; fresh includes constructor-to-message, idle includes postMessage-to-message; worker/module/network/JIT costs are combined, not separately CPU-attributed",
    ordering:
      "matched fixture per pair, alternating fresh-first and idle-first",
  },
  engines: [],
};
const child = Bun.spawn([process.execPath, "scripts/serve-web.ts"], {
  cwd: repository,
  env: { ...process.env, PORT: "0", CHRONOSHIFT_TEST_SERVER: "0" },
  stdout: "pipe",
  stderr: "pipe",
});
let activeBrowser: any;
try {
  const reader = child.stdout.getReader();
  let text = "";
  const origin = await Promise.race([
    (async () => {
      while (true) {
        const part = await reader.read();
        if (part.done) throw new Error("server exited before ready");
        text += new TextDecoder().decode(part.value);
        const match = text.match(/http:\/\/127\.0\.0\.1:\d+\//);
        if (match) {
          reader.releaseLock();
          return match[0];
        }
      }
    })(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("server startup deadline")), 10000),
    ),
  ]);
  report.origin = origin;
  for (const [engine, launcher] of Object.entries({
    chromium,
    firefox,
    webkit,
  })) {
    const engineBegan = new Date().toISOString();
    activeBrowser = await launcher.launch();
    const context = await activeBrowser.newContext({
      viewport: { width: 900, height: 640 },
      deviceScaleFactor: 1,
      locale: "en-AU",
      timezoneId: "Australia/Sydney",
      reducedMotion: "no-preference",
      serviceWorkers: "block",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    // Minimal same-origin document avoids App/bootstrap/offline work. The actual
    // production worker remains served unmodified by the ordinary preview server.
    await page.route("**/worker-cost-probe.html", (route) =>
      route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<!doctype html><meta charset=utf-8><title>Worker cost probe</title>",
      }),
    );
    await page.goto(origin + "worker-cost-probe.html");
    const workerUrl = new URL(workerPath, origin).href;
    const response = await page.request.get(workerUrl);
    const servedSha = new Bun.CryptoHasher("sha256")
      .update(await response.body())
      .digest("hex");
    if (response.status() !== 200 || servedSha !== identity.workerSha256)
      throw new Error("served worker identity mismatch");
    const environment = await page.evaluate(() => ({
      at: new Date().toISOString(),
      origin: location.origin,
      userAgent: navigator.userAgent,
      locale: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
      raster: devicePixelRatio,
      performanceTimeOrigin: performance.timeOrigin,
    }));
    const measurements = await page.evaluate(
      async ({ workerUrl, fixtures }) => {
        let serial = 0;
        const owned = new Set<Worker>();
        const make = () => {
          const worker = new Worker(workerUrl, { type: "module" });
          owned.add(worker);
          return worker;
        };
        const stop = (worker: Worker) => {
          worker.terminate();
          owned.delete(worker);
        };
        async function request(
          fixture: any,
          kind: string,
          worker?: Worker,
          index?: number,
        ) {
          const id = ++serial;
          const started = performance.now();
          const active = worker || make();
          const constructed = performance.now();
          try {
            const data: any = await new Promise((resolve, reject) => {
              const timer = setTimeout(() => {
                cleanup();
                reject(new Error("worker request deadline"));
              }, 5000);
              const message = (event: MessageEvent) => {
                if (event.data.id !== id) {
                  cleanup();
                  reject(new Error("unexpected worker message identity"));
                  return;
                }
                cleanup();
                resolve(event.data);
              };
              const error = () => {
                cleanup();
                reject(new Error("production worker error"));
              };
              function cleanup() {
                clearTimeout(timer);
                active.removeEventListener("message", message);
                active.removeEventListener("error", error);
              }
              active.addEventListener("message", message);
              active.addEventListener("error", error);
              active.postMessage({
                id,
                text: fixture.text,
                options: fixture.options,
              });
            });
            const ended = performance.now();
            if (data.error || !data.conversion)
              throw new Error("conversion protocol failed");
            const actual = {
              instants: data.conversion.results.flatMap((result: any) =>
                result.instant ? [result.instant] : [],
              ),
              dates: data.conversion.results.flatMap((result: any) =>
                result.dateOnly ? [result.dateOnly] : [],
              ),
              warnings: data.conversion.warnings,
            };
            if (JSON.stringify(actual) !== JSON.stringify(fixture.expected))
              throw new Error(
                "independent exact oracle mismatch: " + fixture.name,
              );
            return {
              kind,
              index,
              fixture: fixture.name,
              requestId: id,
              startedMs: started,
              constructorMs: constructed - started,
              responseMs: ended - constructed,
              elapsedMs: ended - started,
              actual,
              exactPassed: true,
            };
          } finally {
            if (!worker) stop(active);
          }
        }
        try {
          const bootstrap = await request(fixtures[0], "fresh-bootstrap");
          const reused = make();
          const prime = await request(fixtures[0], "idle-prime", reused);
          const samples = [];
          for (let index = 0; index < 12; index++) {
            const fixture = fixtures[index % fixtures.length];
            for (const kind of index % 2 === 0
              ? ["fresh", "idle"]
              : ["idle", "fresh"])
              samples.push(
                await request(
                  fixture,
                  kind,
                  kind === "idle" ? reused : undefined,
                  index,
                ),
              );
          }
          return {
            bootstrap,
            prime,
            samples,
            endedAt: new Date().toISOString(),
            endedMs: performance.now(),
          };
        } finally {
          for (const worker of owned) worker.terminate();
          owned.clear();
        }
      },
      { workerUrl, fixtures },
    );
    report.engines.push({
      engine,
      began: engineBegan,
      ended: new Date().toISOString(),
      browserVersion: activeBrowser.version(),
      workerUrl,
      servedWorkerSha256: servedSha,
      environment,
      measurements,
    });
    await context.close();
    await activeBrowser.close();
    activeBrowser = undefined;
    await Bun.write(
      join(output, "raw.json"),
      JSON.stringify(
        { ...report, progressAt: new Date().toISOString() },
        null,
        2,
      ) + "\n",
    );
    console.log(
      JSON.stringify({
        engine,
        samples: measurements.samples.length,
        exactPassed: true,
        ended: new Date().toISOString(),
      }),
    );
  }
  report.verdict =
    "isolated matched samples completed with exact independent results; no App lifecycle or CI target acceptance";
} catch (error) {
  report.verdict = "measurement incomplete";
  report.error =
    error instanceof Error ? error.message : "unknown measurement error";
  process.exitCode = 1;
} finally {
  if (activeBrowser) await activeBrowser.close();
  child.kill();
  await child.exited;
  report.ended = new Date().toISOString();
  await Bun.write(
    join(output, "raw.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
}
