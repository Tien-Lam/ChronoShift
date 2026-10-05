# Verified Actions migration and copy-focus delivery

PR40 merged as `a868e4b956caf5d227edc430fc7dca97c0dc2eb6` after two independent
clean-context reviews. Head `7631906bdd654fd696596f74b733cf87d415cebf`, tested
merge `24a9d920a3c3bb71edcc860b8207442f462d9b8a` and merged main share tree
`44a2096e710983603a85193c2cd33c05461145cb`. App ownership fix and regression
details are in [the copy-focus record](../copy-focus-2026-10-05/README.md).

| Path                 | Run                                                                             | Full-gate result                                                                                  | Artifact/release identity |
| -------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------- |
| Final ordinary PR    | [37292552858](https://github.com/Tien-Lam/ChronoShift/actions/runs/37292552858) | 116 units, 264 first browser passes, nine capability skips, one subpath pass; no failures/retries | Tested merge `24a9d920…`  |
| Automatic Slim reuse | [37293327085](https://github.com/Tien-Lam/ChronoShift/actions/runs/37293327085) | Exact successful artifact reused; one executed publishing job                                     | `24a9d920…`               |
| Full manual fallback | [37293668474](https://github.com/Tien-Lam/ChronoShift/actions/runs/37293668474) | Same 273-case inventory/116 units/subpath, no failures/retries; three executed jobs               | Merged main `a868e4b…`    |

The [final CI reconciliation](../copy-focus-2026-10-05/final-ci/review.md) and
[manual reconciliation](../copy-focus-2026-10-05/manual-ci/review.md) retain raw
attempts, logs, hashes, exact source and actual clocks/environment. All 258 old
browser identities remain, plus fifteen new cases. Container verification uses
UID/GID1001; upgraded configuration/upload run there, with deployment on the
separate runner in fallback. Different Intel/AMD runner hardware is recorded.

[Automatic byte audit](root/publication-reuse-audit.json) passes 67 checks and
[manual byte audit](root/publication-fallback-audit.json) passes 68, each matching
all fourteen published files. The [action reuse audit](root/action-reuse-audit.json)
and [fallback audit](root/action-fallback-audit.json) establish the required named
upgraded steps with exact pinned workflows. Conditional direct timing and
flaky-success diagnostic uploads executed on the earlier held eef gate; both
archives/digests were verified. The final ordinary and manual gates correctly
skip those branches. Actual timeout/cancellation and rollback remain unexercised.

Four hosted offline checks pass for each path, including the 21-second idle
boundary and fresh offline input after reopen. The six [hosted focus checks](../copy-focus-2026-10-05/hosted/reconciliation.json)
pass first attempts on Chromium/WebKit, with normal motion and JS/CSS hashes
matching the automatic artifact. Manual publication retains identical App JS/CSS;
its different release metadata is independently verified. Root's actual browser
side-panel Update now journeys retain the Tokyo draft, target, result and ready
state on both paths: [automatic capture](root/published-reuse-side-panel.json),
[manual capture](root/published-fallback-side-panel.json). Both captured warning/
error lists are empty; neither observation identifies worker/cache internals.

Original failure/report and passed-retry trace remain distinct. Independent
adversarial review of saved automatic evidence supports bounded TIE-377 closure;
its missing historical fill interleaving remains qualified. The exact focused
old-source failure/candidate success establishes the equivalent deferred-focus
race, not TIE-370's historical offline cause. Physical installation/share,
folding, screen readers, actual zoom and representative-phone p95 remain open.

## Efficiency and collection limits

The [ordinary pair](root/paired-metrics.json) uses **386 runner seconds/seven
rounded minutes**, versus307/eight baseline:12.5% lower minute proxy,25.73%
higher raw usage,63.13% lower surviving-API projected artifact byte-hours.
The target remains unmet. Baseline had68 browser cases versus273 now; workload,
hardware and setup differ, so this is not causal or monthly billing evidence.
Manual fallback adds375 seconds/eight minutes of validation, recorded separately.
Local [worker-startup measurement](code/worker-startup/README.md) finds15.50–26.25ms
per-request savings from idle reuse, with exact independent output checks, but
does not establish a target-sized CI benefit. App worker lifecycle stays unchanged.

The first QA action-audit invocation failed on Bun's string file-URL handling;
the corrected URL-object argument succeeds. Exact invoked source/self-hash,
original error and subsequent formatting are [retained](root/helper-execution-correction.md).
The hosted reporter initially wrote to a config-relative nested directory; exact
raw bytes were copied to the intended location with the original preserved.
The manual parser initially filtered the reusable job's UNKNOWN STEP labels,
giving a caught zero-row false negative; its original and corrected raw analysis
are preserved. These collection corrections did not change App assertions,
published files, gate outcomes or require another runtime suite.

This additive evidence is saved after the exact tested head; it belongs in a
documentation-only follow-up, avoiding another gate or deployment solely to
annotate results. TIE-375 and historical/device acceptance stay open.
