# ChronoShift acceptance status

Implementation: [PR #16](https://github.com/Tien-Lam/ChronoShift/pull/16), update/privacy work at `63a2553` and immediate update activation at `946c303`. Published from main: https://tien-lam.github.io/ChronoShift/.

## Browser capability evidence

“Automated pass” means a tested browser engine/profile, not a physical operating-system browser or installed app. The expanded 113 scenarios include 98 independent exact expectations executed through the production worker in each of the five core profiles. Three additional cases exercise Chromium viewport segments/safe areas.

| Capability | Chromium desktop | Firefox desktop | WebKit desktop | Android emulation | iPhone emulation | Physical devices |
| --- | --- | --- | --- | --- | --- | --- |
| Exact conversion, ambiguity, DST, dates/offsets | Automated pass | Automated pass | Automated pass | Automated pass | Automated pass | Pending |
| Offline close/reopen and fresh input | Automated pass | Automated pass | Stopped-origin pass | Automated pass | Stopped-origin pass | Pending |
| Preferences, quota failure, reset and migration | Automated pass | Automated pass | Automated pass | Automated pass | Automated pass | Installed restart pending |
| Partial update, three versions, old/new tabs, rollback | Automated pass | Automated pass | Automated pass | Automated pass | Automated pass | Installed update pending |
| Local POST handoff, expiry and invalid/large input | Automated pass | Automated pass | Automated pass | Automated pass | Automated pass | OS share menu pending |
| Manual clipboard fallback, keyboard, contrast and themes | Automated pass | Automated pass | Automated pass | Automated pass | Automated pass | Screen reader/zoom/task check pending |
| Manifest, app ID, icons, scoped launch | Build/subpath/HTTPS checks | Build checks | Build checks | HTTPS checks | Build checks | Actual install pending |
| Virtual keyboard, rotation and folding | Resize coverage | Resize coverage | Resize coverage | Resize coverage | Resize coverage | Pending |

The WebKit offline method stops a dedicated origin and confirms an uncached network request fails; it does not skip conversion. Automated POST interception proves local handling, while actual OS share-target availability depends on installation and the browser. Chromium is supplementary evidence for Chrome/Edge, and WebKit is supplementary evidence for Safari; actual branded desktop-browser checks remain open.

## Completed engineering work

- Foundations: exact conversion fixtures, standalone 353-input resilience corpus, typed parsing/timezone semantics, cancellation and input limit. The independent code/adversarial reviews passed after iterative fixes; optional learned detection remains TIE-302.
- Experience: Liquid Lens and Glass Command, Dark/Light/System themes, concise conversion-first layout, progressive corrections, clipboard fallbacks, fluid/foldable layouts and automated accessibility.
- Offline: complete cache/readiness, cache repair, local preference migration/reset/quota recovery, bounded single-use handoffs, distinct-release multi-tab compatibility and rollback cleanup.
- Delivery: Bun/mise CI, GitHub Pages/subpath/HTTPS checks, retained rollback artifacts, local-only security/privacy coverage and browser performance harness. Native maintenance is retired. Independent privacy/security review passed; CI usage is re-measured at main cutover.

## Remaining acceptance work

Direct production [browser side-panel task evidence](../qa/browser-2026-10-04/README.md) now supplements the automated gate: actual Copy/Paste, keyboard navigation, CST ambiguity/target changes, date rollover, DST correction, a 10,000-character conversion, both designs/themes, preference reload and accepting a waiting live update. Seven CSS viewport sizes from 280px to 1920px preserve draft/results with no horizontal overflow. Screenshots and accessibility snapshots are saved with the report. These are browser observations; unexercised capabilities remain identified below.

TIE-315 is **Done**: its recorded browser capability/fallback criterion is now satisfied alongside the existing automated restart/update/storage/share regressions. Both independent clean-context evidence reviewers approved closure. Actual OS share reception remains TIE-314.

| Work | Linear tickets | Evidence required |
| --- | --- | --- |
| Capability-specific phone/foldable task | TIE-304, TIE-311, TIE-312, TIE-314, TIE-317 | Installed offline restart, virtual keyboard, rotation/folding and supported OS share menu. Actual desktop browser clipboard, responsive viewport and install-guidance fallback checks now have direct evidence. |
| Human accessibility/usability | TIE-309 | Includes TIE-306 selector screen-reader acceptance. Keyboard and screen-reader task, actual 200% browser zoom, CST choice, target change, copy and offline reopen; record observed friction |
| Representative-phone performance | TIE-318 | Named device/conditions, cold online/warm offline startup, typical and 10,000-character p95, editing/Clear responsiveness |
| Release cutover | TIE-320 | User authorized independent reviews, iterative fixes and autonomous merge. Main-only publication replaces preview policies/job; the measured equivalent PR + main workload passes: 25% fewer rounded minutes and 81.74% less retained artifact storage. Physical installed-mode acceptance above remains open. |
| Optional ML discovery | TIE-302 | Actual model export/runtime feasibility, independently reviewed held-out conversion comparison and phone size/latency/memory; no model accuracy claim yet |

Use [device-smoke-test.md](../developer/device-smoke-test.md). Record each physical test with: release SHA, date, device, OS, browser/version, design/theme, posture, network mode, task, observed result, pass/fail, and reproducible defect. Pending entries are not assumed passes. Use synthetic messages only in evidence.

Browser performance reports identify their exact source release, asset breakdown, browser/platform and method. Development-machine samples do not close TIE-318. The benchmark remains outside routine CI so timing work does not consume recurring Actions quota.

Independent review and regression evidence: [review-2026-10-04.md](review-2026-10-04.md). Both reviewers approved after fixes; merge authorization does not claim physical-device acceptance.

Merged main 9e7c1cb passes the final GitHub gate (108 units, 113 browser scenarios and subpath), exact-artifact main publication and four live HTTPS checks. Twenty tickets are now Done, including TIE-315 after the direct browser evidence review; nine remain In Progress, optional ML is Backlog and native failure maintenance is Canceled. Partial acceptance checkboxes and observations are updated in Linear. No installed-mode, screen-reader, actual zoom or phone p95 result is inferred from screenshots.
