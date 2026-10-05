# Two-worker Linux candidate evidence

Read-only observation began 2026-10-05T06:35:33Z. Final API/log downloads and
analysis completed 06:43:01.625Z; environment/source inspection at 06:43:28Z.
This implementation/evidence agent is not an independent final reviewer. No source
mutation, build/test, CI dispatch/rerun/cancel, merge, publication or frozen-server
operation occurred. The earlier `new-candidate` evidence was not rewritten.

[Web run 37273144333](https://github.com/Tien-Lam/ChronoShift/actions/runs/37273144333)
succeeded for PR head `e632d2f5bb8ff3cfc8c447ab87ae081078ca04c2`, source tree
`dde4284961b04ba81fc7533abc97c0b14efbb39e`. Read-only committed-tree comparison
of `web/` against `7059da3125ada61123f91d1267bbee9a6f4792ef` exited zero; the
runtime virtualization candidate is removed. The same complete browser workload
uses two workers, with fixed machine-resource observations before/after and timing
profiling disabled. Root's publisher changes are not exercised by this PR run.

## Coverage and diagnostics

Raw list output announces 258 tests with two workers. Independent parser finds
**258 unique cases and 258 initial attempts, 249 passes, nine unchanged skips,
zero failed attempts and zero retries**. All `(profile, file, static title)`
identities and skipped status exactly match the successful four-worker control;
source line shifts are intentionally ignored. Foldable passes three; Chromium and
Android each pass 51; Firefox, WebKit and iPhone each pass 48 with the same three
CDP-dependent skips. Unit output confirms **116 pass / zero fail** and the separate
subpath gate **one pass**. All required gate/upload steps succeed in jobs metadata.

Raw logs, every parsed attempt, per-profile duration summaries, empty failure/retry
evidence and machine snapshots are saved beside this report. Actual browser-step
environment is `CHRONOSHIFT_CI_TIMING: 0`; timing upload and failed-attempt upload
are skipped. The sole artifact is `github-pages`. Timing absence is expected.
Exact-head source retains list/HTML/attempt reporting, retry trace, failure
screenshots and the marker-triggered failure bundle, with subpath output isolated.
This all-first-pass run does not exercise failed-attempt retention; source validation
is not a synthetic or actual failure-attachment test.

## Whole job cost

| Measurement | Result |
| --- | --- |
| Run created / updated | 06:34:56Z / 06:42:43Z, 467s elapsed |
| Web started / completed | 06:34:58Z / 06:42:42Z, **464s** |
| Per-job rounded minutes | **8** |
| Interval before first setup step | 0s |
| Container initialization | 38s |
| Browser step | 06:35:49Z–06:42:34Z, **405s** |
| After-resource step | 0s in integer API resolution |
| Subpath step | 4s |

Compared with original expanded-suite Web 301s/six minutes, raw span is **163s
higher (+54.15%)** and rounded minutes two higher (+33.33%). Compared with the
instrumented four-worker control 356s/six minutes, it is **108s higher (+30.34%)**
and two rounded minutes higher. No cause is isolated: source assertions,
instrumentation conditions and runner samples differ. This sample cannot reach
at most six complete-pair rounded minutes against the eight-minute baseline,
because Web alone is eight before any publication work.

Artifact ID 11329377867 is `github-pages`, 374,682 archive bytes, configured
24-hour retention (8,992,368 projected byte-hours), digest
`sha256:601c8c68c4f8501be47f6f6888f40aedf6cc7da84fd5ad3c3b8db0ea1af8aa08`.
This agent preserves API metadata, without downloading/authenticating/deploying the
payload. There is **no matching main publication** and no whole-pair efficiency or
TIE-375 acceptance claim. Root owns that later exact artifact/publication audit.

## Actual resources and their limits

Log environment: Linux x64, Ubuntu 24.04.5, kernel `6.17.0-1022-azure`, runner
2.337.0/image `20260927.320.1`, eastus; same pinned official Playwright image and
version guard. Fixed before/after snapshots record four logical CPUs and
`availableParallelism` four, AMD EPYC 9V74 80-Core Processor, 16,766,414,848 bytes
visible system memory. Those four CPUs are the reported execution environment;
the CPU model's name does not establish 80 available cores.

Before snapshot: 06:35:50.089Z. After: 06:42:34.988Z. Interval 404.899s.
`cpu.max` is `max 100000`; `memory.max` is `max`. `cpu.stat` usage delta is
877,420,592 microseconds, approximately **2.167 mean CPU cores** across the observed
cgroup interval. Own-cgroup period/throttle/burst counters remain zero. All
memory-event counters, including OOM and OOM kill, remain zero. No fields are
unavailable; both resource steps succeeded. These snapshots show no recorded hard
limit, own-cgroup throttling or OOM event. They do not prove absence of ancestor
constraints, noisy-neighbor contention, short saturation spikes or browser latency.

Recorded `memory.peak` rises from 1,524,912,128 to **5,958,569,984 bytes** (about
5.55GiB). It is the **cgroup lifetime peak**, including descendants and preceding
setup; it is not an isolated browser peak or single-process RSS. Total visible
system memory is distinct from a cgroup limit. No affinity mask, cgroup membership/
ancestor mapping, CPU-frequency record or per-browser CPU measurement was captured.
Resources and qualification text are preserved in `resources.json`; no cgroup
limits or counters were changed by this observation.

## Whether three workers is a meaningful next measurement

The resource snapshots do not establish a broken runner or hard resource-pressure
failure. Two workers give shorter per-case durations but worse throughput. From
the same rounded list-duration parser, control initial passing cases sum
**1,112.040 test-seconds**; two-worker cases sum **791.335s**, about 28.84% lower.
Every profile's median and 95th-percentile duration is lower, including WebKit
median 4.6s to 3.0s and p95 11.3s to 7.4s. These are sample comparisons of elapsed
case work with waits, not CPU or isolated worker-count causality. The earlier exact
control timing reporter's 1,111.545s differs because list durations are rounded.

791.335s / two slots is 395.668s, close to the observed 405s browser step. Fewer
simultaneous test slots therefore explains much of the throughput shape without
requiring a large startup hypothesis. A **single three-worker measurement** on the
same restored runtime, assertions, pinned Linux host class, metadata and full cases
is meaningful to test the intermediate throughput tradeoff. There is apparent
average CPU headroom in this observation, but it does not certify peak headroom,
stability or a faster three-worker result. Preserve all retries, resources and
whole-job costs; do not rerun selectively until a fast sample appears.

That experiment is **not yet a credible target-completion forecast**. Even if
three workers retained the shorter two-worker case costs unchanged and achieved
perfect scheduling, 791.335s / three is about 263.8s. Adding this run's 59s outside
the browser gives about 322.8s, above the 300s Web boundary for six rounded minutes
with one publication job. With 59s overhead, Web at most 300s requires browser at
most 241s; three slots would require a passed-case sum below about 723s before
skips/scheduling, over 8.6% below this sample. Those estimates are hypothetical
capacity arithmetic, not a measured prediction or absolute bound across runners.
Setup savings or lower real case durations would also be necessary in that model.

Recommendation: three is justified as bounded calibration if root needs the
worker/latency curve, while the quota goal remains open. Neither the six-worker
retry nor this two-worker green result establishes the final default. After a
chosen final default, require its exact complete PR/main pair and independent
review; publisher slim compatibility and fallback proof remain separate.
