# Supplemental initial grouped-update gate

**Initial execution verdict:** Web37285626930 succeeded on initial PR40 head **79c114bbe6823f70456a53f2a10e5428fc6263b6**, attempt1. This is supplementary evidence, not approval of the final reviewed delivery. Corrected version comments/review evidence and the timing-enabled final gate are still separate. Root owns publication and complete fallback validation.

**Acceptance verdict:** no per-run, complete-pair or monthly savings established; TIE-375 remains open. An automated grouped PR now exists, but its428-second/eight-minute Web job does not establish avoided future gates, compatibility of unexecuted privileged actions, or >=20% complete-pair savings.

Observation began **2026-10-05 08:53:19Z**. The one requested `gh run watch --interval 60 --exit-status` reported already-completed success by **08:53:34Z**, without waiting/polling another run. Raw capture completed **08:53:47Z**; tested-merge API/offline reconciliation completed **08:55:04.475Z**. Actual run/job clocks are retained below. All shell calls used explicit cwd `/Users/tien/Developer/ChronoShift`, mise-managed `gh` and Bun. No tests/build/browser, rerun/dispatch, source/Git/Linear mutation or deployment was performed.

```sh
mise exec -- gh run watch 37285626930 --repo Tien-Lam/ChronoShift --interval 60 --exit-status
mise exec -- gh api repos/Tien-Lam/ChronoShift/actions/runs/37285626930
mise exec -- gh api 'repos/Tien-Lam/ChronoShift/actions/runs/37285626930/jobs?per_page=100'
mise exec -- gh api 'repos/Tien-Lam/ChronoShift/actions/runs/37285626930/artifacts?per_page=100'
mise exec -- gh run view 37285626930 --repo Tien-Lam/ChronoShift --log
mise exec -- gh api repos/Tien-Lam/ChronoShift/git/commits/02057afa5c640461a2587ed2fa5e16dfba83ad47
mise exec -- bun docs/qa/actions-upgrade-2026-10-05/initial-ci/analyze.ts
```

`watch.log`, `run.json`, `jobs.json`, `artifacts.json`, `run.log` and `tested-merge-commit.json` preserve raw responses; `attempts.json` retains every raw parsed browser attempt, `analyze.ts`/`analysis.log`/`summary.json` the offline reconciliation. No cancellation or failure was reported. Checkout tested merge **02057afa5c640461a2587ed2fa5e16dfba83ad47**; API merge tree and local initial-head tree equal **614d8dc99ccb7e5ea16a7001ef44c7acd28ddd1e**. Against main base **0fb0b915a1e1f2ab19613ad1f8ac9dae0eec43cc**, web/e2e/tests/scripts, both Playwright configs, package/lock and Dependabot bytes are exact; only Web/Pages workflow files differ outside documentation. This verifies the initial source exercised, not the later final head.

Complete browser reconciliation: **258 distinct ordinals and semantic cases**, **249 first-attempt passes/nine existing CDP skips**, **zero retries and failed rows**. Full inventory and skip identities match saved complete PR37 evidence. Profiles: foldable3 passes; Chromium51; Firefox48+3 skips; WebKit48+3; Android51; iPhone48+3. Units **116 pass/0 fail across6 files**; repository-subpath **one pass (2.0s)**. Every declared required gate succeeds: upgraded checkout/mise; corpus snapshot; frozen install; pinned image/version/executable guard; formatting; units/production build/typecheck; independent corpus regeneration/diff; complete browser cases; after-resource capture; subpath build/browser verification; upgraded Pages artifact upload.

All recorded timing flags are **0**. Direct `actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` timing/failure branches are **skipped**; downloading its action code during setup is not execution of those branches. Configure-pages is skipped and deploy-pages does not run in this PR workflow. Successful Pages upload at `fc324d3547104276b827a68afc52ff2a11cc49c9` does not substitute for the conditional direct upload-artifact7 path or main privileged paths. Failed-attempt upload is skipped and API shows no failure artifact. List attempts plus unchanged marker policy corroborate zero retries; no direct green-run marker or structured successful timing artifact is retained here.

Sole artifact **github-pages**, ID **11334437162**, **374,678 bytes**, digest **sha256:cecf110b737d745782b3434453b7c3917b01342a269d032f7197faccd1ce362d**, created08:52:38Z, expires2026-10-06 08:52:37Z. Nominal configured24h projection **8,992,272 byte-hours**; API expiry differs by one second. Artifact/public extraction integrity is root-owned and untested here; nominal projection is not billed usage.

Web job111683711789 **08:45:32–08:52:40Z =428 seconds/eight rounded-minute proxy units**. First-step gap1, container26, mise26, browser358, subpath4 seconds. Resource bracket357.949s; CPU delta1241.542428 processor-seconds; cumulative after memory.peak6,706,278,400 bytes; no new OOM/throttle events. Linux x64/kernel6.17.0-1022-azure, AMD EPYC7763, four CPUs/~16GiB, unlimited cgroup limits; ubuntu24.04 image20260927.320.1; pinned Playwright1.63.0/Bun1.4.0. These counters include protocol/server/browser processes and do not attribute costs to an action. Different hardware/cache/setup/source conditions prevent causal speed conclusions against prior gates. Neither this supplemental run nor a green PR can certify final publication or historical/physical acceptance.
