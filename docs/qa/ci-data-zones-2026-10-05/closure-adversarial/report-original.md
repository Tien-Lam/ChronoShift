# Independent adversarial closure audit

**Documentation/implementation verdict:** approved within this evidence-only disposition; no remaining blocker found. Retain the shipped pipeline and reject both additional runtime prototypes. This approval does not approve either prototype for adoption or certify its unresolved interface/lifecycle conditions.

**Original-objective verdict:** the original >=20% plus faster-runtime requirement remains unmet for PR41 and was superseded by the user's revised scope. The shipped pair meets the revised 10% **usage-proxy** threshold and the instruction to retain delivered reductions. Actual monthly-account or invoice savings remain unverified; they are not asserted as acceptance evidence. No separate product/device/update ticket is resolved by this verdict.

## Actual scope, clocks and environment

Base and checkout head: `cea0de547094ba51a598fdc4303409fdf1d36bb7`. Exact dispatched instructions are retained in [review-brief.md](review-brief.md); [brief.md](brief.md) is a separate readable scope summary. No peer closure verdict was read before this assessment.

Actual audit observation windows from the clock tool: **2026-10-05 12:51:00–12:55:39 UTC**, then **13:19:32–13:20:37 UTC** following intentional user interruption and root's resume request. The intervening period is not audit execution time. The offline readback was generated at **12:54:11.983 UTC**. Report writing occurred after the final observation clock. These are this auditor's source/data observation clocks, not newly executed browser timings or estimates reconstructed from file timestamps.

Environment: shared local macOS workspace; offline helper executed with `mise exec -- bun`. Existing probe records identify Darwin arm64/Bun1.4.0 and Chromium153.0.8010.12, Firefox155.0, WebKit26.6. No browser, build, runtime test, CI, publication, Linear write, Git commit, or billing-account request was performed by this auditor. The official public GitHub policy was opened during the initial window; no network operation was performed after resume. Private account billing was neither accessed nor copied into these records.

Final inspected document blobs:

| File | Git blob |
| --- | --- |
| `docs/developer/ci-efficiency.md` | `441167b404dfea4edb618def8063c8ec4b79349f` |
| Data-collection README | `9583b312de68876b3c3e895ab973d0016f0f9dde` |
| Closure requirements table | `080bcbe9ab96222741b456ad1fc94602ab64deb9` |
| Virtualizer README | `ed591774a1d4561d366b946618055341dcaf6ee9` |
| Retained PR41 delivery README | `a46b6fb1df64a0e9e2c696c6af9e89b2703f70c0` |
| Retained paired metrics | `6b2769c1e4e2562ea93320bade193115f27fb136` |
| Closed-probe raw JSON | `eefd6631bfb2f82f43f31681a02449d2a3c74d3b` |
| Controls comparison | `f14d4a6e5231b23b26cb33dae7b3bcc3db93855f` |
| Data-source restoration record | `948977b6e6c1b47573cd3de6d80df2e788d67b8c` |
| Independent readback JSON | `9ad5e65b764b64aa37e28c568bed5365e0dae14f` |

## Findings and resolutions

1. **Historical/current target contradiction, corrected.** The first revised CI document still said PR37/PR39 failed the "current target," despite PR39's seven/eight rounded proxy meeting the revised 10% policy. Root changed this to the **original 20% plus faster-runtime target**, preserving historical results without denying the revised acceptance.
2. **Hosted explicit-update overclaim, corrected.** The closure table initially described "explicit-update/offline hosted evidence." PR41's delivery README explicitly limits its hosted checks to fresh sessions and does not establish existing-tab explicit updates. Root changed the table to **fresh hosted/offline checks**. TIE-370 and historical update acceptance remain separate.
3. **Historical active-goal wording, clarified.** The Virtualizer README's preserved investigation said the goal remained active under 20%. Its final opening now labels the preceding sections historical and directs readers to the later disposition/restoration. This preserves the original investigation rather than rewriting its verdict.

Final data README also states that candidate-check.log is a truncated tool-output capture, not a complete raw unit-test log, while the retained command result reports exit0. The generated report HTML is explicitly retained unmodified; the previous optional archive recommendation is replaced by the actual retention decision. Neither clarification turns limited evidence into general certification.

## Independent evidence challenge

Arithmetic readback reconciles **380/307 seconds** (23.7785% more), **seven/eight rounded job minutes** (12.5% less), and **63.0570% lower projected surviving-API artifact byte-hours**, rounded to63.06%. Retained metric flags remain false for the original20% policy and raw-speed condition. The helper's historical exit1 is not described as a failed runtime gate or a passing invocation. Current CI documentation distinguishes this from the later accepted10% usage policy.

The metrics and documentation explicitly exclude real additional validation costs only from the declared ordinary pair: manual452seconds/ten minutes and canceled investigation26seconds/one minute remain disclosed. Baseline68/current273 configured browser cases and different setup/hardware defeat causal speed attribution. A surviving-API retention projection does not reconstruct all historic missing artifacts or measure accrued monthly storage. No sample is represented as total account billing.

[GitHub's official billing policy](https://docs.github.com/en/billing/concepts/product-billing/github-actions), read during this audit, states that public standard hosted compute is free and distinguishes private allowances and accrued storage. Accordingly12.5% rounded usage cannot establish dollar savings for free public compute;63.06% projected retention cannot establish a10% invoice reduction. Final documents make those limits explicit without exposing private billing data.

The independent offline [readback.ts](readback.ts)/[readback.json](readback.json) validates the raw controls beyond the root summary: four serial ABBA blocks,20 distinct identical case identities each, **80 first-attempt passes**, one result/retry0 each, zero structured errors, full list-log20-pass summaries, zero failure markers, zero skipped/flaky/unexpected outcomes, and matching distinct/exhaustive14-file pre/HTTP/post inventories. Structured attempts contain zero attached retry artifacts. The corresponding on-disk result captures remain distinct evidence; absence of attachments does not establish their absence. Dedicated custom fixture requests are correctly qualified as not all individually hashed.

The separate closed-probe readback validates **36 unique phase/variant/engine/sample contexts and108 edits**, exact phase-origin association, baseline/candidate script identity, stable engine versions, nested clock bounds, and exhaustive14-file response inventories per phase. Chromium counter differences are finite/nonnegative. Renderer edit means independently reconcile **20.3208→17.6056ms ScriptDuration** and **41.0548→36.8904ms TaskDuration**. These overlapping counter categories are not summed. This establishes bounded renderer observations, not robust tails, cold-system startup, whole-browser/worker CPU, a273-case Linux effect, or billing savings. The0.526225% controls effect does not justify the additional context/hook bridge.

Retained PR41 and fallback parsed runner attempts independently count273 distinct identities,264 passes/nine skips and no retry marker. Existing delivery audits supply complete gate/publication evidence; this audit does not claim to have rerun them or independently exercised their browser journeys.

At final read `git diff --name-only HEAD -- web e2e tests .github package.json bun.lock` was empty. Restored source blobs were Choices `d92d280bd71c6c2841a424d1ae9dbc53c203577c`, CSS `ffe5ce02cee2073a9b9dc888304465bf41a361f8`, and controls `0a61c6c8fc8b9678d0305348934e69bed1b4dd35`. The rejected collection is absent from the application tree. Measurement controls used temporary blob `6afcf2482d8a570469acdae0d75067a136d1a7e6`; the README correctly warns that the saved runners read current tests and require isolated reconstruction for replay. No accidental prototype/test-preparation adoption was found.

## Commands and limits

Actual commands included `cat`/`sed`/`rg` source and evidence reads; `git rev-parse HEAD`; scoped `git diff --name-only`; `git hash-object`; `mise exec -- bun` offline JSON arithmetic/count readbacks; and `mise exec -- bun docs/qa/ci-data-zones-2026-10-05/closure-adversarial/readback.ts > docs/qa/ci-data-zones-2026-10-05/closure-adversarial/readback.json` (exit0). The readback writes only this auditor's new evidence. Existing analyzers were read, not rerun over their original outputs.

Audit lookup errors are retained in the tool history: README did not yet exist during concurrent creation; guessed `web/components/Choices.tsx` was absent (corrected to `web/src/components/Choices.tsx`); guessed hosted JSON filenames were absent (actual retained files are hosted logs/clocks). These were read-only lookup failures and changed no evidence or source. They are not product failures or browser retries.

No physical phone, screen reader, actual zoom, installed/share-menu, comprehensive prototype lifecycle, historical update cause, or actual monthly dollar-saving claim is approved. Original raw failures, uncertain geometry timing and narrowed reviewer conclusions remain preserved. The final closure table acknowledges those separate gaps. Root owns final formatting/reference checks and documentation delivery; this scoped approval needs no additional runtime gate or deployment.
