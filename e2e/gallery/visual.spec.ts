import { test, expect, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { platform, arch, release } from "node:os";

const candidates = process.env.GALLERY_CAPTURE_CANDIDATES === "1";
const baselineRoot = "e2e/gallery/goldens";
const candidateRoot = ".work/TIE-390/visual-candidates";
async function capture(page: Page, name: string) {
  await page.evaluate(() => document.fonts.ready);
  const bytes = await page.screenshot({
    fullPage: true,
    animations: "disabled",
  });
  if (candidates) {
    await mkdir(candidateRoot, { recursive: true });
    await writeFile(`${candidateRoot}/${name}.png`, bytes);
  } else expect(bytes).toMatchSnapshot(`${name}.png`, { maxDiffPixels: 0 });
}

test.beforeEach(async ({ browser }, info) => {
  if (info.config.updateSnapshots !== "none")
    throw new Error(
      "Automatic golden updates are forbidden. Capture ignored candidates and review them explicitly.",
    );
  const environment = {
    schema: 1,
    playwright: JSON.parse(
      await readFile("node_modules/@playwright/test/package.json", "utf8"),
    ).version,
    browser: browser.version(),
    os: platform(),
    osRelease: release(),
    architecture: arch(),
    dpr: 1,
    locale: "en-AU",
    timezone: "Australia/Sydney",
    motion: "reduce",
    colorScheme: "dark",
    fontSha256: createHash("sha256")
      .update(await readFile("web/src/assets/geist-latin-variable.woff2"))
      .digest("hex"),
    viewports: [280, 390, 960],
    height: 900,
  };
  if (candidates) {
    await mkdir(candidateRoot, { recursive: true });
    await writeFile(
      `${candidateRoot}/environment.json`,
      JSON.stringify(environment, null, 2) + "\n",
    );
  } else {
    let approved;
    try {
      approved = JSON.parse(
        await readFile(`${baselineRoot}/environment.json`, "utf8"),
      );
    } catch {
      throw new Error(
        "No reviewed visual baseline. Capture candidates; a reviewer must inspect and approve PNGs and environment.json before this gate can pass.",
      );
    }
    expect(
      environment,
      "Baseline environment differs; use its pinned environment or review a new set of candidates.",
    ).toEqual(approved);
  }
});

for (const width of [280, 390, 960])
  for (const theme of ["light", "dark"]) {
    test(`visual shared controls ${width} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/__gallery/?theme=${theme}`);
      await expect(page.getByTestId("paste")).toBeVisible();
      await capture(page, `controls-${width}-${theme}-rest`);
      if (width === 390) {
        const paste = page.getByTestId("paste");
        await paste.hover();
        await capture(page, `controls-${width}-${theme}-hover`);
        await page.keyboard.press("Tab");
        await expect(paste).toHaveAttribute("data-focus-visible", "true");
        await capture(page, `controls-${width}-${theme}-focus`);
        await paste.hover();
        await page.mouse.down();
        await capture(page, `controls-${width}-${theme}-press`);
        await page.mouse.up();
        await page
          .getByRole("button", { name: "Choose reference date" })
          .click();
        await expect(page.getByRole("dialog")).toBeVisible();
        await capture(page, `controls-${width}-${theme}-calendar`);
        await page.keyboard.press("Escape");
        await page.locator("#gallery-format").click();
        await expect(page.getByRole("listbox")).toBeVisible();
        await capture(page, `controls-${width}-${theme}-menu`);
      }
    });
    test(`visual real workspace ${width} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(
        ({ theme }) =>
          localStorage.setItem(
            "chronoshift.preferences.v1",
            JSON.stringify({ target: "UTC", hourCycle: "24", theme }),
          ),
        { theme },
      );
      await page.goto("/__gallery/?view=workspace");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await capture(page, `workspace-${width}-${theme}-empty`);
      await page
        .getByLabel("Message with a date or time")
        .fill("April 9, 2026 9am-11am UTC");
      await expect(page.locator(".hero-time")).toHaveText(["09:00", "11:00"]);
      await capture(page, `workspace-${width}-${theme}-range`);
      await page
        .getByLabel("Message with a date or time")
        .fill("2026-04-09T23:59:59.123+00:00");
      await expect(page.locator(".hero-time")).toHaveText("23:59:59.123");
      await capture(page, `workspace-${width}-${theme}-precision`);
    });
  }
