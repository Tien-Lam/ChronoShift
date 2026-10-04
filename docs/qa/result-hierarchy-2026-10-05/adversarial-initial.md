# Independent adversarial risk derivation — TIE-369

Date: 2026-10-05 (Australia/Sydney). Reviewer role: adversarial, clean-context. Base: ab1ad4e1d8c1c249e9e7941a20043fb7627f477c. Candidate not yet supplied. Original complaint: results/converted side is difficult to read; converted result should receive greater emphasis than copied relevant original, with original retained.

Read AGENTS.md, docs/developer/review.md, docs/qa/result-hierarchy-2026-10-05/brief.md, testing documentation and production-preview/Playwright configuration. No other reviewer verdict or implementer's tests consulted. No shared build modified.

Independent competing failure cases:
- A single obvious conversion could look improved while a two-endpoint range loses endpoint or source association after reordering.
- Multiple ambiguous interpretations could repeat prominent times without a readable connection to the ambiguity, assumptions or quoted original; Copy could appear associated with the wrong interpretation.
- Long or unbroken original content could remain visually dominant by occupying excessive area, or cause clipping/overflow and make Copy hard to reach at narrow widths.
- Date-only output could receive less emphasis than timed output or contain an empty hero slot; invalid target recovery could leave misleading output/copy controls.
- Target zone/date and day-shift context could be subordinate enough to allow a user to mistake a correct time for the wrong day or zone.
- Light/dark and desktop/narrow-mobile styles could reverse hierarchy through overridden font/color/spacing rules, or mobile Copy could compete with the output.
- A DOM-only hierarchy assertion or viewport-containment check does not prove visible emphasis; inspect rendered captures and actual font/weight/dimensions/order.

Planned independent journeys: production preview on separate port4254; fresh browser contexts, desktop 1440x900 and narrow 320x740, light/dark, actual bundled Chromium/Firefox/WebKit. Cases: ordinary conversion, range, ambiguous-zone interpretations, long contextual original, date-only output; check Copy placement/source readability, result-leading DOM and relevant display metrics. Resize preservation and clipboard association targeted if supported.

Capabilities and gaps: installed Playwright engines are available; ordinary automated browser captures and computed CSS metrics can establish bounded rendered behavior. They do not establish physical phone usability, actual zoom, screen-reader quality or human subjective acceptance. Published release acceptance belongs to implementer/root and is not yet reviewed. Exact original browser/version/input/timing/cache history are unknown for this cosmetic report.

Initial verdict: implementation and original-report acceptance pending candidate build/render inspection.
