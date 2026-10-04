import { test, expect, disconnect } from "./fixtures";
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
test("worker failure recovers and a late response cannot resurrect cleared input", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const state = window as any;
    state.failWorker = true;
    state.queued = false;
    state.delivered = false;
    const Native = Worker;
    window.Worker = new Proxy(Native, {
      construct(Target, args) {
        if (state.failWorker)
          throw new Error("Simulated worker launch failure");
        const worker = Reflect.construct(Target, args);
        return new Proxy(worker, {
          get(target, property) {
            const value = Reflect.get(target, property, target);
            return typeof value === "function" ? value.bind(target) : value;
          },
          set(target, property, value) {
            if (property === "onmessage")
              target.onmessage = (event: MessageEvent) => {
                state.queued = true;
                setTimeout(() => {
                  value(event);
                  state.delivered = true;
                }, 250);
              };
            else Reflect.set(target, property, value, target);
            return true;
          },
        });
      },
    });
  });
  await ready(page);
  await page
    .getByLabel("Message with a date or time")
    .fill("April 9, 2026 3pm EST");
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("could not start");
  await page.evaluate(() => {
    (window as any).failWorker = false;
  });
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).queued))
    .toBe(true);
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => (window as any).delivered))
    .toBe(true);
  await expect(page.locator(".result")).toHaveCount(0);
  await expect(page.getByLabel("Message with a date or time")).toHaveValue("");
  await convert(page); // Same runtime can recover after the simulated failure.
});
async function ready(page: Page) {
  await page.goto("/");
  await expect(page.getByText("Offline ready", { exact: true })).toBeVisible();
}
test("missing cache reports incomplete and reconnect repairs the complete offline app", async ({
  page,
  context,
  origin,
}) => {
  await ready(page);
  await page.evaluate(async () => {
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });
    await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
    window.dispatchEvent(new Event("pageshow"));
  });
  await expect(page.getByText("Offline ready", { exact: true })).toHaveCount(0);
  await expect(
    page.getByText("Offline setup is incomplete.", { exact: false }),
  ).toBeVisible();
  await page.evaluate(() => {
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });
    window.dispatchEvent(new Event("online"));
  });
  await expect(page.getByText("Offline ready", { exact: true })).toBeVisible();
  await page.close();
  await disconnect(context, origin);
  const reopened = await context.newPage();
  await reopened.goto("/");
  await convert(reopened, "April 9, 2026 3pm EST");
});
test("pasted HTML cannot execute or fetch its URL", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("example.invalid")) external.push(r.url());
  });
  await ready(page);
  await convert(
    page,
    '<img src="https://example.invalid/secret" onerror="window.__xss=true"> April 9, 2026 3pm UTC',
  );
  expect(await page.evaluate(() => (window as any).__xss)).toBeUndefined();
  await expect(page.locator("img")).toHaveCount(0);
  expect(external).toEqual([]);
});
async function convert(page: Page, text = "April 9, 2026 3pm EST") {
  await page.getByLabel("Message with a date or time").fill(text);
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await expect(page.locator(".result")).toHaveCount(
    text.includes("CST") ? 2 : 1,
  );
}
test("convert, inspect ambiguity, copy manually and protect privacy", async ({
  page,
  context,
}) => {
  const requests: string[] = [];
  page.on("request", (r) =>
    requests.push(r.url() + " " + (r.postData() || "")),
  );
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        readText: () => Promise.reject(),
        writeText: () => Promise.reject(),
      },
    }),
  );
  await ready(page);
  await convert(page, "July 15, 2026 3pm CST");
  await expect(page.getByText("2 possible interpretations")).toBeVisible();
  await page.getByRole("button", { name: "Copy US Central Standard" }).click();
  await expect(page.getByLabel("Text to copy")).toHaveValue(
    /2026.*UTC\+10:00.*Sydney/s,
  );
  const local = await page.evaluate(() => JSON.stringify({ ...localStorage }));
  expect(local).not.toContain("July");
  expect(requests.join("\n")).not.toContain("CST");
  expect(requests.join("\n")).not.toContain("July");
  await page.getByRole("button", { name: "Paste", exact: true }).click();
  await expect(
    page.getByText("Paste directly into the message box", { exact: false }),
  ).toBeVisible();
  expect(await context.cookies()).toEqual([]);
});
test("close and reopen offline, then convert previously unseen input", async ({
  page,
  context,
  origin,
}) => {
  await ready(page);
  await page.getByLabel("Appearance", { exact: true }).click();
  await page.getByLabel("Design", { exact: true }).selectOption("command");
  await page.getByLabel("Theme", { exact: true }).selectOption("light");
  await page.close();
  await disconnect(context, origin);
  const reopened = await context.newPage();
  await reopened.goto("/");
  await expect(reopened.locator("html")).toHaveAttribute(
    "data-design",
    "command",
  );
  await expect(reopened.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(
    reopened.getByText(origin ? "Offline ready" : "Working offline", {
      exact: true,
    }),
  ).toBeVisible();
  await convert(reopened, "July 15, 2026 3pm in Tokyo");
  await expect(reopened.locator(".hero-time")).toHaveText(/4:00 pm/i);
  await expect(reopened.locator(".result-date")).toHaveText(/15 July? 2026/);
});
test("preferences persist, input does not; denied storage still converts", async ({
  page,
}) => {
  await ready(page);
  await page.getByLabel("Convert to").fill("Asia/Tokyo");
  await convert(page);
  const result = await page.locator(".hero-time").innerText();
  await page.getByLabel("Appearance", { exact: true }).click();
  await page.getByLabel("Design", { exact: true }).selectOption("command");
  await page.getByLabel("Theme", { exact: true }).selectOption("light");
  await expect(page.locator(".hero-time")).toHaveText(result);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-design", "command");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByLabel("Convert to")).toHaveValue("Asia/Tokyo");
  await expect(page.getByLabel("Message with a date or time")).toHaveValue("");
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("Storage denied");
      },
    });
  });
  await page.reload();
  await convert(page);
  await expect(
    page.getByText("Preferences cannot be saved", { exact: false }),
  ).toBeVisible();
});
test("input errors recover, edits invalidate results, keyboard keeps multiline input", async ({
  page,
}) => {
  await ready(page);
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Paste or type");
  const input = page.getByLabel("Message with a date or time");
  await input.fill("hello");
  await input.press("Enter");
  await expect(input).toHaveValue("hello\n");
  await convert(page);
  await input.fill("not a time");
  await expect(page.locator(".result")).toHaveCount(0);
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("No timestamp");
  await input.fill("x".repeat(10001));
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("10,000");
  await expect(input).toHaveValue("x".repeat(10001));
  await input.fill("April 9, 2026 3pm UTC");
  await input.press("ControlOrMeta+Enter");
  await expect(page.locator(".result")).toHaveCount(1);
});
test("readable at 320px, dark mode, with no serious accessibility violations", async ({
  page,
}, info) => {
  await ready(page);
  await convert(page, "July 15, 2026 3pm CST");
  await page.setViewportSize({ width: 320, height: 740 });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.getByLabel("Appearance", { exact: true }).click();
  await page.getByLabel("Theme", { exact: true }).selectOption("system");
  await page.getByLabel("Appearance", { exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.screenshot({
    path: info.outputPath("mobile-dark.png"),
    fullPage: true,
  });
  await page.emulateMedia({ colorScheme: "light" });
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByLabel("Appearance", { exact: true }).click();
  await page.getByLabel("Design", { exact: true }).selectOption("command");
  await page.getByLabel("Appearance", { exact: true }).click();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  if (info.project.name === "chromium") {
    await page.emulateMedia({ colorScheme: "dark" });
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
    await page.getByLabel("Appearance", { exact: true }).click();
    await page.getByLabel("Design", { exact: true }).selectOption("lens");
    await page.emulateMedia({ colorScheme: "light" });
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
      ).violations,
    ).toEqual([]);
  }
});
test("offline POST share is single-use and never places message in URL", async ({
  page,
  context,
  origin,
}) => {
  await ready(page);
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  await disconnect(context, origin);
  await page.evaluate(() => {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/share";
    form.enctype = "multipart/form-data";
    const input = document.createElement("input");
    input.name = "text";
    input.value = "April 9, 2026 3pm EST";
    form.append(input);
    document.body.append(form);
    form.requestSubmit();
  });
  await expect(page.getByLabel("Message with a date or time")).toHaveValue(
    "April 9, 2026 3pm EST",
  );
  const redirect = requests.find((r) => r.includes("?share="))!;
  expect(redirect).toContain("?share=");
  expect(redirect).not.toContain("April");
  await expect(page.getByLabel("Message with a date or time")).toHaveValue(
    "April 9, 2026 3pm EST",
  );
  expect(page.url()).not.toContain("?");
  await page.goto(redirect);
  await expect(page.getByLabel("Message with a date or time")).toHaveValue("");
  await expect(
    page.getByText("The shared text expired.", { exact: false }),
  ).toBeVisible();
  expect(requests.every((r) => !r.includes("April"))).toBe(true);
});
test("an update waits, preserves draft on opt-in, and survives a partial next update", async ({
  page,
  context,
  origin,
}) => {
  await ready(page);
  await page
    .getByLabel("Message with a date or time")
    .fill("Keep April 9, 2026 3pm EST");
  await context.addCookies([
    { name: "test-version", value: "second", url: new URL(page.url()).origin },
  ]);
  await page.evaluate(async () => {
    await (await navigator.serviceWorker.getRegistration())!.update();
  });
  await expect(page.getByRole("button", { name: "Update now" })).toBeVisible();
  await expect(page.getByLabel("Message with a date or time")).toHaveValue(
    "Keep April 9, 2026 3pm EST",
  );
  await Promise.all([
    page.waitForEvent("domcontentloaded"),
    page.getByRole("button", { name: "Update now" }).click(),
  ]);
  await expect(page.getByLabel("Message with a date or time")).toHaveValue(
    "Keep April 9, 2026 3pm EST",
  );
  await expect
    .poll(() =>
      page.evaluate(() => sessionStorage.getItem("chronoshift.update-draft")),
    )
    .toBe(null);
  await expect(page.getByRole("button", { name: "Update now" })).toHaveCount(0);
  await context.addCookies([
    { name: "test-version", value: "broken", url: new URL(page.url()).origin },
  ]);
  await page.evaluate(async () => {
    const r = (await navigator.serviceWorker.getRegistration())!;
    const done = new Promise<void>((resolve) =>
      r.addEventListener(
        "updatefound",
        () =>
          r.installing!.addEventListener("statechange", () => {
            if (r.installing?.state === "redundant" || !r.installing) resolve();
          }),
        { once: true },
      ),
    );
    await r.update();
    await done;
  });
  await expect(page.getByRole("button", { name: "Update now" })).toHaveCount(0);
  await page.close();
  await disconnect(context, origin);
  const reopened = await context.newPage();
  await reopened.goto("/");
  await convert(reopened);
  await expect(reopened.locator(".hero-time")).toHaveText(/6:00 am/i);
});
