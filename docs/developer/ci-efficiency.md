# CI efficiency

Current [PR #37 gate](https://github.com/Tien-Lam/ChronoShift/actions/runs/37274709527) and [automatic main publication](https://github.com/Tien-Lam/ChronoShift/actions/runs/37276181716) pass with 116 units, 258 configured scenarios (249 first-attempt passes/nine capability skips), zero retries and the separate subpath check. Trusted publication now configures, uploads and deploys in one Ubuntu Slim job; manual or rejected reuse still runs the complete gate. The exact source-tree/digest/archive/public-file audit and clean-context reviews are in [the delivery record](../qa/ci-efficiency-2026-10-05/README.md).

[Current measurement](../qa/ci-efficiency-2026-10-05/ci-efficiency-current.json): **442 runner seconds/eight rounded minutes** versus 307/eight baseline; raw usage increased 43.97%, rounded saving is zero. Projected artifact storage fell 63.00% using surviving API artifacts, or 69.22% when including the original baseline Pages artifact proven by its upload log. The current API no longer lists that original artifact; [both projections and raw inputs](../qa/ci-efficiency-2026-10-05/publication-input/report.md) are retained separately. The original baseline had 68 browser cases per gate; the current gate has 258. This workload expansion is explicit, so the target comparison is not a controlled same-workload speedup measurement. The expanded suite **does not meet the 20% usage target**. [TIE-375](https://linear.app/tienlam/issue/TIE-375/restore-the-ci-usage-target-for-the-expanded-browser-suite) remains open. Investigation/manual validation costs are separate from the normal successful pair; this is not monthly account billing.

The previous [PR #36 measurement](../qa/ci-lifecycle-2026-10-05/ci-efficiency-current.json) was 326 seconds/eight minutes with the same expanded inventory; varying runner/source conditions do not establish a cause for the newer run's longer duration. Rejected worker-count, ARM and UI experiments are preserved in the current delivery record rather than selected as wins.

Historical [PR #27 gate](https://github.com/Tien-Lam/ChronoShift/actions/runs/37204065697) and [main publication](https://github.com/Tien-Lam/ChronoShift/actions/runs/37204343768) passed with 108 units, 168 scenarios and subpath. The preserved [report](../planning/ci-efficiency.json) measured 26.71% fewer seconds, 25% fewer rounded minutes and 74.83% lower artifact byte-hours. Targets passed for that earlier workload; failed/debug runs, monthly totals and future variability remain outside that sample.

Earlier Glass Command pair ([Web 37197579724](https://github.com/Tien-Lam/ChronoShift/actions/runs/37197579724), [Pages 37197795794](https://github.com/Tien-Lam/ChronoShift/actions/runs/37197795794)) meets the target with **37.5% fewer rounded runner minutes, 40.39% fewer runner seconds and 74.96% lower projected artifact byte-hours** versus the same baseline. The full gate includes 118 browser scenarios and 108 units; publication reuses its digest/tree-verified artifact. The raw pair is preserved as `glassCommandSample` in [ci-efficiency.json](../planning/ci-efficiency.json). This successful-pair sample excludes failed/canceled/debug runs and is not total monthly account usage. Evidence/experiment path exclusions prevent documentation-only follow-ups from repeating verification and deployment. The earlier main-cutover measurement follows for comparison.

The original main-cutover PR + publication workload meets the requested ≥20% target: **25% fewer per-job rounded minutes, 22.8% less runner time, and 81.74% less projected retained artifact storage**. Verification coverage expanded from the baseline to 113 browser scenarios and 108 unit tests.

| Metric                           |       Baseline | Main-only workflow | Reduction |
| -------------------------------- | -------------: | -----------------: | --------: |
| All runner jobs, including setup |    307 seconds |        237 seconds |     22.8% |
| Per-job rounded-minute estimate  |      8 minutes |          6 minutes |       25% |
| Artifact bytes                   |      1,313,005 |            447,572 |    65.91% |
| Projected retention byte-hours   | 441,169,524.07 |      80,562,273.84 |    81.74% |

Baseline: [Web 37131752983](https://github.com/Tien-Lam/ChronoShift/actions/runs/37131752983) + [Pages 37131749773](https://github.com/Tien-Lam/ChronoShift/actions/runs/37131749773). Candidate: [Web 37181181002](https://github.com/Tien-Lam/ChronoShift/actions/runs/37181181002) + [main Pages 37181395700](https://github.com/Tien-Lam/ChronoShift/actions/runs/37181395700). The PR uses 209 runner seconds; main preparation 19 and deployment 9. Historical job/step timings and artifacts are in [the original report](https://github.com/Tien-Lam/ChronoShift/blob/b432db067ad8176e7f040c74997e2021b629a07c/docs/planning/ci-efficiency.json).

## Main-only publishing

Same-repository PRs run the full frozen install, formatting, strict types/build, exact/corpus/browser and repository-subpath gate, retaining their Pages artifact for one day. PRs cannot deploy. Main validates the expected successful same-repository Web workflow and every required step, the identical head/tested-release/main trees, immutable artifact SHA-256 and safe extraction. On successful reuse, a single Ubuntu Slim preparation job configures Pages, republishes those exact files as a fourteen-day rollback artifact and executes deployment. Missing, expired or unverifiable evidence runs the complete gate and a separate deployment job; manual publication always takes that complete fallback. A failed reused deployment cannot fall through to another deployment. Serialize preparation through deployment without canceling active publication; allow only main in the Pages environment. Count executed deployment steps and published bytes rather than environment status records: the fallback's preparation can create a successful environment record without publishing.

The original main-cutover run reused Web 37181181002, tested source 158c0b7551f480d0f6fb7330c832738a5a0ff4d8, tree 73d1172e32b677c4cd30953bb1cbda2fa51a1c21. That tree equals merged main 9e7c1cbadfa3d213ca819c1bc1e813e39a8aae44. The embedded SHA identifies the tested artifact; it intentionally is not replaced with the later squash-merge SHA. All 108 unit tests and 113 browser scenarios pass without retries; the separate subpath scenario passes. Four live hosted checks pass against that exact tested source, including offline close/reopen with fresh input. Two independent reviewers approved the runtime and trust chain; [review evidence](../planning/review-2026-10-04.md).

## Other reductions

Use the official Playwright 1.63.0 Ubuntu image pinned by SHA-256, with a package-version/executable guard and UID/GID 1001 for Firefox. Bun, Node and gh are pinned through mise. Four workers avoid oversubscription; 1x mobile CI rasterization and a 900×640 routine desktop framebuffer reduce software painting while explicit responsive tests still exercise widths through 1920px. Local profiles retain normal dimensions/density. Retry-only tracing, failed-attempt diagnostics retained three days even after a successful retry, and documentation/design/evidence path filters reduce routine work/storage. Every runtime dependency remains local. Compare the regenerated corpus against an immediately captured checkout snapshot.

Historical preview consolidation measured 50% fewer rounded minutes, 42.35% less runner time and 83.1% lower retained artifact storage. That sample is preserved under previewSample in the report; the temporary preview deployment is now removed. Prior cache cleanup removed obsolete ARM/superseded runtime caches: 874,383,340→302,686,062 bytes (65.38% in that snapshot), preserving the then-active x64 caches and rollback artifacts. This historical cache snapshot is separate from artifact retention; subsequent runs can create new caches.

On 5 October, verified removal of one rejected ARM and three obsolete merged-PR runtime caches reduced a later cache snapshot from **1,730,963,608 to 1,096,667,166 bytes (36.64%)**, preserving main and open dependency-PR caches. [Raw IDs, refs, sizes and independent review](../qa/ci-efficiency-2026-10-05/root/cache-cleanup.json) establish occupancy at that time, not runner-minute savings or a monthly bill.

## Limits and reproduction

These are paired successful repository samples, not account-wide monthly billing exports or guarantees for every future run. Count every runner job, including setup/container pull; do not count failed/canceled runs as savings. Debugging/manual validation and new dependency-maintenance runs are outside this equivalent publishing pair. Rounded minutes are a quota proxy. Artifact byte-hours project configured retention and do not remove storage already accrued. Failure frequency, queue/setup variation and publishing without a recent matching artifact affect actual monthly usage.

Standard hosted compute is free for this public repository; private plans have monthly minute/storage allowances. Caches have a separate 10 GB repository allowance; Actions artifacts share their plan allowance with Packages. [GitHub billing rules](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

Reproduce the main sample with the read-only gh-backed tool:

```bash
bun scripts/ci-metrics.ts --baseline 37131752983,37131749773 --candidate 37181181002,37181395700 --output /tmp/chronoshift-ci-main.json
```

The tool rejects unsuccessful/incomplete runs, unequal event/workflow mixes, incomplete API pages, quota/storage savings under 20%, or no raw-time improvement. It separately reports the stricter all-metric ≥20% target, which passes here. Historical preview reproduction uses --candidate 37175168562 --consolidated-preview.
