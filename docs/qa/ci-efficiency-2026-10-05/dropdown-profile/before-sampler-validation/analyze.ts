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
  const weighted = new Map<number, number>();
  r.cpuProfile.samples.forEach((id: number, index: number) =>
    weighted.set(
      id,
      (weighted.get(id) || 0) + (r.cpuProfile.timeDeltas[index] || 0),
    ),
  );
  return {
    width: r.width,
    operation: r.operation,
    sampleCount: r.cpuProfile.samples.length,
    windowWallMs: r.elapsedMs,
    scriptThreadMs: r.delta.ScriptDuration * 1000,
    topSelfSampleWallMs: [...weighted]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)
      .map(([id, microseconds]) => ({
        frame: nodes.get(id).callFrame,
        sampledWallMs: microseconds / 1000,
      })),
  };
});
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
  sampledFrames,
  closeObserver: close.rows,
  messages: [...p.messages, ...cpu.messages],
  qualifications: [
    "TaskDuration/ScriptDuration/LayoutDuration/RecalcStyleDuration are CDP threadTicks deltas over an instrumented action/assertion/two-rAF window. They are not an additive partition and are not Linux Actions measurements.",
    "CPU profile sample timeDeltas are elapsed sampling weights including idle/program and start/stop overhead; they are not CPU utilization, exact exclusive function cost or directly comparable to threadTicks sums.",
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
      measurements: groups,
    },
    null,
    2,
  ),
);
for (const relative of [
  "chromium-timeline.json",
  "cpu-run/chromium-timeline.json",
]) {
  const bytes = await Bun.file(`${folder}/${relative}`).arrayBuffer();
  await Bun.write(`${folder}/${relative}.gz`, Bun.gzipSync(bytes));
}
