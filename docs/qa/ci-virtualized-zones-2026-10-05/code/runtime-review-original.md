# Independent code review: runtime addendum and implementation verdict

Reviewer `virtualized_zones_code_review`. This additive original runtime report retains [source-review-original.md](source-review-original.md) unchanged. No current peer report/verdict was read. Independent paths were derived and recorded before reading the implementer’s report/checks. Base HEAD `cea0de547094ba51a598fdc4303409fdf1d36bb7`; inspected uncommitted Choices blob `bce946afa5b2547f3bece17b3c928c80ab952b35`, CSS `bfa9ef0fd59fee36bd8547cf71875e0fd8c8a25a`. Final evidence-inspection clock **2026-10-05 12:02:44 UTC**; report writing follows and is separate from observation timing.

**Implementation: request changes.** The new nested virtual renderer leaves the ComboBox input’s page-navigation delegate using DOM-only geometry. This changes PageUp/PageDown into inconsistent one-option moves when neighboring logical options are not mounted. The previous ordinary collection supplies those rectangles. Full logical collection retention and mounted/visible active descendants do not establish preserved page navigation.

## P2: connect input page navigation to the virtual layout

Affected source: `web/src/components/Choices.tsx:86–93`, nested `Virtualizer` wrapping the ListBox below the outer ComboBox.

Trigger: open the full target timezone list, focus its first option with Home, navigate with PageDown, press End, then PageUp twice. No filtered query, custom value, pointer selection or fault injection is needed. Normal motion, native input keyboard events and unchanged production CSS were used. The comparator awaits changed focused identity and then verifies that the option fits inside the owned list/window before the next key; no sleeps, force clicks or reduced-motion bypass are used.

Exact matched Firefox155.0 target result at **900×640**, 1x raster, `en-AU`, Sydney timezone:

| Stage | Baseline logical option | Candidate logical option |
| --- | --- | --- |
| End | mountain, 479 | mountain, 479 |
| PageUp | munich, 474 | central, 478 |
| PageUp again | cape town, 469 | eastern, 477 |

The list is320px high and the implicated rows are62px high in both artifacts. All those options are fully visible after each action; no document scroll occurs in this Firefox comparison. Thus this is a page-navigation semantic regression, not an assertion that focused content is invisible. Repeated candidate PageDown/PageUp single-row moves also occur for both fields in Chromium153.0.8010.12 and WebKit26.6 under the tall isolation control. In all completed baseline sequences, the independent comparison contains zero single-row page moves; candidate comparisons contain numerous single-row moves.

Installed primary implementation corroborates the mechanism: `react-aria-components/dist/private/ComboBox.mjs` calls `useComboBox` outside the nested Virtualizer context; it passes no layout delegate in this integration. `react-aria/dist/private/combobox/useComboBox.mjs:83–96` constructs `ListKeyboardDelegate` with the absent `layoutDelegate`, defaulting to `DOMLayoutDelegate`. `ListKeyboardDelegate.getKeyPageAbove/Below` walks logical keys but stops once `getItemRect(nextKey)` is null. The nested ListBox’s own delegate receives `ListLayout` through `CollectionRendererContext`; keyboard events originating from the input use the outer delegate instead. Persisting the focused key repairs its mounting after the truncated move but does not supply the missing page traversal geometry.

Required resolution: provide supported virtual geometry to the input keyboard navigation owner, with an independently specified baseline/candidate page-step regression, or revert this candidate. Do not accept assertions that merely require changed/mounted/visible focus and eventual Enter commit. Those assertions pass while PageUp changes only one row. Check repeated PageUp/PageDown before and after width changes and retain the shared ancestor-scroll failure separately.

## Exact served artifacts and runtime provenance

Scripts serve the existing frozen root builds with the unchanged `PREVIEW_CSP`, using Bun servers on4323/4324 and fresh browser contexts per condition. No release replacement, worker cache damage or fake controller was injected. Contexts do not reconstruct cached/updated-tab history. Source marker remains the base commit for the uncommitted candidate, so actual asset identity and source blob are recorded rather than claiming that release metadata identifies the candidate.

| Build | Origin | Worker version | Main asset | CSS asset |
| --- | --- | --- | --- | --- |
| Baseline | `http://127.0.0.1:4323` | `137a92f4186517c7` | `index-B3d9YDa-.js` | `index-Bst_xchV.css` |
| Candidate | `http://127.0.0.1:4324` | `4360114561ceab09` | `index-CGs25w8u.js` | `index-CK-q34-T.css` |

Fetched HTML/SW/JS/CSS SHA-256 hashes and release metadata are preserved in each comparator JSON’s `versions` field. Normal-motion layout rectangles, owned-list/active-descendant IDs, exact focused values, logical positions/set sizes, mounted counts, viewport/raster settings and scroll state are retained per step. Bounded key/scroll events are retained in the corrected and tall runs. All servers stopped in the scripts’ cleanup and all browser contexts closed.

Environment: Darwin arm6427.0.0, mise-managed Bun1.4.0, Playwright1.63.0 installed library/browsers, Chromium153.0.8010.12, Firefox155.0, WebKit26.6. No tools were installed. This correctness window ran independently of the adversarial reviewer’s correctness window; root explicitly released it after its serial controls. Therefore timings below are provenance clocks, not matched speed measurements.

| Script / actual command | Runner start UTC | Runner end UTC | Conditions and result |
| --- | --- | --- | --- |
| `mise exec -- bun docs/qa/ci-virtualized-zones-2026-10-05/code/page-navigation-probe.ts` | 11:59:01.052 | 11:59:29.426 | 12 conditions; Firefox4 pass, Chromium/WebKit8 close during page navigation. Preliminary poll could accept prior visible focus; retained and superseded for identity semantics. |
| `mise exec -- bun docs/qa/ci-virtualized-zones-2026-10-05/code/page-navigation-corrected.ts` | 12:00:09.343 | 12:00:37.157 | 12 conditions; Firefox4 complete27 recorded steps plus exact Enter at280×960. Chromium/WebKit8 close with document scrolling at900×640. Focus identity awaited, but one-row page moves were initially outside its pass assertions. |
| `mise exec -- bun docs/qa/ci-virtualized-zones-2026-10-05/code/page-navigation-tall-control.ts` | 12:01:16.610 | 12:01:31.538 | Chromium/WebKit8 complete27 steps plus exact Enter at280×2400; eliminates ancestor scrolling and retains the candidate page-step regression. Tall control is causal isolation, not native-height acceptance. |
| `mise exec -- bun docs/qa/ci-virtualized-zones-2026-10-05/code/baseline-collection-control.ts` | 12:02:31.184 | 12:02:33.526 | Independent complete baseline DOM order:454 Chromium,479 Firefox/WebKit. Derives exact positions for the retained comparator steps without reading candidate internals or implementer expectations. |

All four scripts exited0 because they intentionally record per-condition failures rather than abort the evidence collection. Exit0 is not a blanket scenario pass. `.ts`, `.json` and `.log` files for each script are preserved beside this report; failed conditions and preliminary assertions were not overwritten. There are no runner retries, traces or screenshots in these custom probes. No screenshot tool injected styles, and no rendered visual-quality acceptance is claimed.

## Shared failures and limits

Chromium/WebKit normal900×640 PageDown closes the list in both artifacts; bounded events record input key, list scrolling, document scrolling and `aria-expanded=false`. Candidate can reach that boundary earlier. The tall control removes document scrolling and both artifacts complete, so the ancestor-scroll dismissal is a competing cause rather than an isolated new invisible-focus defect. Source `navigateToKey` can returnfalse after updating a focused key when selection-on-focus is disabled, allowing native page scrolling; the precise responsibility of every queued callback is not isolated by this report. Do not dismiss these failures or use tall geometry as native acceptance.

Normal-use CSP arrays and page-error arrays are empty in all own conditions. Candidate Firefox emits the browser’s scroll-linked positioning warning in both fields; the raw warning is preserved, not reclassified as a ResizeObserver/page error. No ResizeObserver warning occurred in these bounded probes. This does not establish all resize/timing states.

Root reported both serial unchanged20-identity controls blocks ended19/20. Baseline failed its Firefox source `Asia/Tokyo` fill at controls428 because `aria-controls` was absent. Candidate’s controls428 passed temporarily, then ownership readnull and its alias hover timed out against `id=null`. These are root-reported distinct boundaries, not my runtime observation and not proof of one shared cause. They do not support a matched speed comparison or successful full gate.

My role did not exercise immediate scroll→pointer shielding, broad mobile collection transitions, full visual brief/themes, physical phones, screen readers, actual zoom, OS installation/share, offline/cache/update transitions, hosted publication or the complete gate. Those are outside this bounded keyboard/lifecycle review; the source report explains unchanged owner inspection and remaining gaps. No production/test/workflow/dependency edits, builds, Actions dispatches or commits were performed.

## Separate final verdicts

- **Implementation:** not approved. P2 page-navigation regression requires a supported delegate integration or reversion and a focused exact-revision review. Logical collection, row observation cleanup and eventual visible focus/Enter are preserved within exercised conditions, but their success does not excuse page-step loss. Shared normal-height dismissal and incomplete root control acceptance remain open evidence gaps.
- **Original CI goal:** unresolved. No comparable Linux speed/artifact byte-hour pair, raw-time improvement, rounded-minute20% reduction, complete116-unit/273-browser identity gate, subpath/privacy/offline/update trust or serialized main-only published artifact acceptance is established by this work. All clocks above describe correctness observations, not performance evidence.
