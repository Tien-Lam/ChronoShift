# Fresh code-review precision corrections

Corrected on 5 October 2026 at 07:40Z after read-only recomputation of saved
cpu-run/profile.json at 07:39:31.185Z. No browser/profile rerun, source change,
server operation, metric recomputation overwrite or CI action occurred.

The original profile report is preserved byte-for-byte as report-original.md.
Updated report.md explicitly labels sampled coordinates as zero-based CDP: line17
corresponds to editor line18, line11 to editor line12, and line7 to editor line8.

The 1280px sampled small-close record has CPU-profile start/end interval214.263ms,
raw signed sample timeDelta sum214.202ms, and originally aggregated idle sample
weight175.339ms (**unreliable**, as established by the validation below). Its nested
action/assertion/two-rAF wall interval is203.008084ms. Its counter-reading interval
is214.095ms and includes Profiler.start/protocol instrumentation; sampled weights,
thread-duration counters and nested wall interval must retain these distinct
scopes. The original wording implied175ms idle within the203ms CPU interval;
the correction separates the actual214ms profiler interval from the203ms nested
observation. The idle-weight attribution is now withdrawn. Interpretation remains
bounded and no Linux improvement is claimed.

## Sampler validation and evidence limits

Offline analysis of unchanged saved records at **2026-10-05T07:43:15.496Z**
confirms all twelve profiles contain negative timeDeltas: **50 intervals**, signed
sum **−24015µs (−24.015ms)**, minimum **−1233µs (−1.233ms)**. The preliminary
−24.6ms estimate is superseded by this exact sum. Original analyzer/summary/log and
the already precision-corrected report and this correction note were preserved
byte-for-byte in before-sampler-validation/ before edits. report-original.md and
every original raw profile/timeline/gzip remain untouched.

analyze.ts now reports each profile's sample/delta counts, nonfinite and negative
counts, minimum, negative signed sum and total signed sum, plus explicit false
weighted-duration/ranking reliability flags. It does not clamp, normalize or rank
the invalid intervals. Corrected summary.json retains unranked sampled addresses
as presence evidence only. The previous weighted costs/rankings, relative overlay
cost and idle confirmation are withdrawn; the raw start/end214.263ms and nested
wall203.008084ms observations remain distinct from invalid sample weights.

Repeated threadTicks deltas and the native-entry close observer are independent
of the sampler weights. Raw before/after numeric counters were not saved, so their
subtraction is source-reviewed only; aggregation of saved deltas is reproducible,
but raw counter subtraction cannot be independently recomputed. The filter guard
checks count <20 and could admit zero; every actual filtered snapshot has two
options, which does not turn the guard into a nonempty assertion. report.md and
summary qualifications now state both limits explicitly. No rerun, browser/server
operation, new candidate, source change or CI action occurred.
