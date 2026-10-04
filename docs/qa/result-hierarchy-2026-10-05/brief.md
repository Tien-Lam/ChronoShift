# Result hierarchy — original review brief

Ticket TIE-369. Base `ab1ad4e` (main); new branch `codex/result-hierarchy`.
User: “layout of the results/converted side is hard to read. Emphasis should be
on the result, not the copied relevant original text (still displayed but should
be less emphasis than the resulting text).”

Current result groups show the quoted original first, then source interpretation
and Copy, then converted time/date/destination zone. Improve both visual and DOM
reading order: converted time, destination date/timezone and associated copy
action should lead. Keep the quote as readable secondary context, along with
source interpretation, endpoint, date-shift and ambiguity/assumption information.
Do not change conversion semantics, copy payload, offline lifecycle, preference
behavior or shared input-control styling. Preserve date-only/no-target recovery.

Source scope: `web/src/App.tsx` result-group rendering; result styles in
`web/src/style.css`. Read surrounding formatResult/copy/group behavior and CSS
breakpoints/themes. Existing semantic fixtures and browser checks must retain
their independent expectations; avoid implementation-mirroring tests for cosmetic
changes. Root handles integration, full required gates, publishing and ticket.

Implementation agent owns only those two runtime files. Independent code reviewer
and adversarial reviewer receive clean context and derive relevant risks before
seeing implementation/tests or each other's verdict. Candidate head will be sent
after implementation. Save initial and final reports separately; report exact
revision, commands/browser/environment/timing, findings, evidence gaps and separate
implementation/user-request acceptance verdicts.

Code review: reading order, grouping and long-content wrapping, semantic labeling,
copy association, date-only/source/endpoint/ambiguity state and CSS specificity.
Adversarial: inspect actual rendered candidate against this brief on desktop and
narrow mobile in light/dark themes; also challenge a range, multiple ambiguous
interpretations and long original context. Measure dimensions/emphasis and inspect
screenshots; containment or green suites alone do not establish hierarchy.

Available Bun/mise runtimes and Playwright browsers are already installed. Root
may build once; do not concurrently rebuild shared dist. Root preview port 4185,
code reviewer 4253 and adversarial 4254 with separate output directories if needed.
Tests run against production builds. Local screenshots, actual browser identity
and source revision must be recorded. Physical-device/screen-reader capabilities
remain outside this cosmetic ticket; do not imply they were tested.

Before closing, check the exact published release in the browser side panel and
save captures showing the hierarchy. Published offline-ready/update behavior must
remain accepted. Required trusted CI artifact identity and exact main tree still
apply; only main publishes. Prior unrelated device/human acceptance tickets remain
open.
