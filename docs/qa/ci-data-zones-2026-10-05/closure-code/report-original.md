# Independent code/evidence closure review

**Documentation implementation: approved within the inspected scope; no blockers.** **Revised objective: the retained ordinary pair exceeds the user-approved10% usage-proxy threshold; retaining the shipped work is supported.** The original20% plus faster-runtime objective was superseded, not achieved. Actual monthly/account/invoice savings remain unestablished. Prototype correctness approval remains bounded and does not authorize adopting either rejected prototype.

## Scope, clocks and identity

Clean-context dispatch is preserved verbatim in [review-brief.md](review-brief.md). Base/head `cea0de547094ba51a598fdc4303409fdf1d36bb7`; tracked implementation change inspected is documentation-only `docs/developer/ci-efficiency.md`, with new closure evidence in the two prototype folders. I inspected current source restoration, original candidate snapshots/reports, the control and closed-probe runners/analyzers, complete retained control logs/structured attempts/inventories, PR41 retained delivery attempts/logs and metric arithmetic. I did not inspect the peer closure verdict before this initial verdict. No browsers, servers, build, CI, publication, GitHub/account access, ticket changes, dependency install or runtime/test changes were performed by this reviewer.

Environment observed: Darwin27.0.0 arm64, mise Bun1.4.0, Node26.8.1 and gh2.100.0. Node/gh were inventory only; audit helpers used mise/Bun. Actual first observation clock was **2026-10-05 12:51:12 UTC**. Independent raw-data readback ran **12:55:15.018–12:55:15.021 UTC**. User steering interrupted the review; no continuous26-minute observation is inferred. Resumed source/document observation began by actual clock **13:19:42 UTC**; final inspection/format result was observed by **13:20:57 UTC**. Final hash/reference snapshot completed before actual clock **13:21:18 UTC**. Report writing follows these observations. Machine clocks remain5 October UTC while the user's latest local context is6 October Sydney.

Exact final reviewed document blobs, in order:

| File                                                  | Git blob                                   |
| ----------------------------------------------------- | ------------------------------------------ |
| `docs/developer/ci-efficiency.md`                     | `441167b404dfea4edb618def8063c8ec4b79349f` |
| `docs/qa/ci-data-zones-2026-10-05/README.md`          | `9583b312de68876b3c3e895ab973d0016f0f9dde` |
| `docs/qa/ci-data-zones-2026-10-05/closure-summary.md` | `080bcbe9ab96222741b456ad1fc94602ab64deb9` |
| `docs/qa/ci-virtualized-zones-2026-10-05/README.md`   | `ed591774a1d4561d366b946618055341dcaf6ee9` |

SHA256 snapshots and actual helper clocks are in [readback.json](readback.json) and [final-docs-readback.json](final-docs-readback.json). The initial final-docs snapshot is preserved separately rather than rewritten as an observation of later document corrections.

## Findings and resolution

One actionable documentation finding was reported: the old PR37/PR39 paragraph said neither met the “current target,” although the current accepted threshold had become10% with slower raw time allowed. Root changed this to the original20% plus faster-runtime target; final blob above includes that correction. No blocker remains.

Source identity checks establish working Choices `d92d280bd71c6c2841a424d1ae9dbc53c203577c`, CSS `ffe5ce02cee2073a9b9dc888304465bf41a361f8` and controls `0a61c6c8fc8b9678d0305348934e69bed1b4dd35` equal HEAD. Runtime/test/workflow/script/package/fixture tracked status was empty. Candidate Choices `3047272ecae9a0c681ff7b09ed0592b00ad40cef` and collection `cc0356e8ae31c2716ffb70b8a8d78a147dc6a5ff` remain saved. Prepared controls `6afcf2482d8a570469acdae0d75067a136d1a7e6` match the preserved final specimen. The runtime-restoration JSON describes the intermediate prepared-test state; later test-restoration and final README correctly describe full restoration. Replay instructions identify the saved preparation and isolated checkout rather than treating today's restored test as the measured specimen.

The data README correctly qualifies candidate-check.log as a truncated tool capture with retained exit0/summary, rather than complete raw unit-test evidence. It retains failed harness originals, missing comparison corrections and overlapping review observations. It keeps renderer counters distinct from elapsed/poll/debounce time, does not extrapolate to Linux273-case savings, and retains actual HTML evidence without deletion/archival. Final closure summary correctly says fresh hosted/offline checks rather than implying an independent explicit-update acceptance journey.

## Independent checks

`mise exec -- bun closure-code/readback.ts` (full repository-relative invocation in [readback-initial-failure.log](readback-initial-failure.log)) passes **280 assertions**; [successful log](readback.log) and [source](readback.ts) remain. Every one of five20-case blocks has20 unique identical identities, one passed retry0 structured result each, complete log summary, no runner errors/failed-attempt marker/retry or failure attachments, and exhaustive distinct14-file pre/post/HTTP hash equality. The predeclared four-block ABBA excludes initial candidate correctness evidence. Independent arithmetic matches means30980.5927705/30817.565125ms and **0.5262250684%** reduction. Passing these blocks establishes80 matched local first attempts, not a full candidate gate.

The closed probe reconciles36 exact phase/engine/sample memberships,108 edits, phase-origin/script association, nested clocks, stable browser versions and14 distinct/exhaustive served files. All18 per-variant Chromium counter differences are finite/nonnegative; means independently reconcile within1e-12 floating-point tolerance. Six contexts share engine-process warmth within phases. Counters overlap categories and exclude worker/whole-system CPU; elapsed readiness/edit observations cannot isolate collection work or establish robust tails.

Initial audit-helper failure was an exact IEEE754 equality comparison of sorted versus original-order TaskDuration summation. Original stderr is copied with provenance in [readback-initial-failure.log](readback-initial-failure.log); exact failed command start/end clocks were not captured and remain unknown. Only my readback tolerance changed; raw observations and production analyzers did not. The subsequent successful helper run is an audit correction, not a first-attempt investigation pass.

`mise exec -- bun closure-code/final-docs-readback.ts` independently reconciles both retained PR41/full-fallback273 unique first attempts:264 pass symbols and nine skip symbols, no retry flag or retry log lines, complete log summaries including116 unit passes. Pair arithmetic includes every runner job, per-job rounding and configured artifact-retention projection: **307→380 seconds**, **8→7 rounded minutes (12.5%)**, **63.05704486% projected retained artifact reduction**. Failed/canceled/manual investigation costs are outside this declared ordinary pair, not erased. Final local evidence links exist except contemporaneously pending code/adversarial closure report files; this report supplies the code target and root must retain the peer report before committing closure.

Scoped `mise exec -- bunx --bun prettier --check` of the four reviewed documents passed; `git diff --check` passed. The format command start clock was not separately captured; its output was observed before13:20:57 UTC. No runtime suite was rerun for this documentation change. Original failures/results/captures remain in their existing locations.

## Separate conclusions and remaining limits

**Implementation:** final documentation correctly records the decision, restored source and qualified evidence; approved with no blocker. Root owns final reference/format verification after both reports are present. Additive report/format-only changes may retain this approval; semantic changes require focused review.

**Objective/report resolution:** documentation change itself has no escaped-bug report to resolve. The revised goal accepts10% usage-proxy improvement with slower raw time and retaining shipped reductions; current12.5% rounded-minute and63.06% surviving-API retention proxies exceed that threshold. This supports the scoped closure without asserting the historical20%/faster objective passed, an actual bill fell, or another runtime optimization was delivered.

No independent current hosted visit, actual billing export, public-policy refresh, account-wide monthly reconciliation, physical device, screen reader, installed launch, share menu, actual zoom or human acceptance was performed. Existing published artifact audits/hosted evidence were read as retained evidence, not recreated. The original historical readiness report and unrelated product acceptance gaps remain open. No Linux/full-suite or production benefit is established for either restored prototype.
