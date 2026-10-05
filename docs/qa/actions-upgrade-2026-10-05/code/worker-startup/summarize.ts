import { join } from "node:path";
const directory = "/Users/tien/Developer/ChronoShift/docs/qa/actions-upgrade-2026-10-05/code/worker-startup";
const file = Bun.file(join(directory, "raw.json"));
const raw = await file.json();
if (raw.engines.length !== 3 || raw.error) throw new Error("incomplete measurement");
const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
const median = (values: number[]) => { const sorted = values.toSorted((a, b) => a - b); return (sorted[(sorted.length - 1) >> 1] + sorted[sorted.length >> 1]) / 2; };
const distribution = (values: number[]) => ({ count: values.length, meanMs: mean(values), medianMs: median(values), minMs: Math.min(...values), maxMs: Math.max(...values) });
const engines = raw.engines.map((engine: any) => {
  const samples = engine.measurements.samples;
  if (samples.length !== 24 || samples.some((sample: any) => !sample.exactPassed || !Number.isFinite(sample.elapsedMs) || sample.elapsedMs < 0)) throw new Error("invalid samples");
  const fresh = samples.filter((sample: any) => sample.kind === "fresh");
  const idle = samples.filter((sample: any) => sample.kind === "idle");
  if (fresh.length !== 12 || idle.length !== 12) throw new Error("unmatched sample count");
  const pairs = fresh.map((sample: any) => {
    const warm = idle.find((other: any) => other.index === sample.index && other.fixture === sample.fixture);
    if (!warm) throw new Error("unmatched fixture");
    return { index: sample.index, fixture: sample.fixture, freshMs: sample.elapsedMs, idleMs: warm.elapsedMs, differenceMs: sample.elapsedMs - warm.elapsedMs };
  });
  return { engine: engine.engine, browserVersion: engine.browserVersion, began: engine.began, ended: engine.ended, environment: engine.environment, bootstrapMs: engine.measurements.bootstrap.elapsedMs, idlePrimeMs: engine.measurements.prime.elapsedMs, fresh: distribution(fresh.map((sample: any) => sample.elapsedMs)), idle: distribution(idle.map((sample: any) => sample.elapsedMs)), pairedDifference: distribution(pairs.map((pair: any) => pair.differenceMs)), reductionPercent: 100 * (1 - mean(idle.map((sample: any) => sample.elapsedMs)) / mean(fresh.map((sample: any) => sample.elapsedMs))), pairs };
});
const summary = { capturedAt: new Date().toISOString(), inputSha256: new Bun.CryptoHasher("sha256").update(await file.arrayBuffer()).digest("hex"), began: raw.began, ended: raw.ended, identity: raw.identity, origin: raw.origin, environment: raw.environment, engines, verdict: "A local fresh-worker versus completed-idle-worker effect is measured; attribution combines startup/network/module/JIT/cache effects. No App implementation, active cancellation, UI latency or CI saving is proved." };
await Bun.write(join(directory, "summary.json"), JSON.stringify(summary, null, 2) + "\n");
console.log(JSON.stringify({ capturedAt: summary.capturedAt, origin: summary.origin, environment: summary.environment, engines: engines.map(({ pairs, ...engine }: any) => engine) }, null, 2));
