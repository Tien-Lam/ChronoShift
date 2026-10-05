# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: controls.spec.ts >> timezone search preserves freeform offsets and recovers from empty and invalid choices
- Location: e2e/controls.spec.ts:339:0

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('option').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('option').first() with timeout 10000ms
  - waiting for getByRole('option').first()

```

```yaml
- log
- log
- banner:
  - link "ChronoShift home":
    - /url: /
    - text: ChronoShift
  - group: Appearance
- main:
  - heading "Time zone converter" [level=1]
  - region "Time zone converter":
    - heading "Time zone converter" [level=2]
    - text: Message with a date or time
    - textbox "Message with a date or time":
      - /placeholder: e.g. Let's meet tomorrow at 3pm PT
      - text: April 9, 2026 3pm UTC
    - button "Paste"
    - button "Clear"
    - text: Converts as you type Convert to
    - group:
      - combobox "Convert to"
      - button "Show target timezones"
    - text: Sydney · Australia/Sydney
    - group:
      - text: More options Source timezone when none is given
      - group:
        - combobox "Source timezone when none is given": UTC
        - button "Show source timezones"
      - text: Reference date for this message
      - group "Reference date for this message":
        - spinbutton "day, Reference date for this message": dd
        - spinbutton "month, Reference date for this message": mm
        - spinbutton "year, Reference date for this message": yyyy
        - button "Choose reference date Reference date for this message"
      - text: Leave empty to use today. Useful for an older message. Numeric dates
      - button "Month / day (04/09 = April 9) Numeric dates": Month / day (04/09 = April 9)
      - text: Time display
      - button "Use my device format Time display": Use my device format
      - checkbox "Enable detailed logs"
      - text: Enable detailed logs Console only. Message text excluded.
      - button "Reset preferences"
  - region "Converted time":
    - heading "Converted time" [level=2]
    - text: Live
    - status: 1 time interpretations found
    - article:
      - text: 1:00 am
      - paragraph: Fri, 10 Apr 2026
      - paragraph: UTC+10:00 Sydney +1 day
      - button "Copy UTC": Copy
      - paragraph: "Source: UTC"
      - paragraph: "Original: “April 9, 2026 3pm UTC”"
  - paragraph: Your text stays on this device.
  - button "Keep ChronoShift handy"
```

# Test source

```ts
  291 |   await expect(page.getByRole("alert")).toHaveText(
  292 |     "Complete or clear the reference date to continue.",
  293 |   );
  294 |   await expect(page.locator(".result")).toHaveCount(0);
  295 |   await enterReferenceDate(page, "2026-04-09");
  296 |   await page.getByRole("button", { name: /^Choose reference date/ }).click();
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
> 391 |   await expect(page.getByRole("option").first()).toBeVisible();
      |                                                 ^ Error: expect(locator).toBeVisible() failed
  392 |   await page.setViewportSize({ width: 280, height: 960 });
  393 |   await expectPopup(page, target, 280);
  394 |   await expect(target).toHaveValue("");
  395 |   await target.press("Escape");
  396 |   await target.fill("Tokyo");
  397 |   await page.getByRole("option", { name: /Tokyo/ }).click();
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