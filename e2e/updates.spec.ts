import { test, expect, disconnect, publishRelease } from "./fixtures";
import { choose } from "./choices";
import type { BrowserContext, Page } from "@playwright/test";
test.use({ isolatedOrigin: true });

test.afterEach(async ({ context }, info) => {
  if (info.status === info.expectedStatus) return;
  // Preserve the original failed press rather than interpreting a retry trace.
  // Record only event/geometry/lifecycle metadata, never input or preferences.
  for (const [index, page] of context.pages().entries()) {
    if (page.isClosed()) continue;
    const press = await page
      .evaluate(() => (window as any).__updateActivationTrace)
      .catch(() => undefined);
    if (!press) continue;
    await info.attach(`update-activation-${index}`, {
      body: Buffer.from(
        JSON.stringify({
          press,
          registration: await registrationState(page).catch(() => undefined),
        }),
      ),
      contentType: "application/json",
    });
  }
});

test("repair refuses another release and leaves the existing offline shell intact", async ({
  page,
  context,
  baseURL,
  origin,
}) => {
  await publishRelease(context, baseURL!, "first");
  await page.goto("/");
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  await publishRelease(context, baseURL!, "second");
  const ready = await page.evaluate(async () => {
    const cache = await caches.open("chronoshift-test-first");
    // A missing mutable document cannot be recovered from another release.
    await cache.delete("/release.json");
    return new Promise<boolean>((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        channel.port1.close();
        resolve(event.data.ready);
      };
      navigator.serviceWorker.controller!.postMessage(
        { type: "CHECK_READY", repairIfMissing: true },
        [channel.port2],
      );
    });
  });
  expect(ready).toBe(false);
  expect(
    await page.evaluate(async () =>
      (await (
        await caches.open("chronoshift-test-first")
      ).match("/index.html"))!.text(),
    ),
  ).toContain("test-first-");
  await disconnect(context, origin);
  await page.reload();
  await convert(page, "first");
});

test("an interrupted rollback preserves a retained cache and its old tab worker", async ({
  page,
  context,
  baseURL,
  origin,
}) => {
  await publishRelease(context, baseURL!, "first");
  await page.goto("/");
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  const next = await context.newPage();
  await next.goto("/");
  // This rollback scenario starts with two healthy tabs. Early registration
  // overlapping an update is exercised independently below.
  await expect(next.locator('main[data-offline-ready="true"]')).toBeVisible();
  await publish(context, next, "second");
  await activate(next);
  // Require staging on rollback, then fail a missing CSS download. All complete
  // cached assets serving the first tab must survive that failed installation.
  await page.evaluate(async () => {
    const cache = await caches.open("chronoshift-test-first");
    const css = (await cache.keys()).find((request) =>
      request.url.endsWith(".css"),
    )!;
    await cache.delete(css);
  });
  await publishRelease(context, baseURL!, "first-interrupted");
  await next.evaluate(async () => {
    const registration = (await navigator.serviceWorker.getRegistration())!;
    const settled = new Promise<void>((resolve) =>
      registration.addEventListener(
        "updatefound",
        () => {
          const worker = registration.installing!;
          worker.addEventListener("statechange", () => {
            if (worker.state === "redundant") resolve();
          });
        },
        { once: true },
      ),
    );
    await registration.update();
    await settled;
  });
  expect(await page.evaluate(() => caches.keys())).toContain(
    "chronoshift-test-first",
  );
  await disconnect(context, origin);
  await convert(page, "first");
  await convert(next, "second");
});

test("an update installed during app registration becomes available without activating or losing the draft", async ({
  page,
  context,
  baseURL,
}, info) => {
  await publishRelease(context, baseURL!, "first");
  await page.goto("/");
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  const next = await context.newPage();
  await next.addInitScript(() => {
    const original = navigator.serviceWorker.register;
    const native = original.bind(navigator.serviceWorker);
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    const state = {
      nativeReturned: false,
      released: false,
      delivered: false,
      restored: false,
      initialActive: null as ServiceWorker | null,
      initialController: null as ServiceWorker | null,
      events: [] as { type: string; time: number }[],
      release() {
        if (!state.released) {
          state.released = true;
          state.events.push({ type: "release", time: performance.now() });
          release();
        }
      },
      restore() {
        state.release();
        navigator.serviceWorker.register = original;
        state.restored = true;
        state.events.push({ type: "restore", time: performance.now() });
      },
    };
    (window as any).registrationResultGate = state;
    navigator.serviceWorker.register = async (...args) => {
      const registration = await native(...args);
      state.nativeReturned = true;
      state.initialActive = registration.active;
      state.initialController = navigator.serviceWorker.controller;
      state.events.push({ type: "native-result", time: performance.now() });
      // The real worker and update events proceed. Only App's await of the
      // native registration result is held, preserving the early lifecycle.
      await held;
      state.delivered = true;
      state.events.push({ type: "deliver", time: performance.now() });
      return registration;
    };
  });
  const samples: unknown[] = [];
  try {
    await next.goto("/");
    await expect
      .poll(() =>
        next.evaluate(
          () => (window as any).registrationResultGate.nativeReturned,
        ),
      )
      .toBe(true);
    const input = next.getByLabel("Message with a date or time");
    await input.fill("April 9, 2026 3pm UTC");
    await expect(next.locator(".hero-time")).toHaveText(/1:00 am/i);
    await publishRelease(context, baseURL!, "second");
    await next.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration())!.update();
    });
    await expect
      .poll(() =>
        next.evaluate(
          async () =>
            (await navigator.serviceWorker.getRegistration())?.waiting?.state,
        ),
      )
      .toBe("installed");
    await expect(
      page.getByRole("button", { name: "Update now" }),
    ).toBeVisible();
    await expect(next.locator("main")).toHaveAttribute(
      "data-offline-ready",
      "false",
    );
    await expect(next.getByRole("button", { name: "Update now" })).toHaveCount(
      0,
    );
    samples.push({
      phase: "installed-while-held",
      ...(await registrationState(next)),
    });
    await next.evaluate(() => (window as any).registrationResultGate.release());
    await expect(next.locator('main[data-offline-ready="true"]')).toBeVisible();
    await expect(
      next.getByRole("button", { name: "Update now" }),
    ).toBeVisible();
    await expect(input).toHaveValue("April 9, 2026 3pm UTC");
    await expect(next.locator(".hero-time")).toHaveText(/1:00 am/i);
    await expect(next.locator(".result-date")).toHaveText(/10 Apr 2026/);
    expect(await revision(page)).toBe("test-first");
    expect(await revision(next)).toBe("test-first");
    const after = await registrationState(next);
    expect(after.waiting).toBe("installed");
    expect(after.gate).toMatchObject({
      released: true,
      delivered: true,
      activeRetained: true,
      controllerRetained: true,
    });
    samples.push({ phase: "available-after-release", ...after });
  } finally {
    if (!next.isClosed()) {
      await next.evaluate(() =>
        (window as any).registrationResultGate?.restore(),
      );
      samples.push({ phase: "cleanup", ...(await registrationState(next)) });
    }
    await info.attach("early-registration-update", {
      body: Buffer.from(JSON.stringify(samples)),
      contentType: "application/json",
    });
  }
});

test("oversized drafts block an update until they can be safely preserved", async ({
  page,
  context,
  baseURL,
}) => {
  await publishRelease(context, baseURL!, "first");
  await page.goto("/");
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  const draft = "x".repeat(10001);
  await page.getByLabel("Message with a date or time").fill(draft);
  await publish(context, page, "second");
  await page.getByRole("button", { name: "Update now" }).click();
  await expect(
    page.getByText("Copy your message somewhere safe", { exact: false }),
  ).toBeVisible();
  await expect(page.getByLabel("Message with a date or time")).toHaveValue(
    draft,
  );
  expect(await revision(page)).toBe("test-first");
  await page
    .getByLabel("Message with a date or time")
    .fill("April 9, 2026 3pm UTC");
  await activate(page);
  await expect(page.getByLabel("Message with a date or time")).toHaveValue(
    "April 9, 2026 3pm UTC",
  );
});

async function publish(context: BrowserContext, page: Page, version: string) {
  expect(
    (
      await context.request.post(new URL("__test-release", page.url()).href, {
        data: version,
      })
    ).status(),
  ).toBe(204);
  await page.evaluate(async () => {
    await (await navigator.serviceWorker.getRegistration())!.update();
  });
  try {
    await expect(
      page.getByRole("button", { name: "Update now" }),
    ).toBeVisible();
  } catch (error) {
    console.log(
      "Update registration diagnostics",
      await registrationState(page),
    );
    throw error;
  }
}
async function registrationState(page: Page) {
  return page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    const gate = (window as any).registrationResultGate;
    return {
      timeOrigin: performance.timeOrigin,
      time: performance.now(),
      appReady: document
        .querySelector("main")
        ?.getAttribute("data-offline-ready"),
      updateAvailable: !!document.querySelector(".update-banner button"),
      controller: navigator.serviceWorker.controller?.state,
      active: registration?.active?.state,
      installing: registration?.installing?.state,
      waiting: registration?.waiting?.state,
      caches: await caches.keys(),
      gate: gate
        ? {
            nativeReturned: gate.nativeReturned,
            released: gate.released,
            delivered: gate.delivered,
            restored: gate.restored,
            activeRetained: registration?.active === gate.initialActive,
            controllerRetained:
              navigator.serviceWorker.controller === gate.initialController,
            events: [...gate.events],
          }
        : undefined,
    };
  });
}
async function activate(page: Page) {
  await page.evaluate(() => {
    const events: object[] = [];
    (window as any).__updateActivationTrace = events;
    const record = (event: Event) => {
      if (events.length >= 64) return;
      const button = document.querySelector(".update-banner button");
      const pointer = event instanceof PointerEvent ? event : undefined;
      events.push({
        kind: event.type,
        at: Date.now(),
        time: performance.now(),
        timeOrigin: performance.timeOrigin,
        scrollY,
        button: button?.getBoundingClientRect().toJSON(),
        target: event.target instanceof Element ? event.target.tagName : null,
        updateTarget:
          !!button &&
          event.target instanceof Node &&
          button.contains(event.target),
        x: pointer?.clientX,
        y: pointer?.clientY,
      });
    };
    for (const kind of [
      "pointerdown",
      "pointerup",
      "click",
      "focusin",
      "scroll",
    ])
      document.addEventListener(kind, record, true);
    navigator.serviceWorker.addEventListener("controllerchange", record);
  });
  await Promise.all([
    page.waitForEvent("domcontentloaded"),
    page.getByRole("button", { name: "Update now" }).click(),
  ]);
  await expect(page.getByRole("button", { name: "Update now" })).toHaveCount(0);
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
}
async function rejectMixedWorker(page: Page) {
  // Prove these fixtures actually reject an incompatible worker contract.
  expect(
    await page.evaluate(async () => {
      const script =
        document.querySelector<HTMLScriptElement>("script[src]")!.src;
      const code = await (await fetch(script)).text();
      const workerURL = code.match(/new URL\(`([^`]+worker-[^`]+)`/)![1];
      return new Promise<string>((resolve) => {
        const worker = new Worker(
          workerURL.replace("test-first-", "test-second-"),
          { type: "module" },
        );
        worker.onerror = () => {
          worker.terminate();
          resolve("incompatible");
        };
        worker.onmessage = () => {
          worker.terminate();
          resolve("incorrectly accepted");
        };
        worker.postMessage({
          id: 1,
          text: "April 9, 2026 3pm UTC",
          options: { sourceZone: "UTC", targetZone: "UTC" },
          testProtocol: "wrong",
        });
      });
    }),
  ).toBe("incompatible");
}
async function revision(page: Page) {
  return page.evaluate(
    async () => (await (await fetch("release.json")).json()).sourceCommit,
  );
}
async function convert(page: Page, release: string) {
  // Exercise a fresh edit even when the same input was converted earlier.
  await page.getByLabel("Message with a date or time").fill("");
  const worker = page.waitForEvent("worker");
  await page
    .getByLabel("Message with a date or time")
    .fill("April 9, 2026 3pm UTC");
  expect((await worker).url()).toContain(`/test-${release}-worker-`);
  await expect(page.locator(".hero-time")).toHaveText(/1:00 am/i);
  await expect(page.locator(".result-date")).toHaveText(/10 Apr 2026/);
  await expect(page.getByRole("alert")).toHaveCount(0);
}

test("conversion completion during an update press keeps the target stable and allows recovery", async ({
  page,
  context,
  baseURL,
  origin,
}, info) => {
  await page.setViewportSize({ width: 390, height: 664 });
  await page.addInitScript(() => {
    const state = {
      held: true,
      armed: false,
      queue: [] as { worker: Worker; data: unknown }[],
      events: [] as object[],
    };
    (window as any).__conversionPressGate = state;
    (window as any).__updateActivationTrace = state.events;
    // Make a completed press observable without reloading away its geometry.
    Object.defineProperty(window, "sessionStorage", {
      get() {
        throw new Error("Storage denied by update regression fixture");
      },
    });
    const NativeWorker = window.Worker;
    window.Worker = class extends NativeWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.addEventListener("message", (event) => {
          if (!state.held) return;
          event.stopImmediatePropagation();
          state.queue.push({ worker: this, data: event.data });
        });
      }
    };
    for (const kind of ["pointerdown", "pointerup", "click"])
      document.addEventListener(
        kind,
        (event) => {
          const button = document.querySelector(".update-banner button");
          const updateTarget =
            !!button &&
            event.target instanceof Node &&
            button.contains(event.target);
          if (!state.armed && !state.events.length) return;
          state.events.push({
            kind,
            updateTarget,
            trusted: event.isTrusted,
            time: performance.now(),
            button: button?.getBoundingClientRect().toJSON(),
            results: document.querySelectorAll(".hero-time").length,
          });
          if (kind === "pointerdown" && state.armed && updateTarget) {
            state.armed = false;
            state.held = false;
            for (const { worker, data } of state.queue.splice(0))
              worker.dispatchEvent(new MessageEvent("message", { data }));
          }
        },
        true,
      );
  });
  await publishRelease(context, baseURL!, "first");
  await page.goto("/");
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  await publish(context, page, "second");
  const before = await registrationState(page);
  expect(before.waiting).toBe("installed");
  const input = page.getByLabel("Message with a date or time");
  const draft = "PRIVATE-UPDATE-TEST April 9, 2026 3pm UTC";
  await input.fill(draft);
  await expect
    .poll(() =>
      page.evaluate(() => (window as any).__conversionPressGate.queue.length),
    )
    .toBeGreaterThan(0);
  await expect(page.locator(".hero-time")).toHaveCount(0);
  await page.evaluate(() => {
    (window as any).__conversionPressGate.armed = true;
  });
  // Hold the ordinary native press long enough for the queued conversion to
  // render between down and up. No forced click or direct activation callback.
  await page.getByRole("button", { name: "Update now" }).click({ delay: 100 });
  const events = await page.evaluate(
    () => (window as any).__conversionPressGate.events,
  );
  await info.attach("conversion-during-press", {
    body: Buffer.from(JSON.stringify({ before, events })),
    contentType: "application/json",
  });
  const down = events.find((event: any) => event.kind === "pointerdown");
  const up = events.find((event: any) => event.kind === "pointerup");
  const click = events.find((event: any) => event.kind === "click");
  expect(down).toMatchObject({ updateTarget: true, trusted: true, results: 0 });
  expect(up).toMatchObject({ updateTarget: true, trusted: true, results: 1 });
  expect(click).toMatchObject({ updateTarget: true, trusted: true });
  expect(up.button.y).toBeCloseTo(down.button.y, 1);
  expect(up.button.x).toBeCloseTo(down.button.x, 1);
  await expect(page.locator(".hero-time")).toHaveText(/1:00 am/i);
  await expect(
    page.getByRole("status").filter({
      hasText: "This browser cannot preserve it during a reload",
    }),
  ).toBeVisible();
  await expect(input).toHaveValue(draft);
  const blocked = await registrationState(page);
  expect(blocked.timeOrigin).toBe(before.timeOrigin);
  expect(blocked.waiting).toBe("installed");
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(input).toHaveValue("");
  await activate(page);
  expect(await revision(page)).toBe("test-second");
  // The init script also runs in the new document; recovery conversions are
  // ordinary worker deliveries, with no further timing gate.
  await page.evaluate(() => {
    (window as any).__conversionPressGate.held = false;
  });
  await disconnect(context, origin);
  await convert(page, "second");
});

test("old and new tabs retain their own workers across successive releases and offline restart", async ({
  page,
  context,
  baseURL,
  origin,
}) => {
  expect(
    (
      await context.request.post(new URL("__test-release", baseURL!).href, {
        data: "first",
      })
    ).status(),
  ).toBe(204);
  await page.goto("/");
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  await page.getByLabel("Message with a date or time").fill("Old tab draft");
  const second = await context.newPage();
  await second.goto("/");
  await expect(second.locator('main[data-offline-ready="true"]')).toBeVisible();
  await rejectMixedWorker(second);
  await publish(context, second, "second");
  await activate(second);
  expect(await revision(second)).toBe("test-second");
  await expect(page.getByLabel("Message with a date or time")).toHaveValue(
    "Old tab draft",
  );
  // First conversion happens after activation: the lazy old worker must still exist.
  await convert(page, "first");
  await convert(second, "second");
  const third = await context.newPage();
  await third.goto("/");
  await expect(third.locator('main[data-offline-ready="true"]')).toBeVisible();
  await publish(context, third, "third");
  await activate(third);
  expect(await revision(third)).toBe("test-third");
  await expect(page.locator("script[src]")).toHaveAttribute(
    "src",
    /test-first-/,
  );
  await expect(second.locator("script[src]")).toHaveAttribute(
    "src",
    /test-second-/,
  );
  expect(await page.evaluate(() => caches.keys())).toEqual(
    expect.arrayContaining([
      "chronoshift-test-first",
      "chronoshift-test-second",
      "chronoshift-test-third",
    ]),
  );
  await disconnect(context, origin);
  await convert(page, "first");
  await convert(second, "second");
  await convert(third, "third");
  await third.close();
  const reopened = await context.newPage();
  await reopened.goto("/");
  expect(await revision(reopened)).toBe("test-third");
  await convert(reopened, "third");
});

test("rollback preserves draft and preferences and removes obsolete caches with one remaining tab", async ({
  page,
  context,
  baseURL,
  origin,
}) => {
  await page.addInitScript(() => {
    const register = navigator.serviceWorker.register.bind(
      navigator.serviceWorker,
    );
    navigator.serviceWorker.register = async (...args) => {
      const registration = await register(...args);
      return new Proxy(registration, {
        get(target, property) {
          if (property === "waiting" && (window as any).__hideWaiting)
            return null;
          const value = Reflect.get(target, property, target);
          return typeof value === "function" ? value.bind(target) : value;
        },
      });
    };
  });
  expect(
    (
      await context.request.post(new URL("__test-release", baseURL!).href, {
        data: "first",
      })
    ).status(),
  ).toBe(204);
  await page.goto("/");
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  await page.getByLabel("Appearance", { exact: true }).click();
  await choose(page, "Theme", "light");
  await page.getByLabel("Appearance", { exact: true }).click();
  for (const version of ["second", "third", "first"]) {
    await page
      .getByLabel("Message with a date or time")
      .fill(`Keep this draft through ${version}`);
    await page.evaluate(() => {
      (window as any).__hideWaiting = true;
    });
    await publish(context, page, version);
    // Both notification and activation use the retained installed worker even
    // while registration.waiting is unavailable. Reload resets the hidden slot.
    await activate(page);
    expect(await revision(page)).toBe(`test-${version}`);
    await expect(page.getByLabel("Message with a date or time")).toHaveValue(
      `Keep this draft through ${version}`,
    );
    await expect(page.locator("html")).toHaveAttribute(
      "data-design",
      "command",
    );
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    expect(
      await page.evaluate(() =>
        sessionStorage.getItem("chronoshift.update-draft"),
      ),
    ).toBeNull();
  }
  await expect
    .poll(() => page.evaluate(() => caches.keys()))
    .toEqual(["chronoshift-test-third", "chronoshift-test-first"]);
  await disconnect(context, origin);
  await convert(page, "first");
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto("/");
  expect(await revision(reopened)).toBe("test-first");
  await expect(reopened.locator("html")).toHaveAttribute(
    "data-design",
    "command",
  );
  await expect(reopened.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(reopened.getByLabel("Message with a date or time")).toHaveValue(
    "",
  );
  await convert(reopened, "first");
});
