# Time to Local UI adoption and regression contract

This is Time to Local's project adoption record for the
[generic UI quality playbook](ui-quality.md). The approved
[appearance](appearance.md) remains the visual/content source of truth; this
record defines how shared components preserve it. The selected foundation is
**actual local shadcn/ui React Aria component adoption**, backed by the existing
React Aria interaction stack. The user's 7 October 2026 selection supersedes the
earlier reference-only plan.

## Selection, ownership and current evidence

React Aria is a compatibility choice for this existing project, not a default
for every future project. Audit the selected
[shadcn React Aria Button](https://ui.shadcn.com/docs/components/aria/button)
recipes, retain local source ownership, and map them to approved tokens rather
than accepting unreviewed defaults. Future projects evaluate current upstream
defaults and alternatives under the generic playbook; the source adoption record
notes the [Base UI Button route](https://ui.shadcn.com/docs/components/base/button)
as the inspected upstream default on 7 October 2026.

At investigation base `98c411f021410d751d5b40c4ff50fe5c650eade3` (tree
`040fd199af9a2a203c48460633dba32bb752e556`), `package.json` pins React Aria
Components 1.21.1, Playwright 1.63.0 and axe 4.13.0. Existing searchable/date
controls use React Aria; task buttons, disclosure and touch feedback still have
project-owned implementations. That baseline is source inventory, not evidence
of the forthcoming shadcn migration or new gallery passing. No Storybook/cloud
visual account or runtime CDN is selected.

[TIE-390](https://linear.app/tienlam/issue/TIE-390/adopt-shadcn-react-aria-components-and-design-regression-coverage)
owns the actual local component migration, development-only gallery, regression
checks and `docs/developer/ui-gallery.md` execution record. Before adoption is
accepted, that record must identify exact upstream source revision/version,
licence, copied recipes, local adaptations, variant API, upgrade policy,
remaining primitive exceptions and rationale. It must also document any
Tailwind/styling/build integration and emitted/offline assets. Installation or a
generic wrapper alone does not satisfy adoption. Candidate execution evidence is recorded separately; exact acceptance belongs on
the delivery PR/tickets and in their ignored evidence folders.

Use narrow owned ActionButton primary/quiet/outline/icon variants and applicable
field/help, disclosure and menu/popover shells. Reuse tested searchable/date
behavior through bounded migrations. Keep conversion, clipboard/update
operations and domain state outside visual wrappers. Use each primitive's
activation model without duplicate `onPress`/`onClick`; retire duplicated touch
handlers only after matching press/cancel/scroll/context-menu evidence.

The agreed TIE-390 boundary is now implemented in the candidate:
`web/src/components/ui/{ActionButton,Input,Collapsible,Popover}.tsx`, with
`docs/licenses/shadcn-ui.LICENSE` and immutable recipe snapshots under
`docs/vendor/shadcn/`. [ui-gallery.md](ui-gallery.md) records the actual upstream
revision, cva/owned CSS token adaptation, versions, exceptions, upgrades and
emitted/offline assets. Production App actions/disclosure, searchable Input and
menu/popover shells use these recipes. Specialised date/search behavior and
native editing/details/checkbox controls retain documented primitives.

The development-only gallery and independent fault/geometry/state/content tests
are delivered, with 34 explicitly reviewed local visual baselines and a pinned
environment. Production asset scanning excludes gallery/fault content. Native
press ownership excludes adopted React Aria button slots from the retained touch
hook; the predecessor's independent palette/geometry/clipboard checks carry
forward. A separate full-Chromium production regression verifies actual browser
zoom rather than treating CSS zoom as equivalent. The source inventory above and
historical Paste facts below remain observations of the investigation base.
These candidate deliveries do not claim final acceptance: two clean independent
reviews, the exact final full runtime/subpath gate and matching published
acceptance remain pending until recorded on the PR/tickets.

## Preserved product constraints

Preserve the compact clock/name/Appearance header, workspace directly below,
accessible page heading and privacy footer. Preserve the shared editor/result
hierarchy, plain-text editor, warm Light/forest Dark/live System, locally bundled
Geist, type/insets/radii and 44px controls with visible keyboard focus specified
in [appearance.md](appearance.md). Layout spacing belongs to the parent;
control geometry belongs to its named variant. Intentional asymmetry or native
control differences need an explicit documented exception.

Semantic foreground/surface pairs switch atomically and remain readable during
feedback. Controls, editable caret, popup anchors, outer overlays and Copy hit
targets stay stationary. Disclosure close commits intrinsic geometry immediately
and removes hidden content from interaction/accessibility. Keep finite truthful
feedback, cancellation/supersession, reduced motion on first load and live
changes, native selection/scroll/context menus and forced-colour affordances.

Source and target zones remain independent; ambiguity is explicit, fixed offsets
remain distinct from regional DST, and date context stays bounded. Keep inputs
and reference dates out of requests and permanent storage. Preserve precise
range/copy semantics, clipboard/import/focus ownership, draft/results through
resize, reset behavior and user-explicit update activation. Runtime assets/fonts,
manifest and worker stay under the production base `/` (with `/ChronoShift/` regression coverage); there is no conversion backend or
runtime CDN.

## Paste report: demonstrated cause and required acceptance

The report is “paste button when hovering over on desktop is misaligned (the
highlight).” At the investigation base, `.text-button` has `10px 12px` padding,
then `.input-tools .text-button` overrides it to `8px 12px 8px 0`. The saved hosted
IAB measurement reports 44px height, approximately 44.10px width, 0px left/12px
right inset and 8px radius. The asymmetry places plain text about 6px left of the
surface centre. Source/resting geometry supports this explanation; it is not a
full hover replay of the original session. Original browser, zoom and viewport
history remain unknown. Investigation evidence is in ignored
`.work/design-system-research/paste-geometry.json`.

[TIE-389](https://linear.app/tienlam/issue/TIE-389/centre-paste-and-clear-hover-surfaces-using-shared-quiet-action)
owns the bounded correction: shared quiet-action inline-flex centring, logical
equal 12px insets, icon gap and at least 44px block target. Parent gap/padding owns
toolbar alignment. Audit Clear and adjacent actions; avoid Paste-only negative
margins or pseudo-element patches. Preserve clipboard rejection/focus ownership
and delivered touch feedback. TIE-390 carries this acceptance into its final
shared component.

Acceptance requires actual rest/hover/focus/press in Light and Dark, with/without
Clear; independent label/surface centre expectations (about 1 CSS px tolerance
for plain text, logical-direction-aware); stationary targets; keyboard/pointer
and touch cancellation; and rejection/edit/focus behavior. The same rendered
expectation must fail on the asymmetric predecessor and pass the candidate.
Checking a CSS declaration alone does not establish the fix. These are required
delivery conditions, not results claimed by this documentation change.

## Every report row and its assurance boundary

The table preserves all nine rows of the project adoption plan. “Central” means
the named owner can enforce the rule for migrated consumers; feature composition
still needs tests/review. TIE-390 owns preservation and missing regression
coverage for every row, while TIE-389 owns the new Paste repair. Earlier completed
reports remain complete; migrations need their own matching evidence.

| Report/refinement                                                                                                                                       | Central contract/owner                                                                                                                                                                                                                     | Independent test and meaningful failure control                                                                                                                                                                                                            | Human review and evidence boundary                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [TIE-379: consistent date/time labels](https://linear.app/tienlam/issue/TIE-379/make-date-and-time-option-labels-consistent)                            | Content/field vocabulary: **Date format** interprets input; **Time format** controls display/copy. Labels, helpers and accessible names agree.                                                                                             | Exact content/accessibility expectations plus interpretation/display examples; a swapped label/help fixture must fail, without reading expected strings from current markup.                                                                               | Review purpose in the task context. Shared fields cannot infer the meaning of each setting; new migration evidence does not replace historical acceptance.               |
| [TIE-380: source/reference usefulness](https://linear.app/tienlam/issue/TIE-380/simplify-source-timezone-and-reference-date-controls-and-explain-their) | Feature contract retains visible device/today defaults and correction opening settings/focusing source. Source is a fallback for zone-less text; reference anchors incomplete/relative dates in the source zone. Target stays independent. | Zone-less versus explicit text, older-message “tomorrow”, invalid/incomplete date and correction-focus cases; an explicit-zone override or source/target coupling must fail exact expectations.                                                            | Review whether explanation/defaults are useful. Library semantics cannot decide this; retain gaps about historical reported context.                                     |
| [TIE-381: human result/range labels](https://linear.app/tienlam/issue/TIE-381/remove-raw-startend-tags-and-clean-up-technical-result-labels)            | Domain-to-display owner uses **From/To**, distinguishes endpoints from alternatives and gives unknown metadata a deliberate path. Preserve user text and meaningful assumptions.                                                           | Independent visible/copy/accessibility expectations for ranges, overnight/mixed zones, ambiguity and precision; raw internal tags or swapped endpoints must fail. Maintain exact domain fixtures directly.                                                 | Review human wording and association of each result/context/Copy action. Do not indiscriminately strip input or certify all metadata from one fixture.                   |
| A/B selection, Linear shapes, fields, editor/menu hierarchy                                                                                             | Approved tokens and component/surface variants own warm Light/forest Dark, common workspace, radius/type/insets and plain editor; parent layouts own grouping.                                                                             | Real component states and representative compositions; asymmetric insets, mismatched radius or oversized empty popup controls must fail relevant geometry/visual expectations. Document native differences.                                                | Compare rendered composition with approved appearance. Tokens cannot alone establish balanced hierarchy or appropriate menu contents.                                    |
| Remove hero/title/intro but unfinished empty header                                                                                                     | Page composition owns compact clock/name/Appearance, immediate workspace, privacy footer, functional labels and accessible heading.                                                                                                        | Both palettes and narrow/desktop baselines; absent accessible heading or reintroduced decorative hero must fail exact semantic/composition expectations.                                                                                                   | Review visual completeness against the approved compact header; no universal header recipe is implied.                                                                   |
| Motion and interaction polish                                                                                                                           | Shared state owners enforce bounded decorative feedback, truthful pending/success/error, immediate focus/hidden state, stationary geometry, cancellation and live reduced motion.                                                          | Normal/reduced first-load/live journeys and before/during/after evidence; rapid typing/IME/reset/theme/resize, delayed/rejected clipboard and superseding work. A moved target, stale effect or success before completion must fail.                       | Review intermediate readability and polish. Static/reduced-only captures or sleeps cannot establish interrupted normal-motion behavior.                                  |
| [TIE-387: blue mobile tap square](https://linear.app/tienlam/issue/TIE-387/replace-mismatched-blue-mobile-tap-highlights-with-rounded-theme)            | Rounded palette feedback replaces native overlay only on covered controls; preserve contrast, immediate keyboard focus and native editor/diagnostic affordances. One owner controls press state.                                           | Real touch press/release/cancel/drag/scroll/long-press in supported tooling; a stuck press, missing equivalent feedback or intercepted native action must fail. Preserve existing delivered expectations.                                                  | Inspect feedback in both palettes. Browser touch tooling does not reconstruct the original handset history; no new physical-device acceptance is claimed.                |
| Paste desktop hover off-centre                                                                                                                          | Quiet ActionButton owns symmetric geometry; toolbar owns alignment. TIE-389 predecessor/candidate evidence is carried into TIE-390.                                                                                                        | Actual hover crops and independent centre/stationary-target checks with/without Clear; the base's one-sided padding must fail. Retain keyboard/touch and clipboard/focus cases above.                                                                      | Inspect filled surface and neighboring toolbar balance. Original browser/zoom/history remain unknown; resting geometry alone is bounded evidence.                        |
| Narrow/long-result and transient theme/menu regressions                                                                                                 | Result/layout/popover/theme owners keep numeric runs intact, clear associations, atomic readable pairs, intrinsic close geometry, resize placement and explicit updates.                                                                   | 280/390px/desktop, zoom/long text/seconds/milliseconds, normal/reduced/live System, held-pointer boundaries, open-menu resize and offline/update journeys. Split numerals, stale placement, moving close targets or automatic update activation must fail. | Check popup contents and readable result/context/Copy grouping, not only page containment. Record actual zoom capability and update/cache history; emulation is bounded. |

## Gallery, baselines and review gate

Use actual shared controls and representative page compositions in rest, actual
hover, keyboard focus, pressed, disabled and applicable real pending/success/error
states. Cover text/icons, short/long labels, adjacent/edge actions, field/help/error,
example/disclosure/zone/theme/calendar menus, result groups and header/footer.
Synthetic fixtures contain no private conversion inputs.

The risk-based matrix includes Light/Dark/live System; 280/390px and representative
desktop; normal/reduced first-load/live preference changes; long precise results;
zoom and forced colours. Keep deterministic visual/geometry evidence separate
from authentic pointer/touch, motion interruption and focus ownership. Axe
complements manual contrast, readability, alignment and content review.

Pin browser/version, OS, viewport/raster, local-font readiness, motion and relevant
environment for goldens. Keep intentional reviewed fixtures in the maintained
test location and WIP/full reports in ignored `.work/<ticket-id>/`. Review every
baseline diff; no automatic acceptance, masked changing controls or relaxed
tolerances to conceal defects. Demonstrate the gallery catches the Paste
predecessor and representative geometry, state and semantic violations using
independent controls. Their exact executed inventory belongs in TIE-390's gallery
record; a requirement in this table is not a passing test.

Follow [testing.md](testing.md), [review.md](review.md) and
[publishing](web.md). Use mise-managed Bun and frozen dependencies. Documentation
alone needs formatting/reference checks; runtime migrations use appropriate
static/build/browser and lifecycle/PWA gates. Substantial scope requires two
clean independent reviewers: adversarial rendered/report journeys and read-only
code review using the installed review-agent skill. Trace surrounding async,
focus, cancellation and update paths rather than only the diff.

Preserve exact base/head/tree, served asset/release identity, actual command and
observation start/end times, environments, attempts, failed controls, captures
and gaps in ignored ticket folders. Record each reviewer's tested conditions and
separate implementation approval from original-report resolution. Keep concise
durable summaries on PRs/tickets. Browser/DevTools evidence does not establish
physical-device, screen-reader operation or phone-performance results; physical
hardware remains outside current scope.

## Delivery ownership and closure

[TIE-388](https://linear.app/tienlam/issue/TIE-388/establish-reusable-ui-foundations-for-all-reported-design-issues)
owns the generic playbook and this mapping. TIE-389 may ship its bounded fix
independently. TIE-390 delivers the selected foundation and preservation workflow,
including its provenance/toolchain and executed gallery record. Tickets hold
current status; this document does not assert delivery from ticket creation or
planned coverage.

Root integration owns PRs, reviews, authorized merge and matching published
acceptance. Publish only `main` through the serialized verified-artifact workflow.
Close TIE-388 only after both children have matching implementation/delivery
evidence and every in-scope mapping/gap is accounted for. A reusable component or
bounded related mitigation cannot establish resolution of an unverified original
report. Keep new in-scope gaps open and preserve completed historical reports.

## Sources and adoption audit

The 7 October 2026 source records are the
[generic playbook](https://linear.app/tienlam/document/reusable-ui-quality-playbook-chronoshift-and-future-projects-d42e979ba982),
[Time to Local adoption plan](https://linear.app/tienlam/document/chronoshift-ui-adoption-and-regression-plan-48ffdaf688ce)
and linked TIE-388/389/390 requirements. They are planning inputs, not executed
acceptance. Approved design details are maintained in [appearance.md](appearance.md).

Official [React Aria Button](https://react-aria.adobe.com/Button) documents normalized
mouse/touch/keyboard press, exposed interaction states and focusable pending
behavior. The [shadcn React Aria Button](https://ui.shadcn.com/docs/components/aria/button)
documents variants, sizes, icon treatment and link semantics; geometry and
product vocabulary remain locally owned. [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots)
documents environment-sensitive rendering and reviewed golden fixtures. These
three references were inspected in the in-app browser during this documentation
work. The source plan's optional
[Storybook visual-testing](https://storybook.js.org/docs/writing-tests/visual-testing)
reference was retained; it was not independently reverified in this pass after
the in-app browser became unavailable. Re-audit tooling/service details if
Storybook is later selected. No browser fallback or optional service was adopted.
