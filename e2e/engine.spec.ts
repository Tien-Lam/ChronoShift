import { test, expect } from "./fixtures";
import { verifyProductionFixtures } from "./engine-fixtures";
test("independent exact fixture expectations run in the production browser worker", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  await verifyProductionFixtures(page);
});
