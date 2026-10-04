# CI efficiency

Latest Glass Command pair ([Web 37197579724](https://github.com/Tien-Lam/ChronoShift/actions/runs/37197579724), [Pages 37197795794](https://github.com/Tien-Lam/ChronoShift/actions/runs/37197795794)) meets the target with **37.5% fewer rounded runner minutes, 40.39% fewer runner seconds and 74.96% lower projected artifact byte-hours** versus the same baseline. The full gate includes 118 browser scenarios and 108 units; publication reuses its digest/tree-verified artifact. The raw pair is preserved as `glassCommandSample` in [ci-efficiency.json](../planning/ci-efficiency.json). This successful-pair sample excludes failed/canceled/debug runs and is not total monthly account usage. Evidence/experiment path exclusions prevent documentation-only follow-ups from repeating verification and deployment. The earlier main-cutover measurement follows for comparison.

The measured equivalent PR + main publication workload meets the requested ≥20% target: **25% fewer per-job rounded minutes, 22.8% less runner time, and 81.74% less projected retained artifact storage**. Verification coverage expanded from the baseline to 113 browser scenarios and 108 unit tests.

| Metric | Baseline | Main-only workflow | Reduction |
| --- | ---: | ---: | ---: |
| All runner jobs, including setup | 307 seconds | 237 seconds | 22.8% |
| Per-job rounded-minute estimate | 8 minutes | 6 minutes | 25% |
| Artifact bytes | 1,313,005 | 447,572 | 65.91% |
| Projected retention byte-hours | 441,169,524.07 | 80,562,273.84 | 81.74% |

Baseline: [Web 37131752983](https://github.com/Tien-Lam/ChronoShift/actions/runs/37131752983) + [Pages 37131749773](https://github.com/Tien-Lam/ChronoShift/actions/runs/37131749773). Candidate: [Web 37181181002](https://github.com/Tien-Lam/ChronoShift/actions/runs/37181181002) + [main Pages 37181395700](https://github.com/Tien-Lam/ChronoShift/actions/runs/37181395700). The PR uses 209 runner seconds; main preparation 19 and deployment 9. Full job/step timings and artifacts are in [the report](../planning/ci-efficiency.json).

## Main-only publishing

Same-repository PRs run the full frozen install, formatting, strict types/build, exact/corpus/browser and repository-subpath gate, retaining their Pages artifact for one day. PRs cannot deploy. Main validates the expected successful same-repository Web workflow and every required step, the identical head/tested-release/main trees, immutable artifact SHA-256 and safe extraction. It republishes those exact files as a fourteen-day rollback artifact. Missing, expired or unverifiable evidence runs the complete gate. Manual publication always runs the complete gate. Serialize preparation through deployment without canceling active publication; allow only main in the Pages environment.

The actual main run reused Web 37181181002, tested source 158c0b7551f480d0f6fb7330c832738a5a0ff4d8, tree 73d1172e32b677c4cd30953bb1cbda2fa51a1c21. That tree equals merged main 9e7c1cbadfa3d213ca819c1bc1e813e39a8aae44. The embedded SHA identifies the tested artifact; it intentionally is not replaced with the later squash-merge SHA. All 108 unit tests and 113 browser scenarios pass without retries; the separate subpath scenario passes. Four live hosted checks pass against that exact tested source, including offline close/reopen with fresh input. Two independent reviewers approved the runtime and trust chain; [review evidence](../planning/review-2026-10-04.md).

## Other reductions

Use the official Playwright 1.63.0 Ubuntu image pinned by SHA-256, with a package-version/executable guard and UID/GID 1001 for Firefox. Bun, Node and gh are pinned through mise. Four workers avoid oversubscription; 1x mobile CI rasterization and a 900×640 routine desktop framebuffer reduce software painting while explicit responsive tests still exercise widths through 1920px. Local profiles retain normal dimensions/density. Retry-only tracing, failure-only diagnostics retained three days, and documentation/design/evidence path filters reduce routine work/storage. Every runtime dependency remains local. Compare the regenerated corpus against an immediately captured checkout snapshot.

Historical preview consolidation measured 50% fewer rounded minutes, 42.35% less runner time and 83.1% lower retained artifact storage. That sample is preserved under previewSample in the report; the temporary preview deployment is now removed. Prior cache cleanup removed obsolete ARM/superseded runtime caches: 874,383,340→302,686,062 bytes (65.38% in that snapshot), preserving the then-active x64 caches and rollback artifacts. This historical cache snapshot is separate from artifact retention; subsequent runs can create new caches.

## Limits and reproduction

These are paired successful repository samples, not account-wide monthly billing exports or guarantees for every future run. Count every runner job, including setup/container pull; do not count failed/canceled runs as savings. Debugging/manual validation and new dependency-maintenance runs are outside this equivalent publishing pair. Rounded minutes are a quota proxy. Artifact byte-hours project configured retention and do not remove storage already accrued. Failure frequency, queue/setup variation and publishing without a recent matching artifact affect actual monthly usage.

Standard hosted compute is free for this public repository; private plans have monthly minute/storage allowances. Caches have a separate 10 GB repository allowance; Actions artifacts share their plan allowance with Packages. [GitHub billing rules](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

Reproduce the main sample with the read-only gh-backed tool:

```bash
bun scripts/ci-metrics.ts --baseline 37131752983,37131749773 --candidate 37181181002,37181395700 --output /tmp/chronoshift-ci-main.json
```

The tool rejects unsuccessful/incomplete runs, unequal event/workflow mixes, incomplete API pages, quota/storage savings under 20%, or no raw-time improvement. It separately reports the stricter all-metric ≥20% target, which passes here. Historical preview reproduction uses --candidate 37175168562 --consolidated-preview.
