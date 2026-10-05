# Independent harness analysis

**Finding: no retained-evidence-backed harness optimization can credibly deliver the target-sized saving while retaining the complete workload and its isolation.** Reordering projects, changing worker counts, reusing contexts/origins, removing assertions, suppressing motion and reviving the rejected polling observer are not recommended. This is analysis, not implementation approval or original-report resolution.

Current checkout is `2abac48a103064b9f967c8f8595a6fce9cab30f3`, web tree `e8a7963096c8dcb09de5a259a966cf1b7aa595d9`. First explicitly recorded inspection clock was **2026-10-05 11:33:04 UTC**, after initial read-only source/report inspection; it is not claimed as the actual beginning of those earlier reads. Offline arithmetic ran **11:33:59.977–11:33:59.982 UTC** using mise-managed Bun 1.4.0 on Darwin arm64. Final reporting clock is recorded separately below. Only this owned QA subdirectory was written. No application/test/config source change, build, browser/server run, GitHub operation, Actions dispatch, dependency installation or ticket mutation occurred. Protected untracked memory/design/uncompressed timeline files were not read or changed.

## Actual setup and scheduling

`playwright.config.ts` enables fully parallel execution, four CI workers, one retry and six projects: three foldable Chromium cases plus the five established browser profiles. The root global server is started once with test-mode enabled and `reuseExistingServer: false` (`:79–82`). Default contexts use en-AU/Sydney. Normal motion is retained; only the dedicated reduced-motion case opts into its tested preference. Mobile CI density is 1x; routine desktop CI viewport is 900×640, with separate responsive journeys retaining the wider widths.

`e2e/fixtures.ts:13` creates a **test-scoped** dedicated Bun server for every WebKit/iPhone case and any explicit isolated-origin case. Other ordinary Chromium/Firefox/Android tests use the global server while retaining Playwright's fresh context/page fixture. Dedicated origins own release publication state and interrupted-request counters in `scripts/serve-web.ts:7`. `disconnect` (`fixtures.ts:58`) stops the actual server for dedicated origins and asserts an uncached request rejects. This is essential for WebKit, whose offline flag also blocks literal service-worker responses; replacing the stopped origin with an offline toggle or sharing origin mutable state changes the exercised lifecycle.

Isolated-origin cases occur in updates, first installation, hard-refresh/readiness, cache diagnostics and selected app/privacy release journeys. Publication variants include immutable incompatible-worker assets, stale/corrupt/filtered responses, partial updates, delayed install responses and retired assets. Origin reuse requires reset of both publication/counters and irreversible disconnect state, while fresh origins avoid cache/registration collisions. It is not a drop-in setup optimization that preserves current isolation.

The installed locked Playwright 1.63.0 runner is inspectable in `node_modules/playwright/lib/runner/index.js`: `createTestGroups` at2384 makes individual parallel jobs absent all-hooks/serial grouping; `_findFirstJobToRun` at5539 chooses a runnable queued group; `_scheduleJob` at5560 prefers a matching idle worker hash; `_runJobInWorker` at5584 restarts when project/fixture hash differs. `node_modules/playwright/lib/common/index.js:2054` includes project ID in that hash. The configured projects have no dependency barrier: they enter one phase, and the saved starts show Firefox overlapping Chromium, WebKit overlapping Firefox, and mobile phases overlapping their predecessor. Separate browser invocations/project jobs would add launches/gate setup; there is no whole-project idle barrier to remove.

`playwright.subpath.config.ts` separately creates its own production origin and Chromium context after the `/ChronoShift/` build. Its fresh offline/POST-share/manifest/scope assertions cannot be replaced by the root build. The workflow uses a nested output directory to preserve full-gate unexpected-attempt evidence.

## Independently reaggregated retained timing

[aggregate.ts](aggregate.ts) reads existing raw JSON/logs only. [aggregate.json](aggregate.json) preserves actual analysis clocks/environment, input digests, current source digests, all273 current ordinary list rows, per-family costs, operation sums and occupancy. No timing result was selected from a newly executed experiment.

| Retained run | Structured cases/attempts | Reporter span | Sum of attempt durations | Occupied four-slot capacity | Fixed-duration ideal gap |
| --- | ---: | ---: | ---: | ---: | ---: |
| Web37269816926 earlier four-worker control | 258/258; no retry | 290.307s | 1,118.060s | 96.671% | 10.792s |
| Web37288000068 Actions-upgrade instrumented run | 258/259; one failed original+passed retry | 361.308s | 1,388.463s | 96.449% | 14.192s |

The second sample independently corroborates the earlier scheduling conclusion under a slower AMD run. Occupancy is **test wall occupancy**, not CPU utilization. The ideal arithmetic keeps observed test costs fixed, divides their concurrent sum by four, and compares with reporter span. It does not predict effects of changed contention or provide a strict scheduling bound. Both sampled projects overlap and all slots are heavily occupied. At most a small fixed-cost balance opportunity is visible, not the roughly73s whole-pair raw reduction required against the latest380s pair and307s baseline.

Raw operation costs in concurrent seconds:

| Operation | Earlier control | Later instrumented run |
| --- | ---: | ---: |
| Browser launch | 5.630 /23 launches | 8.428 /24 launches |
| Context create | 3.274 /258 | 4.188 /259 |
| Context close | 6.056 | 7.986 |
| Leaf fixture spans | 12.072 | 15.206 |
| Inclusive fixture spans | 121.470 | 158.380 |
| Page create | 84.903 /341 | 109.913 /342 |
| Navigation | 91.251 /360 | 123.767 /361 |
| Click | 138.018 | 176.363 |
| Leaf expect | 455.357 | 546.439 |
| Explicit wait API family | 104.855 | 113.118 |
| Screenshot | 1.616 | 2.249 |

Parent fixture/hook totals include nested browser/page/action work; they are not repeated server-generation time. Leaf spans do not add up to isolated CPU or removable runner time. Page creation/navigation include browser/renderer/protocol cost, real app load and readiness. Reducing them by sharing state undermines fresh-cache, privacy, reopen and worker-lifecycle checks. Browser reuse across Chromium/Android projects might reduce a few launches, but even eliminating all launch cost would be immaterial and introduce project/environment coupling.

The current ordinary gate Web37292552858 has no structured step report. Independent parsing retains **273 rows,264 passes,nine skips**, with1,090.325 concurrent seconds of rounded passing-case durations. Browser step285s /Web job342s is recorded in `docs/qa/copy-focus-2026-10-05/final-ci/summary.json` and original review. Simple fixed-cost arithmetic1,090.325/4 =272.581s leaves about12.419s versus the285s browser step; this excludes skipped fixture time and includes rounding/startup limitations. It is not new precise occupancy evidence.

Largest current list families are app204.245s, controls198.2s, updates142.2s, offline installation94.1s and diagnostics86.5s. The five full themed-menu sweeps sum101.2s: Chromium13.8, Firefox20.7, WebKit33.7, Android12.9 and iPhone20.1. They preserve native menu entry/exit, six menus, six width/theme combinations, geometry, keyboard focus, retained draft/results and CSP checks. Their total concurrent costs are only descriptive; they are not a101s serial runner saving. Browser-only production layout/collection work inside these actions belongs to the runtime analyst's attribution, not an established harness wait opportunity.

Current ordinary Linux resource bracket is285.018s, aggregate cgroup CPU958.767629s, approximately3.364 processor-seconds per wall second over four visible CPUs. No OOM/throttle deltas were observed. The earlier AMD instrumented bracket used1,256.637790 CPU-seconds in362.257s, about3.469 CPUs. Neither attributes cost to app script versus browser/protocol/server, but neither supports treating all expectation spans as empty runner delay.

## Candidate screens and evidence gaps

1. **Lazy release factory:** already independently disqualified. Prior original report and factory record show5–7ms construction on M4 Pro, unchanged input/output bytes, with process startup excluded and warm filesystem caches. No Linux gain follows, and deferring work merely moves it to first POST on release journeys. Do not repeat this or present inclusive fixture time as its budget.
2. **Worker count/ARM/runtime:** previous two/six-worker, ARM and Bun/Node experiments were inconclusive or rejected under differing conditions. This analysis performs none and proposes none.
3. **Event helper/polling:** held conversion observer already failed to establish hosted savings. Current source uses original exact assertions. Generalizing it to menu disappearance changes synchronization/cleanup and native animation sequencing; no retained matched Linux evidence demonstrates meaningful removable lag. Do not revive it merely because the expect family is large.
4. **Literal waits:** persistent corruption's5s window crosses actual bounded retries; motion's1s window crosses a delayed600ms worker after cancellation;400ms startup guards cross the accelerated200ms deadline;100ms diagnostics checks prove quietness. Removing waits loses the temporal negative expectation. A final-retry signal could conceivably trim excess margin, but would need independent no-activation/staging/ownership evidence and still retain real retry horizons. This is not a target-sized candidate.
5. **Protocol/assertion batching:** geometry/style scalar checks already use batched DOM snapshots in the controls sweep. Replacing locator assertions with one custom result predicate changes diagnostics/retry/visibility semantics. Scalar matching CPU is not separately timed, so no target gain follows.

**Recommendation:** preserve the harness and use the production analyst's semantically complete candidate only if its attribution shows material repeated work. A future harness proposal must first prove enough avoidable work in a matched current273-case, normal-motion, isolated run, retain every assertion, and then receive complete hosted/pair evidence. This analysis provides no permission to dispatch such a run and no20% claim. The current structured timing is from258-case samples, with a retained retry in the later sample; the exact273-case ordinary gate exposes only rounded case timing. These evidence limits prevent a causal harness optimization conclusion or efficiency-ticket closure.

Final report-writing clock: **2026-10-05 11:34:58 UTC**.
