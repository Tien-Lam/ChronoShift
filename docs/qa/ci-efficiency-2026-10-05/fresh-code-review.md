# Fresh independent code review, 2026-10-05

Implementation: **approved for the bounded source change and adoption; no actionable source blockers found**. This is a source approval, conditional on the owner obtaining the planned automatic Slim publication and complete manual fallback evidence before claiming those execution paths have worked.

TIE375 original acceptance: **unresolved; keep open**. The exact-head PR alone consumes seven rounded minutes and 400 runner seconds against the entire baseline pair's eight rounded minutes and 307 seconds. A successful publication adds at least one rounded minute. This run cannot establish 20% fewer paired rounded minutes or improved raw runner time. Artifact retention savings are projected, with the paired main artifact not yet observed.

## Scope and provenance

- Base: `7059da3125ada61123f91d1267bbee9a6f4792ef`.
- Exact reviewed head: `b288920d072d6ebb6ca56d1ea83f7c95ea7bed02`; local HEAD matched it.
- All seven non-QA changed files read: both workflows, review instructions, collection test, optional timing reporter, Playwright configuration and fixed machine metadata script. Raw historical QA files and peer verdicts were not used for the initial verdict.
- Surrounding owners read: `scripts/reuse-pages-artifact.ts`, `e2e/attempt-reporter.ts`, `playwright.subpath.config.ts`, `tests/publishing.test.ts`, `mise.toml`, publishing documentation, package scripts, and CDP skip conditions. `git diff` independently confirmed no delta in `web/`, `bun.lock`, exact fixtures/tests or the artifact verifier.
- Independent initial source verdict sent to the implementer before inspecting any peer reports or PR comments; none were read for this review.
- Actual observation clock window: **2026-10-05 07:03:39 UTC through 07:07:27 UTC**. Initial analysis script recorded `2026-10-05T07:05:54.434Z`; its final metadata timestamp is in `independent-summary.json`. This is observation time, not the historical runner window or report-writing time.
- Local environment: macOS ARM64; mise 2026.10.1; mise-managed Bun 1.4.0 and gh 2.100.0. No build, browser rerun, CI dispatch, GitHub mutation or application-source edit performed. Evidence and this report are the only writes.

## Independently derived failure paths

The privileged prepare job is guarded by `refs/heads/main` before checkout/execution. Its environment policy was read through gh and permits one custom branch policy, `main`, with type `branch`. PR Web jobs retain only contents/pages read permissions, have no deploy step and no Pages environment. Same-repository PR artifact publication remains a main-only operation.

Reuse accepts only a completed successful same-repository Web pull-request run, the expected workflow/path, a successful web job with every required step, matching head/main/local checkout trees, an unexpired bounded Pages archive and its SHA-256 digest. The artifact's release commit must also have the exact main tree and `/ChronoShift/` base. Downloaded files are never imported or executed. ZIP members are limited to `artifact.tar`; paths must begin `./`, exclude parent traversal/backslashes/newlines, and verbose TAR entries must be regular files or directories. Links are rejected before either temporary or final extraction. The artifact verifier is unchanged from base; the new permissions do not open a new artifact-code execution path.

The relevant workflow branches hold by source inspection:

| Trigger/condition | Result |
| --- | --- |
| Non-main manual dispatch | prepare skipped; verify and deploy cannot proceed |
| Main push, trusted matching artifact | prepare validates, uploads and deploys in the same job; fallback verify and deploy skipped |
| Main push, absent/expired/untrusted artifact or verifier exception | verifier writes false; complete reusable Web gate runs, then fallback deployment |
| Main manual dispatch | reuse step skipped; successful prepare has no true reuse output; complete Web gate and fallback deployment run |
| Prepare timeout/failure/cancellation, or reused upload/deploy failure | verify cannot run; fallback deployment cannot run; no second publication |
| Fallback verification failure/cancellation | deployment guard fails; no publication |
| Workflow cancellation after dependencies | explicit `!cancelled()` prevents fallback deployment |

Workflow-level `pages-publication` concurrency with cancellation disabled spans preparation, full fallback and deployment. Both possible deployment jobs share `github-pages` concurrency with cancellation disabled. Thus a slow active older verification cannot overlap a newer complete publication. GitHub concurrency is not a guarantee that every queued publication survives or FIFO ordering; the existing documented at-most-one-pending behavior and explicit rollback reruns remain relevant.

The full browser image/version guard, four workers, retries, normal motion, profiles, viewports/raster choices, browser assertions, unit/build/corpus gate and separate subpath gate are retained. The collection test still exercises hover plus Tab, deliberate keyboard alias selection, and deliberate pointer selection for both independently owned zone inputs. The changed last selection first scrolls and clicks the input, asserts its closed state, fills the query, asserts the reopened state and scopes selection to that input's current `aria-controls`. It adds a real focus/scroll precondition and owned-popup check without sleeps, force-clicks or reduced-motion masking.

Optional timing is disabled unless explicitly selected through the reusable input or investigation label. It emits only fixed operation/category labels, repository location/config metadata, hashed test identity, numeric aggregates and statuses. It does not serialize titles, parameters, errors, attachments or input values. Group labels are finite; pending state uses result identity and is deleted at test completion; completed attempt storage is capped at 1,000 with an omitted count. Inclusive versus leaf totals are explicitly distinguished. The metadata script reads only five fixed cgroup files plus fixed OS/CPU/memory fields; it does not enumerate environment variables or application data.

Failure evidence remains owned by the independent attempt reporter. Successful retries retain its failure marker and trigger the existing three-day diagnostic artifact. After-browser metadata and optional timing upload use status-function conditions so they can still execute after failure; canceled runs do not upload. Timing is uploaded before the subpath runner, which clears only its separate output directory. Artifact publication still requires success through the full gate. No evidence reporter replaces browser assertions.

## Independent commands and observations

Commands used `git diff`, `git rev-parse`, source reads, `mise exec -- gh run view RUN --log`, `mise exec -- gh api` for run/jobs/artifacts/environment/commit metadata, `unzip`/`tar` for static archive inspection, and `mise exec -- bun docs/qa/ci-efficiency-2026-10-05/fresh-code/analyze.ts` for independent reconciliation and synthetic reporter validation. Saved raw logs and metadata are in `fresh-code/`; `analysis.log` and `independent-summary.json` preserve calculations. Two initially unquoted gh API paths were rejected by zsh globbing before invoking gh and were immediately retried quoted; the completed JSON files are valid.

Exact-head Web run **37274709527** reports head `b288920...`; the actual checkout was PR merge commit `997f3f2367bef1c877c207a4d89872992382d006`. Its API tree and the head/local tree are all `c08c0f507faf6f82fac5ce790eb2e1f89fa59cdf`. The downloaded artifact's `release.json` names that merge commit and `/ChronoShift/`; this qualifies source identity rather than mislabeling the tested checkout as the PR head SHA.

The complete runner log contains exactly **258 distinct browser ordinals**, 249 pass rows, nine skip rows, no failure or retry rows. Per project: foldable 3 pass; Chromium 51 pass; Firefox 48 pass/3 skip; WebKit 48 pass/3 skip; Android 51 pass; iPhone 48 pass/3 skip. The nine skipped uncontrolled-tab cases match the existing Chrome CDP-only condition. Unit log reports **116 pass/0 fail**, and subpath log reports **one pass**. Jobs metadata marks failed-attempt upload skipped; the artifact list contains only `github-pages`, with no failure artifact. Together these support first-attempt success for this run. A separate runner-produced structured timing/attempt JSON is **unavailable** because timing was off and successful runs do not upload HTML/attempt diagnostics; structured rows in the independent summary are derived from the complete list log, not presented as that missing source.

Observed candidate job: **06:53:22–07:00:02 UTC, 400 seconds, seven rounded minutes**. Browser step: 06:54:07–06:59:54 UTC, 347 seconds. The raw before/after records show x64, four available/logical CPUs, AMD EPYC 9V74 and no cgroup OOM events. Exact image digest remains the pinned Playwright 1.63.0 image.

Artifact **11330240757**: downloaded ZIP is **374,697 bytes** and matches API digest `sha256:87d46fb4d220e5e7951a72b31779d4fb197012a01cfa6915d5646cef75141181`; API retention is 24 hours. ZIP has one `artifact.tar`; its release identity was read statically. The archive listings are retained in `fresh-code/archive-paths.txt` and `archive-entries.txt`; the unchanged safe-archive predicate accepts all 17 paths/entries, recorded at `2026-10-05T07:07:17.530Z` in `archive-validation.json`.

Synthetic reporter exercise used secret-like text in the test ID, step title, category and error message and delivered 1,002 attempts. Output contains no sentinel; it stores 1,000 attempts and records two omissions, with the recognized Fill operation reduced to the fixed label. This checks sanitization/storage bounds, not live browser integration or timing overhead. No browser was launched.

Baseline raw jobs independently total **156 + 132 + 8 + 11 = 307 seconds**, with per-job rounding **3 + 3 + 1 + 1 = eight minutes**, across Web **37131752983** and Pages **37131749773**. Their artifact sizes are **561,341** and **530,892** bytes with nominal fourteen-day retention. Projected baseline is **366,990,288 byte-hours**. If the candidate's same-sized ZIP is retained for one day in PR and fourteen days in main, the projection is **134,890,920 byte-hours**, a **63.244% reduction**. Actual main ZIP size/retention and the complete paired runtime remain unobserved. Baseline suite coverage predates the current complete suite; this is the ticket's designated historical cost baseline, not proof that identical historical scenarios were served.

## Remaining evidence

Actual automatic `ubuntu-slim` reuse/upload/deployment and complete manual/missing-artifact browser fallback have not executed in this review window. Their runner compatibility, deployment output/environment URL, hosted release identity, full diagnostics and actual paired cost must be observed by the owner. Cancellation/timeout/failure branch conclusions above are static control-flow review, not injected GitHub executions. This review does not certify physical-device acceptance or reconstruct any historical user browser state.

The bounded source adoption can ship after the owner's planned publication validation. TIE375 remains open regardless of a safe successful deployment: this exact-head measured PR cannot meet its rounded-minute/raw-time objective.
