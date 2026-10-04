# Consistent opened choice menus

TIE-343 continues the published closed-field alignment fix after the user
clarified that all opened lists also need consistent styling. Theme, numeric
date order, time display, both searchable timezone fields and the date calendar
now use bundled React Aria controls with shared themed popovers. Freeform valid
offsets remain editable; incomplete dates block conversion and can be cleared.

The implementer coordinated a calendar implementation agent, regression agent
and two independent review roles. The four-concurrent-agent session limit
includes the orchestrator. Actual dispatch scope and context limitations are
retained in [the brief](review-brief.md). Separate implementation/original-report
verdicts are in [code review](code-review.md) and
[adversarial review](adversarial-review.md); regression conditions and harness
distinctions are in [regressions](regressions.md).

The initial selected-timezone popup defect was found before publication.
Independent before/after probes show an unbounded list scrolling the page and
closing the menu. A Group wrapper alone did not fix it. Bounded inner scrolling
does; short viewports and far-down selections recover without losing the draft
or result. Evidence retains the failed candidate as well as the corrected one.

The security policy allows only exact hashes of two pinned library interaction
styles. Arbitrary inline CSS/scripts remain blocked. Normal-use checks include
policy violations, beyond page errors alone. WebKit screenshot instrumentation
injects a rejected `body {}` stylesheet; screenshot-only violations are retained
as harness evidence and kept outside the normal interaction journey.

Runtime reviewed through `b2be4d445d7bc596bd6efa38fb3c9e369d01332b`.
The final test-only WebKit capture adjustment was separately approved by the
code reviewer; it retains all behavior/layout/normal-CSP assertions. All15
controls cases pass across five profiles, in19.4s. The earlier complete run
passed168 unrelated cases; the final PR gate must run all183 and Pages subpath.
Unit108, typecheck/build and formatting pass. Publication evidence is pending
and will identify the exact trusted artifact and matching hosted journey.

[Browser measurements](browser-performance.json) identify the reviewed runtime:
JS/CSS gzip302,088bytes; complete offline asset gzip373,162bytes versus the
earlier255,458-byte inventory. The extra interaction library adds about118kB to
the offline payload. Local desktop p95 form startup101ms, offline readiness181ms,
offline reopening91ms; measured conversion workloads all meet their provisional
budgets (p95≤86ms). This is a development-machine measurement, not phone proof.
Pinned public subpath imports halve the transformed module graph; locale and
calendar support are retained. No runtime CDN or model download was added.

Research: [React Aria Select](https://react-aria.adobe.com/Select),
[editable ComboBox](https://react-aria.adobe.com/ComboBox),
and [MDN customizable select support](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Customizable_select).
Native customizable select lacks consistent supported behavior across the
target browser matrix; the bundled controls provide shared popup styling and
keyboard/state ownership without depending on browser-native menu presentation.

The nine existing physical-device, installed integration, screen-reader,
actual-zoom and phone-performance acceptance tickets remain open. Local
emulation and historical conditions unknown to reviewers do not close them.
