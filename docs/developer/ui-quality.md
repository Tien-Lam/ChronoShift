# UI quality playbook

Use this method to choose, build and verify interfaces across projects. Each
project supplies its own framework, component foundation, visual identity,
language, supported environments and release policy in an adoption record. A
library, installed package or copied demo does not establish product quality or
resolve every related report.

## Select a foundation

Evaluate maintained components against accessibility, keyboard/touch/pointer
behavior, framework compatibility, internationalization, support, licence,
source ownership, styling flexibility, bundle cost and deployment constraints.
For new projects, inspect the toolkit's current upstream default before choosing
alternatives. For existing projects, weigh migration benefits against tested
behavior, consistency, cost and risk. Verify official documentation at adoption
time; a successful choice in another project is evidence to consider, not a
universal default.

Record the selected stack, rationale and alternatives, exact sources/versions,
licences, local adaptations and upgrade policy. Prefer one coherent interaction
foundation. Mixed foundations need explicit boundaries and verification of
focus, events and state ownership.

Useful complementary layers include owned component recipes such as
[shadcn/ui](https://ui.shadcn.com/docs), interaction primitives such as
[React Aria Button](https://react-aria.adobe.com/Button), an inspectable state
gallery, and [Playwright visual comparisons](https://playwright.dev/docs/test-snapshots).
These examples do not prescribe a combination. A local gallery or
[Storybook](https://storybook.js.org/docs/writing-tests/visual-testing) may suit the
project; evaluate any associated cloud service separately against privacy,
network and cost constraints.

## Define ownership and contracts

Create shared semantic tokens for readable foreground/surface pairs, typography,
spacing, radius, borders, elevation, target sizes and motion. Define a small
component API with named variants, sizes, states and compositions.

- A control owns its visible fill, border, hover, press, focus and content
  geometry. The parent owns spacing and layout alignment.
- Centre text/icons within the intended surface using logical insets. Intentional
  asymmetry needs a named variant, rationale and representative fixture. Avoid
  incidental ancestor overrides, negative-margin corrections and enlarged
  pseudo-element patches.
- Keep business operations and domain state outside presentation wrappers. Use
  the primitive's activation model without duplicate click/press handlers or
  competing state owners. Preserve appropriate native semantics and editing.
- Specify target sizes by control category and input modality; compact library
  defaults may not meet those requirements.
- Review escape-hatch classes and exceptions explicitly. Static checks can flag
  drift, but rendered geometry and behavior decide acceptance.
- Migrate bounded groups, retaining meaningful existing tests and surrounding
  capability, focus and lifecycle behavior.

Separate three kinds of assurance in the adoption record: **centrally enforced**
rules that a shared component/token actually controls; **tested** behavior for
named conditions; and **human product review** of meaning, usefulness and visual
hierarchy. A component API cannot enforce the purpose of every feature, and
passing snapshots do not replace task-based review.

## Agree on content and hierarchy

Write purpose-based labels, help, defaults, errors and correction paths. Visible
labels and accessible names share terminology. Explain optional settings in the
context of the user's task.

Map domain metadata to deliberate human presentation, preserving relationships,
alternatives, precision and provenance. Give unknown metadata an intentional
presentation path. Do not expose internal enums accidentally, relabel arbitrary
user input or indiscriminately strip meaningful context.

Record navigation, page hierarchy, grouping and supporting/footer content as
product decisions. Review realistic tasks and representative data. A component
library cannot decide whether a setting is useful or a header feels complete.

## Specify states, motion and responsive behavior

Specify rest, actual hover, keyboard focus, pressed, disabled and applicable
pending/success/error states together. Feedback matches the interactive surface
for each supported input method. Adapt browser feedback only where equivalent
feedback exists; retain keyboard focus, native selection, editing, scrolling and
context menus.

Motion describes a real transition or outcome, keeps content readable and targets
stable, and respects reduced motion on first load and live preference changes.
Never add artificial waiting or animate success before the operation succeeds.
Choose timing/easing and permitted effects per project, with bounded effects
appropriate to its performance budget. Necessary continuous motion needs an
explicit exception and pause/stop behavior.

Exercise reversal, cancellation, supersession, rapid edits/IME, selection/copy,
reset, resize and lifecycle transitions while feedback runs. Focus, hidden/inert
state, announcements and current state respond immediately. Check intermediate
contrast, stale effects and delayed layout movement as well as settled states.

Specify viewports, zoom, text lengths, language/direction, input methods and
accessibility modes. Preserve active work across resize. Check intrinsic sizing,
wrapping, precision, focus clipping, overflow, popup contents/placement and
adjacent targets. Verify useful fallbacks for unavailable fonts, motion, storage,
clipboard and other optional capabilities. Adopt the product's privacy, network,
offline and explicit-update rules.

## Build an inspectable gallery

Use actual shared components and representative page compositions with
deterministic, non-sensitive fixtures. Include text-only, icon-only and icon/text;
short/long labels; adjacent actions and edge placement; field/help/error states;
open/closed and transitioning disclosures/popups; and applicable empty, success,
error and ambiguous data.

Choose representative combinations of themes, widths, zoom, languages,
modalities and motion/accessibility modes using a risk-based matrix. Avoid an
impractical Cartesian suite. Gallery examples should exercise the component's
real state API; forced styling can illustrate a recipe but does not establish
authentic input behavior.

## Verify complementary concerns

| Concern                      | Evidence and boundary                                                                                                                                              |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Appearance and hierarchy     | Reviewed component/composition captures and visual diffs; task-based review still assesses usefulness.                                                             |
| Alignment and stable targets | Independent content/surface geometry expectations during real states and transitions; CSS strings or absence of overflow are insufficient.                         |
| Pointer, touch and keyboard  | Authentic hover, focus, press/release, dismissal, scrolling and cancellation; identify browser tooling versus physical-device evidence.                            |
| Motion and readability       | Recordings or before/during/after observations, interruptions and reduced-motion conditions; settled or reduced-only captures cannot prove normal-motion behavior. |
| Semantics and content        | Independent exact domain/output/accessibility expectations; never derive expected results from the implementation's generated output.                              |
| Accessibility                | Automated checks plus scoped keyboard, contrast and applicable assistive-technology review; an accessibility tree is not a screen-reader session.                  |
| Product lifecycle            | Applicable capability failures, privacy, persistence, offline, deployment and update transitions with source/build identity.                                       |

Preserve a matching original failure and candidate success for regressions where
feasible. Include meaningful competing controls: an asymmetric fixture should
fail a centring check, an early success announcement should fail a pending
operation check, and incorrect human labels should fail independent content
expectations. Record exactly what each control distinguishes. Unknown original
conditions remain separate from demonstrated equivalent conditions; do not
reopen completed reports solely because shared components are being adopted.

## Control baselines and delivery

Pin the baseline browser/version, OS, viewport/raster, fonts and relevant
environment settings. Playwright documents that rendering varies with these and
other host conditions. Review visual diffs and intentional golden updates. Do
not automatically accept snapshots, mask the changing control or loosen
tolerances to hide defects. Use region-specific tolerances with documented
platform differences.

Keep maintained golden fixtures separate from temporary captures and full
reports according to repository policy. Preserve actual source/build identity,
start/end times, original attempts, environment and evidence gaps. Record
concurrent activity where it can affect measurements.

Each implementation PR explains changed behavior and component states with
appropriate static, interaction and temporal evidence. Follow the repository's
independent review and release gates. Reuse successful unchanged checks; rerun
for new changes, failures or unresolved concerns. Report implementation approval
separately from original-report resolution. A checklist or component migration
does not automatically close every related defect.

## Adoption checklist and record template

Complete this record explicitly for each project; adoption does not silently
change other repositories or global instructions.

1. Describe the product task, privacy/network constraints, supported environments
   and modalities, and excluded acceptance scope.
2. Select the foundation after auditing official sources; record rationale,
   alternatives, source/version/licence, local changes, tooling and upgrades.
3. Define semantic tokens, component variants, geometry/target rules, ownership
   boundaries and reviewed exceptions.
4. Approve vocabulary, domain mappings, error/help/correction paths, realistic
   examples, layout and navigation.
5. Specify state, motion, accessibility, responsive and performance contracts,
   including interruption and unavailable-capability behavior.
6. Build the real-component gallery and representative compositions; document the
   risk-based matrix, baseline environment and reviewed golden changes.
7. Map existing reports to central enforcement, tests and human review; retain
   independent original/fixed controls and state unverified acceptance.
8. Assign implementation/evidence owners, onboarding links, repository checks,
   review/release gates and exception policy. Close reports only with matching
   evidence under that policy.

ChronoShift's concrete application is recorded separately in
[ui-adoption.md](ui-adoption.md).
