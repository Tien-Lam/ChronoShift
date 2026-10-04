# Unified menus independent review brief

Base: `b5447ef` (main before this continuation).
Initial runtime head: `3f64b311fbd34aff40ecb61da8cb569bfd8f7e4a`.
Regression implementation is concurrently being completed by a separate agent;
tests are uncommitted and must not be treated as a finished acceptance gate.

Original user report: “the theme selection dropdown looks misaligned” and
“all the dropdowns look different from one another.” User clarified “yeah all”
on 2026-10-05, including opened option lists. Prior closed-field fix PR28 is
published, but native menus retained browser/OS presentation. Report browser
version, popup screenshot and original viewport are unknown. Prior hosted
release source: `3d51f40a7708e42cd0a4c89bd4094b723d3c5ba3`.

Intended behavior: consistent44px fields,16px/24px text,12px text inset;
opaque themed popovers, aligned to their trigger and bounded by the viewport;
consistent row spacing, checks, hover and keyboard focus. Theme, numeric date
order, time format, both editable timezone suggestions and date calendar are
included. Preserve dark/light/system, freeform valid offsets, invalid/ambiguous
zone disclosure, source/target independence, partial date edits, draft/results
through resize and offline conversion. No network conversion, runtime CDN or
permanent input storage. Dates must not use an older committed value while
the visible date is incomplete. Reset and automatic-date clearing must recover.

Scope: web/src/App.tsx, style.css, components/Choices.tsx, DateChoice.tsx/.css;
pinned React Aria/date dependencies and generated notices/license fallback.
Nearby lifecycle owners: prefs persistence, conversion/copy invalidation and
worker ownership in App, engine zone resolution, update/offline platform code,
build precache and release integrity. No intended worker/deployment change.

Facts: candidate builds/typechecks;108unit tests and formatting pass. Real IAB
shows themed select/search/calendar menus and readable dates at280px. A fresh
Chromium probe fails the prior native Theme's shared-popover expectation and
passes candidate (before-after.json). Hidden React Aria form inputs initially
picked up global input display:block; fixed with explicit [hidden] rule. Open
combobox suggestions intentionally hide unrelated accessibility-tree content;
ordinary input tests commit with Tab. Pointer Convert while suggestions open
has succeeded in IAB. Root full183case gate is currently running4203.

Known unfinished investigation: regression agent observed clicking the target
timezone arrow with committed Pacific/Chatham can open then immediately close;
please independently trace/reproduce. Tests initially rewrote an existing
date with a single Backspace and retained digits; test helper is being fixed.
Empty-list library placeholder itself has roleoption, so selectable items
must be distinguished from disabled empty placeholder. These are observations,
not established causes or reviewer verdicts.

Commands/capabilities: mise exec -- bun run typecheck, bun run test,
bun run format:check; production dist currently served at4185, source not
rebuilt by reviewers. Use separate test preview ports and output directories.
No new tools installed outside mise. gh for GitHub. Do not mutate source,
package/build/dist, merge or Linear. Each reviewer saves own report plus actual
commands/measurements/captures, environment/timing and gaps. Do not read the
other reviewer's findings until your own initial report is saved.

Code reviewer: derive paths independently, then inspect state ownership,
controlled selection/blur/typing, cancellation, date validity and preference
reset/update/resize. Assess test expectations and payload/license/build effects.
Port4204; output /tmp/chronoshift-menu-code; report code-review.md here.

Adversarial reviewer: independently reproduce report-level UI journeys,
actual menus at narrow and wide widths in dark/light, filtering/selection,
outside-click/keyboard/focus, short viewport/resize, partial date/reset/recovery.
Record dimensions and actual captures/asset identity. Use browser side panel
CUA for visual journey; root relinquishes it during your review. Automated
development regression probes may use port4205 and output
/tmp/chronoshift-menu-adversarial. Report adversarial-review.md here.

Both: state separate implementation verdict and original-report verdict.
Unpublished candidate cannot establish hosted resolution. Physical devices,
installed OS integrations, screen readers, actual zoom and phone performance
remain separate open acceptance gaps. No other report is closed by this review.

## Dispatch and follow-up record

The code reviewer was created with no inherited context. Creating a second new
reviewer was rejected by the tool's retained-thread limit. The adversarial role
uses the prior independent acceptance reviewer, who did not implement or receive
the current menu work; its follow-up explicitly excludes prior verdicts and
requires independent failure derivation before reading tests. The regression
implementer is neither reviewer. Root plus these three agents fill the four
available concurrent slots; the requested five exceed the session limit.

Runtime deltas sent to both reviewers: `f3fb2c75d33ea48075afa5ed15fc2ab24fc15810`
adds the React Aria Group trigger wrapper. Independent testing showed this alone
does not resolve the selected-item scrolling failure.
`e8d625c6f01dc2e0403c13fc800c592cfa7e61c8` removes an unsupported
`--available-height` variable that left the list unbounded. The list now has a
320px cap, can shrink inside a flex-column popover and scrolls internally.
Both reviewers received the new revision and were asked to retest selected
far-down options, short viewports and surrounding lifecycle independently.

The initial runtime is independently served from a git archive at port4211,
with explicit source3f64b311 metadata. Local candidate builds default their
release identity to `local` unless CHRONOSHIFT_SOURCE_COMMIT is supplied;
root corrected an earlier mistaken exact-metadata assertion to both reviewers.
Runtime e8d625 currently maps to version7bdd44091d0f914b. CI/final publication
must establish exact source identity independently.

Final runtime/test head sent to both reviewers:
`b2be4d445d7bc596bd6efa38fb3c9e369d01332b`, explicitly built with that sourceSHA
(offline version0c7899d6b21e941d). The focused delta adds shared exact-hash CSP
for two deterministic React Aria interaction styles and normal-policy violation
checks, plus arbitrary inline style blocking beside the existing script check.
Both reviewers approved that application delta. The code reviewer independently
attributed WebKit screenshot-only `body {}` violations to Playwright, verified
the complete calendar matrix without captures, then separately approved skipping
WebKit routine captures while preserving all actual normal-use assertions.
