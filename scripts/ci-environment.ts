import { availableParallelism, cpus, release, totalmem } from "node:os";

// Fixed machine metadata only: never dump environment variables or app data.
const phase = Bun.argv[2];
if (phase !== "before" && phase !== "after")
  throw new Error("Expected before or after browser phase");
const files = [
  "cpu.max",
  "cpu.stat",
  "memory.max",
  "memory.peak",
  "memory.events",
];
const cgroup = Object.fromEntries(
  await Promise.all(
    files.map(async (name) => [
      name,
      await Bun.file(`/sys/fs/cgroup/${name}`)
        .text()
        .then((value) => value.trim())
        .catch(() => null),
    ]),
  ),
);
console.log(
  "[ci-environment]",
  JSON.stringify({
    at: new Date().toISOString(),
    phase,
    platform: process.platform,
    architecture: process.arch,
    osRelease: release(),
    availableParallelism: availableParallelism(),
    logicalCpus: cpus().length,
    cpuModel: cpus()[0]?.model ?? null,
    totalMemoryBytes: totalmem(),
    cgroup,
  }),
);
