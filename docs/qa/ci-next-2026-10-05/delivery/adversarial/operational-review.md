# Independent bounded operational audit

Observation start: **2026-10-05 11:00:22 UTC**. Follow-up snapshot began **11:02:09 UTC** and its API/source reads completed **11:02:12 UTC**. These are direct clock-tool results. I used one 45-second sleep before the follow-up, rather than frequent polling. Report writing is separate. Environment: Darwin ARM64, mise-managed gh, repository checkout `/Users/tien/Developer/ChronoShift`.

I did not read another reviewer's operational report before this verdict. No source-branch files were written, and no GitHub mutation, CI dispatch/cancel, browser, build, test or verifier/helper execution occurred. This folder contains original raw responses from my own read-only gh requests; earlier source/hosted corrections remain unchanged in the repository. Root owns full gate and publication.

## Exact scope and raw evidence

PR41/head and local checkout are **`cb8206c280494341632821d13b4e90f8f1c3a3e9`**, full committed tree **`e42d8c81cc83befed6ff9d57dbf56066c7238d07`**. Local `HEAD^{tree}` and the candidate commit API agree. Current main API snapshot remains commit `f8c073a289f2c4af1f369a4588d5e0e74daf392c`, tree `4f49ec284d40321df2878bb4033a2fbf466c715f`; it differs from this PR's full tree.

Workflow blobs remain Web `fb5b017a40bfb2c189aae4563a05988b29b3be7a`, Pages `d92bca178f4596f578bb4e915924ba3d7fb83082`; unchanged trust owner `227e097ec2c6103563f1d069fb433b3c8f3199c9`. Full-tree comparisons continue to cover excluded QA blob identities/modes; local sparse path materialization is not used as source identity.

Raw files: `run-list-initial.json`, `pr-initial.json`, `pr-events.json`, `candidate-commit.json`, `main-commit-initial.json`; `sticky-run.json`, `sticky-jobs.json`, `sticky-artifacts.json`; `unrelated-run.json`, `unrelated-jobs.json`, `unrelated-artifacts.json`; `ready-run-initial.json`, `ready-jobs-initial.json`, `ready-run-followup.json`, `ready-jobs-followup.json`, `ready-artifacts-followup.json`, `pr-checks-followup.json`.

Commands were read-only `mise exec -- gh run list`, `gh pr view`, `gh pr checks`, `gh api` run/jobs/artifacts/issue-events/commit endpoints; local `git rev-parse`, `git hash-object`, `git status`, source reads and `jq` reductions of the saved responses. No response is reconstructed from another task's summary.

## Hosted competing event journeys

| Run | Actual raw condition/result | Artifact/verification consequence |
| --- | --- | --- |
| 37299950927 | Draft source-push run at this head, created 10:58:25Z, completed/skipped. Job 111730041849 has unevaluated expression name, no runner and no steps. Old `ci-run` label was added at 10:55:25Z and remained attached. | Artifact count zero. Persistent request label did not admit this draft source push. No literal `web` masquerade. |
| 37299989506 | Ready full run created 10:58:49Z; literal `web`, job 111730170467, still in progress in both snapshots. | At follow-up browser step in progress; subpath/upload pending; artifact count zero. No full-gate or publication success claimed yet. |
| 37300042053 | New unrelated enhancement-label run created 10:59:19Z, completed/skipped. Job 111730383667 is expression-named, no runner and no steps. | Artifact count zero. It did not cancel the already active full job within the observed interval. |

The issue-events API records ready_for_review at **10:58:47Z** and enhancement labeled at **10:59:17Z**. The latter is distinct from the unrelated run's **10:59:19Z** creation and root's event-observation time. At initial PR snapshot the PR is ready with both `ci-run` and `enhancement` labels. The full ready job had started at **10:58:52Z** before enhancement; its browser step started at **10:59:42Z**, after enhancement and the skipped unrelated run. The same full run/job remains in progress at the **11:02:09–11:02:12 UTC** follow-up. That is direct evidence of continuing execution across this competing event and through a later snapshot, not merely absence of a cancellation field on the skipped run.

The unrelated skipped job reports started_at 10:59:28Z and completed_at 10:59:19Z. Preserve this reversed metadata as supplied; it does not support duration/billing calculations. Initial and follow-up ready run metadata are not final-completion records. API/pr-check views may omit older checks by follow-up; saved initial API responses preserve their separate identities.

## Artifact trust and premature-source challenge

The two actual skipped records fail the unchanged verifier in multiple independent ways: completed conclusion is skipped rather than success; job name differs from exact `web`; no required successful steps; no Pages artifact. A hypothetical skipped workflow success alone would still fail job/required-step checks. The current literal-`web` ready record also remains ineligible while in progress with no completed subpath/upload/artifact. I inspected these conditions against the actual responses without invoking the verifier or changing its accepted names.

Actual candidate and current main tree IDs differ. The existing reuse loop compares PR-head tree with publishing main tree before considering artifact trust and then requires tested release source tree equality after safe extraction. These guards reject an artifact from a mismatched source tree, including a difference solely in excluded QA evidence. There is no content/ancestry/sparse-path shortcut. This is a source-derived rejection applied to observed differing IDs, not an executed negative reuse or extracted-release experiment; the completed candidate artifact does not exist in this bounded snapshot.

Main fallback admission remains source-approved for current callers: Pages prepare must succeed and return reused != true, then the reusable Web receives a non-PR push/manual caller context and enters the full job. Deployment requires successful full verification and does not recover a failed reused deployment by starting a second publication. Missing exact artifacts or metadata take fallback, not trust relaxation. Workflow-wide Pages serialization/main-only environment remain unchanged. Actual reuse, fallback, source release/tree, archive digest and publication are still root-owned pending evidence.

## Separate verdicts

**Implementation:** no blocker found in this bounded operational scope. Earlier source approvals remain applicable, including the correction that skipped-job display names are unevaluated expressions rather than literal `web-deferred`.

**Hosted scheduling acceptance:** sticky request-label source push deferred; unrelated enhancement label deferred without runner/steps/artifact; no skipped literal `web` was accepted; the already active literal `web` job continued after the unrelated event and through the follow-up. This resolves the specific competing concurrency observation gap for this head/event/window. It does not certify all GitHub scheduling cases, reruns, later eligible-job supersession or future workflow-level changes.

**Full gate/publication acceptance:** still pending in these snapshots. Browser/subpath/upload were incomplete; no completed artifact or automatic reuse/full fallback/publication was audited. Preserve final runner attempts/logs/artifacts before claiming all first attempts passed.

**CI-goal resolution:** unresolved. This audit measures admission/cancellation behavior, not a completed ordinary PR/main pair, quota rounding, actual sparse wire transfer or artifact/storage reduction. The ≥20% goal and TIE-375 remain open. Original rendering browser journeys remain unexecuted. No source branch changes were made by this audit.
