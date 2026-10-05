import { chromium, expect } from "@playwright/test";
import { writeFile } from "node:fs/promises";
const base = "http://127.0.0.1:4264/";
const mode = process.argv[2] || "baseline";
const output = process.argv[3] || mode;
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 900, height: 640 },
  locale: "en-AU",
  timezoneId: "Australia/Sydney",
});
const page = await context.newPage();
const record: any = {
  mode,
  start: new Date().toISOString(),
  browser: browser.version(),
  timeline: [],
  snapshots: [],
};
const started = Date.now();
context.on("page", (p) => hook(p));
function hook(p: any) {
  p.on("console", (m: any) =>
    record.timeline.push({
      ms: Date.now() - started,
      type: "console",
      level: m.type(),
      text: m.text(),
    }),
  );
  p.on("pageerror", (e: any) =>
    record.timeline.push({
      ms: Date.now() - started,
      type: "pageerror",
      message: e.message,
    }),
  );
}
hook(page);
await context.addInitScript(
  ({ mode }) => {
    sessionStorage.setItem("chronoshift-detailed-logs", "true");
    (window as any).initialControl = !!navigator.serviceWorker.controller;
    (window as any).lifecycle = [];
    const capture = (kind: string) => {
      (window as any).lifecycle.push({
        kind,
        at: performance.now(),
        controller: navigator.serviceWorker.controller?.state || null,
      });
    };
    navigator.serviceWorker.addEventListener("controllerchange", () =>
      capture("controllerchange"),
    );
    addEventListener("pageshow", () => capture("pageshow"));
    const native = window.setTimeout;
    window.setTimeout = ((fn: TimerHandler, delay?: number, ...args: any[]) =>
      native(
        fn,
        delay === 15000 &&
          !["real-budget", "real-time-transient"].includes(mode)
          ? 200
          : delay,
        ...args,
      )) as typeof setTimeout;
    // Independent timing challenge: only delay delivery to app ports after the
    // accepted update reload. Worker activation/cache work is left unmodified.
    if (
      mode !== "baseline" &&
      sessionStorage.getItem("adversarial-next") === "yes"
    ) {
      const Real = MessageChannel;
      let transientUntil = 0;
      (window as any).MessageChannel = class extends Real {
        constructor() {
          super();
          let handler: any;
          const port = this.port1;
          Object.defineProperty(port, "onmessage", {
            configurable: true,
            get: () => handler,
            set: (value) => {
              handler = value;
              port.addEventListener("message", (event) =>
                native(
                  () => value?.call(port, event),
                  ["transient-reply", "real-time-transient"].includes(mode)
                    ? typeof event.data?.ready === "boolean"
                      ? Math.max(
                          0,
                          (transientUntil ||=
                            performance.now() +
                            (mode === "real-time-transient" ? 16000 : 350)) -
                            performance.now(),
                        )
                      : 0
                    : 350,
                ),
              );
              port.start();
            },
          });
        }
      };
    }
  },
  { mode },
);
async function publish(v: string) {
  const r = await context.request.post(base + "__test-release", { data: v });
  if (r.status() !== 204) throw Error("publish " + r.status());
}
async function snap(label: string) {
  const state = await page.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration();
    async function identity(worker: ServiceWorker | null | undefined) {
      if (!worker) return null;
      const out: any = { state: worker.state, scriptURL: worker.scriptURL };
      out.response = await new Promise((resolve) => {
        const c = new MessageChannel();
        const t = setTimeout(() => {
          c.port1.close();
          resolve("timeout");
        }, 1200);
        c.port1.onmessage = (e) => {
          clearTimeout(t);
          c.port1.close();
          resolve(e.data);
        };
        worker.postMessage(
          {
            type: "CHECK_READY",
            repairIfMissing: false,
            detailedLogs: true,
            claimUncontrolled: false,
          },
          [c.port2],
        );
      });
      return out;
    }
    const inventory = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      const entries = [];
      for (const req of await cache.keys()) {
        const res = await cache.match(req);
        const buf = await res!.arrayBuffer();
        const hash = Array.from(
          new Uint8Array(await crypto.subtle.digest("SHA-256", buf)),
          (x) => x.toString(16).padStart(2, "0"),
        ).join("");
        entries.push({
          path: new URL(req.url).pathname,
          bytes: buf.byteLength,
          sha256: hash,
        });
      }
      inventory.push({ name, entries });
    }
    return {
      initialControl: (window as any).initialControl,
      ready: document.querySelector("main")?.getAttribute("data-offline-ready"),
      warning: document.querySelector(".message.warning")?.textContent,
      updateButton: !!Array.from(document.querySelectorAll("button")).find(
        (b) => b.textContent?.includes("Update now"),
      ),
      draft: (document.querySelector("textarea") as HTMLTextAreaElement)?.value,
      scope: r?.scope,
      controller: await identity(navigator.serviceWorker.controller),
      active: await identity(r?.active),
      waiting: await identity(r?.waiting),
      installing: await identity(r?.installing),
      inventory,
      lifecycle: (window as any).lifecycle,
    };
  });
  record.snapshots.push({ label, ms: Date.now() - started, ...state });
}
try {
  await publish("first-no-claim");
  await page.goto(base);
  await expect(page.locator("main")).toHaveAttribute(
    "data-offline-ready",
    "true",
  );
  await snap("first-controlled");
  const retained = await context.newPage();
  await retained.goto(base);
  await expect(retained.locator("main")).toHaveAttribute(
    "data-offline-ready",
    "true",
  );
  await publish("second");
  const cdp = await context.newCDPSession(page);
  await Promise.all([
    page.waitForEvent("domcontentloaded"),
    cdp.send("Page.reload", { ignoreCache: true }),
  ]);
  await cdp.detach();
  await page
    .getByLabel("Message with a date or time")
    .fill("June 18, 2026 at 5:20pm Tokyo");
  const zone = page.getByLabel("Convert to");
  await zone.fill("Europe/London");
  await zone.press("Tab");
  await expect(page.getByRole("button", { name: "Update now" })).toBeVisible();
  await expect(page.locator(".message.warning")).toContainText(
    "Offline access is unavailable in this tab.",
  );
  await page.waitForTimeout(400);
  await snap("hard-refresh-warning");
  await page.evaluate(() => sessionStorage.setItem("adversarial-next", "yes"));
  await Promise.all([
    page.waitForEvent("domcontentloaded"),
    page.getByRole("button", { name: "Update now" }).click(),
  ]);
  await expect(page.getByLabel("Message with a date or time")).toHaveValue(
    "June 18, 2026 at 5:20pm Tokyo",
  );
  await page.waitForTimeout(500);
  await snap("update-restored-500ms");
  await page.waitForTimeout(mode === "real-time-transient" ? 20000 : 10500);
  await snap("update-restored-beyond-assertion");
  record.result = "completed";
  await retained.close();
} catch (e: any) {
  record.result = "error";
  record.error = e.stack;
}
record.end = new Date().toISOString();
await writeFile(
  new URL(`./${output}.json`, import.meta.url),
  JSON.stringify(record, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    {
      mode,
      result: record.result,
      error: record.error,
      snapshots: record.snapshots.map((s) => ({
        label: s.label,
        ms: s.ms,
        ready: s.ready,
        controller: s.controller?.response,
        active: s.active?.response,
        waiting: s.waiting?.response,
        draft: s.draft,
      })),
    },
    null,
    2,
  ),
);
await browser.close();
