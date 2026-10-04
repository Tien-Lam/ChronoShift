import { createHash } from "node:crypto";
const root = import.meta.dir;
const bytes = await Bun.file(`${root}/holdout.json`).bytes();
const gold = JSON.parse(new TextDecoder().decode(bytes));
const native = await Bun.file(`${root}/native-onnx.json`).json();
const reference = await Bun.file(`${root}/inference.json`).json();
if (
  [native.holdoutSha256, reference.holdoutSha256].some(
    (hash) => hash !== createHash("sha256").update(bytes).digest("hex"),
  )
)
  throw new Error("Holdout mismatch");
const key = (e: { start: number; end: number; label: string }) =>
  `${e.start}:${e.end}:${e.label}`;
const metrics = native.variants.map((variant: any) => {
  let truePositive = 0,
    predicted = 0,
    changed = 0,
    goldCount = 0;
  if (variant.status !== "executed")
    throw new Error(`Unexecuted variant ${variant.file}`);
  for (const fixture of gold.cases) {
    const row = variant.predictions.find((r: any) => r.name === fixture.name);
    const original = reference.predictions.find(
      (r: any) => r.name === fixture.name,
    );
    if (!row || !original) throw new Error("Missing predictions");
    const codepoints = [...fixture.text];
    const spans = row.entities.map((e: any) => {
      if (codepoints.slice(e.start, e.end).join("") !== e.text)
        throw new Error("Invalid ONNX span");
      return {
        ...e,
        start: codepoints.slice(0, e.start).join("").length,
        end: codepoints.slice(0, e.end).join("").length,
      };
    });
    const actual = new Set<string>(spans.map(key));
    const expected = new Set<string>(fixture.spans.map(key));
    const baseline = new Set<string>(original.entities.map(key));
    predicted += actual.size;
    goldCount += expected.size;
    truePositive += [...actual].filter((k) => expected.has(k)).length;
    if (
      JSON.stringify([...actual].sort()) !==
      JSON.stringify([...baseline].sort())
    )
      changed++;
  }
  return {
    file: variant.file,
    predicted,
    truePositive,
    gold: goldCount,
    precision: truePositive / predicted,
    recall: truePositive / goldCount,
    f1: (2 * truePositive) / (predicted + goldCount),
    messagesWithDifferentEntitySetFromTorchFP32: changed,
  };
});
await Bun.write(
  `${root}/quantization-comparison.json`,
  JSON.stringify(metrics, null, 2) + "\n",
);
console.log(metrics);
