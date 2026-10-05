# Independent bounded runtime code review

Original completed verdict; `initial-source-assessment.md` is preserved unchanged. No peer report was read before either independent assessment. Root released the serial controls window before this review opened browsers. No application source, tests, dependencies or workflows were edited, and no builds/Actions/commits were run.

## Exact scope and provenance

Base/head checkout `cea0de547094ba51a598fdc4303409fdf1d36bb7`; uncommitted candidate Choices `3047272ecae9a0c681ff7b09ed0592b00ad40cef`, ZoneCollection `cc0356e8ae31c2716ffb70b8a8d78a147dc6a5ff`. Unchanged App/style/control identities are recorded in the initial report. Served baseline `/tmp/chronoshift-virtualized-zones/baseline-runtime/dist` at `http://127.0.0.1:4327`; candidate `/tmp/chronoshift-data-zones/candidate-runtime/dist` at `http://127.0.0.1:4328`. Full shell and service-worker SHA256 plus release metadata are preserved in `runtime-probe.json`. Main scripts observed from the actual documents: baseline `/assets/index-B3d9YDa-.js`, candidate `/assets/index-B5lUMAkf.js`. Both release source markers refer to the same base; source blobs and served hashes distinguish them.

Command: `mise exec -- bun docs/qa/ci-data-zones-2026-10-05/newcode/runtime-probe.ts`. Bundled Chromium `153.0.8010.12`; fresh separate contexts, desktop 900x2400, DPR 1, en-AU, Australia/Sydney, normal motion (`no-preference`), real public hooks and frozen production assets, preview CSP. The tall viewport bounds code/state checks without injecting scroll preconditions; it does not establish ordinary viewport visual/mobile quality. No force clicks, motion suppression or explicit sleep/native-animation waits. Native keyboard events follow summary expansion immediately. Playwright assertions await state visibility as normal.

Actual successful bounded observation window: `2026-10-05T12:23:09.241Z` through `2026-10-05T12:23:11.402Z`. Both variants completed 13 recorded checkpoints. These are observation clocks, not performance measurements; baseline/candidate order and preceding harness revisions must not be used for savings claims. Comparison processing was complete by actual UTC clock `2026-10-05 12:23:36 UTC`. Report written afterward.

## Results

- Every one of the 454 original logical rows matches baseline/candidate in order, original value/key, label, description, ARIA position/setsize attributes and generated label/description linkage. Values and keys are each unique. Native nonvirtualized rows omit explicit position/setsize in both. All label/description associations resolve correctly. `row-state-comparison.json` preserves exact comparisons and raw rows remain in `runtime-probe.json`.
- Opening target manually renders the complete collection. ArrowDown then End supplies the last option's actual ID as active descendant; Enter commits the last original alias ID `mountain`, not its label or regional equivalent.
- Typing `tokyo` produces the same two exact suggestions in both; Tab without focused suggestion leaves the exact typed value `tokyo` and closes the popup. The target input retains its label and help description.
- Unrecognized custom text produces zero selectable `data-value` rows and the same single RAC `role=option` No matches placeholder. Input and Group invalid flags are set. Escape closes while retaining the exact custom text. Correcting to the supported fixed-offset input `+05:30` and blurring via Tab preserves that exact input and clears invalid semantics in both.
- Clearing to empty retains valid device fallback. Manual reopen recovers all 454 choices after the preceding invalid/few/empty transitions.
- Focusing More options, pressing Enter, immediately Tab then native typing `Paris` leaves source focused with `Paris`, while target remains empty. Source keyboard ArrowDown/Enter deliberately commits canonical `Europe/Paris`. No delayed source entry callback steals typing in this exercised condition.
- Source manual opening after all target filtering preserves the complete baseline row inventory, demonstrating that filtered neighbor/index clones did not corrupt shared full data. Its active descendant is under its own source list ID, distinct from target's list owner.
- Clicking Reset preferences clears both controlled fields. Source accepts a new `Europe/Paris` entry and Tab preserves it afterward, while target remains empty. This exercises external controlled-value changes and later recovery.
- No warning/error console messages or page errors were observed in either final journey; no screenshot stylesheet tooling ran during that journey.

## Preserved earlier probe failures and corrections

This was not a first-attempt probe pass. Four preceding harness versions are retained intact with clocks, logs, original scripts, raw JSON, HTML and screenshots. All occurred in both variants; none is a demonstrated candidate-specific correctness failure.

1. `harness-hash-failure/`, 12:21:38.582–12:21:38.811 UTC: Node-compatible crypto rejects ArrayBuffer passed directly to update. Corrected the evidence hasher to Uint8Array before any navigation occurred.
2. `harness-count-failure/`, 12:21:51.799–12:22:02.450 UTC: reviewer initially guessed 563 rows; both actual complete collections have 454. Corrected the expected inventory count; subsequent exact full-row comparison independently establishes equivalence, not just equal count.
3. `harness-placeholder-failure/`, 12:22:17.084–12:22:27.980 UTC: zero role=option expectation incorrectly counted RAC's intentionally nonselectable empty-state wrapper. Corrected to zero data-value options plus one matching No matches wrapper. Original markup preserved.
4. `harness-offset-failure/`, 12:22:44.436–12:22:55.511 UTC: `UTC+05:30` is not supported as an App preference zone by the unchanged `validZone`/Temporal path. Both correctly remain invalid. Corrected the input to supported `+05:30`; did not alter application offset semantics.

The original failures are not replaced by the final passing output. Their captures do not certify visuals; screenshot-tool effects would be separate from final normal-use console observations.

## Findings and separate verdicts

**Implementation:** approved within this frozen source and bounded Chromium code/state/context scope; no correctness blocker found. Exact direct declarations of locked react-aria 3.52.1/react-stately 3.50.0 remain required before adopting/final gate, because the candidate now imports them directly. Preserve the independent adversarial review and root gates for other scopes. This verdict does not certify all interface or lifecycle behavior.

**Original CI efficiency report:** still unresolved. No hosted Linux matched run, monthly rounded quota proxy, artifact byte-hours or raw improvement was measured by this reviewer. The strict >=20% quota/storage and raw improvement versus 307 seconds/eight objective cannot be inferred from row equivalence, functional approval or closed initialization source design. Do not close that goal from this report. Root owns matched/full/final gates.

## Evidence gaps and ownership release

Firefox, WebKit, mobile/short/narrow visual render, pointer-wheel and hover journeys, PageUp/PageDown geometry, actual zoom, physical phones/install/share menus and screen readers were not exercised by this reviewer. No independent whole-suite, offline/update/hard-refresh or final published artifact acceptance was performed. StrictMode/SSR is source-traced only; App is already client-only. Delayed clipboard/import ownership remains unchanged surrounding App scope, not independently re-exercised here. No runtime persistence/network privacy instrumentation was added or audited beyond unchanged source ownership.

The probe completed browser.close, context.close and server.stop(true); shell process exited 0. Both reviewer-owned 4327/4328 servers and all reviewer browser handles are stopped before root's exclusive measurement window.
