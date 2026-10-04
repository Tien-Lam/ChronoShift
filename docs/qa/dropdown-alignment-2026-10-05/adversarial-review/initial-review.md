# Adversarial review — initial candidate

- Base: `7c41d51035d761b331fec3f082c2d897baa30e81`.
- Candidate: `18b8a1dee8f8d5af04bc1f6352fb697ce66ba300`.
- Scope: App control shells/layout and corresponding CSS; native pointer/keyboard behavior, long choices, narrow/wide themes, forced colors, input/results across resize. Source/tests were not edited and shared dist was not rebuilt.
- Review brief: saved verbatim in PR28 and `/tmp/chronoshift-controls-pr.md`. Read repository AGENTS.md and `docs/developer/review.md`; derived popup-hit-target, narrow truncation, native popup, focus and state challenges before reading the implementer's new regression. Did not read that regression or the other reviewer's report.
- Environment: macOS27.0.1 build26A434; mise-managed Bun1.4.0; production root-path preview. Start attempts4192 and4195 returned EADDRINUSE under sandbox. Isolated preview4197 started with approved sandbox escalation (`PORT=4197 mise exec -- bun scripts/serve-web.ts`, session75980). No runtime release mutation/testMode.
- Timing: independent probes completed2026-10-04T13:25:20.097Z (2026-10-05 Sydney). Review browser journey/probes approximately10minutes; no delayed lifecycle failure implicated in original report.

## Identity

`git diff --exit-code 18b8a1d -- web/src/App.tsx web/src/style.css` passed before inspection. `dist/release.json` identifies `sourceCommit: local`, base `/`; it is not an exact commit-attested release. The candidate App/CSS source is clean and served runtime CSS has the candidate shared shell. Assets captured by SHA256:

- HTML c448971c0ba3edfe122dc9260f9902db35a479a55027806ef294896277248fc4
- CSS `index-CLkld-aa.css` 2417de5e7ed658d50ca159dfdeed0a510f7a5346846eab5a505b4f2bc452c204
- App `index-63khBTiw.js` 9f5dac319d4688eaab3b7472a44afbe70af6163c01e87a208ebdfa8cd8f7b673
- Worker `worker-C690IjaR.js` e17b01198be6045d352561d10fe1f6004eb83d106b13f16ef027f0ec36230704

## Independently observed journeys

CUA IAB (WKWebView surface) at1280×720: Appearance and More options expanded by pointer. Theme chevron pointer opened its native AX popup, Down/Return selected Light; visual theme and select value changed. Native popup pixels/options are excluded from screenshot/AX detail, so its position was not established. Numeric dates pointer/Down/Return selected Day/month at320px. Direct native typingTokyo updated helper toTokyo/Asia/Tokyo.

At target-zone bounds(129,391)-(468,435), pointer at(448,413), exactlyright−20 on decorative arrow, only focused the input. Pointer atright−50 also focused, and typedTokyo produced no visible native suggestion popup. This surface does not establish native datalist popup behavior; Chrome CUA was unavailable. Independent bundled Chromium153.0.8010.12 probes with blank target at offsets20/45/50/55/60 plus ArrowDown/Enter (and twoArrowDown/Enter) never selected a value. They cannot distinguish suppressed headless native popup from broken target, so this is an evidence gap rather than independent functional proof.

CUA converted `April 9 2026 at 9am UTC` toTokyo (18:00 Thu9Apr2026) then resized1280→320 preserving text and displayed result. Long source `America/Argentina/Buenos_Aires`, date control, numeric date and time display remain within254px fields, with truncation before the arrow. Source edits appropriately cleared old conversion. A date filled via CUA's bridged date API was later empty after native menu interaction; the separate real-engine probe retained it in all profiles, so the IAB bridging observation is not asserted as an application regression.

Independent Bun script `/tmp/chronoshift-controls-adversarial/probe.ts` (copied here as `probe.ts`) exercised fresh contexts across Chromium153.0.8010.12, Firefox155.0, WebKit26.6, Pixel7 Chromium and iPhone13 WebKit emulation. At320px entered explicitUTC input, targetTokyo, long source, reference2026-04-09, DMY choice, converted; resized to1440×900 and changedDark; resized back320 and Light. Results preserved exactly in all5profiles, reference retained, zero horizontal overflow and zero pageerrors. `independent-probes.json` stores exact UA/bounds. All7controls/button are44px; choices have12px text inset and40px rightpadding. Appearance rectangle at320 is(84,64)-(304,168),220×104 with8px trigger gap; remains inside viewport. Wide target/button sharetop391/bottom435. Chromium forced-colors emulation retained visible black borders/arrows on white control backgrounds; capture inspected. This is emulation, not OS high-contrast certification.

Captures `iab-wide-light.png`, `iab-320-long-controls.png`, five `*-wide-dark.png`, five `*-320-light.png`, `chromium-320-forced-colors.png` record actual rendering. Inspected wide/narrow IAB and Chromium forcedcolors/iPhone captures; all profiles have measurement evidence.

## Findings and verdicts

**Implementation: approval withheld for18b8 pending native datalist hit-target repair/review.** Own pointer journey raised an unresolved arrow-to-popup usability concern, not proof across engines. During this initial review the root advised a separate code review had independently measured displaced Chromium nativeindicator and would fix it. This report does not use that other report as independent test evidence; the concern must be resolved at the exact next revision. No additional blockers were found in the exercised closed-field, theme, long-choice, resize or forced-colors scope.

**Original report: bounded related consistency verified; report-level resolution still unverified.** Shared44px closed-field measurements and narrow/wide alignment match the likely closed-field interpretation. Original browser/version, exact reported popup-vs-field meaning and historical cache/release state remain unknown. No previous-release failure was independently recreated in this review; root's existing base failure is separate evidence. Native popup alignment was not captured; physical-device, nativekeyboard, screenreader, actualzoom and post-publication acceptance remain unexercised. Do not close the original report based solely on these measurements or emulation.
