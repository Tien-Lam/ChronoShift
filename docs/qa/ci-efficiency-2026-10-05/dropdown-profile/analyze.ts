// Reproducible read-only aggregation of bounded local profile records.
export {};
const folder = import.meta.dir;
const p = await Bun.file(`${folder}/profile.json`).json();
const cpu = await Bun.file(`${folder}/cpu-run/profile.json`).json();
const close = await Bun.file(`${folder}/close-observer.json`).json();
const groups = [
  ...new Set(
    p.rows.map(
      (r: { width: number; operation: string }) => `${r.width}/${r.operation}`,
    ),
  ),
].map((key) => {
  const rows = p.rows.filter(
    (r: { width: number; operation: string }) =>
      `${r.width}/${r.operation}` === key,
  );
  const mean = (read: (r: any) => number) =>
    rows.reduce((sum: number, row: any) => sum + read(row), 0) / rows.length;
  return {
    key,
    count: rows.length,
    meanActionMs: mean((r) => r.actionMs),
    meanObservedWallMs: mean((r) => r.elapsedMs),
    meanTaskThreadMs: mean((r) => r.delta.TaskDuration * 1000),
    meanScriptThreadMs: mean((r) => r.delta.ScriptDuration * 1000),
    meanLayoutThreadMs: mean((r) => r.delta.LayoutDuration * 1000),
    meanStyleThreadMs: mean((r) => r.delta.RecalcStyleDuration * 1000),
    optionCounts: [...new Set(rows.map((r: any) => r.dom.options))],
    descendantCounts: [...new Set(rows.map((r: any) => r.dom.descendants))],
  };
});
const sampledFrames = cpu.rows.map((r: any) => {
  const nodes = new Map<number, any>(
    r.cpuProfile.nodes.map((n: any) => [n.id, n]),
  );
  const deltas: number[] = r.cpuProfile.timeDeltas;
  const finiteDeltas = deltas.filter(Number.isFinite);
  const negativeDeltas = finiteDeltas.filter((delta) => delta < 0);
  const weightedDurationsReliable =
    negativeDeltas.length === 0 &&
    finiteDeltas.length === deltas.length &&
    deltas.length === r.cpuProfile.samples.length;
  // Preserve signed raw intervals; never clamp, normalize or rank invalid weights.
  const validation = {
    sampleCount: r.cpuProfile.samples.length,
    deltaCount: deltas.length,
    nonFiniteDeltaCount: deltas.length - finiteDeltas.length,
    negativeDeltaCount: negativeDeltas.length,
    minimumDeltaUs: Math.min(...finiteDeltas),
    negativeSignedSumUs: negativeDeltas.reduce((sum, delta) => sum + delta, 0),
    totalSignedSumUs: finiteDeltas.reduce((sum, delta) => sum + delta, 0),
    weightedDurationsReliable,
    weightedRankingsReliable: weightedDurationsReliable,
  };
  return {
    width: r.width,
    operation: r.operation,
    validation,
    cpuProfileIntervalMs: (r.cpuProfile.endTime - r.cpuProfile.startTime) / 1000,
    nestedActionWallMs: r.elapsedMs,
    scriptThreadMs: r.delta.ScriptDuration * 1000,
    // Unranked addresses retain presence evidence only, not relative cost.
    frameAddressesObserved: [...new Set<number>(r.cpuProfile.samples)].map(
      (id) => ({ nodeId: id, frame: nodes.get(id).callFrame }),
    ),
  };
});
const samplingValidation = {
  profileCount: sampledFrames.length,
  profilesWithNegativeDeltas: sampledFrames.filter(
    (r: any) => r.validation.negativeDeltaCount > 0,
  ).length,
  negativeDeltaCount: sampledFrames.reduce(
    (sum: number, r: any) => sum + r.validation.negativeDeltaCount, 0,
  ),
  minimumDeltaUs: Math.min(...sampledFrames.map((r: any) => r.validation.minimumDeltaUs)),
  negativeSignedSumUs: sampledFrames.reduce(
    (sum: number, r: any) => sum + r.validation.negativeSignedSumUs, 0,
  ),
  weightedDurationsAndRankingsReliable: sampledFrames.every(
    (r: any) => r.validation.weightedDurationsReliable,
  ),
};
const summary = {
  analyzedAt: new Date().toISOString(),
  runtimeSource: JSON.parse(p.assetsBefore.marker.body).sourceCommit,
  runtimeWebTree: "78dbdbf65b5328416f0b169cc52d3ed9541d02f9",
  documentHeads: [p.head, cpu.head],
  identityStableAcrossBothProfiles:
    p.identicalAssetBytes &&
    cpu.identicalAssetBytes &&
    p.assetsBefore.js.sha256 === cpu.assetsBefore.js.sha256,
  environment: p.environment,
  clocks: {
    repeated: [p.began, p.ended],
    cpuSample: [cpu.began, cpu.ended],
    closeObserver: [close.began, close.ended],
  },
  measurements: groups,
  samplingValidation,
  sampledFrames,
  closeObserver: close.rows,
  messages: [...p.messages, ...cpu.messages],
  qualifications: [
    "TaskDuration/ScriptDuration/LayoutDuration/RecalcStyleDuration are CDP threadTicks deltas over an instrumented action/assertion/two-rAF window. They are not an additive partition and are not Linux Actions measurements.",
    "All CPU profiles contain negative timeDeltas. Signed raw intervals are preserved and validated; weighted frame totals/rankings are unreliable and omitted. Unranked sampled frame addresses establish presence only, not attribution or relative cost.",
    "CPU profile start/end and nested action walls are distinct. The CPU-pass counter window includes Profiler.start/protocol instrumentation. Raw before/after numeric counters were not saved: saved deltas can be aggregated, but counter subtraction is source-reviewed only and cannot be independently recomputed from raw counter observations.",
    "Filter readiness checks count <20, which could admit zero. Every actual filtered snapshot has two options; this post-hoc observation does not strengthen the readiness guard into a nonempty assertion.",
    "Raw timeline event durations nest/overlap and are retained for examination, not summed as independent CPU cost. No screenshot or Playwright trace styles were injected.",
    "Cold/first iteration and subsequent warm operations are retained; three repetitions per viewport are descriptive, not a statistically powered benchmark or phone/browser performance acceptance.",
    "Docs-only HEAD changed to094e70c between profiles, while runtime source28059a91/web tree/b5d1df/version/index-DHi9 bytes remained unchanged. This is not a new app release.",
    "First probes had a stale visible-readiness assumption and unsupported threadTime name; original setup failure outputs are retained separately, not classified as application defects.",
  ],
};
await Bun.write(`${folder}/summary.json`, JSON.stringify(summary, null, 2));
console.log(
  JSON.stringify(
    {
      at: summary.analyzedAt,
      identityStable: summary.identityStableAcrossBothProfiles,
      operations: p.rows.length,
      cpuOperations: cpu.rows.length,
      samplingValidation,
      perProfileSamplingValidation: sampledFrames.map((r: any) => ({width: r.width, operation: r.operation, ...r.validation})),
      measurements: groups,
    },
    null,
    2,
  ),
);
// Existing raw profiles, timelines and exact gzip copies are never rewritten.
