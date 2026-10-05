# Independent manual fallback and bounded runtime supplement

Implementation/delivery: **approved within the observed scope; no actionable blockers**. Manual main publication ran the complete gate, deployed through the fallback job and serves the exact archived rebuilt-main files. This supplements, without replacing, `../fresh-code-review.md` and `delivery-review-automatic.md`.

TIE375 original acceptance: **unresolved; keep open**. The normal automatic pair remains 442 runner seconds/eight rounded minutes against the designated 307-second/eight-minute baseline. This manual acceptance run adds 375 seconds/eight rounded minutes; it is additional validation, not a faster alternative to relabel as the automatic pair. The local runtime probe does not establish hosted CI savings.

## Actual observations and commands

Reviewer observation window: **2026-10-05 07:19:39–07:24:50 UTC**, from actual clock calls. Independent static archive/public audit ran **07:23:43.706–07:23:54.160 UTC**; complete-log reconciliation recorded **07:24:25.322 UTC**. Bun 1.4.0/gh 2.100.0 remain mise-managed on macOS ARM64. Commands were read-only gh status/watch/API/log retrieval, safe static TAR inspection and reviewer-owned Bun analysis. No browser rerun, CI dispatch, deployment or production-source edit occurred.

Own evidence: `manual-delivery.json`, complete `manual.log`, `manual-summary.json`, `manual-audit.log`, `manual-analysis.log`, downloaded `manual-pages.zip`/`.tar` and extracted static `manual-site/`. gh labels reusable-job log steps `UNKNOWN STEP`; parsing uses the full raw per-test rows and API named steps rather than treating missing labels as missing tests. The original posted source/automatic reports are preserved.

## Full gate and actual deployment

Manual workflow **37276826095** is a successful `workflow_dispatch` on `main`, exact commit **28059a91ec9984dea4d079b3f684b3a27af669f0**. Complete API job inventory has three successful jobs:

| Job | Runner interval UTC | Seconds | Per-job rounded minutes |
| --- | --- | ---: | ---: |
| prepare | 07:16:37–07:16:52 | 15 | 1 |
| verify / web | 07:16:54–07:22:44 | 350 | 6 |
| deploy | 07:22:48–07:22:58 | 10 | 1 |
| Sum | | 375 | 8 |

Prepare's reuse, configure, artifact upload and deployment steps are skipped. The reusable Web job performs the frozen install, pinned browser-image check, formatting, **116 unit passes/zero failures**, production build, corpus audit, complete browser gate, Pages configuration, separate subpath build/test and artifact upload. The separate deploy job actually executes deploy-pages successfully, with payload artifact **11331175437** and main build version **28059a9...**. No prepare-job deployment or artifact reuse occurs, and there is no duplicate publication.

The complete browser list log has **258 distinct ordinals: 249 passes, nine existing CDP skips, zero failure/retry rows**. Project counts match the PR run: foldable 3 passes; Chromium/Android 51 each; Firefox/WebKit/iPhone 48 passes and three CDP skips each. The subpath runner reports one pass. Failed-attempt upload is skipped in the complete job metadata; the complete artifact inventory has only `github-pages`, with no diagnostic artifact. These reconcile first-attempt success without inferring it merely from a green workflow. A separate runner-produced structured browser attempt JSON remains unavailable because optional timing was disabled and successful browser reports are not uploaded; the independent rows are derived from the full list log.

The resource records show four workers on Linux x64, four available/logical CPUs, Intel Xeon 6973P-C and no cgroup OOM events. The earlier PR had AMD EPYC metadata. Different observed runner CPUs and the bounded number of samples limit causal timing comparisons.

## Archive, source and public identity

Downloaded main artifact **11331175437** is **374,676 bytes**, matching API size and digest **sha256:1028f12e73b87ebb12f0bb37b1cddac6803fd4ccfc7e562494b9f8069c39da95**. It is unexpired, retained for approximately fourteen days, and has one TAR wrapper with safe unique regular-file/directory paths. Its `release.json` identifies **28059a91ec9984dea4d079b3f684b3a27af669f0** and `/ChronoShift/`.

Independent API queries confirm reviewed head, tested PR release and merged/rebuilt main share tree **c08c0f507faf6f82fac5ce790eb2e1f89fa59cdf**. The fallback's four immutable `assets/` files match retained PR artifact bytes exactly; release/service-worker metadata legitimately identifies the rebuilt main source. The helper's `filesMatchPR` field means the selected immutable assets in manual mode, not all release-bearing files.

All **14** fallback archive files and the directory root matched fresh no-store public responses byte-for-byte. Per-file URLs, response codes/types, lengths, SHA-256 values and observation clocks are retained in `manual-delivery.json`. This independently confirms the fallback is public and its archive has the reviewed source. The artifact's nominal projected retention cost is **125,891,136 byte-hours**; it is an additional acceptance artifact, separate from the automatic pair's **135,775,944** nominal byte-hours.

## Supplemental owner evidence and remaining bounds

I read the raw owner fallback audit, hosted log and before/after in-app snapshots. The owner audit records **07:23:37.902–07:23:51.603 UTC**, 68 passed bounded identity checks and 14 exact public files. Its identity result corroborates rather than substitutes for my separate downloads/calculations.

`root/hosted-fallback.log` has four first-attempt pass rows: desktop/phone fresh input after offline close/reopen and scoped manifest/release/effective static CSP, 27.4 seconds overall. The snapshots at **07:23:58.049** and **07:24:06.842 UTC** show the same June 18 Tokyo draft, Asia/Tokyo target and 19:20 result before/after the owner's explicit Update now action. Before shows a waiting update action; after omits it and reports readiness true, the expected scoped application script and empty normal warning/error logs. This supports bounded draft/zone/result preservation. The JSON snapshots do not independently record active/controller worker identity or reconstruct historical user state; physical-device acceptance remains separate.

The actual manual journey closes the planned complete-fallback execution gap. A forced missing/expired artifact push, timeout, cancellation and failed deployment remain source-reviewed rather than injected hosted executions; no broader failure certification is claimed.

## Local CLI runtime hypothesis

I independently reconciled `root/runtime-probe/summary.json`, four complete list logs, four structured timing reports and absence of failed-attempt markers. Reviewer calculations are saved in `runtime-evidence.json` at **07:23:36.373 UTC**. The owner executed Bun → Node → Node → Bun over **07:20:58.268–07:22:28.368 UTC**, with the same root-base artifact inventory before/after, unchanged complete themed-choice journey and five normal-motion profiles/four workers. Each run has five passed retry-zero structured attempts and five list pass rows; all 20 first attempts pass.

Measured CLI wall-time means are **Bun 22,215.016 ms**, **Node 22,833.035 ms**, an observed Node difference of **+618.019 ms**. With two local samples per runtime and one bounded journey, this supports rejecting a runtime switch for lack of observed benefit. It does not prove a general Bun performance advantage, alter production source or establish GitHub runner/full-suite savings. The root-base local asset identity differs from the Pages-subpath build and must not be presented as a public-release speed comparison.

Both observed publication branches are now approved within scope. TIE375 remains open because the measured automatic paired time requirements are unmet, despite substantial nominal artifact-retention savings.
