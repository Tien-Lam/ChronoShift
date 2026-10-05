# Local workflow-expression validation

**All checks pass:** 33 event/admission rows and nine Pages preparation/fallback/deployment rows, followed by a separate additive 20-row label edge matrix. Both commands exit zero with zero failures. These are local expression/configuration checks, not a browser gate or hosted scheduler test.

The harness parses the actual workflow YAML using `yaml` 2.8.1, extracts the real job `if`, display name, timing and Pages conditions, then parses/evaluates those strings with official `@actions/expressions` 0.3.61. Its installed package records upstream Git revision `b71ac284fc6a7382c22ecbf3e0009a6ae216823b`. Expected outcomes are stored as literal rows in [matrix.json](matrix.json) and [edge-matrix.json](edge-matrix.json), specified from the intended event policy before evaluation. The implementation predicate is not copied into JavaScript to produce expected answers.

Actual source Git blobs, checked before evaluation and unchanged afterward:

- Web: `fb5b017a40bfb2c189aae4563a05988b29b3be7a`; SHA-256 `5d32bea5a2f918415212ed1199d9f4ef9bb0100627bc3e31ae14cf48cd07b4a8`.
- Pages: `d92bca178f4596f578bb4e915924ba3d7fb83082`; SHA-256 `d05d0185479c70b45ae61645c39f64cf44a1b783bf08ee666c158962bd9a99dd`.

Exact source snapshots are [source-web.yml](source-web.yml) and [source-pages.yml](source-pages.yml). The harness rejects source identity changes rather than silently validating a different candidate.

## Scope and observations

Base-matrix rows validate draft/ready opened, reopened and synchronized PRs; ready-for-review admission; matching request-label events; sticky old labels; unrelated labels even on ready PRs; absent subscription for unlabeled/converted-to-draft/edited/review-requested/closed events; raw full/deferred display names; one-off timing; and inherited push/manual calls with actual parsed Pages caller inputs and Web input defaults. The current candidate intentionally does **not** make a draft PR caller's optional timing/publish input bypass its job condition: these negative rows pass, while non-PR push/manual callers always admit the full gate.

Nine Pages rows evaluate actual prepare/reuse/verify/deploy expressions for reused publication, automatic/manual/missing-output fallback, prepare failure, failed reused publication, verification failure, canceled deployment and non-main manual invocation. They report raw expression results, not whether a preceding step actually executed after a failure.

Static parsed assertions also verify the five exact trigger types, main branch filter, reusable path, publish-pages=true caller input, current canceling job-level Web concurrency, absence of workflow-level Web concurrency, noncanceling Pages serialization and presence of the browser step. These checks do not certify the browser step's complete runtime/test coverage.

The additive edge matrix confirms Actions equality's case-insensitive behavior: **`CI-RUN` requests a normal full gate and `CI-TIMING` requests a full timing gate** in both draft and ready PR rows. Leading/trailing spaces and prefix/suffix substrings remain nonmatching, with `web-deferred` and timing zero. Earlier prose calling label equality case-sensitive would be incorrect; the base-matrix rerun/results remain preserved and these results are additive evidence for that correction.

## Clock, dependency and raw evidence

Local environment: Darwin arm64, mise-managed Bun 1.4.0. The upstream [expression-library README](https://github.com/actions/languageservices/blob/b71ac284fc6a7382c22ecbf3e0009a6ae216823b/expressions/README.md) and package API were read before installation; installed evaluator declarations and JSON reviver/replacer implementations were read before execution. Libraries were installed with Bun into `/tmp/chronoshift-scheduling.uTUGnc`, never into the project or globally. The original repository lookup and unavailable web opens, corrected source read, exact install stdout and observed setup clocks are in [dependency-install.log](dependency-install.log). Dependency manifests and the generated exact Bun lock are retained alongside this report.

The first execution before evidence formatting passed33/nine rows at10:50:53.074–10:50:53.093UTC. Its local `run.log`/`results.json` were overwritten by the rerun; root's earlier inspection and tool stdout remain in chat history, but the first complete structured JSON is not retained locally and is not reconstructed. After formatting the helper/matrix and renaming one static assertion label without changing its assertion, the retained **base-matrix rerun** is **2026-10-05T10:51:31.503Z–10:51:31.519Z**,15.943709ms. The separate additive run is **2026-10-05T10:52:15.179Z–10:52:15.194Z**. See the explicit [raw-evidence correction](evidence-correction.md). These tiny harness durations are not application/CI performance measurements.

- Base-matrix rerun [run.log](run.log), [results.json](results.json), [validate-initial.ts](validate-initial.ts), [matrix.json](matrix.json).
- Additive [edge-run.log](edge-run.log), [edge-results.json](edge-results.json), [validate.ts](validate.ts), [edge-matrix.json](edge-matrix.json).
- [dependencies-package.json](dependencies-package.json), [dependencies-bun.lock](dependencies-bun.lock), [expression package metadata](dependency-expressions-package.json), [YAML package metadata](dependency-yaml-package.json).

The additive helper differs from the preserved base-matrix helper only by configurable matrix/output filenames, so edge results do not overwrite the base-matrix rerun's run log or result record. Both read the current actual workflow conditions. Each retained result includes synthetic context, expected values, actual evaluator values, source identity, clocks, dependency versions and failures. The filename `validate-initial.ts` refers to the pre-edge helper; it is not the exact preformat source used for the first execution.

Reproduce with the existing temporary libraries:

```sh
CHRONOSHIFT_VALIDATION_DEPENDENCIES=/tmp/chronoshift-scheduling.uTUGnc \
  mise exec -- bun docs/qa/ci-next-2026-10-05/scheduling-validation/validate-initial.ts

CHRONOSHIFT_VALIDATION_DEPENDENCIES=/tmp/chronoshift-scheduling.uTUGnc \
CHRONOSHIFT_VALIDATION_MATRIX=edge-matrix.json \
CHRONOSHIFT_VALIDATION_OUTPUT_PREFIX=edge- \
  mise exec -- bun docs/qa/ci-next-2026-10-05/scheduling-validation/validate.ts
```

If the temporary directory is unavailable, create a new temporary directory, copy the retained dependency manifest/lock to `package.json`/`bun.lock` there with `cp -f`, then run `mise exec -- bun install --frozen-lockfile` in that directory and set its absolute path in the environment variable. Source pins deliberately remain fixed to this inspected candidate.

## Limits and verdict

This is one official implementation of expression semantics and a general YAML parser, not GitHub's full server/workflow compiler. It does not prove actual event delivery, cumulative path-filter behavior, check-run name evaluation ordering on a skipped job, required-status enforcement, runner allocation, environment approvals, cancellation ordering or concurrency serialization. A deferred name evaluating to `web-deferred` locally is evidence about the string expression; a future bounded hosted check must still establish that the platform reports it that way.

The adapter injects only `always()` and `cancelled()` from the declared row. It does not emulate implicit `success()` wrapping; raw expressions on unsubscribed or canceled scenarios are separately identified. The Pages conditions directly include their relevant needed-job results and explicit cancellation predicate. Branch/path-filter execution and actual reused artifact trust/digest/source-tree checks are outside this harness; no inference of publication success follows from their admission alone.

**Local configuration/expression verdict:** no mismatch in the exercised valid event matrix, literal label edges or fallback cases. **Hosted scheduling/publication/report-resolution verdict:** pending actual platform evidence and the existing full gate, exact source/artifact checks and independent reviews. No browser, application build, project suite, Actions dispatch or workflow/runtime edit was performed by this validation task. All evidence writes remain inside this directory, apart from the explicitly authorized temporary dependency installation.
