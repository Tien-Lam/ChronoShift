# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: frozen-original.spec.ts >> hovering timezone suggestions preserves typed values while explicit selections still commit
- Location: docs/qa/ci-efficiency-2026-10-05/adversarial/virtualization/frozen-original.spec.ts:8:0

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('[id="react-aria1911245955-_r_b_"]').getByRole('option', { name: 'Tokyo', exact: true })
    - locator resolved to <div data-rac="" role="option" aria-setsize="2" aria-posinset="1" class="choice-item" aria-selected="false" data-key="Asia/Tokyo" data-value="Asia/Tokyo" data-selection-mode="single" data-react-aria-pressable="true" aria-labelledby="react-aria1911245955-_r_3r_" data-collection="react-aria1911245955-_r_3l_" aria-describedby="react-aria1911245955-_r_3s_" id="react-aria1911245955-_r_b_-option-Asia/Tokyo">…</div>
  - attempting click action
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
      - link "ChronoShift home" [ref=e5]:
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
  1  | import {test,expect} from '/Users/tien/Developer/ChronoShift/e2e/fixtures';
  2  | import {enterZone} from '/Users/tien/Developer/ChronoShift/e2e/choices';
  3  | import {writeFileSync} from 'node:fs';
  4  | const variant=process.env.REVIEW_VARIANT!;
  5  | const kind=process.env.REVIEW_KIND!;
  6  | test.use({origin:{url:`http://127.0.0.1:${process.env.PLAYWRIGHT_PORT}/`,stop:async()=>{}},contextOptions:{recordHar:{path:`${import.meta.dir}/frozen-${kind}-${variant}.har`,content:'embed'}}});
  7  | test.afterEach(async ({page})=>{const actual={at:new Date().toISOString(),variant,kind,pageURL:page.url(),scripts:await page.locator('script[src]').evaluateAll(es=>es.map(e=>(e as HTMLScriptElement).src))};writeFileSync(`${import.meta.dir}/frozen-${kind}-${variant}-identity.json`,JSON.stringify(actual,null,2));});
  8  | test("hovering timezone suggestions preserves typed values while explicit selections still commit", async ({
  9  |   page,
  10 | }) => {
  11 |   await page.goto("/");
  12 |   await page.getByText("More options", { exact: true }).click();
  13 |   await enterZone(page, "UTC", "Source timezone when none is given");
  14 |   await enterZone(page, "UTC");
  15 |   await page
  16 |     .getByLabel("Message with a date or time")
  17 |     .fill("April 9, 2026 3pm UTC");
  18 |   for (const label of ["Convert to", "Source timezone when none is given"]) {
  19 |     const input = page.getByLabel(label, { exact: true });
  20 |     const other = page.getByLabel(
  21 |       label === "Convert to"
  22 |         ? "Source timezone when none is given"
  23 |         : "Convert to",
  24 |       { exact: true },
  25 |     );
  26 |     const otherValue = await other.inputValue();
  27 |     await enterZone(page, "CST", label);
  28 |     await input.fill("Asia/Tokyo");
  29 |     await expect(input).toHaveAttribute("aria-controls", /.+/);
  30 |     const suggestions = page.locator(
  31 |       `[id="${await input.getAttribute("aria-controls")}"]`,
  32 |     );
  33 |     const alias = suggestions.getByRole("option", {
  34 |       name: "Osaka",
  35 |       exact: true,
  36 |     });
  37 |     // Leave any prior pointer position so this exercises a fresh hover event.
  38 |     await page.mouse.move(0, 0);
  39 |     await alias.hover();
  40 |     await expect(alias).toHaveAttribute("data-hovered", "true");
  41 |     await input.press("Tab");
  42 |     await expect(input).toHaveValue("Asia/Tokyo");
  43 |     await expect(other).toHaveValue(otherValue);
  44 |     await expect(page.getByRole("listbox")).toHaveCount(0);
  45 |     await expect(page.locator(".hero-time")).toHaveText(/12:00 am/i);
  46 |     await expect(page.locator(".result-date")).toContainText("10 Apr");
  47 | 
  48 |     // Navigation and selection are deliberate actions, unlike mere hover.
  49 |     await input.fill("Asia/Toky");
  50 |     await input.press("ArrowDown");
  51 |     await input.press("End");
  52 |     await expect(alias).toHaveAttribute("data-focused", "true");
  53 |     await input.press("Tab");
  54 |     await expect(input).toHaveValue("osaka");
  55 |     await expect(page.getByRole("listbox")).toHaveCount(0);
  56 |     await input.fill("Tokyo");
  57 |     await suggestions
  58 |       .getByRole("option", { name: "Tokyo", exact: true })
> 59 |       .click();
     |       ^ Error: click: Test timeout of 30000ms exceeded.
  60 |     await expect(input).toHaveValue("Asia/Tokyo");
  61 |     await expect(other).toHaveValue(otherValue);
  62 |   }
  63 | });
  64 | 
```