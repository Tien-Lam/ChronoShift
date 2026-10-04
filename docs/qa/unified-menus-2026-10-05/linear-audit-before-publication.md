# ChronoShift live Linear acceptance audit

Read-only audit at 2026-10-04 17:19 UTC (2026-10-05 Australia/Sydney), while PR #29 CI is running. Project UUIDs came from `docs/planning/offline-web-linear-map.json`; all four live issue lists were read with archived issues included and no further pages. Full descriptions and all available comments of the ten open issues were checked. No Linear or repository changes were made.

## Live issue counts

| Project | Total | Done | In Progress | Canceled | Remaining IDs |
| --- | ---: | ---: | ---: | ---: | --- |
| Web Conversion Foundations (P-TIE-14) | 11 | 11 | 0 | 0 | None |
| Simple Web Experience (P-TIE-15) | 11 | 7 | 4 | 0 | TIE-304, TIE-306, TIE-309, TIE-343 |
| Offline & PWA (P-TIE-16) | 7 | 4 | 3 | 0 | TIE-311, TIE-312, TIE-314 |
| Web Delivery (P-TIE-17) | 8 | 4 | 3 | 1 | TIE-317, TIE-318, TIE-320 |
| **Total** | **37** | **26** | **10** | **1** | **10 open issues** |

These are live issue counts, not project/milestone status claims. Map project/milestone metadata explicitly retains an older snapshot.

## Remaining engineering/delivery item

**TIE-343 — Align dropdowns and standardize form control styling:** live status In Progress; no comments supersede its description. The user's latest clarified acceptance explicitly includes opened menus, so PR #28's closed native fields alone cannot resolve the report. PR #29's shared styled Select/ComboBox popovers match the specified Theme, Numeric dates, Time display and both editable searchable timezone fields. The styled segmented reference date/calendar also fits the user's “all” control scope.

Saved candidate regression evidence (`docs/qa/unified-menus-2026-10-05/regressions.md`) covers real DOM menus, common alignment/rows/selected/focus styling, dark/light at 280/740/1280, keyboard/pointer/dismissal, custom offsets, search/empty/invalid recovery, independent zones, date partial-input recovery, preserved draft/results and resize across five browser profiles. It records a meaningful old-native/new-popup failure and the selected-zone popup-height defect/fix. Existing broader tests carry system theme, conversion, offline/update and privacy checks. The candidate is implemented; **retain In Progress until final PR CI, merge/publication, exact release identity and hosted/existing-client acceptance of the clarified scope are recorded.** Publication has not been inferred from local test success. This ticket's menu report does not subsume the separate physical/assistive-technology gates below.

## Nine unchanged actual acceptance gaps

All nine remain live In Progress. Their recorded code work/automated browser evidence does not establish the following missing acceptance:

| ID | Actual evidence still missing |
| --- | --- |
| **TIE-304** | Real phone paste/type → Convert; physical folding/virtual-keyboard/device accessibility validation where required; actual 200% browser zoom with long input. CSS viewport and hinge emulation are supplementary. |
| **TIE-306** | Actual screen-reader operation of the target selector while offline, including supported city aliases (coordinated with TIE-309). Keyboard/AX/alias automation already exists. |
| **TIE-309** | Actual screen-reader core-task journey and appropriate single results/error announcements; actual 200% browser zoom with long input; corresponding human task/friction/defect assessment. Automated accessibility and keyboard tasks do not close these criteria. |
| **TIE-311** | Actual installed offline launch on Android, iOS and desktop, recording named platform/browser support. Manifest, scope, icons, guidance and ordinary browser offline launch are already evidenced. |
| **TIE-312** | Preference retention through an actual installed-app restart on a named device/platform. Browser restart/migration/denial/quota/reset evidence is already recorded. |
| **TIE-314** | Supported OS share menu → installed app while offline → usable input/results. Synthetic local POST, handoff bounds/privacy and paste fallback are already evidenced. |
| **TIE-317** | Real Android Chrome and iPhone Safari cached offline restart, target selection and Copy. Engine/mobile viewport emulation does not establish real-phone behavior. |
| **TIE-318** | Named representative-phone reproducible cold-online/warm-offline startup and p95 conversion measurements with bundle breakdown; ≤2,000-character p95 <250 ms, 10,000-character <1 s and editing/Clear responsiveness assessment; exact fixtures/offline readiness retained for any resulting optimization. Desktop CPU reports remain supplementary. |
| **TIE-320** | Actual installed production app offline restart and newly entered conversion, plus the remaining physical/AT/phone acceptance represented above. Main-only cutover, trusted artifact publication and ordinary hosted browser/offline checks were already completed; old comments about pending cutover are superseded by the current description. |

No further unimplemented engineering ticket or active code blocker is declared among these nine. Obtaining actual acceptance may expose defects requiring engineering; absence of those measurements is not a code-success claim. TIE-334/TIE-335 are already Done following their separate fixes and matching hosted evidence. No issue was closed or acceptance criterion relaxed during this audit.

After verified publication and report resolution of TIE-343 only, the projected issue counts would be 27 Done / 9 In Progress / 1 Canceled; current counts remain 26 / 10 / 1 until Linear is actually updated.
