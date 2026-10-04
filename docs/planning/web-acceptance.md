# ChronoShift acceptance status

Implementation: [PR #16](https://github.com/Tien-Lam/ChronoShift/pull/16), update/privacy work at `63a2553` and immediate update activation at `946c303`. Published preview: https://tien-lam.github.io/ChronoShift/.

## Browser capability evidence

“Automated pass” means a tested browser engine/profile, not a physical operating-system browser or installed app. The 98 scenarios include 64 independent exact expectations executed through the production worker in each of the five core profiles. Three additional cases exercise Chromium viewport segments/safe areas.

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

- Foundations: exact conversion fixtures, standalone 353-input resilience corpus, typed parsing/timezone semantics, cancellation and input limit. All implementation tickets await review; optional learned detection remains TIE-302.
- Experience: Liquid Lens and Glass Command, Dark/Light/System themes, concise conversion-first layout, progressive corrections, clipboard fallbacks, fluid/foldable layouts and automated accessibility.
- Offline: complete cache/readiness, cache repair, local preference migration/reset/quota recovery, bounded single-use handoffs, distinct-release multi-tab compatibility and rollback cleanup.
- Delivery: Bun/mise CI, GitHub Pages/subpath/HTTPS checks, retained rollback artifacts, local-only security/privacy coverage and browser performance harness. Native maintenance is retired. TIE-319 is ready for review; CI usage is re-measured whenever browser coverage changes.

## Remaining acceptance work

| Work | Linear tickets | Evidence required |
| --- | --- | --- |
| Physical phone/foldable task | TIE-304, TIE-311, TIE-312, TIE-314, TIE-315, TIE-317 | Device/OS/browser version, installed offline restart, virtual keyboard, rotation/folding, clipboard, supported share menu |
| Human accessibility/usability | TIE-309 | Keyboard and screen-reader task, actual 200% browser zoom, CST choice, target change, copy and offline reopen; record observed friction |
| Representative-phone performance | TIE-318 | Named device/conditions, cold online/warm offline startup, typical and 10,000-character p95, editing/Clear responsiveness |
| Release cutover | TIE-320 | Review/merge decision and remaining acceptance above; then publish only main and remove migration-branch deployment policy |
| Optional ML discovery | TIE-302 | Actual model export/runtime feasibility, independently reviewed held-out conversion comparison and phone size/latency/memory; no model accuracy claim yet |

Use [device-smoke-test.md](../developer/device-smoke-test.md). Record each physical test with: release SHA, date, device, OS, browser/version, design/theme, posture, network mode, task, observed result, pass/fail, and reproducible defect. Pending entries are not assumed passes. Use synthetic messages only in evidence.

Browser performance reports identify their exact source release, asset breakdown, browser/platform and method. Development-machine samples do not close TIE-318. The benchmark remains outside routine CI so timing work does not consume recurring Actions quota.
