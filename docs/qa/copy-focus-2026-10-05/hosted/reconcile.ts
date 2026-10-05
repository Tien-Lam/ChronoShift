import { readdir } from "node:fs/promises";
import { join } from "node:path";
const folder = import.meta.dir;
const audit = await Bun.file(
  new URL(
    "../../actions-upgrade-2026-10-05/root/publication-reuse-audit.json",
    import.meta.url,
  ),
).json();
const report = await Bun.file(join(folder, "report.json")).json();
const expectedAssets = new Map(
  audit.publicFiles.map((file: any) => [
    "/ChronoShift/" + file.path,
    file.sha256,
  ]),
);
async function scan(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? scan(join(dir, entry.name))
          : Promise.resolve(
              entry.name === "copy-focus-observation.json"
                ? [join(dir, entry.name)]
                : [],
            ),
      ),
    )
  ).flat();
}
function cases(suites: any[]): any[] {
  return suites.flatMap((suite) => [
    ...(suite.specs || []).flatMap((spec: any) =>
      spec.tests.map((test: any) => ({
        title: spec.title,
        project: test.projectName,
        attempts: test.results.map((r: any) => ({
          status: r.status,
          retry: r.retry,
          startTime: r.startTime,
          duration: r.duration,
        })),
      })),
    ),
    ...cases(suite.suites || []),
  ]);
}
const attempts = cases(report.suites);
const observations = await Promise.all(
  (await scan(join(folder, "results"))).map(async (path) => {
    const data = await Bun.file(path).json();
    return {
      path,
      began: data.began,
      ended: data.ended,
      origin: data.browserEnvironment.url,
      motionReduced: data.probe.motion,
      assets: data.assets.map((asset: any) => ({
        ...asset,
        expected: expectedAssets.get(asset.path),
        matched: asset.sha256 === expectedAssets.get(asset.path),
      })),
    };
  }),
);
const checks = {
  sixCases: attempts.length === 6,
  allFirstPasses: attempts.every(
    (c) =>
      c.attempts.length === 1 &&
      c.attempts[0].status === "passed" &&
      c.attempts[0].retry === 0,
  ),
  sixObservations: observations.length === 6,
  normalMotion: observations.every((o) => o.motionReduced === false),
  exactPublicAssets: observations.every(
    (o) => o.assets.length >= 2 && o.assets.every((a: any) => a.matched),
  ),
};
const result = {
  at: new Date().toISOString(),
  checks,
  attempts,
  observations,
  stats: report.stats,
  reportSha256: new Bun.CryptoHasher("sha256")
    .update(
      new Uint8Array(await Bun.file(join(folder, "report.json")).arrayBuffer()),
    )
    .digest("hex"),
  limits: [
    "controlled clipboard/native-frame schedule, not the original untraced fill sequence",
    "desktop browser engines, not physical-device acceptance",
  ],
};
await Bun.write(
  join(folder, "reconciliation.json"),
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify({ checks, stats: report.stats }, null, 2));
if (!Object.values(checks).every(Boolean)) process.exitCode = 1;
