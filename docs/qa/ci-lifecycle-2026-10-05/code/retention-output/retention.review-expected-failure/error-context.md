# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: retention.review.spec.ts >> expected failure
- Location: docs/qa/ci-lifecycle-2026-10-05/code/retention.review.spec.ts:3:0

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 2
Received: 1
```

# Test source

```ts
  1 | import {test,expect} from '@playwright/test';
  2 | test('first failure then success',async({page},info)=>{await page.goto('/');await expect(page.locator('main')).toBeVisible();expect(info.retry).toBe(1)});
> 3 | test('expected failure',async()=>{test.fail();expect(1).toBe(2)});
    |                                                        ^ Error: expect(received).toBe(expected) // Object.is equality
  4 | 
```