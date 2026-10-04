# Converted result hierarchy — 5 October 2026

[TIE-369](https://linear.app/tienlam/issue/TIE-369/prioritize-converted-results-over-original-text-in-result-cards)
requests emphasis on the converted result while retaining the relevant original
text as secondary context. [PR #33](https://github.com/Tien-Lam/ChronoShift/pull/33)
changes presentation and reading order without changing conversion or copy data.

The converted time, destination date and timezone now lead each result, with its
Copy action beside them. Source interpretation, range endpoint, assumptions and
ambiguity remain associated with the corresponding output. The shared original
excerpt follows as a smaller muted footer. Date-only results lead with their date.
Below 360px, Copy moves underneath so the output has the full available width.

## Scope and independent review

Base `ab1ad4e1d8c1c249e9e7941a20043fb7627f477c`; first candidate
`ba32383c5609f72a6fa551bbddd6b53df74bd80e`; final candidate
`150875f7906093ed20b94d76533e0f523f4a9430`.
The [original brief](brief.md) was saved before dispatch. Three agents contributed:
an implementer and two independent reviewers with clean context. Root integrated
the review fix, checked the browser side panel and owns publishing/closure.

- [Initial code risks](code-initial.md), [first code review](code-final.md) and
  [final CSS delta review](code-delta.md) remain separate original reports.
  Existing ambiguity/copy/invalid-target and reflow checks pass in Chromium and
  iPhone WebKit. The final independent [20-case probe](code-delta-probe.json)
  verifies precision/date-only output, exact copy payloads, 44px controls and
  breakpoint boundaries at 280/320/359/360/390 pixels in both mobile engines.
- [Initial adversarial risks](adversarial-initial.md),
  [first rendered findings](adversarial-first.md) and
  [final rendered delta](adversarial-final.md) remain separate. Both final
  implementation verdicts approve the exact final candidate within scope.
- The first rendered review found a P2 issue before merge: at 280px, side-by-side
  Copy left 147px for `11:59:59.123 pm`, splitting its digits after the decimal.
  [Before capture](rendered/pixel-280-light-precision.png). Containment checks had
  passed; actual rendering caught the readability defect. The corrected output
  has 214px at 280px; the numeric time stays intact and its suffix may wrap.
  [After light](rendered/delta/pixel-280-light-precision.png),
  [after dark](rendered/delta/iphone-280-dark-precision.png).
- The adversarial review inspected 72 initial desktop/narrow captures in
  Chromium/Firefox/WebKit and both themes. The final affected delta covers 32
  fresh Pixel/iPhone contexts across 280/320px, light/dark and ordinary, precise,
  date-only and DST-fold source cases. All preserve results through resize, with
  no page overflow. [Raw final measurements](rendered/delta/mobile.json).
  Representative captures are retained; the complete metrics include cases whose
  screenshots remain in the original temporary review directory.
- [Text metrics](rendered/textmetrics.json) identify actual rendered child styles:
  time 56px desktop/32px narrow, date 15px, destination zone 13px ink and source/
  original 12px muted. Date-only dates are 24px. Container-only measurements in the
  earlier measurements file are not glyph metrics.
- WebKit screenshot-tool inline stylesheet CSP errors are distinguished from
  normal app behavior in the [controlled capture probe](rendered/csp-probe.json).
  No normal-use application errors were observed. A code probe's initial expected
  ISO source label was corrected from `UTC` to the existing `UTC+00:00`; that
  assertion error is retained in its original review.

The [previous hosted capture](hosted-before.png) and
[DOM/style record](hosted-before.json) show source-first ordering on published
artifact `4a771b9d102dbcaf3a807f096fb26861bbfa8e5f`, worker `1daf9e89c308221a`.
The base differs only by documentation. Root viewed the actual candidate in the
side panel: [desktop](local-side-panel.png), [320px first candidate](local-narrow.png).
The final [desktop precision capture](local-precision-desktop-final.png) has a
1280px viewport; a browser viewport request applied to another selected tab and
did not establish a root 280px capture. Final narrow evidence comes from the
reviewers' measured actual emulated viewports.

## Verification and limits

`bun run check`: 114 units, typecheck and build pass; formatting passes. Seventeen
existing responsive/app/import Chromium checks pass on the first candidate in
5.4 seconds. Final CSS delta build/typecheck/format and independent narrow probes
pass. The full exact-final CI and published evidence are recorded separately on
delivery; first-candidate CI was canceled when the actual review fix superseded it.
No implementation-mirroring cosmetic test or temporal fixture changes were added.

## Published delivery

Merged as `f5860328667226e11330a1d194c731b83964913e`.
[Final CI](https://github.com/Tien-Lam/ChronoShift/actions/runs/37228236311)
succeeded: 114 units, 220 first-attempt browser passes, two retry successes and
six skips for Chromium-only CDP cases in non-Chromium profiles, plus
type/build/format/corpus and Pages subpath.
The [CI observations](ci-followup.md) remain a separate open follow-up rather
than being mislabeled clean passes.
[Pages](https://github.com/Tien-Lam/ChronoShift/actions/runs/37228574420) verified
and reused source `0c73dd5c48b2b248fbdd15de7c8de5e951f7d5d0`, tree
`bfe2dee06cccde15488b22bf21db05dd0a83d220`. Published worker
`8e7297b6b4c78795` equals the CI artifact, with all thirteen public asset hashes
matching. [Metadata](publication.json) and [verification script](publication-probe.ts).

[Independent code publication review](code-publication.md) corroborates source
trees and both ZIP digests through `gh`; all fourteen artifact files have equal
bytes. [Artifact comparison](code-artifact-compare.json).
[Independent adversarial publication review](adversarial-publication.md) inspects
twelve actual installed-Chrome 154 desktop/280px light/dark journeys for ordinary,
precise and date-only results. [Measurements](published/measurements.json) retain
readiness/control, hierarchy, wrapping, Copy targets, request and error evidence.
No normal-use app errors or external requests were observed.

Root's [four hosted Chrome/Pixel-profile checks](hosted-gate.txt) pass in 24.3 seconds, including
21-second idle observation and fresh offline conversion after close/reopen. The
browser side panel explicitly accepted Update now with its synthetic draft
preserved, then converted to London 9:20. [Published capture](published-side-panel.png)
and [DOM/style record](published-side-panel.json) identify final runtime
`index-CwpXboF5.js`, readiness true and no warning. At the actual 606px viewport,
converted time is 48px and begins before the date, destination zone and source/
original context; the excerpt is 12px muted below. Root inspected this capture.
[Completion delta review](code-publication-completion.md) approves the final
published acceptance evidence and corrected skip wording while retaining the
original publication report. TIE-369 is Done; TIE-370 remains Todo.

This verifies the stated visual hierarchy, semantic associations and inspected
responsive cases. Physical-device, actual screen-reader/zoom and human usability
acceptance are not claimed; the nine separate existing acceptance tickets remain
open. The unchanged parser's unsupported nine-digit fractional input observation
is retained in the original report and does not establish a presentation regression.
