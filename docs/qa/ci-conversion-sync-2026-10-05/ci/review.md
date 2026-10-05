# Independent complete CI evidence reconciliation

**Gate verdict:** Web37281970385 passed the complete verification workload on exact PR38 head **299e3864f01d4e87a1770594628b84cf5a3972c8**, attempt1. This verifies the exercised implementation conditions; it supplies no hosted performance improvement. Merge/publication decisions and the two independent source/lifecycle reviews remain root-owned.

**Original-report verdict:** TIE-375 remains unresolved. This Web job is **455 runner seconds/eight per-job rounded-minute proxy units**, slower than the prior complete Web and manual controls. Its Web job alone exceeds the original complete baseline307 seconds/eight minutes. No candidate main publication has occurred in this evidence, so there is no actual completed candidate pair yet; any additional publication cannot make that pair faster than307 seconds or achieve the required rounded-minute reduction. The previous accepted normal pair remains442 seconds/eight minutes. Local ABBA observation-delay gains are separate evidence, not a replacement acceptance result.

## Observation and raw provenance

Read-only observation began **2026-10-05 08:11:22Z**. Initial `gh run view` observed exact head/status; `gh run watch --interval 60 --exit-status` waited without repeated independent unchanged API polling. Root reported completion at08:17:54Z; final raw API/log collection completed around **08:19:24Z** and independent reconciliation ran **08:19:32.395Z**, with resource/source comparison through **08:20:28Z**. The analyzer was rerun offline solely to include the dotted fixed CPU-counter key; no workflow or runtime was rerun.

All GitHub operations used mise-managed `gh` in repository `Tien-Lam/ChronoShift`. `run.json`, `jobs.json`, `artifacts.json` and `run.log` retain direct API/CLI responses from:

```sh
mise exec -- gh api repos/Tien-Lam/ChronoShift/actions/runs/37281970385
mise exec -- gh api 'repos/Tien-Lam/ChronoShift/actions/runs/37281970385/jobs?per_page=100'
mise exec -- gh api 'repos/Tien-Lam/ChronoShift/actions/runs/37281970385/artifacts?per_page=100'
mise exec -- gh run view 37281970385 --log
mise exec -- bun docs/qa/ci-conversion-sync-2026-10-05/ci/analyze.ts
```

No source change, dispatch, rerun, merge, push, deployment or ticket mutation occurred in this follow-up. The raw run reports pull_request on `codex/ci-conversion-sync`, created08:10:17Z/updated08:17:55Z, successful Web job111671888600 running **08:10:19–08:17:54Z**. API head is the exact reviewed PR head. Raw checkout reports tested merge **b69ad947eeb96f20c9c77ac93699c95364219391**; a read-only `gh api .../git/commits/b69ad947...` capture and local head-tree comparison at08:22:43.014Z independently verify both full trees are **e0363793275e991d25b47bf7b6307e95187aa2bb** (`tested-source-identity.json`). This reconciliation does not independently validate extracted artifact/public bytes; that remains the subsequent publication audit.

## Complete workload and diagnostic evidence

Independent parsing finds **258 distinct ordinals and semantic project/file/title cases**, **249 first-attempt passes/nine skips**, **zero retry rows and zero failed-attempt rows**. Case/title/project inventory and all nine skip identities exactly match saved PR37 complete-gate logs despite shifted source line numbers:

| Project | First passes | Existing capability skips |
| --- | ---: | ---: |
| foldable | 3 | 0 |
| chromium | 51 | 0 |
| firefox | 48 | 3 |
| webkit | 48 | 3 |
| android-emulation | 51 | 0 |
| iphone-emulation | 48 | 3 |

Raw unit output states **116 pass/0 fail**,116 tests across6 files. The independent repository-subpath runner reports **one pass (2.1s)**. Every named required gate is successful: checkout; checked-in corpus snapshot; mise setup; frozen install; pinned image/version/executable guard; formatting; units and production build (including typecheck); standalone corpus regeneration/diff; all browser cases; after-resource capture; subpath build/browser gate; verified Pages upload. PR configure-pages is skipped by design; no deployment runs in this workflow.

Every recorded `CHRONOSHIFT_CI_TIMING` flag is **0**. The optional timing upload is skipped, so no structured successful-attempt timing artifact is available. Unexpected-attempt diagnostics upload is also skipped, and the artifact API contains no failure bundle. Zero failed/retry rows plus the known unchanged marker/upload logic corroborate that no unexpected-attempt diagnostics were retained. This is not a direct read of a nonexistent green-run marker file; original attempt-level evidence here is the complete list log. A future failure/retry must still retain its bundle under the unchanged policy.

The sole artifact is **github-pages**, ID **11332463388**, **374,686 bytes**, digest **sha256:236a7950abb12001b7a0d42b868dc46327c0569567b5c53fd9a32f3aad208b6f**, unexpired, linked to this run/head/repository. Created08:17:52Z, API expiry2026-10-06 08:17:51Z differs by one second from nominal24h. Configured24h projected storage is **8,992,464 byte-hours**. This is nominal projection, not accrued account billing or complete-pair storage.

## Timing and environment comparison

| Metric | PR38 Web37281970385 | PR37 Web37274709527 | Manual verify37276826095 |
| --- | ---: | ---: | ---: |
| Whole API job span seconds | 455 | 400 | 350 |
| Per-job round-up proxy minutes | 8 | 7 | 6 |
| Job-start→first-step interval seconds | 37 | 1 | 1 |
| Container initialization seconds | 27 | 27 | 34 |
| Browser step seconds | 368 | 347 | 291 |
| Subpath step seconds | 4 | 4 | 4 |

PR38 is55 seconds/13.75% slower than PR37 and105 seconds/30% slower than manual verification. The first-step interval explains36 seconds of the55-second whole-job difference against PR37. Excluding only that interval gives418 versus399 seconds, still19 seconds higher; it does not isolate a helper effect or redefine the acceptance proxy. Browser execution itself is21 seconds higher than PR37 and77 higher than manual. Required acceptance retains the full API spans and per-job rounding. The manual comparison is its verification job alone, not its15-second preparation/10-second deployment or a substitute successful pair.

All three report Linux x64/kernel6.17.0-1022-azure, four visible/available CPUs, roughly16GiB memory, timingflag0, and unlimited `cpu.max`/`memory.max`; however CPU models differ:

| Resource observation | PR38 | PR37 | Manual verify |
| --- | --- | --- | --- |
| Visible CPU model | AMD EPYC7763 | AMD EPYC9V74 | Intel Xeon6973P-C |
| Before→after resource bracket seconds | 367.336 | 347.510 | 290.707 |
| Cgroup usage delta processor-seconds | 1288.368651 | 1202.441913 | 981.640613 |
| After cumulative cgroup memory.peak bytes | 6,650,695,680 | 6,822,293,504 | 7,147,012,096 |
| New throttle/OOM events | 0 | 0 | 0 |

Raw resource records/counter calculations and runner-image lines are in `resource-comparison.json`. The current runner image is ubuntu-24.04/version20260927.320.1. The pinned Playwright1.63.0 image and Bun1.4.0 runtime/dependency guard remain unchanged. CPU usage brackets include process/protocol overhead and memory.peak is cumulative cgroup peak; these are not isolated script/layout or browser-only allocations. Similar visible core counts do not establish identical hardware throughput or an absence of host contention.

`source-conditions.json` records exact equal identities against PR37 for web tree **78dbdbf65b5328416f0b169cc52d3ed9541d02f9**, both workflows, both Playwright configs, lock/package, both independent fixture files, attempt/timing reporters, resource script and trusted artifact verifier. Only five e2e files differ outside documentation: the bounded helper and its app/controls/privacy/responsive callers. Coverage and assertions remain accounted for, but source and runner conditions differ; neither the whole-job increase nor local helper gain can be attributed causally from these single hosted samples.

This gate is sufficient evidence that the complete declared verification executed successfully at the stated head. It is not >=20% quota evidence, an accepted cheaper/faster pair, physical-device performance, human acceptance, or a diagnosis/closure of historical TIE-370 conditions. No additional Actions rerun is proposed by this reviewer.
