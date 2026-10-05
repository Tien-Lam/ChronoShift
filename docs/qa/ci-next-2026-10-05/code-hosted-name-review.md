# Additive review — observed hosted job names

Original reviews/corrections are preserved. Read-only observation interval **2026-10-05 10:55:46–10:56:06 UTC** (actual clock). Used mise-managed `gh pr checks 41 --json name,state,workflow,link` and `gh api` GETs for the original run, its jobs/artifacts, and the admitted investigation's jobs. No GitHub mutation/dispatch/cancellation, source edit, browser or build was performed by this reviewer.

Scope: PR41 head `af28e0739c7c7d8de2dfa77c508ee2e08be1c539`; Web workflow blob `fb5b017a40bfb2c189aae4563a05988b29b3be7a`, Pages `d92bca178f4596f578bb4e915924ba3d7fb83082`, unchanged verifier `227e097ec2c6103563f1d069fb433b3c8f3199c9`. Original scheduling review still hashes to `f01297c91e8af094c53c49568b4604ad3289307f`.

## Independent hosted observations

The [draft opening run 37299570754](https://github.com/Tien-Lam/ChronoShift/actions/runs/37299570754) is event pull_request, attempt1, completed with conclusion **skipped**. Its only job **111728818997** is completed/skipped, has no steps and no runner assigned. Artifact API returns total_count0. Its actual check/job name is the unevaluated expression text:

```text
(github.event_name != 'pull_request' || (github.event.action != 'labeled' && !github.event.pull_request.draft) || (github.event.action == 'labeled' && (github.event.label.name == 'ci-run' || github.event.label.name == 'ci-timing'))) && 'web' || 'web-deferred'
```

It is **not** the resolved string `web-deferred`. GitHub job timestamps record started_at10:54:50Z but completed_at10:54:49Z; those reversed timestamps cannot establish an elapsed duration or billing saving.

The [admitted investigation run 37299640175](https://github.com/Tien-Lam/ChronoShift/actions/runs/37299640175) has job **111729038111**, head matching the same PR source, actual name **web**. Initial PR checks showed it in progress; the subsequent jobs API showed completed/cancelled. Set-up succeeded, container initialization was cancelled, and checkout/install/all required gate steps were skipped. Root identified this as its explicit ci-run admission/cancellation; this reviewer did not initiate it. It establishes actual executed-name resolution, not successful full verification, sparse transport or cost acceptance.

## Safety and minimal documentation correction

The deferred run fails unchanged reuse requirements independently at several boundaries: run conclusion is not success; literal expression name is not exact `web`; the job is skipped with no required successful steps; no artifact exists. Even hypothetical workflow-success presentation would not pass the job-name/step boundary. The admitted `web` job is cancelled with skipped required steps and likewise supplies no trusted artifact evidence. No verifier/workflow safety blocker was found.

The original review's table described intended evaluation, but must not be taken as hosted check presentation. Current root-owned testing-doc correction blob `5deb831820898a586c69bc48a313f9677c03ddbc` correctly records literal skipped-check presentation. Its sentence “The job name expression evaluates to web-deferred for drafts” should be narrowly revised to:

> For deferred events, the intended job name is `web-deferred`; GitHub currently displays the unevaluated expression on skipped checks. Its identity stays distinct from the executed `web` check and provides no verification evidence.

“For drafts” would also include explicitly admitted ci-run/ci-timing drafts, which resolve to `web`; “intended” distinguishes hypothetical expression evaluation from the observed skipped job. Documentation labels remain canonical with the separately recorded case-insensitive equality correction. This reviewer changed no product/source documentation.

**Implementation verdict:** existing workflow/verifier approval stands; observed hosted naming is safe. Apply the bounded documentation precision fix before the final gate. **Hosted readiness/CI-goal verdict:** open. Full ready-source gate, complete attempts, sparse-checkout transfer/configuration, main artifact reuse/fallback/publication and >=20% usage acceptance remain unverified by these skipped/cancelled observations.
