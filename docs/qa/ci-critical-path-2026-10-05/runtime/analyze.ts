import { readFile, writeFile } from "node:fs/promises";

const began = new Date().toISOString();
const root = "docs/qa/ci-critical-path-2026-10-05/runtime";
const readJson = async (path: string) => JSON.parse(await readFile(path, "utf8"));
const pair = await readJson("docs/qa/ci-next-2026-10-05/delivery/pipeline/pair-metrics.json");
const jobs = await readJson("docs/qa/ci-next-2026-10-05/delivery/pipeline/final-jobs.json");
const rendering = await readJson("docs/qa/ci-next-2026-10-05/render-probe-summary.json");
const linux = await readJson("docs/qa/ci-efficiency-2026-10-05/control-linux-summary.json");
const sources = [
  "web/src/App.tsx", "web/src/components/Choices.tsx", "web/src/components/DateChoice.tsx",
  "web/src/engine/worker.ts", "web/src/engine/convert.ts", "web/src/engine/parser.ts",
  "web/src/engine/time.ts", "web/src/engine/zones.ts", "web/src/style.css",
  "node_modules/react-aria-components/dist/private/ComboBox.js",
  "node_modules/react-aria-components/dist/private/ListBox.js",
  "node_modules/react-aria-components/dist/private/Popover.js",
  "node_modules/react-aria/dist/private/collections/useCachedChildren.js",
];
const hashes: Record<string, string> = {};
for (const path of sources) hashes[path] = new Bun.CryptoHasher("sha256").update(await readFile(path)).digest("hex");
const seconds = (start: string, end: string) => (Date.parse(end) - Date.parse(start)) / 1000;
const web = jobs.jobs[0];
const stepDurations = web.steps.filter((step: any) => step.conclusion === "success")
  .map((step: any) => ({ name: step.name, seconds: seconds(step.started_at, step.completed_at) }));
const pageSeconds = pair.ordinary.pages.seconds;
const targetWebRawStrictBelow = pair.baseline.seconds - pageSeconds;
const result = {
  began, ended: new Date().toISOString(),
  head: "2abac48a103064b9f967c8f8595a6fce9cab30f3",
  webTree: "e8a7963096c8dcb09de5a259a966cf1b7aa595d9",
  scope: "Read-only source and retained JSON analysis. No product imports, browser, tests, build, network, Actions, or protected-file reads.",
  sourceHashes: hashes,
  ordinaryPair: {
    webSeconds: seconds(web.started_at, web.completed_at), pagesSeconds: pageSeconds,
    totalSeconds: pair.ordinary.seconds, roundedMinutes: pair.ordinary.roundedMinutes,
    baselineSeconds: pair.baseline.seconds, baselineRoundedMinutes: pair.baseline.roundedMinutes,
    targetTotalRoundedMinutesAtMost: Math.floor(pair.baseline.roundedMinutes * 0.8),
    targetWebRawStrictBelow, minimumWholeSecondWebSaving: pair.ordinary.web.seconds - (targetWebRawStrictBelow - 1),
    targetBrowserStepAtMostSecondsHoldingOtherWebTimeFixed: 299 - (pair.ordinary.web.seconds - (targetWebRawStrictBelow - 1)),
    stepDurations,
  },
  retainedLocalNativeConversionRemainder: rendering.groups.map((group: any) => ({
    engine: group.engine,
    baselinePendingToSettledMeanMs: group.variants.baseline.meanPendingToSettledMs,
    nativeDebounceMs: 250,
    remainderMeanMs: group.variants.baseline.meanPendingToSettledMs - 250,
    limitation: "Includes worker initialization, conversion, main-thread/result commit, scheduling and instrumentation. Not isolated worker cost or Linux forecast.",
  })),
  olderInstrumentedLinuxControl: {
    attempts: linux.count, durationMs: linux.duration, workers: linux.workers,
    aggregateTestMs: linux.totalTestMs,
    operations: Object.fromEntries(Object.entries(linux.operations).filter(([name]) => ["pw:api/navigate", "pw:api/page-create", "pw:api/fill", "expect/expect"].includes(name))),
    limitation: "258-case older instrumented control, not current ordinary 273-case gate. Aggregates overlap scheduling and include protocol/browser work, not CPU attribution.",
  },
};
await writeFile(`${root}/evidence.json`, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ began, ended: result.ended, minimumWholeSecondWebSaving: result.ordinaryPair.minimumWholeSecondWebSaving, currentBrowserStepSeconds: 299, targetBrowserStepAtMostSeconds: result.ordinaryPair.targetBrowserStepAtMostSecondsHoldingOtherWebTimeFixed, nativeRemainders: result.retainedLocalNativeConversionRemainder }, null, 2));
