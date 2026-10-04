# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: diagnostics.spec.ts >> detailed logging survives a tab reload and reset preferences disables it
- Location: e2e/diagnostics.spec.ts:80:0

# Error details

```
Error: jsonValue: Execution context was destroyed, most likely because of a navigation
```

```
Error: click: Test ended.
Call log:
  - waiting for getByRole('button', { name: 'Reset preferences' })

```

# Page snapshot

```yaml
- generic [ref=f1e2]:
  - banner [ref=f1e3]:
    - link "ChronoShift home" [ref=f1e4] [cursor=pointer]:
      - /url: /
      - text: ChronoShift
    - group [ref=f1e7]:
      - generic "Appearance" [ref=f1e8] [cursor=pointer]
  - main [ref=f1e12]:
    - heading "Time zone converter" [level=1] [ref=f1e13]
    - generic [ref=f1e14]:
      - region [ref=f1e15]:
        - heading "Time zone converter" [level=2] [ref=f1e17]
        - generic [ref=f1e18]: Message with a date or time
        - textbox "Message with a date or time" [ref=f1e19]:
          - /placeholder: e.g. Let's meet tomorrow at 3pm PT
        - generic [ref=f1e20]:
          - button "Paste" [ref=f1e22] [cursor=pointer]
          - generic [ref=f1e23]: Converts as you type
        - generic [ref=f1e24]:
          - generic [ref=f1e25]: Convert to
          - group [ref=f1e28]:
            - combobox "Convert to" [ref=f1e29]
            - button "Show target timezones" [ref=f1e30] [cursor=pointer]
          - generic [ref=f1e33]: Sydney · Australia/Sydney
        - group [ref=f1e34]:
          - generic "More options" [active] [ref=f1e35] [cursor=pointer]
          - generic [ref=f1e36]:
            - generic [ref=f1e37]: Source timezone when none is given
            - group [ref=f1e39]:
              - combobox "Source timezone when none is given" [ref=f1e40]
              - button "Show source timezones" [ref=f1e41] [cursor=pointer]
            - generic [ref=f1e44]:
              - generic [ref=f1e45]: Reference date for this message
              - group [ref=f1e46]:
                - spinbutton "day, Reference date for this message" [ref=f1e47]: dd
                - generic [aria-hidden] [ref=f1e48]: /
                - spinbutton "month, Reference date for this message" [ref=f1e49]: mm
                - generic [aria-hidden] [ref=f1e50]: /
                - spinbutton "year, Reference date for this message" [ref=f1e51]: yyyy
                - button "Choose reference date Reference date for this message" [ref=f1e52] [cursor=pointer]
            - textbox [ref=f1e57]
            - generic [ref=f1e58]: Leave empty to use today. Useful for an older message.
            - generic [ref=f1e59]: Numeric dates
            - generic [ref=f1e60]:
              - button "Month / day (04/09 = April 9) Numeric dates" [ref=f1e61] [cursor=pointer]:
                - generic [ref=f1e62]: Month / day (04/09 = April 9)
              - combobox [ref=f1e67]
            - generic [ref=f1e68]: Time display
            - generic [ref=f1e69]:
              - button "Use my device format Time display" [ref=f1e70] [cursor=pointer]:
                - generic [ref=f1e71]: Use my device format
              - combobox [ref=f1e76]
            - generic [ref=f1e77] [cursor=pointer]:
              - checkbox "Enable detailed logs" [checked] [ref=f1e78]
              - generic [ref=f1e79]: Enable detailed logs
            - generic [ref=f1e80]: Console only. Message text excluded.
            - button "Reset preferences" [ref=f1e81] [cursor=pointer]
        - group [ref=f1e82]:
          - generic "Try an example" [ref=f1e83] [cursor=pointer]
      - region [ref=f1e84]:
        - heading "Converted time" [level=2] [ref=f1e86]
        - status [ref=f1e87]
        - generic [ref=f1e88]:
          - heading "Ready to convert" [level=3] [ref=f1e90]
          - paragraph [ref=f1e91]: Date, time and timezone appear here.
    - generic [ref=f1e92]:
      - paragraph [ref=f1e93]: Your text stays on this device.
      - button "Keep ChronoShift handy" [ref=f1e94] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect, publishRelease } from "./fixtures";
  2   | import { enterZone } from "./choices";
  3   | import type { Page } from "@playwright/test";
  4   | 
  5   | function consoleDiagnostics(page: Page) {
  6   |   const records: string[] = [];
  7   |   page.on("console", async (message) => {
  8   |     if (!message.text().startsWith("[ChronoShift]")) return;
  9   |     records.push(
  10  |       JSON.stringify(
  11  |         await Promise.all(message.args().map((arg) => arg.jsonValue())),
  12  |       ),
  13  |     );
  14  |   });
  15  |   return records;
  16  | }
  17  | async function toggle(page: Page) {
  18  |   await page.getByText("More options", { exact: true }).click();
  19  |   return page.getByRole("checkbox", { name: "Enable detailed logs" });
  20  | }
  21  | 
  22  | test("detailed logs are opt-in, local, exclude message and selected zones, and stop when disabled", async ({
  23  |   page,
  24  | }) => {
  25  |   const logs = consoleDiagnostics(page);
  26  |   const requests: string[] = [];
  27  |   page.on("request", (request) =>
  28  |     requests.push(request.url() + (request.postData() || "")),
  29  |   );
  30  |   await page.goto("/");
  31  |   await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  32  |   const checkbox = await toggle(page);
  33  |   await expect(checkbox).not.toBeChecked();
  34  |   const draft = "PrivatePlanningSentinel July 4, 2027 at 3pm UTC";
  35  |   await page.getByLabel("Message with a date or time").fill(draft);
  36  |   await enterZone(page, "Pacific/Chatham");
  37  |   await expect(page.locator(".hero-time")).toBeVisible();
  38  |   expect(logs).toEqual([]);
  39  |   await checkbox.check();
  40  |   await expect.poll(() => logs.join("\n")).toContain("offline.probe-result");
  41  |   await page.getByRole("combobox", { name: "Convert to", exact: true }).click();
  42  |   await page.getByLabel("Message with a date or time").fill(draft + " ");
  43  |   await expect.poll(() => logs.join("\n")).toContain("conversion.complete");
  44  |   expect(logs.join("\n")).toContain("ui.zone-focus");
  45  |   const raw = logs.join("\n");
  46  |   for (const privateValue of [
  47  |     "PrivatePlanningSentinel",
  48  |     "2027",
  49  |     "Chatham",
  50  |     "July 4",
  51  |     draft,
  52  |   ]) {
  53  |     expect(raw).not.toContain(privateValue);
  54  |     expect(requests.join("\n")).not.toContain(privateValue);
  55  |   }
  56  |   expect(
  57  |     await page.evaluate(() =>
  58  |       sessionStorage.getItem("chronoshift-detailed-logs"),
  59  |     ),
  60  |   ).toBe("true");
  61  |   expect(
  62  |     await page.evaluate(() =>
  63  |       JSON.stringify({ ...localStorage, ...sessionStorage }),
  64  |     ),
  65  |   ).not.toContain("PrivatePlanningSentinel");
  66  |   await checkbox.uncheck();
  67  |   const stopped = logs.length;
  68  |   await page.getByRole("combobox", { name: "Convert to", exact: true }).click();
  69  |   await page.getByLabel("Message with a date or time").fill(draft + "  ");
  70  |   await expect(page.locator(".hero-time")).toBeVisible();
  71  |   await page.waitForTimeout(100);
  72  |   expect(logs).toHaveLength(stopped);
  73  |   expect(
  74  |     await page.evaluate(() =>
  75  |       sessionStorage.getItem("chronoshift-detailed-logs"),
  76  |     ),
  77  |   ).toBeNull();
  78  | });
  79  | 
  80  | test("detailed logging survives a tab reload and reset preferences disables it", async ({
  81  |   page,
  82  | }) => {
  83  |   const logs = consoleDiagnostics(page);
  84  |   await page.goto("/");
  85  |   await (await toggle(page)).check();
  86  |   await page.reload();
  87  |   const checkbox = await toggle(page);
  88  |   await expect(checkbox).toBeChecked();
  89  |   await expect
  90  |     .poll(() => logs.join("\n"))
  91  |     .toContain("offline.register-attempt");
> 92  |   await page.getByRole("button", { name: "Reset preferences" }).click();
      |                                                                ^ Error: click: Test ended.
  93  |   await expect(checkbox).not.toBeChecked();
  94  |   expect(
  95  |     await page.evaluate(() =>
  96  |       sessionStorage.getItem("chronoshift-detailed-logs"),
  97  |     ),
  98  |   ).toBeNull();
  99  |   const stopped = logs.length;
  100 |   await page.reload();
  101 |   await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  102 |   expect(logs).toHaveLength(stopped);
  103 | });
  104 | 
  105 | test("detailed logs still work in memory when session storage is denied", async ({
  106 |   page,
  107 | }) => {
  108 |   await page.addInitScript(() => {
  109 |     Object.defineProperty(window, "sessionStorage", {
  110 |       get() {
  111 |         throw new DOMException("Denied", "SecurityError");
  112 |       },
  113 |     });
  114 |   });
  115 |   const logs = consoleDiagnostics(page);
  116 |   await page.goto("/");
  117 |   await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  118 |   const checkbox = await toggle(page);
  119 |   await checkbox.check();
  120 |   await expect.poll(() => logs.join("\n")).toContain("offline.probe-result");
  121 |   await checkbox.uncheck();
  122 |   const stopped = logs.length;
  123 |   await page.getByRole("combobox", { name: "Convert to", exact: true }).click();
  124 |   await page.waitForTimeout(100);
  125 |   expect(logs).toHaveLength(stopped);
  126 | });
  127 | 
  128 | const cacheTest = test.extend({ isolatedOrigin: true });
  129 | cacheTest(
  130 |   "a retired release repairs only missing files using its intact cached assets",
  131 |   async ({ page, context, baseURL }) => {
  132 |     await publishRelease(context, baseURL!, "first");
  133 |     await page.goto("/");
  134 |     await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  135 |     await publishRelease(context, baseURL!, "second-retired");
  136 |     const result = await page.evaluate(async () => {
  137 |       const cache = await caches.open("chronoshift-test-first");
  138 |       await cache.delete("/fonts/README.txt");
  139 |       await cache.delete("/index.html");
  140 |       return new Promise<any>((resolve) => {
  141 |         const channel = new MessageChannel();
  142 |         channel.port1.onmessage = (event) => {
  143 |           channel.port1.close();
  144 |           resolve(event.data);
  145 |         };
  146 |         navigator.serviceWorker.controller!.postMessage(
  147 |           { type: "CHECK_READY", repairIfMissing: true, detailedLogs: true },
  148 |           [channel.port2],
  149 |         );
  150 |       });
  151 |     });
  152 |     expect(result.ready).toBe(true);
  153 |     expect(result.diagnostics.unavailable).toEqual([
  154 |       "/fonts/README.txt",
  155 |       "/index.html",
  156 |     ]);
  157 |     expect(result.diagnostics.repair.fetched).toBe(1);
  158 |     expect(result.diagnostics.repair.reused).toBeGreaterThan(1);
  159 |     // Check production-like retirement really exists rather than silently retaining every fixture.
  160 |     const oldCSS = await page.evaluate(
  161 |       async () =>
  162 |         (await (await caches.open("chronoshift-test-first")).keys()).find((r) =>
  163 |           r.url.endsWith(".css"),
  164 |         )!.url,
  165 |     );
  166 |     expect((await context.request.get(oldCSS)).status()).toBe(404);
  167 |     await page
  168 |       .getByLabel("Message with a date or time")
  169 |       .fill("July 4, 2027 3pm UTC");
  170 |     await expect(page.locator(".hero-time")).toBeVisible();
  171 |     await expect(page.locator(".message.warning")).toHaveCount(0);
  172 |   },
  173 | );
  174 | 
  175 | cacheTest(
  176 |   "corrupt cached files fail integrity checks and detailed logs identify bounded repair failure",
  177 |   async ({ page, context, baseURL }) => {
  178 |     const logs = consoleDiagnostics(page);
  179 |     await publishRelease(context, baseURL!, "first");
  180 |     await page.goto("/");
  181 |     await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  182 |     await publishRelease(context, baseURL!, "second");
  183 |     await page.evaluate(async () =>
  184 |       (await caches.open("chronoshift-test-first")).put(
  185 |         "/release.json",
  186 |         new Response("corrupt private data"),
  187 |       ),
  188 |     );
  189 |     await (await toggle(page)).check();
  190 |     await expect(page.locator(".message.warning")).toContainText(
  191 |       "Offline setup is incomplete.",
  192 |     );
```