// Offline processing only: existing complete logs and API captures; no runtime probe.
const folder = import.meta.dir;
const log = (await Bun.file(`${folder}/run.log`).text()).replace(/\x1b\[[0-9;]*m/g, "");
const start = log.indexOf("Running 258 tests using 4 workers");
const end = log.indexOf("249 passed", start);
if (start < 0 || end < 0) throw new Error("Complete inventory boundaries missing");
const rows = log.slice(start, end).split("\n").flatMap((line) => {
  const m = line.match(/\s([✓×-])\s+(\d+)\s+\[([^\]]+)\]\s+›\s+(.+?):(\d+):(\d+)\s+›\s+(.+?)(?:\s+\((\d+(?:\.\d+)?)(ms|s|m)\))?\s*$/);
  if (!m) return [];
  const multiplier = m[9] === "ms" ? 0.001 : m[9] === "m" ? 60 : 1;
  if (m[1] === "✓" && !m[8]) throw new Error("Passing case lacks duration");
  return [{ symbol: m[1], ordinal: Number(m[2]), project: m[3], file: m[4], title: m[7], roundedListSeconds: m[8] ? Number(m[8]) * multiplier : 0 }];
});
if (rows.length !== 258 || rows.filter((row) => row.symbol === "✓").length !== 249) throw new Error("Inventory mismatch");
function totals(key: "file" | "project" | "title") {
  const result: Record<string, { passed: number; skipped: number; sumRoundedListSeconds: number }> = {};
  for (const row of rows) {
    const item = result[row[key]] ??= { passed: 0, skipped: 0, sumRoundedListSeconds: 0 };
    item[row.symbol === "✓" ? "passed" : "skipped"]++;
    if (row.symbol === "✓") item.sumRoundedListSeconds += row.roundedListSeconds;
  }
  return Object.entries(result).map(([name, value]) => ({ name, ...value })).sort((a, b) => b.sumRoundedListSeconds - a.sumRoundedListSeconds);
}
const summary = await Bun.file(`${folder}/summary.json`).json();
const cpu = summary.resourceCounterDeltas.cpu.usage_usec / 1e6;
const before = summary.resourceRecords.find((row: any) => row.phase === "before");
const after = summary.resourceRecords.find((row: any) => row.phase === "after");
const resourceSeconds = (Date.parse(after.at) - Date.parse(before.at)) / 1000;
const output = {
  observedAt: new Date().toISOString(), sourceRun: 37281970385, head: summary.run.head,
  rows: rows.length, passes: rows.filter((row) => row.symbol === "✓").length,
  roundedPassingCaseSeconds: rows.filter((row) => row.symbol === "✓").reduce((sum, row) => sum + row.roundedListSeconds, 0),
  byFile: totals("file"), byProject: totals("project"), byTitle: totals("title"),
  longestCases: rows.filter((row) => row.symbol === "✓").sort((a, b) => b.roundedListSeconds - a.roundedListSeconds).slice(0, 15),
  resource: { cpuProcessorSeconds: cpu, resourceBracketSeconds: resourceSeconds, averageCpuProcessorSecondsPerWallSecond: cpu / resourceSeconds },
  limits: ["List durations are rounded case elapsed times; their sum is concurrent worker time, not additive exclusive wall time or CPU attribution.", "Case duration rankings do not identify avoidable overhead or prove causes.", "Cgroup CPU includes browser/protocol/server processes; it does not identify script, layout, polling or individual test costs.", "Offline aggregation of already saved evidence; no browser/CI benchmark or source change."]
};
await Bun.write(`${folder}/opportunity-data.json`, JSON.stringify(output, null, 2));
console.log(JSON.stringify({ ...output, byTitle: output.byTitle.slice(0, 10), longestCases: output.longestCases.slice(0, 6) }, null, 2));
