const raw = await Bun.file(new URL("render-probe-raw.json", import.meta.url)).json();
const mean = (values: number[]) => values.reduce((a, b) => a + b, 0) / values.length;
const groups = [];
for (const engine of ["chromium", "firefox", "webkit"]) {
  const variants: Record<string, any> = {};
  for (const variant of ["baseline", "candidate"]) {
    const rows = raw.rows.filter((r: any) => r.engine === engine && r.variant === variant);
    if (rows.length !== 12 || rows.some((r: any) => r.observation.motionReduced || r.observation.time !== r.expected || r.observation.input !== r.text || !(r.observation.settled > r.observation.pending))) throw Error("Incomplete or invalid observations");
    const metrics: Record<string, number> = {};
    for (const name of ["TaskDuration", "ScriptDuration", "LayoutDuration", "RecalcStyleDuration"]) {
      if (engine === "chromium") {
        const deltas = rows.map((r: any) => {
          const delta = r.after.metrics.find((m: any) => m.name === name).value - r.before.metrics.find((m: any) => m.name === name).value;
          if (!Number.isFinite(delta) || delta < 0) throw Error("Invalid monotonic metric");
          return delta * 1000;
        });
        metrics[name + "MeanMs"] = mean(deltas);
      }
    }
    variants[variant] = { count: rows.length, meanElapsedMs: mean(rows.map((r: any) => r.elapsedMs)), meanPendingToSettledMs: mean(rows.map((r: any) => r.observation.settled - r.observation.pending)), blocks: [0, 1, 2, 3].flatMap((block) => { const selected = rows.filter((r: any) => r.block === block); return selected.length ? [{ block, meanElapsedMs: mean(selected.map((r: any) => r.elapsedMs)), meanPendingToSettledMs: mean(selected.map((r: any) => r.observation.settled - r.observation.pending)) }] : []; }), ...metrics };
  }
  groups.push({ engine, variants, meanElapsedSavedMs: variants.baseline.meanElapsedMs - variants.candidate.meanElapsedMs, meanNativePipelineSavedMs: variants.baseline.meanPendingToSettledMs - variants.candidate.meanPendingToSettledMs });
}
if (raw.rows.length !== 72 || raw.errors.length) throw Error("Run did not pass completely");
const summary = { analyzedAt: new Date().toISOString(), startedAt: raw.startedAt, endedAt: raw.endedAt, count: raw.rows.length, errors: raw.errors, platform: raw.platform, architecture: raw.architecture, scope: "Local serial ARM64 ABBA; native conversion pipeline includes250ms debounce. Raw CDP before/after use threadTicks; totals are nonadditive. Not Linux/fullsuite/CI target acceptance.", groups };
await Bun.write(new URL("render-probe-summary.json", import.meta.url), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
