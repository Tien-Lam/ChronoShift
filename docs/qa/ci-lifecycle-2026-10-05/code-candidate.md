# Independent code review: candidate a565ed0

Reviewed `a565ed03095022f14b827d270564fd6da1d5c23a` against original reviewed base9373729. Original report [code-original.md](code-original.md) is unchanged. Review time2026-10-05 05:16–05:20 UTC. Local candidate dist supplied by root, generated05:11:41Z, version54d351454214d082, sw.js SHA256 `d435a616c28e546f162d02404737483491cb899388a5070db5d91581a8d10995`, release `{sourceCommit:local,base:/}`. Restarted own preview4262 to regenerate fixture hashes; root did not build during probes. Environment remains Darwin arm64/Bun1.4.0/Playwright1.63.0/Chromium153.0.8010.12. No source or build edits by reviewer.

## Findings

**P2 / blocker: successful lifecycle tests omit console flush.** `e2e/uncontrolled.spec.ts` afterEach returns immediately when status equals expectedStatus, before retrieving/flushing the newly introduced consoleDiagnostics collection. The helper intentionally catches unexpected serialization errors internally and throws them only from flush. Thus a successful uncontrolled/update journey can produce an unexpected serialization error without failing the test. That contradicts the acceptance requirement to surface genuine errors. Flush every outcome; when flush itself fails, retain lifecycle evidence as a failed attempt rather than silently dropping capture. Existing console unit regression proves that errors are surfaced by flush, not by the async console listener. Other diagnostics specs flush successful paths correctly.

No runtime blocker found in the candidate's bounded timeout/transport recovery scope.

## Code/lifecycle conclusions

Probe retry schedules only after timeout or postMessage failure, only when signal remains live, readiness is unconfirmed and navigator.serviceWorker.controller is the same object that owned the failed probe. Callback repeats same-controller/signal guard, increments bounded counter, then delegates to full integrity verification. Startup/deadline/error text is retained until confirmation. External inspect cancels pending retry and resets the bounded cycle; successful verification clears readiness/retry timers; abort clears both probe timers and closes channel. Explicit negative readiness responses do not schedule retries. Waiting-worker activation remains exclusively ACTIVATE_UPDATE from the existing Update now handler.

The added delayed-readiness regression genuinely distinguishes the original application: its reloaded document delays initial message sends350ms while the existing app test deadline is200ms, allowing the initial timeout then confirming actual activated controller and direct worker test-second ready before automatic bounded recovery. The original report contains the before-candidate same-symptom failure. This is a meaningful bounded mitigation, not proof of the missing original CI state.

Attempt reporter stores unexpected individual attempts, not just final failures; expected failures and skips are excluded. Marker is removed at run start; screenshot/context absolute attachment paths are recorded. Failed tests' body lifecycle attachments are represented in HTML report, while marker only lists file attachments. `hashFiles` condition additionally uploads on the marker even when job succeeds; retention stays3days. Browser/test-results root remains intact when subpath uses nested output; root separately owns that actual nested-run verification. Failure-only screenshot and retry trace policy remains unchanged, so original failing trace is still unavailable; retained screenshot/context + worker lifecycle diagnostics address the scoped acceptance. Reporter runs serially in coordinator; no concurrent marker writers.

## Independent focused experiments

Commands and retained evidence:

- `mise exec -- bun docs/qa/ci-lifecycle-2026-10-05/code/candidate-bounds.ts` — all six cases pass; [script](code/candidate-bounds.ts), [raw log](code/candidate-bounds.log), [states + diagnostic logs](code/candidate-bounds.json).
- `PLAYWRIGHT_PORT=4262 mise exec -- bunx --bun playwright test --config=docs/qa/ci-lifecycle-2026-10-05/code/playwright.review.config.ts --project=chromium --grep 'an explicit update recovers a timed-out'` —1 pass,5.4s test/5.6s run; [raw log](code/candidate-update.log).
- `mise exec -- bunx --bun playwright test --config=docs/qa/ci-lifecycle-2026-10-05/code/retention.review.config.ts` — intentional first attempt failure, successful retry, one expected failure, final exit0; [raw log](code/retention-review.log), [marker](code/retention-output/attempt-failures.json), [first-failure screenshot](code/retention-output/retention.review-first-failure-then-success/test-failed-1.png), [context](code/retention-output/retention.review-first-failure-then-success/error-context.md). Marker contains precisely one unexpected retry0 failed attempt and extant attachment files. Expected failure is excluded. Retry trace is separately present.

Actual-worker probes start with a controlled healthy fixture first release and accelerate only15000ms timers to200ms, then inject traffic faults after readiness. No actual readiness/controller/cache result is mocked. Six cases:

| Case | Observed traffic and final state |
| --- | --- |
| One lost response | sends at0/1206ms, second verification readytrue; independent direct check true;3.0s journey |
| One postMessage throw | sends at0/1004ms, recoveredtrue; directtrue;2.7s |
| Permanent silence | sends at0/1205/4410ms, no fourth send through6.6s; false with actual activated controller + healthy direct check |
| Abort pending | one send, all page-created AbortControllers deliberately aborted after timeout; no retry through1.7s; false/directtrue |
| New pageshow | dropped send0ms, fresh successful send288ms, no old scheduled retry through1.7s; true/directtrue |
| Actual corrupt release.json with network offline | native worker reports false, one send, no retry through1.4s; false/directfalse |

Every captured app send in these cases targeted the document's actual controller. No page errors. Transport throwing and suppressed sends are intentional fault injections. Abort experiment aborts all page-created controllers rather than an exported setupOffline controller because production encapsulates it; this proves no pending app readiness retry survives that real signal abort, without asserting isolated cancellation of unrelated operations.

## Separate verdicts

**Implementation:** runtime retry change approved within stated scope; candidate test-infrastructure blocked on success-path console flush. Retention behavior independently verified on successful retry and expected-failure control. No full gate repeated; root reported116unit/check/build/format +36targeted browser cases and owns required gates/subpath preservation.

**Original report:** existing console navigation cause supported and helper behavior previously verified. Candidate prevents the independently reproduced activated/healthy-cache readiness stall while preserving all readiness/integrity assertions. Chromium original CI cause still unverified, missing first-attempt controller/cache/timing remains a gap. Fix is a bounded mitigation plus better future evidence; original report cannot be declared resolved by clean reruns alone.

Real-time15-second behavior, Linux concurrent four-worker contention, exact historical published worker and hosted user's prior browser state were not independently exercised. No physical-device/installed-mode conclusions.
