import { test, expect } from "./fixtures";

const cases = [
  {
    name: "single time",
    text: "April 9, 2026 3pm UTC",
    times: ["15:00"],
    labels: [],
    sources: ["UTC"],
  },
  {
    name: "ordinary range",
    text: "April 9, 2026 9am-11am UTC",
    times: ["09:00", "11:00"],
    labels: ["From", "To"],
    sources: ["UTC", "UTC"],
  },
  {
    name: "overnight range",
    text: "April 9, 2026 11pm-1am UTC",
    times: ["23:00", "01:00"],
    labels: ["From", "To"],
    sources: ["UTC", "UTC"],
    dates: ["Thu, 9 Apr 2026", "Fri, 10 Apr 2026"],
  },
  {
    name: "different endpoint zones in source order",
    text: "April 9, 2026 3pm UTC to 5pm JST",
    times: ["15:00", "08:00"],
    labels: ["From", "To"],
    sources: ["UTC", "JST"],
  },
  {
    name: "ambiguous range keeps alternatives within each endpoint",
    text: "April 9, 2026 9am-11am CST",
    times: ["15:00", "01:00", "17:00", "03:00"],
    labels: ["From", "From", "To", "To"],
    sources: [
      "US Central Standard",
      "China Standard",
      "US Central Standard",
      "China Standard",
    ],
    alternatives: 2,
  },
  {
    name: "ambiguous abbreviation",
    text: "April 9, 2026 3pm CST",
    times: ["21:00", "07:00"],
    labels: [],
    sources: ["US Central Standard", "China Standard"],
    alternatives: 1,
  },
  {
    name: "clocks-back alternatives",
    text: "April 5, 2026 2:30am Australia/Sydney",
    times: ["15:30", "16:30"],
    labels: [],
    sources: [
      "First occurrence (clocks move back)",
      "Second occurrence (clocks move back)",
    ],
    alternatives: 1,
  },
  {
    name: "date only",
    text: "April 9, 2026",
    times: [],
    labels: [],
    sources: ["Date only"],
  },
  {
    name: "numeric timestamp",
    text: "Epoch 1775736000",
    times: ["12:00"],
    labels: [],
    sources: ["UTC"],
  },
  {
    name: "millisecond precision",
    text: "2026-04-09T15:00:30.123+02:00",
    times: ["13:00:30.123"],
    labels: [],
    sources: ["UTC+02:00"],
  },
];

for (const sample of cases) {
  test(`result labels, copy and accessible names: ${sample.name}`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "chronoshift.preferences.v1",
        JSON.stringify({ target: "UTC", hourCycle: "24" }),
      );
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: async (value: string) => {
            (window as any).__copied = value;
          },
        },
      });
    });
    await page.goto("/");
    await page.getByLabel("Message with a date or time").fill(sample.text);
    const results = page.locator(".result");
    await expect(results).toHaveCount(sample.sources.length);
    await expect(page.locator(".hero-time")).toHaveText(sample.times);
    await expect(page.locator(".range-label")).toHaveText(sample.labels);
    await expect(page.locator(".source-label")).toHaveText(sample.sources);
    await expect(page.locator(".ambiguity")).toHaveCount(
      sample.alternatives || 0,
    );
    if (sample.dates)
      await expect(page.locator(".result-date")).toHaveText(sample.dates);
    const names: string[] = [];
    for (let i = 0; i < sample.sources.length; i++) {
      const card = results.nth(i);
      const button = card.getByRole("button");
      const name = (await button.getAttribute("aria-label"))!;
      names.push(name);
      expect(name).toContain(await card.locator(".result-date").innerText());
      expect(name).toContain(sample.sources[i]);
      if (sample.times[i]) expect(name).toContain(sample.times[i]);
      await button.click();
      const copied = await page.evaluate(() => (window as any).__copied);
      expect(copied).toContain(sample.sources[i]);
      expect(copied).not.toMatch(/\((?:start|end)\)|Unix seconds/);
      expect(name).not.toMatch(/\b(?:start|end)\b|Unix seconds/);
      const prefix = sample.labels[i] ? `${sample.labels[i]}: ` : "";
      expect(copied.split("\n")[0]).toBe(
        `${prefix}${sample.times[i] ? sample.times[i] + " · " : ""}${await card.locator(".result-date").innerText()} · ${sample.times.length ? "UTC" : "Date only"}`,
      );
    }
    expect(new Set(names).size).toBe(names.length);
    expect(
      (await page.locator(".result-context").allTextContents()).join("\n"),
    ).not.toMatch(/(?:start|end) ·|Unix seconds/);
  });
}

test("range associations and long precision remain readable at 320px in both themes", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 844 });
  for (const theme of ["dark", "light"]) {
    for (const hourCycle of ["12", "24"]) {
      await page.addInitScript(
        ({ theme, hourCycle }) => {
          localStorage.setItem(
            "chronoshift.preferences.v1",
            JSON.stringify({ target: "UTC", hourCycle, theme }),
          );
        },
        { theme, hourCycle },
      );
      await page.goto("/");
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page
        .getByLabel("Message with a date or time")
        .fill("April 9, 2026 23:59:59 UTC to 23:59:58 UTC");
      await expect(page.locator(".range-label")).toHaveText(["From", "To"]);
      await expect(page.locator(".hero-time")).toHaveText(
        hourCycle === "12"
          ? ["11:59:59 pm", "11:59:58 pm"]
          : ["23:59:59", "23:59:58"],
      );
      await expect(page.locator(".result-date")).toHaveText([
        "Thu, 9 Apr 2026",
        "Fri, 10 Apr 2026",
      ]);
      for (const card of await page.locator(".result").all()) {
        const button = card.getByRole("button");
        expect(await button.getAttribute("aria-label")).toContain(
          await card.locator(".range-label").innerText(),
        );
      }
      await page.screenshot({
        path: info.outputPath(`range-320-${theme}-${hourCycle}.png`),
        fullPage: true,
      });
      await page
        .getByLabel("Message with a date or time")
        .fill("2026-04-09T23:59:59.123+00:00");
      await expect(page.locator(".hero-time")).toHaveText(
        hourCycle === "12" ? "11:59:59.123 pm" : "23:59:59.123",
      );
      const numericLines = await page.locator(".hero-time").evaluate((hero) => {
        const text = hero.firstChild!;
        const numericClock = text.textContent!.split(" ")[0];
        const tops = [...numericClock].map((_, i) => {
          const range = document.createRange();
          range.setStart(text, i);
          range.setEnd(text, i + 1);
          return range.getBoundingClientRect().top;
        });
        return {
          tops,
          lineHeight: Number.parseFloat(getComputedStyle(hero).lineHeight),
        };
      });
      await info.attach(`numeric-lines-${theme}-${hourCycle}`, {
        body: JSON.stringify(numericLines),
        contentType: "application/json",
      });
      // WebKit can return slightly different selection tops for glyph runs on
      // the same baseline. A wrapped digit shifts by a full line height.
      expect(
        Math.max(...numericLines.tops) - Math.min(...numericLines.tops),
      ).toBeLessThan(numericLines.lineHeight / 2);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth,
        ),
      ).toBe(false);
      await page.screenshot({
        path: info.outputPath(`precision-320-${theme}-${hourCycle}.png`),
        fullPage: true,
      });
    }
  }
});
