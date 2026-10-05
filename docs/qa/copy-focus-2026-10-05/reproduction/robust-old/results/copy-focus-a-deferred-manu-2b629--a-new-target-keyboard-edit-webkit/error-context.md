# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: copy-focus.spec.ts >> a deferred manual-copy focus frame cannot steal a new target keyboard edit
- Location: e2e/copy-focus.spec.ts:7:0

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "target-zone"
Received: "manual-copy"
```

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  getByLabel('Convert to', { exact: true })
Expected: "CST"
Received: "UTC"
Timeout:  10000ms

Call log:
  - Expect "toHaveValue" getByLabel('Convert to', { exact: true }) with timeout 10000ms
  - waiting for getByLabel('Convert to', { exact: true })
    24 × locator resolved to <input data-rac="" type="text" value="UTC" tabindex="0" role="combobox" id="target-zone" autocorrect="off" autocomplete="off" spellcheck="false" data-hovered="true" aria-expanded="false" aria-label="Convert to" aria-autocomplete="list" class="react-aria-Input" aria-describedby="target-zone-help" placeholder="Your timezone · Sydney"/>
       - unexpected value "UTC"

```

```yaml
- combobox "Convert to": UTC
```

# Test source

```ts
  88  |       value: {
  89  |         writeText: () => {
  90  |           record("clipboard-write-rejected");
  91  |           return Promise.reject(new Error("Manual copy test"));
  92  |         },
  93  |       },
  94  |     });
  95  |     window.requestAnimationFrame = (callback) => {
  96  |       const source = Function.prototype.toString.call(callback);
  97  |       // Collect matching methods during this copy only; allow candidate guards
  98  |       // and local element variables without depending on minified ref names.
  99  |       // Every nonmatching callback remains on the native scheduler.
  100 |       const copyFrame = /\.focus\(/.test(source) && /\.select\(/.test(source);
  101 |       if (!collecting || !copyFrame) return nativeFrame(callback);
  102 |       matchingFrames++;
  103 |       record("matching-copy-frame");
  104 |       if (!armed) return nativeFrame(callback);
  105 |       armed = false;
  106 |       record("copy-frame-registered");
  107 |       const id = nativeFrame((time) => {
  108 |         held = { callback, time, id };
  109 |         record("copy-frame-held");
  110 |       });
  111 |       return id;
  112 |     };
  113 |     window.cancelAnimationFrame = (id) => {
  114 |       nativeCancel(id);
  115 |       if (held?.id === id) {
  116 |         record("copy-frame-cancelled");
  117 |         held = null;
  118 |       }
  119 |     };
  120 |     for (const event of ["focusin", "focusout", "beforeinput", "input"]) {
  121 |       document.addEventListener(
  122 |         event,
  123 |         (e) => {
  124 |           const element = e.target as HTMLElement;
  125 |           const target =
  126 |             element.id === "target-zone"
  127 |               ? "target-zone"
  128 |               : element.id === "manual-copy"
  129 |                 ? "manual-copy"
  130 |                 : "other";
  131 |           if (target !== "other") record(event, target);
  132 |         },
  133 |         true,
  134 |       );
  135 |     }
  136 |   });
  137 |   const assets: { path: string; bytes: number; sha256: string }[] = [];
  138 |   try {
  139 |     await page.goto("/");
  140 |     await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  141 |     const paths = await page
  142 |       .locator("script[src],link[rel=stylesheet]")
  143 |       .evaluateAll((elements) =>
  144 |         elements.map((element) =>
  145 |           element.tagName === "SCRIPT"
  146 |             ? (element as HTMLScriptElement).src
  147 |             : (element as HTMLLinkElement).href,
  148 |         ),
  149 |       );
  150 |     for (const url of paths) {
  151 |       const response = await page.request.get(url);
  152 |       const bytes = await response.body();
  153 |       assets.push({
  154 |         path: new URL(url).pathname,
  155 |         bytes: bytes.length,
  156 |         sha256: createHash("sha256").update(bytes).digest("hex"),
  157 |       });
  158 |     }
  159 |     await enterZone(page, "UTC");
  160 |     await page
  161 |       .getByLabel("Message with a date or time")
  162 |       .fill("April 9, 2026 3pm UTC");
  163 |     await expect(page.locator(".hero-time")).toContainText(/3:00 pm/i);
  164 |     await page.evaluate(() => (window as any).__copyFocusProbe.arm());
  165 |     await page.getByRole("button", { name: "Copy UTC", exact: true }).click();
  166 |     await expect(page.getByLabel("Text to copy")).toBeVisible();
  167 |     await expect
  168 |       .poll(() =>
  169 |         page.evaluate(() => (window as any).__copyFocusProbe.snapshot().held),
  170 |       )
  171 |       .toBe(true);
  172 |     expect(
  173 |       await page.evaluate(
  174 |         () => (window as any).__copyFocusProbe.snapshot().matchingFrames,
  175 |       ),
  176 |     ).toBe(1);
  177 |     const target = page.getByLabel("Convert to", { exact: true });
  178 |     await target.click();
  179 |     await expect(target).toBeFocused();
  180 |     await page.keyboard.press("ControlOrMeta+A");
  181 |     await page.evaluate(() => (window as any).__copyFocusProbe.release());
  182 |     const afterFrame = await page.evaluate(() =>
  183 |       (window as any).__copyFocusProbe.snapshot(),
  184 |     );
  185 |     expect.soft(afterFrame.active).toBe("target-zone");
  186 |     await page.keyboard.insertText("CST");
  187 |     await target.press("Tab");
> 188 |     await expect(target).toHaveValue("CST");
      |                         ^ Error: expect(locator).toHaveValue(expected) failed
  189 |     await expect(page.locator(".result")).toHaveCount(0);
  190 |     await expect(page.getByLabel("Text to copy")).toHaveCount(0);
  191 |     await expect(page.getByRole("alert")).toContainText("Choose a timezone");
  192 |     await enterZone(page, "Asia/Tokyo");
  193 |     await expect(page.locator(".hero-time")).toContainText(/12:00 am/i);
  194 |     await expect(page.locator(".result-date")).toContainText(/10 Apr/);
  195 |     await expect(page.locator(".source-label")).toHaveText("UTC");
  196 |     await page.getByRole("button", { name: "Copy UTC", exact: true }).click();
  197 |     await expect(page.getByLabel("Text to copy")).toHaveValue(
  198 |       /UTC\+09:00.*Tokyo/s,
  199 |     );
  200 |   } finally {
  201 |     const probe = await page
  202 |       .evaluate(() => (window as any).__copyFocusProbe.snapshot())
  203 |       .catch(() => ({ unavailable: true }));
  204 |     const observation = info.outputPath("copy-focus-observation.json");
  205 |     mkdirSync(dirname(observation), { recursive: true });
  206 |     writeFileSync(
  207 |       observation,
  208 |       JSON.stringify(
  209 |         { began, ended: new Date().toISOString(), baseURL, assets, probe },
  210 |         null,
  211 |         2,
  212 |       ),
  213 |     );
  214 |     await info.attach("copy-focus-observation", {
  215 |       path: observation,
  216 |       contentType: "application/json",
  217 |     });
  218 |     await page
  219 |       .evaluate(() => (window as any).__copyFocusProbe.cleanup())
  220 |       .catch(() => undefined);
  221 |   }
  222 | });
  223 | 
```