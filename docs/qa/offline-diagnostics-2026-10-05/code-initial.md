# Independent code review: recurring hosted offline warning

Date: 2026-10-05. Original scope inspected: main `d924853274fe795423640d347a8375705cd35ee2`; snapshot copied before implementation. Role: code reviewer; no counterpart findings consulted. No repository source edits made by this reviewer.

## Original brief and conditions

Regular Chrome at `https://tien-lam.github.io/ChronoShift/` remains usable for conversion but reports yellow `Offline setup is incomplete. Reconnect and reload to try again.` despite earlier fixes/publication. Initial report described 10–20 seconds, sometimes after target change/Convert. Latest corrected user steering identifies a warning **a few seconds AFTER clicking the Convert to field**, not necessarily the Convert button; the interim "immediate" characterization was corrected. Earlier console included `Uncaught (in promise) Error: Offline asset belongs to another release at fill (sw.js:20:46)`. Latest published identity supplied by root: artifact `1ef1aa07...`, cache `fedcd4a1116faa6d`; no user browser version, controller/release, profile/cache history, exact failed asset, or response details available. These remain unknown.

## Independently derived paths

Before examining tests, traced registration success/rejection/fallback, bounded first-install retries, install/update state events, readiness probes, abort cancellation, 15-second startup/probe deadlines, repair rejection, retained version caches, and explicit update activation. Examined `web/src/platform/offline.ts`, `web/sw-template.js`, build/server generation, App lifetime/update draft handling, and timezone ComboBox.

The exact warning can arise from a controller reply `ready:false`, first-install startup deadline, or outer registration rejection. The separate probe timeout has `Offline assets could not be confirmed...` text. An existing older controller can legitimately fail repair when a missing precache entry causes the whole release to be staged against newer mutable URLs: old hashes correctly reject new index.html/release.json bytes. Keeping integrity and requiring user action to activate an update are essential invariants.

`App` mounts `setupOffline` in an effect with an empty dependency list. Picker focus/open/rerender does not rerun that effect, cancel its signal, write offline readiness, or dispatch a lifecycle event. A direct picker-to-warning cause is not established by source inspection. Pending asynchronous readiness can coincide with the click.

## Finding C1 — P1: waiting update becomes unreachable behind a readiness timeout

Original locations: `offline.ts:139` (probe timeout), `offline.ts:174` (postMessage rejection), `offline.ts:62` (startup warning), and `offline.ts:223` (install state changes only start asynchronous inspection). Pending updates are only included once a readiness response arrives, or once at setup if already waiting. A waiting update that becomes installed while an older controller's repair is pending has no announcement until that probe finishes. A timeout closes the only result port and emits a state without the update; later worker completion cannot recover the button. This can leave **Update now permanently absent while registration.waiting is installed**, preventing the authorized explicit recovery action.

Independent reproduction uses current production source, real workers/caches and installed Google Chrome **154.0.8037.93** on macOS, root base path at dedicated local origin `http://127.0.0.1:4192/`. Sequential steps: install generated `test-first`; publish incompatible `test-second`; delete only first cache `/icon.svg`; delay only the old release's `index.html?chronoshift-release=test-first` fetch by **22 real seconds**; request update; wait for new worker waiting; click Convert to. Application deadline was not accelerated. Other current-release downloads were not delayed.

At 1 second: original page ready true, waiting worker installed, update button absent. At 16 seconds: ready false, probe timeout warning, waiting worker installed, update button absent. At 24 seconds: old repair ended and staging cache removed, but update button still absent. Deliberately injected response delay and deletion establish a bounded lifecycle defect; they do not prove the user's original cause.

After disabling the delay and manually dispatching pageshow, old-release repair returned false: exact original yellow warning appeared, the valid waiting update became visible, and conversion remained usable (synthetic known result 1:00 am). Explicit Update now activated new release, cleared warning, achieved readiness, and preserved the synthetic draft. Thus the exact warning plus damaged older cache is demonstrated, while the user's natural warning a few seconds after field click remains unverified.

Required fix: announce pending updates independently when install state changes and preserve pending-update availability in every readiness outcome, including timeout/postMessage/startup errors. Do not automatically activate the waiting worker.

## Executed commands and evidence

- Read repository AGENTS/review/testing instructions and lifecycle sources before reading current regression tests.
- Snapshot build: `CHRONOSHIFT_SOURCE_COMMIT=d924853274fe795423640d347a8375705cd35ee2 mise exec -- bun run build`, cwd `/tmp/chronoshift-code-review`, Bun 1.4.0, passed typecheck/build; generated root cache `33450ec495b7ef75`.
- `mise exec -- bun probe.ts`, same isolated cwd, installed Chrome channel; completed the real-time sequence above. Script `/tmp/chronoshift-code-review/probe.ts`; output `/tmp/chronoshift-code-review/probe-result.json`.
- Existing tests reviewed: offline-install first-registration/slow/stale/persistent integrity cases, app canceled probe/registration fallback/cache repair cases, updates repair refusal/rollback/old-worker cases. They cover bounded earlier fixes. Existing repair refusal test establishes integrity retention but does not exercise page warning/update notice timeout availability; none independently closes this report.
- Review setup initially regenerated ignored shared dist accidentally before isolating work; root was immediately notified. That ignored output carried a synthetic source SHA and is not release/publication evidence. No repository source edits or official release build relied on it.

## Initial verdicts

**Implementation:** blockers in existing lifecycle scope: C1 must be fixed and verified. Other inspected code correctly preserves latest-probe ownership, abort cleanup, bounded first-install retries, exact repair integrity, and explicit activation invariants within the inspected paths.

**Original report:** still unverified. Demonstrated exact warning under a deliberate older damaged-cache condition and reproduced a related loss of update recovery under a real timeout. Did not recreate the user's historical browser state or natural warning a few seconds after clicking the field on the published artifact. Fresh current release success would not remove those evidence gaps. Browser/profile/client release and failed asset/HTTP/integrity diagnostics are needed; keep report open.

## Candidate review

Pending root implementation and exact candidate review. Root requested additional review of default-off detailed logs, privacy allowlist, observer lifetime/toggling, and service-worker scope, separately from original report resolution.
