# Full manual fallback — executed coverage and additional validation cost

Observation began 2026-10-05T07:19:46.545Z. Complete final fetch/analysis and
deployment snapshot clocks are retained in capture.json/deployment-capture.json.
This evidence role performed read-only GitHub/production release reads and wrote
only QA evidence; no source changes, tests, CI dispatch/rerun/cancel or deployment
mutations occurred. Root dispatched and owns final publication trust/acceptance.

[Manual Pages run 37276826095](https://github.com/Tien-Lam/ChronoShift/actions/runs/37276826095)
completed successfully as workflow_dispatch on exact main
**28059a91ec9984dea4d079b3f684b3a27af669f0**. Run creation/update clocks are
07:16:31Z/07:22:59Z. Source reuse is skipped on this event; automatic prepare
configuration/upload/deployment is also skipped. All **prepare → full verify / web
→ deploy** jobs actually executed and succeeded. This is direct fallback evidence,
not an inference from the earlier automatic reuse path.

## Complete attempt reconciliation

The full raw log contains **258 configured cases/four workers; 258 unique cases,
258 initial attempts, 249 passes, nine unchanged CDP-only skips, zero failed
attempts and zero retries**. All static `(profile, file, title)` identities and
skipped statuses match the retained successful control. Foldable passes three;
Chromium/Android each pass 51; Firefox/WebKit/iPhone each pass 48 plus the same
three skips. Unit output is **116 pass / zero fail / 725 expectations**; separate
repository-subpath output is **one pass**. Required browser image/version guard,
format, exact engine/corpus, normal-motion/lifecycle and subpath gates succeeded.

Actual CHRONOSHIFT_CI_TIMING is **0**. Optional timing and failed-attempt bundle
uploads are skipped; the sole uploaded artifact is github-pages. No retry is
inferred from green workflow status: every listed attempt is reconciled and the
failure marker/upload policy is separately visible in the source/job metadata.
This all-first-pass run does not re-exercise successful-retry bundle retention;
the separate six-worker run retained that proof. Passing HTML is not uploaded by
the existing policy; identities/counts come from full list output and source.

The initial reused generic parser depended on gh's step-name labels. Reusable
workflow raw logs label those lines **UNKNOWN STEP**, so that parser emitted zero
cases and exit one. Its original summary/log/exit/cost output are preserved as
initial-parser-*; that is a parser limitation, not a browser failure. The corrected
analysis bounds attempts from the 258-case header through its complete 249-pass
summary, then verifies the independent control inventory and nine skips. Current
attempt-analysis-exit.txt is **0**, with all 258 attempt rows and empty retry
evidence saved. Raw run.log is untouched. No assertion/test/pipeline was changed.

## Additional cost, separate from the normal successful pair

| Charged runner job                 | Actual interval     | Seconds | Per-job rounded minutes |
| ---------------------------------- | ------------------- | ------- | ----------------------- |
| prepare                            | 07:16:37Z–07:16:52Z | 15      | 1                       |
| verify / web                       | 07:16:54Z–07:22:44Z | 350     | 6                       |
| deploy                             | 07:22:48Z–07:22:58Z | 10      | 1                       |
| Additional manual validation total | All three jobs      | **375** | **8**                   |

The browser step took **291 seconds** (07:17:44Z–07:22:35Z), container setup 34,
mise five, subpath four. Raw runner cost sums complete job intervals, including
step gaps; it is not browser wall, test-seconds or end-to-end elapsed time.

The declared normal pair **37274709527 + 37276181716 remains 442 seconds/eight
rounded minutes**. Its strict JSON/exit one is unchanged: raw is slower than 307
baseline seconds, quota savings are zero, and only storage meets 20%. This manual
run cannot replace that pair with a favorable measurement. Normal pair plus this
validation is 817 seconds/16 minutes; plus the five earlier PR37 experiments it
is **2,849 seconds/52 rounded minutes**. These enumerated costs are not a complete
monthly/account ledger; combined-cost-ledger.json keeps their separate scopes.

Manual artifact **11331175437** is 374,676 bytes, actual API retention
335.9997222222222 hours, projected **125,891,031.92333333 byte-hours**, digest
**sha256:1028f12e73b87ebb12f0bb37b1cddac6803fd4ccfc7e562494b9f8069c39da95**.
All raw artifacts/jobs/logs and reproducible cost/attempt/resource helpers are
saved. Projected configured-retention storage is not accrued monthly billing.

## Observed resources and final production state

The full verification runner reports x64/Linux 6.17.0-1022-azure, **four logical
CPUs/available parallelism four**, Intel Xeon 6973P-C, 16,765,374,464 bytes visible
RAM. Before/after records at 07:17:44.750Z/07:22:35.457Z span 290.707 seconds.
Cgroup CPU usage delta is 981,640,613 microseconds (about **3.377 mean cores**);
own throttling counters and all memory/OOM event deltas are zero. cpu.max and
memory.max report max. Lifetime memory peak rises from 1,520,762,880 to
**7,147,012,096 bytes**. This is cgroup interval/lifetime evidence including
descendants/setup; it is not isolated browser CPU/RSS/peak or proof excluding
ancestor constraints/host contention. Different CPU models/sample conditions do
not establish a causal performance improvement.

Final deployment **6853496906** reports success at **07:22:59Z**, from the manual
deploy job, on that exact main. The prepare environment record also reports
success, but has no production URL and is not misidentified as the Pages deploy.
Fresh production release.json at **07:24:45.643Z–07:24:45.986Z** returns HTTP 200,
sourceCommit **28059a91ec9984dea4d079b3f684b3a27af669f0**, base /ChronoShift/,
SHA-256 **21b6daa91ef8b8dfe2b0ed487b085106cb626f43ae2f7d7bce5f3a1be524f66c**.
Raw source/HTTP/deployment snapshots are saved. Root's exact archive/public-file
audit remains separate; this simple identity read is not full artifact trust proof.

**Implementation fallback execution passed; the efficiency report remains
unresolved.** TIE-375 must stay open for the failed normal-pair target; TIE-370's
unknown historical cause and nine physical/human ticket gaps are not diagnosed or
closed by this run. No installed OS-share, real-phone p95 or screen-reader claim
follows from the full browser gate.
