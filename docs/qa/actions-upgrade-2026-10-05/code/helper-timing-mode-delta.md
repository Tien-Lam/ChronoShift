# Conditional timing-upload audit delta

Observed existing helper source 2026-10-05 09:45:32 UTC; authorized edit and
SHA-256 capture completed 09:47:35 UTC, explicit repository cwd. Final helper
SHA-256 `b77197bfdb6b8304157d2c6a8799826e9f5c30e93a38c4fd2610815b683416aa`.
No helper invocation, application run, test or API call was made for this edit.
Original helper preparation record and historical runtime evidence remain intact.

`AUDIT_CI_TIMING` accepts only `0` or `1`, defaulting to `0` when absent. The
result records the expected boolean and ordinary/instrumented mode. Ordinary
mode requires one completed timing step whose conclusion is skipped, places it
in conditional observations with actualExecution=false, and never adds that
step to successful action executions. Explicit `AUDIT_CI_TIMING=1` requires
the existing successful action assertion with completed ordered clocks.

The skipped ordinary branch adds a current-head direct-uploader execution gap.
Retained run37288000068 on eef0d51e, timing artifact11336030084 and actual
flaky-success diagnostics artifact11335666301 are identified separately as
historical evidence using identical approved workflows. The helper does not
re-audit those logs/artifacts or claim they ran on the current source head.

All other identity, workflow-hash, required-action, reuse/fallback and single
deployment expectations are unchanged. Use `AUDIT_CI_TIMING=1` when auditing
the retained instrumented run or another intentionally instrumented final gate;
omit it or supply `0` for the ordinary final gate. Invalid flags, missing steps,
unexpected success/skips and changed workflow bytes still block the audit.
Readiness is static; root owns actual invocation against saved final evidence.
