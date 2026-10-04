# Final independent code review — activated worker / uncontrolled document

## Scope and revisions

Initial independent derivation and previous-behavior evidence remain in `/tmp/chronoshift-uncontrolled-code.md` (not overwritten). Base source inspected: 36c1f03a8b4d3643b685614c8017f760749db745. Exact final candidate reviewed: 63c9cdc442eac03c30dbae7871d1452b1049c7b0. Read original saved brief, AGENTS.md and review workflow before deriving failure paths; no counterpart consulted before initial report. Reviewed registration fallback/retries, install/activation observation, retained controlling workers, active-vs-controller readiness, waiting update publication and explicit App update/draft preservation, probe rejection/timeout/supersession/abort, diagnostic whitelist and worker integrity/repair/shell paths.

User clarifications recorded through root: hard refresh confirmed; recurrence also reported during normal browsing. Historical active/installing/waiting state, user Chrome version and exact worker/cache identity remain unknown. The normal-browsing report must not be closed solely from hard-refresh evidence.

## Final findings

No blocking implementation findings within the reviewed scope.

The candidate correctly distinguishes registration.active from navigator.serviceWorker.controller. Active fallback requires exact registration scope, an activated worker and expected script URL. Each probe owns its captured worker identity, port and timeout; a superseding inspect closes older probes. A late response cannot set readiness after abort or a different controlling/active identity. Readiness requires both verified assets and current controller identity equality, so an older active worker that ignores claimUncontrolled cannot claim false offline readiness. Controllerchange supersedes the active fallback and rechecks the actual controlling worker.

The worker performs claim only after exact precache verification/repair and only for a scoped same-origin window request. Waiting workers are never activated by the new handshake; no skipWaiting or automatic reload was added. The existing waiting-update action remains available independently of readiness outcomes and preserves the draft before explicit activation. First installation, integrity refusal, retained cache repair, bounded registration retry and cancellation ownership remain intact. The old worker compatibility case produces a distinct normal-reload instruction while retaining readiness false and explicit update availability.

Diagnostics are opt-in and bounded: absent/active/installing/waiting/controller state labels, expected scope/script booleans, safe worker version, claim status enum and existing bounded asset/repair metadata. No raw URL/query, selected zones, message text or arbitrary worker/error payload is introduced. When readiness succeeds after controllerchange, the visible probe may report claim not-requested because it is the new controller confirmation; the prior closed active probe need not emit a claim result. Lifecycle evidence still identifies the recovered transition accurately.

Nonblocking nuance: verifiedUncontrolled is retained until another probe result changes it; an unusual subsequent timed-out or invalidated probe before the initial startup deadline could retain the previous friendly normal-reload reason. Readiness stays false and timeout has its own error. No material failure reproduced; this does not block the bounded recovery.

## Executed evidence

Environment: macOS arm64; mise-managed Bun1.4.0; installed Google Chrome154.0.8037.93, headless disposable contexts. Neither application source nor the user's Chrome profile was edited by this reviewer. Port4243 and separate `/tmp` output directories. Full project gate remains implementer-owned.

Previous behavior, collected before root rebuilt shared dist: actual retained worker e26cfc3dedb05ea4 on `/ChronoShift/`, release marker local (preexisting build source not asserted). Both deliberate CDP Network.setBypassServiceWorker(true) control and independent CDP Page.reload({ignoreCache:true}) actual hard-reload journey showed controller absent, registration.active activated, installing/waiting absent, readiness false at0/1/4/16sec. Logs matched registration success, no install-state transitions, 1/4sec no-controller and15sec startup warning. Direct active CHECK_READY returned readytrue with no unavailable assets. Debugger invocation of active self.clients.claim recovered control/readiness; it was a mechanism test, not candidate behavior. Raw baseline observations: `/tmp/chronoshift-uncontrolled-code-probe.json` and `/tmp/chronoshift-uncontrolled-code-hard-probe.json`.

Candidate was independently built from `git archive63c9cdc` into `/tmp/chronoshift-uncontrolled-code-final-source`, using the existing dependency directory, without reading mutable root dist. `bun run build` passed; root-path candidate worker b1c4ea85e0d71074, release marker local.

- `bun test tests/offline.test.ts`:6passed, including verified-cache/scoped-window claim checks and shell integrity.
- `PLAYWRIGHT_PORT=4243 PLAYWRIGHT_CHROMIUM_CHANNEL=chrome bunx --bun playwright test e2e/uncontrolled.spec.ts --project=chromium --reporter=list --output=/tmp/chronoshift-uncontrolled-code-playwright`:2passed in4.9s. Accelerated200ms deadline; real worker/cache hard refresh recovery plus capability-absent active worker with retained controlled tab, waiting update untouched until explicit click, preserved draft and subsequent readiness.
- Additional independent `/tmp/chronoshift-uncontrolled-code-final-probe.ts`: actual hard reload with a deliberate1200ms delay of active CHECK_READY dispatch to expose in-flight conversion and supersession. Initial control absent, conversion9:20 before recovery, recovery1477ms, exactly one main-frame navigation (the hard reload), original draft preserved, readiness/control true and no warning at16sec. Offline close/reopen converted fresh input to9:20. No deadline acceleration. Raw logs: `/tmp/chronoshift-uncontrolled-code-final-probe.json`.
- Surrounding targeted Chrome checks: delayed failed readiness reply cannot overwrite newer success; detailed logging excludes input/zones, remains opt-in and stops when disabled.2passed in2.1s; output `/tmp/chronoshift-uncontrolled-code-surrounding-playwright`.

One initial standalone baseline harness attempt raced CDP navigation and failed with destroyed execution context; corrected by waiting concurrently for new domcontentloaded. This was harness timing, not an app error. Browser-run NO_COLOR/FORCE_COLOR warnings were tooling output.

## Separate verdicts

Implementation: APPROVED within this bounded active-worker recovery/diagnostics scope, contingent on the implementer's required full gates. No blockers remain from independent code review.

Original hard-refresh condition: REPRODUCED on previous behavior and PREVENTED/RECOVERED by exact63c9cdc in installed Chrome, including real15sec boundary, conversion/draft preservation and offline reopen. This is local engineering evidence; exact published candidate acceptance still belongs to delivery. Historical user worker/version remains unidentified.

Original broader normal-browsing recurrence: STILL UNVERIFIED. Fresh/healthy candidate checks and a matching hard-refresh reproduction cannot reconstruct that unexplained history. Preserve the report/ticket gap and obtain lifecycle/version metadata from future recurrence or a matching natural-browser reproduction. Physical-device/install/share-menu/screen-reader acceptance was not exercised.
