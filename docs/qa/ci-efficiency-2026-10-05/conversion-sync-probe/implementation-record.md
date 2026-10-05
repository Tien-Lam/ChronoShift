# Bounded test implementation and selected verification

Root authorized the test-only implementation after the local ABBA probe. Branch `codex/ci-conversion-sync` started from **82843f46e554a04d7a9db9c8b0aaacb77466442e**. Root committed final source as **0f0d9d3ec38b8b53cd42b8413e52c7a0d5067318**; the final saved five-file snapshot and current files independently match that commit byte-for-byte. Runtime web tree remains **78dbdbf65b5328416f0b169cc52d3ed9541d02f9**, root JS remains **index-DHi9pTHJ.js** / **b2ec5e8a200f317d260cd7e596c1f9a8d417f55f4379803a39867553791ae640**. No production source, build, config, fixture, dependencies, source/target interaction helper or Actions change was made by this implementer. Root owns Git/PR/publication and independent final review.

`e2e/conversion.ts` observes a positive conversion's own input action and idle→busy→ready cycle before invoking the caller's **unchanged first exact result assertion**. It waits for the input's normal visibility/mount precondition, then rejects missing/duplicate panel/input, initially busy, empty or no-op input. It captures the real input event, reconstructs coalesced `aria-busy` transitions from ordered `oldValue` records, scopes observations to the owned panel/input, rejects lost ownership/pagehide/error/timeout and cleans listeners/observers/timer/handle on success or failure. An attached rejection handler consumes failures occurring while fill is still running; later awaiting still propagates them. It modifies no application state or timer.

Fill retains Playwright's inherited action/test timeout. The existing10-second post-fill assertion budget is shared by synchronization and the one original assertion; a remaining-time getter recomputes the deadline at assertion invocation. Later journey assertions keep their previous separate policies. This does not claim a10-second deadline for every subsequent assertion in a test. The helper's API can supply updated remaining time to multiple callback assertions, but current adopted callbacks each contain just one original assertion.

Scope is deliberately opt-in: six successful calls across five app cases, three privacy source sites (two are in the two-legacy loop), two responsive initial fills and two controls initial positive fills. The existing app `convert` helper preserves its original path by default, so worker-failure, late-response, registration/probe/cache-repair, error/no-result and update callers are not observed. Controls' themed draft→target change, reference-date→Tomorrow fill, reset→filled draft and source/target editing/selection retain the original paths. The reference-date/Tomorrow wrapper was removed before the first recorded run because its prior draft conversion can already be busy; no quiet readiness wait was inserted to make it eligible. Every current independent expected count/text/date/value/privacy/motion/accessibility assertion remains.

## Source-distinct local runs

| Evidence folder | Reporter clock | Duration | Cases per profile | First attempts / retries / failed |
| --- | --- | ---: | ---: | --- |
| implementation/ | 08:01:55.731–08:02:55.804Z | 60.073728s | 23×5 | 115 /0 /0 |
| final-implementation/ | 08:04:47.163–08:05:14.405Z | 27.242699s | 12×5 | 60 /0 /0 |

Initial verification ran all four touched test files, including the unchanged surrounding failure/update/menu journeys. Its snapshot used a numeric remaining timeout and a30-second action watchdog without the new input-mount precondition. That entire snapshot/diff/timing/log/output is preserved in `implementation/`; it is **not** evidence for final file identity. The initial run completed before subsequent source edits (completion observed at08:03:04Z).

Final source replaces the stale numeric callback timeout with a getter, removes the independent action watchdog and waits for the normal input visibility precondition before arming. Its snapshot, diff, typecheck/format logs and raw timing/HTML/output are preserved in `final-implementation/`. It ran all12 directly affected existing cases across **Chromium, Firefox, WebKit, Android emulation and iPhone emulation**, using four workers, CI viewport/raster and the unchanged motion policy. Both raw reports reconcile every first attempt, zero dropped attempts, zero retry/failure/skip rows and no failure marker. Explicit reduced-motion cases retained their original motion setting; other journeys use normal native motion. No file edits occurred during either active run.

Commands used mise Bun1.4.0 on local Darwin arm64 Apple M4 Pro; installed engine versions are those recorded in the probe. Each runner started its own root/test-mode server on a distinct port and kept a distinct HTML/output directory:

```sh
CI=1 CHRONOSHIFT_CI_TIMING=1 PLAYWRIGHT_PORT=4299 \
PLAYWRIGHT_HTML_OUTPUT_DIR=docs/qa/ci-efficiency-2026-10-05/conversion-sync-probe/implementation/html \
mise exec -- bunx --bun playwright test e2e/app.spec.ts e2e/privacy.spec.ts e2e/responsive.spec.ts e2e/controls.spec.ts \
--project=chromium --project=firefox --project=webkit --project=android-emulation --project=iphone-emulation \
--output=docs/qa/ci-efficiency-2026-10-05/conversion-sync-probe/implementation/results

CI=1 CHRONOSHIFT_CI_TIMING=1 PLAYWRIGHT_PORT=4301 \
PLAYWRIGHT_HTML_OUTPUT_DIR=docs/qa/ci-efficiency-2026-10-05/conversion-sync-probe/final-implementation/html \
mise exec -- bunx --bun playwright test e2e/app.spec.ts e2e/privacy.spec.ts e2e/responsive.spec.ts e2e/controls.spec.ts \
--project=chromium --project=firefox --project=webkit --project=android-emulation --project=iphone-emulation \
--grep 'pasted HTML|convert, inspect ambiguity|close and reopen offline|preferences persist, input does not|readable at 320px|legacy .* preferences migrate|invalid and oversized local shares|reflows across|touch-sized controls|choice menus support|timezone search preserves' \
--output=docs/qa/ci-efficiency-2026-10-05/conversion-sync-probe/final-implementation/results
```

Final `mise exec -- bun run typecheck` and `bun run format:check` passed. `implementation-summary.ts/json/log`, analyzed at **08:06:17.125Z**, independently aggregate raw timing, case identities, attempts, per-profile statuses, failure-marker absence and exact snapshots against the final commit. The selected runs are different workloads/source conditions; 60s versus27s is **not** a speed comparison. The ABBA probe supplies the separate local observation-delay evidence.

Implementation validation verdict: selected final existing tests pass; this implementer does not substitute self-review for the two fresh independent source/lifecycle/cleanup/deadline reviews. Those probes and the complete required hosted gate remain root-owned. Original-report verdict: no Linux or paired rounded-minute saving is measured here; TIE-375 stays open at the prior accepted442-second/eight-minute pair, and physical/historical acceptance gaps remain unchanged.
