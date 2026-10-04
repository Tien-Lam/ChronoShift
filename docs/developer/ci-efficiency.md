# CI efficiency

The preview measurements below are historical. At main cutover, same-repository PRs retain the fully verified artifact for one day; main validates its successful workflow, exact source trees and archive digest before republishing it for fourteen days. A miss runs the full verification gate. Main publication is serialized as a complete workflow, and PRs cannot deploy. The equivalent PR + main sample must be measured after deployment; no main savings are inferred from the preview result.

The final migration-preview configuration reduces estimated rounded runner-minute usage by **50%**, raw runner time by **42.35%**, and projected retained artifact storage by **83.10%** for one publishing update and its PR verification. All 98 browser scenarios remain. The equivalent workload previously ran two full workflows; it now uses one PR verification/publication pipeline after proving the merge tree exactly matches the publishing branch. Both the quota/storage target and the stricter all-metric ≥20% target pass.

| Metric                                                |       Baseline |     Optimized | Reduction |
| ----------------------------------------------------- | -------------: | ------------: | --------: |
| Total runner time, including setup and container pull |    307 seconds |   177 seconds |    42.35% |
| Per-job rounded runner-minute estimate                |      8 minutes |     4 minutes |    50.00% |
| Successful-workload artifact bytes                    |      1,313,005 |       221,916 |    83.10% |
| Projected artifact retention byte-hours               | 441,169,524.07 | 74,563,714.36 |    83.10% |

Baseline: [Web 37131752983](https://github.com/Tien-Lam/ChronoShift/actions/runs/37131752983) and [Pages 37131749773](https://github.com/Tien-Lam/ChronoShift/actions/runs/37131749773), before the CI changes. Optimized: [Web verification + preview deployment 37175168562](https://github.com/Tien-Lam/ChronoShift/actions/runs/37175168562), source `422622546fabfc795ea8c7f062e600f1a170de47`. Full job/step timings, artifact sizes, retention and cache-cleanup evidence are in [the machine-readable report](../planning/ci-efficiency.json).

## Changes

- Use the official Playwright 1.63.0 Ubuntu image pinned by SHA-256 digest. Browser binaries and OS dependencies are already installed; a dependency-version/executable guard prevents mismatched upgrades. Run as UID/GID 1001 to match GitHub's mounted workspace and allow Firefox to start normally. Bun and Node remain pinned and managed by mise.
- Run all browser scenarios with four workers on the public repository's standard four-core x64 runner. Six workers and standard ARM did not improve measured total job time. Mobile CI uses 1x raster density while retaining viewport/touch/user-agent settings and every assertion; local standard high-density mobile profiles also pass. Opaque glass surfaces, paint containment and bounded shadows reduce rendering work without removing either design. Record traces on the first retry rather than every passing test; retain failure screenshots, reports and retry traces for three days. Failure-artifact upload was exercised during container integration.
- Build and verify both the root app and repository-path app, then upload the exact verified Pages files. Remove the separate Pages build job, extra runtime setup and redundant root rebuild.
- During migration, PR #16 proves the merge ref and same-repository publishing branch have identical file/blob/mode trees before running the full gate and deploying that tested artifact. Differing trees fail closed and require updating the branch from main. Only that exact PR/ref can publish. Main/manual Pages publishing retains the full reusable Web workflow; other PRs still verify their merge ref without publishing. Cancel superseded verification per branch/PR while protecting active deployments from cancellation.
- Skip both workflows for documentation/design/evidence-only pushes. Retain successful Pages artifacts for 14 days for rollback, and avoid uploading successful diagnostic bundles or extra copies of `dist/`.
- Compare the corpus audit against a snapshot captured immediately after checkout. This keeps the checked-in-output drift gate independent of container Git ownership behavior.

## Validation and limits

Workflow lint, formatting and strict type checks pass. The optimized run passes 73 unit tests, the unchanged 353-input corpus audit with zero crashes, all 98 browser scenarios across the existing six profiles without retries, and the separate repository-path offline/share scenario. Four live hosted checks pass against the exact optimized branch SHA, including offline close/reopen with fresh input and release/manifest/CSP verification. A source-tree fixture rejects changed merge content and verifies a build uses the proven branch SHA even when GitHub supplies a different merge SHA. The metrics tool rejects a verification-only run in consolidated mode.

The main/manual reusable publishing path also passed in [Pages run 37174670177](https://github.com/Tien-Lam/ChronoShift/actions/runs/37174670177) at `bfa7a49`. Its older cookie-selected WebKit update fixture needed one retry; every update fixture now uses an isolated origin and explicit publication, verified by 30 repeated local checks and the final no-retry Linux suite. This manual validation run is a one-off check, outside the recurring preview sample.

This sample includes all verification/deployment runner job time, including the container pull; it does not count canceled or failed workflows as savings. It is not an account billing export, an account-wide monthly cost reduction or a guarantee for every future run. Startup/network variability, debugging runs and failure frequency affect actual monthly usage. Retention byte-hours project the configured artifact lifetime; they do not erase storage already accrued. Successful publishing updates retain only the Pages artifact; failures retain diagnostics for three days. TIE-320 requires re-measuring an equivalent PR + main-publication workload and preserving the ≥20% quota/storage target when the temporary preview path is removed at main-only cutover.

Runtime cache cleanup removed two obsolete ARM trial caches and two superseded x64 cache versions: **874,383,340 → 302,686,062 bytes**, a **65.38%** reduction in current cache storage. The two active x64 caches and all retained rollback artifacts remain. This cache snapshot is separate from projected artifact retention. GitHub gives caches a separate 10 GB repository allowance; Actions artifacts share their plan allowance with Packages. Deletion does not remove storage already accrued. [GitHub billing rules](https://docs.github.com/en/billing/concepts/product-billing/github-actions).

Standard hosted runner compute is [free for this public repository](https://docs.github.com/en/billing/concepts/product-billing/github-actions). Private repositories have plan-specific monthly minute/storage allowances. The rounded-minute model makes quota efficiency visible without claiming a dollar reduction from free compute. If the repository becomes private or runner resources change, benchmark worker concurrency again.

Reproduce the report with the read-only GitHub CLI-backed tool:

```bash
bun scripts/ci-metrics.ts --baseline 37131752983,37131749773 --candidate 37175168562 --consolidated-preview --output docs/planning/ci-efficiency.json
```

The tool fails closed for unsuccessful/incomplete runs, mismatched event mixes, incomplete API pages, a quota/storage reduction below 20%, or no improvement in raw runner time. Consolidated mode allows only the explicit replacement topology: one full Web PR gate with the tree proof, browser/subpath checks, sole Pages artifact and successful preview deployment. It reports the stricter all-metric ≥20% result independently; that flag is true for this final sample. Comparing the baseline with itself reports zero savings and exits unsuccessfully.

Reference: [Playwright's official CI guidance](https://playwright.dev/docs/ci), [container guidance](https://playwright.dev/docs/docker) and [trace viewer](https://playwright.dev/docs/trace-viewer).
