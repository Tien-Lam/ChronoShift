# Final x64 PR gate: implementation evidence and unresolved efficiency

Read-only observation began 2026-10-05T06:54:52Z. Exact source comparison captured
06:55:06.663Z; final run/log/API analysis completed 07:01:24.516Z. This agent is
the implementation/evidence role, not an independent final reviewer. No app,
workflow or test edits, builds, test execution, CI rerun/dispatch/cancel, merge,
publication or frozen-server operation occurred. Evidence is saved in this new
folder without modifying the earlier rejected experiment records.

[Web run 37274709527](https://github.com/Tien-Lam/ChronoShift/actions/runs/37274709527)
succeeded for PR head `b288920d072d6ebb6ca56d1ea83f7c95ea7bed02`, source tree
`c08c0f507faf6f82fac5ce790eb2e1f89fa59cdf`. The `web/` tree is
`78dbdbf65b5328416f0b169cc52d3ed9541d02f9`, unchanged from
`7059da3125ada61123f91d1267bbee9a6f4792ef`. Package/lock/mise, reuse verifier,
attempt reporter and subpath configuration also have zero committed diff against
that base. The final candidate restores four workers and the x64 hosted runner.
Its publishing/source approval remains root's and the independent reviewers' work.

## Full workload and first-attempt outcome

Raw output announces 258 tests using four workers. Independent reconciliation
finds **258 unique cases / 258 initial attempts, 249 passes, nine unchanged skips,
zero failed attempts and zero retries**. Every `(profile, file, static title)` case
and skipped status matches the successful four-worker control; no weaker inventory
or removed case is inferred from a green status. Foldable passes three;
Chromium/Android each pass 51; Firefox/WebKit/iPhone each pass 48 and retain the
same three CDP-dependent skips. Source line offsets do not define case identity.

Unit output reports **116 pass / zero fail**, and the separate subpath gate reports
**one pass**. All required format, unit/build, corpus, browser, image guard,
subpath and upload steps succeed in final jobs metadata. Raw logs and metadata,
every parsed attempt, profile summaries and empty retry/failure evidence are saved
beside this report, with reproducible analysis helpers.

Actual browser-step environment is **CHRONOSHIFT_CI_TIMING: 0**; no ci-timing
reporter line or timing artifact is present. Timing upload and failure diagnostics
steps are skipped. The artifact inventory contains only `github-pages`. Absence
of optional timing is expected and does not establish missing failure evidence.
List, HTML and AttemptReporter remain configured; one CI retry, retry traces,
failure screenshots, the first-attempt marker condition and separate subpath
output remain. This all-first-pass run does not exercise a recovered failure or
attachment retention. Actual passing HTML is not uploaded by the existing policy;
complete counts are established from list output and source policies, not an
unavailable HTML artifact.

## Actual x64 resource observations

Fixed records show Linux x64/kernel `6.17.0-1022-azure`, four logical CPUs and
available parallelism four, AMD EPYC 9V74 80-Core Processor, and 16,766,414,848
bytes visible system memory. The model string does not imply 80 assigned CPUs.
Actual runner image/region, pinned image pull, version guard and managed runtime
details are preserved in `run.log`. Source metadata and CPU observations do not
substitute for direct browser CPU or physical-device measurements.

The snapshots cover 06:54:07.474Z–06:59:54.984Z, **347.510s**. `cpu.max` is
`max 100000`; `memory.max` is `max`; all selected cgroup files are available.
CPU usage increases by 1,202,441,913 microseconds, about **3.460 mean CPU cores**
over that cgroup interval. Own-cgroup throttle/period/burst counters remain zero,
as do all memory/OOM event deltas. Lifetime memory peak rises from 1,518,452,736
to **6,822,293,504 bytes** (about 6.35GiB).

These are observations of the cgroup and descendants over an interval/lifetime,
including preceding setup. The peak is not isolated browser peak/RSS. `max` and
zero own-cgroup throttle do not rule out ancestor constraints, short saturation
spikes or host contention. No independent cgroup ancestry/membership mapping,
affinity mask, CPU frequency, process RSS or per-browser CPU trace was recorded.
Qualification text and exact raw before/after payloads remain in `resources.json`.

## Costs and acceptance verdict

| Measurement | Result |
| --- | --- |
| Run created / updated | 06:53:20Z / 07:00:03Z, 403s elapsed |
| Web started / completed | 06:53:22Z / 07:00:02Z, **400s** |
| Per-job rounded minutes | **7** |
| Interval before first setup step | 1s |
| Container initialization | 27s |
| mise setup | 6s |
| Browser step | 06:54:07Z–06:59:54Z, **347s** |
| Resource-after step | 0s in integer API resolution |
| Subpath step | 4s |

Against the original **untimed** expanded-suite Web (301s/six rounded minutes,
246s browser), this job is **99s slower (+32.89%)**, browser **101s slower
(+41.06%)**, and the rounded proxy one minute higher (+16.67%). Against the
distinct **instrumented** four-worker control (356s/six minutes, 291s browser),
Web is 44s slower (+12.36%) and browser 56s slower (+19.24%). Different source,
instrumentation and runner conditions prevent isolated causal attribution to any
single change. Rejected six-worker, two-worker, ARM and virtualization samples
must not be selected or blended into a claimed final win.

Initial passing list durations sum **1,324.441 test-seconds**, versus 1,112.040s
from the control's rounded list output. These overlapping/wait-inclusive sums are
not runner seconds or CPU time. All current profile medians/p95 values are recorded;
they do not identify a causal hardware or application regression.

**Efficiency acceptance is unresolved.** Seven Web minutes already exceed the
at-most-six complete-pair target before a publishing job. Web alone also exceeds
the 307s raw whole-pair baseline. This sample cannot establish the requested speed/
quota saving, even though all required gate conditions passed. TIE-375 must remain
open. No monthly/account-wide billing or resource-cost claim is supported.

## Artifact and publication boundary

Only Pages artifact 11330240757 is present: 374,697 archive bytes, 24 configured
hours (8,992,728 projected byte-hours), digest
`sha256:87d46fb4d220e5e7951a72b31779d4fb197012a01cfa6915d5646cef75141181`.
This agent records API metadata without authenticating/extracting or publishing
the payload. Root owns exact source/tree/digest/archive/published-file trust.

At this report's observation boundary, there is **no matching main publication**
or measured complete pair. The new static successful-reuse publisher, actual slim
tool/OIDC compatibility, serialized publication and complete manual fallback still
require root's real delivery evidence. A safe, source-reviewed incremental
CI/publishing change can have a passing implementation verdict while the original
efficiency report remains unresolved; this evidence makes no final adoption or
goal-completion decision.
