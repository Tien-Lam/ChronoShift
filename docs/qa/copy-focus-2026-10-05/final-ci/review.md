# Exact final hosted gate

Web run [37292552858](https://github.com/Tien-Lam/ChronoShift/actions/runs/37292552858)
passed at exact PR40 head `7631906bdd654fd696596f74b733cf87d415cebf`, tree
`44a2096e710983603a85193c2cd33c05461145cb`. Discovery was observed at
09:49:27 UTC on 2026-10-05; a single `gh run watch --interval 60 --exit-status`
returned success observed at 09:55:46. Raw API/log collection finished before
offline reconciliation at **09:55:58.886 UTC**. No Actions dispatch or rerun.

## Inventory and gates

Raw browser list output reconciles **273 distinct cases/273 attempts: 264 first
passes, nine skips, zero failures, zero retries**. All original 258 semantic
file/title/profile identities remain, plus the three new copy-focus cases in all
five established browser profiles. The nine skip identities match the prior
CDP-only exceptions exactly; none is a new skip.

| Profile           | First passes | Existing skips |
| ----------------- | -----------: | -------------: |
| foldable          |            3 |              0 |
| Chromium          |           54 |              0 |
| Firefox           |           51 |              3 |
| WebKit            |           51 |              3 |
| Android emulation |           54 |              0 |
| iPhone emulation  |           51 |              3 |

The original failing WebKit imports case passes first attempt here, as do all
15 new core regressions. Unit output reports **116 pass, zero fail**; the separate
repository-subpath journey passes **1.8 s**. All twelve required named gates
pass: checkout, checked-in corpus capture, mise, frozen dependency install,
pinned browser image/version check, formatting, units/production build, exact
standalone corpus audit, complete browser suite, resource capture, subpath and
verified Pages build upload. Raw gates and every step interval are in summary.json.

`CHRONOSHIFT_CI_TIMING=0` appears throughout this ordinary-mode gate. Timing upload
is skipped. Failed-attempt diagnostics upload is also skipped; the unchanged
condition would upload on a failed step or a retained failed-attempt marker.
This agrees with the complete raw zero-failure/retry inventory. No green marker
file or structured timing report is retained in ordinary mode. The earlier
instrumented eef run's timing/failure upload and original failure remain separate
evidence; they were not overwritten or reclassified.

## Source and artifact identity

The actual checkout log includes tested merge
`24a9d920a3c3bb71edcc860b8207442f462d9b8a`; its saved Git commit API tree equals
the exact final head tree. The final web tree `e8a7963096c8dcb09de5a259a966cf1b7aa595d9`
matches approved application source `35e11bac657a0c379fda48af9b454e674d2ea854`.
Permanent regression SHA256 is
`6467c3acb6f5da55573678ac9e64b846fd3f8eba1cdb04b4df6ea59c0bfb429e`;
the exact committed file is saved as tested-copy-focus.spec.ts. Final quiet
evidence capture and cleanup paths were exercised by the complete gate.

Relative to eef, the only non-documentation changes are App.tsx and the new
copy-focus.spec.ts. Workflows retain reviewed blobs web
`4a2d098605337417b84965f2227d1cda67a981d7` and Pages
`403f2d3a603847520efc76033141f272e3094fdb`. Fixtures, scripts, lockfile and browser
configurations retain their exact prior identities. Source proofs, raw PR and
tested-merge metadata are saved independently of the workflow conclusion.

Artifact API contains exactly one artifact: `github-pages`, ID **11337229220**,
**374912 bytes**, API digest
`sha256:774e7a3ca686661be286d80634c96d5810b5174dbab1b7d7fe91dff11e13d73e`.
Its workflow_run records this exact head/run and its configured retention is one
day; nominal projected size × retention is **8,997,888 byte-hours**. API expiry is
2026-10-06 09:54:59 UTC, one second earlier than a strict created+24h calculation.
This is metadata, not a downloaded archive digest assertion or actual billing.
Root owns privileged artifact extraction/tree verification and public-byte audit.

## Timing and limits

Job111706138750 spans **09:49:22–09:55:04 UTC =342 runner seconds/six rounded
minutes**. Before-first-step gap is one second; container setup31 s, checkout4 s,
mise5 s, browser step285 s and subpath3 s. Resource collection brackets the
browser step for285.018 s on Linux x64, Intel Xeon6973P-C, four logical CPUs and
four Playwright workers, 16,765,374,464 bytes reported total memory. Existing
CI viewports/raster and normal-motion configuration remain intact.
Cgroup CPU usage delta is958.767629 aggregate CPU seconds; throttling counters
and all memory-event deltas are zero. This is a whole-cgroup bracket, not per-test
CPU attribution.

For context, the earlier grouped Actions gate was428 s/eight rounded minutes
(258 cases, AMD EPYC7763); eef's instrumented gate was417 s/seven minutes with
one failed original and passed retry (also AMD). Earlier PR39's ordinary Intel
Xeon6973P-C gate was330 s/six minutes, browser269 s, for258 cases. Current342 s/
browser285 s has fifteen additional cases and an App change. These are measured
observations under differing hardware/source/instrumentation/attempt workloads,
not isolated causal speedups or regressions. Whole paired publication metrics
are still root-owned; future grouped-update savings are unobserved.

Implementation gate verdict: **passed**, complete required scope, first attempts
clean, source/tree identity consistent. This supplies final quiet-path CI evidence
for the reviewed bounded fix. Original-report verdict: the original check and
matching deferred-focus regressions pass here; the missing original first-failure
trace still prevents reconstructing its precise historical interleaving.
Publication and report-matching hosted verification remain outstanding in this
report. **TIE375's original paired quota/storage/raw-time acceptance is not
established**, and neither local gains nor this expanded hosted workload substitute
for that acceptance evidence.

Commands used explicit cwd `/Users/tien/Developer/ChronoShift`, mise-managed gh
for discovery/watch and `gh api` run/jobs/artifacts/tested-merge reads, then
`gh run view --log`. Every raw transfer was awaited before analysis; jobs.json has
the standard `{total_count,jobs}` API shape. The saved offline Bun analyzer
returns success for all exact-head inventory/gate/source/mode conditions.
