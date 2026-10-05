# Independent raw failed-attempt review

Actual observation interval: `2026-10-05 09:17:00`–`09:21:01 UTC`.
Explicit cwd `/Users/tien/Developer/ChronoShift`; existing mise Bun for read-only
JSON selection. No tests, API calls, reruns, source changes or commits. Inspected
raw final CI logs, marker, timing, original screenshot/context and retry trace;
did not read the fresh CI reviewer verdict or adversarial interpretation.
Original TIE-370 brief and TIE-374 selection brief supplied report conditions.

The first artifact read at `09:17:40 UTC` encountered an incomplete ZIP central
directory while download was in progress. No implementation conclusion was drawn
from that read. The collector signaled complete raw extraction at `09:19:27Z`;
subsequent complete-file inspection began at `09:19:44 UTC`.

## Exact execution and failure

Raw run identity: Web `37288000068`, attempt 1, PR #40 head
`eef0d51ea3ca835dfe27d7e157c6bfad1610a7b3`, head tree
`6d01fce2b52fcfc27f6343812c02099857856f28`. Job `111691417008` reports success
at `09:14:49Z`; this reviewer uses saved runner identity/timing rather than the
later time someone observed completion.

One recorded unexpected first failure is `[webkit] e2e/imports.spec.ts:173`,
“an unresolved target hides copyable fallback results and correction restores
the source interpretation.” Marker `retry:0`, duration 14,145 ms. Structured
timing identifies test `2ddfe1b68d00a83a`, worker 11/parallel slot 1, start
`09:11:41.519Z`; one expectation failed, longest 10,005 ms. Fill/press API
operations themselves report no failures. Runner list ordinal 131 failed;
ordinal 135 retry #1 passed.

Failure occurs at the **first CST entry after exposing manual-copy fallback**:
test source retained in the trace first enters UTC, converts “April 9, 2026 3pm
UTC”, clicks Copy UTC with deliberately rejected clipboard write, confirms
Text to copy, then calls `enterZone(page, "CST")`. That helper fills the target
and presses Tab. `choices.ts:28` / `imports.spec.ts:197` expects CST but gets UTC
through its ten-second assertion. Original screenshot shows target UTC,
unchanged 3:00 pm UTC result, Copy and fallback text still visible, with focus on
More options after Tab. The failure prevents the subsequent unresolved-target
result/copy-hiding and correction assertions from running on this first attempt.

Hypothesis: custom-input edit/blur commits or restores the previous selected
UTC value, potentially before controlled state has synchronized. A competing
path is focus/state ownership around the preceding manual-copy rejection and
fallback rendering. **Neither cause is proved**: the failing attempt lacks
action snapshots, input/focus event diagnostics and a trace.

## Failed evidence and successful retry are separate

The failure ZIP contains `attempt-failures.json`, the failed screenshot/context,
timing and one trace only at
`test-results/imports-an-unresolved-targ-9f694-s-the-source-interpretation-webkit-retry1/trace.zip`.
There is **no failed-attempt trace** to review. The copied
`passed-retry/trace.zip` is explicitly a success control, not a trace of the
failure. Its testRunner wall clock `09:11:56.976Z` agrees with structured retry
start `09:11:56.975Z`, worker 15/parallel slot 1, duration 7,719 ms, no failed
expectations. The successful trace records CST fill→Tab→CST assertion, then
Asia/Tokyo correction and later CST edit. It cannot explain the first reset.

Retry context: Playwright 1.63.0, WebKit on Linux, 900×640 viewport, 2x scale,
nonmobile/nontouch, en-AU/Australia-Sydney, normal motion, service workers allowed,
dedicated `http://127.0.0.1:33647/` origin. Its Safari-shaped user-agent is not
physical macOS Safari evidence. Retry console includes the browser's unsupported
`interactive-widget` viewport-key warning; that observation does not establish
the failed input's cause. First screenshot's 1800×1280 raster is compatible with
the recorded retry viewport/scale but does not independently prove equal first
attempt context options.

The raw final list reports 248 passed, one flaky, nine skips, while timing reports
259 attempts and zero omitted. This bounded review reconciles the implicated
pair; it does not replace the fresh complete-suite reconciliation.

## Diagnostic retention and migration evidence

Uploader v7 direct timing and failed-attempt diagnostics both execute in the raw
log. Timing upload finalizes artifact `11336030084`; failure upload finalizes
`11335666301`, after the browser step succeeds through retry. Both downloaded
ZIP SHA-256 values agree with the corresponding uploader log digests:

- Failure ZIP, 4,628,437 bytes:
  `54b9fdb870e20db6ecc036892a984d90b3fc5919323145edea2b3814ace0dc0e`.
- Timing ZIP, 47,474 bytes:
  `f0d6eed8277b92c00698178255942165f50eb8ee4f1ce6598504ee94259fa81a`.

This establishes the actual failed-first/successful-retry diagnostic upload and
retained marker/screenshot/context for this case, unlike an ordinary skipped
failure branch. The raw metadata additionally configures three-day diagnostics
retention. Configure/deploy remain unexecuted in this PR gate and still require
publication evidence. No Actions upgrade causal explanation for the browser
field reset is established.

Other inspected raw hashes:

| Evidence | SHA-256 |
| --- | --- |
| run.log | `be511e97a5659f62b084b0b68aa7e2f5e1ee591d62f7da62932fc1c210dfe702` |
| attempt-failures.json | `623bca50ba40d1b0c19cb917f610a1bf9ae6b29615d3c4fc69a9ab28c3fb9da9` |
| ci-timing.json | `423d4efb9cfc5d4e9157659f4ffbe4f2544f534873bbf6039259c55860fa9fee` |
| failed error-context.md | `292366bebf3972723a7a5aa81a546aebfa1d1358b78470af2a93ad854fcf3cef` |
| failed screenshot | `720f937ab19c54fd3798aaf6a2a73697fb2f51d8867bbd77486a42b2478a0c77` |
| passed retry trace.zip | `949f780f918bc65f3db5c3d4539602d6503fa55059dae5d79e4d33b48a63164a` |

## Separate verdicts

Implementation, Actions migration: **no new static migration blocker or proved
Action-caused browser defect**; source approval remains bounded. Upgraded v7
conditional failure upload is actually demonstrated with useful retained bytes.
Publication acceptance remains pending.

Implementation, target-input journey: **first-attempt failure is real and
unresolved**, despite a passing retry. Before describing the complete UI journey
as reliable, investigate the exact UTC→CST after manual-copy fallback path with
first-attempt trace/event/state evidence. Do not weaken value/result/copy
assertions or add settling sleeps as acceptance proof. A bounded targeted
reproduction of this now-concrete path is justified; none was run here.

Original TIE-370 report: **retention acceptance demonstrated for a new real
flaky-success case; historical Chromium readiness cause remains unverified**.
This is not its older-worker readiness false or WebKit `jsonValue` navigation
exception. Original TIE-374 report involved iPhone-emulated WebKit and later
Asia/Tokyo→osaka after CST correction; the current desktop-WebKit UTC→CST reset
at the first unresolved entry is distinct. Prior bounded approval cannot be
expanded to this newly observed failure or the unknown TIE-370 cause.
