import { test, expect } from "@playwright/test";

// Isolated reporter regression, deliberately outside the routine CI testDir.
test("first attempt fails, retry succeeds", async ({ page }, testInfo) => {
  await page.setContent("<main>synthetic diagnostic fixture</main>");
  expect(testInfo.retry).toBeGreaterThan(0);
});
test("ordinary success", async () => {});
test("expected failure", async () => {
  test.fail();
  expect(false).toBe(true);
});
test.skip("skipped", async () => {});
