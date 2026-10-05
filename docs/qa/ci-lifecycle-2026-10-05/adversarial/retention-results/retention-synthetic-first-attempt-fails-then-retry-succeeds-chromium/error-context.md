# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: retention.spec.ts >> synthetic first attempt fails then retry succeeds
- Location: docs/qa/ci-lifecycle-2026-10-05/adversarial/retention.spec.ts:2:0

# Error details

```
Error: Intentional first-attempt failure for retention audit

expect(received).toBe(expected) // Object.is equality

Expected: 1
Received: 0
```

# Page snapshot

```yaml
- main [ref=e2]: Deliberately synthetic diagnostic fixture
```

# Test source

```ts
  1 | import { test, expect } from '@playwright/test';
  2 | test('synthetic first attempt fails then retry succeeds',async({page},info)=>{
  3 |  await page.setContent('<main>Deliberately synthetic diagnostic fixture</main>');
  4 |  await info.attach('synthetic-state',{body:JSON.stringify({ready:info.retry>0}),contentType:'application/json'});
> 5 |  expect(info.retry,'Intentional first-attempt failure for retention audit').toBe(1);
    |                                                                            ^ Error: Intentional first-attempt failure for retention audit
  6 | });
  7 | 
```