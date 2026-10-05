# Independent code review — original report

Originally saved 2026-10-04T20:27:06Z (filesystem birth time, UTC), before receiving the adversarial review or sharing this verdict. Review began 2026-10-04T20:23:44Z. This is the original report; later focused evidence belongs in a separate supplement.

Base: `12b9a7f9bf924472c89c9d33aa28ca14fb482365`.
Candidate: `9a4250219442d9217a903109448a1db0529f37ac`.
Scope: App busy/live-state changes, CSS motion/control/popover/result rules, DateChoice CSS, and surrounding request ownership, IME, preferences/date validity, imports/update restoration, copy guards and worker lifecycle. Independently derived paths are saved in `code/independent-plan.md`, before reading implementation tests.

## Findings and verdicts

No actionable implementation blocker found within this scope.

**Implementation:** approved within the stated scope. Pending now includes debounce, owned validation/worker failure paths stop busy state, composition pauses work, and invalidation still removes copyable stale results. CSS does not control request completion or delay interaction; reduced-motion disables animation, transitions and translated active/hover surfaces across elements and pseudo-elements.

**Original report:** not applicable; this is a motion/live-feedback feature, not closure of an escaped bug.

## Actual conditions and evidence

macOS 27.0.1 (26A434), Darwin arm64; mise-managed Bun 1.4.0; bundled Playwright Chromium headless 153.0.8010.12. Fresh independent contexts, en-AU, Australia/Sydney, 1000×900 desktop; target/source UTC and 24-hour clock seeded as explicit test setup. Own production preview `http://127.0.0.1:4252/`. Root built the candidate; reviewer did not build or mutate production/test files.

Commands:

- `git diff 12b9a7f9bf924472c89c9d33aa28ca14fb482365..9a42502 -- web/src/App.tsx web/src/style.css web/src/components/DateChoice.css` and reads of App, DateChoice, Choices, main, worker, preferences, handoff, review/testing docs.
- `PORT=4252 mise exec -- bun scripts/serve-web.ts`.
- `mise exec -- bun docs/qa/live-motion-2026-10-05/code/probe.ts` (2026-10-04T20:25:21.539Z–20:26:07.091Z): eight journeys passed; partial-date journey stopped at a reviewer selector typo (`Conversion settings`, actual `More options`). This was a harness error before exercising partial-date behavior; no application console errors. Original raw evidence retained in `code/probe-first-results.json`.
- Corrected only reviewer selectors; `REVIEW_CASE=partial-reference-date-and-reset mise exec -- bun docs/qa/live-motion-2026-10-05/code/probe.ts` (20:26:19.584Z–20:26:20.709Z): partial date settled as Check input/error, then preference reset recovered with usable results. Evidence `code/probe-partial-reference-date-and-reset-results.json`.

All nine independently chosen journeys passed after that selector correction:

1. Immediate pending, 250ms debounce, actual worker completion delayed 500ms, ready, whitespace idle. Mutation telemetry measured pending 4.7ms after input, worker post 256.0ms after input, native completion 280.7ms, ready 789.5ms. Pending retained through the added delay; no copy buttons during pending. Numeric output was `15:00` for April 9 at 3pm UTC.
2. Retained old success callback delivered after a later successful April 10 draft (1000ms injected delay): latest result/source and ready status persisted.
3. Clear after actual native completion but before retained callback delivery (800ms): idle and no copyable result remained after 1000ms.
4. Composition start canceled completed-but-undelivered work, paused through a 900ms interval and an intermediate edit, then composition end converted the final draft. Synthetic IME events only.
5. Oversize, no timestamp, deliberately thrown worker constructor, deliberately dispatched worker error: each settled as error/busy=false; subsequent valid edit recovered. Deliberate fault injection is separate from normal browser errors.
6. Invalid target during retained completion: error and no stale results after 1000ms; UTC restoration recovered.
7. Clipboard read delayed 700ms while user changed the draft: import conflict retained current draft/results; explicit Replace entered pending then displayed the imported result.
8. Partial reference date invalidated results and settled busy state; Reset preferences restarted conversion.
9. Reduced-motion context retained static Updating status; computed styles over every current element plus `::before`/`::after` found no active animation name or nonzero transition duration. Ready screenshot retained in `code/reduced-motion-ready.png`.

Normal/injected app page-console errors: zero in recorded contexts. The reviewer shim delays delivery of actual parser-worker results and retains captured callbacks even after termination, so cancellation probes challenge ownership beyond normal termination. Worker-error probe dispatches a synthetic error; constructor probe deliberately throws.

## Lifecycle assessment and regression independence

`invalidate` increments interaction/copy/request revisions, terminates the current worker, clears results/error/manual-copy/notice, and starts pending only for nonblank drafts outside composition. The effect owns timer and worker independently, checks request/composition/worker identity before every asynchronous completion/error, and cleanup cancels the timer and invalidates ownership. Validation branches now explicitly stop busy. No new promise/animation wait or request queue was introduced. Existing conversion has no separate worker deadline; edits/clear still terminate stuck work, and this feature does not change that policy.

Settings callbacks invalidate before conversion restarts; theme-only changes do not trigger conversion. Partial-date validity uses its stable callback/ref to invalidate and clear prior result ownership. Update restoration uses `setText`, caught by the effect's pending initialization; accepted direct imports use `edit`, while conflicting imports defer until explicit replacement. Existing update activation remains user initiated and input preservation remains in the bounded handoff. Copy invalidation retains its separate revision guard.

After independently deriving/running probes, read `e2e/motion.spec.ts`: assertions use independent Tokyo→UTC exact times, data-state and busy expectations and zero-animation assertions, so they distinguish the former UI. The motion test's Clear step happens soon after an edit and need not deliver a completed old worker callback; existing live IME test and this review's retained-callback cases cover that competing path explicitly. No test changes requested.

CSS import order remains DateChoice CSS followed by shared style.css from main. Shared control transition rules do not alter calendar sizing; reduced-motion selectors override both files with important animation/transition/translate suppression. Result articles mount after old articles have been cleared, allowing reveal without stale copy surfaces. Pulse is conditional on pending; settled Live/Paused/Check input states have no infinite animation.

## Artifact and gaps

Preview release metadata is `sourceCommit: local`, `base: /`; this does not establish published source identity. Actual inspected artifacts:

- index.html SHA256 `9ab27e43ac70bccf0a2f420b8032783a460ae45f7f39dfd0da1473afceca3479`.
- CSS `index-BE6jMEMC.css` SHA256 `4bdc1e0ff9509d48a60bd33c2fb61ce1041029aab637272935c149c9dffcb8d5`.
- App `index-YPf6KtuI.js` SHA256 `df48eadefaa3fe7d7a8ac31c64752129d81c62e00a55dcde2e155319eff6ce22`.
- Worker `worker-C690IjaR.js` SHA256 `e17b01198be6045d352561d10fe1f6004eb83d106b13f16ef027f0ec36230704`.

This reviewer has not run full CI, all browsers/subpath/offline release-update fixtures or publication; root owns those gates and the published artifact proof. Mobile/rendered breakpoint/theme assessment belongs to the complementary adversarial scope. Physical IME, actual phone performance, screen readers and human motion preference acceptance remain unverified. Shared/import handoff restoration was traced; this initial browser run exercises clipboard conflict/replacement, not every handoff transport. No general certification is inferred from these bounded passes.
