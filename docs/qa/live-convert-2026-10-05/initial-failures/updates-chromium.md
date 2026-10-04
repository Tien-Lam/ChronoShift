# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: updates.spec.ts >> old and new tabs retain their own workers across successive releases and offline restart
- Location: e2e/updates.spec.ts:207:0

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: waitForEvent: Test timeout of 30000ms exceeded.
=========================== logs ===========================
waiting for event "worker"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - link "ChronoShift home" [ref=e4] [cursor=pointer]:
      - /url: /
      - text: ChronoShift
    - group [ref=e7]:
      - generic "Appearance" [ref=e8] [cursor=pointer]
  - main [ref=e13]:
    - heading "Time zone converter" [level=1] [ref=e14]
    - generic [ref=e15]:
      - region [ref=e16]:
        - heading "Time zone converter" [level=2] [ref=e18]
        - generic [ref=e19]: Message with a date or time
        - textbox "Message with a date or time" [active] [ref=e20]:
          - /placeholder: e.g. Let's meet tomorrow at 3pm PT
          - text: April 9, 2026 3pm UTC
        - generic [ref=e21]:
          - generic [ref=e22]:
            - button "Paste" [ref=e23] [cursor=pointer]
            - button "Clear" [ref=e24] [cursor=pointer]
          - generic [ref=e25]: Converts as you type
        - generic [ref=e26]:
          - generic [ref=e27]: Convert to
          - group [ref=e30]:
            - combobox "Convert to" [ref=e31]
            - button "Show target timezones" [ref=e32] [cursor=pointer]
          - generic [ref=e35]: Sydney · Australia/Sydney
        - group [ref=e36]:
          - generic "More options" [ref=e37] [cursor=pointer]
      - region [ref=e38]:
        - heading "Converted time" [level=2] [ref=e40]
        - status [ref=e41]: 1 time interpretations found
        - article [ref=e42]:
          - generic [ref=e43]:
            - generic [ref=e44]:
              - generic [ref=e45]:
                - generic [ref=e46]: 1:00 am
                - paragraph [ref=e47]: Fri, 10 Apr 2026
                - paragraph [ref=e48]:
                  - text: UTC+10:00 Sydney
                  - generic [ref=e49]: +1 day
              - button "Copy UTC" [ref=e50] [cursor=pointer]: Copy
            - paragraph [ref=e52]: "Source: UTC"
          - paragraph [ref=e54]: "Original: “April 9, 2026 3pm UTC”"
    - generic [ref=e55]:
      - paragraph [ref=e56]: Your text stays on this device.
      - button "Keep ChronoShift handy" [ref=e57] [cursor=pointer]
```

# Test source

```ts
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
  135 |     ).toBeVisible();
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
> 197 |   const worker = page.waitForEvent("worker");
      |                      ^ Error: waitForEvent: Test timeout of 30000ms exceeded.
  198 |   await page
  199 |     .getByLabel("Message with a date or time")
  200 |     .fill("April 9, 2026 3pm UTC");
  201 |   expect((await worker).url()).toContain(`/test-${release}-worker-`);
  202 |   await expect(page.locator(".hero-time")).toHaveText(/1:00 am/i);
  203 |   await expect(page.locator(".result-date")).toHaveText(/10 Apr 2026/);
  204 |   await expect(page.getByRole("alert")).toHaveCount(0);
  205 | }
  206 | 
  207 | test("old and new tabs retain their own workers across successive releases and offline restart", async ({
  208 |   page,
  209 |   context,
  210 |   baseURL,
  211 |   origin,
  212 | }) => {
  213 |   expect(
  214 |     (
  215 |       await context.request.post(new URL("__test-release", baseURL!).href, {
  216 |         data: "first",
  217 |       })
  218 |     ).status(),
  219 |   ).toBe(204);
  220 |   await page.goto("/");
  221 |   await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  222 |   await page.getByLabel("Message with a date or time").fill("Old tab draft");
  223 |   const second = await context.newPage();
  224 |   await second.goto("/");
  225 |   await expect(second.locator('main[data-offline-ready="true"]')).toBeVisible();
  226 |   await rejectMixedWorker(second);
  227 |   await publish(context, second, "second");
  228 |   await activate(second);
  229 |   expect(await revision(second)).toBe("test-second");
  230 |   await expect(page.getByLabel("Message with a date or time")).toHaveValue(
  231 |     "Old tab draft",
  232 |   );
  233 |   // First conversion happens after activation: the lazy old worker must still exist.
  234 |   await convert(page, "first");
  235 |   await convert(second, "second");
  236 |   const third = await context.newPage();
  237 |   await third.goto("/");
  238 |   await expect(third.locator('main[data-offline-ready="true"]')).toBeVisible();
  239 |   await publish(context, third, "third");
  240 |   await activate(third);
  241 |   expect(await revision(third)).toBe("test-third");
  242 |   await expect(page.locator("script[src]")).toHaveAttribute(
  243 |     "src",
  244 |     /test-first-/,
  245 |   );
  246 |   await expect(second.locator("script[src]")).toHaveAttribute(
  247 |     "src",
  248 |     /test-second-/,
  249 |   );
  250 |   expect(await page.evaluate(() => caches.keys())).toEqual(
  251 |     expect.arrayContaining([
  252 |       "chronoshift-test-first",
  253 |       "chronoshift-test-second",
  254 |       "chronoshift-test-third",
  255 |     ]),
  256 |   );
  257 |   await disconnect(context, origin);
  258 |   await convert(page, "first");
  259 |   await convert(second, "second");
  260 |   await convert(third, "third");
  261 |   await third.close();
  262 |   const reopened = await context.newPage();
  263 |   await reopened.goto("/");
  264 |   expect(await revision(reopened)).toBe("test-third");
  265 |   await convert(reopened, "third");
  266 | });
  267 | 
  268 | test("rollback preserves draft and preferences and removes obsolete caches with one remaining tab", async ({
  269 |   page,
  270 |   context,
  271 |   baseURL,
  272 |   origin,
  273 | }) => {
  274 |   await page.addInitScript(() => {
  275 |     const register = navigator.serviceWorker.register.bind(
  276 |       navigator.serviceWorker,
  277 |     );
  278 |     navigator.serviceWorker.register = async (...args) => {
  279 |       const registration = await register(...args);
  280 |       return new Proxy(registration, {
  281 |         get(target, property) {
  282 |           if (property === "waiting" && (window as any).__hideWaiting)
  283 |             return null;
  284 |           const value = Reflect.get(target, property, target);
  285 |           return typeof value === "function" ? value.bind(target) : value;
  286 |         },
  287 |       });
  288 |     };
  289 |   });
  290 |   expect(
  291 |     (
  292 |       await context.request.post(new URL("__test-release", baseURL!).href, {
  293 |         data: "first",
  294 |       })
  295 |     ).status(),
  296 |   ).toBe(204);
  297 |   await page.goto("/");
```