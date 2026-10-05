# Remaining ticket-closure audit

Conclusion: existing records do not support closing the eleven remaining tickets
in the saved planning map. Nine lack capability-specific physical/installed/human
acceptance; TIE-370 lacks its historical Chromium cause; TIE-375 lacks the requested
usage reduction. Completing the current TIE-376 migration does not resolve these
other acceptance criteria. No hypothetical ticket is proposed.

Actual local observation window: 2026-10-05 09:09:44–09:10:42 UTC. Report writing
follows. Explicit cwd `/Users/tien/Developer/ChronoShift`; local cat/sed/rg reads
and mise-managed Bun JSON projection only. No tests, browser/API/Actions/Linear
operations or mutations outside this QA report. No current code-reviewer/helper
output was consulted. Broad inventory search surfaced historical review excerpts;
closure conclusions below use the planning map, acceptance table and retained
delivery/measurement records, rather than those verdicts.

## Snapshot boundaries

`docs/planning/offline-web-linear-map.json` was captured at
2026-10-05 07:06:49.455 UTC. Independent recount: 44 entries, 32 Done,
11 In Progress, one Canceled, zero Todo. TIE-376 is absent from this older snapshot;
it cannot serve as current live Linear state. Its publication/metric summary is
also PR37-era. Later PR39 evidence records the accepted 356-second/seven-minute
pair. Updating these local summaries after actual delivery is obtainable evidence
maintenance, not proof that a remaining acceptance ticket is complete.

Sources read: the planning map; `docs/planning/web-acceptance.md` remaining table;
`docs/developer/device-smoke-test.md`; acceptance-audit README; CI lifecycle,
CI efficiency, held conversion-sync and maintenance-grouping READMEs; saved
maintenance pair JSON; existing manual-fallback report/retry metadata. Existing
source and actual release identities retain their own dates. This is a local
record audit, not a fresh hosted or ticket-state verification.

## Capability-specific work still missing

| Existing ticket | Acceptance still needed |
| --- | --- |
| TIE-304 | Real phone paste/type to live results and actual 200% browser zoom with long input. |
| TIE-306 | Actual screen-reader use of the offline timezone selector and supported aliases. |
| TIE-309 | Real screen-reader end-to-end meeting/CST/target/copy/offline journey, appropriate announcements, task friction and actual 200% zoom. |
| TIE-311 | Installed offline launch on Android, iOS and desktop, recording supported behavior per platform. |
| TIE-312 | Preferences survive actual installed-app restart. |
| TIE-314 | Supported native OS share sends text into the installed app while offline. |
| TIE-317 | Real Android Chrome and iPhone Safari cached offline restart, selection and copying. |
| TIE-318 | Named representative-phone cold online/warm offline startup and typical/10,000-character conversion p95 plus editing/Clear responsiveness. |
| TIE-320 | Actual installed production app offline restart and conversion of newly entered text. |

The recorded available browser surface has no native/phone/screen-reader/actual
zoom control. Desktop automation, engine/mobile emulation, CSS resizing, POST
interception and screenshots already supply supplementary evidence; repeating
them would not replace these missing capabilities. Physical device availability
has not been established. A real Android/iPhone/desktop installed session could
collect several of these criteria together using the existing smoke checklist,
with release SHA/device/OS/browser/posture/network/observed outcome recorded, but
it is not currently an available agent-only closure path.

## Historical cause and efficiency

TIE-370's missing historical controller/cache/probe evidence cannot be recreated
by another clean pass. Existing bounded readiness mitigation and navigation-capture
handling are documented. The PR37 efficiency record states that an actual
successful-retry diagnostic bundle already demonstrated the older upload
retention path; this audit did not redownload that bundle. Do not describe that
old retention acceptance as wholly unfinished. The upgraded v7 failed-retry
upload remains a distinct unobserved migration condition. On an actual future
recurrence, preserve first-attempt logs/traces, controller/active/waiting state,
release/cache identity, timing and draft/recovery outcome before interpreting
cause. An induced timing equivalent can verify mitigation but cannot identify
the lost historical cause.

TIE-375 remains objectively unmet. The latest accepted normal pair is 356 runner
seconds/seven rounded proxy minutes against 307/eight baseline, with 63.15% lower
API-based projected artifact byte-hours. Raw usage is higher; the unchanged tool
records false target flags. Arithmetic implies at most six whole proxy minutes
for the 20% quota criterion. The stricter all-metric flag also needs raw time at
most 245.6 seconds; the tool's exit status separately requires any raw speedup
(less than 307 seconds), plus 20% quota and storage reductions. Neither current
result qualifies under either reading. Monthly billing savings are not established. The older
442/eight record and the held PR38's 455-second Web gate are separate samples,
not the latest accepted pair or a sufficient counterfactual.

The local dropdown CPU sampler's negative intervals invalidate its weighted
rankings. Rejected ARM/concurrency/virtualization/runtime experiments and the held
test helper do not supply an accepted Linux whole-pair improvement. No new
optimization cause or source change is supported merely by the migration gate.

## Next concrete useful path

First finish TIE-376's already authorized exact-tree gate, direct timing upload,
trusted automatic reuse, manual fallback and hosted/public-byte evidence. Keep
instrumented gate and manual validation usage separate from the ordinary pair.
Afterward, inspect the saved final timing/resource artifact locally to locate
the dominant unchanged browser journeys without dispatching another gate solely
for exploration. Compare their original source/fixture/profile identities and
valid unsampled durations; discard invalid profiler weight claims. If that
evidence identifies a bounded cost owner, derive a focused Linux control/candidate
experiment with original assertions and independently valid clocks before a
source optimization. Then an accepted normal full verification/publication pair
must establish the target. If the available artifact has only per-test totals,
it identifies where time went, not the causal mechanism; report that limit.

With the current capabilities, the useful subsequent work is valid efficiency
analysis/evidence maintenance. Closing the nine physical/human tickets or
retroactively declaring TIE-370's old cause resolved would exceed the evidence.
