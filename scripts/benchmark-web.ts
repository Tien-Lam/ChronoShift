import { readdir } from "node:fs/promises";
import { convert } from "../web/src/engine/convert";
const names = (await readdir("dist/assets")).filter((n) =>
  /\.(js|css)$/.test(n),
);
const assets = await Promise.all(
  names.map(async (name) => {
    const bytes = await Bun.file(`dist/assets/${name}`).bytes();
    return { name, bytes: bytes.length, gzipBytes: Bun.gzipSync(bytes).length };
  }),
);
const options = {
  now: "2026-04-06T12:00:00Z",
  sourceZone: "UTC",
  targetZone: "Australia/Sydney",
};
const phrase = "April 9, 2026 3pm EST; tomorrow at 9am in Tokyo. ";
function measure(length: number) {
  const text = phrase
    .repeat(Math.ceil(length / phrase.length))
    .slice(0, length);
  const samples = [];
  for (let i = 0; i < 35; i++) {
    const start = performance.now();
    convert(text, options);
    if (i >= 5) samples.push(performance.now() - start);
  }
  samples.sort((a, b) => a - b);
  return {
    characters: length,
    runs: samples.length,
    p50Ms: +samples[Math.floor(samples.length * 0.5)].toFixed(2),
    p95Ms: +samples[Math.ceil(samples.length * 0.95) - 1].toFixed(2),
  };
}
const report = {
  environment: `${process.platform}/${process.arch}, Bun ${Bun.version}`,
  method:
    "Production asset gzip estimate, followed by 5 warmups + 30 timed real-engine conversions with fixed reference and synthetic repeated meeting text. This is a development-machine measurement, not phone/browser startup or worst-case proof.",
  assets,
  totalGzipBytes: assets.reduce((n, a) => n + a.gzipBytes, 0),
  conversions: [measure(2000), measure(10000)],
  pending: [
    "Representative real phone p95",
    "Cold online and warm offline startup",
    "Adversarial long text and UI responsiveness on real mobile",
  ],
};
await Bun.write(
  "docs/planning/web-performance-baseline.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
