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
  77  |       },
  78  |     };
  79  |     (window as any).__copyFocusProbe = state;
  80  |     Object.defineProperty(navigator, "clipboard", {
  81  |       value: {
  82  |         writeText: () => {
  83  |           record("clipboard-write-rejected");
  84  |           return Promise.reject(new Error("Manual copy test"));
  85  |         },
  86  |       },
  87  |     });
  88  |     window.requestAnimationFrame = (callback) => {
  89  |       const source = Function.prototype.toString.call(callback);
  90  |       // The app's deferred copy callback contains exactly these two ref calls.
  91  |       // Match its methods rather than a minifier-specific ref name; all other
  92  |       // animation/React Aria callbacks remain on the native scheduler.
  93  |       const copyFrame =
  94  |         armed &&
  95  |         source.length < 200 &&
  96  |         /\.current\?\.focus\(\)/.test(source) &&
  97  |         /\.current\?\.select\(\)/.test(source);
  98  |       if (!copyFrame) return nativeFrame(callback);
  99  |       armed = false;
  100 |       record("copy-frame-registered");
  101 |       const id = nativeFrame((time) => {
  102 |         held = { callback, time, id };
  103 |         record("copy-frame-held");
  104 |       });
  105 |       return id;
  106 |     };
  107 |     window.cancelAnimationFrame = (id) => {
  108 |       nativeCancel(id);
  109 |       if (held?.id === id) {
  110 |         record("copy-frame-cancelled");
  111 |         held = null;
  112 |       }
  113 |     };
  114 |     for (const event of ["focusin", "focusout", "beforeinput", "input"]) {
  115 |       document.addEventListener(
  116 |         event,
  117 |         (e) => {
  118 |           const element = e.target as HTMLElement;
  119 |           const target =
  120 |             element.id === "target-zone"
  121 |               ? "target-zone"
  122 |               : element.id === "manual-copy"
  123 |                 ? "manual-copy"
  124 |                 : "other";
  125 |           if (target !== "other") record(event, target);
  126 |         },
  127 |         true,
  128 |       );
  129 |     }
  130 |   });
  131 |   const assets: { path: string; bytes: number; sha256: string }[] = [];
  132 |   try {
  133 |     await page.goto("/");
  134 |     await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  135 |     const paths = await page
  136 |       .locator("script[src],link[rel=stylesheet]")
  137 |       .evaluateAll((elements) =>
  138 |         elements.map((element) =>
  139 |           element.tagName === "SCRIPT"
  140 |             ? (element as HTMLScriptElement).src
  141 |             : (element as HTMLLinkElement).href,
  142 |         ),
  143 |       );
  144 |     for (const url of paths) {
  145 |       const response = await page.request.get(url);
  146 |       const bytes = await response.body();
  147 |       assets.push({
  148 |         path: new URL(url).pathname,
  149 |         bytes: bytes.length,
  150 |         sha256: createHash("sha256").update(bytes).digest("hex"),
  151 |       });
  152 |     }
  153 |     await enterZone(page, "UTC");
  154 |     await page
  155 |       .getByLabel("Message with a date or time")
  156 |       .fill("April 9, 2026 3pm UTC");
  157 |     await expect(page.locator(".hero-time")).toContainText(/3:00 pm/i);
  158 |     await page.evaluate(() => (window as any).__copyFocusProbe.arm());
  159 |     await page.getByRole("button", { name: "Copy UTC", exact: true }).click();
  160 |     await expect(page.getByLabel("Text to copy")).toBeVisible();
  161 |     await expect
  162 |       .poll(() =>
  163 |         page.evaluate(() => (window as any).__copyFocusProbe.snapshot().held),
  164 |       )
  165 |       .toBe(true);
  166 |     const target = page.getByLabel("Convert to", { exact: true });
  167 |     await target.click();
  168 |     await expect(target).toBeFocused();
  169 |     await page.keyboard.press("ControlOrMeta+A");
  170 |     await page.evaluate(() => (window as any).__copyFocusProbe.release());
  171 |     const afterFrame = await page.evaluate(() =>
  172 |       (window as any).__copyFocusProbe.snapshot(),
  173 |     );
  174 |     expect.soft(afterFrame.active).toBe("target-zone");
  175 |     await page.keyboard.insertText("CST");
  176 |     await target.press("Tab");
> 177 |     await expect(target).toHaveValue("CST");
      |                         ^ Error: expect(locator).toHaveValue(expected) failed
  178 |     await expect(page.locator(".result")).toHaveCount(0);
  179 |     await expect(page.getByLabel("Text to copy")).toHaveCount(0);
  180 |     await expect(page.getByRole("alert")).toContainText("Choose a timezone");
  181 |     await enterZone(page, "Asia/Tokyo");
  182 |     await expect(page.locator(".hero-time")).toContainText(/12:00 am/i);
  183 |     await expect(page.locator(".result-date")).toContainText(/10 Apr/);
  184 |     await expect(page.locator(".source-label")).toHaveText("UTC");
  185 |     await page.getByRole("button", { name: "Copy UTC", exact: true }).click();
  186 |     await expect(page.getByLabel("Text to copy")).toHaveValue(
  187 |       /UTC\+09:00.*Tokyo/s,
  188 |     );
  189 |   } finally {
  190 |     const probe = await page
  191 |       .evaluate(() => (window as any).__copyFocusProbe.snapshot())
  192 |       .catch(() => ({ unavailable: true }));
  193 |     const observation = info.outputPath("copy-focus-observation.json");
  194 |     mkdirSync(dirname(observation), { recursive: true });
  195 |     writeFileSync(
  196 |       observation,
  197 |       JSON.stringify(
  198 |         { began, ended: new Date().toISOString(), baseURL, assets, probe },
  199 |         null,
  200 |         2,
  201 |       ),
  202 |     );
  203 |     await info.attach("copy-focus-observation", {
  204 |       path: observation,
  205 |       contentType: "application/json",
  206 |     });
  207 |     await page
  208 |       .evaluate(() => (window as any).__copyFocusProbe.cleanup())
  209 |       .catch(() => undefined);
  210 |   }
  211 | });
  212 | 
```