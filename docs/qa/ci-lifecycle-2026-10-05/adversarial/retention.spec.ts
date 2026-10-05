import { test, expect } from "@playwright/test";
test("synthetic first attempt fails then retry succeeds", async ({
  page,
}, info) => {
  await page.setContent(
    "<main>Deliberately synthetic diagnostic fixture</main>",
  );
  await info.attach("synthetic-state", {
    body: JSON.stringify({ ready: info.retry > 0 }),
    contentType: "application/json",
  });
  expect(
    info.retry,
    "Intentional first-attempt failure for retention audit",
  ).toBe(process.env.RETENTION_CLEAN === "1" ? 0 : 1);
});
