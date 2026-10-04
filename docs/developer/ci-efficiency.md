# CI efficiency

The optimized CI passes the complete existing test suite with at least 20% less measured runner work and estimated rounded runner-minute usage for an equivalent successful push + PR pair.

| Metric | Baseline | Optimized | Reduction |
| --- | ---: | ---: | ---: |
| Total runner time, including setup and container pull | 307 seconds | 226 seconds | 26.38% |
| Per-job rounded runner-minute estimate | 8 minutes | 5 minutes | 37.50% |
| Successful-pair artifact bytes | 1,313,005 | 220,772 | 83.19% |
| Projected artifact retention byte-hours | 441,169,524.07 | 74,179,330.67 | 83.19% |

Baseline: [Web 37131752983](https://github.com/Tien-Lam/ChronoShift/actions/runs/37131752983) and [Pages 37131749773](https://github.com/Tien-Lam/ChronoShift/actions/runs/37131749773), before the CI changes. Optimized: [Web 37138175771](https://github.com/Tien-Lam/ChronoShift/actions/runs/37138175771) and [Pages 37138173128](https://github.com/Tien-Lam/ChronoShift/actions/runs/37138173128), source `6b8e08aefb103cc0d849be2f52a6e5f8077ed5cd`. Full job/step timings, artifact sizes and retention are in [the machine-readable report](../planning/ci-efficiency.json).

## Changes

- Use the official Playwright 1.63.0 Ubuntu image pinned by SHA-256 digest. Browser binaries and OS dependencies are already installed; a dependency-version/executable guard prevents mismatched upgrades. Run as UID/GID 1001 to match GitHub's mounted workspace and allow Firefox to start normally. Bun and Node remain pinned and managed by mise.
- Run all browser scenarios with four workers on the public repository's four-core runner. Record traces on the first retry rather than every passing test; retain failure screenshots, reports and retry traces for three days. Failure-artifact upload was exercised during container integration.
- Build and verify both the root app and repository-path app, then upload the exact verified Pages files. Remove the separate Pages build job, extra runtime setup and redundant root rebuild.
- Let Pages perform `main` push verification through the reusable Web workflow. Keep PR merge-ref verification separate from publishing-branch verification. Cancel superseded verification per branch/PR while protecting active deployments from cancellation.
- Skip Pages publishing for documentation/design-only pushes. Retain successful Pages artifacts for 14 days for rollback, and avoid uploading successful diagnostic bundles or extra copies of `dist/`.
- Compare the corpus audit against a snapshot captured immediately after checkout. This keeps the checked-in-output drift gate independent of container Git ownership behavior.

## Validation and limits

Workflow lint, formatting and strict type checks pass. The optimized Pages run passes 72 unit tests, the unchanged 353-input corpus audit with zero crashes, all 68 browser scenarios across the existing six profiles without retries, and the separate repository-path offline/share scenario. Four live hosted checks pass against the exact optimized source SHA, including offline close/reopen with fresh input and release/manifest/CSP verification.

This paired sample includes all runner job time, including the container pull; it does not count canceled or failed workflows as savings. It is not an account billing export, an account-wide monthly cost reduction or a guarantee for every future run. Queue/network variability and failure frequency affect actual monthly usage. Retention byte-hours project the configured artifact lifetime; they do not erase storage already accrued. Successful pairs retain only the Pages artifact; failures retain diagnostics for three days.

Standard hosted runner compute is [free for this public repository](https://docs.github.com/en/billing/concepts/product-billing/github-actions). Private repositories have plan-specific monthly minute/storage allowances. The rounded-minute model makes quota efficiency visible without claiming a dollar reduction from free compute. If the repository becomes private or runner resources change, benchmark worker concurrency again.

Reproduce the report with the read-only GitHub CLI-backed tool:

```bash
bun scripts/ci-metrics.ts --baseline 37131752983,37131749773 --candidate 37138175771,37138173128 --output docs/planning/ci-efficiency.json
```

The tool fails closed for unsuccessful/incomplete runs, mismatched event mixes, incomplete API pages, or any measured usage reduction below 20%. Comparing the baseline with itself was also verified to report zero savings and exit unsuccessfully.

Reference: [Playwright's official CI guidance](https://playwright.dev/docs/ci), [container guidance](https://playwright.dev/docs/docker) and [trace viewer](https://playwright.dev/docs/trace-viewer).
