# Review gap caught by the complete gate

CI 37230414503 on d3f6a42 rejected a delayed-share assertion that expected no result for a restored draft. The protected draft and its 9am conversion were correct; the old button-driven expectation was wrong. Faster local runs briefly observed zero results during the debounce and therefore passed the obsolete assertion. CI's slower iPhone profile observed the intended settled result and failed both attempts. The original screenshot and both failure contexts are retained.

Independent runtime journeys covered restoration and import protection, but the initial code review missed the restored branch’s obsolete zero-result expectation despite separately verifying automatic restoration. Passing those journeys could not certify all migrated assertions. This was found before merge/publication, so the complete gate worked as intended; the initial review scope/report remains unchanged rather than retroactively claiming it caught the assertion.

The final import expectation requires a result for both the converted and restored draft, verifies its 9am/18June identity, and requires zero only for Clear. Untouched imports also verify their automatic 3pm result. Root final targeted check: 15 cases across five profiles, 13.0s.

Proposed review guidance: when changing interaction triggers, audit existing edit/import/restore/reset expectations for steady-state behavior. A transient clear observed during a debounce is not evidence that a filled draft should remain without results; use exact final result identity and a retained competing completion where needed. Preserve test coverage for old releases in rollout tools separately from current UI controls.
