import { test, expect, disconnect, publishRelease } from "./fixtures";
import { choose } from "./choices";
import type { BrowserContext, Page } from "@playwright/test";
test.use({ isolatedOrigin: true });

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
      await page.evaluate(async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        return {
          active: registration?.active?.state,
          installing: registration?.installing?.state,
          waiting: registration?.waiting?.state,
          caches: await caches.keys(),
        };
      }),
    );
    throw error;
  }
}
async function activate(page: Page) {
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
  const worker = page.waitForEvent("worker");
  await page
    .getByLabel("Message with a date or time")
    .fill("April 9, 2026 3pm UTC");
  expect((await worker).url()).toContain(`/test-${release}-worker-`);
  await expect(page.locator(".hero-time")).toHaveText(/1:00 am/i);
  await expect(page.locator(".result-date")).toHaveText(/10 Apr 2026/);
  await expect(page.getByRole("alert")).toHaveCount(0);
}

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
