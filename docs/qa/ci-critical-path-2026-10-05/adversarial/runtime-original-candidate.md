# Independent adversarial runtime review — original deferred-toggle candidate

This is an additive runtime verdict, preserving initial-source-review.md and the original run/source under initial-journeys.json and initial-journeys.ts. No peer report read before this verdict. No application source, fixtures, builds, Actions or remote network used. Root explicitly released the serial measurement window before runtime execution. All runtime sessions/servers were stopped before the actual shell observation 2026-10-05T11:43:28Z.

## Scope and identity

Base/head 2abac48a103064b9f967c8f8595a6fce9cab30f3. Candidate application blob 2818b056357b8c6156bfd7c8ff50284839fdb331 confirmed both before and after runtime. Frozen candidate /tmp/chronoshift-ci-critical/candidate-runtime/dist and baseline /tmp/chronoshift-ci-critical/baseline-runtime/dist were served serially on http://127.0.0.1:4311/ with existing PREVIEW_CSP and no test-release override. Full served SHA-256/byte inventories are in served-inventories.json. Both release.json files mark the base source SHA; that metadata alone does not distinguish this uncommitted candidate. Actual candidate JS index-D1UmQBQr.js, CSS index-Bst_xchV.css and worker-C690IjaR.js are recorded in the inventory and browser resource observations.

Mise-managed Bun 1.4.0 ran the preserved standalone scripts. Playwright bundled Chromium 153.0.8010.12, Firefox 155.0 and WebKit 26.6. Fresh contexts, desktop 900×640 at 1× raster, locale en-AU, timezone Australia/Sydney, normal motion (`no-preference`), no CPU/network throttling. Relevant partial-state/calendar journey resizes to 280×844 at 1×. The first-open keyboard sequence has no waits, forced clicks or refocus after native summary activation. Source summary focus is established before activation as the initial condition.

Actual runner windows:

- Full candidate journeys (`REVIEW_DIST=/tmp/chronoshift-ci-critical/candidate-runtime/dist REVIEW_BASE=/ mise exec -- bun .../adversarial/journeys.ts`): 11:41:56.700Z–11:42:08.889Z. Chromium failed first native Enter journey, Firefox and WebKit passed the full journey. Process exit 1 is retained. Chromium further lifecycle branches were not executed because the first assertion failed.
- Baseline/candidate focused Chromium keyboard control (`mise exec -- bun .../adversarial/keyboard-control.ts`): 11:42:42.534Z–11:42:45.271Z. Three fresh attempts each for Enter and Space per artifact, all logs/JSON/traces retained. These are separate observations, not retries or a replacement for the initial failure.
- WebKit screenshot-CSP isolation (`mise exec -- bun .../adversarial/screenshot-csp-control.ts`): 11:43:23.033Z–11:43:24.070Z.

## [P1] First keyboard open can skip source input and lose typing

Trigger: in a fresh page, focus More options; press Enter or Space; immediately press Tab and type UTC with normal motion. Native details opens, but source input mounting waits for the deferred `toggle` event. Tab reaches Try an example while no source input is present. Typed characters are lost; later mounting does not recover focus or text.

Initial uninstrumented Chromium run: open=true, active id empty, source still absent/value undefined at the immediate observation. Frozen baseline control passed 6/6 immediate keyboard journeys; candidate failed 5/6 (Enter 2/3 failures, Space 3/3 failures). The instrumented controls retain event/active-element/mount breadcrumbs rather than infer order from a settled capture.

Example candidate Enter control 0: Enter keydown at 100.1ms (relative browser performance clock); details open by keyup 100.6ms; Tab keydown 101.5ms while source absent; Try an example receives focus 101.6ms; U/T/C keys delivered 102.5–103.1ms while that summary owns focus; native toggle at 104.1ms; source first mounted at 117.1ms. Settled source is blank and focus remains Try an example. The timings describe event ordering, not a profiler or speed result. candidate-Enter-0-keyboard.png visibly retains the misplaced focus. The independent baseline has the field already present, so the exact same sequence preserves UTC.

Required fix: make the first options subtree available before keyboard navigation can leave the opening summary (or preserve that immediate navigation/input through a correctly owned focus handoff). Preserve the once-mounted lifetime; do not solve this by closing/unmounting on every toggle. Add meaningful immediate first-open keyboard coverage without waiting for the source locator after activation. Re-review the exact changed blob. A click-then-field-locator assertion masks this regression.

## Bounded passing journeys and visual observations

Firefox/WebKit: first Enter and Space open→Tab→UTC both preserved source focus/text. Six rapid native Enter toggles retained source and DateChoice DOM identity; a separately labeled coalesced DOM-toggle control ended open with usable fields. Complete 2026-04-09 reference date plus Tomorrow at 3pm produced 10 Apr 2026. Deleting day, closing options, editing message to Tomorrow at 4pm and resizing preserved invalidity and produced no results plus the exact incomplete-date alert. Reopen preserved placeholder day, year 2026, source UTC and same DateChoice node. Completing recovered exact 16:00/10 Apr 2026. Reset from partial reference recovered a usable conversion with same draft, cleared segment placeholders/source and no date alert. These are settled results beyond the debounce, not just transient clearing.

Persisted source Asia/Tokyo, target UTC, numeric order dmy and 24-hour display survived reload while More options remained absent: 04/09/2026 3pm yielded 06:00/4 Sep 2026. After readiness and actual controller identity http://127.0.0.1:4311/sw.js were observed, the page closed and the origin stopped; an uncached request failed. Reopen from healthy controlling cache with unopened options and new 04/09/2026 4pm yielded 07:00/4 Sep 2026, then first options mount displayed preserved source Asia/Tokyo. Storage inventory contained only the preference key; observed requests are same-origin assets and have no fixture message text. No permanent message/reference date storage was introduced.

Actual 280px dark partial/date/calendar captures retained. Inspected WebKit calendar contents: popup x33/y451/214×342, grid x44/y506/192×224, viewport 280×844; Firefox y positions differ by 1px. Calendar contents fit the surface with narrow balanced side spacing. No new CSS/theme change is in this candidate. Light theme and long-format layout were not re-exercised in this bounded probe. Chrome lifecycle branches beyond failed first open remain unverified for this candidate.

Normal-use console/page errors: none in Chromium and Firefox initial observed paths. WebKit initial run contains two stylesheet CSP errors; dedicated control observed zero before screenshot, two immediately after screenshot, no added errors after ordinary conversion. These are attributable to screenshot tooling stylesheet injection in this environment, distinct from unexplained application errors. Full JSON/location/clock evidence preserved.

## Separate verdicts

Implementation: BLOCKED for original blob 2818b056357b8c6156bfd7c8ff50284839fdb331 due to confirmed keyboard-input regression. Remaining passing paths do not override that blocker. Required fix and exact candidate re-review remain.

Original objective/report resolution: UNVERIFIED. No at least-20% Actions saving or strict TIE-375 raw-time/minute/storage acceptance is established by these local interaction observations. Local ARM samples and revised suite coverage are not a causal same-workload/Linux/monthly billing proof. The original objective stays open.

Evidence gaps: no hosted candidate run requested; waiting update, damaged/missing/stale cache, response replacement, physical phone CPU/network, installation/share menus, actual zoom and screen readers are unexercised in this review. Initial root probe oracle failure is retained separately by root and is not counted as a browser pass. Only assigned review records were written.
