# Delivery and remaining acceptance

[PR #41](https://github.com/Tien-Lam/ChronoShift/pull/41) merged at 2026-10-05T11:06:06Z as `cf4d5b9244278da591a33c1952283e76acb6116c`. Final reviewed head `cb8206c280494341632821d13b4e90f8f1c3a3e9` and tested merge `8fd325dd79afdd6dcf33e77503aca7f97541d25c` share complete Git tree `e42d8c81cc83befed6ff9d57dbf56066c7238d07` with that main revision. Workflow source, fixtures and application remained frozen after the final ready gate; this is a separate documentation-only follow-up.

## Executed verification

| Run         | Purpose                                           | Actual result                                                                                                      |                      Runner seconds / per-job rounded proxy |
| ----------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------: |
| 37299570754 | Draft opened                                      | Skipped expression-named check, no runner/steps/artifacts                                                          | No valid elapsed inference; skipped API timestamps reversed |
| 37299640175 | New ci-run admission                              | Literal `web` admitted; intentionally canceled during container initialization before checkout/full steps          |                                  26 / 1, investigation only |
| 37299950927 | Draft source push with old ci-run still attached  | Skipped, no runner/steps/artifacts                                                                                 |                                      No executed runner job |
| 37300042053 | Unrelated enhancement label while full job active | Skipped; did not cancel the same active full job                                                                   |                                      No executed runner job |
| 37299989506 | Final ready gate                                  | 116 units; 273 first attempts: 264 passes/nine unchanged CDP skips, zero failures/retries; separate subpath passed |                                                     358 / 6 |
| 37300768198 | Automatic main publication                        | One Slim prepare job reused exact verified artifact; fallback/deploy jobs skipped                                  |                                                      22 / 1 |
| 37301135549 | Separate manual fallback                          | Full 116-unit/273-browser/subpath gate; 264 passes/nine identical skips/zero retries; deployment passed            |                        452 / 10, additional validation only |

Both fresh hosted Git checkouts use actual blob:none fetch and non-cone sparse patterns. Logs confirm successful required source/build/corpus/browser/subpath/publication steps and full-tree identity. Actual fetched pack sizes and an exhaustive materialized path/mode inventory were not captured. The 99% historical uncompressed QA footprint is not a measured transfer or monthly saving. No REST fallback is seen; future stale sparse configuration or unsupported filtering remain unverified as efficiency proof.

Root automatic publication audit passed 66 checks and fallback audit 68, including SHA-256 archive metadata, safe member types, exact source/complete trees and all published bytes. Each release then passed all four hosted checks, including 21-second idle and fresh conversion after offline close/reopen. Automatic release source was `8fd325dd…`; final manual release source was `cf4d5b9…`. Actual clocks, commands, raw logs, hashes, independent audit reports and captured artifacts are retained here. Pixel is emulation, not a physical phone or installed launch. Existing-tab explicit updates, historical bug cause and device acceptance are not inferred from these fresh sessions.

Independent code/adversarial operational reports are under `code/` and `adversarial/`. They observed the same full ready job remain active after the unrelated event, no skipped literal `web` masquerade and full source-tree mismatch protection. Their snapshots were before final completion; the complete gate/publication audits provide subsequent evidence without rewriting those original reports. Initial source reviews and exact documentation corrections remain in the parent folder.

## Usage target and draft disposition

The ordinary successful pair is **380 seconds / seven rounded minutes** versus 307/eight baseline: rounded proxy **12.5% lower**, raw time **23.78% higher**, projected surviving-API artifact byte-hours **63.06% lower**. The 20% minute target and improved raw time remain unmet. The official metrics helper exits 1 for that target miss; this is not a failing verification gate. Baseline had 68 cases versus current 273; CPU models, setup and workload differ, so no causal speed or account-wide monthly billing claim follows. The manual 452 seconds/10 minutes and canceled 26 seconds/one minute are real extra validation costs, excluded only from the declared ordinary pair. Valid CPU brackets/counters are preserved separately; no invalid weighted profiles are revived.

[PR #38](https://github.com/Tien-Lam/ChronoShift/pull/38) closed without merge on 2026-10-05 after root chose not to adopt unproven whole-Linux efficiency, retaining branch head `299e3864f01d4e87a1770594628b84cf5a3972c8` and original correctness approvals/differing adoption recommendations. See the [closing decision](https://github.com/Tien-Lam/ChronoShift/pull/38#issuecomment-5993273763) and [retained null merge metadata with clocks](pr38-merge-status.json). No PR remained open in the retained final snapshot: [open PRs](open-prs-final.json), [PR #38](pr38-final.json), [actual observation clocks](pr-snapshot-clocks.json).

## Remaining tickets

Linear audit across all four ChronoShift projects: **46 tickets, 34 Done, 11 In Progress, one canceled**. Foundation project completed; other projects retain acceptance gaps. Retained [issue queries and clocks](linear-project-audit.json) cover all four projects independently; [project statuses and clocks](linear-project-statuses.json) record project completion state.

| Ticket  | Outstanding evidence or target                         |
| ------- | ------------------------------------------------------ |
| TIE-375 | 20% CI usage target                                    |
| TIE-370 | Unknown historical explicit-update readiness cause     |
| TIE-304 | Real phone/adaptive flow/actual browser zoom           |
| TIE-306 | Offline screen-reader selector                         |
| TIE-309 | Screen-reader/zoom task review                         |
| TIE-311 | Installed launches                                     |
| TIE-312 | Installed preference restart                           |
| TIE-314 | Actual offline OS share                                |
| TIE-317 | Real Android/iPhone cached restart, selection and copy |
| TIE-318 | Representative-phone performance                       |
| TIE-320 | Installed production/offline release acceptance        |

These original criteria are not relaxed or marked Done from emulation. The CI goal remains active.

Evidence gaps/corrections retained: rejected rendering prototype's incomplete list logs but complete structured attempts; its unexecuted complementary browser journeys; initial erroneous UTC-label probe; overwritten first expression-validator raw result; corrected case-insensitive label wording and literal skipped-check display; parser false positives/blank-line fixes; an initial artifact-helper stderr capture gap. No failing originals were silently reconstructed or removed.
