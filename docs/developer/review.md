# Independent review and bug closure

Use two reviewers with clean context for substantial changes. Keep their tasks complementary; do not add agents or repeat the whole suite to compensate for an unspecified review scope. The implementer owns delivery and ticket closure.

## Save the brief

Before dispatch, save in the PR (or a linked repository review record) the brief actually sent to both reviewers. Include:

- Base and current head revisions, intended behavior, invariants, changed scope and nearby lifecycle owners.
- For bugs, the original symptoms/steps and exact relevant console errors, elapsed timing, reported browser/version and known fresh/cached/updated-tab history. Mark unknowns as unknown.
- Observed facts, proposed causes explicitly labeled as hypotheses, existing reproduction/regression evidence and remaining gaps.
- Test commands and available capabilities. Allocate separate ports and output directories for parallel runs.

Both reviewers derive relevant failure paths independently before relying on the implementer's tests. They receive the original report rather than only the proposed fix. They inspect unchanged surrounding code when it controls the changed behavior. Neither sees the other's verdict before their initial review.

## Complementary roles

**Code reviewer:** trace the affected behavior through asynchronous completion, rejection, timeout, cancellation and later recovery. Check observer lifetime, retry bounds, state ownership, integrity and explicit-update invariants when applicable. Assess whether regression expectations are independent and whether they distinguish the previous implementation from the candidate.

**Adversarial reviewer:** challenge the proposed explanation with a report-level journey or a relevant competing failure path beyond the new happy-path tests. Choose state and timing from the report. For offline/lifecycle work, distinguish a first visit with no controller, a healthy controlling cache, missing/stale assets and waiting updates/older tabs; select the relevant transitions rather than exhaustively combining every dimension. Exercise beyond implicated deadlines and inspect available page/worker diagnostics. Treat deliberate fault-injection errors separately from unexplained errors in normal use.

For interface changes, inspect the actual rendered page against the agreed visual brief at the affected breakpoints/themes. Record measured CSS dimensions and asset/release identity with captures. Mockups, accessibility metrics and mobile emulation do not independently establish visual quality or physical-device usability.

Check popup contents as well as their outer bounds: spacing should be balanced
and the surface should fit its contents. Trace CSS import order and specificity
when shared control rules can override component styles. Viewport containment
alone does not catch an oversized calendar or other empty popup space. Separate
normal-use console/CSP violations from stylesheet injection by screenshot tools.

## Record verdicts

Each reviewer reports the exact revision/scope inspected, findings with triggers and impact, and actual commands/results or observed browser journeys. Identify browser/profile, timing, fault injection and unexercised states. Report two distinct conclusions:

- **Implementation:** approved within the stated scope, or blockers and required fixes.
- **Original report:** reproduced and prevented/recovered as intended; bounded related failures verified; or still unverified. State which reported conditions match and what remains unknown. For a feature/documentation change, mark this not applicable.

Fix actionable findings, add meaningful coverage and request review of the exact changed revision. A focused delta review can retain the earlier approval of unchanged scope; record that relationship. Do not infer general certification from "no blockers" or the number of passing profiles.

## Resolution and verification

For an escaped bug, retain a previous-release failure and candidate success for the implicated behavior. Validate the resulting readiness, warning/error state and usable conversion/draft as relevant, including recovery after the failure. If only adjacent failure paths have been demonstrated, describe the change as a bounded mitigation and keep the original report open while gathering matching evidence.

For Pages offline recovery, model replacement of the deployed tree: old immutable assets may return 404 and mutable files may contain another release. A fixture that retains every version's assets does not establish that transition. Exercise damaged retained caches separately from healthy retained caches. Check waiting-update availability before, through and after a failed or timed-out readiness probe, then verify explicit recovery and draft preservation. Keep actual previously published artifacts when release history controls the failure. Opt-in diagnostics should identify lifecycle/version/failure metadata without recording conversion inputs, selected zones or arbitrary worker/error payloads.

Before closing a hosted bug, record the exact published artifact and a journey matching the available report conditions, including elapsed time and relevant prior state. A verified equivalent reproduction may support closure when it matches the symptom and implicated lifecycle and the post-publication check covers those conditions; qualify any unidentified historical asset/cause. Passing fresh sessions alone cannot reconstruct an existing user's browser history. If matching evidence remains unavailable, retain that gap in the open ticket. User confirmation is useful evidence, not a substitute for obtainable engineering verification or a mandatory approval step.

Use existing full gates for runtime changes. Prefer targeted failure cases with real workers/caches and accelerated application deadlines in CI, plus a real-time boundary test when the report implicates timing. Reuse successful checks of unchanged code; rerun when a change, failure or unresolved concern justifies it. Documentation-only changes need formatting, link/reference checks and appropriate review, not another runtime suite or deployment.

Keep physical installation, OS share menus, screen readers, actual zoom and phone performance open unless those capabilities were exercised. Save durable review/fix/publication evidence in the PR and linked repository record; ephemeral agent messages alone are insufficient for a later audit.

For navigation-shell changes, test response-level HTML rewriting with intact
runtime assets in a fresh profile without a controller. DOM-only extension
mutation is a distinct control and does not change bytes fetched by the worker.
Verify the final build-owned CSP shell, strict rejection of corrupted runtime
assets, missing-shell recovery after deployment replacement and offline reopen.
