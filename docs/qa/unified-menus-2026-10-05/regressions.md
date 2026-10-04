# Unified menu regression evidence — 5 October 2026

This is implementation regression evidence, separate from the two independent reviews in this directory.

## Tested revision and environment

The final local run exercised runtime revision `b2be4d445d7bc596bd6efa38fb3c9e369d01332b`, production worker version `0c7899d6b21e941d`, and a test-only follow-up that omits WebKit screenshots from the normal CSP diagnostic journey. `dist/release.json` identified the same full runtime SHA with base `/`. No source or production files changed during the run.

Environment: Darwin arm64, mise-managed Bun 1.4.0, Playwright 1.63.0; bundled Chromium 153.0.8010.12, Firefox 155.0 and WebKit 26.6. The five projects were Chromium, Firefox, WebKit, Pixel 7 Android Chrome emulation and iPhone 13 WebKit emulation, with `en-AU` locale and `Australia/Sydney` timezone. The runner owned port 4202 and its output directory; WebKit used the repository fixture's isolated origin.

```sh
PLAYWRIGHT_PORT=4202 PLAYWRIGHT_HTML_OUTPUT_DIR=/tmp/chronoshift-menu-tests/verified-html \
  bunx --bun playwright test e2e/controls.spec.ts --workers=3 \
  --output=/tmp/chronoshift-menu-tests/verified-results
```

Result: **15 passed in 19.4 seconds**, with no retries. Strict TypeScript validation also passed after the helper and CSP assertions were added. The root agent separately owns the complete build/browser/subpath gates.

## Exercised behavior

Each profile checked dark and light themes at widths 280, 740 and 1280 pixels, height 960. Every state opened Theme, Numeric dates, Time display, target timezone suggestions, source timezone suggestions and the reference calendar. The assertions checked actual popover bounds, common theme colors/borders/radii, selected state, option sizing/typography, aligned 44-pixel fields, restored focus, preserved draft/results and absence of horizontal overflow. This covers 180 measured opened popovers across the five projects.

The focused scenarios checked:

- Keyboard opening, End/Enter selection, selected state on reopening, nested Escape before closing Appearance, focus return and pointer dismissal.
- Independent numeric-date expectations: `04/09/2026` means 4 September with DMY and 9 April with MDY. A segmented reference date of 9 April makes `Tomorrow` resolve to 10 April. Calendar ArrowRight/Enter chooses 10 April; clearing resets every date segment.
- Both complete-to-partial and empty-to-partial date editing block Convert with the explicit completion message. Reset preferences clears partial segments and restores successful conversion.
- Search by city, keyboard and pointer canonical selection, empty search results with no selectable value, invalid timezone recovery, the supported freeform `+05:45` offset, empty-input suggestions, resize while suggestions remain open, and independent source/target values.
- One pointer click on an uncovered visible Convert button while suggestions are open closes them and converts. Mobile recovery explicitly taps the input before further typing; an isolated Android synthetic `fill` without pointer reentry was not treated as a real-user failure.
- Normal interaction in every width/theme/profile produced zero `securitypolicyviolation` events, and the retained library stylesheet had a non-null CSS sheet.

Ordinary timezone entry elsewhere in the browser suite now uses the visible `enterZone` helper, which types and commits with Tab before addressing unrelated accessible controls. Select migrations use the visible button and popup option, never React Aria's hidden form select. The hosted CSP check also requires arbitrary inline CSS to remain blocked, alongside its existing inline-script rejection; the hosted check was edited here but was not run against a published deployment in this local verification.

## Meaningful failures and recovery

The original native-menu mismatch is recorded independently in [before-after.json](before-after.json): base `b5447ef` exposed a native SELECT and failed the themed DOM-popup expectation; the candidate exposed a button and passed. The saved [base capture](base-b5447ef-popup.png) and [candidate capture](candidate-popup.png) support that comparison.

A second failure was discovered while exercising the new implementation: reopening suggestions for the selected late-list timezone `Pacific/Chatham` immediately dismissed them. At 280 pixels, an independent DOM observer measured a 28,226-pixel list with `max-height: none`; opening scrolled the document by 188 pixels and closed the popup. The stylesheet referenced an unavailable `--available-height` custom property. The Group-only change did not resolve this failure. The bounded list-height correction did: the same pointer journey retained a visible 214-by-330-pixel popup at x=33, with Chatham selected. The same opened selected-zone path then passed across all final width/theme/profile checks.

See [selected-arrow-before-after.json](regression-evidence/selected-arrow-before-after.json), [before capture](regression-evidence/selected-arrow-before-280.png) and [after capture](regression-evidence/selected-arrow-after-280.png). The initial uncommitted tree's exact Git identity was not recorded; its worker version is retained. The intermediate and corrected revisions are identified in the JSON. This is explicitly an evidence gap rather than an invented exact tree match.

During CSP verification, WebKit reported two policy violations per screenshot because Playwright's screenshotter temporarily injects `body {}` to synchronize animations. A minimal probe reproduced this with both default caret handling and `caret: 'initial'`; the same app interactions without screenshot calls had no violations. Screenshots are therefore retained for Chromium, Firefox and Android emulation while normal WebKit diagnostics remain strict. No automation stylesheet was added to the application CSP, and no real violations were filtered out. The independent code reviewer retained [the screenshot provenance probe](code-evidence/csp-screenshot.json).

## Captures and limits

Final Chromium captures show the [dark 280-pixel menu](regression-evidence/menu-dark-280.png), [light 280-pixel menu](regression-evidence/menu-light-280.png) and [light 1280-pixel menu](regression-evidence/menu-light-1280.png). The full local report retains the other non-WebKit captures under the command's output directory.

These checks do not establish physical-device installation, virtual-keyboard placement, OS accessibility or screen-reader acceptance. Publishing, existing-client hosted acceptance, the complete suite and independent review verdicts remain the root agent's delivery responsibilities.
