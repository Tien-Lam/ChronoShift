# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: copy-focus.spec.ts >> focus away and back does not revive the older copy frame
- Location: e2e/copy-focus.spec.ts:339:0

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
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
      - link "ChronoShift home" [ref=e9]:
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
          - textbox "Message with a date or time" [ref=e25]:
            - /placeholder: e.g. Let's meet tomorrow at 3pm PT
            - text: April 9, 2026 3pm UTC
          - generic [ref=e26]:
            - generic [ref=e27]:
              - button "Paste" [ref=e28] [cursor=pointer]
              - button "Clear" [ref=e29] [cursor=pointer]
            - generic [ref=e30]: Converts as you type
          - generic [ref=e31]:
            - generic [ref=e32]: Convert to
            - group [ref=e35]:
              - combobox "Convert to" [active] [ref=e36]: UTC
              - button "Show target timezones" [ref=e37] [cursor=pointer]
            - generic [ref=e40]: UTC · UTC
          - group [ref=e41]:
            - generic "More options" [ref=e42] [cursor=pointer]
        - region [ref=e43]:
          - generic [ref=e44]:
            - heading "Converted time" [level=2] [ref=e45]
            - generic [ref=e46]: Live
          - status [ref=e49]: 1 time interpretations found
          - article [ref=e50]:
            - generic [ref=e51]:
              - generic [ref=e52]:
                - generic [ref=e53]:
                  - generic [ref=e54]: 3:00 pm
                  - paragraph [ref=e55]: Thu, 9 Apr 2026
                  - paragraph [ref=e56]: UTC
                - button "Copy UTC" [ref=e57] [cursor=pointer]: Copy
              - paragraph [ref=e59]: "Source: UTC"
            - paragraph [ref=e61]: "Original: “April 9, 2026 3pm UTC”"
      - status [ref=e62]: Select the text below and copy it using your keyboard or touch menu.
      - generic [ref=e63]:
        - generic [ref=e64]: Text to copy
        - textbox "Text to copy" [ref=e65]: 3:00 pm · Thu, 9 Apr 2026 · UTC April 9, 2026 3pm UTC — UTC
      - generic [ref=e66]:
        - paragraph [ref=e67]: Your text stays on this device.
        - button "Keep ChronoShift handy" [ref=e68] [cursor=pointer]
```

# Test source

```ts
  168 |   journeyStarts.set(page, new Date().toISOString());
  169 |   await installCopyFocusProbe(page);
  170 | });
  171 | test.afterEach(async ({ page, baseURL }, info) => {
  172 |   const began = journeyStarts.get(page);
  173 |   const assets: { path: string; bytes: number; sha256: string }[] = [];
  174 |   const paths = await page
  175 |     .locator("script[src],link[rel=stylesheet]")
  176 |     .evaluateAll((elements) =>
  177 |       elements.map((element) =>
  178 |         element.tagName === "SCRIPT"
  179 |           ? (element as HTMLScriptElement).src
  180 |           : (element as HTMLLinkElement).href,
  181 |       ),
  182 |     )
  183 |     .catch(() => []);
  184 |   for (const url of paths) {
  185 |     const response = await page.request.get(url);
  186 |     const bytes = await response.body();
  187 |     assets.push({
  188 |       path: new URL(url).pathname,
  189 |       bytes: bytes.length,
  190 |       sha256: createHash("sha256").update(bytes).digest("hex"),
  191 |     });
  192 |   }
  193 |   const probe = await page
  194 |     .evaluate(() => (window as any).__copyFocusProbe.snapshot())
  195 |     .catch(() => ({ unavailable: true }));
  196 |   const browserEnvironment = await page
  197 |     .evaluate(() => ({
  198 |       url: location.href,
  199 |       userAgent: navigator.userAgent,
  200 |       locale: navigator.language,
  201 |       timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  202 |       raster: devicePixelRatio,
  203 |     }))
  204 |     .catch(() => ({ unavailable: true }));
  205 |   const observation = info.outputPath("copy-focus-observation.json");
  206 |   mkdirSync(dirname(observation), { recursive: true });
  207 |   writeFileSync(
  208 |     observation,
  209 |     JSON.stringify(
  210 |       {
  211 |         began,
  212 |         ended: new Date().toISOString(),
  213 |         baseURL,
  214 |         assets,
  215 |         probe,
  216 |         browserEnvironment,
  217 |         viewport: page.viewportSize(),
  218 |       },
  219 |       null,
  220 |       2,
  221 |     ),
  222 |   );
  223 |   await info.attach("copy-focus-observation", {
  224 |     path: observation,
  225 |     contentType: "application/json",
  226 |   });
  227 |   await page
  228 |     .evaluate(() => (window as any).__copyFocusProbe.cleanup())
  229 |     .catch(() => undefined);
  230 | });
  231 | 
  232 | async function seed(page: Page) {
  233 |   await page.goto("/");
  234 |   await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  235 |   await enterZone(page, "UTC");
  236 |   await page
  237 |     .getByLabel("Message with a date or time")
  238 |     .fill("April 9, 2026 3pm UTC");
  239 |   await expect(page.locator(".hero-time")).toContainText(/3:00 pm/i);
  240 | }
  241 | async function holdFallback(page: Page) {
  242 |   await page.evaluate(() => (window as any).__copyFocusProbe.arm());
  243 |   await page.getByRole("button", { name: "Copy UTC", exact: true }).click();
  244 |   await expect(page.getByLabel("Text to copy")).toBeVisible();
  245 |   await expect
  246 |     .poll(() =>
  247 |       page.evaluate(() => (window as any).__copyFocusProbe.snapshot().held),
  248 |     )
  249 |     .toBe(true);
  250 |   expect(
  251 |     await page.evaluate(
  252 |       () => (window as any).__copyFocusProbe.snapshot().matchingFrames,
  253 |     ),
  254 |   ).toBe(1);
  255 | }
  256 | 
  257 | async function release(page: Page) {
  258 |   await page.evaluate(() => (window as any).__copyFocusProbe.release());
  259 | }
  260 | async function rememberOwner(page: Page) {
  261 |   await page.evaluate(() => (window as any).__copyFocusProbe.rememberOwner());
  262 | }
  263 | async function expectOwnerRetained(page: Page) {
  264 |   expect(
  265 |     await page.evaluate(
  266 |       () => (window as any).__copyFocusProbe.snapshot().sameRememberedOwner,
  267 |     ),
> 268 |   ).toBe(true);
      |    ^ Error: expect(received).toBe(expected) // Object.is equality
  269 | }
  270 | 
  271 | test("a deferred manual-copy focus frame cannot steal a new target keyboard edit", async ({
  272 |   page,
  273 | }) => {
  274 |   await seed(page);
  275 |   await holdFallback(page);
  276 |   const target = page.getByLabel("Convert to", { exact: true });
  277 |   await target.click();
  278 |   await expect(target).toBeFocused();
  279 |   await page.keyboard.press("ControlOrMeta+A");
  280 |   await release(page);
  281 |   expect
  282 |     .soft(
  283 |       await page.evaluate(
  284 |         () => (window as any).__copyFocusProbe.snapshot().active,
  285 |       ),
  286 |     )
  287 |     .toBe("target-zone");
  288 |   // A physical keyboard insertion does not reacquire focus after the frame.
  289 |   await page.keyboard.insertText("CST");
  290 |   await target.press("Tab");
  291 |   await expect(target).toHaveValue("CST");
  292 |   await expect(page.locator(".result")).toHaveCount(0);
  293 |   await expect(page.getByLabel("Text to copy")).toHaveCount(0);
  294 |   await expect(page.getByRole("alert")).toContainText("Choose a timezone");
  295 |   await enterZone(page, "Asia/Tokyo");
  296 |   await expect(page.locator(".hero-time")).toContainText(/12:00 am/i);
  297 |   await expect(page.locator(".result-date")).toContainText(/10 Apr/);
  298 |   await expect(page.locator(".source-label")).toHaveText("UTC");
  299 |   await page.getByRole("button", { name: "Copy UTC", exact: true }).click();
  300 |   await expect(page.getByLabel("Text to copy")).toHaveValue(
  301 |     /UTC\+09:00.*Tokyo/s,
  302 |   );
  303 | });
  304 | 
  305 | test("an unchanged copy owner still receives selected manual fallback text", async ({
  306 |   page,
  307 | }) => {
  308 |   await seed(page);
  309 |   await holdFallback(page);
  310 |   await release(page);
  311 |   const manual = page.getByLabel("Text to copy");
  312 |   await expect(manual).toBeFocused();
  313 |   expect(
  314 |     await manual.evaluate((element: HTMLTextAreaElement) => ({
  315 |       start: element.selectionStart,
  316 |       end: element.selectionEnd,
  317 |       length: element.value.length,
  318 |     })),
  319 |   ).toEqual({
  320 |     start: 0,
  321 |     end: (await manual.inputValue()).length,
  322 |     length: (await manual.inputValue()).length,
  323 |   });
  324 | });
  325 | 
  326 | test("focus-only handoff is retained before any value changes", async ({
  327 |   page,
  328 | }) => {
  329 |   await seed(page);
  330 |   await holdFallback(page);
  331 |   const target = page.getByLabel("Convert to", { exact: true });
  332 |   await target.focus();
  333 |   await release(page);
  334 |   await expect(target).toBeFocused();
  335 |   await expect(target).toHaveValue("UTC");
  336 |   await expect(page.getByLabel("Text to copy")).toBeVisible();
  337 | });
  338 | 
  339 | test("focus away and back does not revive the older copy frame", async ({
  340 |   page,
  341 | }) => {
  342 |   await seed(page);
  343 |   await page.getByRole("button", { name: "Copy UTC", exact: true }).focus();
  344 |   await holdFallback(page);
  345 |   await rememberOwner(page);
  346 |   await page.getByLabel("Convert to", { exact: true }).focus();
  347 |   // Return to the exact original owner, not merely the same owner label.
  348 |   await page.evaluate(() => (window as any).__copyFocusProbe.restoreOwner());
  349 |   await expectOwnerRetained(page);
  350 |   await release(page);
  351 |   await expectOwnerRetained(page);
  352 | });
  353 | 
  354 | test("same-owner keyboard intent keeps the newer owner", async ({ page }) => {
  355 |   await seed(page);
  356 |   await holdFallback(page);
  357 |   await rememberOwner(page);
  358 |   await page.keyboard.press("Shift");
  359 |   await release(page);
  360 |   await expectOwnerRetained(page);
  361 | });
  362 | 
  363 | test("same-owner pointer intent keeps the newer owner", async ({ page }) => {
  364 |   await seed(page);
  365 |   const copy = page.getByRole("button", { name: "Copy UTC", exact: true });
  366 |   await copy.focus();
  367 |   await holdFallback(page);
  368 |   await rememberOwner(page);
```