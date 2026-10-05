# Upgraded Action execution assertion helper

Helper creation/static inspection clocks: `2026-10-05 09:09:51`–`09:12:04 UTC`.
Explicit cwd `/Users/tien/Developer/ChronoShift`. Added QA-only
`action-execution-audit.ts`; no commits, tests, execution, API calls, Actions
dispatch, production source/audit changes or old-evidence edits.
Initial helper SHA-256:
`ef574efb717f04b9aa9d5e2b4520642d028c8092d42565f89b13eccfa0ec3d94`.

The helper reads saved CI and Pages jobs JSON, including either raw REST
`{total_count,jobs}` inventories or publication evidence's `ciJobs`/`pagesJobs`.
The same embedded publication evidence file can be supplied for both inputs.
It requires independent expected identities in `AUDIT_HEAD_SHA`,
`AUDIT_MERGE_SHA`, `AUDIT_CI_RUN`, `AUDIT_PAGES_RUN`. Attempts default to one;
set `AUDIT_CI_ATTEMPT`/`AUDIT_PAGES_ATTEMPT` when the actual expected attempt
differs. These identity values must come from delivery provenance, not arbitrary
inference from the job JSON.

From the repository root, after both workflows complete successfully:

```sh
AUDIT_HEAD_SHA=FULL_FINAL_PR_HEAD \
AUDIT_MERGE_SHA=FULL_MERGED_MAIN_SHA \
AUDIT_CI_RUN=FINAL_WEB_RUN_ID \
AUDIT_PAGES_RUN=ACTUAL_PAGES_RUN_ID \
mise exec -- bun docs/qa/actions-upgrade-2026-10-05/code/action-execution-audit.ts \
  CI_JOBS_JSON PAGES_JOBS_JSON reuse OUTPUT_JSON
```

Replace `reuse` with `fallback` for the manual complete-gate publication and
supply that distinct Pages run ID/output. Use distinct output filenames to
preserve both observations. The helper performs no remote reads, commands or
artifact/browser operations; it writes one additive result JSON and exits one
when any expectation is missing, skipped, failed or mismatched. It records input
hashes, expected pins, actual step conclusions/timestamps and its own clocks.

Independent pins are constants copied from verified official tags; exact
approved workflow SHA-256 constants bind named upload steps to those Actions.
The helper rejects changed workflow bytes, incomplete/duplicate job inventory,
wrong run/head/attempt, unfinished jobs and absent/duplicate/skipped required
steps. A successful required step must be completed with valid ordered clocks.
Zero-second steps remain valid because the REST API clocks are second-granularity.

Required executions by path:

- Final instrumented PR gate: checkout v7, mise v5, Pages upload v5 and direct
  timing upload-artifact v7.
- Automatic Slim reuse: checkout v7 and mise v5, configure Pages v6, Pages upload
  v5 and deploy Pages v5, with preparation the sole executed publishing job.
- Manual fallback: Slim checkout/mise succeed while its configure/upload/deploy
  steps are skipped; `verify / web` executes checkout/mise/configure/Pages upload
  in the unchanged UID1001-configured Web workflow, followed by successful
  separate deploy v5. Exactly three jobs must execute successfully.
- Both modes: exactly one successful v5 deployment step in the Pages inventory.

Limits stay explicit: named-step APIs do not separately expose their action SHA;
the exact workflow hash supplies that attribution. Actual UID/temp ownership and
credential cleanup still need runner logs. Failure diagnostics are observed and
reported without acceptance: skipped or successful timing branches do not prove
failed-first/successful-retry preservation. Complete attempt reconciliation,
artifact contents/digest/source trees, live bytes, timeout/cancellation,
historical rollback and hosted offline/explicit-update journeys remain separate.

Readiness verdict: **QA helper ready for root-owned invocation after success**.
Static inspection traced reuse/fallback, missing/duplicate steps and failure
verdict accumulation. It has intentionally not been executed or tested yet;
no runtime acceptance is claimed by this preparation record.
