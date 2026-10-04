# Live browser side-panel evidence — 4 October 2026

Tested the production web app at https://tien-lam.github.io/ChronoShift/ through the Codex in-app browser side panel on macOS. All messages were synthetic. This is direct browser UI evidence, separate from the existing automated browser gate.

The deployed `/ChronoShift/release.json`, opened in another browser tab, identifies source `158c0b7551f480d0f6fb7330c832738a5a0ff4d8` and base `/ChronoShift/`. [Captured release identity](deployed-release.txt). PR #16 was merged as `9e7c1cb`; publication reused the verified, tree-identical PR artifact.

## Observed tasks

| Task | Directly observed result |
| --- | --- |
| Cmd+Enter conversion | `April 9, 2026 at 3pm CST` gives two explicitly labeled interpretations. In Los Angeles: US Central Standard 14:00; China Standard 00:00, both 9 April, UTC−07:00. |
| Target city alias | Changing the target to London retains both interpretations and produces 22:00 / 08:00 on 9 April, UTC+01:00. |
| Copy chosen interpretation | Copy China Standard reports success. Actual Cmd+V into the cleared input yields `8:00 · Thu, 9 Apr 2026 · UTC+01:00 London`, followed by the original message and its China Standard interpretation label. The session clipboard API returned an empty string; actual browser keyboard paste verified the copied text instead. |
| Paste button | After clearing the input, the app's Paste button restores that same copied output. |
| Waiting production update | Update now preserves the CST draft and London target. Results reset to Ready to convert; explicit reconversion restores both interpretations. Offline ready returns. |
| Keyboard path | Tab from the message reaches Paste, Clear, target, Convert and More options. Typing Tokyo into the focused target, Tab, then Enter converts without a pointer action. More options opens with Tab/Enter. |
| Date rollover | Tokyo target gives US Central Standard 06:00 on 10 April, with +1 day, and China Standard 16:00 on 9 April, UTC+09:00. |
| 12-hour format | The two Tokyo results become 6:00 am / 4:00 pm without losing interpretations. |
| DST gap | `March 8, 2026 at 2:30am in New York` reports that the time does not exist because clocks move forward, with edit/source correction guidance. Changing to 3:30am succeeds: 4:30 pm in Tokyo on 8 March, UTC+09:00. [Captured gap state](dst-gap.txt). |
| No result | `Please discuss the agenda.` shows a date/time example instead of a stale conversion. |
| Ordinary Enter | Adds a newline in the textarea and leaves Ready to convert; it does not submit. |
| Maximum accepted input | A 10,000-character synthetic message beginning `April 9, 2026 at 3pm in Tokyo.` converts successfully. Clear empties the input and resets the result. This is a functional check, not a p95 timing measurement. |
| Preferences and text privacy | Reload preserves Glass Command, Dark, Tokyo and 12-hour format. Ordinary input and result history disappear. [Captured reload state](preferences-reload.txt). |
| Appearance | Both Liquid Lens and Glass Command render in Dark and Light. System can be selected; no OS appearance transition was induced. Design/theme changes preserve an active conversion. |
| Install guidance fallback | Keep ChronoShift handy opens usable manual install/bookmark instructions, the offline-readiness prerequisite and storage-reset explanation. Got it dismisses the guidance; browser conversion remains available. No installation prompt or OS share menu was exercised. |
| Console | The side-panel log reader returned no captured error entries at the end of the exercised flows. |

## Responsive evidence

The same active CST draft, London target and two results survive resizing at all seven sizes below. Document `scrollWidth` equals `clientWidth` at every size, so no horizontal page overflow was observed. [Machine-readable observations](resize-observations.json).

| CSS viewport | Observation |
| --- | --- |
| 280 × 653 | Compact/cover-screen width; draft and both results preserved |
| 320 × 740 | Narrow mobile width; draft and both results preserved |
| 390 × 844 | Mobile width; draft and both results preserved |
| 640 × 360 | Short landscape window; draft and both results preserved |
| 768 × 1024 | Tablet-sized window; draft and both results preserved |
| 1280 × 800 | Desktop window; draft and both results preserved |
| 1920 × 1080 | Wide desktop window; draft and both results preserved |

Screenshots:

- [Liquid Lens, Light, 320px](liquid-lens-light-320.png)
- [Liquid Lens, Dark, desktop](liquid-lens-dark-desktop.png)
- [Glass Command, Dark, 390px](glass-command-dark-390.png)
- [Glass Command, Light, desktop](glass-command-light-desktop.png)
- [Install guidance](install-guidance.png)

## Acceptance implications and capability boundaries

TIE-315's automated restart/update/storage/share regressions and recorded browser capability fallbacks are complete. Its fallback criterion is supported by this actual Copy/Paste and guidance check, plus the final 113-scenario gate's denied clipboard/storage and invalid/oversized/local POST handoff coverage. Actual OS installed-share integration remains explicitly with TIE-314, rather than blocking the completed regression-automation ticket.

These observations also supply concrete acceptance evidence to TIE-304, TIE-306, TIE-309, TIE-311, TIE-312, TIE-317 and TIE-320. They do not establish every remaining criterion in those tickets. Dimensions above are CSS viewport sizes, not named hardware tests.

The side-panel browser advertises visibility and viewport controls, but no network-offline, browser-zoom, OS-installation, screen-reader or CPU-throttling control. Cmd+= was attempted five times; the measured CSS viewport remained 1280px and the page did not zoom. This is not counted as a 200% zoom pass. The accessibility tree and keyboard traversal are direct semantic/keyboard evidence, not a VoiceOver/NVDA task run. Side-panel conversion was not tested with the network disconnected; the existing four live HTTPS checks separately prove offline close/reopen and fresh conversion. No phone p95 claim is made from this UI check.

No blocking defect was observed in the exercised web flows. The report keeps unexercised capabilities explicit instead of converting browser screenshots into OS/device certification. Temporary viewport overrides are reset after the check.

Two independent reviewers with clean context checked the evidence, timezone expectations, app implementation and regression coverage. The adversarial reviewer and code/evidence reviewer both approved closing TIE-315 with no blocking findings. Their documentation findings were fixed: the acceptance matrix and P6 roadmap no longer leave TIE-315 pending, and testing documentation reflects the final 108-unit/113-browser gate and main-only publication.

Linear was updated with this report on all ten previously open acceptance tickets. TIE-315 is Done. TIE-304's Clear/reconvert criterion, TIE-311's guidance/fallback criteria, TIE-314's privacy/payload-fallback criteria and TIE-317's exact-fixture/no-known-correctness-defect criteria now have explicit completed checkboxes. Remaining criteria retain their original scope and status. The browser's original Glass Command/Dark/device-format/Los Angeles settings and Tokyo example were restored; the tab remains open as a deliverable.
