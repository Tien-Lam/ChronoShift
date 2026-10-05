# Independent final hosted-gate reconciliation

**Implementation/gate verdict:** complete Web37284698483 passed on exact PR39 head `66e5fd32f2654e0a61d35ceae6e75b5e4561bc19`, attempt1. The complete original workload and runtime/test/workflow/config/fixture bytes remain intact. No gate blocker found. Root owns merge and artifact extraction/publication verification; this report does not replace the two existing static configuration reviews.

**Original-report verdict:** TIE-375 remains unresolved. This Web job took **330 runner seconds/six per-job rounded-minute proxy units**; no paired main publication is included. Web alone exceeds the original complete307-second baseline. Future grouped PR creation, avoided gates and monthly savings have not been observed. The faster single gate cannot be attributed to grouping, which does not change browser execution. PR38 remains a separate held candidate.

## Clocks, commands and exact identity

Observation began **2026-10-05 08:37:15Z**. After a30-second wait, sole-run discovery completed **08:37:55Z**. `gh run watch --interval 60 --exit-status` then waited without repeated independent run API polling. Success was observed **08:42:44Z**; raw collection finished **08:42:57Z**, offline reconciliation **08:43:09.433Z**, report-writing clock **08:44:31Z**. All shell calls used explicit working directory `/Users/tien/Developer/ChronoShift`; GitHub operations used mise-managed `gh`:

```sh
mise exec -- gh run list --repo Tien-Lam/ChronoShift --commit 66e5fd32f2654e0a61d35ceae6e75b5e4561bc19 --limit 10 --json databaseId,name,event,headSha,status,conclusion,createdAt,updatedAt,url
mise exec -- gh run watch 37284698483 --repo Tien-Lam/ChronoShift --interval 60 --exit-status
mise exec -- gh api repos/Tien-Lam/ChronoShift/actions/runs/37284698483
mise exec -- gh api 'repos/Tien-Lam/ChronoShift/actions/runs/37284698483/jobs?per_page=100'
mise exec -- gh api 'repos/Tien-Lam/ChronoShift/actions/runs/37284698483/artifacts?per_page=100'
mise exec -- gh run view 37284698483 --repo Tien-Lam/ChronoShift --log
mise exec -- gh api repos/Tien-Lam/ChronoShift/git/commits/8b380dcee298b06e7693fcacb9ca9c44486b3a36
mise exec -- bun docs/qa/ci-maintenance-grouping-2026-10-05/ci/analyze.ts
```

Raw captures are `discovery.json`, `watch.log`, `run.json`, `jobs.json`, `artifacts.json`, `run.log` and `tested-merge-commit.json`; `analyze.ts`, `analysis.log` and `summary.json` retain deterministic offline reconciliation. No tests/build/browser, Actions dispatch/rerun, Git/source/Linear mutation or deployment occurred. Only QA evidence files were written. Cleanup of an unused, unexecuted copied analyzer template was rejected by the automatic shell review; it was safely removed with an explicit file patch. No requested observation was blocked.

Raw checkout tests merge **8b380dcee298b06e7693fcacb9ca9c44486b3a36**. Its API tree and local final-head tree both equal **6bae04113c9ebce83e2c914a04f3f0adf0c07c5d**. Reviewed source **4ff0472089817193a39228d93ac062107c9b441b** and final head have identical web/e2e/tests/scripts, both workflows/configs, package/lock and Dependabot identities. Against base **82843f46e554a04d7a9db9c8b0aaacb77466442e**, only Dependabot differs outside documentation. Runtime web tree remains **78dbdbf65b5328416f0b169cc52d3ed9541d02f9**; e2e tree **295d14434adb5ad70b272aa80b012efc90f572ff** excludes the held PR38 helper.

## Complete workload and evidence preservation

Independent parsing finds **258 distinct ordinals and semantic project/file/title cases**, **249 first-attempt passes/nine existing skips**, **zero retry rows and zero failed rows**. Inventory and skip identities exactly match saved complete PR37 evidence:

| Project | First passes | Existing CDP capability skips |
| --- | ---: | ---: |
| foldable | 3 | 0 |
| chromium | 51 | 0 |
| firefox | 48 | 3 |
| webkit | 48 | 3 |
| android-emulation | 51 | 0 |
| iphone-emulation | 48 | 3 |

Units report **116 pass/0 fail across6 files**; separate subpath check reports **one pass (1.7s)**. All required named gates succeed: checkout; corpus snapshot; mise; frozen install; pinned image/version/executable guard; formatting; units/production build/typecheck; independent corpus regeneration/diff; all browser cases; after-resource capture; repository-subpath build/browser verification; Pages artifact upload. PR configure-pages is skipped as designed; no deployment runs here.

All recorded `CHRONOSHIFT_CI_TIMING` flags are **0**. Optional timing and unexpected-attempt diagnostic uploads are skipped; artifact API has no failure bundle. Complete list rows, skipped diagnostic step and unchanged marker/upload logic corroborate first attempts and absence of retained unexpected-attempt evidence. No direct green-run marker or structured successful timing artifact is available; workflow success alone is not used as zero-retry proof.

Sole artifact **github-pages**, ID **11333319904**, **374,676 bytes**, digest **sha256:144f310d4ec422e007a56b6489d0e4772878e123610ab0461a89c4bfc4bbe570**, created08:42:04Z, expiry2026-10-06 08:42:03Z. Nominal configured24h projection **8,992,224 byte-hours**; API expiry differs by one second. This establishes metadata provenance, not extracted/public-byte integrity or actual account billing. Publication audit remains root-owned.

## Time and environment limits

Job111680695222 runs **08:36:38–08:42:08Z**,330 seconds/six rounded proxy minutes. First-step gap1 second, container36, mise5, browser269, subpath3. PR37 Web400/browser347, manual verification350/browser291 and held PR38 Web455/browser368 are separate observations with differing conditions, not causal controls. Original acceptance still requires the complete historical307-second/eight-minute pair; no candidate pair is invented here.

Linux x64/kernel6.17.0-1022-azure, **Intel Xeon6973P-C**, four available/visible CPUs, roughly16GiB memory, unlimited `cpu.max`/`memory.max`, runner imageubuntu24.04/version20260927.320.1, pinned Playwright1.63.0/Bun1.4.0. Resource bracket **269.144 seconds**, CPU usage delta **894.726539 processor-seconds**, after cumulative memory.peak **7,356,715,008 bytes**, zero new OOM/throttle events. Counters include browser/protocol/server work, not per-test attribution. CPU differs from PR37/PR38 AMD hosts; a matching manual-control model still does not establish matched host load/throughput.

Raw logs retain GitHub's Node20-to24 action-runtime and upcoming ubuntu-latest migration annotations. No action/runtime dependency upgrade was performed. Future grouped version updates still need compatibility review and the same complete gate; these annotations and this successful unchanged-workload run cannot certify updates not yet created or avoided future runs.
