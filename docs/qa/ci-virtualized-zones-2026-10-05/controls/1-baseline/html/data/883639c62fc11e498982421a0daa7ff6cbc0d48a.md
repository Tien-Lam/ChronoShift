# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: controls.spec.ts >> hovering timezone suggestions preserves typed values while explicit selections still commit
- Location: e2e/controls.spec.ts:407:0

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: getByLabel('Source timezone when none is given', { exact: true })
Expected pattern: /.+/
Received string:  ""
Timeout: 10000ms

Call log:
  - Expect "toHaveAttribute" getByLabel('Source timezone when none is given', { exact: true }) with timeout 10000ms
  - waiting for getByLabel('Source timezone when none is given', { exact: true })
    24 × locator resolved to <input data-rac="" type="text" tabindex="0" role="combobox" id="source-zone" autocorrect="off" autocomplete="off" spellcheck="false" value="Asia/Tokyo" data-focused="true" aria-expanded="false" aria-autocomplete="list" class="react-aria-Input" data-focus-visible="true" aria-label="Source timezone when none is given" placeholder="Device timezone · Australia/Sydney"/>
       - unexpected value "null"

```

```yaml
- combobox "Source timezone when none is given": Asia/Tokyo
```

# Test source

```ts
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
  427 |     await input.fill("Asia/Tokyo");
> 428 |     await expect(input).toHaveAttribute("aria-controls", /.+/);
      |                        ^ Error: expect(locator).toHaveAttribute(expected) failed
  429 |     const suggestions = page.locator(
  430 |       `[id="${await input.getAttribute("aria-controls")}"]`,
  431 |     );
  432 |     const alias = suggestions.getByRole("option", {
  433 |       name: "Osaka",
  434 |       exact: true,
  435 |     });
  436 |     // Leave any prior pointer position so this exercises a fresh hover event.
  437 |     await page.mouse.move(0, 0);
  438 |     await alias.hover();
  439 |     await expect(alias).toHaveAttribute("data-hovered", "true");
  440 |     await input.press("Tab");
  441 |     await expect(input).toHaveValue("Asia/Tokyo");
  442 |     await expect(other).toHaveValue(otherValue);
  443 |     await expect(page.getByRole("listbox")).toHaveCount(0);
  444 |     await expect(page.locator(".hero-time")).toHaveText(/12:00 am/i);
  445 |     await expect(page.locator(".result-date")).toContainText("10 Apr");
  446 | 
  447 |     // Navigation and selection are deliberate actions, unlike mere hover.
  448 |     await input.fill("Asia/Toky");
  449 |     await input.press("ArrowDown");
  450 |     await input.press("End");
  451 |     await expect(alias).toHaveAttribute("data-focused", "true");
  452 |     await input.press("Tab");
  453 |     await expect(input).toHaveValue("osaka");
  454 |     await expect(page.getByRole("listbox")).toHaveCount(0);
  455 |     // A real pointer interaction brings the field into view before typing.
  456 |     // Focusing an offscreen input with fill() can scroll its ancestor after
  457 |     // opening the popup; React Aria intentionally dismisses on that scroll.
  458 |     await input.scrollIntoViewIfNeeded();
  459 |     await input.click();
  460 |     await expect(input).toHaveAttribute("aria-expanded", "false");
  461 |     await input.fill("Tokyo");
  462 |     await expect(input).toHaveAttribute("aria-expanded", "true");
  463 |     const reopenedSuggestions = page.locator(
  464 |       `[id="${await input.getAttribute("aria-controls")}"]`,
  465 |     );
  466 |     await expect(reopenedSuggestions).toBeVisible();
  467 |     await reopenedSuggestions
  468 |       .getByRole("option", { name: "Tokyo", exact: true })
  469 |       .click();
  470 |     await expect(input).toHaveValue("Asia/Tokyo");
  471 |     await expect(other).toHaveValue(otherValue);
  472 |   }
  473 | });
  474 | 
```