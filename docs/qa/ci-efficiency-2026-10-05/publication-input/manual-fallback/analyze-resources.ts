const folder = import.meta.dir;
const log = await Bun.file(`${folder}/run.log`).text();
const records = log.split("\n").flatMap((line) => {
  const start = line.indexOf("[ci-environment] {");
  if (start < 0) return [];
  return [JSON.parse(line.slice(start + "[ci-environment] ".length))];
});
const before = records.find((value) => value.phase === "before");
const after = records.find((value) => value.phase === "after");
if (records.length !== 2 || !before || !after)
  throw new Error("Expected exactly one before and after environment record");
function fields(value: string | null) {
  return Object.fromEntries(
    (value || "")
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [key, number] = line.trim().split(/\s+/);
        return [key, Number(number)];
      }),
  );
}
const statsBefore = fields(before.cgroup["cpu.stat"]);
const statsAfter = fields(after.cgroup["cpu.stat"]);
const memoryEventsBefore = fields(before.cgroup["memory.events"]);
const memoryEventsAfter = fields(after.cgroup["memory.events"]);
const delta = (
  earlier: Record<string, number>,
  later: Record<string, number>,
) =>
  Object.fromEntries(
    Object.keys(later)
      .filter((key) => key in earlier)
      .map((key) => [key, later[key] - earlier[key]]),
  );
const output = {
  measuredAt: new Date().toISOString(),
  records,
  observedIntervalSeconds:
    (Date.parse(after.at) - Date.parse(before.at)) / 1000,
  observedCgroupMeanCpuCores:
    Number.isFinite(statsAfter.usage_usec) &&
    Number.isFinite(statsBefore.usage_usec)
      ? (statsAfter.usage_usec - statsBefore.usage_usec) /
        ((Date.parse(after.at) - Date.parse(before.at)) * 1000)
      : null,
  cpuStatDelta: delta(statsBefore, statsAfter),
  memoryEventsDelta: delta(memoryEventsBefore, memoryEventsAfter),
  unavailableFields: records.flatMap((record) =>
    Object.entries(record.cgroup)
      .filter(([, value]) => value === null)
      .map(([name]) => ({ phase: record.phase, name })),
  ),
  qualifications: [
    "memory.peak is the recorded cgroup lifetime peak, including descendants and earlier setup; not an isolated browser or test peak.",
    "cpu.stat delta covers activity in the observed cgroup interval; membership/ancestor quota mapping was not independently captured.",
    "os.totalmem describes visible system memory and is distinct from memory.max; availableParallelism/logical CPU count are distinct from cpu.max bandwidth.",
    "cpu.max=max does not establish unlimited host resources or absence of contention/ancestor caps. Missing files are unavailable, not zero.",
    "No direct per-browser CPU, process RSS, affinity mask or test-step duration measurement is supplied by these two snapshots.",
  ],
};
await Bun.write(
  `${folder}/resources.json`,
  JSON.stringify(output, null, 2) + "\n",
);
console.log(JSON.stringify(output, null, 2));
