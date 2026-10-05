# Source restoration and first-fill preparation delta review

Reviewer `virtualized_zones_code_review`. Bounded follow-up requested by root after rejecting v1. Actual read/observation clock window **2026-10-05 12:07:46–12:08:17 UTC**, from clock tool readings. Report writing follows that window. No browser, build, compile, Actions dispatch, commit or production/test edit was performed by this role. Commands read source/diffs/raw root logs and hashes; `git diff --check` passed. This addendum is the only write in this review turn; reviewer writes cease after saving it.

The earlier original source and runtime reports remain unchanged. No peer report was read for this delta; root’s rejection/API-correction addendum was read and its summary of other reviewers is disclosed rather than presented as independently obtained evidence. Failure paths below were derived from the test/helper/state owners and the preserved original failure boundaries.

## Exact scope

Independent `git hash-object` confirms restored Choices blob `d92d280bd71c6c2841a424d1ae9dbc53c203577c` and CSS blob `ffe5ce02cee2073a9b9dc888304465bf41a361f8`, identical to the base source. There is no production Choices/style diff. Thus v1’s added Virtualizer renderer and its DOM-only page-delegate integration are removed, rather than fixed or approved. The prior P2 findings, frozen v1 sources/builds and failing controls remain valid evidence of the rejected candidate.

Only tracked diff: `e2e/controls.spec.ts`, blob `818f2099bf567cd6f50ab0cf2978b211ed389211`, five added lines immediately after `enterZone(page, "CST", label)` and before the first `fill("Asia/Tokyo")`: comment, `scrollIntoViewIfNeeded`, native input `click` and `aria-expanded=false` assertion. Base HEAD remains `cea0de547094ba51a598fdc4303409fdf1d36bb7`. All existing scenario identities and assertions are retained.

The root’s public-v2 correction is consistent with the earlier source review’s ownership diagnosis: the lower-level hook accepts a layout delegate, but the component does not expose that prop. My required-remediation statement called for a supported input-owner integration or reversion; it did not verify or approve a `ComboBox layoutDelegate` component prop. Restoration satisfies the removal option. No v2 production implementation is reviewed here.

## Independent preparation analysis

`enterZone` fills the exact provided value, presses Tab and asserts that the input retained it. It does not independently wait for popup removal, document scrolling or any deferred focus callback. Bringing an offscreen input into view and clicking it before typing is a legitimate user precondition for a hover-specific regression. The new closed assertion ensures the next fill is intended to open the suggestion list, rather than inheriting an already open menu. There are no sleeps, force clicks, viewport changes or motion changes.

The new click changes prior focus/pointer state and potentially awaits ordinary actionability/exit animation. That is an explicit preparation change rather than identical old history. It does not select a timezone: application Input `onFocus` emits bounded diagnostics only, with commit owners unchanged. Filling the input replaces its contents/caret state afterward. The test still moves the pointer to0,0 before deliberately hovering Osaka, asserts the fresh hovered state, presses Tab, and checks retained canonical `Asia/Tokyo`, untouched other field, exact converted time/date and popup removal. It still deliberately navigates ArrowDown/End/Tab to commit the exact alias `osaka`, then repeats the established native preparation for Tokyo pointer selection and checks the canonical value plus other-field independence. No intended hover/canonical/keyboard/pointer expectation is removed or weakened by the source delta.

However, `aria-expanded=false` is a state observation, not proof that a deferred ancestor-scroll event has completed. React Aria’s unchanged `useCloseOnScroll` dismisses an open popover on trigger-ancestor/window scroll and ignores input/textarea internal scrolling. A later queued ancestor scroll can still occur after the fill has opened the popup. The test’s unchanged open-ownership sequence is non-atomic: the regex assertion can pass while `aria-controls` is present, then a subsequent `getAttribute` can returnnull and create an owned-list locator for `id="null"`. The five-line preparation cannot be accepted as resolving that lifecycle merely because it is plausible or fixes one profile.

## Preserved failure boundaries and current raw evidence

The original baseline1 failure is an absent `aria-controls` assertion at old controls428; candidate2 temporarily passes that assertion, then recordsnull ownership and times out hovering at old controls438. Their raw unexpected-attempt markers each contain exactly one Firefox retry0 failure with its screenshot/context. They are distinct precise boundaries, not evidence of one universal shared cause.

During this read-only review, root’s controls3 log became terminal. Independently read `controls/3-baseline/run.log`: Firefox, WebKit and iPhone pass the unchanged hover scenario; Chromium and Android time out after30s at new controls443 waiting for `locator('[id="null"]').getByRole('option', {name:'Osaka',exact:true})`. Summary: **3passed,2failed**. This is root-run raw evidence, not a browser test executed by this reviewer. Its occurrence is not a proof that the new click introduced a product bug; it proves the current first-fill preparation has not established stable owned-list access in all five required profiles.

Source review already exposes the viable failure path: closed pre-fill state does not eliminate queued scroll, and successful transient ownership does not guarantee the next read retains it. Further cause-matched event/geometry evidence and exact revision verification are required before calling this preparation stable. A dynamic locator that merely evades the null captured ID would not by itself establish that the popup remained open or that the canonical/hover journey was exercised.

## Separate verdicts

- **Source restoration:** approved as exact removal of the rejected production diff. This does not approve v1, certify existing baseline page-navigation behavior or resolve the original efficiency report.
- **Test delta:** source-level intent and retained coverage are sound, but **not approved as resolved/stable for delivery** because root’s exact five-profile regression currently has two failures. Preserve those attempts, independently identify the remaining deferred-scroll/ownership boundary, and verify a justified preparation fix without weakening the hover/canonical/independent-field/result/alias/pointer assertions.
- **Original CI objective:** unresolved. No full273-case/116-unit gate, comparable performance/artifact pair,20% rounded-minute/storage target, exact-tree publication or hosted acceptance is established by this bounded restoration review. Root’s controls3 is a targeted hover5-profile check only.

No physical-device, screen-reader, actual zoom, installation/share or broad visual acceptance is claimed. Runtime-source restoration does not substitute for those capabilities or the eventual chosen runtime’s complete required gate.
