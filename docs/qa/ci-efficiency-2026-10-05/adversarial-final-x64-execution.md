# Independent final x64 execution review

Reviewer: `/root/motion_code_review`, acting as the independent adversarial reviewer. Execution evidence was read independently, before any peer execution verdict. This reviewer reused the earlier experimental/source review context; this is a separate execution supplement, not a clean-context replacement or a rewrite of those original reports.

## Identity, timing and method

Reviewed head: `b288920d072d6ebb6ca56d1ea83f7c95ea7bed02`. Base: `7059da3125ada61123f91d1267bbee9a6f4792ef`. Exact reviewed tree: `c08c0f507faf6f82fac5ce790eb2e1f89fa59cdf`. Web run [37274709527](https://github.com/Tien-Lam/ChronoShift/actions/runs/37274709527), attempt 1, completed successfully on the pull-request event using `.github/workflows/web.yml`. Repository and head-repository IDs both equal `1206473449`; workflow ID is `373926111`.

The source review observed the pending run from 06:54 UTC. Completed API/log reads occurred on 2026-10-05 at approximately 07:00:19–07:00:24 UTC; exact command start/end clocks, output hashes and byte counts are retained beside each raw response. The complete log read ran from `07:00:20.458Z` to `07:00:23.802Z`. Independent tested-merge lookup ran from `07:00:52.605Z` to `07:00:54.027Z`. Final status comparison was generated at `07:00:54.089Z`. Report preparation resumed at the actual clock `07:02:19 UTC` after context compaction.

Read-only commands used the mise-managed `gh 2.100.0` CLI for run, jobs, artifacts, full log and commit API reads; mise-managed Bun 1.4.0 executed the independent collector and row reconciliation. No build, runtime modification, browser rerun, CI dispatch/rerun, deployment or merge was performed. Collector: [adversarial/final-x64-execution.ts](adversarial/final-x64-execution.ts). Raw evidence: [run](adversarial/final-x64-execution/run.json), [jobs](adversarial/final-x64-execution/jobs.json), [artifacts](adversarial/final-x64-execution/artifacts.json), [log](adversarial/final-x64-execution/run.log), [reconciliation](adversarial/final-x64-execution/review.json), [attempt rows](adversarial/final-x64-execution/attempts.json), [tested source](adversarial/final-x64-execution/source.json), and [status comparison](adversarial/final-x64-execution/status-comparison.json). The full log is 147,012 bytes, SHA-256 `28f5681061b1a039f65da8f5628cdff3c9aff7dc9d30ad02b76fe5bfc9fa8c5f`.

## Gate and coverage reconciliation

The only Web job, `111649093902`, ran on `ubuntu-latest` from `06:53:22Z` to `07:00:02Z`: 400 seconds. Frozen dependency installation and the pinned browser image/dependency executable guard succeeded. All six verifier-required gate steps succeeded: formatting; unit tests and production build; standalone conversion corpus audit; full browser suite; repository-subpath deployment; and verified Pages build upload. The raw log reports 116 unit passes, zero failures, the 353-input corpus audit with no checked-in difference, and one successful subpath test.

All 258 configured browser cases are accounted for: 249 first-attempt passes, nine skips, zero failures and zero retries. Independent `(project, file, title)` identity comparison against the retained four-worker control found no missing, added, duplicate or changed-status cases. Line numbers were excluded because the reviewed pointer-reopen preconditions shifted source locations. The complete raw log contains no retry marker or flaky summary. Failure-diagnostic upload was skipped and the complete artifact inventory contains no failure bundle. These combined observations support the zero-retry conclusion; green run status alone would not.

| Profile | Passed | Skipped |
| --- | ---: | ---: |
| foldable | 3 | 0 |
| chromium | 51 | 0 |
| firefox | 48 | 3 |
| webkit | 48 | 3 |
| android-emulation | 51 | 0 |
| iphone-emulation | 48 | 3 |

The nine skips are the same three `uncontrolled.spec.ts` cases on Firefox, WebKit and iPhone emulation: activated-worker recovery after hard refresh, explicit update after a timed-out readiness probe, and protection against an older active worker marking an uncontrolled tab ready. Those three cases passed on both Chromium profiles. All three foldable CDP cases passed. No ARM-specific exclusions or weakened assertions survive this final x64 candidate. The prior source review established that the runtime, lockfile, fixtures, attempt reporter, subpath configuration and reuse verifier remain identical to the base.

Timing instrumentation was disabled (`CHRONOSHIFT_CI_TIMING=0`); its upload step was skipped. Therefore there is no dedicated structured timing artifact for this uninstrumented run. The complete log provides the independent attempt enumeration. Configure Pages was correctly skipped on this PR gate.

## Tested source and retained artifact

The checkout log identifies tested merge `997f3f2367bef1c877c207a4d89872992382d006`. Independent GitHub commit lookup confirms its tree is `c08c0f507faf6f82fac5ce790eb2e1f89fa59cdf`, exactly equal to the reviewed head tree. The unchanged Web subtree is `78dbdbf65b5328416f0b169cc52d3ed9541d02f9`.

The complete artifact API inventory contains only `github-pages`, ID `11330240757`, 374,697 bytes, unexpired. API digest: `sha256:87d46fb4d220e5e7951a72b31779d4fb197012a01cfa6915d5646cef75141181`. Creation: `2026-10-05T06:59:59Z`; expiry: `2026-10-06T06:59:59Z`. This execution review did not download or inspect that archive. Digest, safe archive members, extracted inventories, matching main tree, release identity and exact public files still require the separate publication audit.

## Resource and efficiency limits

The actual before/after observations report Linux x64, kernel `6.17.0-1022-azure`, four available/logical CPUs, AMD EPYC 9V74, and 16,766,414,848 bytes of total memory. `cpu.max` and `memory.max` are unlimited within the observed cgroup namespace. The lifetime memory peak rose from 1,518,452,736 to 6,822,293,504 bytes; OOM counters remained zero. These are bounded namespace observations and lifetime peaks, not isolated browser-memory measurements or proof of a particular CPU cause.

Browser execution occupied 347 seconds (`06:54:07Z`–`06:59:54Z`); container initialization occupied 27 seconds. This final Web job alone takes 400 seconds, or seven rounded minutes. Against the retained 307-second/eight-rounded-minute complete baseline pair, a 20% rounded-minute reduction requires a complete pair of at most six minutes. This Web sample alone already exceeds that limit and the baseline pair's raw duration. Any positive Pages job increases the complete pair further. TIE-375's target is not achieved. Actual matching publication-pair timing and retained artifact byte-hours remain pending; the cache cleanup snapshot is a separate metric, reviewed in [adversarial-cache-claim.md](adversarial-cache-claim.md).

## Separate verdicts

**Bounded implementation adoption:** no execution blocker found for incremental adoption of the final x64 CI-only candidate. The exact reviewed tree passed the complete required gate without retries, coverage loss or new skips. This supplements the separately saved source verdict.

**Report/goal resolution:** TIE-375 remains unresolved. This run does not meet the paired quota target; neither a green gate nor the distinct 36.64% cache-occupancy snapshot establishes that target or monthly billing savings. Actual slim trusted-artifact publication, manual full-gate fallback, archive/public identity and complete-pair evidence remain required for their respective delivery claims. Physical-device/human acceptance and the unknown original TIE-370 Chromium failure remain outside this bounded execution approval.
