# Independent code review: TIE-375 initial efficiency investigation

## Scope, identity and actual timing

Reviewer `ci_lifecycle_code`, Darwin arm64, mise-managed Bun 1.4.0. Actual UTC clock observations: initial **2026-10-05 05:52:24**, after the final source-identity read **05:53:49**, and after initial report save/format **05:54:46**. These identify review observations, not CI execution times. Exact uninstrumented command/report boundaries are unknown. This timing sentence was added after that last observation. No builds, browser runs, full CI repeats, `dist` changes or production edits were performed. Only this report and its evidence were written.

Context reuse is disclosed: this reviewer previously independently investigated and approved the bounded readiness, selection and final publication changes. This is a new focused read-only efficiency investigation using that context, not a claim of fresh clean-context review. I read the [actual saved efficiency brief](../ci-lifecycle-2026-10-05/efficiency-brief.md), [initial performance investigation](../ci-lifecycle-2026-10-05/efficiency-investigation.md), workflows/configuration, relevant tests, fixtures, preview/release generation and artifact-reuse code. I did not read another efficiency reviewer's verdict.

Initial task source was main `67be6094afd71dc512e001df632cb8157bc71d45`; during review HEAD advanced to docs-only `7059da3125ada61123f91d1267bbee9a6f4792ef`. Runtime/testing baseline remains reviewed `9c7965acfbcbe034471ad427625eb624792812eb`. Root/another agent were concurrently preparing an opt-in timing reporter and configuration/workflow registration. Those uncommitted profiling changes were visible; this report does not approve their final implementation. [Source identities](code/source-identities.json), captured `05:53:49.436Z`, identify the inspected current files, including evolving configuration. No profiling results exist in this review.

## Measured facts

I independently parsed successful browser rows from the retained raw CI log using a Bun stdin helper. [Current log summary](code/current-log-summary.json), captured `05:53:13.371Z`, records the raw log SHA-256 and parsed rows. It agrees with 249 first-attempt passes, nine documented configured skips and **939.247 summed test-seconds**. Those concurrent durations include browser/fixture/wait work and rounding; they are not CPU time. The total divided by four is 234.812s, close to the measured 246s browser step. This makes aggregate test work a stronger first target than a scheduling-only explanation.

| Cost from retained job metadata  | Seconds |
| -------------------------------- | ------: |
| Web job                          |     301 |
| Browser step                     |     246 |
| Container initialization         |      35 |
| mise setup                       |       5 |
| Subpath build/check              |       2 |
| Initial units/build              |       1 |
| Main prepare + deploy            |      25 |
| Successful PR + publication pair |     326 |

The saved API measurement's job times are whole-second metadata, not exact command timing. The current pair uses eight per-job rounded minutes versus historical baseline 307 seconds/eight minutes. It misses the current requirement despite 63.25% lower projected artifact byte-hours. The saved brief's pending Pages wording is original dispatch state; the later measurement and reviewed publication evidence establish that Pages subsequently completed. The historical successful 168-scenario optimization does not certify the current 258-scenario suite.

Independent sums put controls at 182.2 test-seconds, app at 177.06 and updates at 130. The themed menu sweep contributes **94.2**: Chromium 12.4, Firefox 18.1, WebKit 31.3, Android emulation 12.8, iPhone emulation 19.6. All WebKit-profile cases sum to 243.5 and iPhone emulation to 173.1; these sums alone do not establish an engine or fixture cause.

## Concrete candidates, ordered by safety and profiling value

1. **Batch popup observations into coherent retrying snapshots.** `controls.spec.ts` already batches six control dimensions, but each opened popup repeatedly crosses the browser protocol for poll bounds, later bounds, trigger bounds, computed style, option bounds/style and calendar alignment. Preserve the readiness/visibility assertion and actual click/Escape/focus sequence, then gather related bounds/styles/content from the same browser observation. Retry the full assertion-bearing snapshot while normal animations settle, instead of replacing polling with a one-shot `evaluate`. Preserve null/hidden handling, all containment/size/style expectations, selected option and content checks. This changes test observation overhead without changing product behavior. Its actual saving is **unknown** until the Linux profile separates these actions from rendering/actionability.

2. **Gate successful evidence screenshots if measured cost warrants it.** The menu sweep saves six screenshots per Chromium/Firefox/Android profile (18); app accessibility tests save another screenshot per profile. These are successful evidence captures, separate from assertion coverage and configured automatic failure screenshots/traces. An explicit visual-evidence option could retain them when requested while skipping routine success captures. Preserve all geometry, accessibility/theme/CSP assertions and failure evidence, including a failed first attempt followed by a successful retry. WebKit menu captures are already excluded because of tool stylesheet injection, yet its sweep is slowest, so this cannot alone explain the bottleneck. Do not broadly disable screenshot tools or normal motion.

3. **Profile unnecessary synthetic-release preparation in ordinary WebKit UI fixtures.** The common fixture starts a dedicated Bun origin for every WebKit test; that origin precomputes three distinct release collections with integrity hashes before printing readiness. This is necessary for tests that mutate release state or stop the origin to demonstrate real offline access. Plain controls/responsive/live cases do not necessarily need mutable release variants. A safe candidate could explicitly distinguish a static origin from a release-enabled isolated origin, preserving each test's fresh browser context and existing WebKit offline workaround. Measure fixture setup first. Never share mutable `publishedVersion`, interrupted-request counters or stop handles among concurrently running tests; never reuse browser context/caches to save setup. Stale fixture generation across builds would invalidate lifecycle evidence. This is a source-backed hypothesis, not a measured dominant cost.

4. **Observe retry completion rather than shorten its integrity guard.** The persistent corrupt-install test waits 5s per profile through both bounded 1s/3s retry delays, contributing 25 fixed test-seconds. An explicitly counted registration/installation completion signal could replace the conservative margin only if the final retry is known to finish and the later failure state, missing controller, staging cleanup and retained draft/conversion are all checked. A diagnostic signal must not itself drive application success. Retain real-time hosted deadline coverage. Do not shorten this wait to the startup deadline, change production retry timing or broadly accelerate timers. The maximum wall saving from this guard is modest.

5. **Product list rendering is a separate, higher-risk candidate.** Zone choices use an ordinary ListBox populated by the full zone/alias collection; opening an empty source field exposes that collection repeatedly. Rendering/layout cost is plausible, but this review did not measure DOM size or CPU. Virtualization would require independent functional/accessibility review and all searchable entries, End/Arrow/Tab/Enter, pointer selection, hover noncommit, scrolling, popup dimensions, fixed offsets/freeform and source/target independence. Prefer measured test-observation changes first; do not truncate options or bypass visible controls to improve the suite.

## Build/tool/container and publication constraints

The workflow's two production builds are distinct: initial root-base browser coverage, then `/ChronoShift/` subpath deployment. Vite base, manifest/share/scope, release metadata, worker version and integrity paths all depend on that base. The second build produces the exact uploaded Pages artifact. Removing either build loses current coverage or deploys different bytes. Their measured cost is too small to justify that loss. Parallel build/test server changes must not overwrite `dist` while fixtures read it.

Web mise setup includes the checked-in Bun/Node/gh tools, while Pages already requests only Bun/gh. Narrowing Web setup to demonstrated-needed tools is a low-value hypothesis (5s total setup); verify Playwright's spawned process/runtime requirements before removing Node. Formatting, corpus audit and dependency/browser guards are also cheap and should remain. No duplicate full gate runs in successful main publishing: exact trusted PR reuse already avoids that work.

Container initialization is 35s of this sample. Removing all of it still leaves 291s, above the raw target. A cached native installation would need equivalent pinned engines, OS libraries/version guards, trustworthy cache identity and cold-cache download/extraction measurements. A warm cache alone is not acceptance. More workers/jobs can raise aggregate runner time and minute rounding; no increase is supported by current evidence.

Keep main-only publication serialization across preparation and deployment, successful trusted same-repository PR workflow/head checks, exact source-tree equality, required gate steps, artifact digest and safe bounded extraction, and complete fallback when reuse is unavailable. Renaming or moving gate steps must also update the reuse verifier deliberately; otherwise it safely falls back and loses the intended saving. The prepare/deploy jobs each incur one rounded minute, but combining them is a structural trust/permission/fallback change, not a free bookkeeping saving. Do not hand privileged publication tokens to PR runtime code or bypass the fallback to merge jobs.

## Coverage and acceptance invariants

Retain all **258 configured cases**, their 249 passing/9 capability-skipped baseline identities, existing five browser profiles plus foldable project, four workers, normal-motion checks, current viewport/raster settings, root and repository-subpath builds, independent fixture expectations, 116 unit cases and standalone corpus audit. Keep real UI actions and exact result/date/input/selection identities, controller/cache/version boundaries, fresh/retained/updated tab cases, cancellation/late completion and explicit update activation. Retain existing privacy/console/CSP assertions, no arbitrary input in the timing report, failure screenshots/traces and failed-attempt marker/upload on successful retry.

The proposed sanitized opt-in timing reporter should keep every attempt/retry and expected status, source location/hashed identity and profile, worker/parallel indices, actual runner timestamps and durations. Nested step totals overlap; leaf totals still are not CPU or test wall time. Report missing/dropped attempts. Compare unchanged Linux suite settings and exact tested source before/after; optional profiling overhead means its run is a diagnostic control, not automatically an equivalent uninstrumented acceptance run.

Against 307 seconds, the raw target is **245.6 seconds** for the complete successful PR/publication pair. Holding measured nonbrowser Web overhead 55s and publication 25s constant requires browser work at most **165.6s**, a 32.7% reduction from 246s. Eight baseline rounded minutes requires at most six for at least 20% reduction; with two publishing minutes, Web must finish within 240s. Aim for margin and retain raw metadata, retries/failures, diagnostic runs and cache/artifact retention when discussing monthly account usage. This paired sample is a cost proxy, not a billing export or account-wide guarantee.

## Separate verdicts

- **Implementation:** initial investigation only; no optimization candidate has been implemented or approved here. Profiling the unchanged suite is justified. No blocker in the proposed coverage-preserving investigation scope.
- **Original efficiency requirement:** current 326s/eight-minute pair does not satisfy it; TIE-375 remains open. Saving estimates above are hypotheses or arithmetic bounds, not established optimized acceptance.
