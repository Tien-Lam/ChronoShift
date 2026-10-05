# Independent code review: same-job six-worker experiment

Reviewer `ci_lifecycle_code`, reused context disclosed in [code-initial.md](code-initial.md). Read-only review on Darwin arm64, mise-managed Bun1.4.0. Actual UTC clock observations: **2026-10-05 06:01:23** initial, **06:01:51** control verification, **06:02:14** final source read. These are review observations, not experiment completion/report-writing times; uninstrumented boundaries remain unknown. No builds, browser/full-suite runs, CI dispatch, production edits or `dist` writes.

Actual dispatch: [concurrency-brief.md](concurrency-brief.md), with acceptance clarified by [brief.md](brief.md). Control `2d94136249cf67b7ab37efe44401180a976692ad`, Web run `37269816926`; experimental head `77fbf61b33d0b2752a3f90b20a261f30f0842b0f`. Exact code/config/workflow comparison `git diff 2d94136..77fbf61 -- playwright.config.ts .github/workflows/web.yml e2e scripts` changes only CI workers4→6 and two explanatory comments. Local workers remain3. The unchanged opt-in sanitized reporter is registered in both; all fixture/test/script/workflow files are identical. `git diff --exit-code` confirms the latter. Batching is fully reverted, with its prototype patch/evidence separately retained.

## Independent control evidence

[concurrency-control-verification.json](code/concurrency-control-verification.json), captured `06:01:51.426Z`, independently recomputes the saved reporter/job metadata and source hashes. It confirms passed status, four workers, 258 unique attempt identities, no dropped attempts, zero retries or unexpected results, 249 passed/9 skipped.

| Project           | Configured attempts | Passed | Documented skips |
| ----------------- | ------------------: | -----: | ---------------: |
| foldable          |                   3 |      3 |                0 |
| chromium          |                  51 |     51 |                0 |
| firefox           |                  51 |     48 |                3 |
| webkit            |                  51 |     48 |                3 |
| android-emulation |                  51 |     51 |                0 |
| iphone-emulation  |                  51 |     48 |                3 |

Saved job intervals agree: Web `05:54:04–06:00:00Z`, **356s**; browser `05:54:58–05:59:49Z`, **291s**; reporter duration **290306.86ms**. Raw log independently states 258 tests using4 workers and final249pass/9skip. Whole-second API job bounds and reporter wall duration have different owners and precision.

Aggregation qualification sent to root: **1111545ms is the 249 passed-test duration sum**; all258 attempts sum **1118060ms**, including6515ms of skipped-test setup. Neither sum is CPU time. The sorted configured identity set—project, hashed test ID, source location and expected status—has SHA-256 `378707e85d73075838a81295c5896eaca5a2776c4351de87a270d251e2d80616`. This can be compared with candidate metadata without exporting test titles or input payloads.

The instrumented control is slower than the earlier uninstrumented301s job/246s browser sample. Profiling overhead, runner variation and scheduling/resource effects are not separated by these two different samples. Do not call the difference measured reporter overhead or compare the six-worker instrumented result only to the faster historical uninstrumented sample.

## Isolation and lifecycle review

No source-level isolation blocker found for the bounded six-worker experiment. Playwright's existing per-test page/context fixtures isolate cookies, preference/session storage, IndexedDB, service-worker registrations and CacheStorage. Clearing caches or spoofing workers/timers in one test's document does not mutate another context. Deliberate multitabs share only their own test's context, which is required lifecycle coverage.

`fixtures.ts` creates a dedicated Bun origin on OS-assigned port0 for every WebKit case and any `isolatedOrigin:true` case. Its release state, interrupted-request count, stop closure and synthetic versions belong to that process. All inspected release-changing owners select isolation: updates file, install tests, diagnostic cache tests, uncontrolled clients, and app/privacy release tests. Ordinary non-WebKit cases share the main origin but only read the static tree; their browser storage remains separate. Tests that use disconnect stop their owned WebKit origin or set offline only on their own context. Keep this arrangement; six workers must not lead to shared mutable release fixtures or prematurely reused contexts.

Preview generation reads `dist`; the gate rebuilds subpath output after browser completion. Root must continue to avoid concurrent local builds overwriting reviewer/benchmark assets, but this worker change does not introduce another build. Browser-engine expectation tests also read `dist/assets` without writing. Screenshots use Playwright's per-test/project output paths; the parent runner emits the shared timing and failed-attempt JSON through synchronous reporter callbacks, so worker completion ordering does not introduce concurrent file writers. Console capture records/pending promises are page-owned; navigation loss remains explicit, genuine capture errors still fail teardown.

No actual OS clipboard serialization claim is needed for the implicated copy/import cases: relevant tests install page-local clipboard stubs or assert manual-copy fallback. The reviewed change alters no fixture scope, storage state, global test ordering, origin name or result expectation.

## Resource/cost and measurement risks

Six workers means additional simultaneous browser/server/worker processes and potentially multiple pages per test. It uses the same one hosted job and runner, not six charged jobs. Lower job wall time could reduce usage, but CPU contention, memory pressure, process crashes or timeout retries can increase aggregate job time instead. The retained control does not include peak memory/CPU/pressure measurements; no measured hardware capacity or memory safety claim is made. Keep the pinned image, `--ipc=host`, `--init` and existing cleanups. Inspect runner/browser crash or killed-process logs and resource metrics if available; absence of a retry alone does not measure headroom.

Do not increase expect/test deadlines, add sleeps/force-clicks, disable normal motion, change raster/viewports or drop profiles to make six workers pass. A new first-attempt failure matters even when a retry passes; retain its screenshots/context/trace and upload marker. Resource contention can delay SW installation/readiness, worker conversion and late-completion/cancellation paths, so failures must be attributed from actual evidence rather than dismissed as noise. Reporter step `failedCount` can include expected injected rejection such as the uncached offline request; correlate with test expected/status and the original scenario before calling it a new unexpected failure.

Compare exact control/candidate commits and runner/image/setup metadata. Require the same258 identity set, expected statuses and nine capability skips, no missing/dropped attempts, and preserve every retry/result. Evaluate complete job/browser/reporter wall durations, first-attempt and retry distributions, slowest lifecycle cases, sum of all attempts and passed attempts separately, plus fixed install/container/upload cost. Step totals overlap; leaf values are not CPU measurements. A faster browser step that shifts cost to setup/retries or increases diagnostics storage is not complete acceptance.

Final worker selection needs an **uninstrumented full gate** at the exact reviewed setting, with unchanged runtime/test coverage, and a matching successful main publication pair. Preserve original failed experiments and the four-worker control, and retain successful artifact digest/source-tree checks, full fallback verification, main-only serialized publishing and bounded failure/timing retention. The six-worker experiment by itself has no main publication pair and cannot establish the target.

## Acceptance arithmetic clarification and separate verdicts

The actual new dispatch acceptance is at least20% lower **per-job rounded minutes and projected storage**, plus raw speed improvement, against original307s/eight minutes. My initial report's245.6s arithmetic is a **stricter optional20% raw-time threshold**, not an additional requirement in that clarified dispatch. Preserve the original report and use this explicit qualification. With two one-minute publication jobs, at most six total rounded minutes requires Web≤240s; raw whole-pair improvement and storage must also be checked by the strict tool. More than one timing sample would be needed for a general stability/performance guarantee; the matching accepted pair remains the bounded delivery evidence.

- **Implementation verdict:** no blocker to running this exact isolated six-worker experiment. No approval of six as the permanent/default setting, performance win or final gate is issued before measured results and exact final review.
- **Original efficiency requirement:** still unresolved. Control356s is an instrumented diagnostic sample, not a successful optimized publication pair. TIE-375 remains open; historical TIE-370 and physical/human gates remain separate.
