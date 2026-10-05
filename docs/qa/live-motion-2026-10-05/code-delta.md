# Independent focused code delta review

Original review and CI-failure finding are retained in `code-initial.md` and `code-ci-original.md`. This report independently reviews the actual fixed candidate, without relying on the complementary review verdict.

From: `9a4250219442d9217a903109448a1db0529f37ac`.
Candidate: `0f7812fc2e59d9adb1d5c7f6eac92ca23240a2f8`.
Scope: CSS-only delta, popup/button/anchor geometry, reduced-motion inheritance and nearby early-open paths. App request ownership, error/import/IME handling and result/copy rendering are unchanged; retain the earlier nine bounded lifecycle passes for that unchanged scope. The earlier CSS geometry approval is superseded by the original CI supplement.

**Implementation:** approved within this focused scope; no blockers found in the actual fixed candidate.

**Original feature report:** N/A. **New CI failure report:** matched candidate failure retained, and fixed-candidate success established for the implicated interaction journey and adjacent early-open behavior. This is bounded browser evidence, not physical-device certification.

The delta limits pressed/hover translated feedback to Copy, text and example buttons; anchored timezone/calendar/select controls and summary no longer translate on press. The workspace and positioned outer popover use an opacity-only surface-fade. Result/detail-child reveals and live pulse remain purposeful. The existing important reduced-motion selectors still disable both fade and translate animations, transitions and pseudo-element motion. No animation wait, parsing/request change, click forcing, arbitrary test sleep or weakened existing acceptance expectation was introduced. Details-child reveals remain translated; their nested source and calendar early-open checks below passed while those animations were active.

Commands:

- `git diff 9a42502..0f7812f -- web/src/style.css`, unchanged App/vendor overlay owner tracing.
- Existing own port 4252 preview continued to serve root-built candidate; no reviewer build or dist edit.
- `OVERLAY_VARIANTS=candidate OVERLAY_RUNS=3 OVERLAY_LABEL=fixed-0f7812f mise exec -- bun docs/qa/live-motion-2026-10-05/code/overlay-probe.ts`: 6/6 pass with normal motion and no CSS/media overrides, three independent fresh Chromium contexts and three Firefox contexts. Exact same freeform/invalid/custom-offset/empty-toggle/resize/Tokyo-pointer/New-York-source journey as the candidate diagnosis; no sleeps. Raw timing, events and outcomes in `code/overlay-probe-fixed-0f7812f.json`, 2026-10-04T20:38:31.493Z–20:38:47.244Z.
- `mise exec -- bun docs/qa/live-motion-2026-10-05/code/early-overlay.ts`: 6/6 pass at 280×960, normal motion with no override: early target search+pointer choice, early More options/source search+pointer choice and early reference calendar date choice in each browser. Entries record active animations at open; workspace and popup computed translate were `none`, with 140ms/220ms animations still running. Calendar day 15 committed and popup closed; target/source pointer choices committed Asia/Tokyo. Raw timing/assets in `code/early-overlay-fixed.json`, 2026-10-04T20:38:54.930Z–20:38:58.359Z.

Environment: macOS 27.0.1 (26A434), arm64, mise-managed Bun 1.4.0; Chromium headless 153.0.8010.12 and Firefox 155.0; en-AU, Australia/Sydney. Fresh independent contexts. Fixed artifact CSS `index-Bst_xchV.css` SHA256 `8d8248b5671d0f98e2298e5ac449864a7fb21c7df9eba5c936dfa978ebd69e9f`; app `index-BRfazo2p.js` SHA256 `df48eadefaa3fe7d7a8ac31c64752129d81c62e00a55dcde2e155319eff6ce22` (app bytes unchanged from initial candidate). Release metadata `local`, root base; public identity belongs to later publication audit.

The additional `overlay-probe-isolated-combined.json` diagnostic run crossed the root's rebuild of dist; it is explicitly excluded from the acceptance/causal totals. The unmodified fixed-candidate run began after the fixed artifact was available and is the acceptance evidence. This reviewer did not rerun the full suite or all browser profiles; root owns full required CI and the existing complete control assertions. Earlier owner/reduced-motion tests remain valid where CSS suppression semantics and App logic are unchanged. Hosted behavior, Linux full-gate result, physical IME/phone/screen reader and user motion preference acceptance remain separate gaps until matching evidence is obtained.
