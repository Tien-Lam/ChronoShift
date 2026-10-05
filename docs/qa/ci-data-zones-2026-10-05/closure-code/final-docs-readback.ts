import { resolve, dirname } from "node:path";
const startedAt = new Date().toISOString();
const files = ["docs/developer/ci-efficiency.md", "docs/qa/ci-data-zones-2026-10-05/README.md", "docs/qa/ci-data-zones-2026-10-05/closure-summary.md", "docs/qa/ci-virtualized-zones-2026-10-05/README.md"];
const docs = [];
for (const file of files) {
  const text = await Bun.file(file).text();
  const links = [];
  for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1];
    if (/^https?:|^#/.test(target)) continue;
    const path = resolve(dirname(file), target.split("#")[0]);
    links.push({ target, exists: await Bun.file(path).exists() });
  }
  docs.push({ file, sha256: new Bun.CryptoHasher("sha256").update(text).digest("hex"), links });
}
const delivery = "docs/qa/ci-next-2026-10-05/delivery/pipeline";
const deliveries = [];
for (const prefix of ["", "/fallback"]) {
  const attempts = await Bun.file(`${delivery}${prefix}/browser-attempts.json`).json();
  const log = await Bun.file(`${delivery}${prefix}/${prefix ? "run" : "final-run"}.log`).text();
  const valid = attempts.length === 273 && new Set(attempts.map((r: any) => r.ordinal)).size === 273 && new Set(attempts.map((r: any) => [r.project,r.location,r.title].join("|"))).size === 273 && attempts.every((r: any) => !r.retry) && attempts.filter((r: any) => r.symbol === "✓").length === 264 && log.includes("264 passed") && log.includes("9 skipped") && log.includes("116 pass") && !/\(retry #/.test(log);
  if (!valid) throw Error(`Incomplete retained delivery${prefix}`);
  deliveries.push({ prefix, configured: attempts.length, passes: attempts.filter((r: any) => r.symbol === "✓").length, remainingSymbols: attempts.filter((r: any) => r.symbol !== "✓").map((r: any) => r.symbol), logMatched: true });
}
const result = { startedAt, endedAt: new Date().toISOString(), docs, deliveries, scope: "Local references/hash snapshot and retained delivery first-attempt log readback only. Pending same-delivery reviewer files are listed explicitly; no browser/CI execution or remote account access." };
await Bun.write(`${import.meta.dir}/final-docs-readback.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result));
