# Independent adversarial post-delivery evidence review

Implementation/documentation verdict: **approved for this bounded additive delivery evidence scope; no remaining blockers**. The README accurately separates successful verification/publication from the unmet CI usage target and the remaining acceptance gaps. Earlier source approvals stand. This report neither changes the rejected rendering decision nor certifies the runtime original report.

Original-report-resolution verdict: **the 20% CI usage target remains unresolved**. TIE-375 remains In Progress. The historical unidentified readiness cause and physical-device/human acceptance gaps remain open. Successful first attempts and hosted emulation do not close those reports.

Observation began 2026-10-05 11:24:50 UTC and ended 11:28:41 UTC; report preparation began at 11:28:41 UTC. Actual completion clock is retained in `adversarial-final-review-clocks.json`. Environment was Darwin arm64, mise-managed Bun 1.4.0, gh 2.100.0. I read the exact saved `review-brief.md` and retained raw evidence, parsed logs/JSON independently, inspected the retained publication-audit source without executing it, and hashed the retained archives. I did not read the other reviewer's new final report, change runtime/workflow source, run a runtime suite/browser/build, make network/API requests, or request Actions runs. This review only writes its own report and clocks.

Reviewed base/current main: `cf4d5b9244278da591a33c1952283e76acb6116c`; reviewed source head: `cb8206c280494341632821d13b4e90f8f1c3a3e9`; tested merge: `8fd325dd79afdd6dcf33e77503aca7f97541d25c`. Retained commit/audit records identify full tree `e42d8c81cc83befed6ff9d57dbf56066c7238d07` for all three. Local `git rev-parse HEAD HEAD^{tree}` independently matched main and that tree. Scope is the additive delivery evidence folder and its README, not new source approval.

## Attribution and cost challenge

The ordinary successful pair is final ready Web run 37299989506 plus automatic main Pages run 37300768198. Raw jobs give Web 10:58:52–11:04:50 = 358 seconds, rounded per job to six minutes, and executed Pages prepare 11:06:14–11:06:36 = 22 seconds/one minute. The Pages verify/deploy records are skipped, have no steps, and supply no executed cost; one skipped record has reversed timestamps. The result is **380 seconds/seven rounded minutes**, not the whole investigation's cost.

The manual fallback 37301135549 independently has executed prepare 16 seconds/one minute, verify / web 425/eight, and deploy 11/one: **452 seconds/10 rounded minutes**. The admitted then deliberately canceled ci-run investigation 37299640175 has web 10:55:30–10:55:56: **26 seconds/one minute**, canceled container initialization with checkout/full steps skipped. These are real additional costs and are retained explicitly. Together these three bounded executed entries total 858 seconds/18 rounded minutes; that sum is not asserted to be an exhaustive project/account ledger. Excluding the two investigations from the declared ordinary pair is acceptable because neither cost is hidden or described as free.

`paired-metrics.json` records baseline 307 seconds/eight rounded minutes versus candidate 380/seven, projected artifact byte-hours 366990132.0719445 versus 135576999.85833332, and acceptance flags false. Independently, (8−7)/8 is 12.5%; (380−307)/307 is 23.78% raw growth; the projected storage reduction is 63.06%. No 20% minute saving or faster raw pipeline follows. Different 68-versus-273 browser workloads, runners and setup prevent causal optimization attribution. Storage is a projection from surviving API metadata, not measured transfer size or account-wide monthly billing. The metrics helper's target-miss exit is correctly distinguished from a failed verification gate.

## Verification and publication challenge

Independent parsing of the exact main-browser blocks in `pipeline/final-run.log` and `pipeline/fallback/run.log` found 273 result rows and 273 unique ordinals each, 264 passes and nine skips, with identical skip identities and no retry markers. The nine are three Chromium-CDP-only uncontrolled-worker cases on Firefox, WebKit and iPhone emulation. The raw logs independently show 116 unit passes/zero failures and a separate successful one-case repository-subpath check in each gate. Complete successful required steps and successful run attempt 1 corroborate the clean first-attempt claim. This is stronger than a green retrying summary but does not identify or disprove the old flake's unknown cause.

The retained root publication audits report all 66 automatic-reuse checks and all 68 fallback checks passed. Their retained source checks expected repository/workflow/events, exact literal successful web and required steps, complete job inventories, safe archive member types, API SHA-256 metadata, full source-tree equivalence, release metadata and each of 14 published paths. I inspected these conditions, including the mode-dependent fallback condition that requires **no reuse log** and a complete main gate. I did not execute the audit again. The archive SHA-256 digests independently match the retained API/audit records:

- PR `pipeline/final-pages.zip`: `e7d9eca8b9fe91f78c3a4034b7dc5a384fafb22c308b997a8c63f7f58056172a`.
- Published `pipeline/pages-final.zip`: `be13cd0d4e4cda6a26252d93c1a18ca9087ce1685881d38c1fe547893dd87386`.

Automatic publication identifies tested merge `8fd325dd…`; manual publication identifies main `cf4d5b9…`, whose full tree is identical. The fallback rebuilt immutable runtime assets consistently while correctly identifying main in release metadata. Four successful retained hosted checks follow each publication, with exact expected release, 21-second idle and fresh offline conversion after close/reopen. Those are fresh automated browser sessions/emulation, not physical or installed-device evidence. The README states this limitation. Main's absent branch-protection policy is recorded in the audits; no enforcement claim is made.

The earlier adversarial operational snapshot already independently observed the same full ready job continue after the unrelated enhancement event, and no skipped literal web masquerade. Its initial report remains preserved under `adversarial/`; later completion/publication records supplement its earlier incomplete status without rewriting it. Sparse checkout logs establish the executed blob:none/non-cone commands, not exhaustive materialization modes, fetched pack bytes, future stale-worktree behavior or REST-fallback efficiency. Those limitations remain explicit.

## Disposition and ticket challenge

I initially identified missing durable provenance for exact Linear totals and the final empty PR list. The root added fresh evidence before this verdict, preserving distinct observation clocks rather than retrospectively asserting the old 11:19:56 snapshot. I independently parsed four successful Linear issue pages, each `hasNextPage:false`: counts 11/15/8/12, 46 unique IDs, 34 Done, 11 In Progress and one Canceled. The eleven In Progress IDs exactly match the README table: TIE-304/306/309/311/312/314/317/318/320/370/375. The separate project snapshot reports Foundations Completed and the other three projects In Progress. These are observed administrative statuses; truncated issue descriptions and a project status do not independently recertify every completed ticket's original acceptance.

The retained open-PR list is empty at 11:26:16.141–11:26:17.189 UTC. PR38 is CLOSED at 11:11:50, still draft, with retained head `299e3864f01d4e87a1770594628b84cf5a3972c8`. A further provenance gap in the first PR snapshot's omitted merge fields was corrected additively by `pr38-merge-status.json` observed 11:28:33–11:28:34 UTC: `mergedAt:null`, `mergeCommit:null`, same exact head. Thus **closed without merge** is supported. The README attributes the adoption decision to root and links the closing decision; I did not independently retrieve that comment. Closure of a draft does not establish an efficiency target or invalidate the original bounded correctness approvals/different adoption recommendations.

README relative Markdown links to the retained PR/Linear snapshots all resolve. Existing gaps and corrected/failed probes remain named. In particular, the rejected rendering prototype's complete structured attempts do not turn its unexecuted competing browser journeys into passed evidence. The CI goal remains active. There is no remaining actionable documentation blocker after the two additive provenance corrections; no original acceptance criterion was relaxed by this review.

## Exact evidence identity

Git blob hashes at observation end (these identify file content, not archive SHA-256):

| Evidence | Blob |
| --- | --- |
| review-brief.md | `b1c25187ee0da9581b059aded355c78b97a9f39d` |
| README.md, after retained-snapshot links | `a46b6fb1df64a0e9e2c696c6af9e89b2703f70c0` |
| paired-metrics.json | `6b2769c1e4e2562ea93320bade193115f27fb136` |
| publication-reuse-audit.json | `43320e82c240def80c5e1487efe05b9b7d588842` |
| publication-fallback-audit.json | `539cb4aeb7fad24b3290c74ce4dab508e296a07e` |
| pipeline/final-run.log | `cd561c927250f9af4e109984369e15254df5dde1` |
| pipeline/fallback/run.log | `72a4b4d9fc430c3a1b89f54264d7361f233ec754` |
| linear-project-audit.json | `505e8cb65061665a2deffa64291548f125a7af01` |
| linear-project-statuses.json | `eda9332e874f813110f9f26fda9f53052cb707b4` |
| pr38-final.json | `94634c588cb3b0aa70ff771dae9a591e426599dc` |
| open-prs-final.json | `fe51488c7066f6687ef680d6bfaa4f7768ef205c` |
| pr-snapshot-clocks.json | `97d34c15e038013509c3d4031588563a7d50b7d6` |
| pr38-merge-status.json | `6b152386a92f8cd737a4333b3539c87cd9fd8b9e` |

Earlier original reports remain unchanged and authoritative for their bounded source/runtime scopes. This independent evidence approval does not mark the original goal complete.
