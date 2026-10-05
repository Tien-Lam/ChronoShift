# Final instrumented PR40 gate and artifact reconciliation

**Execution verdict:** Web37288000068 is green at exact final head **eef0d51ea3ca835dfe27d7e157c6bfad1610a7b3**, but it is **not first-attempt clean**. Complete258-case inventory has **248 first passes/nine existing skips/one unexpected failed original**, followed by **one passed retry**:259 total attempts. Both upgraded direct upload-artifact7 timing and failure branches executed and their archives/content reconcile. Adoption remains pending independent review of the unexpected existing WebKit failure; a green retry is not evidence that it is resolved or caused by these Action upgrades. No rerun was performed.

**Report/acceptance verdict:** TIE-375 remains unresolved. This instrumented Web job took **417 seconds/seven rounded-minute proxy units**; no paired main publication is included. Current Web alone exceeds the original complete307-second baseline. Group creation is observed, but avoided future gates/monthly savings and final privileged publication/fallback behavior are separate, unverified conditions here. Root owns those delivery steps.

## Observation, source and raw records

First clock **2026-10-05 09:08:17Z**; sole exact-head discovery completed09:08:18Z. `gh run watch --interval 60 --exit-status` waited on that run; completion was observed **09:16:14Z**. Raw run/jobs/artifact/log capture finished **09:16:37Z**. Timing download/extraction/offline source/attempt reconciliation completed by09:18:44Z. Failure download process was observed exited0 **09:19:13Z**; final extraction/digest checks completed **09:19:27Z**, then raw paths were delivered to both independent reviewers. Marker/cost reconciliation completed **09:20:54Z**. Actual job metadata, rather than observation delay, determines runtime.

All shell calls used explicit cwd `/Users/tien/Developer/ChronoShift`; GitHub operations used mise-managed `gh`. Commands:

```sh
mise exec -- gh run list --repo Tien-Lam/ChronoShift --commit eef0d51ea3ca835dfe27d7e157c6bfad1610a7b3 --limit 10 --json databaseId,name,event,headSha,status,conclusion,createdAt,updatedAt,url
mise exec -- gh run watch 37288000068 --repo Tien-Lam/ChronoShift --interval 60 --exit-status
mise exec -- gh api repos/Tien-Lam/ChronoShift/actions/runs/37288000068
mise exec -- gh api 'repos/Tien-Lam/ChronoShift/actions/runs/37288000068/jobs?per_page=100'
mise exec -- gh api 'repos/Tien-Lam/ChronoShift/actions/runs/37288000068/artifacts?per_page=100'
mise exec -- gh run view 37288000068 --repo Tien-Lam/ChronoShift --log
mise exec -- gh api repos/Tien-Lam/ChronoShift/git/commits/1078b575ceae65d575a831e2dc9c005c7863fdd0
mise exec -- gh api repos/Tien-Lam/ChronoShift/actions/artifacts/11336030084/zip
mise exec -- gh api repos/Tien-Lam/ChronoShift/actions/artifacts/11335666301/zip
mise exec -- bun docs/qa/actions-upgrade-2026-10-05/final-ci/analyze.ts
mise exec -- bun docs/qa/actions-upgrade-2026-10-05/final-ci/validate-timing.ts
```

Raw API/logs, `attempts.json`, `ci-timing.json`, timing/failure ZIPs and manifests, marker, original failure screenshot/context and passed retry trace are retained in this folder. No tests/build/browser, dispatch/rerun, source/Git/Linear mutation or deployment occurred. Only QA evidence was written. `collection-corrections.md` preserves two premature reads during the failure download and the initial24h failure-storage projection; neither was a hosted artifact defect. Final extraction waits for process completion, and failure storage uses configured72h. The original analyzer/count outputs remain preserved; its exit1 deliberately rejects a zero-retry expectation rather than hiding the unexpected attempt.

Checkout tested merge **1078b575ceae65d575a831e2dc9c005c7863fdd0**; merge API tree/local final-head tree equal expected **6d01fce2b52fcfc27f6343812c02099857856f28**. Approved source **416f94e559a8b49237c58ca44455db8a6067a043** and final head have exact workflow blobs: Web **4a2d098605337417b84965f2227d1cda67a981d7**, Pages **403f2d3a603847520efc76033141f272e3094fdb**. Runtime/e2e/tests/scripts/config/lock/Dependabot bytes equal base main0fb0b915; only both workflow files differ outside documentation. Held PR38 helper is absent.

## Workload and actionable finding

All258 semantic cases and nine skip identities equal complete PR37 inventory. Foldable3 first passes; Chromium51; Firefox48+3 skips; **WebKit47 first passes/three skips/one failed original+passed retry**; Android51; iPhone48+3 skips. Units **116 pass/0 fail across6 files**, subpath **one pass (2.1s)**. Every required named gate succeeded: upgraded checkout/mise, corpus snapshot, frozen install, image/version/executable guard, formatting, units/production build/typecheck, independent corpus regeneration/diff, complete browser suite, resource capture, subpath verification and Pages upload. Configure-pages is skipped in this PR; deploy-pages does not run.

Unexpected original: WebKit **imports.spec.ts:173**, “an unresolved target hides copyable fallback results and correction restores the source interpretation.” Target combobox commitment failed after the existing `enterZone` Tab action: `choices.ts:28` assertion, caller `imports.spec.ts:197`,10-second timeout. It retained the prior target value. Retry#1 passed7.7s. Source/action attribution and recurrence remain unresolved; independent reviewers have raw originals. The failed original is stored under `failure-original/`; the passed retry trace under `passed-retry/` must not be presented as a failed-attempt trace.

Raw lists, structured timing and extracted unexpected-attempt marker agree:259 attempts/258 cases,248 first passes,one failed original,one retry,nine skips. Timing root reports four workers,259 attempts,zero dropped against1000 cap. Twelve archive/schema/bounds/privacy/identity checks pass; that validator's `allPassed` means evidence consistency, **not** a clean suite. Reporter content uses fixed categories/operation labels, hashed IDs and bounded source/project metadata, with no titles/selectors/inputs/error payloads or raw step names. Inclusive/leaf timing semantics remain explicit and are not CPU attribution.

## Actual artifacts, costs and gaps

| Artifact | ID | Bytes | Configured retention | Projected byte-hours |
| --- | ---: | ---: | ---: | ---: |
| Timing | 11336030084 | 47,474 | 24h | 1,139,376 |
| Failure evidence | 11335666301 | 4,628,437 | 72h | 333,247,464 |
| Pages | 11335542152 | 374,684 | 24h | 8,992,416 |

Total nominal projection **343,379,256 byte-hours**, not accrued/billed usage or a completed publication pair. Timing archive SHA256 **f0d6eed8277b92c00698178255942165f50eb8ee4f1ce6598504ee94259fa81a** and failure archive **54b9fdb870e20db6ecc036892a984d90b3fc5919323145edea2b3814ace0dc0e** match API digests and exact sizes. Timing ZIP contains only declared `ci-timing.json`; failure manifest/marker/original attachments/retry trace are complete. Pages API digest **b26ac7bb98f269a0682a073659296adf05c8b4813b6ce9d63e5532868394d4be** is metadata only here; extracted/public-byte integrity remains root-owned.

Every timing flag is **1**. Timing upload actually succeeds09:14:39–09:14:40Z; failure upload succeeds09:14:45–09:14:46Z because the unexpected marker survives a passed retry. This exercises both direct upload-artifact7 conditionals; it does not certify configure/deploy Pages/OIDC paths.

Job111691417008 **09:07:52–09:14:49Z =417s/seven round-up proxy minutes**; first-step gap1, container26, mise6, browser363, subpath4 seconds. Reporter duration361307.677ms; resource bracket362.257s, CPU delta1256.637790 processor-seconds. Linux x64/AMD EPYC7763/four CPUs/~16GiB, kernel6.17.0-1022-azure, pinned Playwright1.63.0/Bun1.4.0, timing instrumentation and retry active; no new OOM/throttle events. Counters include browser/protocol/server work and cannot establish isolated upgrade/helper speed effects. Comparing this instrumented, retried run with timing-disabled gates is descriptive only. Complete final delivery and first-attempt reliability remain open until root's review/evidence resolves the stated gap.
