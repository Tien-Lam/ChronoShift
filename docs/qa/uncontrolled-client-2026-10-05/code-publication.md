# Focused code publication and documentation review

This delivery-only delta supplements the unchanged initial, final implementation and user-clarification reports. No app edits, user-profile changes, full runtime gate repeats or additional browser journeys were performed by this reviewer for this delta.

## Publication identity and required gates

Reviewed runtime source63c9cdc442eac03c30dbae7871d1452b1049c7b0 and main merge54cc09e1c8a14dceddf36083893436a57f78bae5 independently resolve locally to treee2f47a192b63d19a9b8eed70f6ffed82d6014a34, with no source diff. The tested checkout4a771b9d102dbcaf3a807f096fb26861bbfa8e5f is a GitHub synthetic PR merge unavailable as a local commit; `gh api .../git/commits/4a771b9d...` independently confirms the same tree. Consequently the reviewed, CI-tested and main-published source trees match exactly, despite their different commit identities.

Using gh CLI read-only operations, independently corroborated:

- CI37226904832, pull_request/head63c9cdc: success. Required format, unit/build, corpus, browser and repository-subpath steps all succeeded.
- Pages37227337390, push/main54cc09e: success. Trusted exact PR artifact reuse, upload and deployment steps succeeded; the duplicate full verification job was correctly skipped for reuse.
- CI artifact11312885351 digest ae59ece34296bc8e32c87fa6173a1c9935eb6955a8e0aea2529826d700f9cda9 and Pages artifact11311604365 digest f617227f1784c16beae559e11842b49067ca9dc6f35bfeec4af010beae3b640d match publication.json and the respective GitHub artifact APIs.

Inspected saved publication.json and publication-probe.ts. The implementer's public-byte verification compares sw.js SHA256 with the extracted trusted CI artifact and requires every one of13 precache assets to match the worker's exact integrity manifest. Recorded published source4a771b9d..., worker1daf9e89c308221a, worker SHA256bdfa95d5542c3a390995ebcce13dec1b1786c1e210858263e1b32bdfbd27c46c. Four Chrome/Pixel-profile hosted checks passed in26.9sec. This reviewer audited those records and harness rather than repeating public-asset downloads or the browser gate.

## Matching published report acceptance

Inspected durable complementary independent adversarial-publication.md, hosted-after.json and hosted-after-probe.ts. They identify exact HTTPS release source4a771b9d..., expected base/ChronoShift/, published active/response worker1daf9e89c308221a, and runtime index-DJzqWUF9.js SHA2564a0ebd9c9605283a04e8f38c6f08233f3b5935a313410e9953c2ddab1bc7809a, matching the independently reviewed subpath runtime.

Actual installed Chrome154.0.8037.93, macOS, ephemeral profile, en-AU/Australia-Sydney: CDP hard refresh initially produced successful registration controlled:false, active activated, controller absent and installing/waiting absent. The captured same-tab logs show controllerchange3ms after registration and confirmed actual-controller readiness5ms after registration, with no new installation transition. Target interaction occurred at12.068sec, conversion at13.075sec, and snapshot17.016sec shows activated control/readiness true, preserved input, exact09:20 London conversion rendered9:20am and no warning. Two main-frame navigations are the initial visit and user hard refresh; no automatic reload occurred. Offline close/reopen with fresh input converted correctly and remained ready/no warning. Successful run records no console/page errors or diagnostic context loss.

The initial helper timeout is separately classified and retained: an exact9:20 assertion conflicted with en-AU display9:20am. Only the helper expectation changed; follow-up debug and successful complete matching rerun support that explanation. This is not an unresolved app lifecycle failure. This code reviewer inspected the saved independent journey and did not claim to have personally rerun its published browser timing.

## Documentation review

Reviewed the new docs/developer/review.md lifecycle instruction, docs/developer/testing.md provenance/count changes and QA README against the saved original reports and raw evidence. Two actionable wording findings were fixed before this verdict:

1. The transition baseline was incorrectly described as the actual older published worker. README now explicitly identifies locally built worker e26cfc3dedb05ea4 and attributes the exact previous live3ac0e622535455b5 artifact to the separate hosted failure record.
2. Review guidance now requires interactions at their reported times followed by observation beyond the deadline, and specifically keeps waiting-worker activation explicit. It does not imply delaying the original12/13sec interactions untilafter15sec or requiring user approval for the active-worker claim handshake.

The workflow change targets the demonstrated escape: successful registration and complete active-worker cache do not establish control of a force-refreshed document; in-document interactions retain that client's state. Separate active/installing/waiting/controller metadata and actual controller identity must be checked. The evidence-selection audit accurately qualifies older controlled-fault and cache-rewrite scopes, preserves original reports, retains separate implementation/report verdicts, and excludes unexercised browser/device histories. It does not prescribe more reviewers or model changes as a substitute for a matching lifecycle.

`bunx --bun prettier --check docs/developer/review.md docs/developer/testing.md docs/qa/uncontrolled-client-2026-10-05/README.md`: passed. Read-only local Markdown link validation for those files found no missing targets. No documentation blockers remain. Existing runtime approval is retained unchanged; this documentation-only delta needs no new full runtime gate.

## Separate final verdicts

Implementation/publication: APPROVED within the reviewed active-worker recovery, explicit older-worker update/draft and offline-navigation scope. Required CI and exact source-tree/artifact publication evidence are satisfied; matching actual published browser acceptance is recorded.

Original report: MATCHED AND RESOLVED for the user's confirmed hard-refresh followed by normal interaction in that same tab. Previous exact hosted behavior reproduced the symptom; the same implicated lifecycle and reported interaction timing now recover correctly on the exact published artifact, beyond the real deadline and through offline reopen. The earlier hypothetical distinct fresh-normal-navigation gap was superseded by the direct same-tab clarification, not erased from the original historical reports.

Unknown historical user Chrome version/profile and exact worker/cache identity remain qualified. This approval supports closure of the matched report's acceptance, not exhaustive browser/extension certification, physical installation/share menus/screen readers, unrelated histories or other tickets. No AdGuard causality is inferred. Ticket completion remains the implementer's responsibility and must use matching acceptance evidence.
