// Four bounded close observations: original native animation and real Escape.
import { chromium, expect } from "@playwright/test";
const began = new Date().toISOString();
const browser = await chromium.launch();
const rows: unknown[] = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "no-preference",
  });
  await page.goto("http://127.0.0.1:4298/");
  await expect(page.locator("main")).toHaveAttribute(
    "data-offline-ready",
    "true",
  );
  await page.getByLabel("Appearance", { exact: true }).click();
  for (const condition of ["early", "settled", "early", "settled"]) {
    await page.getByRole("button", { name: /Theme$/ }).click();
    await expect(page.locator(".choice-popover:visible")).toHaveCount(1);
    if (condition === "settled")
      await page.evaluate(async () => {
        await Promise.all(
          document
            .querySelector(".choice-popover")!
            .getAnimations()
            .map((a) => a.finished.catch(() => {})),
        );
      });
    await page.evaluate(() => {
      const popup = document.querySelector<HTMLElement>(".choice-popover")!;
      const record = {
        start: performance.now(),
        removed: null as number | null,
        animationFinished: [] as number[],
        entering: popup.hasAttribute("data-entering"),
        runningAnimations: popup
          .getAnimations()
          .filter((a) => a.playState === "running").length,
      };
      (window as any).__closeObserved = record;
      popup.getAnimations().forEach((a) =>
        a.finished.then(
          () => record.animationFinished.push(performance.now()),
          () => {},
        ),
      );
      const observer = new MutationObserver(() => {
        if (!document.querySelector(".choice-popover")) {
          record.removed = performance.now();
          observer.disconnect();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });
    const start = performance.now();
    await page.keyboard.press("Escape");
    const actionMs = performance.now() - start;
    await expect(page.locator(".choice-popover:visible")).toHaveCount(0);
    const observed = await page.evaluate(() => ({
      ...(window as any).__closeObserved,
      expectObserved: performance.now(),
    }));
    rows.push({
      condition,
      actionMs,
      totalHostMs: performance.now() - start,
      ...observed,
      removalAfterStartMs: observed.removed - observed.start,
      assertionAfterRemovalMs: observed.expectObserved - observed.removed,
    });
  }
} finally {
  await browser.close();
  const report = {
    began,
    ended: new Date().toISOString(),
    origin: "http://127.0.0.1:4298/",
    viewport: { width: 1280, height: 900 },
    reducedMotion: "no-preference",
    rows,
    limit:
      "Observational early versus native-animation-settled close, no animation suppression; does not establish a Linux or whole-suite improvement.",
  };
  await Bun.write(
    `${import.meta.dir}/close-observer.json`,
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
}
