import { test, expect } from "./fixtures";

for (const focused of [false, true]) {
  for (const delayed of [false, true]) {
    test(`touch Paste preserves ${focused ? "open" : "closed"} input focus with ${delayed ? "delayed" : "immediate"} clipboard success`, async ({
      page,
      isMobile,
    }) => {
      test.skip(!isMobile, "Touch journey uses the phone browser profiles.");
      await page.addInitScript(
        ({ delayed }) => {
          const state = window as any;
          state.pasteReads = 0;
          state.messageFocus = [];
          for (const type of ["focusin", "focusout"]) {
            document.addEventListener(type, (event) => {
              if ((event.target as HTMLElement).id === "message")
                state.messageFocus.push(type);
            });
          }
          Object.defineProperty(navigator, "clipboard", {
            value: {
              readText: () => {
                state.pasteReads++;
                const value = "April 9, 2026 3pm UTC";
                return delayed
                  ? new Promise<string>((resolve) => {
                      state.deliverPaste = () => {
                        resolve(value);
                      };
                    })
                  : Promise.resolve(value);
              },
            },
          });
        },
        { delayed },
      );
      await page.goto("/");
      const input = page.locator("#message");
      await expect(input).toBeVisible();
      if (focused) await input.tap();
      else await expect(input).not.toBeFocused();
      await page.evaluate(() => ((window as any).messageFocus = []));
      await page.getByRole("button", { name: "Paste", exact: true }).tap();
      if (delayed) {
        await expect
          .poll(() => page.evaluate(() => (window as any).pasteReads))
          .toBe(1);
        if (focused) await expect(input).toBeFocused();
        else await expect(input).not.toBeFocused();
        expect(await page.evaluate(() => (window as any).messageFocus)).toEqual(
          [],
        );
        // Model the permission UI dismissing the keyboard before granting access.
        if (focused) await input.evaluate((element) => element.blur());
        await page.evaluate(() => {
          (window as any).messageFocus = [];
          (window as any).deliverPaste();
        });
      }
      await expect(input).toHaveValue("April 9, 2026 3pm UTC");
      if (focused && !delayed) await expect(input).toBeFocused();
      else await expect(input).not.toBeFocused();
      expect(await page.evaluate(() => (window as any).messageFocus)).toEqual(
        [],
      );
      expect(await page.evaluate(() => (window as any).pasteReads)).toBe(1);
      await expect(page.locator(".result")).toHaveCount(1);
    });
  }
}

test("keyboard Paste succeeds once without moving focus into the message", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const state = window as any;
    state.pasteReads = 0;
    Object.defineProperty(navigator, "clipboard", {
      value: {
        readText: () => {
          state.pasteReads++;
          return Promise.resolve("April 9, 2026 3pm UTC");
        },
      },
    });
  });
  await page.goto("/");
  const input = page.locator("#message");
  await input.fill("draft");
  await input.press("Tab");
  await page.keyboard.press("Tab");
  const paste = page.getByRole("button", { name: "Paste", exact: true });
  await expect(paste).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(input).toHaveValue("April 9, 2026 3pm UTC");
  await expect(paste).toBeFocused();
  expect(await page.evaluate(() => (window as any).pasteReads)).toBe(1);
});
