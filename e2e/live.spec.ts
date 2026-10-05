import { test, expect } from "./fixtures";
import { enterZone, choose, enterReferenceDate } from "./choices";

test("target and clock format edits reuse source instants across midnight, including invalid target recovery", async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as any).parseNow = "2026-10-05T23:59:59Z";
    const NativeDate = Date;
    window.Date = new Proxy(NativeDate, {
      construct(Target, args, newTarget) {
        return Reflect.construct(
          Target,
          args.length ? args : [(window as any).parseNow],
          newTarget,
        );
      },
    });
    (window as any).conversionRequests = 0;
    window.Worker = new Proxy(Worker, {
      construct(Target, args) {
        (window as any).conversionRequests++;
        return Reflect.construct(Target, args);
      },
    });
  });
  await page.goto("/");
  await enterZone(page, "UTC");
  await page.getByText("More options", { exact: true }).click();
  await enterZone(page, "UTC", "Source timezone when none is given");
  const input = page.getByLabel("Message with a date or time");
  await input.fill("Tomorrow at 3pm UTC");
  await expect(page.locator(".hero-time")).toHaveText(/3:00 pm/i);
  await expect(page.locator(".result-date")).toContainText("6 Oct 2026");
  expect(await page.evaluate(() => (window as any).conversionRequests)).toBe(1);

  await page.evaluate(() => {
    (window as any).parseNow = "2026-10-06T00:00:01Z";
  });
  await enterZone(page, "Tokyo");
  await expect(page.locator(".hero-time")).toHaveText(/12:00 am/i);
  // The source event remains October 6; target Tokyo reaches October 7.
  // Reparsing "tomorrow" after midnight would incorrectly show October 8.
  await expect(page.locator(".result-date")).toContainText("7 Oct 2026");
  await choose(page, "Time display", "24");
  await expect(page.locator(".hero-time")).toHaveText("00:00");
  await expect(page.locator(".result-date")).toContainText("7 Oct 2026");
  await enterZone(page, "CST");
  await expect(page.locator(".result")).toHaveCount(0);
  await expect(page.getByRole("alert")).toContainText("Choose a timezone");
  await enterZone(page, "+05:45");
  await expect(page.locator(".hero-time")).toHaveText("20:45");
  await expect(page.locator(".result-date")).toContainText("6 Oct 2026");
  await expect(page.locator(".source-label")).toHaveText("UTC");
  expect(await page.evaluate(() => (window as any).conversionRequests)).toBe(1);

  // Parsing edits still use the new reference instant and replace old work.
  await input.fill("Tomorrow at 4pm");
  await expect(page.locator(".hero-time")).toHaveText("21:45");
  await expect(page.locator(".result-date")).toContainText("7 Oct 2026");
  await enterZone(page, "Asia/Tokyo", "Source timezone when none is given");
  await expect(page.locator(".hero-time")).toHaveText("12:45");
  await expect(page.locator(".result-date")).toContainText("7 Oct 2026");
  await enterReferenceDate(page, "2026-04-09");
  await expect(page.locator(".hero-time")).toHaveText("12:45");
  await expect(page.locator(".result-date")).toContainText("10 Apr 2026");
  expect(await page.evaluate(() => (window as any).conversionRequests)).toBe(4);
});

test("display edits retain in-flight conversion and render its completion with the latest target", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Native = Worker;
    (window as any).conversionRequests = 0;
    window.Worker = new Proxy(Native, {
      construct(Target, args) {
        (window as any).conversionRequests++;
        const worker = Reflect.construct(Target, args);
        return new Proxy(worker, {
          get(target, property) {
            const value = Reflect.get(target, property, target);
            return typeof value === "function" ? value.bind(target) : value;
          },
          set(target, property, value) {
            if (property === "onmessage")
              target.onmessage = (event: MessageEvent) => {
                (window as any).deliverConversion = () => value(event);
              };
            else Reflect.set(target, property, value, target);
            return true;
          },
        });
      },
    });
  });
  await page.goto("/");
  await enterZone(page, "UTC");
  await page.getByText("More options", { exact: true }).click();
  await page
    .getByLabel("Message with a date or time")
    .fill("April 9, 2026 3pm UTC");
  await expect
    .poll(() => page.evaluate(() => typeof (window as any).deliverConversion))
    .toBe("function");
  await enterZone(page, "CST");
  await expect(page.locator(".result")).toHaveCount(0);
  await enterZone(page, "Asia/Tokyo");
  await choose(page, "Time display", "24");
  expect(await page.evaluate(() => (window as any).conversionRequests)).toBe(1);
  await page.evaluate(() => (window as any).deliverConversion());
  await expect(page.locator(".hero-time")).toHaveText("00:00");
  await expect(page.locator(".result-date")).toContainText("10 Apr 2026");
  await expect(page.locator(".source-label")).toHaveText("UTC");
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByLabel("Message with a date or time")).toHaveValue(
    "April 9, 2026 3pm UTC",
  );
});

test("typing, pasted text and conversion settings update without submission", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Convert", exact: true }),
  ).toHaveCount(0);
  await enterZone(page, "UTC");
  const input = page.getByLabel("Message with a date or time");
  await input.pressSequentially("June 18, 2026 at 5:20pm in Tokyo", {
    delay: 5,
  });
  await expect(page.locator(".hero-time")).toHaveText(/8:20 am/i);
  await enterZone(page, "Europe/London");
  await expect(page.locator(".hero-time")).toHaveText(/9:20 am/i);
  await page.getByText("More options", { exact: true }).click();
  await choose(page, "Time display", "24");
  await expect(page.locator(".hero-time")).toHaveText("09:20");
  await input.fill("April 9, 2026 3pm");
  await enterZone(page, "Asia/Tokyo", "Source timezone when none is given");
  await expect(page.locator(".hero-time")).toHaveText("07:00");
  await input.fill("");
  await expect(page.locator(".result")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("composition defers conversion and queued work cannot overwrite a newer draft", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const Native = Worker;
    (window as any).queued = 0;
    (window as any).delivered = 0;
    window.Worker = new Proxy(Native, {
      construct(Target, args) {
        const worker = Reflect.construct(Target, args);
        return new Proxy(worker, {
          get(target, property) {
            const value = Reflect.get(target, property, target);
            return typeof value === "function" ? value.bind(target) : value;
          },
          set(target, property, value) {
            if (property === "onmessage")
              target.onmessage = (event: MessageEvent) => {
                (window as any).queued++;
                setTimeout(() => {
                  value(event);
                  (window as any).delivered++;
                }, 700);
              };
            else Reflect.set(target, property, value, target);
            return true;
          },
        });
      },
    });
  });
  await page.goto("/");
  await enterZone(page, "UTC");
  const input = page.getByLabel("Message with a date or time");
  await input.fill("April 9, 2026 3pm UTC");
  await expect.poll(() => page.evaluate(() => (window as any).queued)).toBe(1);
  await input.dispatchEvent("compositionstart");
  // Playwright fill ends composition in Firefox. Keep this intermediate event
  // in composition explicitly rather than simulating a committed native paste.
  await input.evaluate((element: HTMLTextAreaElement) => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    )!.set!.call(element, "April 9, 2026 4pm UTC");
    element.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertCompositionText",
        data: "4pm",
        isComposing: true,
      }),
    );
  });
  // Beyond debounce and injected old completion; neither may publish during IME.
  await expect
    .poll(() => page.evaluate(() => (window as any).delivered))
    .toBe(1);
  expect(await page.evaluate(() => (window as any).queued)).toBe(1);
  await expect(page.locator(".result")).toHaveCount(0);
  await input.dispatchEvent("compositionend");
  await expect(page.locator(".hero-time")).toHaveText(/4:00 pm/i);
  await input.fill("April 9, 2026 5pm UTC");
  await input.fill("April 9, 2026 6pm UTC");
  await expect(page.locator(".hero-time")).toHaveText(/6:00 pm/i);
  await expect(page.locator(".result-source")).toContainText("6pm UTC");
});
