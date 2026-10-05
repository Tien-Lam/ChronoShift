# Exact-candidate independent adversarial review

**Implementation: approved within the stated idle, changed, nonempty text scope; no blockers. Original target: TIE-375 remains unverified/open.**

Base: `82843f46e554a04d7a9db9c8b0aaacb77466442e`. Exact inspected/tested candidate: **`0f0d9d3ec38b8b53cd42b8413e52c7a0d5067318`**. No E2E working-tree changes were present before/after final probe. Initial surrounding inspection began at actual clock **2026-10-05 07:58:54 UTC**, before helper source existed. Final report preparation clock: **08:06:57 UTC**. Final source verdict follows initial independently derived scope and preserved initial report, without reading the other reviewer's verdict.

Candidate diff contains the saved dispatch brief, test helper and opt-in ordinary conversions in app/privacy/responsive/controls tests. No production web, runtime assets, worker, debounce, configuration, profiles, fixture, expectation, action or motion change is included. Existing independent result assertions remain in place; the observer is an additional synchronization step. Idle/new-text restrictions intentionally exclude pending replacement/reference/reset/error/update journeys.

## Actual exact-candidate evidence

Command: `mise exec -- bun docs/qa/ci-conversion-sync-2026-10-05/adversarial/probe.ts`. Actual run **08:05:46.557–08:05:58.498Z**, preserved in `final-probe.log` and `final-raw.json`: **48 passing rows, zero failing rows, zero page errors** across Chromium, Firefox and WebKit. This was a single final-candidate run; prior WIP failures and harness corrections remain preserved and are not reclassified as a first-attempt pass of that earlier probe.

Actual browser journeys and competing conditions:

- Real first conversion and changed-result conversion retain independently expected Sydney times, date and result count. Native250ms debounce, Worker lifecycle and normal motion remain active.
- A helper call while a previous actual conversion is pending rejects **before changing input**; the original input completes correctly. This establishes the supported idle-only restriction, not general pending replacement support.
- Real no-timestamp settlement and injected Worker-constructor failure reject positive readiness, then recover to a usable exact conversion in the same runtime. The constructor fault is deliberate and separately labeled. Normal page-error diagnostics remain empty.
- Synthetic synchronous/coalesced false→true→false mutations are reconstructed; initially settled stale output without a new cycle and permanently busy input fail at their200ms bounds without calling the positive assertion.
- Error completion, panel detach/replacement, rejected fill and rejected exact result retain meaningful errors and return all instrumented active MutationObservers/input listeners/pagehide listeners to zero. Synthetic instrumentation is isolated from real conversion rows.
- Wait and intentionally failing exact assertion share one250ms deadline after150ms settlement. Fresh remaining-time getters decrease across two exact assertions, rather than restoring the original timeout per assertion.
- Navigation rejects old document ownership and later real conversion succeeds; page close rejects pending observation in all three engines. Valid error wording varies by engine (`lost its document` versus protocol target closure).

Command: `mise exec -- bun docs/qa/ci-conversion-sync-2026-10-05/adversarial/deadline-boundary.ts`. Actual runner **08:06:08.736–08:06:18.868Z**, observation started **08:06:08.837Z**. A stale-ready panel with no pending cycle fails at the unmodified default10,000ms budget: measured **10,023.1245ms**, zero positive assertion calls. A subsequent changed-text/coalesced-cycle conversion returns the independent recovered exact result. `deadline-boundary.json` and `.log` preserve timings/error/recovery. This is a real-time boundary, not an accelerated application deadline.

The initial targeted caller suite is retained as unchanged-caller evidence, not mislabeled as exact final source execution: actual08:03:08.193Z for18,678.908ms; **24 passing native-motion desktop cases, zero unexpected/flaky/skipped, retries0**. Full list log and JSON agree; no failure-marker file was created. It covers adopted conversions plus retained error/reference/offline/storage/search paths. Its exact WIP provenance is qualified in `initial-report.md`. Final helper API/mount/deadline changes were exercised by the exact final48-row probe; the implementer owns the complete affected/full gates.

## Source and environment observations

Every adopted caller remains eligible for idle arming. App opt-in calls begin with blank drafts after readiness/reload/reopen; existing error/pending/update callers retain the original direct-fill path. Privacy migration/reset/reload/invalid-share callers have blank drafts. Responsive target setup happens while the draft is blank. Controls adoption covers only the initial numeric-date and initial timezone-search conversions; subsequent Tomorrow/reference/reset/hover paths are unchanged. Full diff inspection retained the original exact time/date/count assertions and current weaker visibility expectations as-is.

Observer completion requires owned actual input, a pending→idle cycle and ready state. Error completion cannot authorize positive assertion. Coalesced records use old attribute values; document/panel/input ownership is checked independently. Cleanup disconnects both observers, removes listeners and clears an armed timer. There is no helper global property, storage, logging or network request retaining arbitrary input/zone data. Finally disposes the browser handle even when the action or wait rejects. Fresh callback deadlines and inherited Playwright action timeout address the earlier review concerns without adding an independent30-second watchdog. This static audit supports the tested failure/resource observations; it is not a claim that every possible callback is bounded if it ignores the supplied remaining-time getter.

Environment: Darwin arm64/macOS27, mise Bun1.4.0, Playwright1.63.0; installed Chromium153.0.8010.12, Firefox155.0, WebKit26.6. Direct probe uses900×640/1×, en-AU, Australia/Sydney and `no-preference` motion. The final probe ran while the implementer's affected suite was active, so the timing evidence is a failure bound and lifecycle check, not a clean performance benchmark. Owned port4324 serves root preview with test mode enabled; no release override was dispatched. WebKit's initial fixture tests retain their separate ephemeral origin behavior.

Source identity differs from served asset identity: final helper source is candidate0f0d9d3; actual runtime release remains **28059a91ec9984dea4d079b3f684b3a27af669f0**, web tree **78dbdbf65b5328416f0b169cc52d3ed9541d02f9**, base `/`. Before/after direct HTML, release marker, service worker, main JS, Worker JS and CSS responses are200 and byte-identical; SHA-256s and actual clocks are saved in `served-identity.json`/`final-served-identity.json`. `candidate-identity.txt` records the exact commit scope. Review server shutdown is separately recorded after report writing.

## Findings, corrections and limits

No actionable adoption/implementation blocker remains. The helper deliberately rejects initial busy, no-op and empty-input calls rather than acting as a general conversion primitive; source guards establish the no-op/empty restrictions, and the pending restriction was exercised. Guard rejection is not an application regression. Keep the existing broader lifecycle synchronization where those conditions are intentional.

The original WIP probe/report is preserved. Its three busy-panel failures arose from my wider proposed API scope, subsequently clarified by root. Its fourth failure was a page-close regex missing a valid ownership error; the corrected expectation is separate and final source passed. No original failure was discarded. The earlier helper copy was saved after WIP execution and has an explicit provenance gap; final tested revision is pinned exactly above.

**Original target verdict:** this proves bounded synchronization and retained competing conversion/failure behavior. It does **not** establish the requested at least20% Actions/free-quota reduction, a matching Linux four-worker/full-six-profile workflow pair, hosted publication acceptance or improvement over the307/eight baseline against current442/eight. The36-conversion local ABBA evidence remains local and cannot close TIE-375. The ticket should stay open until matching complete published-pair acceptance evidence exists. No physical phone, installation, OS share, actual zoom, screen-reader or unidentified historical browser-state certification follows from these desktop observations.

Reviewer wrote only the assigned QA folder and did not mutate Git/source/configuration/Linear, dispatch Actions, or touch user `:memory:.ses`/`docs/design/`. Runtime review origin will be stopped and verified unavailable.

Post-report shutdown: owned Bun PID93971 received SIGTERM at actual clock08:07:56 UTC; awaited server session exited143. Saved `server-stop.json` confirms port4324 no longer responds. E2E working tree remains clean and checkout HEAD remains exact candidate0f0d9d3. This shutdown note follows the report-preparation clock above.
