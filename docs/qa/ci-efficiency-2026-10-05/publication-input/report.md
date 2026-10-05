# Automatic publication and strict current-pair measurement

Read-only collection started 5 October 2026 at 07:10:21Z (initial run/jobs snapshot
command completion). Exact final raw-fetch start/end clocks are in capture.json;
strict metric execution ran 07:10:57Z–07:10:58Z. Saved analysis completed
07:12:22Z. No CI dispatch/rerun/cancel, tests, source changes, merge or deployment
mutation occurred. This evidence role is not an independent final reviewer.

## Automatic path actually executed

PR #37 merged at 07:09:42Z to main
`28059a91ec9984dea4d079b3f684b3a27af669f0`. Automatic push Pages run
[37276181716](https://github.com/Tien-Lam/ChronoShift/actions/runs/37276181716)
succeeded. The consolidated `prepare` job ran 07:09:50Z–07:10:32Z: **42 seconds /
one per-job rounded minute**. Its source reports reuse of verified Web run
37274709527, tested source `997f3f2367bef1c877c207a4d89872992382d006`, exact tree
`c08c0f507faf6f82fac5ce790eb2e1f89fa59cdf`. Root owns the independent exact
tree/digest/archive/public-file audit; this report records the executed log/API.

Actual job environment is Linux x64, ubuntu:24.04 Docker-sourced image
20260925.9.1, westus3. Checkout took ten seconds, mise seven, verified reuse six,
Pages configuration one, upload two and deployment seven; setup five, with two
seconds before its first step. Bun/gh/toolchain and actual Pages deployment worked
on this observed Ubuntu Slim path. The separate full `verify` and `deploy` jobs
are skipped; they are not charged runner jobs in this pair. Complete manual
fallback remains a separate required validation and is not inferred from reuse.

New Pages artifact 11330182609 is **377,331 archive bytes**, about 14-day actual
retention (335.99944444444446 hours). The trusted PR artifact is 11330240757,
374,697 bytes / 24 hours. Main repackaging produces a different ZIP size; do not
substitute the PR size as a measured main artifact. All raw jobs, logs and artifacts
for the baseline/current pair are saved beside this report.

## Successful-pair metric and exit status

Executed the unchanged read-only command:

```sh
mise exec -- bun scripts/ci-metrics.ts --baseline 37131752983,37131749773 --candidate 37274709527,37276181716 --output docs/qa/ci-efficiency-2026-10-05/ci-efficiency-current.json
```

Its actual exit code is **1**, saved separately with stdout/stderr and start/end
clocks. The report is saved at the QA root, leaving historical planning and QA
measurements unchanged. This is a threshold failure, not a missing/failed run.

| Complete pair                | Raw runner seconds | Per-job rounded minutes | Projected artifact byte-hours, surviving API |
| ---------------------------- | ------------------ | ----------------------- | -------------------------------------------- |
| Original successful baseline | 307                | 8                       | 366,990,132.0719445                          |
| Current PR/main              | 442 (400 + 42)     | 8 (7 + 1)               | 135,775,734.37166667                         |

Strict tool results: raw runner reduction **−43.97%** (slower), rounded reduction
**0%**, surviving-API artifact projection reduction **63.00%**. Both 20% target
flags and isFaster are false. **TIE-375 stays open.** Consolidating publication to
one runner job does not establish a current whole-pair quota saving. Compared
with the immediately prior expanded-suite pair (326 seconds/eight minutes), this
sample is also slower, with the same rounded-minute proxy; conditions differ and
no isolated causal attribution follows.

Baseline PR/main browser workloads each had 68 cases plus subpath; current PR has
258 configured / 249 first-attempt passes / nine unchanged capability skips, zero
failed attempts/retries, 116 units and one subpath. Full current reconciliation is
in final-x64-candidate. This workload expansion is explicit: the retained baseline
is the requested target reference, not an equal-case controlled causal comparison.
Public standard runner use is not a dollar invoice, per-job rounding is a proxy,
full configured retention is projected storage, and one pair does not establish
monthly/account-wide savings or a guarantee for another run.

## Full original baseline artifact projection

The current API no longer lists original Pages build artifact **11276513957**.
Its original 37131749773 build upload log proves **220,772 bytes** and
**retention-days: 14**. The retained extraction is historical-missing-artifact.log;
the full original raw log remains 37131749773.log. This missing artifact was not
zero bytes or zero retention, and cannot silently disappear from the baseline.

The unchanged strict JSON is explicitly the **surviving-API conservative
projection**. Separately adding only that log-proven artifact contributes
74,179,392 byte-hours, giving a full-original baseline projection of
**441,169,524.0719445 byte-hours** and current storage reduction **69.223682%**.
Surviving artifacts keep actual API expiration-hour fractions. Using nominal
14 days for all three original artifacts instead gives 441,169,680 byte-hours;
that minor distinction is preserved, not silently rounded or rewritten. Both
storage projections pass 20%; neither fixes the raw-time/quota misses.

## Additional real investigation cost excluded from the pair

Five earlier PR #37 branch experiments were actually charged runner work:

| Run         | Scope                                             | Runner seconds | Rounded minutes |
| ----------- | ------------------------------------------------- | -------------- | --------------- |
| 37269816926 | Instrumented four-worker control                  | 356            | 6               |
| 37270362546 | Rejected six-worker experiment, one passing retry | 419            | 7               |
| 37272392986 | Rejected virtualization candidate                 | 431            | 8               |
| 37273144333 | Rejected two-worker candidate                     | 464            | 8               |
| 37274080414 | Rejected ARM candidate                            | 362            | 7               |

These add **2,032 runner seconds / 36 rounded minutes**, and **552,496,579.0291667
projected byte-hours** of every surviving experiment artifact, including timing
metadata and the successful-retry failure bundle. Current successful pair plus
these experiments is **2,474 runner seconds / 44 rounded minutes**. The pair
comparison excludes them by its declared one-successful-pair scope; this separate
ledger prevents treating them as free or erased. It is not a complete account or
all-project investigation total: older PRs/canceled jobs/local reviews/future
validation are outside it. Source branch/date matching finds all six PR37 Web runs
in the full 65-run API page; merged run pull_requests arrays are empty and were
not used to falsely claim no experiments.

Manual complete-fallback validation is pending root's run ID and will have its
actual cost retained separately. Further validation, diagnostic and documentation
publication cost must remain explicit; do not add them to the acceptance pair
without changing its scope, or omit them from the delivery cost narrative.
