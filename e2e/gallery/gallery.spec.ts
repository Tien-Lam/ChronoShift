import { test, expect, type Locator } from "@playwright/test";

async function labelOffset(control: Locator) {
  return control.evaluate((element) => {
    const text = [...element.childNodes].find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim(),
    )!;
    const range = document.createRange();
    range.selectNodeContents(text);
    const label = range.getBoundingClientRect();
    const surface = element.getBoundingClientRect();
    return {
      offset: (label.left + label.right - surface.left - surface.right) / 2,
      height: surface.height,
    };
  });
}

test("independent geometry catches the Paste predecessor; real states retain target geometry", async ({
  page,
}) => {
  await page.goto("/__gallery/?fault=paste");
  expect(
    Math.abs((await labelOffset(page.getByTestId("paste"))).offset),
  ).toBeGreaterThan(5);
  for (const theme of ["dark", "light"]) {
    await page.goto(`/__gallery/?theme=${theme}`);
    const paste = page.getByTestId("paste");
    const rest = await paste.boundingBox();
    expect(Math.abs((await labelOffset(paste)).offset)).toBeLessThanOrEqual(1);
    expect((await labelOffset(paste)).height).toBeGreaterThanOrEqual(44);
    await paste.hover();
    await expect(paste).toHaveAttribute("data-hovered", "true");
    expect(await paste.boundingBox()).toEqual(rest);
    await page.mouse.down();
    await expect(paste).toHaveAttribute("data-pressed", "true");
    expect(await paste.boundingBox()).toEqual(rest);
    await page.mouse.up();
    await expect(page.getByRole("status").first()).toHaveText(
      "Actions committed: 1",
    );
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(paste).toHaveAttribute("data-focus-visible", "true");
    expect(await paste.boundingBox()).toEqual(rest);
    await paste.press("Space");
    await expect(page.getByRole("status").first()).toHaveText(
      "Actions committed: 2",
    );
    await expect(
      page.getByRole("button", { name: "Disabled", exact: true }),
    ).toBeDisabled();
    for (const label of ["Disabled", "Saving"]) {
      const control = page.getByRole("button", { name: label, exact: true });
      const bounds = (await control.boundingBox())!;
      await page.mouse.click(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
      );
      await expect(page.getByRole("status").first()).toHaveText(
        "Actions committed: 2",
      );
    }

    await expect(
      page.getByRole("button", { name: "Saving", exact: true }),
    ).toHaveAttribute("aria-disabled", "true");
    await expect(
      page.getByRole("button", { name: "Copied", exact: false }).first(),
    ).toHaveAttribute("data-copy-state", "success");
  }
});

test("independent accessible content rejects the unnamed icon fault", async ({
  page,
}) => {
  await page.goto("/__gallery/?fault=name");
  await expect(
    page.getByRole("button", { name: "Add example", exact: true }),
  ).toHaveCount(0);
  await page.goto("/__gallery/?fault=outcome");
  await page.getByRole("button", { name: "Reject local example" }).click();
  await expect(page.getByRole("status").last()).not.toHaveText(
    "Copy failed. Select the text and copy manually.",
  );
  await page.goto("/__gallery/");
  await expect(
    page.getByRole("button", { name: "Add example", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("textbox", { name: "Invalid source" }),
  ).toHaveAttribute("aria-invalid", "true");
  await page.getByRole("button", { name: "Reject local example" }).click();
  await expect(page.getByRole("status").last()).toHaveText(
    "Copy failed. Select the text and copy manually.",
  );
  await page.getByRole("button", { name: "Complete local example" }).click();
  await expect(page.getByRole("status").last()).toHaveText(
    "Copied successfully",
  );
});

test("native early touch release, cancel and drag activate once without a competing touch owner", async ({
  browser,
}) => {
  const context = await browser.newContext({
    baseURL: `http://127.0.0.1:${process.env.GALLERY_PORT || "44101"}`,
    hasTouch: true,
    viewport: { width: 390, height: 844 },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  await page.goto("/__gallery/");
  const cdp = await context.newCDPSession(page);
  const paste = page.getByTestId("paste");
  const box = (await paste.boundingBox())!;
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  const start = () =>
    cdp.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x, y }],
    });
  const stop = (type: "touchCancel" | "touchEnd" = "touchCancel") =>
    cdp.send("Input.dispatchTouchEvent", { type, touchPoints: [] });
  for (const end of ["touchCancel", "touchEnd"] as const) {
    await start();
    await expect(paste).toHaveAttribute("data-pressed", "true");
    await expect(paste).not.toHaveAttribute("data-touch-pressed", "");
    expect(await paste.boundingBox()).toEqual(box);
    const pressed = await paste.evaluate((el) => {
      const css = getComputedStyle(el);
      return { background: css.backgroundColor, shadow: css.boxShadow };
    });
    expect(pressed).toEqual({
      background: "rgb(34, 55, 42)",
      shadow: "rgb(178, 237, 137) 0px 0px 0px 2px inset",
    });
    await stop(end);
    await expect(paste).not.toHaveAttribute("data-pressed", "true");
  }
  await expect(page.getByRole("status").first()).toHaveText(
    "Actions committed: 1",
  );
  await start();
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: x + 150, y }],
  });
  await expect(paste).not.toHaveAttribute("data-pressed", "true");
  await stop("touchEnd");
  await expect(page.getByRole("status").first()).toHaveText(
    "Actions committed: 1",
  );
  await context.close();
});

for (const width of [280, 390, 960])
  for (const theme of ["light", "dark"])
    test(`actual workspace hierarchy and precision ${width} ${theme}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        ({ theme }) =>
          localStorage.setItem(
            "chronoshift.preferences.v1",
            JSON.stringify({ target: "UTC", hourCycle: "24", theme }),
          ),
        { theme },
      );
      await page.goto("/__gallery/?view=workspace");
      await expect(
        page.getByRole("heading", { name: "Time zone converter", exact: true }),
      ).toHaveClass("sr-only");
      await expect(page.locator("header .brand")).toHaveText("ChronoShift");
      await expect(page.locator("footer p")).toHaveText(
        "Your text stays on this device.",
      );
      await page
        .getByLabel("Message with a date or time")
        .fill("April 9, 2026 9am-11am UTC");
      await expect(page.locator(".range-label")).toHaveText(["From", "To"]);
      await expect(page.locator(".hero-time")).toHaveText(["09:00", "11:00"]);
      await page
        .getByLabel("Message with a date or time")
        .fill("2026-04-09T23:59:59.123+00:00");
      await expect(page.locator(".hero-time")).toHaveText("23:59:59.123");
      const rows = await page.locator(".time-number").evaluate((el) => {
        const node = el.firstChild!;
        return [...node.textContent!].map((_, i) => {
          const range = document.createRange();
          range.setStart(node, i);
          range.setEnd(node, i + 1);
          return range.getBoundingClientRect().top;
        });
      });
      expect(Math.max(...rows) - Math.min(...rows)).toBeLessThan(2);
      const original = await page
        .getByLabel("Message with a date or time")
        .inputValue();
      await page.setViewportSize({ width: 390, height: 844 });
      await expect(page.getByLabel("Message with a date or time")).toHaveValue(
        original,
      );
    });

test("independent action-group spacing catches touching action surfaces", async ({
  page,
}) => {
  const gap = async () =>
    page
      .locator(".gallery-row")
      .evaluateAll(
        (rows) =>
          rows[2].getBoundingClientRect().top -
          rows[1].getBoundingClientRect().bottom,
      );
  await page.goto("/__gallery/?fault=groups");
  expect(await gap()).toBeLessThan(1);
  for (const width of [280, 390, 960]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/__gallery/");
    expect(await gap()).toBeGreaterThanOrEqual(8);
  }
});

test("programmatic disclosure activation returns a focused panel child to its trigger before close", async ({
  page,
}) => {
  await page.goto("/__gallery/");
  await page.locator("#gallery-format").focus();
  await expect(page.locator("#gallery-format")).toBeFocused();
  const trigger = page.locator(".options-trigger");
  await trigger.evaluate((element) => (element as HTMLButtonElement).click());
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(trigger).toBeFocused();
  await expect(page.locator(".option-fields")).toHaveAttribute("inert", "");
  await expect(page.locator("#gallery-format")).not.toBeVisible();
  await trigger.press("Space");
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#gallery-format")).toBeVisible();
});
