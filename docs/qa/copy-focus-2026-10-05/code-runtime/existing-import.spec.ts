// Registers the unchanged existing import tests; CLI grep selects its original
// unresolved-target case. Its WebKit fixture owns an independent dynamic origin.
import "../../../../e2e/imports.spec";
import { test } from "../../../../e2e/fixtures";
import { writeFile } from "node:fs/promises";

test.afterEach(async ({ page }, info) => {
  const environment = await page.evaluate(() => ({
    origin: location.origin,
    userAgent: navigator.userAgent,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
  }));
  const release = await page.request.get(
    new URL("/release.json", page.url()).href,
  );
  const path = info.outputPath("existing-case-environment.json");
  await writeFile(
    path,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        retry: info.retry,
        status: info.status,
        environment,
        release: await release.json(),
      },
      null,
      2,
    ),
  );
  await info.attach("existing-case-environment", {
    path,
    contentType: "application/json",
  });
});
