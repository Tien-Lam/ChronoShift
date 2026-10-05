# Additive restoration and test-preparation review

This addendum preserves [original-review.md](original-review.md) and every original runtime failure. It does not reclassify rejected virtualization v1 as fixed or approved.

Actual bounded source/diff observation checkpoint: **2026-10-05 12:07:52 UTC** (clock read immediately after identity/diff commands). Exact read start is unknown. No further browser, build, Actions, performance or offline/update activity was run for this delta. Report-writing completion is recorded separately after saving.

Verified restored production identities:

- Choices `d92d280bd71c6c2841a424d1ae9dbc53c203577c`.
- CSS `ffe5ce02cee2073a9b9dc888304465bf41a361f8`.
- Current `e2e/controls.spec.ts` delta `818f2099bf567cd6f50ab0cf2978b211ed389211` versus original `0a61c6c`.

The complete tracked diff inspected in these three files is five added test lines after `enterZone("CST")` and before the first canonical `Asia/Tokyo` fill: explanatory comment, native `scrollIntoViewIfNeeded()`, native input `click()`, and an observable closed-popup assertion. The loop still exercises both fields. Canonical identity, alias hover/Tab retention, independent other field, deliberate key selection, later input-driven pointer reopening and exact result assertions remain intact. No sleep, force action, timeout increase, ownership weakening, timer change or application workaround is added.

**Bounded implementation/test delta verdict: approved by source review; runtime efficacy of this exact five-line delta remains pending root's targeted run.** The correction is justified by the independent matched Firefox event evidence in [source-focus-results.json](source-focus-results.json): both original-fill builds open then close during a native one-pixel ancestor scroll; both native preparations allow that scroll while closed, then retain the canonical value through alias hover and Tab. The installed unchanged overlay owner deliberately dismisses on trigger-ancestor scroll. The new preparation establishes the normal native interaction prerequisite before asserting input-driven opening. It preserves the behavior being tested.

Evidence qualification: my comparator included native preparation before CST as well as before the canonical fill; it is not a separate execution of the exact five-line-only test delta. Its event log still observes the post-CST scroll completing before the final canonical fill. Root's corrected five-profile hovering check under `controls/3-baseline` was pending when this addendum was written. It is a targeted correctness run, not a complete gate or valid performance comparison. No independent all-profile claim is inferred from my Firefox/iPhone controls.

**Rejected v1 verdict remains blocked.** Its immediate native post-wheel click loss and screenshot-free candidate iPhone ResizeObserver errors are preserved. Restoring baseline production sources removes that candidate from delivery; it does not prove an alternative virtualization integration safe. V1 source preservation is owned by root under `v1-source`.

**Additive count correction:** the original report's phrase “454 desktop or479 WebKit” was overly broad. The exact baseline-derived logical collections in `filter-and-typing-correction-results.json` are Chromium454, Firefox479 and iPhone479. Baseline mounts454/479/479 respectively; candidate initially mounts8 in each. This correction changes no runtime finding or rejection verdict.

**Original CI objective remains unresolved.** No monthly-goal, runner-minute, artifact-cost, publication, physical-device or screen-reader acceptance is claimed by this restoration/test delta.
