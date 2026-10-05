# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: retention.review.spec.ts >> first failure then success
- Location: docs/qa/ci-lifecycle-2026-10-05/code/retention.review.spec.ts:2:0

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 0
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
        - textbox "Message with a date or time" [ref=e20]:
          - /placeholder: e.g. Let's meet tomorrow at 3pm PT
        - generic [ref=e21]:
          - button "Paste" [ref=e23] [cursor=pointer]
          - generic [ref=e24]: Converts as you type
        - generic [ref=e25]:
          - generic [ref=e26]: Convert to
          - group [ref=e29]:
            - combobox "Convert to" [ref=e30]
            - button "Show target timezones" [ref=e31] [cursor=pointer]
          - generic [ref=e34]: Sydney · Australia/Sydney
        - group [ref=e35]:
          - generic "More options" [ref=e36] [cursor=pointer]
        - group [ref=e37]:
          - generic "Try an example" [ref=e38] [cursor=pointer]
      - region [ref=e39]:
        - generic [ref=e40]:
          - heading "Converted time" [level=2] [ref=e41]
          - generic [ref=e42]: Live
        - status [ref=e45]
        - generic [ref=e46]:
          - heading "Ready to convert" [level=3] [ref=e48]
          - paragraph [ref=e49]: Date, time and timezone appear here.
    - generic [ref=e50]:
      - paragraph [ref=e51]: Your text stays on this device.
      - button "Keep ChronoShift handy" [ref=e52] [cursor=pointer]
```

# Test source

```ts
  1 | import {test,expect} from '@playwright/test';
> 2 | test('first failure then success',async({page},info)=>{await page.goto('/');await expect(page.locator('main')).toBeVisible();expect(info.retry).toBe(1)});
    |                                                                                                                                                ^ Error: expect(received).toBe(expected) // Object.is equality
  3 | test('expected failure',async()=>{test.fail();expect(1).toBe(2)});
  4 | 
```