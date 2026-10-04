# ChronoShift acceptance status

Implementation: merged main `9e7c1cb` ([PR #16](https://github.com/Tien-Lam/ChronoShift/pull/16)), including update/privacy work at `63a2553` and immediate update activation at `946c303`. Published from main: https://tien-lam.github.io/ChronoShift/.

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

- Foundations: exact conversion fixtures, standalone 353-input resilience corpus, typed parsing/timezone semantics, cancellation and input limit. The independent code/adversarial reviews passed after iterative fixes; TIE-302 now has a measured feasibility/deferral decision in [the isolated experiment](../../experiments/temporal-span/README.md), awaiting final review/merge.
- Experience: the original release had Liquid Lens and Glass Command; TIE-323 consolidates these into modern Glass Command, Dark/Light/System themes, concise conversion-first layout, progressive corrections, clipboard fallbacks, fluid/foldable layouts and automated accessibility.
- Offline: complete cache/readiness, cache repair, local preference migration/reset/quota recovery, bounded single-use handoffs, distinct-release multi-tab compatibility and rollback cleanup.
- Delivery: Bun/mise CI, GitHub Pages/subpath/HTTPS checks, retained rollback artifacts, local-only security/privacy coverage and browser performance harness. Native maintenance is retired. Independent privacy/security review passed; CI usage is re-measured at main cutover.

## Remaining acceptance work

Direct production [browser side-panel task evidence](../qa/browser-2026-10-04/README.md) now supplements the automated gate: actual Copy/Paste, keyboard navigation, CST ambiguity/target changes, date rollover, DST correction, a 10,000-character conversion, both designs/themes, preference reload and accepting a waiting live update. Seven CSS viewport sizes from 280px to 1920px preserve draft/results with no horizontal overflow. Screenshots and accessibility snapshots are saved with the report. These are browser observations; unexercised capabilities remain identified below.

TIE-315 is **Done**: its recorded browser capability/fallback criterion is now satisfied alongside the existing automated restart/update/storage/share regressions. Both independent clean-context evidence reviewers approved closure. Actual OS share reception remains TIE-314.

Each ticket below remains **In Progress** because its original acceptance criterion lacks the capability-specific evidence listed. Supplementary browser and automated evidence does not close that gap or reduce the criterion.

| Linear ticket | Existing supplementary evidence | Exact acceptance gap |
| --- | --- | --- |
| TIE-304 — Adaptive conversion page | Desktop paste/type → Convert, Clear/reconvert, long input and 280–1920px CSS viewport state preservation | Real phone paste/type → Convert and actual 200% browser zoom with long input. CSS viewport resizing does not establish either result. |
| TIE-306 — Target timezone selector | Keyboard selector, city alias/target changes, offline automated coverage and semantic accessibility snapshots | Actual screen-reader operation of the selector while offline, including supported city aliases. |
| TIE-309 — Accessibility and task completion | Desktop keyboard journey, CST choice, target change, Copy/Paste, 320px viewport and automated accessibility/reduced-motion checks | Actual screen-reader journey through paste meeting text → CST choice → target change → copy → offline reopen, with results/errors announced once appropriately; actual 200% browser zoom with long text. Record task friction and resolve blocking findings. |
| TIE-311 — Installation | Manifest/start URL/icon validation and direct dismissible install-guidance/fallback checks | Actual installed offline launch reaches the converter on Android, iOS and desktop, recording supported installation behavior on each platform. |
| TIE-312 — Preference persistence | Browser reload, automated restart/migration/reset, denial/quota/clear recovery and text-history privacy checks | Preferences survive an actual installed-app restart. |
| TIE-314 — Installed share reception | Automated local POST handoff, privacy/type/size/expiry checks and ordinary paste fallback | A supported OS share menu sends text to the installed app while offline and opens a usable input/result flow. POST interception does not establish OS integration. |
| TIE-317 — Real mobile browser matrix | Exact launch fixtures across Chromium/Firefox/WebKit, desktop UI conversion/zone/copy and automated offline restart | Real Android Chrome and iPhone Safari cached offline restart, timezone selection and copying. Mobile viewport/engine emulation does not establish those browser/device results. |
| TIE-318 — Representative-phone performance | Production bundle breakdown, development-machine browser harness and functional 10,000-character conversion/Clear checks | Named representative phone and reproducible conditions; production cold online/warm offline startup, p95 for typical ≤2,000-character and limit 10,000-character conversion, and editing/Clear responsiveness. Assess the agreed budgets without inferring phone performance from desktop samples. |
| TIE-320 — Production release | Main-only HTTPS publication, exact-artifact verification, live browser offline restart/fresh conversion and exercised update/rollback | Actual installed production app launches after offline restart and converts newly entered text. Browser HTTPS/offline checks do not establish installed-mode acceptance. |

The available browser side panel has no native-app control, OS installation/share-menu control, screen-reader control, actual browser-zoom control or physical-phone access. Its CSS viewport emulation cannot supply those missing results. The existing [production browser report](../qa/browser-2026-10-04/README.md) remains supplementary evidence.

Optional ML discovery is tracked separately as TIE-302 (**In Progress**, measured feasibility/deferral approved; merge pending); its experiment and disposition do not close any of these nine acceptance gates.

Use [device-smoke-test.md](../developer/device-smoke-test.md). Record each physical test with: release SHA, date, device, OS, browser/version, design/theme, posture, network mode, task, observed result, pass/fail, and reproducible defect. Pending entries are not assumed passes. Use synthetic messages only in evidence.

Browser performance reports identify their exact source release, asset breakdown, browser/platform and method. Development-machine samples do not close TIE-318. The benchmark remains outside routine CI so timing work does not consume recurring Actions quota.

Independent review and regression evidence: [review-2026-10-04.md](review-2026-10-04.md). Both reviewers approved after fixes; merge authorization does not claim physical-device acceptance.

Merged main `9e7c1cb` passes the final GitHub gate (108 units, 113 browser scenarios and subpath), exact-artifact main publication and four live HTTPS checks. The 4 October 2026 state snapshot records twenty tickets Done, including TIE-315 after the direct browser evidence review; nine In Progress, optional ML now In Progress for its measured experiment, TIE-323 In Progress for the requested redesign, and native failure maintenance Canceled. [offline-web-linear-map.json](offline-web-linear-map.json) records this snapshot, not live Linear state. Partial acceptance checkboxes and observations are recorded in Linear. No installed-mode, screen-reader, actual zoom or phone p95 result is inferred from screenshots.

TIE-323 records the new user-requested single Glass Command redesign, retaining Dark/Light/System themes. Its [side-panel evidence](../qa/glass-command-2026-10-04/README.md) and final reviews/gates are recorded separately from the previously published two-design evidence.
