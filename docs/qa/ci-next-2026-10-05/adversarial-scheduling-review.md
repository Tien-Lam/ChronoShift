# Independent adversarial scheduling review: original report

Actual read-only observation interval: **2026-10-05 10:48:13–10:49:53 UTC**, from clock-tool calls. Report-writing time is separate. Environment: shared macOS 27.0.1/Darwin ARM64 checkout, Git 2.56.0; no hosted execution. Base is `f8c073a289f2c4af1f369a4588d5e0e74daf392c`.

Exact source scope:

- Web workflow `fb5b017a40bfb2c189aae4563a05988b29b3be7a`.
- Pages workflow `d92bca178f4596f578bb4e915924ba3d7fb83082`.
- Testing documentation `2d63ec5f4400d02fae4106fa200c68536e24697e`.
- Publishing documentation `5d92fd96c10b4ef1b80f6b13de43eb308530dbde`.
- Additive publishing assertions `b5a3604870e857ac90eabfca3ffbddd69b8716ff`.
- Original scheduling dispatch initially `a5bb049a4bd095de24051ecad4c33606a6ae2e12`; additive assertion scope was then appended, producing inspected dispatch `bccd021d146644aadd69b819038b2627af1e99b2`.

I derived ready/draft/new-label/persistent-label/rerun/source-change/premature-merge failure paths before relying on the implementer's proposal matrix. I did not read the code scheduling reviewer's report. Commands were `cat`/`sed`/`rg`, `git diff`, `git hash-object`, `git status`, and read-only inspection of existing trust owners/workflow controls. No test, helper script, API, browser, build, CI or source mutation was performed. The publishing assertion pass reported by root is not claimed as my own execution. Original runtime and sparse reports remain unchanged; the separate render reconciliation records the rejected prototype.

## Findings and competing conditions

**No actionable source blocker found for the current workflows.** The admission/name expressions use the same predicate; admitted jobs retain `web`, deferred records use `web-deferred`. The entire full job remains present. The following conclusions are source-derived; actual GitHub check naming, event evaluation, cancellation and cost remain hosted acceptance gaps.

| Competing event condition | Source-derived result |
| --- | --- |
| Draft opened/reopened/synchronize, with no request or an old request label | Deferred; old `ci-run`/`ci-timing` labels do not admit later source pushes. |
| Ready opened/reopened/synchronize | Full `web` job; every new source snapshot is eligible. |
| Ready-for-review event | Subscribed explicitly and eligible when the event snapshot is ready. This closes the prior default-trigger gap. |
| New exact `ci-run` label on draft or ready | Full job with ordinary timing policy. |
| New exact `ci-timing` label on draft or ready | Full job with bounded timing metadata. |
| Unrelated label, including on ready PR | Deferred rather than another full gate. The persistent-label list is intentionally ignored. |
| Remove a request label, then add it again | Removal is not subscribed; the new matching label event requests another full job. |
| Rerun a previously deferred draft event after making PR ready | Its original payload still defers; documentation correctly directs a new ready/request event. |
| Rerun an eligible label event | Remains eligible and can repeat the investigation; “one request” does not mean reruns are refunded. |
| Source push after a draft investigation | Defers while draft; its old artifact cannot satisfy exact-tree publication for changed source. |
| Main push/manual Pages full fallback | Called Web inherits the non-PR caller context and runs full, preserving current callers. |

1. **Deferral does not become artifact verification.** The unchanged reuse verifier requires a successful job named exactly `web` with all six required successful steps, plus successful same-repository PR/workflow/run, complete metadata, exact full head/tested-release/main trees, digest, archive safety and source/base validation. `web-deferred` fails even if its workflow appears successful. The new test assertions independently challenge a deceptive deferred name with otherwise complete successful steps and a skipped deferred record with no steps. They add assertions to an existing test; they do not replace trust checks or reduce inventory.
2. **Premature merge still requires main fallback.** No currently enforced branch check is claimed by the saved brief. Documentation instructs waiting for the exact-source full gate; that instruction is process guidance, not newly established branch protection. If a draft is merged without a valid exact artifact, or source changes after an earlier investigation, missing/unverifiable evidence invokes full main verification. A fully tested draft artifact can legitimately be reused for an identical tree. An existing trusted artifact is not invalid merely because a later unrelated event deferred. Conversely, many deferred successful records can crowd the latest-30 scan and cause extra fallback cost; they cannot authorize unverified publication.
3. **Concurrency boundaries preserve the intended distinction.** There is no new workflow-wide cancellation. Only the admitted full job owns the existing same-PR verification group. Source reads support the intent that unrelated/deferred events do not cancel active verification; hosted observation must confirm GitHub's job-if/name/concurrency ordering. A newly eligible same-PR full job may supersede an older eligible job under existing policy. State changes do not retroactively revoke an already admitted event. Pages still serializes preparation through deployment with cancellation disabled and main-only publication; failed reuse/upload/deployment does not initiate a second publication.
4. **Coverage and path policy are unchanged.** All full steps, frozen installation, browser image, fixtures, normal motion, four-worker inventory, unit/build/corpus gate, separate subpath build, lifecycle/deadlines and diagnostic retention remain. Existing path ignores still apply before admission: a label cannot request a full run for an entirely path-filtered documentation/evidence-only PR. The documentation separately preserves that exception; no universal label override is claimed.
5. **Reusable-input scope is bounded to current callers.** Non-PR calls remain admitted, and their explicit timing input works. Unlike the broader analysis proposal, this exact predicate does not override draft admission solely because a hypothetical future PR reusable caller supplies `ci-timing`/`publish-pages`; current Pages callers are push/manual, so this is not a current blocker. Do not generalize this approval to a new draft-PR caller without reviewing its intended admission semantics.
6. **One-shot timing matches the documented policy.** A newly labeled timing event instruments that full gate. Ordinary ready/source events with a leftover timing label do not. The explicit reusable timing input remains supported. Changing this policy avoids sticky instrumentation; it is not evidence of a runtime or quota improvement by itself.

## Required hosted evidence and verdicts

Before claiming operational acceptance, retain actual eligible/deferred check-run names and conclusions for draft, ready, request label, unrelated label, persistent-label source push and rerun cases. Observe an active full verification through an unrelated label event. Verify complete current coverage and exact artifact reuse/full manual fallback using final committed source, plus fresh sparse transport selection/config. The existing sparse approval and its stale-cone/append-rule/unsupported-Git/REST-fallback limitations remain applicable; it is not re-certified as a measured improvement here.

**Implementation:** approved within this exact scheduling/source/assertion scope with no blocker found. Earlier sparse source approval is retained. Hosted event/check/concurrency/publication acceptance remains pending.

**Original report:** not applicable; this is a workflow/control-policy change.

**CI-goal resolution:** unresolved. No hosted scheduling candidate or complete usage/storage pair was observed by this review. The brief's ordinary pair remains 386 seconds/seven rounded minutes versus baseline 307/eight; source admission logic and historical avoided-run estimates do not satisfy the requested ≥20% reduction. Keep TIE-375 and the CI goal open.
