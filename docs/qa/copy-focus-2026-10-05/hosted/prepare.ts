// Adapt the exact reviewed local fixture for a public-artifact acceptance run.
// The production app and scheduler assertions remain untouched.
const repo = new URL("../../../../", import.meta.url);
const source = await Bun.file(new URL("e2e/copy-focus.spec.ts", repo)).text();
const expected =
  "6467c3acb6f5da55573678ac9e64b846fd3f8eba1cdb04b4df6ea59c0bfb429e";
const actual = new Bun.CryptoHasher("sha256").update(source).digest("hex");
if (actual !== expected) throw new Error("Reviewed fixture changed");
const adapted =
  source
    .replace('from "./fixtures"', 'from "@playwright/test"')
    .replace('from "./choices"', 'from "../../../../e2e/choices"')
    .replace('await page.goto("/");', 'await page.goto("/ChronoShift/");') +
  `\nconst expectedRelease = process.env.HOSTED_EXPECTED_COMMIT;\nif (!/^[a-f0-9]{40}$/.test(expectedRelease || "")) throw new Error("Supply exact HOSTED_EXPECTED_COMMIT");\ntest.beforeEach(async ({ request }) => {\n  const response = await request.get("/ChronoShift/release.json");\n  expect(response.ok()).toBe(true);\n  expect((await response.json()).sourceCommit).toBe(expectedRelease);\n});\n`;
await Bun.write(new URL("copy-focus.spec.ts", import.meta.url), adapted);
await Bun.write(
  new URL("adaptation.json", import.meta.url),
  JSON.stringify(
    {
      at: new Date().toISOString(),
      originalSha256: actual,
      adaptedSha256: new Bun.CryptoHasher("sha256")
        .update(adapted)
        .digest("hex"),
      changes: [
        "plain Playwright fixtures without local WebKit origin server",
        "unchanged shared zone helper import",
        "Pages repository path navigation",
        "exact expected public release assertion before each case",
      ],
      limits: [
        "controlled clipboard rejection/frame schedule, not original untraced fill sequence",
        "desktop WebKit/Chromium, not a physical phone",
      ],
    },
    null,
    2,
  ),
);
