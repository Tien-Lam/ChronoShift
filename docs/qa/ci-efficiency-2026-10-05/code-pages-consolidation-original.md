# Independent code review: Pages job consolidation proposal

Scope: read-only design review requested by root; no workflow/source edits, builds, browser runs, CI dispatches or publication. Context reused from the earlier independent code reviews because the configured agent slots are occupied. No peer review was read for this scope. The browser prototype and its test preparation remain outside this review.

Observed clocks: review began at 2026-10-05 06:21:01 UTC; intermediate clocks 06:22:03, 06:23:43 and 06:24:20; environment evidence saved before the observed 06:24:33 clock. Report-writing end was not instrumented. These are observation times, not test durations.

Local HEAD during review: `77fbf61b33d0b2752a3f90b20a261f30f0842b0f`. Shared worktree also contained unrelated dirty runtime/test/config/docs changes. Root changed Pages YAML during this review: the initially read workflow had separate prepare/deploy on reuse; the final read contains the proposed consolidation. No frozen runtime identity is relevant to this workflow-only proposal. Final observed hashes:

| File | SHA-256 |
| --- | --- |
| `.github/workflows/pages.yml` | `b74aebc675eee7ce55077894687694a539ac9f8e2dce13f907afde155fe23385` |
| `.github/workflows/web.yml` | `bafebf8832d57b9064427c4d26579849b08760ebb142264c1774494bbac4db7c` |
| `scripts/reuse-pages-artifact.ts` | `a2ab1a1b5ba2e240dab974b7a725a096a63adf01e1255e75fe70ea8716ac5af1` |

## Feasible design

Keep the native Ubuntu prepare job and put its conditional configure/upload/deploy steps together. The reused path then runs one charged publishing job. Keep the existing reusable Web workflow as the complete fallback and keep a separate deploy job for that fallback. This avoids copying the verification gate, running browser tests with deployment permissions, or paying a pinned browser-container pull on successful reuse.

The concrete control flow below preserves the existing triggers/path exclusions, pins, timeouts and steps. It is a design excerpt, not a standalone workflow:

```yaml
permissions:
  contents: read
concurrency:
  group: pages-publication
  cancel-in-progress: false
jobs:
  prepare:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    timeout-minutes: 5
    permissions:
      contents: read
      actions: read
      pages: write
      id-token: write
    concurrency:
      group: github-pages
      cancel-in-progress: false
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    outputs:
      reused: ${{ steps.reuse.outputs.reused }}
    # Existing pinned checkout/mise; install_args: bun gh.
    # Existing reuse step runs only on push and writes reused=true/false.
    # Existing pinned configure/upload run only on reused == 'true'.
    # Existing upload retains the verified dist for 14 days.
    steps:
      # ...existing steps unchanged...
      - id: deployment
        if: steps.reuse.outputs.reused == 'true'
        uses: actions/deploy-pages@d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e
  verify:
    needs: prepare
    if: needs.prepare.result == 'success' && needs.prepare.outputs.reused != 'true'
    permissions:
      contents: read
      pages: read
    uses: ./.github/workflows/web.yml
    with:
      publish-pages: true
  deploy:
    needs: [prepare, verify]
    if: always() && needs.prepare.result == 'success' && needs.prepare.outputs.reused != 'true' && needs.verify.result == 'success'
    # Existing pinned deploy-pages job, github-pages environment,
    # pages:write/id-token:write and github-pages concurrency unchanged.
```

Keep the exact string comparison. A missing/false output means fallback only after successful preparation. A failed upload or reused deployment makes prepare fail and must not start another publication. Manual dispatch skips reuse, so its empty output deliberately enters the full fallback. Neither branch should use continue-on-error. A failed or cancelled fallback gate cannot deploy; its existing failed-attempt retention remains intact.

The workflow-level lock must continue covering preparation, verification and deployment. The two job-level deployment locks may use the same `github-pages` group because they run sequentially and exclusively; neither can hold the lock while waiting for the other. Preserve main-only workflow/job gating and the actual environment's main branch policy. Queued Actions runs are not a guaranteed chronological FIFO; the existing serialization specifically prevents an already-running slower fallback from being overtaken by a concurrently publishing newer run. No new ordering guarantee is claimed.

## Trust, permissions and coverage

The consolidated prepare job needs pages write and OIDC write, unlike today's read-only prepare job. It executes only checked-out trusted main code and pinned actions. Do not install or execute extracted artifact code there: the verifier only treats downloaded files as static data. Keep root contents read, explicit actions read for reuse, and the fallback Web job's contents/pages read permissions. This is a deliberate permission-boundary change requiring review, rather than an assumption that job count is security-neutral.

Leave the verifier unchanged: same repository/workflow/path, completed successful PR run, successful Web job and every named required step; exact PR/main/local checkout and release source tree match; complete jobs/artifacts result sets; nonexpired artifact and bounded downloaded/archive sizes; SHA-256 download digest; exactly one artifact.tar member; safe paths and no archive links; release base `/ChronoShift/`. Missing/invalid evidence returns false and invokes complete verification. Required step names must continue matching `requiredSteps` in the verifier.

Leave the fallback's digest-pinned Playwright 1.63 official image, executable/dependency guard, user/ipc/init settings, frozen install, format, 116 unit cases, production root build, standalone corpus check, full 258 configured browser scenarios, subpath build/test, upload, and retry/failure retention unchanged. The separate root/subpath builds establish different bases and cannot be combined by this proposal. No browser coverage, motion, fixture expectation or artifact retention reduction is part of it. mise continues providing pinned Bun 1.4.0 and gh 2.100.0; pinned action runtimes remain action-owned.

## Environment record qualification

Read-only `mise exec -- gh api` evidence is saved in [pages-environment.json](code/pages-environment.json) and [pages-environment-branches.json](code/pages-environment-branches.json). The current github-pages environment has branch-policy protection and its only allowed branch is main; no custom deployment protection rule was returned.

A standard environment on prepare can create an environment deployment record even when reuse is false/manual and the actual deploy step is skipped. Consequently prepare/environment-job success must never be used as proof of publication. The audit must require a successful deploy-pages step and actual Pages deployment/inventory/source evidence; fallback publication requires successful verify plus the final deploy step. Preserve the existing environment configuration for the first candidate and explicitly qualify such no-op metadata.

[GitHub's workflow syntax](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#jobsjob_idenvironment) documents `environment.deployment: false`, which avoids automatic deployment objects and is incompatible with custom deployment protection rules. It is an optional follow-up requiring hosted compatibility evidence, not a proven drop-in fix here. At the exact pinned deploy-pages revision, source read through gh showed that index.js obtains OIDC and api-client.js creates/polls a Pages deployment from the workflow artifact ID/build SHA/OIDC; it does not consume an automatic environment deployment ID. That supports investigating deployment:false but does not prove GitHub's hosted OIDC/Pages enforcement or audit behavior with it. Do not silently remove environment protections or add deployment API writes to tidy the record.

## Bounded validation plan

1. Review the exact committed workflow diff/pins and use an available mise-managed YAML/Actions validator. Existing publishing unit tests cover required-step/source/archive predicates; add meaningful full-path mock coverage only for uncovered verifier behavior, rather than implementation-mirroring tests.
2. Check the branch truth table: trusted push reuse true gives one deploy step/no verify/no final deploy; no artifact, expired artifact, tree/digest mismatch, rejected archive and verifier API failure give full fallback; manual dispatch always gives fallback; non-main skips all; upload/first deploy failure, preparation cancellation and any fallback check failure give no second deploy. Preserve original failing outcomes and diagnostic artifacts.
3. Run the existing complete trusted PR gate unchanged. On its main publication, save exact run/jobs/step results, reused PR source/run/digest/tree, uploaded archive/inventory and hosted release/worker/base hashes. Prove same-run upload/deploy works with the pinned action and that only the first deployment step ran. No audit may accept the no-op environment metadata alone.
4. Demonstrate a controlled full fallback, preferably manual main dispatch, and preserve all required step results. Demonstrate invalid reuse falling back through a bounded verifier harness or controlled fixture; do not damage production artifacts. In both branches, a failed gate/upload/deploy must be visibly failed without another publish attempt.
5. Inspect overlapping main runs: the entire older in-flight fallback remains serialized with later reuse, both publishing jobs retain the deployment lock, active deploys are not cancelled, and current ref/environment rules remain enforced. Record queue cancellations separately; they are not successful gates.
6. Compare a complete successful PR plus main publication pair against the saved baseline using per-job start/end timestamps, sum of separately rounded minutes, raw runner seconds and projected artifact byte-hours. Measure at least the main-only consolidation before crediting it alongside runtime optimization; retain instrumented and final uninstrumented identities distinctly.

## Separate verdicts

**Implementation/design:** no blocker to a bounded candidate with the described exact trust checks, fallback and permission boundaries. The currently observed dirty Pages control flow matches the proposal. This is source/design review only; committed-candidate, hosted reuse/fallback and publication-audit validation remain required. Standard environment no-op records need the explicit qualification above; deployment:false compatibility is unproven.

**TIE-375 report/goal:** unresolved. The original pair is 8 rounded minutes; removing one sub-minute job alone would give 7 (12.5% lower), below the required 20%. A qualifying pair must be at most 6 rounded minutes, have raw speed improvement against 307 seconds, and satisfy storage reduction plus unchanged coverage/trust/publication evidence. The proposed reuse job's combined duration has not been measured; if it crosses 60 seconds it may save no rounded minute. Existing 17-second preparation plus 8-second deployment are measured separate-job observations, not a proven 25-second consolidated result. Fallback still uses three jobs and does not obtain this saving. No adoption or acceptance claim is made.
