# Independent source code review: virtualized timezone choices

Reviewer `virtualized_zones_code_review`, clean context. Actual source-observation window: **2026-10-05 11:56:03–11:56:53 UTC**, from clock tool readings. Report writing occurs after that window; writing completion is not instrumented. No peer verdict or implementer check report was read before this record. The saved brief and the previous code reviewer’s original virtualization report were read as requested; the previous adversarial report was not read.

Inspected base HEAD `cea0de547094ba51a598fdc4303409fdf1d36bb7`, dirty candidate Choices blob `bce946afa5b2547f3bece17b3c928c80ab952b35`, CSS blob `bfa9ef0fd59fee36bd8547cf71875e0fd8c8a25a`. Independently confirmed with `git rev-parse HEAD` and `git hash-object`. Environment: Darwin arm64 27.0.0, mise Bun 1.4.0, Node 26.8.1, gh 2.100.0. Commands were source reads, `rg`, Git identity/status/diff, `uname -a`, `mise current`, and clock reads. No browser, build, test, Actions dispatch or production/test edit was performed. This report file is the only reviewer write.

## Independent paths derived before check reports

1. Initial input filtering must retain all logical items even though only a viewport is rendered. Source and target controlled values must stay independent. A pointer hover must not set the suggestion later committed by Tab, while keyboard focus and option presses must still commit the exact choice identity.
2. Full collection → a filtered subset → no match → full collection must reset stale scroll/layout/focus and keep custom offsets usable. Empty state must not be mistaken for a real option; React Aria renders an empty role-option wrapper without `data-value`.
3. End/Home/Arrow and PageUp/PageDown from the input must use logical collection keys, persist the focused key, mount its option and scroll it into the viewport. A mounted active descendant alone does not establish visible focused content.
4. Measured rows must adapt from 62px estimates to intrinsic one/two/multiple-line heights and invalidate when width changes. Resize while scrolled or focused, very narrow widths and a short landscape popup can expose overlap, extra empty area or inaccessible interior choices.
5. Closing during entry/scroll and reopening by typing must dispose item observers/scroll handlers/timers and acquire the current owned list. Ancestor focus scrolling must be distinguished from menu scrolling and native pointer input. Immediate scroll → pointer press must not be hidden by Playwright actionability waits.
6. Conversion, preference, async worker, offline/update and explicit activation owners must remain untouched; virtualization must not change privacy or runtime asset trust. Source preservation alone does not replace the complete gate or published-artifact evidence.

## Source findings

The production diff is limited to public `Virtualizer`/`ListLayout` wrapping `ChoiceItems` with `byValue`, estimated row size 62 and observed item sizing, plus scoped block layout/hidden horizontal overflow. Generic selects do not enter this rendering path. Full `timezoneOptions`, search map, option IDs, controlled ComboBox state, commit ref, hover policy and App preference/conversion owners are unchanged.

Installed primary source `react-aria-components` 1.21.1 confirms collection construction is independent from visible rendering: ComboBox builds a collection while closed, ListBox receives its existing state, and Virtualizer replaces its collection renderer. `useDndPersistedKeys` persists the focused key. `ListLayout` measures natural height, marks rows estimated after width changes, and ignores late measurements of removed keys. `useVirtualizerItem` avoids hidden zero-height measurements and disconnects direct-child ResizeObservers when item/key lifetime ends. `useScrollView` removes document/window listeners, clears scroll timeout on unmount, guards resize reentrancy and bounds scrollbar relayout to two passes. Queued content-size microtasks recheck the live ref through the callback.

Two integration risks remain for runtime falsification, not yet proven regressions:

- `useScrollView` sets the virtual content’s `pointer-events:none` during scrolling and restores it using a 300ms timeout. A native click/tap immediately after scroll may hit the listbox rather than an option; waiting for locator click actionability could mask it. This is an explicit prior evidence gap and requires matched baseline/candidate native input.
- The ComboBox’s input keyboard delegate is constructed outside the nested Virtualizer renderer context. Its `layoutDelegate` is absent in this integration and it defaults to DOM geometry. Logical Arrow/Home/End still derive collection keys, but PageUp/PageDown stops traversal when a next option has no DOM geometry. Overscan may make ordinary page navigation work; it does not prove the offscreen/resize cases. Runtime must measure the actual focused option’s visibility and exact result across repeated page navigation.

No verified source-only blocker was found. That is a bounded source conclusion, not adoption approval. The native-height iPhone input-reopen precondition correction is present in the unchanged current controls test: scroll into view, pointer focus, closed assertion, then fill Tokyo and reacquire its owned list. Its comments distinguish intended ancestor-scroll dismissal. I have not run it or used its existence as acceptance evidence.

## Separate verdicts and gaps

- **Implementation:** pending runtime evidence. No verified source blocker; remaining pointer, focused geometry, width/collection/reopen lifecycle paths must be resolved before approval. Source review confirms cleanup and ownership but cannot certify actual rendered behavior.
- **Original CI objective:** unresolved. No measurements were run in this source-only window. Local DOM reduction or successful control checks do not establish at least 20% improvement to rounded runner-minute proxy and artifact byte-hours, raw-time improvement, all 116 unit/273 browser cases, subpath/privacy/offline/update/exact-tree gates or serialized main-only publishing.

Physical-device performance, real screen-reader announcements, actual zoom, installation/share and human visual acceptance are unexercised. Frozen dist serving identity, browser versions, normal-motion geometry and runtime clocks will be recorded in an additive runtime report after root releases the serial window. This original record will remain unchanged.
