# Independent Linux timing control analysis

Read-only analysis begun **2026-10-05T06:02:44Z**, final evidence/threshold read **06:04:28Z**, report-save/status observation **06:05:29Z**. Shared checkout HEAD **77fbf61b33d0b2752a3f90b20a261f30f0842b0f** already contains the provisional six-worker experiment; this report analyzes the earlier **four-worker control**, source **2d94136249cf67b7ab37efe44401180a976692ad**, Web **37269816926**. It does not approve the six-worker candidate or the withdrawn scalar-batching prototype. No source/configuration edits, builds, browser/CI operations or `dist` changes were performed in this analysis; only this report was saved. Local analysis used mise-managed Bun on Darwin arm64; measurements below originate from the pinned Linux CI runner.

## Reconciled control result

Independently recomputed [raw timing metadata](control-linux-timing.json), checked [job metadata](control-linux-jobs.json), and traced original test sources. The control has **258 attempts: 249 passed, nine skipped, zero retries, zero dropped**. Sum of passed-attempt durations is **1,111,545ms**; sum of all attempts is **1,118,060ms**, including **6,515ms** for capability-skipped attempts. Those totals must retain their labels; 1,111,545ms is not the sum of all 258 attempts.

The job ran **05:54:04Z–06:00:00Z**, **356 seconds**. Browser-step API times are **05:54:58Z–05:59:49Z**, **291 seconds**. Reporter run start **05:54:59.198Z**, duration **290,306.86ms**; its end derived from these values is **05:59:49.504Z**. Container initialization took **37s**; timing-artifact upload **2s**. This draft control has no matching main publication and supplies no new whole-pair acceptance claim.

All-attempt duration /four is **279.515s**, versus 290.307s reporter elapsed: roughly **96.3% of available worker-slot time**, not CPU utilization. Awaiting timers, worker/navigation completions and actionability occupies those slots. Consequently this supports examining throughput with the already-running same-job six-worker experiment, but does not prove that six workers improve CPU-bound work. The prior uninstrumented 939,247ms passed-duration sum was **18.34% lower**; source/profiling overhead and runner variability are not isolated by comparing those individual samples.

## Largest measured categories

Totals below are **passed-attempt leaf-step milliseconds**, not an additive decomposition of CPU or wall time. Sibling operations in `Promise.all` may overlap even when neither has child steps. Expectation totals include locator waits and polling; generic wait totals include real event waits.

| Category | Leaf seconds | Share of passed-attempt duration sum |
| --- | ---: | ---: |
| Expectations | 455.357 | 40.97% |
| Clicks | 138.018 | 12.42% |
| Wait APIs | 104.855 | 9.43% |
| Navigation | 91.251 | 8.21% |
| Page creation | 81.039 | 7.29% |
| Fill | 56.081 | 5.05% |
| Evaluate | 39.036 | 3.51% |
| Screenshots | 1.616 | 0.15% |

Screenshot gating is not a material first target in this sample. Page creation plus navigation is about **172.3 concurrent test-seconds**, a meaningful category but required tab/history transitions must remain. Fixture inclusive total is 114.956s while leaf total is only 11.022s; much of setup includes the page/browser work listed above. Do not add the inclusive fixture/hook totals again or claim fixture-generation removal saves all of them.

| Source file | Passing cases | Summed attempt seconds |
| --- | ---: | ---: |
| app | 60 | 214.125 |
| controls | 20 | 210.835 |
| updates | 25 | 151.923 |
| offline-install | 30 | 97.714 |
| diagnostics | 30 | 91.025 |
| privacy | 25 | 87.215 |
| imports | 15 | 86.297 |
| live | 10 | 52.724 |
| motion | 10 | 38.716 |
| responsive | 10 | 36.559 |
| uncontrolled | 6 | 29.525 |
| engine | 5 | 9.278 |
| foldable | 3 | 5.609 |

Profile sums: WebKit **292.730s/48 passes**, Firefox **244.718s/48**, iPhone emulation **203.184s/48**, Chromium **186.046s/51**, Android emulation **179.258s/51**, foldable **5.609s/3**. Different case counts and lifecycle capability coverage preclude treating these as equivalent engine benchmarks. In particular, Firefox/WebKit/iPhone skip three CDP hard-reload cases each.

## Actionable source families

**Menu sweep (`controls.spec.ts:55`):** five passing profiles total **109.847s**. Clicks contribute **53.237s**, leaf expectations **21.580s**, evaluations **4.178s**. WebKit alone takes **37.462s**, including **21.556s for 42 clicks** (max 1.166s) versus **6.697s leaf expectations**. iPhone takes **22.548s**, with **12.009s clicks**; Firefox **22.379s**, with **9.777s clicks**. Chromium/Android are **14.166s/13.292s**. This changes the local hypothesis: scalar assertion batching is not established as the dominant Linux fix. Click timing bundles actionability, rendering, event processing and protocol/runner delays. Current aggregates cannot identify whether empty timezone lists, small selects or another control dominates those clicks.

Next useful bounded evidence is fixed operation + source-callsite timing (public step location, sanitized relative file/line), or an equivalent predefined operation grouping. Preserve privacy: no selected values, selectors, arbitrary labels or error payloads. Callsite metadata can separate the repeated select/zone/calendar opens without collecting their contents. Keep normal motion and real clicks. The confirmed hundreds of mounted timezone options justify investigating virtualization **only if those list-open operations account for meaningful cost**; current per-test click aggregates are insufficient. The supported Virtualizer/ListLayout path and variable-height/focus risks are documented in [the implementation plan](implementation-plan.md). No virtualization prototype is warranted as the first unmeasured change.

**Delayed import family (`imports.spec.ts:5`):** ten tests (clipboard/share across profiles) total **67.312s**, with **25.571s leaf expectations**, **9.683s navigation**, **6.093s page creation** and **12.792s clicks**. Share tests deliberately seed the real single-use store in a separate tab, close that tab, then exercise converted/cleared/restored drafts. Reusing tabs or seeding from the receiving page would change the original journey and delayed-IDB isolation; do not do so to remove the measured creation/navigation work. An independent fixture-generation/profile improvement might reduce setup without changing these transitions.

**Updates:** old/new/third tabs (`updates.spec.ts:209`) total **49.303s**, including **17.173s wait APIs**; rollback (`:270`) **45.962s**, including **14.695s waits**. Source `activate()` waits for actual `domcontentloaded` concurrently with Update now, then readiness; `convert()` waits for a real worker event and checks the versioned worker URL/result/date. These waits establish explicit update activation and lazy old-worker availability. Their overlap must not be counted twice, and they must not be shortened or replaced with sleeps/forced state. Existing interrupted rollback already synchronizes real redundant-worker completion. Keep these semantic completions.

**Persistent corrupt first install (`offline-install.spec.ts:126`):** **33.703s** across profiles, with **25.021s explicit wait APIs** corresponding to five 5,000ms guards. This is the clearest fixed-duration opportunity. Production retry delays are **1,000ms then 3,000ms**; the existing test already accelerates only its 15,000ms startup deadline to 200ms. Merely replacing the five-second margin with observed final redundant-worker completion can remove only the margin beyond real retries, not the entire four-second retry schedule. A separately justified, narrowly scoped accelerated retry-clock fixture could preserve both retry attempts and failure invariants while reducing that schedule; it must prove registration/install attempt count, final failure/cleanup, absent controller, truthful readiness and usable retained conversion. Retain actual-time hosted coverage. Do not accelerate timers globally or modify production retry delays.

**Motion/live cancellation:** the motion case (`motion.spec.ts:4`) totals **31.432s**, of which **5.021s** is the explicit one-second late-completion margin and **20.818s** leaf expectations. Its Worker proxy delays completion 600ms; replacing the margin requires an explicit signal that the old completion was delivered, followed by the same idle/no-result/copy invariants. Removing the delay or masking motion would lose the race. IME (`live.spec.ts:30`) already observes queued/delivered counters and retains a 700ms old completion; preserve that effective event-driven journey.

**Waiting-update/probe timeout (`diagnostics.spec.ts:232`):** **27.007s**, with **12.359s wait APIs**. The server intentionally stalls mutable release requests while the initial deadline is selectively accelerated; warning/update availability, opt-in reload and recovered draft/readiness remain the point of the case. Do not classify those event waits as expendable sleeps.

## Safe throughput priorities and limits

1. Finish the authorized six-worker **same-runner/job** experiment before choosing concurrency. Compare elapsed whole job, browser step, total attempt durations, first-attempt status/retries/skips, per-profile outcomes, maximum relevant operations and memory/process failures. More overlap can help waiting work but also inflate rendering/startup durations. Same job avoids multiplying charged jobs; no win is established until the full evidence arrives.
2. Collect enough sanitized source-callsite timing to decide whether menu click costs are list rendering or more general actionability/engine contention. Prefer narrowly measured observation/fixture work to a product behavior change. Normal motion, focus, visibility and actual controls remain.
3. Investigate static-only dedicated origins for plain WebKit UI tests if fixture-only timing justifies it. Current `origin` spawns a per-test server with three complete release variants for every WebKit case. Keep per-test isolation, distinct origins/stop handles and every mutable release/offline test on the existing full fixture. Do not share browser contexts, published-version counters, caches or fixture bytes across concurrent tests/builds.
4. Address proved unnecessary fixed margins through explicit lifecycle completion; consider targeted clock acceleration only with matching bounds/regression evidence. Broad timer or debounce suppression would change the tested behavior.

Nine known unsupported cases currently acquire page/origin fixtures before the `beforeEach` capability skip, totaling **6.515s**. Early declaration-time/project-aware skip could avoid that setup while preserving all nine configured skip identities and reasons, but maximum theoretical saving is small (~1.6 four-worker slot-seconds). It must retain declared coverage accounting and not mask unsupported states as passes. This is secondary to normal-use menu and waiting-work categories.

Failed **step** counts in otherwise passing attempts can represent expected rejected network requests, caught polling mismatches or capability-skip control flow. They are not failed test attempts or retries. The control has zero retry attempts; do not hide expected fault injection, and do not report its step counts as a suite failure without matching source/context.

**Investigation verdict:** four-worker control facts reconciled; menu click costs and real lifecycle waits now have stronger source/profile evidence. No optimization or six-worker result is established in this report. **Original efficiency requirement:** remains open. Profiling control elapsed 356s and local prototypes cannot replace a matching successful PR + main publication pair satisfying rounded-minute/storage acceptance and raw speed improvement.
