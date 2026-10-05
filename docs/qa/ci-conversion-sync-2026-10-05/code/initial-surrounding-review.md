# Independent code review: initial surrounding-code trace

This is the original pre-candidate trace, not final implementation approval.

Actual observation window: 2026-10-05 07:58:43–07:59:12 UTC, from the clock tool. Report written after that window. Base/checkout HEAD: `82843f46e554a04d7a9db9c8b0aaacb77466442e`. Candidate unknown at this stage. Saved authority: `../dispatch.md` and `docs/developer/review.md`.

Environment observed: macOS Darwin 27.0.0 arm64, mise 2026.10.1 macos-arm64, Bun 1.4.0, Playwright 1.63.0. Runtime source web tree: `78dbdbf65b5328416f0b169cc52d3ed9541d02f9`. Existing root dist marker identifies production source `28059a91ec9984dea4d079b3f684b3a27af669f0` and base `/`; no application build or browser served in this initial phase. Reviewer allocation: port 4322 and this `code/` directory. No Actions/Linear writes or Git/source/config mutations.

Commands: inspected AGENTS.md, saved brief, review/testing docs, App.tsx, fixtures.ts, choices.ts, Playwright config, relevant app/privacy/responsive/controls specs, tsconfig/package.json and preview server. Checked git status/revisions and runtime versions. A broad `rg` into earlier probe evidence produced truncated output and an OS temporary-file-read error for raw.json; it is not usable timing verification and no candidate/timing verdict relies on it.

Independent lifecycle trace before relying on implementer coverage:

- `edit()` assigns draft/text then `invalidate()` increments revision/request, terminates the old worker and clears results/error immediately. For nonempty/noncomposing drafts it sets busy true. The effect includes a real 250ms debounce before starting a disposable production worker.
- App busy is also owned by source/target/reference/date/hour/device changes. A helper armed while prior work is pending cannot assume the next true value belongs to its action; a new action may remain continuously busy. Changed call sites must either own an idle starting state or explicitly handle this boundary.
- Successful worker completion sets busy false and results in the same React update. Oversize/invalid zone/reference, worker-start rejection, worker error and no-result messages also settle busy false; helper readiness is synchronization only and must retain independent exact assertions.
- Request identity protects late completions after edits/clear/cleanup. The helper must not infer freshness merely from old existing results or an already-false busy attribute; observation must start before the real action.
- Mutation delivery can coalesce busy true then false in one batch. A final-only attribute read misses the intermediate pending cycle. Old-value records, action/event ownership and final attached-panel state need review.
- Action rejection, action timeout, missing/replaced panel, navigation, page close and conversion timeout need bounded rejection plus observer/timer/global-registry cleanup. A waiting promise must not become an unhandled rejection while the action is still pending.
- Global Playwright expectations have a 10s timeout; adding a separate 10s synchronization wait before an unchanged 10s assertion can double a failure path. Review the shared deadline and exact post-settlement checks rather than accepting a broad settled predicate as result correctness.
- Fixture origin ownership is shared except WebKit or explicitly isolated release tests. No helper may fetch/log/store conversion input or change worker/update/privacy behavior. Review must retain the pending/cancellation/no-result/update journeys and every existing exact expectation.

Implementation verdict: pending exact candidate. Original TIE-375 target verdict: unverified; local ARM conversion observations cannot establish a complete equivalent Linux Web/Pages pair or its ≥20% Actions/free-quota acceptance. Physical-device/mobile/installation/screen-reader acceptance was not exercised.
