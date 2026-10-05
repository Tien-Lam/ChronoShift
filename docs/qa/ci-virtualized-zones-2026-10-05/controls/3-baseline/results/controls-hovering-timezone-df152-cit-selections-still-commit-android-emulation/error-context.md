# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: controls.spec.ts >> hovering timezone suggestions preserves typed values while explicit selections still commit
- Location: e2e/controls.spec.ts:407:0

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: hover: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[id="null"]').getByRole('option', { name: 'Osaka', exact: true })

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
              - combobox "Convert to" [ref=e31]: Asia/Tokyo
              - button "Show target timezones" [ref=e32] [cursor=pointer]
            - generic [ref=e35]: Tokyo · Asia/Tokyo
          - group [ref=e36]:
            - generic "More options" [ref=e37] [cursor=pointer]
            - generic [ref=e38]:
              - generic [ref=e39]: Source timezone when none is given
              - group [ref=e41]:
                - combobox "Source timezone when none is given" [active] [ref=e42]: Asia/Tokyo
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
  407 | test("hovering timezone suggestions preserves typed values while explicit selections still commit", async ({
  408 |   page,
  409 | }) => {
  410 |   await page.goto("/");
  411 |   await page.getByText("More options", { exact: true }).click();
  412 |   await enterZone(page, "UTC", "Source timezone when none is given");
  413 |   await enterZone(page, "UTC");
  414 |   await page
  415 |     .getByLabel("Message with a date or time")
  416 |     .fill("April 9, 2026 3pm UTC");
  417 |   for (const label of ["Convert to", "Source timezone when none is given"]) {
  418 |     const input = page.getByLabel(label, { exact: true });
  419 |     const other = page.getByLabel(
  420 |       label === "Convert to"
  421 |         ? "Source timezone when none is given"
  422 |         : "Convert to",
  423 |       { exact: true },
  424 |     );
  425 |     const otherValue = await other.inputValue();
  426 |     await enterZone(page, "CST", label);
  427 |     // Finish native ancestor scrolling while the popup is closed, before
  428 |     // input-driven opening. A delayed focus scroll intentionally dismisses it.
  429 |     await input.scrollIntoViewIfNeeded();
  430 |     await input.click();
  431 |     await expect(input).toHaveAttribute("aria-expanded", "false");
  432 |     await input.fill("Asia/Tokyo");
  433 |     await expect(input).toHaveAttribute("aria-controls", /.+/);
  434 |     const suggestions = page.locator(
  435 |       `[id="${await input.getAttribute("aria-controls")}"]`,
  436 |     );
  437 |     const alias = suggestions.getByRole("option", {
  438 |       name: "Osaka",
  439 |       exact: true,
  440 |     });
  441 |     // Leave any prior pointer position so this exercises a fresh hover event.
  442 |     await page.mouse.move(0, 0);
> 443 |     await alias.hover();
      |                ^ Error: hover: Test timeout of 30000ms exceeded.
  444 |     await expect(alias).toHaveAttribute("data-hovered", "true");
  445 |     await input.press("Tab");
  446 |     await expect(input).toHaveValue("Asia/Tokyo");
  447 |     await expect(other).toHaveValue(otherValue);
  448 |     await expect(page.getByRole("listbox")).toHaveCount(0);
  449 |     await expect(page.locator(".hero-time")).toHaveText(/12:00 am/i);
  450 |     await expect(page.locator(".result-date")).toContainText("10 Apr");
  451 | 
  452 |     // Navigation and selection are deliberate actions, unlike mere hover.
  453 |     await input.fill("Asia/Toky");
  454 |     await input.press("ArrowDown");
  455 |     await input.press("End");
  456 |     await expect(alias).toHaveAttribute("data-focused", "true");
  457 |     await input.press("Tab");
  458 |     await expect(input).toHaveValue("osaka");
  459 |     await expect(page.getByRole("listbox")).toHaveCount(0);
  460 |     // A real pointer interaction brings the field into view before typing.
  461 |     // Focusing an offscreen input with fill() can scroll its ancestor after
  462 |     // opening the popup; React Aria intentionally dismisses on that scroll.
  463 |     await input.scrollIntoViewIfNeeded();
  464 |     await input.click();
  465 |     await expect(input).toHaveAttribute("aria-expanded", "false");
  466 |     await input.fill("Tokyo");
  467 |     await expect(input).toHaveAttribute("aria-expanded", "true");
  468 |     const reopenedSuggestions = page.locator(
  469 |       `[id="${await input.getAttribute("aria-controls")}"]`,
  470 |     );
  471 |     await expect(reopenedSuggestions).toBeVisible();
  472 |     await reopenedSuggestions
  473 |       .getByRole("option", { name: "Tokyo", exact: true })
  474 |       .click();
  475 |     await expect(input).toHaveValue("Asia/Tokyo");
  476 |     await expect(other).toHaveValue(otherValue);
  477 |   }
  478 | });
  479 | 
```