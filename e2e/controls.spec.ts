import { test, expect } from "./fixtures";

test("native choices share alignment in both themes and retain editing and keyboard behavior", async ({
  page,
  browserName,
}) => {
  await page.goto("/");
  const draft = "April 9, 2026 3pm UTC";
  await page.getByLabel("Message with a date or time").fill(draft);
  await page.getByLabel("Convert to").fill("Pacific/Chatham");
  await page.getByRole("button", { name: "Convert", exact: true }).click();
  await expect(page.locator(".hero-time")).toBeVisible();
  const result = await page.locator(".hero-time").innerText();
  await page.getByText("More options", { exact: true }).click();
  await page.getByLabel("Appearance", { exact: true }).click();
  for (const theme of ["dark", "light"]) {
    await page.getByLabel("Theme", { exact: true }).selectOption(theme);
    for (const width of [280, 740, 1280]) {
      await page.setViewportSize({ width, height: 960 });
      const dimensions = await page.evaluate(() => {
        const ids = [
          "theme",
          "target-zone",
          "source-zone",
          "reference-date",
          "date-order",
          "time-format",
        ];
        return ids.map((id) => {
          const element = document.getElementById(id)!;
          const css = getComputedStyle(element);
          const bounds = element.getBoundingClientRect();
          const label = document
            .querySelector(`label[for="${id}"]`)!
            .getBoundingClientRect();
          return {
            id,
            height: bounds.height,
            inset: css.paddingInlineStart,
            font: css.fontSize,
            lineHeight: css.lineHeight,
            labelDelta: bounds.left - label.left,
          };
        });
      });
      for (const control of dimensions) {
        expect(control.height, control.id).toBe(44);
        expect(control.inset, control.id).toBe("12px");
        expect(control.font, control.id).toBe("16px");
        expect(control.lineHeight, control.id).toBe("24px");
        expect(control.labelDelta, control.id).toBe(0);
      }
      const trigger = (await page
        .locator(".appearance summary")
        .boundingBox())!;
      const popup = (await page.locator(".appearance-fields").boundingBox())!;
      expect(popup.x + popup.width).toBeCloseTo(trigger.x + trigger.width, 1);
      expect(popup.y - trigger.y - trigger.height).toBeCloseTo(8, 1);
      expect(popup.x).toBeGreaterThanOrEqual(0);
      expect(popup.x + popup.width).toBeLessThanOrEqual(width);
      if (width > 480) {
        const zone = (await page.locator("#target-zone").boundingBox())!;
        const convert = (await page
          .getByRole("button", { name: "Convert", exact: true })
          .boundingBox())!;
        expect(zone.y).toBeCloseTo(convert.y, 1);
        expect(zone.height).toBeCloseTo(convert.height, 1);
      }
      await expect(page.getByLabel("Message with a date or time")).toHaveValue(
        draft,
      );
      await expect(page.locator(".hero-time")).toHaveText(result);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
  // Native datalist buttons live in the browser's UA shadow tree. Checking
  // their real bounds catches a decorative arrow detached from its hit target.
  if (browserName === "chromium") {
    const session = await page.context().newCDPSession(page);
    type NativeNode = {
      nodeId: number;
      attributes?: string[];
      children?: NativeNode[];
      shadowRoots?: NativeNode[];
    };
    const find = (
      node: NativeNode,
      attribute: string,
    ): NativeNode | undefined => {
      if (
        node.attributes?.some(
          (value, index) =>
            index % 2 === 0 &&
            value === "id" &&
            node.attributes?.[index + 1] === attribute,
        )
      )
        return node;
      for (const child of [
        ...(node.children ?? []),
        ...(node.shadowRoots ?? []),
      ]) {
        const match = find(child, attribute);
        if (match) return match;
      }
    };
    try {
      for (const width of [320, 1280]) {
        await page.setViewportSize({ width, height: 960 });
        for (const id of ["target-zone", "source-zone"]) {
          const field = page.locator(`#${id}`);
          await field.hover();
          const bounds = (await field.boundingBox())!;
          const { root } = await session.send("DOM.getDocument", {
            depth: -1,
            pierce: true,
          });
          const input = find(root, id)!;
          const picker = find(input, "picker")!;
          expect(picker, id).toBeTruthy();
          const { model } = await session.send("DOM.getBoxModel", {
            nodeId: picker.nodeId,
          });
          const xs = model.border.filter((_, index) => index % 2 === 0);
          const ys = model.border.filter((_, index) => index % 2 === 1);
          const arrowX = bounds.x + bounds.width - 20;
          const arrowY = bounds.y + bounds.height / 2;
          expect(
            arrowX,
            `${id} visible chevron must hit the native picker`,
          ).toBeGreaterThanOrEqual(Math.min(...xs));
          expect(arrowX, id).toBeLessThanOrEqual(Math.max(...xs));
          expect(arrowY, id).toBeGreaterThanOrEqual(Math.min(...ys));
          expect(arrowY, id).toBeLessThanOrEqual(Math.max(...ys));
        }
      }
    } finally {
      await session.detach();
    }
  }
  await page.getByLabel("Theme", { exact: true }).press("Escape");
  await expect(page.locator(".appearance")).not.toHaveAttribute("open", "");
  await expect(page.getByLabel("Appearance", { exact: true })).toBeFocused();
  await page.getByLabel("Convert to").fill("Tokyo");
  await expect(page.locator(".hero-time")).toHaveText(/12:00 am/i);
  await page.getByLabel("Time display", { exact: true }).selectOption("24");
  await expect(page.locator(".hero-time")).toHaveText("00:00");
  await page.getByLabel("Numeric dates", { exact: true }).selectOption("dmy");
  await expect(page.getByLabel("Numeric dates", { exact: true })).toHaveValue(
    "dmy",
  );
  await page.getByLabel("Source timezone when none is given").fill("UTC");
  await expect(
    page.getByLabel("Source timezone when none is given"),
  ).toHaveValue("UTC");
  await page.getByLabel("Reference date for this message").fill("2026-04-09");
  await expect(page.getByLabel("Reference date for this message")).toHaveValue(
    "2026-04-09",
  );
});
