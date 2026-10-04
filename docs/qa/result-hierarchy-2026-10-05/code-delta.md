# TIE-369 independent code review — narrow result delta

Review window 2026-10-04T19:26:06–19:27Z (2026-10-05 Australia/Sydney). Base for delta `ba32383c5609f72a6fa551bbddd6b53df74bd80e`; final candidate HEAD and measured `release.json.sourceCommit` `150875f7906093ed20b94d76533e0f523f4a9430`. Earlier code review `/tmp/chronoshift-result-code-final.md` and original independent risk assessment remain preserved. This focused review retains approval of unchanged scope while revisiting the new CSS and the reported worst-case precision wrap. The previous probe used 1:00:30.123 pm; it did not establish the reported 11:59:59.123 pm narrow-line behavior.

## Delta and findings

No actionable findings or blockers.

The only runtime delta is the <=359px media rule: `.result-top` changes from two grid columns to one full-width `minmax(0, 1fr)` column, and `.copy-button` uses `justify-self: start`. This rule follows the base result grid and mobile typography rules, so equal-specificity cascade applies correctly. DOM order remains output then Copy, with source context and original after it. Copy closure, accessible name, payload, 44px minimum height, group associations, date-only explanation and unresolved-target gating remain unchanged.

The general `.copy-button` selector also matches the update-banner action, but that action is a flex item; grid self-justification does not reposition it. There are no other runtime changes or CSS component overrides of these selectors.

## Exercised evidence

- `git rev-parse HEAD`, exact `git diff ba32383c 150875f -- web/src/style.css web/src/App.tsx`, `cat dist/release.json`, media-rule inspection and `rg` for Copy usage. Read-only; successful. Exact HEAD remained final candidate. No source edits or builds.
- `mise exec -- bun /tmp/chronoshift-result-code-delta-probe.ts`: focused browser probe against root preview 4250, production release explicitly asserted to final candidate. macOS arm64, mise-managed Bun 1.4.0, Playwright 1.63.0, fresh Pixel 7 Chromium 153.0.8010.12 and iPhone 13 WebKit 26.6 emulated contexts, en-AU/Australia/Sydney, UTC target. Waited for offline readiness; intentionally rejected clipboard writes to exercise manual fallback. Twenty cases passed: precise 11:59:59.123 pm and date-only Thursday, 9 April 2026 at widths 280, 320, 359, 360 and 390 in both engines. Measured numeric text range stays on one visual line at every tested width; no horizontal document overflow; Copy height/width >=44px; at <=359 Copy follows below output. Exact independent time/date/payload assertions pass and no page errors observed. Boundary 359/360 is exercised.
- At 280px in both engines, output now has full 214px content width; numeric `11:59:59.123` occupies one approximately 183px text rectangle. The `pm` suffix can occupy the next line, preserving the full numeric time on one line. Date-only heading is 62.375px tall with 31.2px line height (two lines), and Copy is approximately 55.03×44px below the result.
- Probe source and JSON measurements retained at `/tmp/chronoshift-result-code-delta-probe.ts` and `/tmp/chronoshift-result-code-delta-probe.json`. An initial probe-only expected-payload assertion assumed the ISO source label was `UTC`; actual unchanged ISO source label is `UTC+00:00`. Corrected the independent expectation to the established source-label behavior and reran all twenty cases successfully. That was a probe error, not a production finding. Terminal command success followed by successful JSON completion is recorded; no full gate repeated.

## Verdicts and evidence gaps

Implementation: **approved for exact final candidate within the focused CSS delta and previously reviewed unchanged scope; no blockers**. Numeric precision remains intact on a single line in both exercised emulated engines, date-only uses two lines at 280px, Copy keeps its 44px target and payload semantics, and the breakpoint behaves as intended.

User-request acceptance: measured layout confirms recovery of the reported narrow numeric fragmentation and date-only width loss. Final adversarial rendered visual acceptance remains pending; this reviewer did not inspect final screenshots for readability/aesthetic quality. No hosted, physical-device, screen-reader, actual zoom, or broad visual-quality acceptance is claimed. Root owns full gates/publication/closure and adversarial screenshot review. Earlier code-report gaps outside this bounded delta remain qualified there.
