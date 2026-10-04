import { test, expect } from "./fixtures";
import { enterZone } from "./choices";

for (const source of ["clipboard", "share"] as const) {
  test(`delayed ${source} offers replacement instead of overwriting edited or cleared work`, async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
    const incoming = "April 9, 2026 3pm UTC";
    const newer = "June 18, 2026 9am UTC";
    if (source === "clipboard") {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, "clipboard", {
          value: {
            readText: () =>
              new Promise<string>((resolve) => {
                (window as any).deliverImport = resolve;
              }),
            writeText: () => Promise.reject(new Error("Manual copy test")),
          },
        });
      });
    } else {
      await page.addInitScript(() => {
        const open = IDBFactory.prototype.open;
        IDBFactory.prototype.open = function (
          ...args: Parameters<IDBFactory["open"]>
        ) {
          const request = open.apply(this, args);
          const listen = request.addEventListener.bind(request);
          Object.defineProperty(request, "onsuccess", {
            set(callback) {
              listen("success", (event) => {
                (window as any).deliverImport = () =>
                  callback.call(request, event);
              });
            },
          });
          return request;
        };
      });
    }
    for (const action of [
      "convert",
      "clear",
      source === "share" ? "restored" : "untouched",
    ] as const) {
      if (source === "share") {
        // A separate tab seeds the real one-use store; only the receiving page delays delivery.
        const seed = await page.context().newPage();
        await seed.goto("/");
        await expect(
          seed.locator('main[data-offline-ready="true"]'),
        ).toBeVisible();
        await seed.evaluate(async (incoming) => {
          await new Promise<void>((resolve, reject) => {
            const request = indexedDB.open("chronoshift-handoff", 1);
            request.onupgradeneeded = () =>
              request.result.createObjectStore("messages");
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
              const db = request.result,
                tx = db.transaction("messages", "readwrite");
              tx.objectStore("messages").put(
                { text: incoming, created: Date.now() },
                "delayed-import",
              );
              tx.oncomplete = () => {
                db.close();
                resolve();
              };
              tx.onerror = () => {
                db.close();
                reject(tx.error);
              };
            };
          });
        }, incoming);
        await seed.close();
        if (action === "restored")
          await page.evaluate(
            (newer) =>
              sessionStorage.setItem(
                "chronoshift.update-draft",
                JSON.stringify({ text: newer, created: Date.now() }),
              ),
            newer,
          );
        await page.goto("/?share=delayed-import");
        await expect
          .poll(() => page.evaluate(() => typeof (window as any).deliverImport))
          .toBe("function");
      } else {
        await page.reload();
        await page.getByRole("button", { name: "Paste", exact: true }).click();
      }
      const input = page.getByLabel("Message with a date or time");
      if (action === "restored") await expect(input).toHaveValue(newer);
      else if (action !== "untouched") await input.fill(newer);
      await enterZone(page, "UTC");
      if (action === "convert") {
        await expect(page.locator(".hero-time")).toContainText(/9:00/);
      } else if (action === "clear") {
        await page.getByRole("button", { name: "Clear", exact: true }).click();
      }
      await page.evaluate(
        (incoming) => (window as any).deliverImport(incoming),
        incoming,
      );
      if (action === "untouched") {
        await expect(input).toHaveValue(incoming);
        await expect(
          page.getByRole("button", { name: "Replace with imported text" }),
        ).toHaveCount(0);
        continue;
      }
      await expect(
        page.getByRole("button", { name: "Replace with imported text" }),
      ).toBeVisible();
      await expect(input).toHaveValue(action === "clear" ? "" : newer);
      await expect(page.locator(".result")).toHaveCount(
        action === "convert" ? 1 : 0,
      );
      if (action === "convert") {
        await expect(page.locator(".result-date")).toContainText(/18 Jun/);
        await page
          .getByRole("button", { name: "Dismiss imported text" })
          .click();
        await expect(input).toHaveValue(newer);
      } else {
        await page
          .getByRole("button", { name: "Replace with imported text" })
          .click();
        await expect(input).toHaveValue(incoming);
        await expect(page.locator(".hero-time")).toContainText(/3:00 pm/i);
      }
      expect(
        await page.evaluate(() => JSON.stringify({ ...localStorage })),
      ).not.toContain("April");
      expect(page.url()).not.toContain("share=");
    }
    if (source === "clipboard") {
      await page.reload();
      await page.getByRole("button", { name: "Paste", exact: true }).click();
      await page.evaluate(() => {
        (window as any).firstImport = (window as any).deliverImport;
      });
      await page.getByRole("button", { name: "Paste", exact: true }).click();
      await page.evaluate(
        (newer) => (window as any).deliverImport(newer),
        newer,
      );
      await expect(page.getByLabel("Message with a date or time")).toHaveValue(
        newer,
      );
      await page.evaluate(
        (incoming) => (window as any).firstImport(incoming),
        incoming,
      );
      await expect(page.getByLabel("Message with a date or time")).toHaveValue(
        newer,
      );
      await expect(
        page.getByRole("button", { name: "Replace with imported text" }),
      ).toHaveCount(0);
    }
  });
}

test("an unresolved target hides copyable fallback results and correction restores the source interpretation", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () =>
          (window as any).delayCopy
            ? new Promise<void>((_, reject) => {
                (window as any).rejectCopy = reject;
              })
            : Promise.reject(new Error("Manual copy test")),
      },
    }),
  );
  await page.goto("/");
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  await enterZone(page, "UTC");
  await page
    .getByLabel("Message with a date or time")
    .fill("April 9, 2026 3pm UTC");
  await expect(page.locator(".hero-time")).toContainText(/3:00 pm/i);
  await page.getByRole("button", { name: "Copy UTC", exact: true }).click();
  await expect(page.getByLabel("Text to copy")).toBeVisible();
  await enterZone(page, "CST");
  await expect(page.locator(".result")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Copy UTC", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Text to copy")).toHaveCount(0);
  await expect(page.getByRole("alert")).toContainText("Choose a timezone");
  await expect(page.locator(".result")).toHaveCount(0);
  await enterZone(page, "Asia/Tokyo");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".hero-time")).toContainText(/12:00 am/i);
  await expect(page.locator(".result-date")).toContainText(/10 Apr/);
  await expect(page.locator(".source-label")).toHaveText("UTC");
  await page.getByRole("button", { name: "Copy UTC", exact: true }).click();
  await expect(page.getByLabel("Text to copy")).toHaveValue(
    /UTC\+09:00.*Tokyo/s,
  );
  await page.evaluate(() => {
    (window as any).delayCopy = true;
  });
  await page.getByRole("button", { name: "Copy UTC", exact: true }).click();
  await enterZone(page, "CST");
  await page.evaluate(() =>
    (window as any).rejectCopy(new Error("Delayed clipboard rejection")),
  );
  await expect(page.getByLabel("Text to copy")).toHaveCount(0);
  await expect(page.locator(".notice")).toHaveText("");
});
