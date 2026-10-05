# Read-only draft-gate scheduling proposal

Inspected committed base `f8c073a289f2c4af1f369a4588d5e0e74daf392c`, full tree `4f49ec284d40321df2878bb4033a2fbf466c715f`, plus the root-owned sparse-checkout inputs already present in the working workflows. Environment: `/Users/tien/Developer/ChronoShift`, Darwin arm64, Git 2.56.0, mise-managed Bun 1.4.0/gh 2.100.0. Observed clocks began **2026-10-05 10:41:27 UTC** after the first source/API/document reads, with a later read at **10:42:59 UTC**. No source mutation, checkout, tool install, browser, build, suite, Actions run or deployment was performed. GitHub operations were read-only gh calls. This report is the only intended write by this agent for this follow-up. It is proposal analysis, not either required final independent review.

**Verdict:** draft iteration deferral is a credible way to avoid some repeated automatic full gates without weakening the final verification or publication gate. It requires an explicit ready-for-review trigger and distinct deferred-check identity. The actual cost of draft runs is measurable; how much was unnecessary is not established. The successful PR/main-pair target remains unresolved.

## Proposed admission and timing policy

Keep `pull_request`, its existing main branch/path exclusions and all full Web steps. Specify:

```yaml
types: [opened, reopened, synchronize, ready_for_review, labeled]
```

GitHub's [event documentation](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request) confirms the current default admits opened/reopened/synchronize but omits ready-for-review; draft status itself does not suppress those default events. Ready-for-review must be added before deferring drafts. Do not change to `pull_request_target`, workflow-run execution of fork artifacts, or a head-ref checkout.

Define eligibility **P** from the event snapshot:

```text
github.event_name != 'pull_request'
OR inputs.publish-pages
OR inputs.ci-timing
OR (
  github.event.action in {opened, reopened, synchronize, ready_for_review}
  AND github.event.pull_request.draft is the boolean false
)
OR (
  github.event.action == 'labeled'
  AND github.event.label.name in {ci-run, ci-timing}
)
```

The job's `if` and display `name` must use the **same predicate**, with only `github`/`inputs` contexts: `if: P`; name = `P && 'web' || 'web-deferred'`. Preserve job ID `web`. Expressions cannot obtain this predicate from workflow `env` at job admission: the official [context availability table](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts#context-availability) permits `github`/`inputs` for both job `if` and job name, but not `env`. If spelling the exact false test defensively, `toJSON(github.event.pull_request.draft) == 'false'` distinguishes a real false boolean from absent/null or string payload values. Do not accidentally replace eligibility with `!draft` alone on every labeled event.

No full gate should run for a draft opened/reopened/synchronized event merely because a request label remains attached. A **new labeled event** for exactly `ci-run` requests one normal complete gate; exactly `ci-timing` requests one complete instrumented gate. Remove/re-add the same label to request another investigation. No automatic label removal, token escalation or GH write is needed. Unrelated labels do not request a gate, even on a ready PR.

For one-off timing semantics, change the present sticky-label timing decision to `inputs.ci-timing || (github.event_name == 'pull_request' && github.event.action == 'labeled' && github.event.label.name == 'ci-timing')`. A leftover timing label should neither admit later draft pushes nor silently instrument a later ordinary ready gate. Existing reusable timing input stays explicit. This is an intentional control-policy change to document, not an unmeasured runtime optimization.

## Condition matrix

| Event/context | State/request | Full job | Timing | Check identity / consequence |
| --- | --- | --- | --- | --- |
| PR opened/reopened/synchronize | draft, no new request | deferred | off | `web-deferred`; no tested artifact |
| PR synchronize | draft with old `ci-run`/`ci-timing` label still present | deferred | off | Request is not sticky across source pushes |
| PR ready_for_review | ready | full | off | `web`; exact final-source gate starts |
| PR opened/reopened/synchronize | ready | full | off | `web`; every subsequent changed source is verified |
| PR labeled | newly `ci-run`, draft or ready | full | off | `web`; one explicitly requested complete gate |
| PR labeled | newly `ci-timing`, draft or ready | full | on | `web`; bounded one-day timing artifact policy remains |
| PR labeled | unrelated label, draft or ready | deferred | off | `web-deferred`; must not cancel an active full gate |
| PR unlabeled | any | no event subscription | none | Removing a request label does not run another gate |
| PR converted_to_draft | any | no event subscription | none | Already-running ready gate may finish; no promise of retrospective cancellation |
| PR edited/review requested | any | no event subscription | none | Existing review/fix batching remains an explicit source process |
| Main Pages push, reuse unavailable | called Web, caller context is push, publish-pages=true | full | explicit input only | Existing reusable `verify / web`, full fallback unchanged |
| Main manual Pages dispatch | called Web, caller context is workflow_dispatch | full | explicit input only | Manual publication remains full verification |
| Future reusable PR caller | explicit publish-pages or ci-timing input | full | ci-timing input only | Inputs remain explicit requests; current PR deployment prohibition still applies |
| Existing path-ignored documentation-only PR | any state | workflow filtered as today | none | Existing path-filter/required-check caveat remains; no new broad suite |

The [reusable-workflow reference](https://docs.github.com/en/actions/reference/workflows-and-actions/reusing-workflow-configurations#github-context) states that the called workflow receives the caller's GitHub context. Testing `github.event_name == 'workflow_call'` would be wrong here: Pages fallback sees push or workflow_dispatch. Keeping the non-PR branch of P and the existing publish-pages input preserves all current fallback admission. Keep main-only environment, trust verifier and whole-publication serialization unchanged.

## Required checks and artifact trust

GitHub documents that a conditionally skipped job can report success for required-check purposes, while an entire filtered workflow leaves its checks pending. A fixed job name **`web` with only `if: !draft` is therefore rejected**: it can make a deferred gate look like the successful full Web check. Separate names are necessary. A deferred skipped record can say `web-deferred`; it must never supply the `web` identity. Inspect actual check-run/job names and conclusions in a future small hosted admission test before relying on dynamic-name behavior. [Required-check documentation](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks#handling-skipped-but-required-checks).

Current read-only branch metadata reports `main.protected=false`, protection disabled, required contexts/checks empty and enforcement off; the rulesets endpoint returns `[]`. There is **no currently enforced required Web status check to claim**. Distinct identity still matters for reviewers and future enforcement. This proposal does not change repository branch settings. If a required `web` context is later configured, it must refer to the actual full job; the current documentation/path filtering policy must also be reconciled, since an all-PR requirement would leave documentation-only PRs pending. Do not call a deferred success proof that the merge was verified.

The current `trustedRun` verifier independently requires a successful same-repository PR run/workflow, a successful job named exactly `web`, and successful format, unit/build, corpus, browser, subpath and upload steps. A deferred `web-deferred` job supplies none of that evidence and no Pages artifact. Even if an all-skipped run's overall conclusion is success and it appears in the verifier's latest-30-successful-run scan, it remains ineligible. Keep the step checks, job conclusion, full job/artifact-list checks, head/tested-release/main complete-tree equality, artifact SHA-256, safe extraction and release-base/source validation. Never broaden accepted job names to include deferral or accept workflow success alone.

A complete explicitly requested draft gate can legitimately produce a trusted artifact; draft status does not undermine its actual verification. Publication still requires full exact-tree equivalence and all existing trust conditions. If a maintainer merges before the new ready gate completes, or if no valid artifact exists, serialized main publication must run the complete fallback. This protects publishing but does not substitute for a required premerge check. Current lack of branch enforcement makes that distinction material.

Keep concurrency at the present **full-job** level. An unrelated labeled or deferred event must not cancel a running verification through newly added workflow-level cancellation. A newly eligible same-PR full request may supersede its previous eligible full job under existing policy. Already-running jobs are not magically refunded; source/state changes after their event snapshots do not retroactively change P. Re-runs reuse the original event payload, so a skipped draft-open run remains deferred; use a new ready/request event to start a full gate. Do not start new dispatch workflows as a replacement for PR checks.

## Actual historical sample and its limits

Read-only requests used `gh pr view 37/38`, complete paginated issue timelines, `gh run view 37281970385`, branch metadata and rulesets. The first attempted `gh api --paginate --slurp --jq` was rejected locally because gh disallows that flag combination; no API result came from it. The corrected request used `--paginate --slurp` and in-memory Bun JSON reduction. Timeline pagination is complete: PR37 one page/18 events; PR38 one page/three events. Preserve the API's timeline event spelling `convert_to_draft`, distinct from webhook activity `converted_to_draft`.

**PR38 is not demonstrated draft-induced cost.** It was created at 08:10:14Z; Web37281970385 started 08:10:19Z and completed 08:17:54Z (455 runner seconds/eight rounded minutes). The complete timeline records conversion to draft only at **08:34:17Z**, after that gate. Current draft=true cannot establish historical draft state at the run. Under this proposal the evidenced original gate would still have run.

**PR37 is an actual draft-run sample.** It was created at 05:53:59Z and became ready at **07:09:39Z**, then merged at 07:09:42Z. The complete timeline contains no preceding convert-to-draft or ready transition. This supports the inference that it was initially draft until that recorded ready transition. All six retained PR-branch gates began before readiness. Original run IDs, sources, timestamps/jobs and separate cost ledger remain in [publication-input](../ci-efficiency-2026-10-05/publication-input/report.md):

| Run | Start UTC | Head source | Actual runner seconds / rounded minutes |
| --- | --- | --- | ---: |
|37269816926|05:54:02|`2d94136249cf67b7ab37efe44401180a976692ad`|356 / 6|
|37270362546|06:01:16|`77fbf61b33d0b2752a3f90b20a261f30f0842b0f`|419 / 7|
|37272392986|06:26:05|`8a4ebec0881f8363ffd19f833bbf29a44e77885a`|431 / 8|
|37273144333|06:34:56|`e632d2f5bb8ff3cfc8c447ab87ae081078ca04c2`|464 / 8|
|37274080414|06:45:56|`52e8d9c3bc2ba50f6ba2990dde5a128a37849172`|362 / 7|
|37274709527|06:53:20|`b288920d072d6ebb6ca56d1ea83f7c95ea7bed02`|400 / 7|

The total is **2,432 runner seconds / 43 per-job rounded minutes**: five investigation gates 2,032/36 plus the final accepted gate 400/7. The saved final run's artifact source is its tested PR merge, distinct from the API head source in the table. The historical inventory was 258 scenarios, not today's 273.

These are **real charged draft-period runs**, not a proven 2,432-second saving. The five experiment/control gates were deliberately requested investigations; under a new policy they may still be requested through the one-off labels. The final exact gate also remains necessary and could move to ready-for-review. A strict new premerge ready gate would have started only three seconds before PR37's historical merge, so its completion/merge timing cannot be assumed. No gate is removed from this ledger, no fabricated counterfactual completion is substituted, and no monthly/billing or >=20% saving is claimed.

## Final-gate workflow and acceptance boundary

[The existing review instructions](../../developer/review.md#resolution-and-verification) already require batching source review reports/fixes before the final hosted gate, then retaining additive evidence in the PR or a separate documentation-only follow-up. Cumulative PR paths can retrigger a runtime gate even for an evidence-only commit; that commit also changes the full trusted source tree. Draft deferral helps enforce this work order: perform targeted reproduction/review/fixes in draft, request explicit complete Linux investigations when necessary, mark ready once source reports/fixes are batched, wait for the complete exact-head gate, then avoid gratuitously changing the tested head to annotate results. Source changes and unresolved findings still require appropriate checks and exact-tree verification.

The final ready gate remains all **273 configured/264 runnable/nine capability skips, 116 units and separate subpath**, frozen install, formatting, types/root build, independent expectations/corpus, normal motion and unchanged lifetime/timeout/update coverage. Deferring intermediate snapshots is scheduling policy, not changed-only selection within a full gate. Required substantial-change code/adversarial reviews and separate implementation/original-report verdicts remain.

Before adoption, validate the event matrix, evaluated full/deferred names, no runner allocation/upload on ordinary drafts, request-label nonstickiness, ready-for-review admission, noncanceling unrelated labels, unchanged fallback calls and ineligible-deferred-artifact rejection. Use synthetic metadata/table checks and small hosted admission evidence before an expensive full gate where possible. No such hosted validation occurred in this analysis.

The current successful accepted pair remains **386 seconds/seven minutes** versus307/eight, with storage already63.13% lower; a ready final gate plus publication still incurs that declared pair's full work. Draft scheduling cannot be claimed to restore that same pair's >=20% acceptance threshold. Future aggregate usage assessment needs a separately declared scope, actual avoided automatic iteration count, explicit investigations kept, and all real validation costs. This proposal is operational efficiency potential; TIE-375's present acceptance gap stays open.

Report-writing completion and final unchanged base head/tree verification were observed at **2026-10-05 10:45:00 UTC**. No implementation or CI experiment was performed.
