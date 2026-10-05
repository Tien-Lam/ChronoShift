# Read-only CI bottleneck analysis

Inspection and aggregation: **2026-10-05 10:23:25–10:26:00 UTC**, captured with the clock tool. This report was written afterward. Workspace HEAD observed during inspection: `f8c073a289f2c4af1f369a4588d5e0e74daf392c`. No source changes, browser run, tool installation, workflow dispatch or deployment were performed. GitHub reads used `gh`; offline arithmetic used the existing Bun runtime. Protected memory/design/timeline files were not read or modified.

The best bounded hypothesis is **unnecessary React Aria collection work on unrelated parent renders**, addressed by stable props/filter identity and memoized controls while retaining the complete collection. This has a concrete source mechanism and descriptive CPU-counter support, but no measured candidate benefit. Whole-suite acceptance remains open.

## Current evidence and target arithmetic

Read-only downloads are saved as [Web log](web-37292552858.log), [Web metadata](web-37292552858.json), [Pages metadata](pages-37293327085.json), and [list aggregation](final-log-analysis.json). The final Web run is [37292552858](https://github.com/Tien-Lam/ChronoShift/actions/runs/37292552858), PR head `7631906bdd654fd696596f74b733cf87d415cebf`; the corresponding main Pages run is [37293327085](https://github.com/Tien-Lam/ChronoShift/actions/runs/37293327085), head `a868e4b956caf5d227edc430fc7dca97c0dc2eb6`.

The Web log has 273 distinct ordinals: **264 first-attempt passing rows/nine capability skips**, no failed/retry rows, 116 passing units and the separate passing subpath scenario. The browser summary agrees. No first-attempt diagnostic artifact was uploaded in this run. Its timing reporter was disabled: the existing `actions-upgrade-2026-10-05/final-ci/ci-timing.json` instead belongs to historical run **37288000068**, with 258 cases and a failed first attempt/retry. It must not be presented as the final run's action attribution.

| Cost | Final seconds | Interpretation |
| --- | ---: | --- |
| Web job including setup | 342 | Six rounded minutes |
| Browser step | 285 | 83.3% of Web job; 73.8% of full pair |
| Container initialization | 31 | Largest non-browser Web span |
| Web checkout / mise | 4 / 5 | Frozen install is one second |
| Units and root build | 2 | Includes 116 units; not a dominant cost |
| Subpath build and browser | 3 | Required separate base-path coverage |
| Trusted Pages preparation/deploy job | 44 | One rounded minute |
| Complete equivalent pair | **386** | **Seven rounded minutes** versus 307/eight baseline |

Skipped Pages jobs have empty steps and inconsistent zero/negative API timestamp differences; they are not executed jobs and contribute no runner usage. The executed preparation job is 44 seconds. Its checkout, mise, trust verifier and deployment spans are eight, eleven, seven and eight seconds respectively.

The existing metrics tool distinguishes quota/storage acceptance from its stricter all-metric result (`scripts/ci-metrics.ts:220–245`). With a stable 44-second Pages job, quota saving of at least 20% requires six or fewer rounded minutes, so Web must be **300 seconds or less**: save at least **42 seconds** from this sample. The required separate raw speed condition demands total pair below 307 seconds: save **more than 79 seconds**, hence Web below 263 seconds. The stricter 20% raw reduction demands pair at most 245.6 seconds: save **140.4 seconds**, hence Web at most 201.6 seconds. Storage already has the separately recorded 63.13% surviving-API projected reduction; this analysis changes none of its retention/trust conditions.

The historical baseline had 68 browser scenarios and today's gate has 273. This arithmetic is acceptance against the specified baseline, not a same-workload causal benchmark.

## CPU and workload concentration

Final log resource observations span **09:50:11.444–09:54:56.462 UTC**, 285.018 wall seconds, on four visible x64 CPUs / Intel Xeon 6973P-C. Cgroup `usage_usec` rises from 15,242,548 to 974,010,177: **958.767629 CPU seconds**, averaging **3.3639 CPU seconds per wall second**, approximately **84.1% of four-core capacity**. User/system deltas are 832.675272/126.092357 seconds. Throttling stays zero, memory peak is 7,220,695,040 bytes, and no OOM event is reported.

These are valid monotonic aggregate counters, not a breakdown by rendering/script/test. They show substantial busy work and disqualify interpreting inclusive `expect` spans as wholly removable idle waits. No time-weighted CPU profile rankings are used.

The final 264 passing list durations sum to **1,090.325 concurrent case-seconds**. They are rounded, overlapping test durations, neither CPU time nor exclusive job wall time. Largest families:

| Family | Concurrent case-seconds |
| --- | ---: |
| app | 204.245 |
| controls | 198.200 |
| updates | 142.200 |
| offline-install | 94.100 |
| diagnostics | 86.500 |
| imports | 81.300 |
| privacy | 76.800 |

The theme/breakpoint sweep (`e2e/controls.spec.ts:55`) totals **101.2** across the five applicable profiles: Chromium 13.8, Firefox 20.7, WebKit 33.7, Android 12.9 and iPhone 20.1 seconds. It exercises two themes × three widths × six real menus, preserving geometry, styles, focus, work and CSP (`controls.spec.ts:79–215`). Hypothetically removing its entire cost only gives 25.3 seconds under ideal four-worker balance, while dropping required coverage; optimization of that journey alone has still less headroom. The complete controls family represents 49.55 ideal balanced seconds, also not a measured saving.

Dividing all fixed case costs by four gives 272.58 seconds, only 12.42 below the browser step. That is a simplified scheduling comparison, not a strict lower bound: list rounding, fixture/setup work and contention matter. Reordering projects alone has no evidence of a target-sized saving. Historical two/six-worker, ARM and Bun/Node alternatives remain rejected; this report does not repeat them.

## Concrete hypotheses, ranked

**1. Stabilize collection-related identity and memoize unchanged controls.** `Choices.tsx:131–153` already prepares the options, normalized search text and ID set once at module load; the options array itself is not recreated. However, `ZoneChoice` creates its `commit`, `defaultFilter` and JSX children anew on every component render (`Choices.tsx:170–190,197–229`). Each filter comparison repeats `normalize(query)`, even though the query is identical for every option.

App state includes text, busy, conversion, notices, imports, offline state and preferences (`App.tsx:48–74`); ordinary edits/results change several of these (`App.tsx:190–207,235–236,270–286`). Both zone controls receive freshly allocated App callbacks (`App.tsx:581–584,608–611`). `React.memo(ZoneChoice)` alone therefore cannot skip unrelated App updates.

The installed library supplies a direct mechanism: `node_modules/react-stately/dist/private/combobox/useComboBoxState.js:109–115` memoizes filtered collection on `collection`, `inputValue`, **`defaultFilter`**, and `props.items`. A fresh filter identity invalidates that memo even with unchanged input. `node_modules/react-aria-components/dist/private/ComboBox.js:59–81` memoizes collection-building content on **children** identity and item/configuration props. Fresh JSX can invalidate that content. This establishes recomputation paths; it does not establish how many rows actually commit or how costly each path is.

The preserved [validated dropdown report](../ci-efficiency-2026-10-05/dropdown-profile/report.md) observes 454 options/2,728 popup descendants for the complete menu. Its unsampled threadTicks deltas report roughly 32.7–34.5ms scripting for opening all rows, 30.0–30.6ms filtering to two rows, 43.7–44.0ms clearing to all rows, and 23.8–24.1ms closing. Those local Mac observations support collection lifecycle scripting as a useful hypothesis. They do not attribute those totals to callbacks, filters, individual hooks or Linux throughput. All negative-interval CPU sampler rankings remain invalid and excluded.

A single unrelated parent render can plausibly cause up to 454 query normalizations/filter checks per zone, **908 across two controls**, before any additional React Aria reconciliation. That is an operation-count hypothesis, not 908 measured calls or a CPU-duration estimate. A bounded candidate would stabilize the filter, retain normalized-query caching with bounded lifetime, memoize controls with stable callbacks, and hoist fixed select option arrays. It must preserve callbacks' current-state preference updates and all invalidation ownership. A custom memo comparator that ignores a changing callback risks stale behavior. Stable callbacks should use functional preference updates and the existing ref/setter-based invalidation rules; do not freeze captured `prefs`.

**2. Remove only proven event-observation margins.** Seven literal timeout sites in the configured suite total **7.4 seconds per applicable profile**, 37 concurrent case-seconds across five profiles: 5s persistent corruption, 1s delayed completion, three ×400ms startup guards and two ×100ms diagnostics guards. (`offline-install.spec.ts:136,171`; `motion.spec.ts:48`; `uncontrolled.spec.ts:119,248`; `diagnostics.spec.ts:74,139`). The hosted 21s check is excluded from this gate. Entire removal would imply only 9.25 ideal balanced seconds and weaken evidence. Retry scheduling itself uses real 1s/3s delays (`platform/offline.ts:60,146,176`), while startup deadlines are already accelerated in tests. Only a bounded observer proving terminal retries/late delivery/cleanup could safely remove the surplus margin. The deadline-crossing condition remains necessary.

The validated dropdown report separately observes 10–33ms between actual popup removal and assertion observation. It also observes native entry-animation completion immediately before removal: moving a wait before Escape relocates real work. Keep native 140ms popup motion (`style.css:33,436–438`) and immediate-close coverage. Any observer replacement must prove the same actual removal and focus invariant.

**3. Avoid duplicate unchanged-source build preparation.** Web root and subpath builds both run the complete build script (`web.yml:66–69,91–98`; `package.json` build). Typechecking and notices need not logically be repeated for unchanged source/dependencies, but separate Vite/offline generation and subpath browser validation remain required. The entire subpath span is only three seconds, so the removable fraction is smaller and not target-sized.

Container initialization is 31 seconds, but deleting it is not a free saving: it supplies all three pinned installed browsers and Firefox's tested UID setup (`web.yml:29–40,56–64`). A native-browser download/cache alternative shifts work and carries setup/reliability costs; no evidence supports it here. Even hypothetical removal of all 31 seconds would leave pair355 seconds/six rounded minutes and still fail raw speed acceptance.

Previous menu assertion batching reduced expectations from 886 to376 per profile but changed local sweep wall time only22.791→22.514 seconds, approximately1.2% in that isolated observation. It does not establish substantial removable assertion overhead. The previous Virtualizer candidate remains rejected for reliability and profile provenance; use stable identity as the next bounded hypothesis before changing collection semantics or rendered inventory.

## Targeted experiment design

Root is running an isolated native-UI baseline probe; this role runs no competing browser. Start with matched existing production assets/ports and record exact served release/HTML/JS/CSS identities, browser version, machine, normal motion, viewport/density, focus/scroll and test-origin behavior. WebKit's dedicated origin must serve the candidate bytes; passing a root URL alone does not override that fixture.

1. Measure the unmodified theme/breakpoint sweep and an unchanged-zone parent-update journey. Count ZoneChoice/ChoiceItems renders, filter calls, option/descendant counts and React commit count using bounded, value-free temporary instrumentation. Record raw Performance counter observations **before and after** each Chromium operation; use documented threadTicks and exclude separate profiler windows. Do not derive weighted CPU rankings from invalid samples. Do not add a global full-suite trace.
2. Exercise normal open → filter → clear → close, and leave a zone popup open while an unrelated message edit/completion changes App state. The latter directly distinguishes extra parent-driven work from required query work. Confirm the unchanged zone/selection/list ownership, 454 complete options, filtered nonempty expected aliases, descriptions, wrapping, pointer hover →Tab behavior, deliberate keyboard/pointer commit, freeform offsets and source/target independence. Preserve normal native immediate close/reopen and resize.
3. Try stable `defaultFilter` identity first, then stable callbacks plus memoized ZoneChoice/ChoiceItems as a separate delta. Compare paired ABBA controls/candidates using identical interactions and assertions across the same five profiles. Instrumentation remains identical on both sides; report action wall spans and main-thread deltas separately. A decreased filter/commit count with no wall benefit is not a savings result.
4. Only if the native-UI journey shows a reproducible material gain and exact behavior remains intact should the complete Linux gate run once on the reviewed candidate. Preserve273 configured/264 runnable/nine identical capability skips,116 units/subpath and exact fixtures. Reconcile first attempts/retries/diagnostic markers. Obtain the equivalent successful Web/main-publication pair before quota acceptance. Keep main-only source-tree/digest validation, rollback retention and workflow-wide serialization untouched.

These are experiment proposals, not permission to remove expectations, skip scenarios, suppress normal motion or claim 20% savings. A large enough win must act beyond the single menu sweep or combine multiple demonstrated costs; the current evidence does not quantify that result.
