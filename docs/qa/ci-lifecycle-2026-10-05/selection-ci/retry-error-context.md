# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: imports.spec.ts >> an unresolved target hides copyable fallback results and correction restores the source interpretation
- Location: e2e/imports.spec.ts:173:0

# Error details

```
Error: expect(locator).toHaveValue(expected) failed

Locator:  getByLabel('Convert to', { exact: true })
Expected: "Asia/Tokyo"
Received: "osaka"
Timeout:  10000ms

Call log:
  - Expect "toHaveValue" getByLabel('Convert to', { exact: true }) with timeout 10000ms
  - waiting for getByLabel('Convert to', { exact: true })
    23 × locator resolved to <input data-rac="" type="text" tabindex="0" value="osaka" role="combobox" id="target-zone" autocorrect="off" autocomplete="off" spellcheck="false" aria-expanded="false" aria-label="Convert to" aria-autocomplete="list" class="react-aria-Input" aria-describedby="target-zone-help" placeholder="Your timezone · Sydney"/>
       - unexpected value "osaka"

```

```yaml
- combobox "Convert to": osaka
```

# Test source

```ts
  1  | import { expect, type Page } from "@playwright/test";
  2  | 
  3  | // Exercise the visible app menu; React Aria's hidden form select does not
  4  | // establish that the user can open, navigate or choose from the themed popup.
  5  | export function choiceTrigger(page: Page, label: string) {
  6  |   // React Aria includes the selected text before the field label in the name.
  7  |   return page.getByRole("button", { name: new RegExp(`${label}$`) });
  8  | }
  9  | 
  10 | export async function choose(page: Page, label: string, value: string) {
  11 |   const trigger = choiceTrigger(page, label);
  12 |   await trigger.click();
  13 |   await page.locator(`[role="option"][data-value="${value}"]`).click();
  14 |   await expect(trigger).toHaveAttribute("data-value", value);
  15 |   await expect(page.getByRole("option")).toHaveCount(0);
  16 | }
  17 | 
  18 | export async function enterZone(
  19 |   page: Page,
  20 |   value: string,
  21 |   label = "Convert to",
  22 | ) {
  23 |   const input = page.getByLabel(label, { exact: true });
  24 |   await input.fill(value);
  25 |   // Commit custom input and leave the combobox before addressing other
  26 |   // accessible controls: its open suggestions intentionally hide outside UI.
  27 |   await input.press("Tab");
> 28 |   await expect(input).toHaveValue(value);
     |                      ^ Error: expect(locator).toHaveValue(expected) failed
  29 | }
  30 | 
  31 | export async function enterReferenceDate(page: Page, isoDate: string) {
  32 |   const [year, month, day] = isoDate.split("-");
  33 |   for (const [type, value] of [
  34 |     ["year", year],
  35 |     ["month", month],
  36 |     ["day", day],
  37 |   ]) {
  38 |     const segment = page.locator(
  39 |       `#reference-date [data-type="${type}"][role="spinbutton"]`,
  40 |     );
  41 |     await segment.click();
  42 |     const existing = await segment.getAttribute("aria-valuenow");
  43 |     if (existing)
  44 |       for (const digit of existing) await segment.press("Backspace");
  45 |     for (const digit of String(Number(value))) await segment.press(digit);
  46 |     await segment.press("Tab");
  47 |     await expect(segment).toHaveAttribute(
  48 |       "aria-valuenow",
  49 |       String(Number(value)),
  50 |     );
  51 |   }
  52 | }
  53 | 
```