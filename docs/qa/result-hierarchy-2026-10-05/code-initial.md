# TIE-369 independent code review — initial risk assessment

Recorded 2026-10-04T19:21Z (local 2026-10-05 Australia/Sydney), before candidate implementation or another reviewer's verdict. Workspace `/Users/tien/Developer/ChronoShift`; base and inspected HEAD `ab1ad4e1d8c1c249e9e7941a20043fb7627f477c`. Bun 1.4.0 through `mise exec`. No runtime builds, browser sessions, tests, or shared artifact changes performed.

## Original request and scope

Original user report in `docs/qa/result-hierarchy-2026-10-05/brief.md`: “layout of the results/converted side is hard to read. Emphasis should be on the result, not the copied relevant original text (still displayed but should be less emphasis than the resulting text).” The agreed brief calls for converted time, destination date/timezone, and associated Copy to lead visually and in DOM order, with readable source context, interpretation, endpoint, shifts, ambiguity and assumptions retained. This is a feature/interface improvement; no historical browser bug reproduction is claimed.

Read AGENTS.md, docs/developer/review.md, saved brief, App.tsx result/copy/groups, style.css theme variables/result rules/layout/media queries, time.ts formatResult/copyText, engine/types.ts, convert.ts date-only/range/ambiguity/result assembly, and relevant e2e expectations in app.spec.ts/imports.spec.ts/controls.spec.ts/responsive.spec.ts/foldable.spec.ts. Candidate not yet supplied.

## Independently derived risks

1. DOM reading order must follow actual destination output. CSS order alone would preserve source-first assistive reading. When time is absent, a date-only result needs a prominent actual date and the existing no-shift explanation.
2. Every Copy must retain closure over its exact TimeResult and the existing accessible name. Ambiguous groups have multiple outputs; a single group-level action or copied shared source label would lose association. `copyText` carries original, endpoint, sourceLabel, interpretation and assumptions independently of presentation. Pending clipboard invalidation and manual fallback must remain owned by existing request/version logic.
3. Moving the shared quote below a group of alternatives can obscure which original belongs to which outputs. A result-group remains one source quote; individual interpretation labels, endpoint markers, date shifts and assumptions must stay adjacent to the corresponding result. Engine ranges use separate groups/endpoints; the quote can repeat for start/end, so removing endpoint as redundant would be incorrect.
4. SourceLabel and interpretation are not synonymous with destination zone. During a clocks-back ambiguity, interpretation can be “First/Second occurrence”; preserving existing interpretation-or-sourceLabel display is bounded, but replacing destination metadata with this text would mislabel the result. Review destination text from formatResult, not inferred source strings.
5. An unresolved target intentionally suppresses groups despite conversion results, and correction restores them. Moving rendering out of the targetZone-gated groups would expose source-zone fallback values as converted results. Date-only results return no time and “Date only,” with no shift.
6. Long original/interpretation/date/zone text and seconds/millisecond time formats can expand flex children. Review min-width, wrapping, grid minmax boundaries and long-word breaks through mobile and desktop media rules. Strong hero size must not push Copy offscreen or make secondary context illegible.
7. Lower emphasis should use existing readable theme ink/muted values and restrained typography, avoiding opacity on container descendants or clipping/collapsing source content. Dark/light and forced-colors cascade needs inspection. Existing mobile `.hero-time` override follows base rules; component CSS imported via DateChoice and main style import should not gain shared-control regressions.
8. Result/date/zone/assumption selectors are consumed by browser checks. Existing tests cover ambiguity copy, invalid target, date-only recovery, resize persistence and overflow, but passing them does not independently establish the requested visual quality. Do not replace independent temporal fixtures with expectations derived from the candidate.

## Planned bounded candidate review

Inspect exact candidate diff and source tree; trace group/Copy/date-only/no-target rendering and CSS order; compare existing targeted tests and independent semantic fixture invariants. Root and adversarial reviewer own production browser QA and full gates. No actual visual, physical-device, screen-reader, zoom or contrast measurement is claimed here. Candidate approval requires its supplied revision; request acceptance additionally depends on recorded rendered evidence from root/adversarial review.

## Commands and result

- `pwd`, `rg --files` (review/brief/source file inventory); successful.
- `cat AGENTS.md docs/developer/review.md docs/qa/result-hierarchy-2026-10-05/brief.md`; successful.
- `rg` and `sed` on relevant runtime/engine/e2e paths; successful, no modifications.
- `git status --short`, `git rev-parse HEAD`; base unchanged; preexisting untracked `:memory:.ses`, docs/design/, and review brief directory observed.
- `mise exec -- bun --version`; 1.4.0.
- `date -u '+%Y-%m-%dT%H:%M:%SZ'`; 2026-10-04T19:21:09Z.

## Verdicts

Implementation: pending exact candidate review; these are failure risks, not findings against an unseen implementation.

User-request acceptance: pending rendered candidate evidence. The source-first order at base matches the described readability concern in code; visual severity and success have not been exercised by this reviewer.
