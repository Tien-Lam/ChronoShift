// Independently inspect already captured data; never rerun a browser or collector.
const began = new Date().toISOString();
const folder = `${import.meta.dir}/../dropdown-profile`;
const cpu = await Bun.file(`${folder}/cpu-run/profile.json`).json();
const summary = await Bun.file(`${folder}/summary.json`).json();
const prior = await Bun.file(`${import.meta.dir}/dropdown-review-data.json`).json();
const hash = async (path: string) => new Bun.CryptoHasher('sha256').update(await Bun.file(path).bytes()).digest('hex');
const checks = cpu.rows.map((row: any, index: number) => {
  const ds = row.cpuProfile.timeDeltas;
  const ns = ds.filter((d: number) => Number.isFinite(d) && d < 0);
  const actual = {sampleCount: row.cpuProfile.samples.length, deltaCount: ds.length,
    nonFiniteDeltaCount: ds.filter((d: number) => !Number.isFinite(d)).length,
    negativeDeltaCount: ns.length, minimumDeltaUs: Math.min(...ds),
    negativeSignedSumUs: ns.reduce((a: number, b: number) => a + b, 0),
    totalSignedSumUs: ds.reduce((a: number, b: number) => a + b, 0)};
  const corrected = summary.sampledFrames[index];
  const nodes = new Map(row.cpuProfile.nodes.map((node: any) => [node.id, node.callFrame]));
  const observed = [...new Set(row.cpuProfile.samples)].map((id) => ({nodeId: id, frame: nodes.get(id)}));
  return {width: row.width, operation: row.operation, actual,
    validationMatches: Object.entries(actual).every(([k, v]) => corrected.validation[k] === v),
    allWeightedFlagsFalse: corrected.validation.weightedDurationsReliable === false && corrected.validation.weightedRankingsReliable === false,
    unrankedAddressesExact: JSON.stringify(observed) === JSON.stringify(corrected.frameAddressesObserved),
    onlyPermittedKeys: Object.keys(corrected).every(k => ['width','operation','validation','cpuProfileIntervalMs','nestedActionWallMs','scriptThreadMs','frameAddressesObserved'].includes(k)),
    previousRawSamplingMatches: prior.sampling[index].negativeCount === ns.length && Math.abs(prior.sampling[index].negativeSumMs * 1000 - actual.negativeSignedSumUs) < 1e-8};
});
const beforeReportHash = await hash(`${folder}/before-sampler-validation/report.md`);
const global = {profileCount: checks.length, profilesWithNegativeDeltas: checks.filter((r: any) => r.actual.negativeDeltaCount > 0).length,
  negativeDeltaCount: checks.reduce((a: number, r: any) => a + r.actual.negativeDeltaCount, 0),
  minimumDeltaUs: Math.min(...checks.map((r: any) => r.actual.minimumDeltaUs)),
  negativeSignedSumUs: checks.reduce((a: number, r: any) => a + r.actual.negativeSignedSumUs, 0),
  weightedDurationsAndRankingsReliable: false};
const result = {began, ended: new Date().toISOString(), environment:{platform:process.platform,arch:process.arch,bun:Bun.version},
  correctedSummaryAnalyzedAt: summary.analyzedAt,
  global, globalMatches: JSON.stringify(global) === JSON.stringify(summary.samplingValidation), checks,
  beforeReportMatchesInitialReviewHash: beforeReportHash === prior.reportSHA256,
  beforeReportHash, correctedReportHash: await hash(`${folder}/report.md`), correctedAnalyzerHash: await hash(`${folder}/analyze.ts`),
  reviewWorkflowHash: await hash(`${import.meta.dir}/../../../developer/review.md`), qaOverviewHash: await hash(`${import.meta.dir}/../README.md`)};
await Bun.write(`${import.meta.dir}/dropdown-correction-check.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify({began,ended:result.ended,global,globalMatches:result.globalMatches,beforeReportMatchesInitialReviewHash:result.beforeReportMatchesInitialReviewHash,
  allChecksPass:checks.every((r:any)=>r.validationMatches&&r.allWeightedFlagsFalse&&r.unrankedAddressesExact&&r.onlyPermittedKeys&&r.previousRawSamplingMatches)},null,2));
