import { test, expect, disconnect } from "./fixtures";
import type { BrowserContext, Page } from "@playwright/test";
test.use({ isolatedOrigin: true });

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
  await expect(page.getByText("Offline ready", { exact: true })).toBeVisible();
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
  await page.getByRole("button", { name: "Convert", exact: true }).click();
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
  await expect(page.getByText("Offline ready", { exact: true })).toBeVisible();
  await page.getByLabel("Message with a date or time").fill("Old tab draft");
  const second = await context.newPage();
  await second.goto("/");
  await expect(
    second.getByText("Offline ready", { exact: true }),
  ).toBeVisible();
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
  await expect(third.getByText("Offline ready", { exact: true })).toBeVisible();
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
  await expect(page.getByText("Offline ready", { exact: true })).toBeVisible();
  await page.getByLabel("Appearance", { exact: true }).click();
  await page.getByLabel("Design", { exact: true }).selectOption("command");
  await page.getByLabel("Theme", { exact: true }).selectOption("light");
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
