# Independent additive reconciliation of the rejected render prototype

Read-only observation interval: **2026-10-05 10:48:13–10:49:53 UTC**, direct clock results, shared macOS/Darwin ARM64 checkout. This is subsequent independent reconciliation, not the time at which the original browser measurements ran. No probe, analyzer, suite, browser, build, CI or API was executed here. Only read-only `jq` reductions through `mise`, source/log reads, directory comparisons, SHA-256 and Git hashes were used.

## Exact retained scope

Base is `f8c073a289f2c4af1f369a4588d5e0e74daf392c`. Rejected source copies independently hash to App `8a72819c1c20cc6e20b168578d76e71e80e9af29` and Choices `61cfa2b0e23279b9986d816119f0d722272c6bfd`, matching the original review. Current production App `8bec3cbf656e92265f9f586fb9443de6e3c5aecc` and Choices `d92d280bd71c6c2841a424d1ae9dbc53c203577c` have no diff from base. The working source scope now consists of workflows/documentation and the additive publishing assertion, not the rejected runtime edits.

Retained evidence Git blobs: render raw `d9abc9ff941d5447a2ac8d31ba2657714e194833`; render summary `6831a4cb49b5cfb1072decdfc64acba9eb496916`; macro reconciliation `2290eab7b1b5879337628f3d7b75eab96b655fbd`; clocks `959c019bb2db4a257fd2bdd4d7a9de7fe05dda5f`; macro config `c992cd0f70d8bd89f8edabfaf07c266bac4cd355`; driver `e56cf4b1f26ed41fe6ecaf1699cac33697841074`; decision `0b94cd1139df93f48b68990385e4cb6ade2ade0a`. The original adversarial report remains `38e2bf19817ee4b1745e5fc936460856d1d0e621` and sparse report `02aecf75ade4f2c3f25af586f533044ea5f4a8a5`.

## Native probe reconciliation

Original failed setup: **10:27:30.070–10:27:37.030 UTC**, zero measured rows, one preserved assertion error expecting `UTC+00:00 UTC` instead of actual `UTC`. This remains a probe-oracle setup failure, not an App failure or measured pass.

Corrected probe: **10:27:48.815–10:28:42.708 UTC**, 72 measured rows, zero raw errors. Independent reductions find exactly six rows per engine/variant/block, baseline blocks 0/3 and candidate 1/2, 12 rows per engine/variant. All rows have owned pending/settled timestamps in order, normal-motion observations and the expected exact time. Recorded versions: Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6. Independent page-clock mean differences reproduce native pending→DOM-settled gains of 5.742 ms, 4.083 ms and 0.500 ms respectively.

Independent CDP reductions reproduce nonnegative main-thread counter deltas: Chromium mean task 41.317→33.552 ms and script 17.883→12.099 ms. These nested counters are not additive, do not include all worker/process CPU and are not paint/animation completion. WebKit's action/assertion mean improvement of 85.155 ms with only 0.500 ms native difference must not be presented as an 85 ms rendering gain. The page observer includes production debounce; assertions and page clocks are distinct observation windows.

## Whole-browser-workload reconciliation

The matched macro driver runs the complete configured 273-case browser workload, **not the entire unit/build/subpath/publication workflow**. Its dedicated config preserves base browser projects/fixtures/viewport policy, four workers, list/HTML/attempt reporters and adds JSON; it sets retries to zero on both sides. Normal CI still retains its existing one-retry policy. Neither a unit pass nor subpath/publication acceptance is inferred from these four browser reports.

| Block | Actual driver interval UTC | Elapsed seconds | First pass / skip / failed / retry |
| --- | --- | ---: | --- |
| 1 baseline | 10:31:23.119–10:33:40.518 | 137.399659 | 264 / 9 / 0 / 0 |
| 2 candidate | 10:33:40.521–10:35:56.496 | 135.975625 | 264 / 9 / 0 / 0 |
| 3 candidate | 10:35:56.499–10:38:12.516 | 136.017916 | 264 / 9 / 0 / 0 |
| 4 baseline | 10:38:12.518–10:40:30.226 | 137.707367 | 264 / 9 / 0 / 0 |

Independent reductions of the original four JSON reports find 273 unique project/spec identities and exactly one retry-zero result per case in every block, 264 passed/nine skipped, empty report errors, zero unexpected/flaky stats and four actual workers. Raw identities/statuses are equal across all four reports, independently of the implementer's reconciliation flag. Logs retain the 264-pass/nine-skip summaries, and searches found no attempt-failure marker, error-context or failure trace. This reconciles the first-attempt claim across structured results, runner logs and retained output instead of relying only on green exit status.

The two complete baseline served directories compare byte-identical; so do the two candidate served directories. Independent SHA-256 checks of representative HTML/main JS match the recorded maps: baseline HTML `714f01bb...`, JS `764439ad...`; candidate HTML `ed988ed4...`, JS `137c64d1...`. The driver hashes HTML-linked assets plus release/service worker, rather than every imported file; archived complete directories allow later inspection. Baseline `release.json` identifies `35e11bac657a0c379fda48af9b454e674d2ea854`, candidate identifies `local`; both have base `/`. Thus these are local comparison assets and cannot establish an exact committed Pages publication candidate or subpath trust.

Arithmetic reproduces means **137.553513 s baseline / 135.996770 s candidate**, saving **1.556742 s / 1.131736%**. Two blocks per variant on Darwin ARM64 do not certify statistical significance, Linux quota rounding, artifact storage reduction or a successful complete PR/main pair. The decision to decline the prototype for this CI target follows the bounded measurements without claiming target-sized savings.

## Verdicts and remaining gaps

**Implementation/decision:** the original bounded source approval remains true for the exact preserved prototype. The decision to retain evidence and revert the runtime prototype is supported by the measured small whole-browser gain. Current production files are restored to base. This is not a new approval to ship the rejected prototype.

**Original CI-goal resolution:** unresolved; the measured 1.132% local browser difference is below the requested ≥20% Actions quota/storage goal and does not measure that goal. Keep TIE-375 open.

The prepared adversarial browser folder contains only `conditions.md` and `journeys.ts`; no raw result/capture files exist. Open-popup parent-settle, non-value device-placeholder, custom reset recovery and theme/resize competing journeys were **not executed** and are not claimed as passes. Original review reports remain immutable. Physical/historical/publishing acceptance and Linux complete-pair evidence remain open. The scheduling/sparse candidate is reviewed separately and receives no inherited efficiency claim from this rejected runtime experiment.
