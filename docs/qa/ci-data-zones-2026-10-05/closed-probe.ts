import { chromium, firefox, webkit, expect } from "@playwright/test";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd(),
  scratch = "/tmp/chronoshift-data-zones";
const output = join(import.meta.dir, "closed-probe.json");
const startedAt = new Date().toISOString();
const rows: any[] = [],
  phases: any[] = [];
let active: ReturnType<typeof Bun.spawn> | undefined;
async function inventory(
  dir: string,
  prefix = "",
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(join(dir, prefix), {
    withFileTypes: true,
  })) {
    const path = join(prefix, entry.name);
    if (entry.isDirectory()) Object.assign(result, await inventory(dir, path));
    else if (entry.isFile())
      result[path] = new Bun.CryptoHasher("sha256")
        .update(await Bun.file(join(dir, path)).arrayBuffer())
        .digest("hex");
    else throw Error(`Unexpected file ${path}`);
  }
  return result;
}
async function stop() {
  if (active) {
    active.kill("SIGTERM");
    await active.exited;
    active = undefined;
  }
}
async function server(variant: string) {
  active = Bun.spawn(["bun", join(root, "scripts/serve-web.ts")], {
    cwd: join(scratch, variant + "-runtime"),
    env: {
      ...process.env,
      PORT: "0",
      BASE_PATH: "/",
      CHRONOSHIFT_TEST_SERVER: "0",
    },
    stdout: "pipe",
    stderr: "inherit",
  });
  const reader = active.stdout.getReader();
  let text = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) throw Error("Server ended before origin");
    text += new TextDecoder().decode(value);
    const match = text.match(/http:\/\/127\.0\.0\.1:\d+\//);
    if (match) {
      reader.releaseLock();
      return match[0];
    }
  }
}
async function metrics(session: any) {
  const value = await session.send("Performance.getMetrics");
  return Object.fromEntries(
    value.metrics
      .filter((row: any) =>
        [
          "ScriptDuration",
          "TaskDuration",
          "LayoutDuration",
          "RecalcStyleDuration",
        ].includes(row.name),
      )
      .map((row: any) => [row.name, row.value]),
  );
}
try {
  for (const [phase, variant] of [
    "baseline",
    "candidate",
    "candidate",
    "baseline",
  ].entries()) {
    const dist = join(scratch, variant + "-runtime/dist");
    const before = await inventory(dist),
      origin = await server(variant);
    const served = [];
    for (const [path, fileHash] of Object.entries(before)) {
      const response = await fetch(new URL(path, origin), {
        cache: "no-store",
      });
      const servedHash = new Bun.CryptoHasher("sha256")
        .update(await response.arrayBuffer())
        .digest("hex");
      served.push({ path, status: response.status, fileHash, servedHash });
      if (response.status !== 200 || fileHash !== servedHash)
        throw Error(`Served mismatch ${path}`);
    }
    phases.push({
      phase,
      variant,
      origin,
      before,
      served,
      startedAt: new Date().toISOString(),
    });
    for (const [engine, type] of Object.entries({
      chromium,
      firefox,
      webkit,
    })) {
      const browser = await type.launch();
      try {
        for (let sample = 0; sample < 3; sample++) {
          const context = await browser.newContext({
            locale: "en-AU",
            timezoneId: "Australia/Sydney",
            viewport: { width: 900, height: 640 },
            deviceScaleFactor: 1,
            reducedMotion: "no-preference",
          });
          try {
            const page = await context.newPage(),
              errors: string[] = [];
            page.on("pageerror", (error) => errors.push(error.message));
            const session =
              engine === "chromium"
                ? await context.newCDPSession(page)
                : undefined;
            if (session) await session.send("Performance.enable");
            const initialMetrics = session ? await metrics(session) : undefined;
            const row: any = {
              phase,
              variant,
              engine,
              sample,
              browserVersion: browser.version(),
              origin,
              startedAt: new Date().toISOString(),
              edits: [],
            };
            const start = performance.now();
            await page.goto(origin);
            await expect(page.locator("main")).toHaveAttribute(
              "data-offline-ready",
              "true",
            );
            row.readyMs = performance.now() - start;
            row.readyMetrics = session ? await metrics(session) : undefined;
            row.initialMetrics = initialMetrics;
            for (const day of [9, 10, 11]) {
              const began = performance.now(),
                beforeMetrics = session ? await metrics(session) : undefined;
              await page
                .getByLabel("Message with a date or time")
                .fill(`April ${day}, 2026 3pm UTC`);
              await expect(page.locator(".hero-time")).toHaveText(/1:00 am/i);
              await expect(page.locator(".result-date")).toHaveText(
                new RegExp(`${day + 1} Apr(?:il)? 2026`),
              );
              row.edits.push({
                day,
                elapsedMs: performance.now() - began,
                beforeMetrics,
                afterMetrics: session ? await metrics(session) : undefined,
              });
            }
            expect(errors).toEqual([]);
            expect(
              await page
                .getByText("More options", { exact: true })
                .evaluate(
                  (element) =>
                    (element.parentElement as HTMLDetailsElement).open,
                ),
            ).toBe(false);
            row.endedAt = new Date().toISOString();
            row.errors = errors;
            row.script = await page
              .locator("script[type=module]")
              .getAttribute("src");
            rows.push(row);
          } finally {
            await context.close();
          }
        }
      } finally {
        await browser.close();
      }
    }
    const after = await inventory(dist);
    Object.assign(phases.at(-1)!, { after, endedAt: new Date().toISOString() });
    if (JSON.stringify(before) !== JSON.stringify(after))
      throw Error("Changed frozen artifact");
    await stop();
    console.log(JSON.stringify({ phase, variant, rows: rows.length }));
  }
} finally {
  await stop();
  await Bun.write(
    output,
    JSON.stringify(
      {
        startedAt,
        endedAt: new Date().toISOString(),
        environment: {
          bun: Bun.version,
          platform: process.platform,
          arch: process.arch,
        },
        phases,
        rows,
        scope:
          "Serial local ABBA; three fresh contexts per engine/phase; ordinary 900x640 1x normal-motion UI with More options closed. Readiness/result locator elapsed includes observation delay and 250ms debounce. Chromium CDP duration counters are cumulative seconds for page renderer, not whole-browser/worker/CPU-profile/Linux CI time. Both sourceCommit markers are base CEA; full served hashes identify actual artifacts. No captures, forced actions, fault injection or browser coverage changes. Partial failures are preserved and invalidate comparison.",
      },
      null,
      2,
    ),
  );
}
