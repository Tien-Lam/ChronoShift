# Independent permanent-test and review-document delta

Observation began 2026-10-05 09:44:57 UTC. Final test author signaled completed
bytes before the 09:45:32 UTC source read; final hashes captured 09:47:35 UTC.
Explicit cwd `/Users/tien/Developer/ChronoShift`. Source-only review: no new
application run, helper invocation, test enumeration or API operation. No
adversarial verdict was consulted. App35 exact-source and bounded runtime
approvals remain inherited for unchanged App blob
`8bec3cbf656e92265f9f586fb9443de6e3c5aecc`.

| Exact reviewed file | SHA-256 |
| --- | --- |
| e2e/copy-focus.spec.ts | 6467c3acb6f5da55573678ac9e64b846fd3f8eba1cdb04b4df6ea59c0bfb429e |
| docs/developer/review.md | ab04e2e08860bc8f66125bbd673ffa0aaf1ae58114b02fb94b2f86cf12e25629 |
| docs/developer/testing.md after authorized inventory correction | 1d895e0ee08d5e86b7b7c7c03cc11b1b97958cd7dbfd84128d4a2c39070d98ac |

## Fixture verdict

No actionable source blocker. Three permanent tests distinguish the bounded
old-source focus race, preservation of uninterrupted fallback selection, and a
same-owner keyboard intent that a focus-only comparison would miss.

The scheduler matcher recognizes focus/select methods in the callback body,
without deriving a pass condition from the candidate diagnostic strings or
minified names. It holds the explicitly armed matching frame and asserts exactly
one matching copy frame. Every other callback retains native scheduling. Release
uses a real native frame after the target focus dispatch, so production capture
listeners run before the old copy callback would steal focus. No sleeps or
reduced-motion overrides are added.

The main expectation is independent: target owner remains target, keyboard
insertion commits literal CST, ambiguity removes results and copy fallback, then
Tokyo correction yields midnight on 10 April while the source interpretation
stays UTC. The keyboard insertion addresses the active element directly and
does not reacquire target focus after release. Although the later locator Tab
can address the target, it cannot restore lost CST text; the preceding soft
owner assertion and exact value assertion still discriminate the old release.
The old unguarded frame would focus/select the read-only manual-copy field;
keyboard insertion would therefore leave the target's original UTC value.
This is a source-derived discrimination, not a newly executed old-control run.

The unchanged-owner case verifies whole-field selection independently of the
candidate's epoch values. The same-owner test remembers the actual active DOM
element, presses Shift without changing focus, and checks that element still
owns focus after release. That expectation also catches an implementation that
guards only by comparing activeElement. Older requests, delayed rejection and
focus-away/back remain covered by the independently retained complementary
runtime evidence rather than unnecessarily repeating all cases permanently.

Ordinary CI adds three tests across the five standard browser/emulation projects:
15 cases, with no skip branch. The dedicated foldable project matches only its
foldable test file. Existing total 258 therefore becomes 273 configured, with
the existing nine hard-refresh skips leaving 264 runnable. The authorized
testing.md edit corrects both current inventory statements and adds the new
coverage description; historical QA counts remain untouched. This arithmetic
is a configuration/source review, not a new execution or claimed wall-time
saving.

Probe listeners and the RAF wrapper live only in those isolated test documents.
The event ring caps at 100; entries use fixed event/owner labels and monotonic
time without input data, clipboard text or arbitrary DOM attributes. The ordinary
afterEach restores frame functions and clears the held callback, without asset
requests, evidence hashing, filesystem writes or attachments. Evidence mode
explicitly requests the added asset hash/identity observation and carries only
the fixture's controlled target values in its snapshot; that whole optional
snapshot is not described as value-free. No application UI, network/storage
behavior or general-suite tracing is changed. The wrapper still inspects callback
source during these tests; overhead is bounded in scope, not measured as zero.

Ordinary failures currently discard the in-page event ring during cleanup; they
still rely on existing screenshot/context and retry-only trace policy. Thus the
separate recommendation for failure-only value-free breadcrumb retention remains
an observability opportunity, not falsely claimed implemented by this fixture.

## Documentation and original-report verdict

The review.md delta accurately requires deferred callback ownership checks,
normal-motion previous-source controls and exact distinction between first
failure attachments and successful retry traces. Its broader example paths
describe review expectations rather than claiming this three-test fixture alone
executes all of them. The breadcrumb sentence is a recommendation, not a
completed observability claim.

Implementation/test delta: approved within this exact bounded scope. Root owns
the final 273-case gate and complete attempt/artifact reconciliation. Original
report resolution remains the earlier qualified result: controlled equivalent
keyboard theft is prevented, while the untraced Web37288000068 first `fill`
interleaving and physical-device conditions are not reconstructed by these tests.
