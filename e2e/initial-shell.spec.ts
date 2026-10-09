import { expect, test } from "@playwright/test";

test("the first interface paints before JavaScript and survives hydration", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/assets/index-*.js", async (route) => {
    await held;
    await route.continue();
  });
  try {
    await page.goto("/", { waitUntil: "commit" });
    const main = page.locator("main");
    await expect(main).toHaveAttribute("data-app-ready", "false");
    await expect(page.locator(".converter-intro")).toBeVisible();
    await expect(page.locator(".converter-guide")).toBeVisible();
    await expect(page.locator(".workspace")).toHaveAttribute("inert", "");
    await expect(page.locator(".appearance")).toHaveAttribute("inert", "");
    await expect(page.locator("#target-zone")).toHaveAttribute(
      "placeholder",
      "Your timezone",
    );
    const intro = await page.locator(".converter-intro").elementHandle();
    const textarea = page.locator("textarea#message");
    const bounds = await textarea.boundingBox();
    expect(bounds).not.toBeNull();
    await page.mouse.click(bounds!.x + 20, bounds!.y + 20);
    await page.keyboard.type("April 9, 2026 3pm in Tokyo");
    await expect(textarea).toHaveValue("");
    release();
    await expect(main).toHaveAttribute("data-app-ready", "true");
    expect(errors).toEqual([]);
    expect(
      await intro!.evaluate(
        (node) => node === document.querySelector(".converter-intro"),
      ),
    ).toBe(true);
    await expect(page.locator(".workspace")).not.toHaveAttribute("inert");
    await textarea.fill("April 9, 2026 3pm in Tokyo");
    // Sydney is UTC+10 on this explicit date; Tokyo is UTC+9.
    await expect(page.locator(".hero-time")).toHaveText(/4:00 pm/i);
    await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    release();
  }
});

test("hydration restores preferences and an initial About route", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const preferences = {
    target: "UTC",
    source: "Asia/Tokyo",
    hourCycle: "24",
    dateOrder: "dmy",
    theme: "light",
  };
  await page.addInitScript((value) => {
    localStorage.setItem("chronoshift.preferences.v1", JSON.stringify(value));
  }, preferences);
  await page.goto("/#about");
  await expect(page).toHaveTitle("About — Time to Local");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("link", { name: "Back to converter" }).click();
  await expect(page.getByLabel("Convert to", { exact: true })).toHaveValue(
    "UTC",
  );
  await page.getByRole("button", { name: "More options" }).click();
  await expect(page.getByLabel("Source timezone", { exact: true })).toHaveValue(
    "Asia/Tokyo",
  );
  await page.getByLabel("Message with a date or time").fill("9/4/2026 15:00");
  await expect(page.locator(".hero-time")).toHaveText("06:00");
  await expect(page.locator(".result-date")).toContainText("9 Apr 2026");
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem("chronoshift.preferences.v1")!),
    ),
  ).toEqual(preferences);
  expect(errors).toEqual([]);
});

test("the static shell permits its fixed hidden styles and rejects other attributes", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator("main")).toHaveAttribute("data-app-ready", "true");
  const hidden = page
    .locator('[data-testid="hidden-select-container"]')
    .first();
  expect(
    await hidden.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        width: style.width,
        height: style.height,
        position: style.position,
      };
    }),
  ).toEqual({ width: "1px", height: "1px", position: "fixed" });
  const rejected = await page.evaluate(
    () =>
      new Promise<{ directive: string; applied: boolean }>((resolve) => {
        const probe = document.createElement("div");
        probe.textContent = "CSP test";
        document.body.append(probe);
        const blocked = (event: SecurityPolicyViolationEvent) => {
          if (event.effectiveDirective !== "style-src-attr") return;
          document.removeEventListener("securitypolicyviolation", blocked);
          resolve({
            directive: event.effectiveDirective,
            applied: getComputedStyle(probe).outlineWidth === "99px",
          });
          probe.remove();
        };
        document.addEventListener("securitypolicyviolation", blocked);
        probe.setAttribute("style", "outline:99px solid magenta");
      }),
  );
  expect(rejected).toEqual({ directive: "style-src-attr", applied: false });
});
