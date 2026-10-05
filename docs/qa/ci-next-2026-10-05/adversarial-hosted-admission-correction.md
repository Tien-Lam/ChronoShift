# Additive adversarial hosted-admission correction

Independent read-only observation: **2026-10-05 10:55:41–10:55:58 UTC**, actual clock calls. Environment: Darwin ARM64, mise-managed gh. Only read-only GitHub operations through `mise exec -- gh` and local source/report inspection occurred; I did not label, cancel, rerun, dispatch, merge, edit GitHub/source, browse, build or run tests. Root independently requested and canceled the bounded investigation.

PR41 head/checkout is `af28e0739c7c7d8de2dfa77c508ee2e08be1c539`, observed draft=true and label `ci-run`. Inspected workflow blobs remain Web `fb5b017a40bfb2c189aae4563a05988b29b3be7a`, Pages `d92bca178f4596f578bb4e915924ba3d7fb83082`; docs at observation were testing `2d63ec5f4400d02fae4106fa200c68536e24697e`, publishing `5d92fd96c10b4ef1b80f6b13de43eb308530dbde`; publishing assertions `b5a3604870e857ac90eabfca3ffbddd69b8716ff`. Trust owner remains `227e097ec2c6103563f1d069fb433b3c8f3199c9`. The original scheduling review remains unchanged at `f7c7a58b23ebaa6cfdd082abc757d0cb9eb1c021`.

## Original hosted observations

[`gh pr checks` and REST run/jobs/check-run responses](https://github.com/Tien-Lam/ChronoShift/actions/runs/37299570754) agree that opened draft run **37299570754** is completed/skipped, run attempt 1, head `af28e073...`. Job/check **111728818997** is skipped with no runner and `steps: []`. Its actual name is this unevaluated expression text, rather than the resolved display string `web-deferred`:

```text
(github.event_name != 'pull_request' || (github.event.action != 'labeled' && !github.event.pull_request.draft) || (github.event.action == 'labeled' && (github.event.label.name == 'ci-run' || github.event.label.name == 'ci-timing'))) && 'web' || 'web-deferred'
```

The artifacts endpoint returns `total_count: 0`, `artifacts: []`. Check-suite **101025599939** has one check run with exactly the same expression name and skipped conclusion. This record is distinct from the literal accepted job name `web`; there is no hosted skipped literal-`web` record in this observation.

API metadata reports run created/started 10:54:49Z, updated 10:54:50Z. The skipped job/check reports started_at 10:54:50Z and completed_at 10:54:49Z. Those timestamps are preserved as supplied; their reversed order cannot establish negative duration, allocation time or billing. The absence of a runner/steps is the relevant admission evidence.

[`ci-run` requested run **37299640175**](https://github.com/Tien-Lam/ChronoShift/actions/runs/37299640175) uses the same head and pull_request workflow, attempt 1. PR checks and its job endpoint show resolved literal job name **`web`**, job **111729038111**. Initial API observation was in progress; by the final run read it was completed/cancelled, created/started 10:55:28Z and updated 10:55:57Z. Its retained step snapshot shows setup succeeded, container initialization cancelled at 10:55:55Z, and checkout, install, format, unit/build, corpus, browser, subpath and upload steps skipped. This is intentional bounded cancellation, not a failed browser attempt or a completed gate. The job endpoint briefly retained in-progress/null top-level fields while the run endpoint had completed/cancelled; the successful full-job name is already directly observed, but that snapshot mismatch must not be turned into a successful conclusion.

Commands: `gh pr checks 41 --json name,state,workflow,link,bucket,event`; `gh pr view 41 --json headRefOid,isDraft,title,url,labels,statusCheckRollup`; read-only `gh api` for both run objects, both jobs endpoints, opened-run artifacts and opened-run check-suite/check-runs; local `git rev-parse`, `git hash-object`, diff/read of docs and trust owner. One unquoted jobs endpoint containing `?per_page=100` was rejected by zsh glob expansion before any request; the correctly quoted read then succeeded. No information was inferred from that local command failure.

## Correction and minimal documentation wording

The original source report described the intended expression branch as a `web-deferred` check name. **That exact resolved skipped-job display name is not what this hosted execution produced.** Preserve the original report and use this correction for hosted claims. The separation from accepted literal `web` is confirmed for the observed draft-open case and full requested case.

Replace only the exact-name promise with:

> Draft PRs defer hosted verification under a skipped check distinct from the full `web` check.

Keep the separate statement that a deferred check provides no tested artifact or accepted full `web` verification. Optional nearby explanation can say GitHub may display an unevaluated name expression for a job skipped before evaluation; avoid requiring users to interpret the expression text as verification. This recommendation changes wording, not eligibility, trust or coverage. I did not edit those files.

## Separate verdicts

**Implementation/source:** earlier bounded scheduling approval stands. A documentation/evidence correction is required before claiming that hosted skipped checks have the literal resolved name `web-deferred`. The unchanged verifier rejects the observed expression-named skipped job by exact job-name, required-step, conclusion and artifact conditions. Requested literal `web` alone is also insufficient: this canceled investigation has no successful required gate.

**Hosted scope:** opened draft deferral, lack of runner/steps/artifact, and newly requested literal `web` admission are independently observed. Complete ready/source gate, sparse checkout transport, artifact reuse and full fallback remain unverified by these two runs. Cancellation occurred before checkout, so this investigation supplies no sparse-transfer or browser compatibility evidence.

**Concurrency:** source still has full-job concurrency only and no new workflow-wide cancellation. These two runs do not observe an unrelated/deferred event while a full job remains active: the first had already skipped, and the second was intentionally canceled by root. Therefore active-job preservation remains a hosted evidence gap. Do not claim that the manual cancellation was caused by the skipped run or that these observations proved the competing concurrency case safe.

**CI-goal resolution:** still unresolved. No complete candidate pair or ≥20% quota/storage saving is established. The bounded investigation's setup allocation is real overhead and should remain in the cost ledger; it is not a free validation or successful full gate. Original render/sparse/scheduling reports and unexecuted browser journeys remain unchanged.
