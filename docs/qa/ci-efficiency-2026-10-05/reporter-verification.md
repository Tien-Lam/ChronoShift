# Optional timing reporter verification — 5 October 2026

Scope: new `e2e/timing-reporter.ts` only, plus this evidence/check script. Delivery agent owns optional configuration, workflow registration and the authorized Linux PR gate. No runtime edits, changed assertions, new browser cases, builds, full-suite repeats, screenshots, traces or motion overrides were performed by this investigator.

Actual work began with a clock read at **2026-10-05T05:49:50Z**, source HEAD `67be6094afd71dc512e001df632cb8157bc71d45`. Final verification command completed at **05:52:56Z**; the shared checkout then had documentation HEAD `7059da3125ada61123f91d1267bbee9a6f4792ef`. Environment: Darwin arm64, mise-managed Bun 1.4.0, repository-pinned Playwright 1.63.0. These clocks describe reporter development/verification, not Linux browser timing or an optimization measurement.

The reporter uses public `onStepEnd`, `onTestEnd` and run lifecycle APIs. Each attempt records project/index, repository-relative source location, a hashed test ID, actual supplied start/duration/status/expected status/retry/worker indices, and category/operation aggregates with count, total/max duration, leaf count/duration and failed-step count. Failed attempts, successful retries and skips have separate records. At most 1,000 attempts are retained; omitted attempts are counted explicitly. The default destination is `<project outputDir>/ci-timing.json`; the constructor accepts `{ outputFile }`. Only one count-only console line is emitted at run completion.

Raw titles, selectors, subtitles, parameters, values, step/error payloads, annotations, stdout/stderr and attachments are excluded. Category and operation labels come from fixed allowlists. Human-readable API titles in the installed pinned Playwright source were inspected because titles such as `Fill "<value>"` contain input. The classifier exports only `fill`, `select`, `navigate`, `request`, `screenshot`, etc.; unknown/custom labels collapse to bounded categories. It does not depend on private step fields. Project names come from trusted configuration, are bounded to 64 simple characters and otherwise become a project index. Paths outside the configured source root become `<external>`.

Verification commands:

```sh
mise exec -- bun docs/qa/ci-efficiency-2026-10-05/reporter-check.ts
mise exec -- bunx --bun prettier --check e2e/timing-reporter.ts docs/qa/ci-efficiency-2026-10-05/reporter-check.ts
mise exec -- bun run typecheck
```

All pass. The final synthetic check has an internally recorded start **05:52:56.150Z** and completion **05:52:56.153Z**; [raw output](reporter-check.log). [Check source](reporter-check.ts) supplies public reporter event shapes and verifies sensitive fill/selection/custom/error/attachment payload omission, exact count/sum/max/leaf/error aggregation, retry isolation, provided result metadata, skipped attempts, state reset, outside-root path redaction and explicit 1,000-attempt overflow. The JSON output remains temporary under the system temp directory; this durable log records the check result without synthetic private payloads.

Limits: these are synthetic reporter events, not proof of a real Playwright runner's callback sequence or Linux performance. Optional registration and Linux output remain to be verified by delivery. Operation labels classify known human-readable title prefixes; unknown operations are grouped as `other-api`, and custom API titles may be classified approximately. Counts therefore explain broad categories rather than certify precise browser internals. Inclusive parent/child durations overlap; leaf totals avoid parent aggregation but can still contain polling and other waits. Neither total is CPU time or an additive decomposition of test wall time. Instrumentation overhead is unmeasured and must be recorded in the Linux control/candidate comparison. Passing media collection is unchanged by this file.

**Implementation verdict:** synthetic aggregation/privacy checks, formatting and type checking pass within the reporter scope. **Original efficiency report verdict:** unresolved; optional profiling has not demonstrated a saving or met TIE-375's quota/time target.
