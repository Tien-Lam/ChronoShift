# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: live.spec.ts >> composition defers conversion and queued work cannot overwrite a newer draft
- Location: e2e/live.spec.ts:30:0

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 2
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - log [ref=e3]:
      - generic [ref=e4]: 1 option available.
      - generic [ref=e5]: UTC, selected
      - generic [ref=e6]: UTC, selected
    - log
  - generic [ref=e7]:
    - banner [ref=e8]:
      - link "ChronoShift home" [ref=e9] [cursor=pointer]:
        - /url: /
        - text: ChronoShift
      - group [ref=e12]:
        - generic "Appearance" [ref=e13] [cursor=pointer]
    - main [ref=e18]:
      - heading "Time zone converter" [level=1] [ref=e19]
      - generic [ref=e20]:
        - region [ref=e21]:
          - heading "Time zone converter" [level=2] [ref=e23]
          - generic [ref=e24]: Message with a date or time
          - textbox "Message with a date or time" [active] [ref=e25]:
            - /placeholder: e.g. Let's meet tomorrow at 3pm PT
            - text: April 9, 2026 4pm UTC
          - generic [ref=e26]:
            - generic [ref=e27]:
              - button "Paste" [ref=e28] [cursor=pointer]
              - button "Clear" [ref=e29] [cursor=pointer]
            - generic [ref=e30]: Converts as you type
          - generic [ref=e31]:
            - generic [ref=e32]: Convert to
            - group [ref=e35]:
              - combobox "Convert to" [ref=e36]: UTC
              - button "Show target timezones" [ref=e37] [cursor=pointer]
            - generic [ref=e40]: UTC · UTC
          - group [ref=e41]:
            - generic "More options" [ref=e42] [cursor=pointer]
        - region [ref=e43]:
          - heading "Converted time" [level=2] [ref=e45]
          - status [ref=e46]: Converting message
          - generic [ref=e47]:
            - heading "Finding your time…" [level=3] [ref=e49]
            - paragraph [ref=e50]: Date, time and timezone appear here.
      - generic [ref=e51]:
        - paragraph [ref=e52]: Your text stays on this device.
        - button "Keep ChronoShift handy" [ref=e53] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from "./fixtures";
  2  | import { enterZone, choose } from "./choices";
  3  | 
  4  | test("typing, pasted text and conversion settings update without submission", async ({
  5  |   page,
  6  | }) => {
  7  |   await page.goto("/");
  8  |   await expect(
  9  |     page.getByRole("button", { name: "Convert", exact: true }),
  10 |   ).toHaveCount(0);
  11 |   await enterZone(page, "UTC");
  12 |   const input = page.getByLabel("Message with a date or time");
  13 |   await input.pressSequentially("June 18, 2026 at 5:20pm in Tokyo", {
  14 |     delay: 5,
  15 |   });
  16 |   await expect(page.locator(".hero-time")).toHaveText(/8:20 am/i);
  17 |   await enterZone(page, "Europe/London");
  18 |   await expect(page.locator(".hero-time")).toHaveText(/9:20 am/i);
  19 |   await page.getByText("More options", { exact: true }).click();
  20 |   await choose(page, "Time display", "24");
  21 |   await expect(page.locator(".hero-time")).toHaveText("09:20");
  22 |   await input.fill("April 9, 2026 3pm");
  23 |   await enterZone(page, "Asia/Tokyo", "Source timezone when none is given");
  24 |   await expect(page.locator(".hero-time")).toHaveText("07:00");
  25 |   await input.fill("");
  26 |   await expect(page.locator(".result")).toHaveCount(0);
  27 |   await expect(page.getByRole("alert")).toHaveCount(0);
  28 | });
  29 | 
  30 | test("composition defers conversion and queued work cannot overwrite a newer draft", async ({
  31 |   page,
  32 | }) => {
  33 |   await page.addInitScript(() => {
  34 |     const Native = Worker;
  35 |     (window as any).queued = 0;
  36 |     (window as any).delivered = 0;
  37 |     window.Worker = new Proxy(Native, {
  38 |       construct(Target, args) {
  39 |         const worker = Reflect.construct(Target, args);
  40 |         return new Proxy(worker, {
  41 |           get(target, property) {
  42 |             const value = Reflect.get(target, property, target);
  43 |             return typeof value === "function" ? value.bind(target) : value;
  44 |           },
  45 |           set(target, property, value) {
  46 |             if (property === "onmessage")
  47 |               target.onmessage = (event: MessageEvent) => {
  48 |                 (window as any).queued++;
  49 |                 setTimeout(() => {
  50 |                   value(event);
  51 |                   (window as any).delivered++;
  52 |                 }, 700);
  53 |               };
  54 |             else Reflect.set(target, property, value, target);
  55 |             return true;
  56 |           },
  57 |         });
  58 |       },
  59 |     });
  60 |   });
  61 |   await page.goto("/");
  62 |   await enterZone(page, "UTC");
  63 |   const input = page.getByLabel("Message with a date or time");
  64 |   await input.fill("April 9, 2026 3pm UTC");
  65 |   await expect.poll(() => page.evaluate(() => (window as any).queued)).toBe(1);
  66 |   await input.dispatchEvent("compositionstart");
  67 |   await input.fill("April 9, 2026 4pm UTC");
  68 |   // Beyond debounce and injected old completion; neither may publish during IME.
  69 |   await expect
  70 |     .poll(() => page.evaluate(() => (window as any).delivered))
  71 |     .toBe(1);
> 72 |   expect(await page.evaluate(() => (window as any).queued)).toBe(1);
     |                                                            ^ Error: expect(received).toBe(expected) // Object.is equality
  73 |   await expect(page.locator(".result")).toHaveCount(0);
  74 |   await input.dispatchEvent("compositionend");
  75 |   await expect(page.locator(".hero-time")).toHaveText(/4:00 pm/i);
  76 |   await input.fill("April 9, 2026 5pm UTC");
  77 |   await input.fill("April 9, 2026 6pm UTC");
  78 |   await expect(page.locator(".hero-time")).toHaveText(/6:00 pm/i);
  79 |   await expect(page.locator(".result-source")).toContainText("6pm UTC");
  80 | });
  81 | 
```