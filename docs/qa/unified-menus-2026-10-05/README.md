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

Final runtime reviewed through `8e73756d3f01dfe0dc046d276e4a38b92b9427eb`.
Final PR head `72950c0a09ac40bd8619d489bf979e1b66da6170` adds tests and evidence.
The frozen artifact controls run passed all 15 cases across five profiles in
18.8s. CI 37220330336 passed all 183 browser cases, 108 unit tests, formatting,
build, corpus comparison and the Pages subpath gate. Both reviewers approved
the calendar delta; original findings and failed intermediate fixes are retained.

[Publication evidence](publication.md) records merged PR #29, exact trusted
artifact reuse and matching hosted acceptance. [Delivery audit](delivery-audit.md)
independently verifies ZIP digests, equal source trees and byte-identical files.
The retained old client stayed unchanged until explicit Update now; draft and
preferences survived, all six menus worked and offline reopening converted new
input. Root's actual IAB captures and the independent 280px hosted measurements
record their distinct capabilities and limits.
Final visual delta: root's actual IAB inspection found the desktop calendar
surface stretched to486px around a280px grid. A later shared selector overrode
the calendar's intended width. `8e73756d3f01dfe0dc046d276e4a38b92b9427eb` gives
the calendar selector adequate specificity and bounds it to302px or the smaller
trigger. Both reviewers independently approved balanced wide/narrow calendars
and short-viewport scrolling/recovery. The fresh frozen-artifact15-case run
passes in18.8s, with compactness/alignment assertions in every profile/theme.
An accidental metadata-only rebuild during an earlier run is excluded from
exact-artifact evidence. Root IAB before/after captures are retained. The review
workflow now explicitly checks popup content balance and CSS cascade, beyond
outer viewport bounds, to address the gap in the initial reviews.

[Browser measurements](browser-performance.json) identify runtime
`b2be4d445d7bc596bd6efa38fb3c9e369d01332b`, before the final calendar CSS delta:
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
