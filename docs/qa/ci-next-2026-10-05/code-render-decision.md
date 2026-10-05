# Independent reconciliation — rejected rendering prototype

Additive reconciliation of the saved measurements/decision, performed **2026-10-05 10:48:07–10:49:47 UTC** using actual clock observations. This reviewer did not execute any browser, build, project measurement helper, CI or API operation. Standalone mise-Bun code parsed saved files and hashed retained assets. Original source reviews and measurement files remain unchanged. Prepared code-lifecycle journeys were never executed and must remain unexecuted for this rejected prototype.

Exact preserved rejected source independently hashes to App `8a72819c1c20cc6e20b168578d76e71e80e9af29`, Choices `61cfa2b0e23279b9986d816119f0d722272c6bfd`, matching initial approval scope. Current production files independently hash to their baseline versions `8bec3cbf656e92265f9f586fb9443de6e3c5aecc`/`d92d280bd71c6c2841a424d1ae9dbc53c203577c`. The root's revert decision is therefore reflected in source; this is not publication verification.

## Corrected 72-row probe

Raw observation interval **10:27:48.815–10:28:42.708 UTC**, Darwin/arm64. Bundled Chromium **153.0.8010.12**, Firefox **155.0**, WebKit **26.6**. Independently counted 72 rows: three engines × ABBA blocks × six conversions, with 12 baseline and 12 candidate samples per engine. Raw errors array is empty. Every saved expected time matches its observed time, normal motion is recorded for every row, and elapsed/within-page pending-to-settled differences are finite. Probe source retains independent date/UTC/count assertions. The separate initial UTC-label oracle failure produced no measured rows and is not counted as a pass.

Independent recalculation reproduces saved summary:

| Engine   | Mean page pending-to-DOM reduction | Mean assertion/protocol elapsed reduction |
| -------- | ---------------------------------: | ----------------------------------------: |
| Chromium |                         5.741667ms |                                6.073448ms |
| Firefox  |                         4.083333ms |                                2.826448ms |
| WebKit   |                         0.500000ms |                               85.154705ms |

Raw Chromium counter differences are finite/nonnegative: mean TaskDuration **41.317→33.552333ms**, ScriptDuration **17.883167→12.099083ms**. Categories are not additive and exclude worker/other-process CPU. MutationObserver settled time is a DOM commit with busy=false/result present, not paint or animation completion. Assertion elapsed includes polling/protocol; WebKit's large assertion change cannot support a comparable rendering claim. No time-weighted sampler inference is used.

## Four complete browser-workload blocks

The driver invokes only Playwright with the inherited project config and four workers/CI viewports/raster, retries0, matched list+HTML+attempt+JSON reporters, normal motion except existing explicit reduced-motion tests. These are complete **273-case browser-workload runs**, not executions of the entire 116-unit/root-build/subpath/publishing gate. Main/Pages trust and runtime acceptance cannot be inferred from them.

| Block       | Actual command observation interval UTC | Elapsed seconds |
| ----------- | --------------------------------------- | --------------: |
| 1 baseline  | 10:31:23.119–10:33:40.518               |      137.399659 |
| 2 candidate | 10:33:40.521–10:35:56.496               |      135.975625 |
| 3 candidate | 10:35:56.499–10:38:12.516               |      136.017916 |
| 4 baseline  | 10:38:12.518–10:40:30.226               |      137.707367 |

Independently walked all four original `report.json` suite trees: each contains 273 identities, 264 passed/9 skipped, exactly 273 attempts, retry0, no result/global errors, no flaky/unexpected stats. Identity and skip sets match all blocks. Each `.last-run.json` records passed/no failed tests; no attempt-failures marker exists. Independently hashed every recorded clock identity path against that block's preserved served-dist and all match; baseline/candidate identities remain distinct and consistent within each pair. These recorded identities include HTML/main JS/CSS/release/service worker, not a reviewer-created complete transitive artifact manifest.

**Raw-log evidence limitation:** each original `run.log` contains final 264-passed/9-skipped summaries and no parsed failure completion, but only **254 distinct per-case completion ordinals**. The same 19 ordinals are absent in each: 10–15, 17–27, 29–30. One completion is embedded in a warning line. The driver directs stdout and stderr to the same Bun file; overlapping/interleaved writes are a plausible log-capture cause, not independently demonstrated. Preserve originals; do not describe these list logs as complete per-attempt records. Structured reports/attempt marker/stats corroborate zero recorded unexpected attempts/retries, but missing raw lines remain an explicit evidence gap. Root was notified before this report.

Independent mean arithmetic exactly matches reconciliation.json: baseline **137553.512979ms**, candidate **135996.770480ms**, reduction **1556.742500ms / 1.1317359%**. Four local blocks provide bounded evidence of a small workload difference, not a statistical significance estimate or a Linux throughput/publishing-pair measurement.

## Separate verdicts

**Implementation/source:** initial bounded source approval stands for the preserved rejected blobs. Rejection is based on insufficient demonstrated value for this CI task, not an observed source defect. The planned competing reviewer lifecycle/visual/device journeys were unexecuted; the original limitations remain.

**Decision:** agree with declining to ship this runtime prototype for the CI goal and preserving source/probe/raw outcomes before reverting. Do not create a fresh CI run solely to infer target-sized value from the 1.132% local result. Subsequent sparse/scheduling changes require their own exact-scope validation.

**CI-goal resolution:** open/unverified. None of this establishes >=20% Actions quota/storage reduction, an improved raw Linux PR/main publishing pair, hosted release readiness, physical usability or historical-user recovery. Original reports are not resolved by passing related local workloads.
