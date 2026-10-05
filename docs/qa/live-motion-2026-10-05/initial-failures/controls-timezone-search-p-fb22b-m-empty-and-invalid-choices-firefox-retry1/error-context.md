# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: controls.spec.ts >> timezone search preserves freeform offsets and recovers from empty and invalid choices
- Location: e2e/controls.spec.ts:339:0

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByRole('option', { name: /Tokyo/ })
    - locator resolved to <div data-rac="" role="option" class="choice-item" aria-selected="false" data-key="Asia/Tokyo" data-value="Asia/Tokyo" data-selection-mode="single" data-react-aria-pressable="true" aria-labelledby="react-aria6357397151-_r_2u6_" data-collection="react-aria6357397151-_r_2u1_" aria-describedby="react-aria6357397151-_r_2u7_" id="react-aria6357397151-_r_b_-option-Asia/Tokyo">…</div>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not stable
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - performing click action
    - <html lang="en" data-theme="dark" data-design="command">…</html> intercepts pointer events
  - retrying click action
    - waiting 100ms
    - waiting for element to be visible, enabled and stable
  - element was detached from the DOM, retrying

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - log
    - log
  - generic [ref=e3]:
    - banner [ref=e4]:
      - link "ChronoShift home" [ref=e5] [cursor=pointer]:
        - /url: /
        - text: ChronoShift
      - group [ref=e8]:
        - generic "Appearance" [ref=e9] [cursor=pointer]
    - main [ref=e13]:
      - heading "Time zone converter" [level=1] [ref=e14]
      - generic [ref=e15]:
        - region [ref=e16]:
          - heading "Time zone converter" [level=2] [ref=e18]
          - generic [ref=e19]: Message with a date or time
          - textbox "Message with a date or time" [ref=e20]:
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
              - combobox "Convert to" [active] [ref=e31]: Tokyo
              - button "Show target timezones" [ref=e32] [cursor=pointer]
            - generic [ref=e35]: Tokyo · Asia/Tokyo
          - group [ref=e36]:
            - generic "More options" [ref=e37] [cursor=pointer]
            - generic [ref=e38]:
              - generic [ref=e39]: Source timezone when none is given
              - group [ref=e41]:
                - combobox "Source timezone when none is given" [ref=e42]: UTC
                - button "Show source timezones" [ref=e43] [cursor=pointer]
              - generic [ref=e46]:
                - generic [ref=e47]: Reference date for this message
                - group [ref=e48]:
                  - spinbutton "day, Reference date for this message" [ref=e49]: dd
                  - generic [aria-hidden] [ref=e50]: /
                  - spinbutton "month, Reference date for this message" [ref=e51]: mm
                  - generic [aria-hidden] [ref=e52]: /
                  - spinbutton "year, Reference date for this message" [ref=e53]: yyyy
                  - button "Choose reference date Reference date for this message" [ref=e54] [cursor=pointer]
              - textbox [ref=e59]
              - generic [ref=e60]: Leave empty to use today. Useful for an older message.
              - generic [ref=e61]: Numeric dates
              - generic [ref=e62]:
                - button "Month / day (04/09 = April 9) Numeric dates" [ref=e63] [cursor=pointer]:
                  - generic [ref=e64]: Month / day (04/09 = April 9)
                - combobox [ref=e69]
              - generic [ref=e70]: Time display
              - generic [ref=e71]:
                - button "Use my device format Time display" [ref=e72] [cursor=pointer]:
                  - generic [ref=e73]: Use my device format
                - combobox [ref=e78]
              - generic [ref=e79] [cursor=pointer]:
                - checkbox "Enable detailed logs" [ref=e80]
                - generic [ref=e81]: Enable detailed logs
              - generic [ref=e82]: Console only. Message text excluded.
              - button "Reset preferences" [ref=e83] [cursor=pointer]
        - region [ref=e84]:
          - generic [ref=e85]:
            - heading "Converted time" [level=2] [ref=e86]
            - generic [ref=e87]: Live
          - status [ref=e90]: 1 time interpretations found
          - article [ref=e91]:
            - generic [ref=e92]:
              - generic [ref=e93]:
                - generic [ref=e94]:
                  - generic [ref=e95]: 12:00 am
                  - paragraph [ref=e96]: Fri, 10 Apr 2026
                  - paragraph [ref=e97]:
                    - text: UTC+09:00 Tokyo
                    - generic [ref=e98]: +1 day
                - button "Copy UTC" [ref=e99] [cursor=pointer]: Copy
              - paragraph [ref=e101]: "Source: UTC"
            - paragraph [ref=e103]: "Original: “April 9, 2026 3pm UTC”"
      - generic [ref=e104]:
        - paragraph [ref=e105]: Your text stays on this device.
        - button "Keep ChronoShift handy" [ref=e106] [cursor=pointer]
```

# Test source

```ts
  297 |   const selectedDay = page.locator(".calendar-day[data-selected]");
  298 |   await expect(selectedDay).toHaveText("9");
  299 |   await selectedDay.press("ArrowRight");
  300 |   await page.keyboard.press("Enter");
  301 |   await expect(page.locator(".calendar-popover")).toHaveCount(0);
  302 |   await expect(
  303 |     page.locator('#reference-date [data-type="day"]'),
  304 |   ).toHaveAttribute("aria-valuenow", "10");
  305 |   await expect(page.locator(".result-date")).toHaveText(/11 Apr(?:il)? 2026/);
  306 |   await page.getByRole("button", { name: /^Choose reference date/ }).click();
  307 |   await page
  308 |     .locator(".calendar-popover")
  309 |     .getByRole("button", { name: "Clear reference date", exact: true })
  310 |     .click();
  311 |   await expect(page.locator(".calendar-popover")).toHaveCount(0);
  312 |   for (const type of ["year", "month", "day"]) {
  313 |     await expect(
  314 |       page.locator(`#reference-date [data-type="${type}"]`),
  315 |     ).toHaveAttribute("data-placeholder", "true");
  316 |   }
  317 |   const year = page.locator('#reference-date [data-type="year"]');
  318 |   await year.click();
  319 |   for (const digit of "2027") await year.press(digit);
  320 |   await year.press("Tab");
  321 |   await expect(page.getByRole("alert")).toHaveText(
  322 |     "Complete or clear the reference date to continue.",
  323 |   );
  324 |   await page
  325 |     .getByRole("button", { name: "Reset preferences", exact: true })
  326 |     .click();
  327 |   for (const type of ["year", "month", "day"]) {
  328 |     await expect(
  329 |       page.locator(`#reference-date [data-type="${type}"]`),
  330 |     ).toHaveAttribute("data-placeholder", "true");
  331 |   }
  332 |   await page
  333 |     .getByLabel("Message with a date or time")
  334 |     .fill("April 9, 2026 3pm UTC");
  335 |   await expect(page.locator(".hero-time")).toBeVisible();
  336 |   await expect(page.getByRole("alert")).toHaveCount(0);
  337 | });
  338 | 
  339 | test("timezone search preserves freeform offsets and recovers from empty and invalid choices", async ({
  340 |   page,
  341 |   isMobile,
  342 | }) => {
  343 |   await page.goto("/");
  344 |   await page.getByText("More options", { exact: true }).click();
  345 |   const target = page.getByLabel("Convert to", { exact: true });
  346 |   const source = page.getByLabel("Source timezone when none is given", {
  347 |     exact: true,
  348 |   });
  349 |   await source.fill("UTC");
  350 |   await target.fill("Tokyo");
  351 |   await expect(page.getByRole("option", { name: /Tokyo/ })).toHaveCount(1);
  352 |   await target.press("ArrowDown");
  353 |   await target.press("Enter");
  354 |   await expect(target).toHaveValue("Asia/Tokyo");
  355 |   await expect(source).toHaveValue("UTC");
  356 |   await expect(page.getByRole("listbox")).toHaveCount(0);
  357 |   await page
  358 |     .getByLabel("Message with a date or time")
  359 |     .fill("April 9, 2026 3pm UTC");
  360 |   await expect(page.locator(".hero-time")).toHaveText(/12:00 am/i);
  361 |   await target.fill("UTC");
  362 |   await expect(page.getByRole("listbox")).toBeVisible();
  363 |   // Valid freeform zones convert automatically; dismiss suggestions separately.
  364 |   await target.press("Escape");
  365 |   await expect(page.getByRole("listbox")).toHaveCount(0);
  366 |   await expect(page.locator(".hero-time")).toHaveText(/3:00 pm/i);
  367 | 
  368 |   if (isMobile) await target.tap({ position: { x: 24, y: 22 } });
  369 |   else await target.click();
  370 |   await target.fill("Definitely/Not-A-Timezone");
  371 |   await expect(page.getByText("No matches", { exact: true })).toBeVisible();
  372 |   await expect(page.locator('[role="option"][data-value]')).toHaveCount(0);
  373 |   await target.press("Escape");
  374 |   await expect(target).toHaveValue("Definitely/Not-A-Timezone");
  375 |   await expect(target).toHaveAttribute("aria-invalid", "true");
  376 |   await expect(page.locator(".result")).toHaveCount(0);
  377 |   await expect(page.getByRole("alert")).toContainText(/timezone/i);
  378 | 
  379 |   await target.fill("+05:45");
  380 |   await target.press("Escape");
  381 |   await expect(target).toHaveValue("+05:45");
  382 |   await expect(target).not.toHaveAttribute("aria-invalid", "true");
  383 |   await expect(page.locator(".hero-time")).toHaveText(/8:45 pm/i);
  384 |   await expect(source).toHaveValue("UTC");
  385 | 
  386 |   await target.fill("");
  387 |   await target.press("Escape");
  388 |   await page
  389 |     .getByRole("button", { name: "Show target timezones", exact: true })
  390 |     .click();
  391 |   await expect(page.getByRole("option").first()).toBeVisible();
  392 |   await page.setViewportSize({ width: 280, height: 960 });
  393 |   await expectPopup(page, target, 280);
  394 |   await expect(target).toHaveValue("");
  395 |   await target.press("Escape");
  396 |   await target.fill("Tokyo");
> 397 |   await page.getByRole("option", { name: /Tokyo/ }).click();
      |                                                    ^ Error: click: Test timeout of 30000ms exceeded.
  398 |   await expect(target).toHaveValue("Asia/Tokyo");
  399 |   await expect(page.locator(".hero-time")).toHaveText(/12:00 am/i);
  400 |   await source.fill("New York");
  401 |   await page.getByRole("option", { name: /New York/ }).click();
  402 |   await expect(source).toHaveValue("America/New_York");
  403 |   await expect(target).toHaveValue("Asia/Tokyo");
  404 |   await expect(page.locator(".hero-time")).toHaveText(/12:00 am/i);
  405 | });
  406 | 
```