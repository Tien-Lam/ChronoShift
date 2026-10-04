# Focused code review: regression and evidence/documentation delta

Reviewed `caf1e43deebedb5b9d9e1ba91744f4d9f9ffacd1` against approved runtime `b18150b2a98f4c376f245ffe2eb0e9cabf689318`, then documentation delta through `d54b932c647d2633c731e33be657eef943168741`. Runtime unchanged; final regression unchanged after caf1e43. Retain prior runtime approval and independently tested conditions in `code-final.md` / `/tmp/chronoshift-recurring-offline-code-final.md`.

`tests/offline.test.ts` executes the actual worker template with isolated cache/fetch/Request stubs, injects mismatched private response bytes and asserts independent exact safe error text including canonical bundled path and expected release, exact fresh-key request URL, and staging cleanup. The test would fail bf417719's generic error text. It exercises the rejected first-install path without a controller; it does not claim real browser/deployment acceptance. No blocker found.

Executed in reviewer-owned `/tmp/chronoshift-code-review` using mise-managed Bun 1.4.0: targeted `bun test tests/offline.test.ts` **1 pass / 0 fail / 3 assertions**; full unit inventory `bun test tests` **109 pass / 0 fail / 701 assertions across 5 files**. No broad browser rerun or shared build. Count109 in developer/testing and QA README independently matches this execution.

QA attribution matches my actual before/after/privacy/delta evidence, including explicit 60-second server idle timeout for corrected 22-second transport, qualification of earlier default-idle-timeout outputs, source/artifact identities, tested real deadline, draft recovery and separate unresolved natural-report verdict. Saved `code-final.md` exactly matches my original report. Runtime/root full-suite/Firefox-port/publication/physical acceptance statements are attributed to root or retained as gaps, not claimed as my independent runs.

Requested one documentation correction: the original unqualified assertion that selected zones are never persisted could misdescribe ordinary persisted app preferences. Final d54b932 explicitly scopes excluded fields to diagnostics, states only the opt-in flag is stored, and distinguishes ordinary app preference storage. Confirmed correction; no outstanding findings. Retention of counterpart evidence adds documentation only and does not change my independent tested scope or verdict.

**Implementation verdict:** approved within bounded delta scope for d54b932, retaining unchanged b18150b runtime approval. No blockers.

**Original-report verdict:** still unverified; keep TIE-324 open. User timing remains a few seconds after clicking Convert to. No new natural affected-profile reproduction or matching post-publication evidence was supplied by this documentation/unit-test delta. Historical browser/controller/cache/network identity and physical-device acceptance gaps remain.
