# Adversarial review — focused final delta

**Implementation: approved within the reviewed scope; no blockers.** This focused review of `a33a3f0b1d5bb9428d83886910a0c52617b9195d` resolves the initial native datalist arrow hit-target concern. The unchanged control layout, conversion/edit handlers and five-profile state/theme/forced-colors evidence retain the initial inspection described in [initial-review.md](initial-review.md).

**Original report: bounded related closed-field consistency verified; full original-report resolution remains unverified.** The original user's exact browser/version, historical release/cache state and popup-versus-closed-field meaning are unknown. This review establishes shared rendered control metrics and actual native picker hit-node overlap. It does not establish browser/OS popup positioning, physical-phone interaction, screenreader or actual zoom acceptance. Hosted publication verification is still pending. Keep these report gaps explicit rather than treating implementation approval as original-report closure.

## Revision and artifact identity

Read the saved focused delta brief in PR28 `/tmp/chronoshift-controls-pr.md`. Inspected exact CSS and added UA-shadow regression delta from `18b8a1dee8f8d5af04bc1f6352fb697ce66ba300` to `a33a3f0b1d5bb9428d83886910a0c52617b9195d`. `git diff --exit-code a33a3f0b -- web/src/App.tsx web/src/style.css e2e/controls.spec.ts` passed. Only datalist input positioning/native picker CSS and its regression changed; surrounding source/target, preference, conversion and resize owners retained initial approval evidence.

No shared dist rebuild or source/test edit. The initial preview on 4197 remained available; focused probes use a new isolated origin `http://127.0.0.1:4198/` to exclude the earlier service worker/cache. Started with approved escalation: `PORT=4198 mise exec -- bun scripts/serve-web.ts`, session 61230. CUA and independent Chromium each reported exact new CSS/script URLs. Dist release metadata is `sourceCommit: local`, base `/`; source and content match the candidate but this is not a commit-attested published release.

SHA256:

- HTML: `636e34732a5b638b84d923231dcfedccc0f12a674b154365d201eed0cbb97fe8`
- `index-DoIHQZIy.css`: `834f5ac0192477019d3627f63f05450500743e4384b96ba9afa8fd15c12acefc`
- `index-C5vBwCkE.js`: `9f5dac319d4688eaab3b7472a44afbe70af6163c01e87a208ebdfa8cd8f7b673` (same App bytes as initial)
- `worker-C690IjaR.js`: `e17b01198be6045d352561d10fe1f6004eb83d106b13f16ef027f0ec36230704` (unchanged)

## Independent verification

Ran `mise exec -- bun /tmp/chronoshift-controls-adversarial/delta.ts` with approved browser-launch escalation on macOS 27.0.1, Bun 1.4.0, bundled Chromium 153.0.8010.12. Saved executable probe as [delta-probe.ts](delta-probe.ts), all bounds/hit nodes/timestamp as [delta-bounds.json](delta-bounds.json).

Derived the stronger check before relying on the regression: geometry overlap alone might hide another element intercepting the click. The probe queries `DOM.getNodeForLocation` with `includeUserAgentShadowDOM:true` at the actual rendered chevron center and inspects the returned node. For each source/target input at widths 320, 480, 578 and 1280, in both themes, all 16 locations resolved to native `id=picker`; all overlapped its actual UA-shadow border box. Examples:

| Width | Field | Arrow point | Native picker x range | Native picker y range | Hit |
| --- | --- | --- | --- | --- | --- |
| 320 | Target | 267, 358 | 247.125–274 | 347.28125–368.71875 | picker |
| 320 | Source | 267, 574.5 | 247.125–274 | 563.78125–585.21875 | picker |
| 1280 | Target | 448, 413 | 428.125–455 | 402.28125–423.71875 | picker |
| 1280 | Source | 596, 573.5 | 576.125–603 | 562.78125–584.21875 | picker |

The test's new native-bound assertion directly tests the reported regression and is bounded to Chromium CDP; this review's hit-node assertion additionally checks interception. Prior root regression's original failure (arrow 267 > old native maximum 246) is separately recorded in the saved brief and is not claimed as an independently repeated failure here.

The independent delta probe then edited target Tokyo, long source America/Argentina/Buenos_Aires and explicit UTC message, converted, resized 1280→320 and switched light. Result text remained exact. Narrow light and forced-colors renders were captured as [delta-320-light.png](delta-320-light.png) and [delta-320-forced-colors.png](delta-320-forced-colors.png). Inspected the narrow capture: aligned 44px controls, no new text/arrow collision. Initial five-engine/profile measurements remain applicable to unchanged layout and handlers.

CUA fresh-origin IAB: loaded new CSS/script, opened Appearance and More options, clicked target chevron at right−20, opened Theme by pointer and selected Light with Down/Return. At 320px, clicking field text area and native typing Tokyo updated the target/helper and converted result to 18:00 Thu 9 Apr 2026. [delta-iab-320-light.png](delta-iab-320-light.png) records the final render. Viewport override reset and review tab closed. Native datalist popup pixels/options still were not exposed in this IAB surface; field-text editing was verified separately after picker interaction. Full native popup selection/position is an explicit evidence gap, not inferred from bounds or headless CDP.

No new blockers were observed. This focused delta retains the initial broader engine/theme/long-label/resize inspection rather than rerunning unrelated lifecycle suites. Full CI and hosted checks belong to delivery and remain pending at this verdict.
