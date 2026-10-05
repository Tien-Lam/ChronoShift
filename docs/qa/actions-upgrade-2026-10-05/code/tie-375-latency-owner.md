# TIE-375: bounded latency-owner investigation

Read-only observation 2026-10-05 09:49:37–09:51:43 UTC; report saved09:52:29 UTC,
explicit repository cwd.
No CI dispatch, installation, application/test change or browser run. Inspected
validated eef timing/raw logs, resource counters and the directly implicated
worker/fixture source; did not revisit the complete experiment history or read
the adversarial timing verdict.

**Concrete hypothesis:** repeatedly starting the conversion worker may waste CPU
and response time after otherwise ordinary edits. This is measurable and distinct
from the rejected bulk menu snapshot idea, but the saved evidence cannot yet
establish its contribution or a target-sized saving. TIE-375 remains open.

The retained run37288000068 (eef head) has a 417-second Web job and a
361.308-second timing-reporter envelope. Its validated file contains all259
attempts for258 configured cases: one failed original, one passed retry and nine
skips. It was instrumented, on EPYC7763 x64 Linux with four workers; it is not the
ordinary final273-case workload or a completed Web/Pages pair. Timing SHA-256
is `423d4efb9cfc5d4e9157659f4ffbe4f2544f534873bbf6039259c55860fa9fee`;
raw log SHA-256 is
`be511e97a5659f62b084b0b68aa7e2f5e1ee591d62f7da62932fc1c210dfe702`.

Raw cgroup snapshots bracket362.257 seconds. Usage increases1256.638 CPU seconds,
or3.469 average cores; recorded throttled time and OOM-event deltas are zero.
The lifetime memory peak is6.605GB. These counters indicate sustained work rather
than an obviously idle runner, but they are not per-browser/per-worker CPU
attribution; host/ancestor contention and earlier memory use remain unmeasured.

Attempt durations sum1388.463 seconds. With unchanged durations, an ideal four
slots would take347.116 seconds versus the measured361.308 envelope: only14.192
seconds of arithmetic scheduling slack. Ordering alone therefore has insufficient
headroom for the ordinary-pair target, even before new cases. This is a scheduling
bound for these observed durations, not a CPU model or a faster-run prediction.

The largest leaf counter is expectation waits546.439 aggregate seconds, followed
by click176.363, navigation123.767, explicit waits113.118, and page creation109.913.
Those are overlapping runner-observed operation durations, not independent
CPU costs. The menu-layout case at controls.spec.ts:55 totals140.020 aggregate
seconds across five profiles, with71.792 in clicks. This does not justify removing
its assertions, motion or geometry coverage, or retrying the already rejected
bulk snapshot approach. The successful retry alone adds7.719 attempt seconds;
fixing one flake cannot explain the whole deficit.

## Measurable worker lifecycle hypothesis

App creates a fresh Worker after every250ms debounce and terminates that Worker
on completion, error, invalidation and cleanup. Its reviewed blob is
`8bec3cbf656e92265f9f586fb9443de6e3c5aecc`; worker.ts blob is
`8a67925eda1f96119484bd34bc3eec42d873682d`. The worker imports the conversion
engine before accepting a message, then performs a synchronous conversion.
Thus every settled conversion repeats worker/module startup even when the last
worker finished successfully. The existing `conversion.complete` elapsed clock
starts before construction and combines startup with conversion; eef's ordinary
cases do not retain enough such events to separate the two. Counts of737 fill
calls are not a count of conversions or worker launches.

A bounded candidate to investigate later is retaining **only a completed idle
worker**, while still terminating an actively processing stale request on edit
and guarding every completion by request/worker identity. Keep the250ms debounce,
real worker execution, independent exact conversion expectations, invalidation,
IME/cancellation behavior and explicit update/offline release identity unchanged.
An idle worker must belong to its current document/release and terminate on error,
unmount or navigation; it must not add input history, logging or storage.

Before implementing or dispatching CI, measure fixed counters for constructor
count, cold-first-response and warm-next-response on controlled normal-motion
edits, with unchanged exact result checks and no input/zone payload metadata.
Compare repeated new-worker and same-idle-worker controls with the same inputs,
including invalidation while active and release replacement. If startup is small,
reject this hypothesis. Saved timing/resource data supplies no present evidence
that retaining idle workers saves the required49-plus wall seconds.

## Acceptance arithmetic and limits

Latest accepted ordinary PR39 pair is330-second Web plus26-second Slim publication
=356 seconds/seven rounded minutes, versus307/eight baseline. With a26-second
publication, a new Web must be **under281 seconds** to satisfy raw pair<307;
that also puts it within five Web minutes plus one publication minute. Therefore
the observed PR39 workload needs over49 seconds saved, plus the added15 cases'
cost. Browser time there was269 seconds; if its61-second setup/other span stayed
fixed, browser time would need to fall below220 seconds. Actual future spans and
publication durations must be measured, not assumed.

At most six versus eight rounded whole-pair minutes gives25% reduction and meets
the requested at-least20% threshold. All273 configured cases/264 runnable plus
nine capability skips must remain, with clean first-attempt/diagnostic accounting.
The baseline had68 cases, so meeting that historical target would not establish
a controlled same-workload speedup. PR39's projected artifact byte-hours were
63.15% lower, already beyond the storage threshold in that sample; preserve
rollback/diagnostic retention and verify the actual future pair's artifact data.
Neither this hypothesis nor the saved eef diagnostic upload proves a new saving.
