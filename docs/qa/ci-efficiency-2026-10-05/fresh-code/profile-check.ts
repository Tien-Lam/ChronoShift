import { join } from "node:path";
const folder = join(import.meta.dir, "../dropdown-profile");
const p = await Bun.file(join(folder, "profile.json")).json();
const cpu = await Bun.file(join(folder, "cpu-run/profile.json")).json();
const summary = await Bun.file(join(folder, "summary.json")).json();
const close = await Bun.file(join(folder, "close-observer.json")).json();
const hash = (bytes: Uint8Array) => new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
const meanErrors: any[] = [];
const fields: any = { meanActionMs: ["actionMs", 1], meanObservedWallMs: ["elapsedMs", 1], meanTaskThreadMs: ["TaskDuration", 1000], meanScriptThreadMs: ["ScriptDuration", 1000], meanLayoutThreadMs: ["LayoutDuration", 1000], meanStyleThreadMs: ["RecalcStyleDuration", 1000] };
for (const group of summary.measurements) {
  const rows = p.rows.filter((r: any) => `${r.width}/${r.operation}` === group.key);
  for (const [name, [field, factor]] of Object.entries(fields) as any) {
    const mean = rows.reduce((sum: number, row: any) => sum + (row[field] ?? row.delta[field]) * factor, 0) / rows.length;
    if (Math.abs(mean - group[name]) > 1e-9) meanErrors.push({ group: group.key, name, actual: mean, reported: group[name] });
  }
}
const traces = [];
for (const relative of ["chromium-timeline.json", "cpu-run/chromium-timeline.json"]) {
  const bytes = new Uint8Array(await Bun.file(join(folder, relative)).arrayBuffer());
  const gzip = new Uint8Array(await Bun.file(join(folder, relative + ".gz")).arrayBuffer());
  const decompressed = Bun.gunzipSync(gzip);
  const trace = JSON.parse(new TextDecoder().decode(bytes));
  const marks = trace.traceEvents.filter((event: any) => /^(1280|390)\/\d+\/[^/]+\/(start|end)$/.test(event.name));
  const marksByName = new Map<string, any[]>(marks.map((event: any) => [event.name, marks.filter((e: any) => e.name === event.name)]));
  const pairs = marks.filter((event: any) => event.name.endsWith("/start")).map((start: any) => {
    const end = marksByName.get(start.name.replace(/\/start$/, "/end"))?.[0];
    return { name: start.name.replace(/\/start$/, ""), start: start.ts, end: end?.ts, spanMs: end ? (end.ts - start.ts) / 1000 : null, sameThread: end?.pid === start.pid && end?.tid === start.tid };
  });
  traces.push({ relative, bytes: bytes.length, gzipBytes: gzip.length, exactDecompression: hash(bytes) === hash(decompressed), events: trace.traceEvents.length, marks: marks.length, distinctMarkNames: marksByName.size, pairs });
}
const samples = cpu.rows.map((row: any) => {
  const nodes = new Map(row.cpuProfile.nodes.map((node: any) => [node.id, node]));
  const weighted = new Map<number, number>();
  row.cpuProfile.samples.forEach((id: number, index: number) => weighted.set(id, (weighted.get(id) || 0) + row.cpuProfile.timeDeltas[index]));
  const sorted = [...weighted].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([id, micros]) => ({ frame: (nodes.get(id) as any).callFrame, sampledWallMs: micros / 1000 }));
  const original = summary.sampledFrames.find((entry: any) => entry.width === row.width && entry.operation === row.operation);
  return { width: row.width, operation: row.operation, rawTopFramesMatch: JSON.stringify(sorted) === JSON.stringify(original.topSelfSampleWallMs), validSampleIds: row.cpuProfile.samples.every((id: number) => nodes.has(id)), sampleCount: row.cpuProfile.samples.length, deltaCount: row.cpuProfile.timeDeltas.length, profileSpanMs: (row.cpuProfile.endTime - row.cpuProfile.startTime) / 1000, weightedSpanMs: row.cpuProfile.timeDeltas.reduce((sum: number, delta: number) => sum + delta, 0) / 1000, nestedWallMs: row.elapsedMs, metricSpanMs: (row.afterTimestamp - row.beforeTimestamp) * 1000, idleMs: [...weighted].filter(([id]) => (nodes.get(id) as any).callFrame.functionName === "(idle)").reduce((sum, [, micros]) => sum + micros / 1000, 0) };
});
const closeRows = close.rows.map((row: any) => ({ condition: row.condition, measuredRemoval: row.removed !== null, removalArithmeticMatches: Math.abs(row.removalAfterStartMs - (row.removed - row.start)) < 1e-9, assertionArithmeticMatches: Math.abs(row.assertionAfterRemovalMs - (row.expectObserved - row.removed)) < 1e-9, entering: row.entering, runningAnimations: row.runningAnimations, removalAfterStartMs: row.removalAfterStartMs, assertionAfterRemovalMs: row.assertionAfterRemovalMs, removalAfterAnimationFinishMs: row.animationFinished.length ? row.removed - Math.max(...row.animationFinished) : null }));
const out = { observedAt: new Date().toISOString(), repeatedRows: p.rows.length, cpuRows: cpu.rows.length, groupCount: summary.measurements.length, meanErrors, finiteNonnegativeDeltas: [...p.rows, ...cpu.rows].every((row: any) => Object.values(row.delta).every((value: any) => Number.isFinite(value) && value >= 0)), reducedMotionObserved: [...p.rows, ...cpu.rows].some((row: any) => row.dom.reducedMotion), crossRunFourAssetHashes: Object.keys(p.assetsBefore).map((key) => ({ key, matches: p.assetsBefore[key].sha256 === cpu.assetsBefore[key].sha256 })), traces, samples, closeRows };
await Bun.write(join(import.meta.dir, "profile-check.json"), JSON.stringify(out, null, 2));
console.log(JSON.stringify({ observedAt: out.observedAt, meanErrors, traces: traces.map(({ pairs, ...record }) => ({ ...record, pairCount: pairs.length, allPairsValid: pairs.every((pair) => pair.spanMs !== null && pair.spanMs >= 0 && pair.sameThread) })), sampleMatches: samples.every((s: any) => s.rawTopFramesMatch), closeRows }, null, 2));
