import { test, expect } from "./fixtures";
import { readdir } from "node:fs/promises";
import fixtures from "../tests/fixtures/temporal.json";
test("independent exact fixture expectations run in the production browser worker", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator('main[data-offline-ready="true"]')).toBeVisible();
  const asset = (await readdir("dist/assets")).find((name) =>
    /^worker-.*\.js$/.test(name),
  )!;
  const outputs = await page.evaluate(
    async ({ asset, fixtures }) => {
      const worker = new Worker(`/assets/${asset}`, { type: "module" }),
        outputs: any[] = [];
      try {
        for (let i = 0; i < fixtures.length; i++) {
          const f = fixtures[i];
          const response = await new Promise<any>((resolve, reject) => {
            worker.onmessage = (e) => resolve(e.data);
            worker.onerror = reject;
            worker.postMessage({
              id: i,
              text: f.text,
              options: {
                now: "2026-04-06T12:00:00Z",
                sourceZone: "UTC",
                targetZone: "Australia/Sydney",
                locale: "en-AU",
                hourCycle: "24",
                dateOrder: "mdy",
                ...f,
              },
            });
          });
          outputs.push(response);
        }
        return outputs;
      } finally {
        worker.terminate();
      }
    },
    { asset, fixtures },
  );
  for (let i = 0; i < fixtures.length; i++) {
    const f = fixtures[i],
      output = outputs[i];
    expect(output.error, f.name).toBeUndefined();
    expect(
      output.conversion.results.flatMap((r: any) =>
        r.instant ? [r.instant] : [],
      ),
      f.name,
    ).toEqual(f.instants);
    expect(
      output.conversion.results.flatMap((r: any) =>
        r.dateOnly ? [r.dateOnly] : [],
      ),
      f.name,
    ).toEqual(("dates" in f ? f.dates : []) || []);
    if ("endpoints" in f)
      expect(
        output.conversion.results.map((r: any) => r.endpoint),
        f.name,
      ).toEqual(f.endpoints);
    if ("warning" in f)
      expect(output.conversion.warnings.join("\n"), f.name).toContain(
        f.warning!,
      );
    else expect(output.conversion.warnings, f.name).toEqual([]);
  }
});
