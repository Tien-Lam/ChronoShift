// Offline analysis only: no browser, workflow dispatch, build or network calls.
const began = new Date().toISOString();
const source = "docs/qa/ci-next-2026-10-05/delivery/pipeline";
const log = await Bun.file(`${source}/final-run.log`).text();
const attempts = log.split(/\r?\n/).flatMap((line) => {
  if (!line.includes("\tRun bun run test:browser\t")) return [];
  const match = line.match(/([✓-])\s+(\d+)\s+\[([^\]]+)\] › (e2e\/[^ ]+) › (.*?)(?: \((\d+(?:\.\d+)?)(m?s)\))?\s*$/);
  if (!match) return [];
  if (match[1] === "✓" && match[6] === undefined) throw new Error("Missing pass duration");
  return [{ symbol: match[1], ordinal: Number(match[2]), project: match[3], location: match[4], title: match[5], seconds: match[6] === undefined ? null : Number(match[6]) * (match[7] === "ms" ? 0.001 : 1) }];
});
if (attempts.length !== 273 || new Set(attempts.map((r) => r.ordinal)).size !== 273) throw new Error("Inventory mismatch");
const passes = attempts.filter((r) => r.symbol === "✓");
if (passes.length !== 264) throw new Error("Pass count mismatch");
const families: Record<string, number> = {}, projects: Record<string, number> = {};
let sumCaseSeconds = 0;
for (const row of passes) {
  const seconds = row.seconds!;
  sumCaseSeconds += seconds;
  const family = row.location.split("/")[1].split(".spec")[0];
  families[family] = (families[family] || 0) + seconds;
  projects[row.project] = (projects[row.project] || 0) + seconds;
}
const seconds = (start: string, end: string) => (Date.parse(end) - Date.parse(start)) / 1000;
const jobs = await Bun.file(`${source}/final-jobs.json`).json();
const web = jobs.jobs.find((j: { name: string }) => j.name === "web");
const pagesJobs = await Bun.file(`${source}/pages-jobs.json`).json();
const pages = pagesJobs.jobs.find((j: { name: string }) => j.name === "prepare");
const webSeconds = seconds(web.started_at, web.completed_at);
const pagesSeconds = seconds(pages.started_at, pages.completed_at);
const browserStep = web.steps.find((s: { name: string }) => s.name === "Run bun run test:browser");
const browserSeconds = seconds(browserStep.started_at, browserStep.completed_at);
const overhead = webSeconds - browserSeconds;
const report = {
  began, ended: new Date().toISOString(), source,
  attempts: attempts.length, passes: passes.length, skips: attempts.filter((r) => r.symbol === "-"),
  webSeconds, pagesSeconds, browserSeconds, webOutsideBrowserSeconds: overhead,
  pairSeconds: webSeconds + pagesSeconds,
  pairRoundedMinutes: Math.ceil(webSeconds / 60) + Math.ceil(pagesSeconds / 60),
  webSteps: web.steps.map((s: { name: string; conclusion: string; started_at: string; completed_at: string }) => ({ name: s.name, conclusion: s.conclusion, seconds: seconds(s.started_at, s.completed_at) })),
  pagesSteps: pages.steps.map((s: { name: string; conclusion: string; started_at: string; completed_at: string }) => ({ name: s.name, conclusion: s.conclusion, seconds: seconds(s.started_at, s.completed_at) })),
  sumCaseSeconds, idealFourSlotSeconds: sumCaseSeconds / 4,
  hypotheticalFixedDurationSchedulingGap: browserSeconds - sumCaseSeconds / 4,
  families: Object.entries(families).sort((a, b) => b[1] - a[1]), projects,
  themedSweep: passes.filter((r) => r.title.includes("themed choices align")),
  thresholds: { quotaWebAtMost: 300, quotaBrowserAtMost: 300 - overhead, rawWebStrictlyBelow: 307 - pagesSeconds, rawBrowserStrictlyBelow: 307 - pagesSeconds - overhead },
  models: [0, 6, 20, 33, 39, 59].map((setupSaving) => ({ setupSaving, browserSavingStrictlyGreaterForRaw: webSeconds + pagesSeconds - 307 - setupSaving, browserSavingAtLeastForQuota: Math.max(0, webSeconds - 300 - setupSaving) })),
  limits: ["Rounded pass durations overlap and include waits; they are not CPU time.", "Fixed-duration ideal scheduling arithmetic is not a measured saving or a causal bound across altered schedules.", "Timing reporter was disabled in this final run; earlier 258-case timing records must not be attributed to this 273-case run.", "No source or browser execution is performed by this helper."]
};
await Bun.write("docs/qa/ci-critical-path-2026-10-05/pipeline/analysis.json", JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ began: report.began, ended: report.ended, attempts: report.attempts, passes: report.passes, webSeconds, pagesSeconds, browserSeconds, sumCaseSeconds, models: report.models }, null, 2));
