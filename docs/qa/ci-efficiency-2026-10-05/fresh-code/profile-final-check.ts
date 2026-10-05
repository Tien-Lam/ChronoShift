import { join } from "node:path";
const folder = join(import.meta.dir, "../dropdown-profile");
const read = (path: string) => Bun.file(join(folder, path)).json();
const p = await read("profile.json");
const cpu = await read("cpu-run/profile.json");
const s = await read("summary.json");
const old = await read("before-sampler-validation/summary.json");
const prior = await Bun.file(join(import.meta.dir, "profile-check.json")).json();
const perProfile = cpu.rows.map((row: any) => {
  const d: number[] = row.cpuProfile.timeDeltas;
  const negative = d.filter(value => value < 0);
  const nodes = new Map<number, any>(row.cpuProfile.nodes.map((node: any) => [node.id, node]));
  const entry = s.sampledFrames.find((item: any) => item.width === row.width && item.operation === row.operation);
  const expected = {
    sampleCount: row.cpuProfile.samples.length, deltaCount: d.length,
    nonFiniteDeltaCount: d.filter(value => !Number.isFinite(value)).length,
    negativeDeltaCount: negative.length, minimumDeltaUs: Math.min(...d),
    negativeSignedSumUs: negative.reduce((a, b) => a + b, 0),
    totalSignedSumUs: d.reduce((a, b) => a + b, 0),
    weightedDurationsReliable: false, weightedRankingsReliable: false,
  };
  const addresses = [...new Set<number>(row.cpuProfile.samples)].map(id => ({nodeId: id, frame: nodes.get(id)?.callFrame}));
  return {
    width: row.width, operation: row.operation, validation: expected,
    validationMatches: JSON.stringify(entry.validation) === JSON.stringify(expected),
    everySampleIdResolves: row.cpuProfile.samples.every((id: number) => nodes.has(id)),
    unrankedPresenceMatches: JSON.stringify(addresses) === JSON.stringify(entry.frameAddressesObserved),
    omitsWeightedFields: !Object.keys(entry).some(key => /top|weighted|sampledWall/i.test(key)),
  };
});
const meanErrors: any[] = [];
const fields: Record<string, [string, number]> = {meanActionMs: ["actionMs",1], meanObservedWallMs:["elapsedMs",1], meanTaskThreadMs:["TaskDuration",1000], meanScriptThreadMs:["ScriptDuration",1000], meanLayoutThreadMs:["LayoutDuration",1000], meanStyleThreadMs:["RecalcStyleDuration",1000]};
for (const group of s.measurements) {
  const rows = p.rows.filter((row: any) => `${row.width}/${row.operation}` === group.key);
  for (const [key,[field,factor]] of Object.entries(fields)) {
    const actual = rows.reduce((sum: number,row: any) => sum + (row[field] ?? row.delta[field])*factor,0)/rows.length;
    if (Math.abs(actual-group[key])>1e-9) meanErrors.push({group:group.key,key,actual,reported:group[key]});
  }
}
const paths = ["profile.ts","analyze.ts","summary.json","report.md","profile.json","cpu-run/profile.json","close-observer.ts","close-observer.json","report-original.md","before-sampler-validation/analyze.ts","before-sampler-validation/summary.json","before-sampler-validation/report.md","before-sampler-validation/analysis.log"];
const hashes = await Promise.all(paths.map(async path => ({path,sha256:new Bun.CryptoHasher("sha256").update(await Bun.file(join(folder,path)).arrayBuffer()).digest("hex")})));
const out = {
  observedAt: new Date().toISOString(), scope:"Offline saved-data validation only; no application/browser/CI rerun",
  meanErrors, measurementsUnchangedFromArchivedSummary:JSON.stringify(old.measurements)===JSON.stringify(s.measurements),
  priorOriginalSignedAggregationMatched:prior.samples.every((row: any)=>row.rawTopFramesMatch),
  preservedOldSummaryHasWeightedFields:old.sampledFrames.every((entry: any)=>Array.isArray(entry.topSelfSampleWallMs)),
  perProfile, samplingValidation:s.samplingValidation, hashes,
};
await Bun.write(join(import.meta.dir,"profile-final-check.json"),JSON.stringify(out,null,2));
console.log(JSON.stringify({observedAt:out.observedAt,meanErrors,measurementsUnchangedFromArchivedSummary:out.measurementsUnchangedFromArchivedSummary,priorOriginalSignedAggregationMatched:out.priorOriginalSignedAggregationMatched,preservedOldSummaryHasWeightedFields:out.preservedOldSummaryHasWeightedFields,profiles:perProfile.length,allFinalChecksMatch:perProfile.every(row=>row.validationMatches&&row.everySampleIdResolves&&row.unrankedPresenceMatches&&row.omitsWeightedFields),samplingValidation:s.samplingValidation},null,2));
