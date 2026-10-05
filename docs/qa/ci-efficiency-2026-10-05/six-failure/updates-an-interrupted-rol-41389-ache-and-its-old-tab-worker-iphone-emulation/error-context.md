# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: updates.spec.ts >> an interrupted rollback preserves a retained cache and its old tab worker
- Location: e2e/updates.spec.ts:45:0

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: 'Update now' })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('button', { name: 'Update now' }) with timeout 10000ms
  - waiting for getByRole('button', { name: 'Update now' })

```

```yaml
- banner:
  - link "ChronoShift home":
    - /url: /
    - text: ChronoShift
  - group
- main:
  - heading "Time zone converter" [level=1]
  - region "Time zone converter":
    - heading "Time zone converter" [level=2]
    - text: Message with a date or time
    - textbox "Message with a date or time":
      - /placeholder: e.g. Let's meet tomorrow at 3pm PT
    - button "Paste"
    - text: Converts as you type Convert to
    - group:
      - combobox "Convert to"
      - button "Show target timezones"
    - text: Sydney · Australia/Sydney
    - group: More options
    - group: Try an example
  - region "Converted time":
    - heading "Converted time" [level=2]
    - text: Live
    - status
    - heading "Ready to convert" [level=3]
    - paragraph: Date, time and timezone appear here.
  - paragraph: Your text stays on this device.
  - button "Keep ChronoShift handy"
```

# Test source

```ts
  35  |       (await (
  36  |         await caches.open("chronoshift-test-first")
  37  |       ).match("/index.html"))!.text(),
  38  |     ),
  39  |   ).toContain("test-first-");
  40  |   await disconnect(context, origin);
  41  |   await page.reload();
  42  |   await convert(page, "first");
  43  | });
  44  | 
  45  | test("an interrupted rollback preserves a retained cache and its old tab worker", async ({
  46  |   page,
  47  |   context,
  48  |   baseURL,
  49  |   origin,
  50  | }) => {
  51  |   await publishRelease(context, baseURL!, "first");
  52  |   await page.goto("/");
  53  |   await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  54  |   const next = await context.newPage();
  55  |   await next.goto("/");
  56  |   await publish(context, next, "second");
  57  |   await activate(next);
  58  |   // Require staging on rollback, then fail a missing CSS download. All complete
  59  |   // cached assets serving the first tab must survive that failed installation.
  60  |   await page.evaluate(async () => {
  61  |     const cache = await caches.open("chronoshift-test-first");
  62  |     const css = (await cache.keys()).find((request) =>
  63  |       request.url.endsWith(".css"),
  64  |     )!;
  65  |     await cache.delete(css);
  66  |   });
  67  |   await publishRelease(context, baseURL!, "first-interrupted");
  68  |   await next.evaluate(async () => {
  69  |     const registration = (await navigator.serviceWorker.getRegistration())!;
  70  |     const settled = new Promise<void>((resolve) =>
  71  |       registration.addEventListener(
  72  |         "updatefound",
  73  |         () => {
  74  |           const worker = registration.installing!;
  75  |           worker.addEventListener("statechange", () => {
  76  |             if (worker.state === "redundant") resolve();
  77  |           });
  78  |         },
  79  |         { once: true },
  80  |       ),
  81  |     );
  82  |     await registration.update();
  83  |     await settled;
  84  |   });
  85  |   expect(await page.evaluate(() => caches.keys())).toContain(
  86  |     "chronoshift-test-first",
  87  |   );
  88  |   await disconnect(context, origin);
  89  |   await convert(page, "first");
  90  |   await convert(next, "second");
  91  | });
  92  | 
  93  | test("oversized drafts block an update until they can be safely preserved", async ({
  94  |   page,
  95  |   context,
  96  |   baseURL,
  97  | }) => {
  98  |   await publishRelease(context, baseURL!, "first");
  99  |   await page.goto("/");
  100 |   await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  101 |   const draft = "x".repeat(10001);
  102 |   await page.getByLabel("Message with a date or time").fill(draft);
  103 |   await publish(context, page, "second");
  104 |   await page.getByRole("button", { name: "Update now" }).click();
  105 |   await expect(
  106 |     page.getByText("Copy your message somewhere safe", { exact: false }),
  107 |   ).toBeVisible();
  108 |   await expect(page.getByLabel("Message with a date or time")).toHaveValue(
  109 |     draft,
  110 |   );
  111 |   expect(await revision(page)).toBe("test-first");
  112 |   await page
  113 |     .getByLabel("Message with a date or time")
  114 |     .fill("April 9, 2026 3pm UTC");
  115 |   await activate(page);
  116 |   await expect(page.getByLabel("Message with a date or time")).toHaveValue(
  117 |     "April 9, 2026 3pm UTC",
  118 |   );
  119 | });
  120 | 
  121 | async function publish(context: BrowserContext, page: Page, version: string) {
  122 |   expect(
  123 |     (
  124 |       await context.request.post(new URL("__test-release", page.url()).href, {
  125 |         data: version,
  126 |       })
  127 |     ).status(),
  128 |   ).toBe(204);
  129 |   await page.evaluate(async () => {
  130 |     await (await navigator.serviceWorker.getRegistration())!.update();
  131 |   });
  132 |   try {
  133 |     await expect(
  134 |       page.getByRole("button", { name: "Update now" }),
> 135 |     ).toBeVisible();
      |      ^ Error: expect(locator).toBeVisible() failed
  136 |   } catch (error) {
  137 |     console.log(
  138 |       "Update registration diagnostics",
  139 |       await page.evaluate(async () => {
  140 |         const registration = await navigator.serviceWorker.getRegistration();
  141 |         return {
  142 |           active: registration?.active?.state,
  143 |           installing: registration?.installing?.state,
  144 |           waiting: registration?.waiting?.state,
  145 |           caches: await caches.keys(),
  146 |         };
  147 |       }),
  148 |     );
  149 |     throw error;
  150 |   }
  151 | }
  152 | async function activate(page: Page) {
  153 |   await Promise.all([
  154 |     page.waitForEvent("domcontentloaded"),
  155 |     page.getByRole("button", { name: "Update now" }).click(),
  156 |   ]);
  157 |   await expect(page.getByRole("button", { name: "Update now" })).toHaveCount(0);
  158 |   await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  159 | }
  160 | async function rejectMixedWorker(page: Page) {
  161 |   // Prove these fixtures actually reject an incompatible worker contract.
  162 |   expect(
  163 |     await page.evaluate(async () => {
  164 |       const script =
  165 |         document.querySelector<HTMLScriptElement>("script[src]")!.src;
  166 |       const code = await (await fetch(script)).text();
  167 |       const workerURL = code.match(/new URL\(`([^`]+worker-[^`]+)`/)![1];
  168 |       return new Promise<string>((resolve) => {
  169 |         const worker = new Worker(
  170 |           workerURL.replace("test-first-", "test-second-"),
  171 |           { type: "module" },
  172 |         );
  173 |         worker.onerror = () => {
  174 |           worker.terminate();
  175 |           resolve("incompatible");
  176 |         };
  177 |         worker.onmessage = () => {
  178 |           worker.terminate();
  179 |           resolve("incorrectly accepted");
  180 |         };
  181 |         worker.postMessage({
  182 |           id: 1,
  183 |           text: "April 9, 2026 3pm UTC",
  184 |           options: { sourceZone: "UTC", targetZone: "UTC" },
  185 |           testProtocol: "wrong",
  186 |         });
  187 |       });
  188 |     }),
  189 |   ).toBe("incompatible");
  190 | }
  191 | async function revision(page: Page) {
  192 |   return page.evaluate(
  193 |     async () => (await (await fetch("release.json")).json()).sourceCommit,
  194 |   );
  195 | }
  196 | async function convert(page: Page, release: string) {
  197 |   // Exercise a fresh edit even when the same input was converted earlier.
  198 |   await page.getByLabel("Message with a date or time").fill("");
  199 |   const worker = page.waitForEvent("worker");
  200 |   await page
  201 |     .getByLabel("Message with a date or time")
  202 |     .fill("April 9, 2026 3pm UTC");
  203 |   expect((await worker).url()).toContain(`/test-${release}-worker-`);
  204 |   await expect(page.locator(".hero-time")).toHaveText(/1:00 am/i);
  205 |   await expect(page.locator(".result-date")).toHaveText(/10 Apr 2026/);
  206 |   await expect(page.getByRole("alert")).toHaveCount(0);
  207 | }
  208 | 
  209 | test("old and new tabs retain their own workers across successive releases and offline restart", async ({
  210 |   page,
  211 |   context,
  212 |   baseURL,
  213 |   origin,
  214 | }) => {
  215 |   expect(
  216 |     (
  217 |       await context.request.post(new URL("__test-release", baseURL!).href, {
  218 |         data: "first",
  219 |       })
  220 |     ).status(),
  221 |   ).toBe(204);
  222 |   await page.goto("/");
  223 |   await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  224 |   await page.getByLabel("Message with a date or time").fill("Old tab draft");
  225 |   const second = await context.newPage();
  226 |   await second.goto("/");
  227 |   await expect(second.locator('main[data-offline-ready="true"]')).toBeVisible();
  228 |   await rejectMixedWorker(second);
  229 |   await publish(context, second, "second");
  230 |   await activate(second);
  231 |   expect(await revision(second)).toBe("test-second");
  232 |   await expect(page.getByLabel("Message with a date or time")).toHaveValue(
  233 |     "Old tab draft",
  234 |   );
  235 |   // First conversion happens after activation: the lazy old worker must still exist.
```