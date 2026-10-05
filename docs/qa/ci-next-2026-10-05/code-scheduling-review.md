# Independent code review — scheduling delta

Original initial scheduling verdict; the adversarial scheduling report was not read. Earlier sparse source approval is retained within its stated limits. No browser/build/CI/API activity or workflow/runtime edits were performed. This owned report and the separate rendering-decision reconciliation are additive; initial reports remain unchanged.

## Scope and actual observation clocks

Read-only inspection and standalone saved-JSON parsing: **2026-10-05 10:48:07–10:49:47 UTC**, as observed by the clock tool. Report-writing is afterward. Environment: Darwin/arm64, mise-managed Bun 1.4.0, Git 2.56.0. Base/HEAD remains `f8c073a289f2c4af1f369a4588d5e0e74daf392c`.

Exact reviewed Git blobs:

- Web workflow `fb5b017a40bfb2c189aae4563a05988b29b3be7a`.
- Pages workflow `d92bca178f4596f578bb4e915924ba3d7fb83082` (same sparse scope previously approved).
- `docs/developer/testing.md` `2d63ec5f4400d02fae4106fa200c68536e24697e`.
- `docs/developer/web.md` `5d92fd96c10b4ef1b80f6b13de43eb308530dbde`.
- Additive `tests/publishing.test.ts` `b5a3604870e857ac90eabfca3ffbddd69b8716ff`.

Git hashes matched dispatch; workflow/docs `git diff --check` passed. Root reports actionlint/format and the targeted publishing test passed; these were not independently executed here. Production App and Choices independently hash to original baseline blobs `8bec3cbf656e92265f9f586fb9443de6e3c5aecc` and `d92d280bd71c6c2841a424d1ae9dbc53c203577c`.

## Independent failure-path trace

No actionable source blocker found. Derived the event cases directly from the changed predicate before relying on any implementer's matrix.

| Event/context                                              | Admission/name          | Timing                             |
| ---------------------------------------------------------- | ----------------------- | ---------------------------------- |
| Existing opened/reopened/synchronize, ready PR             | full `web`              | off unless explicit reusable input |
| Existing opened/reopened/synchronize, draft PR             | deferred `web-deferred` | job does not run                   |
| ready_for_review with draft=false                          | full `web`              | off unless explicit reusable input |
| labeled ci-run, draft or ready                             | full `web`              | off unless explicit reusable input |
| labeled ci-timing, draft or ready                          | full `web`              | on                                 |
| unrelated labeled event, draft or ready                    | deferred `web-deferred` | job does not run                   |
| Persistent ci-run/ci-timing on a later draft synchronize   | deferred `web-deferred` | job does not run                   |
| Persistent ci-timing on later ready source event           | full `web`              | off unless explicit reusable input |
| Current Pages reusable call from push or workflow_dispatch | full `web`              | off unless explicit reusable input |

The job `if` and dynamic name contain the same admission branches, with the name expression adding only parentheses and the true/false names. There is no name-only success masquerading as the full gate. Newly requested label identity uses `github.event.label.name`, not the persistent labels array. Case-sensitive names are intentional. The ready trigger supplements the prior default opened/reopened/synchronize inventory; unrelated labels now produce a deferred job instead of triggering a full gate.

Reruns preserve original event payload: rerunning deferred draft synchronize remains deferred even if current human-facing state changed; rerunning an explicit label request can run again. Documentation correctly instructs a new request/ready event and removing/readding a label for another investigation. Converting a running ready PR to draft is not a subscribed event and does not cancel its existing full check; no cancellation guarantee is claimed for that transition.

**Concurrency and context.** Existing job-level `web-verify-event-PR/ref` concurrency and cancellation remain. The job condition precedes a running job's admission to that concurrency group, so unrelated/deferred label events do not introduce workflow-wide cancellation of an active full check. Another admitted ci-run/ci-timing or source event can supersede an older admitted check in the existing PR group; only the actual complete successful run may supply reuse evidence. Hosted event/concurrency behavior is still unexercised. Called workflows inherit caller event context; the current callers are main push/manual, satisfying the non-PR branch without weakening PR draft policy.

**Verifier and artifact ownership.** The unchanged `trustedRun` requires job name exactly `web`, success, same repository/workflow/event and every required successful step. Deferred `web-deferred` with even hypothetical successful complete steps is rejected. The new negative assertion changes only that job name on an otherwise valid fixture, meaningfully distinguishing the required verifier boundary. A second assertion rejects a skipped deferred job with no steps. Existing positive full-web and skipped-required-step controls remain. These tests verify the pure boundary, not GitHub's actual check-name presentation.

The run/head/tested-release/main complete-tree comparisons, digest/expiry/size/archive safety and static extraction are unchanged. A new draft source update cannot reuse an old artifact unless complete trees match; QA-only differences also remain tree differences despite sparse materialization. Missing exact successful evidence invokes the complete main fallback. Premature merge may therefore incur a full main gate rather than publishing untested bytes. Main's currently unprotected/no-required-context status is dispatch evidence, not an enforcement claim; documentation's wait-before-merge policy is not branch protection.

**Retained gate/lifecycle.** No executed job's install/image/formatter/unit/corpus/browser/subpath command, expectation, worker count, motion policy, retry diagnostics or time deadline changes. Sparse checkout retains prior reviewed inputs and full tree metadata. Pages main-only preparation/environment, reusable fallback and publication-wide noncanceling serialization remain. PRs retain only same-repository verified artifacts and have no deployment job. Path-ignore behavior is unchanged; evidence/docs-only changes do not become new runtime gates merely through labels/ready transitions.

## Gaps, rejection conditions and verdicts

Reject adoption if hosted checks present deferred success as the accepted `web` job, a deferred label event cancels an active admitted job, PR ref/event identity differs from the tested merge, persistent labels instrument/run later drafts, required coverage is reduced, exact stale artifact is accepted or fallback/publication fails. Verify actual new label, ready, ordinary draft push, unrelated label, rerun and main/manual fallback behavior before cost/publication claims. Check source-tree/digest/release identities and complete attempts rather than overall green workflow status alone. Earlier sparse hosted transport/configuration gaps remain.

**Implementation:** approved within the exact source/conditional/verifier/documentation scope above; no blocker found. Actual hosted admission/check presentation, concurrency, full final gate and publishing compatibility remain unverified. Root's targeted test pass is reported evidence, not a reviewer-run check.

**Original report:** not applicable to this scheduling feature. **Original CI-goal resolution:** open/unverified. Avoiding repeated draft gates may reduce iteration usage, but this review establishes neither a measured workload saving nor >=20% quota/storage acceptance/improved raw runner pair. The saved 386-second/seven-minute versus 307/eight pair remains the unresolved baseline comparison.

Commands were Git diff/hash/rev-parse/diff-check, `rg`/`cat`/`sed` reads and standalone Bun parsing of already saved JSON/logs. No repository helper, test, build, browser or hosted workflow was executed.
