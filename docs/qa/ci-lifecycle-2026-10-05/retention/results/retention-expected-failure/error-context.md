# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: retention.spec.ts >> expected failure
- Location: docs/qa/ci-lifecycle-2026-10-05/retention.spec.ts:9:0

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | // Isolated reporter regression, deliberately outside the routine CI testDir.
  4  | test("first attempt fails, retry succeeds", async ({ page }, testInfo) => {
  5  |   await page.setContent("<main>synthetic diagnostic fixture</main>");
  6  |   expect(testInfo.retry).toBeGreaterThan(0);
  7  | });
  8  | test("ordinary success", async () => {});
  9  | test("expected failure", async () => {
  10 |   test.fail();
> 11 |   expect(false).toBe(true);
     |                ^ Error: expect(received).toBe(expected) // Object.is equality
  12 | });
  13 | test.skip("skipped", async () => {});
  14 | 
```