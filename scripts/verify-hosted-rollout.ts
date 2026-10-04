import { chromium, expect } from "@playwright/test";

// Keep one real client open while a maintainer publishes, rolls back and restores.
// Signal each completed deployment with {stage, sourceCommit} in the command file.
const [commandPath, reportPath] = Bun.argv.slice(2);
if (!commandPath || !reportPath)
  throw new Error("Provide command JSON and report JSON paths");
const url = "https://tien-lam.github.io/ChronoShift/";
const browser = await chromium.launch();
const context = await browser.newContext({
  locale: "en-AU",
  timezoneId: "Australia/Sydney",
});
let page = await context.newPage();
const report: {
  started: string;
  initial?: string;
  stages: unknown[];
  finished?: string;
} = { started: new Date().toISOString(), stages: [] };
const save = async () => Bun.write(reportPath, JSON.stringify(report, null, 2));
const cachedCommit = async () =>
  page.evaluate(
    async () =>
      (await (await fetch("release.json")).json()).sourceCommit as string,
  );
const draft = "April 9, 2026 3pm in Tokyo";
try {
  await page.goto(url);
  await expect(page.getByText("Offline ready", { exact: true })).toBeVisible({
    timeout: 30000,
  });
  report.initial = await cachedCommit();
  await save();
  console.log(`Initial client ready: ${report.initial}`);
  for (const stage of ["update", "rollback", "restore"]) {
    await page.getByLabel("Convert to").fill("UTC");
    await page.getByLabel("Message with a date or time").fill(draft);
    const oldCommit = await cachedCommit();
    let command: { stage: string; sourceCommit: string } | undefined;
    while (!command) {
      if (await Bun.file(commandPath).exists()) {
        const value = await Bun.file(commandPath).json();
        if (value.stage === stage && /^[a-f0-9]{40}$/.test(value.sourceCommit))
          command = value;
      }
      if (!command) await Bun.sleep(1000);
    }
    const expected = command.sourceCommit;
    await expect
      .poll(
        async () =>
          (await (await context.request.get(url + "release.json")).json())
            .sourceCommit,
        { timeout: 120000, intervals: [2000] },
      )
      .toBe(expected);
    await page.evaluate(async () => {
      await (await navigator.serviceWorker.getRegistration())!.update();
    });
    await expect(page.getByRole("button", { name: "Update now" })).toBeVisible({
      timeout: 30000,
    });
    expect(await cachedCommit()).toBe(oldCommit);
    await Promise.all([
      page.waitForEvent("domcontentloaded"),
      page.getByRole("button", { name: "Update now" }).click(),
    ]);
    await expect(page.getByLabel("Message with a date or time")).toHaveValue(
      draft,
      { timeout: 30000 },
    );
    await expect(
      page.getByText("Offline ready", { exact: true }),
    ).toBeVisible();
    expect(await cachedCommit()).toBe(expected);
    await page.getByRole("button", { name: "Convert", exact: true }).click();
    await expect(page.locator(".hero-time")).toHaveText(/6:00 am/i);
    await page.close();
    await context.setOffline(true);
    page = await context.newPage();
    await page.goto(url);
    await page
      .getByLabel("Message with a date or time")
      .fill("July 15, 2026 9am in Tokyo");
    await page.getByRole("button", { name: "Convert", exact: true }).click();
    await expect(page.locator(".hero-time")).toHaveText(/12:00 am/i);
    expect(await cachedCommit()).toBe(expected);
    report.stages.push({
      stage,
      from: oldCommit,
      to: expected,
      explicitUpdate: true,
      draftPreserved: true,
      offlineReopenFreshConversion: true,
      checkedAt: new Date().toISOString(),
    });
    await save();
    console.log(`${stage} verified: ${oldCommit} → ${expected}`);
    await page.close();
    await context.setOffline(false);
    page = await context.newPage();
    await page.goto(url);
    await expect(
      page.getByText("Offline ready", { exact: true }),
    ).toBeVisible();
  }
  report.finished = new Date().toISOString();
  await save();
} finally {
  await browser.close();
}
