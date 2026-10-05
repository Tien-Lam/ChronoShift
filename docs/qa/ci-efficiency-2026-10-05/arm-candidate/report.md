# Rejected ARM candidate: full Linux gate evidence

Observation began 2026-10-05T06:46:22Z; final raw downloads and analysis completed
06:53:19.223Z. This implementation/evidence agent performed no build/test, app or
workflow mutation, CI rerun/cancel/dispatch, merge/publication or frozen-server
operation. The source/evidence role is separate from independent final review.

[Web run 37274080414](https://github.com/Tien-Lam/ChronoShift/actions/runs/37274080414)
completed successfully for PR head `52e8d9c3bc2ba50f6ba2990dde5a128a37849172`,
tree `99a2f2a9a9661b11cb41dc40fb2620d40b2f5428`. The read-only committed-source
comparison confirms `web/`, package/lock/mise, reuse verifier, attempt reporter and
subpath config are identical to base `7059da3125ada61123f91d1267bbee9a6f4792ef`.
The candidate restored four CI workers and used ubuntu-24.04-arm with the same
pinned official image index; no runtime virtualization remains.

Root rejected ARM for speed/quota after this full result. **No architecture or
browser compatibility failure was observed.** A passing gate cannot establish a
cost saving. There is no matching main publication or TIE-375 completion claim.

## Complete attempt inventory

List output announces 258 tests using four workers. Independent parsing finds
**258 unique cases / 258 initial attempts, 249 passes, nine unchanged skips,
zero failed attempts and zero retry attempts**. Case identities `(profile, file,
static title)` and skipped statuses match the successful x64 four-worker control
exactly. Foldable passes three; Chromium/Android each 51; Firefox/WebKit/iPhone
each 48 with the same three CDP-dependent skips. No ARM-only case was skipped.
Units report **116 pass / zero fail**; repository-subpath test reports **one pass**.
All required gate/image/upload steps succeed in final jobs metadata.

Every parsed attempt, per-profile durations, raw output, retry/failure lines,
run/jobs/artifacts and fixed resources are preserved beside this report. The actual
browser-step environment states **CHRONOSHIFT_CI_TIMING: 0**; no ci-timing reporter
line or dedicated timing artifact is present, and its upload step is skipped.
The failure bundle step is also skipped, consistent with zero failed attempts.
Existing list/HTML/attempt reporters, retry trace, failure screenshot and marker
policy remain source-validated. Their failure-retention behavior was not exercised
by this entirely first-pass run. A passing HTML artifact is not retained by policy.

## Actual environment and image relationship

Fixed observations confirm Linux **arm64**, kernel `6.17.0-1022-azure`, four logical
CPUs and available parallelism four. CPU model is reported as **unknown**, so no
processor-family or physical-core-speed assertion is supported. Visible system
memory is 16,722,046,976 bytes. Ubuntu 24.04.5/runner-image provenance, managed
runtime install details and actual image pull are preserved in `run.log`.

The workflow references exact OCI index
`sha256:eff16c30e6f3f4af0a03fa4b706120d5e9b0891c344a27d64559aff5900a4a27`.
Root's saved registry evidence maps its arm64 child to
`sha256:a0f4498920a5dbac63196d9140ed738ef00470f27e2e74029abd8850b7bd5717`.
This agent read that evidence rather than independently refetching/hashing registry
bytes. The successful version/executable guard and all actual Chromium/Firefox/
WebKit profile runs establish this tested integration's compatibility. They do not
certify every ARM/browser deployment or physical-device condition.

Resource snapshots run 06:46:54.812Z–06:51:54.781Z, 299.969s. Cgroup `cpu.max`
is `max 100000`, `memory.max` is `max`, with no unavailable files. CPU usage delta
is 1,026,967,582 microseconds, **about 3.424 mean CPU cores** over the observed
cgroup interval. Own-cgroup throttle/period/burst counters remain zero. Memory/OOM
event deltas are all zero. Recorded lifetime memory peak rises from 1,510,834,176
to **5,481,730,048 bytes** (about 5.11GiB).

These are cgroup lifetime/interval observations including descendants and other
container work, not isolated browser peak/RSS or per-test CPU. No independent
cgroup ancestry/membership, affinity mask, CPU frequency or short-interval stall
trace was captured. `max` and zero own throttle do not prove absent ancestor
constraints or contention. Source qualifier text is preserved in `resources.json`.

## Raw and rounded costs

| Measurement | Result |
| --- | --- |
| Run created / updated | 06:45:56Z / 06:52:02Z, 366s elapsed |
| Job started / completed | 06:46:00Z / 06:52:02Z, **362s** |
| Rounded job minutes | **7** |
| Interval before first setup step | 1s |
| Container initialization | 25s |
| mise setup | 19s |
| Browser step | 06:46:54Z–06:51:54Z, **300s** |
| Subpath step | 4s |

Against the original **untimed** expanded-suite Web (301s/six rounded minutes;
246s browser), Web is **61s slower (+20.27%)**, browser **54s slower (+21.95%)**,
and quota proxy one minute higher (+16.67%). Against the distinct **instrumented**
four-worker control (356s/six minutes; 291s browser), Web is six seconds slower
(+1.69%), browser nine seconds slower (+3.09%). These are run comparisons, not a
same-source/platform/instrumentation causal benchmark. Six-worker instrumentation
and the rejected two-worker/virtualized runs remain separate historical conditions.

Rounded initial passing durations sum **1,150.600 test-seconds**, compared with
1,112.040s from the instrumented control's rounded list output. The current WebKit
profile sum/median/p95 are 349.700s/5.7s/13.0s versus 292.800s/4.6s/11.3s in that
control; the profile comparisons are recorded in `attempt-summary.json`. They
include waits, overlap worker lifetimes and do not identify a CPU cause.

Seven Web minutes alone cannot meet six total rounded minutes with a publishing
job. Faster warm tool setup, if later measured, would not by itself establish the
target: the browser already consumes 300s before mandatory overhead. No speculative
warm-cache savings were subtracted from this result.

## Artifact and acceptance limits

Only `github-pages` is present: artifact 11328734137, 376,315 archive bytes, almost
24 configured hours (9,031,455.468 projected byte-hours), digest
`sha256:4c720cbd8f54e664b14dc4988b106e25267807c51b1e4ea563834e684c3bef3a`.
This agent preserves metadata without downloading/authenticating or publishing
payload bytes. Root owns artifact trust and later publication. Current PR-only
costs cannot infer a complete-pair storage saving, monthly account usage or goal
completion. The tested ARM candidate is rejected on measured efficiency, while
full exact case/browser compatibility passed under its recorded conditions.
