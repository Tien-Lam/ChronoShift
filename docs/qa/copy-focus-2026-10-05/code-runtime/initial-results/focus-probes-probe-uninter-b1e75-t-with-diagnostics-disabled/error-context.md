# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: focus-probes.spec.ts >> probe uninterrupted fallback selects exact copy text with diagnostics disabled
- Location: docs/qa/copy-focus-2026-10-05/code-runtime/focus-probes.spec.ts:148:0

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator: getByLabel('Text to copy')
Timeout: 10000ms
Expected pattern: /9 Apr 2026.*3:00 pm.*UTC/s
Received string:  "3:00 pm · Thu, 9 Apr 2026 · UTC
April 9, 2026 3pm UTC — UTC"

Call log:
  - Expect "toHaveValue" getByLabel('Text to copy') with timeout 10000ms
  - waiting for getByLabel('Text to copy')
    24 × locator resolved to <textarea readonly id="manual-copy">3:00 pm · Thu, 9 Apr 2026 · UTC↵April 9, 2026 3pm…</textarea>
       - unexpected value "3:00 pm · Thu, 9 Apr 2026 · UTC
April 9, 2026 3pm UTC — UTC"

```

```yaml
- textbox "Text to copy": 3:00 pm · Thu, 9 Apr 2026 · UTC April 9, 2026 3pm UTC — UTC
```

# Test source

```ts
  55  |       if (!state.held) throw new Error("no held copy frame");
  56  |       const callback = state.held;
  57  |       state.held = undefined;
  58  |       nativeFrame((at) => {
  59  |         callback(at);
  60  |         state.released = true;
  61  |       });
  62  |     };
  63  |   });
  64  | });
  65  | 
  66  | test.afterEach(async ({ page }, info) => {
  67  |   await Promise.all(logReads.get(page) || []);
  68  |   const environment = await page.evaluate(() => ({
  69  |     origin: location.origin,
  70  |     userAgent: navigator.userAgent,
  71  |     reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  72  |     activeField: document.activeElement?.id || document.activeElement?.tagName,
  73  |   }));
  74  |   const path = info.outputPath("probe-evidence.json");
  75  |   await writeFile(
  76  |     path,
  77  |     JSON.stringify(
  78  |       {
  79  |         capturedAt: new Date().toISOString(),
  80  |         retry: info.retry,
  81  |         status: info.status,
  82  |         environment,
  83  |         copyLogs: copyLogs.get(page) || [],
  84  |       },
  85  |       null,
  86  |       2,
  87  |     ),
  88  |   );
  89  |   await info.attach("probe-evidence", {
  90  |     path,
  91  |     contentType: "application/json",
  92  |   });
  93  | });
  94  | 
  95  | async function setup(page: Page, logs = false) {
  96  |   if (logs)
  97  |     await page.addInitScript(() =>
  98  |       sessionStorage.setItem("chronoshift-detailed-logs", "true"),
  99  |     );
  100 |   await page.goto("/");
  101 |   await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  102 |   const release = await page.request.get("/release.json");
  103 |   expect((await release.json()).sourceCommit).toBe(
  104 |     "35e11bac657a0c379fda48af9b454e674d2ea854",
  105 |   );
  106 |   const target = page.getByLabel("Convert to", { exact: true });
  107 |   await target.fill("UTC");
  108 |   await target.press("Tab");
  109 |   await expect(target).toHaveValue("UTC");
  110 |   await page
  111 |     .getByLabel("Message with a date or time")
  112 |     .fill("April 9, 2026 3pm UTC");
  113 |   await expect(page.locator(".hero-time")).toHaveText(/3:00 pm/i);
  114 |   expect(
  115 |     await page.evaluate(
  116 |       () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  117 |     ),
  118 |   ).toBe(false);
  119 | }
  120 | const copy = (page: Page) =>
  121 |   page.getByRole("button", { name: "Copy UTC", exact: true });
  122 | const target = (page: Page) => page.getByLabel("Convert to", { exact: true });
  123 | async function hold(page: Page) {
  124 |   await page.evaluate(() => {
  125 |     (window as any).copyProbe.hold = true;
  126 |   });
  127 | }
  128 | async function release(page: Page) {
  129 |   await page.evaluate(() => (window as any).releaseCopyFrame());
  130 |   await page.waitForFunction(() => (window as any).copyProbe.released);
  131 | }
  132 | async function reject(page: Page, index: number) {
  133 |   await page.evaluate(
  134 |     (i) => (window as any).copyProbe.pending[i].reject(),
  135 |     index,
  136 |   );
  137 | }
  138 | async function delayed(page: Page) {
  139 |   await page.evaluate(() => {
  140 |     (window as any).copyProbe.delayed = true;
  141 |   });
  142 | }
  143 | async function settleLogs(page: Page) {
  144 |   await Promise.all(logReads.get(page) || []);
  145 |   return copyLogs.get(page) || [];
  146 | }
  147 | 
  148 | test("probe uninterrupted fallback selects exact copy text with diagnostics disabled", async ({
  149 |   page,
  150 | }) => {
  151 |   await setup(page);
  152 |   await copy(page).click();
  153 |   const field = page.getByLabel("Text to copy");
  154 |   await expect(field).toBeFocused();
> 155 |   await expect(field).toHaveValue(/9 Apr 2026.*3:00 pm.*UTC/s);
      |                      ^ Error: expect(locator).toHaveValue(expected) failed
  156 |   expect(
  157 |     await field.evaluate((el: HTMLTextAreaElement) => [
  158 |       el.selectionStart,
  159 |       el.selectionEnd,
  160 |       el.value.length,
  161 |     ]),
  162 |   ).toEqual([
  163 |     0,
  164 |     await field.inputValue().then((v) => v.length),
  165 |     await field.inputValue().then((v) => v.length),
  166 |   ]);
  167 |   expect(await settleLogs(page)).toEqual([]);
  168 | });
  169 | 
  170 | test("probe held native fallback frame yields to target keyboard entry and exact correction", async ({
  171 |   page,
  172 | }) => {
  173 |   await setup(page, true);
  174 |   await hold(page);
  175 |   await copy(page).click();
  176 |   await expect(page.getByLabel("Text to copy")).toBeVisible();
  177 |   await target(page).focus();
  178 |   await release(page);
  179 |   await expect(target(page)).toBeFocused();
  180 |   await target(page).press("ControlOrMeta+A");
  181 |   await page.keyboard.type("CST");
  182 |   await target(page).press("Tab");
  183 |   await expect(target(page)).toHaveValue("CST");
  184 |   await expect(page.locator(".result")).toHaveCount(0);
  185 |   await expect(page.getByLabel("Text to copy")).toHaveCount(0);
  186 |   await expect(page.getByRole("alert")).toContainText("Choose a timezone");
  187 |   await target(page).fill("Asia/Tokyo");
  188 |   await target(page).press("Tab");
  189 |   await expect(target(page)).toHaveValue("Asia/Tokyo");
  190 |   await expect(page.locator(".hero-time")).toHaveText(/12:00 am/i);
  191 |   await expect(page.locator(".result-date")).toContainText("10 Apr");
  192 |   await expect(page.locator(".source-label")).toHaveText("UTC");
  193 |   const logs = JSON.stringify(await settleLogs(page));
  194 |   expect(logs).toContain("new-interaction");
  195 |   expect(logs).not.toContain("copy.focus-applied");
  196 |   expect(logs).not.toContain("April 9, 2026 3pm UTC");
  197 |   expect(logs).not.toContain("Asia/Tokyo");
  198 | });
  199 | 
  200 | test("probe delayed rejection after focus-only handoff retains fallback without stealing focus", async ({
  201 |   page,
  202 | }) => {
  203 |   await setup(page, true);
  204 |   await delayed(page);
  205 |   await copy(page).click();
  206 |   await target(page).focus();
  207 |   await reject(page, 0);
  208 |   await expect(page.getByLabel("Text to copy")).toBeVisible();
  209 |   await expect
  210 |     .poll(async () => JSON.stringify(await settleLogs(page)))
  211 |     .toContain("new-interaction");
  212 |   await expect(target(page)).toBeFocused();
  213 |   await expect(target(page)).toHaveValue("UTC");
  214 |   expect(JSON.stringify(await settleLogs(page))).not.toContain(
  215 |     "copy.focus-applied",
  216 |   );
  217 | });
  218 | 
  219 | test("probe invalidation suppresses delayed clipboard rejection", async ({
  220 |   page,
  221 | }) => {
  222 |   await setup(page, true);
  223 |   await delayed(page);
  224 |   await copy(page).click();
  225 |   await target(page).fill("CST");
  226 |   await target(page).press("Tab");
  227 |   await reject(page, 0);
  228 |   await expect(target(page)).toHaveValue("CST");
  229 |   await expect(page.getByRole("alert")).toContainText("Choose a timezone");
  230 |   await expect(page.getByLabel("Text to copy")).toHaveCount(0);
  231 |   await expect(page.locator(".notice")).toHaveText("");
  232 |   expect(JSON.stringify(await settleLogs(page))).not.toContain(
  233 |     "copy.focus-scheduled",
  234 |   );
  235 | });
  236 | 
  237 | test("probe latest successful copy owns outcome after earlier late rejection", async ({
  238 |   page,
  239 | }) => {
  240 |   await setup(page, true);
  241 |   await delayed(page);
  242 |   await copy(page).click();
  243 |   await copy(page).click();
  244 |   await page.evaluate(() => (window as any).copyProbe.pending[1].resolve());
  245 |   await expect(page.locator(".notice")).toHaveText(
  246 |     "Copied with the date and timezone.",
  247 |   );
  248 |   await reject(page, 0);
  249 |   await expect(page.locator(".notice")).toHaveText(
  250 |     "Copied with the date and timezone.",
  251 |   );
  252 |   await expect(page.getByLabel("Text to copy")).toHaveCount(0);
  253 |   expect(JSON.stringify(await settleLogs(page))).not.toContain(
  254 |     "copy.focus-scheduled",
  255 |   );
```