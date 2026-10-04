# Published menu acceptance

[PR #29](https://github.com/Tien-Lam/ChronoShift/pull/29) merged final head
`72950c0a09ac40bd8619d489bf979e1b66da6170` as main
`6676e56d52224b8758a9a5cf6b11b448f5d7f1f6`. Both independent reviewers
approved the final runtime, including compact-calendar CSS at `8e73756`;
the final head adds regression assertions and saved evidence.

[Web CI 37220330336](https://github.com/Tien-Lam/ChronoShift/actions/runs/37220330336)
passed 108 unit tests, all 183 browser scenarios, formatting/build/corpus and
one Pages subpath scenario. [Pages 37220709137](https://github.com/Tien-Lam/ChronoShift/actions/runs/37220709137)
completed at 2026-10-04 17:30:06 UTC (5 October Sydney). It reused that exact
trusted artifact after digest/source-tree verification. Main, PR head and tested
merge-checkout trees all equal `95b5d1e7463e97d91da86435d1a944a9c38d2035`.
[The independent delivery audit](delivery-audit.md) verifies both ZIP digests
and byte equality of all 14 published files. No second full gate was needed.

Published `release.json` source is
`1ef1aa07b3e3a2d7cf657150fc6083aa8987699b`, the tested PR merge checkout;
base `/ChronoShift/`, cache `fedcd4a1116faa6d`. Runtime assets are
`index-FdxLUOhD.js`, `index-B1Onfw0N.css`, `worker-C690IjaR.js`.

## Matching live evidence

- [Standard hosted log](hosted-tests.log): four checks passed in 27.1s on
  desktop Chromium and Pixel 7 emulation with the exact expected release.
  New conversions after offline close/reopen, a 21-second idle boundary,
  manifest/scope, release/MIME and effective restrictive CSP passed.
- [Retained-client report and brief](hosted-existing/brief.md): the old healthy
  `3d51f40` client stayed old for 12m37.655s with unchanged draft/result and
  UTC/light preferences. Actual Update now preserved the draft/preferences,
  loaded the expected artifact and exercised all six menus, calendar selection
  and an offset conversion. Closing/reopening offline converted fresh input.
  Zero normal diagnostics. Supplementary captures came from a separately
  identified fresh session; they do not depict that retained transition.
- [Narrow hosted evidence](hosted-narrow/brief.md): actual 280px DOM viewport,
  all six opened controls in both themes, compact calendar and field alignment,
  no horizontal overflow. Twelve captured states were visually inspected.
  Separate pointer Chatham selection/reopening remained open through two
  three-second waits, then Convert worked. Resizing 280→1280→280 preserved the
  draft/result; zero normal page/console/CSP errors.
- [Root's actual IAB observations](iab-hosted.json) and captures show the
  published assets, old-tab explicit update with preserved synthetic draft,
  all six opened menus, balanced 302px calendar/280px grid, canonical Chatham
  selection and selected-row reopening, followed by a 6:00 UTC conversion.
  Foreground tab8 had zero normal warning/error logs. The final dark capture
  shows the shared theme menu alongside the result and conversion settings.

The root's requested viewport override did not resize these IAB pages: their
actual measured widths remained 1280px. Those captures are not claimed as narrow
evidence. Background tab9 option-click attempts also timed out after menus
closed between interactions. The cause is unconfirmed; that path is not counted
as a successful selection. Foreground IAB selection succeeded, and independently
measured foreground Chromium 280px timed pointer paths did not reproduce it.
This records the capability distinction without inventing a production cause.

## Closure boundary

The clarified TIE-343 report includes closed fields and opened lists; this
published implementation replaces the inconsistent native lists and verifies
the matching scope. Earlier native-field-only evidence and unknown report scope
are historical, superseded by the user's “yeah all” clarification and this
publication. Historical browser version/viewport remain unknown.

The nine separate actual-device acceptance gaps remain open: TIE-304, TIE-306,
TIE-309, TIE-311, TIE-312, TIE-314, TIE-317, TIE-318, TIE-320. Emulation,
keyboard/AX checks and desktop timings do not establish physical folding,
installation, OS sharing, screen-reader use, actual zoom or phone performance.
The [pre-publication Linear audit](linear-audit-before-publication.md) retains
its original 26 Done / 10 In Progress / 1 Canceled snapshot; closing only TIE-343
changes this to 27 / 9 / 1. Project/milestone metadata is an older separate snapshot.
