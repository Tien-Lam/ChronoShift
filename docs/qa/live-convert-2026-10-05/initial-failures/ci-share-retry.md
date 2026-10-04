# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: imports.spec.ts >> delayed share offers replacement instead of overwriting edited or cleared work
- Location: e2e/imports.spec.ts:5:2

# Error details

```
Error: expect(locator).toHaveCount(expected) failed

Locator:  locator('.result')
Expected: 0
Received: 1
Timeout:  10000ms

Call log:
  - Expect "toHaveCount" locator('.result') with timeout 10000ms
  - waiting for locator('.result')
    24 × locator resolved to 1 element
       - unexpected value "1"

```

# Page snapshot

```yaml
- generic [ref=f3e2]:
  - banner [ref=f3e3]:
    - link "ChronoShift home" [ref=f3e4]:
      - /url: /
      - text: ChronoShift
    - group [ref=f3e7]:
      - generic "Appearance" [ref=f3e8] [cursor=pointer]
  - main [ref=f3e12]:
    - heading "Time zone converter" [level=1] [ref=f3e13]
    - generic [ref=f3e14]:
      - region [ref=f3e15]:
        - heading "Time zone converter" [level=2] [ref=f3e17]
        - generic [ref=f3e18]: Message with a date or time
        - textbox "Message with a date or time" [ref=f3e19]:
          - /placeholder: e.g. Let's meet tomorrow at 3pm PT
          - text: June 18, 2026 9am UTC
        - generic [ref=f3e20]:
          - generic [ref=f3e21]:
            - button "Paste" [ref=f3e22] [cursor=pointer]
            - button "Clear" [ref=f3e23] [cursor=pointer]
          - generic [ref=f3e24]: Converts as you type
        - generic [ref=f3e25]:
          - generic [ref=f3e26]: Convert to
          - group [ref=f3e29]:
            - combobox "Convert to" [ref=f3e30]: UTC
            - button "Show target timezones" [ref=f3e31] [cursor=pointer]
          - generic [ref=f3e34]: UTC · UTC
        - group [ref=f3e35]:
          - generic "More options" [active] [ref=f3e36] [cursor=pointer]
      - region [ref=f3e37]:
        - heading "Converted time" [level=2] [ref=f3e39]
        - status [ref=f3e40]: 1 time interpretations found
        - article [ref=f3e41]:
          - generic [ref=f3e42]:
            - generic [ref=f3e43]:
              - generic [ref=f3e44]:
                - generic [ref=f3e45]: 9:00 am
                - paragraph [ref=f3e46]: Thu, 18 June 2026
                - paragraph [ref=f3e47]: UTC
              - button "Copy UTC" [ref=f3e48] [cursor=pointer]: Copy
            - paragraph [ref=f3e50]: "Source: UTC"
          - paragraph [ref=f3e52]: "Original: “June 18, 2026 9am UTC”"
    - generic [ref=f3e53]:
      - status [ref=f3e54]: Shared text arrived. Replace the current message?
      - generic [ref=f3e55]:
        - button "Replace with imported text" [ref=f3e56] [cursor=pointer]
        - button "Dismiss imported text" [ref=f3e57] [cursor=pointer]
    - generic [ref=f3e58]:
      - paragraph [ref=f3e59]: Your text stays on this device.
      - button "Keep ChronoShift handy" [ref=f3e60] [cursor=pointer]
```

# Test source

```ts
  22  |         });
  23  |       });
  24  |     } else {
  25  |       await page.addInitScript(() => {
  26  |         const open = IDBFactory.prototype.open;
  27  |         IDBFactory.prototype.open = function (
  28  |           ...args: Parameters<IDBFactory["open"]>
  29  |         ) {
  30  |           const request = open.apply(this, args);
  31  |           const listen = request.addEventListener.bind(request);
  32  |           Object.defineProperty(request, "onsuccess", {
  33  |             set(callback) {
  34  |               listen("success", (event) => {
  35  |                 (window as any).deliverImport = () =>
  36  |                   callback.call(request, event);
  37  |               });
  38  |             },
  39  |           });
  40  |           return request;
  41  |         };
  42  |       });
  43  |     }
  44  |     for (const action of [
  45  |       "convert",
  46  |       "clear",
  47  |       source === "share" ? "restored" : "untouched",
  48  |     ] as const) {
  49  |       if (source === "share") {
  50  |         // A separate tab seeds the real one-use store; only the receiving page delays delivery.
  51  |         const seed = await page.context().newPage();
  52  |         await seed.goto("/");
  53  |         await expect(
  54  |           seed.locator('main[data-offline-ready="true"]'),
  55  |         ).toBeVisible();
  56  |         await seed.evaluate(async (incoming) => {
  57  |           await new Promise<void>((resolve, reject) => {
  58  |             const request = indexedDB.open("chronoshift-handoff", 1);
  59  |             request.onupgradeneeded = () =>
  60  |               request.result.createObjectStore("messages");
  61  |             request.onerror = () => reject(request.error);
  62  |             request.onsuccess = () => {
  63  |               const db = request.result,
  64  |                 tx = db.transaction("messages", "readwrite");
  65  |               tx.objectStore("messages").put(
  66  |                 { text: incoming, created: Date.now() },
  67  |                 "delayed-import",
  68  |               );
  69  |               tx.oncomplete = () => {
  70  |                 db.close();
  71  |                 resolve();
  72  |               };
  73  |               tx.onerror = () => {
  74  |                 db.close();
  75  |                 reject(tx.error);
  76  |               };
  77  |             };
  78  |           });
  79  |         }, incoming);
  80  |         await seed.close();
  81  |         if (action === "restored")
  82  |           await page.evaluate(
  83  |             (newer) =>
  84  |               sessionStorage.setItem(
  85  |                 "chronoshift.update-draft",
  86  |                 JSON.stringify({ text: newer, created: Date.now() }),
  87  |               ),
  88  |             newer,
  89  |           );
  90  |         await page.goto("/?share=delayed-import");
  91  |         await expect
  92  |           .poll(() => page.evaluate(() => typeof (window as any).deliverImport))
  93  |           .toBe("function");
  94  |       } else {
  95  |         await page.reload();
  96  |         await page.getByRole("button", { name: "Paste", exact: true }).click();
  97  |       }
  98  |       const input = page.getByLabel("Message with a date or time");
  99  |       if (action === "restored") await expect(input).toHaveValue(newer);
  100 |       else if (action !== "untouched") await input.fill(newer);
  101 |       await enterZone(page, "UTC");
  102 |       if (action === "convert") {
  103 |         await expect(page.locator(".hero-time")).toContainText(/9:00/);
  104 |       } else if (action === "clear") {
  105 |         await page.getByRole("button", { name: "Clear", exact: true }).click();
  106 |       }
  107 |       await page.evaluate(
  108 |         (incoming) => (window as any).deliverImport(incoming),
  109 |         incoming,
  110 |       );
  111 |       if (action === "untouched") {
  112 |         await expect(input).toHaveValue(incoming);
  113 |         await expect(
  114 |           page.getByRole("button", { name: "Replace with imported text" }),
  115 |         ).toHaveCount(0);
  116 |         continue;
  117 |       }
  118 |       await expect(
  119 |         page.getByRole("button", { name: "Replace with imported text" }),
  120 |       ).toBeVisible();
  121 |       await expect(input).toHaveValue(action === "clear" ? "" : newer);
> 122 |       await expect(page.locator(".result")).toHaveCount(
      |                                            ^ Error: expect(locator).toHaveCount(expected) failed
  123 |         action === "convert" ? 1 : 0,
  124 |       );
  125 |       if (action === "convert") {
  126 |         await expect(page.locator(".result-date")).toContainText(/18 Jun/);
  127 |         await page
  128 |           .getByRole("button", { name: "Dismiss imported text" })
  129 |           .click();
  130 |         await expect(input).toHaveValue(newer);
  131 |       } else {
  132 |         await page
  133 |           .getByRole("button", { name: "Replace with imported text" })
  134 |           .click();
  135 |         await expect(input).toHaveValue(incoming);
  136 |         await expect(page.locator(".hero-time")).toContainText(/3:00 pm/i);
  137 |       }
  138 |       expect(
  139 |         await page.evaluate(() => JSON.stringify({ ...localStorage })),
  140 |       ).not.toContain("April");
  141 |       expect(page.url()).not.toContain("share=");
  142 |     }
  143 |     if (source === "clipboard") {
  144 |       await page.reload();
  145 |       await page.getByRole("button", { name: "Paste", exact: true }).click();
  146 |       await page.evaluate(() => {
  147 |         (window as any).firstImport = (window as any).deliverImport;
  148 |       });
  149 |       await page.getByRole("button", { name: "Paste", exact: true }).click();
  150 |       await page.evaluate(
  151 |         (newer) => (window as any).deliverImport(newer),
  152 |         newer,
  153 |       );
  154 |       await expect(page.getByLabel("Message with a date or time")).toHaveValue(
  155 |         newer,
  156 |       );
  157 |       await page.evaluate(
  158 |         (incoming) => (window as any).firstImport(incoming),
  159 |         incoming,
  160 |       );
  161 |       await expect(page.getByLabel("Message with a date or time")).toHaveValue(
  162 |         newer,
  163 |       );
  164 |       await expect(
  165 |         page.getByRole("button", { name: "Replace with imported text" }),
  166 |       ).toHaveCount(0);
  167 |     }
  168 |   });
  169 | }
  170 | 
  171 | test("an unresolved target hides copyable fallback results and correction restores the source interpretation", async ({
  172 |   page,
  173 | }) => {
  174 |   await page.addInitScript(() =>
  175 |     Object.defineProperty(navigator, "clipboard", {
  176 |       value: {
  177 |         writeText: () =>
  178 |           (window as any).delayCopy
  179 |             ? new Promise<void>((_, reject) => {
  180 |                 (window as any).rejectCopy = reject;
  181 |               })
  182 |             : Promise.reject(new Error("Manual copy test")),
  183 |       },
  184 |     }),
  185 |   );
  186 |   await page.goto("/");
  187 |   await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  188 |   await enterZone(page, "UTC");
  189 |   await page
  190 |     .getByLabel("Message with a date or time")
  191 |     .fill("April 9, 2026 3pm UTC");
  192 |   await expect(page.locator(".hero-time")).toContainText(/3:00 pm/i);
  193 |   await page.getByRole("button", { name: "Copy UTC", exact: true }).click();
  194 |   await expect(page.getByLabel("Text to copy")).toBeVisible();
  195 |   await enterZone(page, "CST");
  196 |   await expect(page.locator(".result")).toHaveCount(0);
  197 |   await expect(
  198 |     page.getByRole("button", { name: "Copy UTC", exact: true }),
  199 |   ).toHaveCount(0);
  200 |   await expect(page.getByLabel("Text to copy")).toHaveCount(0);
  201 |   await expect(page.getByRole("alert")).toContainText("Choose a timezone");
  202 |   await expect(page.locator(".result")).toHaveCount(0);
  203 |   await enterZone(page, "Asia/Tokyo");
  204 |   await expect(page.getByRole("alert")).toHaveCount(0);
  205 |   await expect(page.locator(".hero-time")).toContainText(/12:00 am/i);
  206 |   await expect(page.locator(".result-date")).toContainText(/10 Apr/);
  207 |   await expect(page.locator(".source-label")).toHaveText("UTC");
  208 |   await page.getByRole("button", { name: "Copy UTC", exact: true }).click();
  209 |   await expect(page.getByLabel("Text to copy")).toHaveValue(
  210 |     /UTC\+09:00.*Tokyo/s,
  211 |   );
  212 |   await page.evaluate(() => {
  213 |     (window as any).delayCopy = true;
  214 |   });
  215 |   await page.getByRole("button", { name: "Copy UTC", exact: true }).click();
  216 |   await enterZone(page, "CST");
  217 |   await page.evaluate(() =>
  218 |     (window as any).rejectCopy(new Error("Delayed clipboard rejection")),
  219 |   );
  220 |   await expect(page.getByLabel("Text to copy")).toHaveCount(0);
  221 |   await expect(page.locator(".notice")).toHaveText("");
  222 | });
```