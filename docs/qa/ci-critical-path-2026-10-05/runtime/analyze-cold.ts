import { readFile, writeFile } from "node:fs/promises";

const began = new Date().toISOString();
const input = "docs/qa/ci-critical-path-2026-10-05/cold-probe.json";
const raw = await readFile(input);
const data = JSON.parse(raw.toString());
const metrics = ["readyMs", "firstConversionMs", "firstOpenMs"];
const summarize = (rows: any[]) => Object.fromEntries(metrics.map((name) => {
  const values = rows.map((row) => row[name]).sort((a, b) => a - b);
  const sum = values.reduce((total, value) => total + value, 0);
  return [name, { count: values.length, sum, mean: sum / values.length, min: values[0], max: values.at(-1), median: (values[(values.length - 1) >> 1] + values[values.length >> 1]) / 2 }];
}));
const errors: string[] = [];
const identities = new Set();
for (const row of data.rows) {
  const key = `${row.phase}/${row.engine}/${row.sample}`;
  if (identities.has(key)) errors.push(`Duplicate ${key}`);
  identities.add(key);
  if (row.version !== ["baseline", "candidate", "candidate", "baseline"][row.phase]) errors.push(`Bad phase version ${key}`);
  if (row.sample < 0 || row.sample > 5 || row.errors.length) errors.push(`Bad sample/errors ${key}`);
  for (const name of metrics) if (!Number.isFinite(row[name]) || row[name] < 0) errors.push(`Bad duration ${key}/${name}`);
  if (Date.parse(row.ended) < Date.parse(row.began)) errors.push(`Reversed clock ${key}`);
}
const groups = ["chromium", "firefox", "webkit"].map((engine) => {
  const rows = data.rows.filter((row: any) => row.engine === engine);
  const baseline = summarize(rows.filter((row: any) => row.version === "baseline"));
  const candidate = summarize(rows.filter((row: any) => row.version === "candidate"));
  return {
    engine, versions: [...new Set(rows.map((row: any) => row.browserVersion))], baseline, candidate,
    candidateMinusBaselineMeanMs: Object.fromEntries(metrics.map((name) => [name, candidate[name].mean - baseline[name].mean])),
    phases: [0, 1, 2, 3].map((phase) => ({ phase, version: ["baseline", "candidate", "candidate", "baseline"][phase], ...summarize(rows.filter((row: any) => row.phase === phase)) })),
  };
});
const inventories = Object.fromEntries(Object.entries(data.hashes).map(([version, files]: [string, any]) => [version, {
  count: files.length, totalBytes: files.reduce((sum: number, file: any) => sum + file.bytes, 0),
  scriptPaths: files.filter((file: any) => /^assets\/index-.*\.js$/.test(file.path)).map((file: any) => file.path),
}]));
for (const row of data.rows) if (!(inventories[row.version] as any).scriptPaths.includes(row.script?.replace(/^\//, ""))) errors.push(`Wrong script path ${row.phase}/${row.engine}/${row.sample}`);
const same = data.hashes.baseline.filter((a: any) => data.hashes.candidate.some((b: any) => a.path === b.path && a.bytes === b.bytes && a.sha256 === b.sha256)).map((file: any) => file.path);
const result = {
  began, ended: new Date().toISOString(), sourceFile: input,
  sha256: new Bun.CryptoHasher("sha256").update(raw).digest("hex"),
  rawStart: data.started, rawEnd: data.ended, rawWallSeconds: (Date.parse(data.ended) - Date.parse(data.started)) / 1000,
  environment: data.environment, count: data.rows.length, uniqueCount: identities.size,
  phaseCounts: [0, 1, 2, 3].map((phase) => data.rows.filter((row: any) => row.phase === phase).length),
  errors, groups, inventories, unchangedArtifactMembers: same,
  changedOrRenamedBaselineMembers: data.hashes.baseline.filter((file: any) => !same.includes(file.path)),
  changedOrRenamedCandidateMembers: data.hashes.candidate.filter((file: any) => !same.includes(file.path)),
  pooled: { baseline: summarize(data.rows.filter((row: any) => row.version === "baseline")), candidate: summarize(data.rows.filter((row: any) => row.version === "candidate")) },
  limits: ["Recorded wall and visibility scopes, not exclusive CPU or paint/animation completion", "Local serial macOS ARM fresh contexts, shared browser process per six samples", "No source implementation verdict or Linux/whole-gate/goal projection"],
};
await writeFile("docs/qa/ci-critical-path-2026-10-05/runtime/cold-results.json", JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ began, ended: result.ended, count: result.count, phaseCounts: result.phaseCounts, errors, groups: groups.map((group) => ({ engine: group.engine, browserVersions: group.versions, baselineMeans: Object.fromEntries(metrics.map((name) => [name, group.baseline[name].mean])), candidateMeans: Object.fromEntries(metrics.map((name) => [name, group.candidate[name].mean])), differences: group.candidateMinusBaselineMeanMs })), pooled: result.pooled, inventories, sameCount: same.length }, null, 2));
