# Fresh code-review precision corrections

Corrected on 5 October 2026 at 07:40Z after read-only recomputation of saved
cpu-run/profile.json at 07:39:31.185Z. No browser/profile rerun, source change,
server operation, metric recomputation overwrite or CI action occurred.

The original profile report is preserved byte-for-byte as report-original.md.
Updated report.md explicitly labels sampled coordinates as zero-based CDP: line17
corresponds to editor line18, line11 to editor line12, and line7 to editor line8.

The 1280px sampled small-close record has CPU-profile start/end interval214.263ms,
summed sample timeDeltas214.202ms, and idle sample weight175.339ms. Its nested
action/assertion/two-rAF wall interval is203.008084ms. Its counter-reading interval
is214.095ms and includes Profiler.start/protocol instrumentation; sampled weights,
thread-duration counters and nested wall interval must retain these distinct
scopes. The original wording implied175ms idle within the203ms CPU interval;
the correction separates the actual214ms profiler interval from the203ms nested
observation. Interpretation remains bounded and no Linux improvement is claimed.
