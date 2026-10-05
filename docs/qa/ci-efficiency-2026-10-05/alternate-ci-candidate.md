# Alternate CI candidate: opt-in profiling and measured publication topology

Read-only analysis began 2026-10-05T06:20:55Z on
`77fbf61b33d0b2752a3f90b20a261f30f0842b0f`, Darwin arm64. Source was read from
the shared working tree, where root has already restored four CI workers and is
measuring the separate virtualization candidate. This report does not approve that
candidate, edit a workflow, run a build/test/CI job, or change a frozen server.

## Measured facts and target arithmetic

`ci-lifecycle-2026-10-05/ci-efficiency-current.json` records the complete successful
pair: Web 301s, Pages prepare 17s and deploy 8s, totaling 326s and eight rounded
minutes (6 + 1 + 1). Historical reference is 307s/eight minutes. Current storage
proxy reduction is 63.25%; raw and quota requirements remain unresolved.

The optional reporter's Linux control is a different run/source: Web 356s, browser
291s, container initialization 37s, timing upload 2s. Its dedicated timing artifact
is 46,133 archive bytes retained 24 hours, approximately 1,107,192 byte-hours.
The earlier uninstrumented browser step was 246s. The 45s difference is **not** a
measurement of reporter overhead: these are separate runs and revisions, with no
same-source on/off control. Timing also contains actionability, event waiting and
browser contention, not CPU measurements. Six-worker Web took 419s with a retry
and is rejected; the small local scalar-batching sample did not establish a gain.

| Publication topology | Rounded target against eight | Necessary Web boundary |
| --- | --- | --- |
| Existing prepare + deploy, each under 60s | At most six total minutes | Web at most 240s (four minutes) |
| One successful-reuse publish job under 60s | At most six total minutes | Web at most 300s (five minutes) |

Eight to six is a 25% reduction; eight to seven is only 12.5%. Combining publication
jobs alone leaves the observed 301s Web at six minutes, therefore seven total and
insufficient. A one-second rounding win is fragile. For illustrative arithmetic,
if the combined publication job took 20s, raw speed against the 307s reference
would require Web below 287s; the stricter 20%-raw threshold would require Web at
most 225.6s. The assumed 20s is not measured. The metric script separately reports
raw speed, quota/storage acceptance, and the stricter all-metric 20% result.

## Concrete candidate A: opt-in operation timing

`playwright.config.ts` already enables the timing reporter only for the literal
environment value `1`. `.github/workflows/web.yml` defeats that opt-in by assigning
`1` unconditionally to the browser step. Leave the public reporter and config
registration intact; change only how the workflow selects profiling.

Recommended selection: reusable-workflow boolean `ci-timing`, default false, plus a
`ci-timing` label on the PR for its normal opened/synchronize/reopened events. Root
can add optional `workflow_dispatch` with the same boolean for diagnostic runs,
without making manual runs trusted PR artifacts or enabling publication. No label
event trigger is needed, so labeling does not launch another full gate. Apply the
label before the next ordinary PR event; do not assume an old rerun payload has
new labels.

Illustrative additions to `web.yml` (proposal, not applied YAML):

```yaml
on:
  workflow_call:
    inputs:
      ci-timing:
        description: Record bounded browser operation timing for investigation
        type: boolean
        default: false
# Job env, alongside the existing env values:
CHRONOSHIFT_CI_TIMING: ${{ (inputs.ci-timing || (github.event_name == 'pull_request' && contains(github.event.pull_request.labels.*.name, 'ci-timing'))) && '1' || '0' }}
# Remove the unconditional env override from the browser step.
# Timing upload if:
if: ${{ !cancelled() && env.CHRONOSHIFT_CI_TIMING == '1' && hashFiles('test-results/ci-timing.json') != '' }}
```

The [official workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#onworkflow_callinputs)
supports typed reusable-workflow inputs. The final YAML must be reviewed and its
default/opt-in expressions checked for PR and reusable-call event contexts.

Preserve list and HTML reporters, attempt reporter, one CI retry, retry trace,
failure screenshots, the `attempt-failures.json` upload marker and the entire
existing three-day failed-attempt bundle. A recovered first-attempt failure still
uploads diagnostics; timing absence must not affect that condition. Profiling
failures may retain timing in that bundle for three days as currently documented.
Do not enable timing automatically only after failure and claim it reconstructs
the original attempt; it cannot. Opt-in runs retain the existing one-day timing
artifact and privacy sanitizer.

Keep all six verification/upload step names used by `trustedRun`, the image guard,
same-repository successful PR/job checks, exact Git tree, digest, safe archive
extraction, release source/base checks and `github-pages` artifact selection. No
timing JSON is required by artifact reuse. Routine timing removal therefore need
not weaken publication trust or failure evidence. Measured direct upload overhead
is 2s in the control; unmeasured reporter saving must be established with the same
frozen source, four workers, environment, 258 cases and complete attempt outcomes.

## Concrete candidate B: publish reused artifacts in the reuse job

This is the strongest quota-oriented structural candidate, not an implementation
approval. On a main push, one `prepare`/publish job could perform the existing exact
reuse verification, configure Pages, upload the same verified dist and call the
pinned deployment action **only when reuse succeeds**. Emit `reused` for the same
fallback: if reuse is unavailable, run the complete reusable Web verification and
then the separate fallback deployment job. A reused publication skips that latter
job. Manual dispatch continues through full fallback. The normal successful pair
still contains both Web PR and Pages push events, so the ordinary metric mode
applies; this is not a PR preview publication or reduced coverage experiment.

Keep main-only checks, workflow-wide `pages-publication` serialization without
cancellation, the deployment environment, and deployment concurrency covering both
successful-reuse and fallback branches. Failed reuse validation never directly
deploys. No mutation or retry error can turn a failed required gate into success.
Do not execute code from extracted artifacts; retain the exact verifier intact.

Material tradeoff: the currently read-only reuse job would need the deployment
job's `pages:write` and `id-token:write` permissions. GitHub permissions are scoped
to workflow/job, not individual steps, per the
[official token guidance](https://docs.github.com/en/actions/tutorials/authenticate-with-github_token#modifying-the-permissions-for-the-github_token).
This extends the privileged job over checkout/tool setup/archive validation.
Maintaining the same artifact predicates does not establish identical privilege
separation. Independent security/lifecycle review must explicitly decide whether
that change is acceptable; retain separate jobs if it is not. Do not describe the
combined job as preserving every existing trust boundary.

Measure reused, failed/missing/corrupt/different-tree artifact and manual fallback
branches before adoption. Keep exact success conditions, stale-publication ordering
and retention proofs, including original first-attempt diagnostics. Require an
actual successful whole PR/main pair below the rounded and raw thresholds with
margin, not arithmetic based on an assumed publication duration.

## Remaining measured costs

The browser step is the primary runtime cost: 246s in the complete pair, 291s in
the instrumented control. Its passed-attempt durations sum 1,111.545 test-seconds;
expect leaf operations total 455.357s, clicks 138.018s, waits 104.855s, navigation
91.251s and page creation 81.039s. These overlap worker lifetimes and contain
waiting; none is a removable wall-time budget. The entire menu sweep's 109.847
test-seconds is only about 27.46s of average four-worker occupancy, even under
unrealistic total removal. A broad 61s reduction from the uninstrumented Web job
cannot be promised from menus alone while retaining the existing two publication
jobs. With a reviewed combined publish topology, smaller real browser improvements
could become sufficient, but mobile reliability and Linux benefit still need proof.

Container initialization 35–37s is a real secondary cost. Removing it entirely
would not reach the current two-job publication quota boundary by itself, and a
native setup replacement has dependency/download/verification costs; the historical
native installs cost 44–52s. Unit/build, format, corpus, subpath and upload steps
are small (mostly 0–3s each). Removing them risks coverage or trust for little gain.
Cache provisioning, static-only isolated origins and completion-based lifecycle
waits require separate evidence; there is no established combined saving here.

Recommendation: first implement candidate A as a routine-overhead hygiene change
with unchanged diagnostics/trust and an explicit same-source measurement. Evaluate
candidate B with independent privilege/lifecycle review if the required quota
margin remains out of reach. Keep TIE-375 open until complete measured acceptance.

Final source/status inspection clock: 2026-10-05T06:23:05Z. This agent made only
this report during the read-only investigation; existing config/prototype source
changes belong to the ongoing parent task.
