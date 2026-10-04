# Independent code review — initial candidate

Reviewed 2026-10-05 (Australia/Sydney). Base `7c41d51035d761b331fec3f082c2d897baa30e81`; candidate `18b8a1dee8f8d5af04bc1f6352fb697ce66ba300`. Read the saved verbatim brief in `/tmp/chronoshift-controls-pr.md`, repository `AGENTS.md` and `docs/developer/review.md` before inspection. Did not inspect the other reviewer's verdict. No source/test edits or shared-dist rebuilds.

## Verdicts

**Implementation: blocker (P2).** The decorative chevron on searchable timezone fields is displaced from Chromium's native datalist indicator hit target. Fix the native hit target position and add a regression that tests actual native indicator bounds or the pointer journey. The common closed-field geometry and unchanged preference/event handling are otherwise sound in the inspected scope.

**Original report: bounded related consistency verified; original report remains unverified.** Candidate closed fields in IAB at the implicated observed 578px width now share 44px heights and text insets; this matches the observed engineering inconsistency. Exact user browser/version, cache/asset history, and whether the report meant the native popup or the closed field are unknown. This is a local artifact review, not a published journey or physical-device/screenreader acceptance.

## Finding

### P2 — Native timezone arrow hit target is left of the visible arrow

`web/src/style.css`, `.choice-control input` and `::-webkit-calendar-picker-indicator` (candidate lines 271–291): `padding-inline-end:40px` reserves space outside the input's content area, while the native indicator remains in that content area. `opacity:0` hides its actual location. The shared decorative arrow is instead positioned 16px from the wrapper's right edge and is pointer-transparent.

Independent Chrome 154.0.8037.93 CDP inspection at viewport 578×1000: `#target-zone` rectangle x=33, y=336, width=364, height=44; visible arrow center approximately (377,358). The native UA-shadow picker border quad spans x=334.578125–356, y=347.28125–368.71875. The visible arrow therefore lies outside the native click target. A click there only focuses the input in IAB; IAB did not expose a datalist popup for other pointer/Down checks either, so that observation alone is not used to claim a browser-specific popup regression. Native-target geometry is the independent blocker evidence.

The root's proposed positioning rule was independently injected into an isolated Chrome test page (no repo source edit): input position relative; native indicator position absolute, inline-end12px, top50%, width/height16px, margin0, translateY(-50%). UA-shadow bounds then moved to x=357.125–384 at the same y bounds, covering the visible arrow center. Chrome headless screenshots do not capture a usable native popup here and ArrowDown/Enter left the empty value unchanged; this injection establishes hit-area alignment, not the full native popup pointer/keyboard journey.

Probe: `native-indicator-probe.ts.txt`; relevant UA input subtree: `chrome-dom.json`. Before/after screenshot artifacts are `chrome-visible-arrow-before.png`, `chrome-native-area-before.png`, and `chrome-visible-arrow-proposed.png`. The injected proposed screenshot is diagnostic, not a candidate screenshot.

## Scope and derivation

Before relying on the new regression, inspected failure paths for native indicator hit targets, closed text/chevron padding, native select labels/semantics, date field rendering, grid wrapping, appearance anchoring/focus, resize/theme draft preservation, source invalidation, target/hour-cycle redisplay, and copy request ownership. Read full App state/effects/run/edit/invalidate/copy handlers and responsive/forced-colors CSS. Markup retains IDs, labels, list relationships, native select/input types, handlers and React state ownership. No custom popup state or new asynchronous ownership is introduced. Theme media listener cleanup, worker cancellation/request IDs, source invalidation and target/copy recovery remain unchanged.

The geometry regression uses concrete brief dimensions and does distinguish the base per supplied before evidence, but its `selectOption` calls do not exercise native pointer/keyboard option selection. It asserts neither the datalist's native indicator bounds nor a pointer click on the decorative arrow, so it can pass with this finding. No unrelated engine or lifecycle bug was identified in the changed scope.

## Rendered journeys and measurements

CUA IAB, fresh localhost origin `http://127.0.0.1:4194/`, macOS; initial desktop 1280×720, then 578×1000 dark, then 320×1000 light. Created a draft `April 9, 2026 3pm UTC`, target `Pacific/Chatham`, and converted. Opened More options and Appearance. All six fields (theme, target/source timezone, reference date, numeric date order, time display) measured height44, start inset12, font16/line24; timezone/select end inset40 and date end inset12. Dark captures visibly show aligned input and Convert top edges, consistent borders and chevrons. At 320, all fields are44px high, options x33/w254, theme x101/w186; appearance x84/y64/w220/h104, trigger x260/y12/w44/h44, so right edges304 coincide and gap8. Document scrollWidth320. Native long select content is truncated within its field at this narrow size; options remain native.

Saved actual renders: `iab-dark-1280.jpg`, `iab-dark-578.jpg`, `iab-light-320.jpg`. Draft and result (`3:45` under IAB device locale) survive resizing and theme selection. Escape from theme closes Appearance and focuses its trigger. Target change to Tokyo and 24-hour display reformat existing result to `0:00` under IAB locale; source change to UTC invalidates it and returns Ready to convert. Theme chevron pointer click expands the native select per accessibility state, although native OS popup pixels/options are not included in the IAB screenshot.

## Commands, artifact identity and gaps

- `git diff <base> <candidate> -- web/src/App.tsx web/src/style.css e2e/controls.spec.ts`; full surrounding code reads; `git rev-parse HEAD` confirmed candidate before root's subsequent dirty patch.
- `PORT=4194 mise exec -- bun scripts/serve-web.ts` (approved socket-bind escalation), isolated server session24000. Brief allocated4191; switched4194 at root instruction. Initial sandbox starts reported EADDRINUSE though neither port had a listener; escalation succeeded. No unowned server was reused.
- `mise exec -- bun /tmp/chronoshift-controls-code/probe.ts` with installed Chrome channel (approved browser launch). First diagnostic style injection failed CSP as expected; isolated context then used test-only `bypassCSP:true` to inspect proposed CSS geometry. Production app CSP was not modified. Final probe exited0.
- CUA measurements and asset links: `/assets/index-63khBTiw.js`, `/assets/index-CLkld-aa.css`. Dist release metadata `sourceCommit:local`, base `/`; root says built before candidate commit from candidate runtime content. SHA256 CSS `2417de5e7ed658d50ca159dfdeed0a510f7a5346846eab5a505b4f2bc452c204`; JS `9f5dac319d4688eaab3b7472a44afbe70af6163c01e87a208ebdfa8cd8f7b673`; worker `e17b01198be6045d352561d10fe1f6004eb83d106b13f16ef027f0ec36230704`. This report identifies inspected artifact hashes; it does not independently reconstruct the build provenance.

Did not run/repeat full checks or the implementer's five-profile suite. Cross-engine automated gates belong to root; this review focused on an independent native-control failure path and rendered IAB journey. Native popup styling/positioning, real Chrome GUI popup selection, forced-color OS rendering, actual zoom, screen readers and physical mobile devices remain unverified. No inferred physical-device or broad accessibility certification.
