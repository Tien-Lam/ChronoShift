# Independent CI efficiency investigation — 5 October 2026

Read-only investigation requested in [the saved brief](efficiency-brief.md). Source/head inspected: merged `67be6094afd71dc512e001df632cb8157bc71d45`; successful tested PR source `9c7965acfbcbe034471ad427625eb624792812eb`. No source/configuration edits, builds, browser probes or full-gate repeats were performed. Documentation edits by the delivery agent were present and are outside this investigation.

Actual investigation clock: first command completed at **2026-10-05T05:39:18Z**; final evidence read at **05:41:04Z**. These are read/analysis times, not CI execution times. Local analysis environment: Darwin arm64, mise-managed Bun 1.4.0 and gh. CI evidence: Ubuntu 24.04.5 / runner image `20260927.320.1`, four Playwright workers, pinned official Playwright 1.63.0 image, 1x mobile rasterization, routine 900×640 desktop viewport. No local timing is substituted for hosted runner performance.

## Current acceptance result

Independently fetched current job/step/artifact metadata using `mise exec -- gh api`. It agrees with [the delivery measurement](ci-efficiency-current.json): [Web 37268219679](https://github.com/Tien-Lam/ChronoShift/actions/runs/37268219679) took **301 runner seconds**, from **05:32:14Z to 05:37:15Z**; [Pages 37268626778](https://github.com/Tien-Lam/ChronoShift/actions/runs/37268626778) successfully reused its artifact, with prepare **17s** (**05:37:48Z–05:38:05Z**) and deploy **8s** (**05:38:09Z–05:38:17Z**). Its fallback verification job was skipped.

The pair totals **326s and eight per-job rounded minutes**: six for Web, one for prepare, one for deploy. Against the recorded successful 307s/eight-minute baseline, raw time increased **6.19%**, rounded-minute reduction is **0%**, and projected retained-artifact byte-hours decreased **63.25%**. The current quota/time target fails; the historical 168-scenario sample does not close the expanded-suite target. TIE-375 tracks that remaining work. Artifact API sizes were 374,682 bytes retained one day and 374,673 bytes retained fourteen days; no successful-run failure artifact was present.

## Measured cost distribution

| Current Web job category | Seconds | Evidence/implication |
| --- | ---: | --- |
| Browser gate | 246 | 81.7% of the 301-second job; primary optimization scope |
| Container initialization | 35 | 11.6%; raw log shows Docker pull/extraction |
| mise setup | 5 | Existing cache/setup is already inexpensive |
| Checkout | 2 | Small |
| Subpath build/check | 2 | Keep separate coverage; little saving available |
| Pages upload | 2 | Small; exact artifact remains necessary |
| Formatting / units+build / browser guard | 1 each | Optimizing compilation/install cannot materially meet the target |

Job-level API durations include setup/cleanup and whole-second precision; step totals do not exactly equal the full job duration.

Independently parsed every first-attempt success line in [the raw CI log](ci-final.log), including `ms` and `s` units. There are **249 passes**, matching the final summary; nine configured skips remain explicit. The sum of reported concurrent test durations is **939.247 test-seconds**. Dividing by four gives **234.812s**, already close to the 246s browser step. This supports concentrating on test work rather than adding workers/jobs or assuming startup/scheduling is the main bottleneck. It is not a CPU-utilization measurement: reported durations include fixtures, waits and browser/protocol work, and individual values are rounded.

| Test file | Sum across passing profiles, seconds |
| --- | ---: |
| controls | 182.200 |
| app | 177.060 |
| updates | 130.000 |
| offline-install | 84.332 |
| diagnostics | 77.100 |
| imports | 68.300 |
| privacy | 66.806 |
| live | 45.200 |
| motion | 36.848 |
| responsive | 30.333 |
| uncontrolled | 29.600 |
| engine | 6.826 |
| foldable | 4.642 |

The themed-menu/breakpoint sweep alone totals **94.2s**: Chromium 12.4, Firefox 18.1, WebKit 31.3, Android emulation 12.8 and iPhone emulation 19.6. Controls as a whole account for **19.4%** of observed test-seconds. Even eliminating that entire file would not be a defensible solution or provide the required overall saving by itself.

## Source-backed opportunities and hypotheses

1. **Profile and reduce menu work without reducing its matrix.** `e2e/controls.spec.ts:55` exercises two themes × three widths × six opened controls per profile, retaining draft/results, geometry, contents, focus and CSP checks. `expectPopup` collects bounds via polling and then repeats bounds/style reads in multiple browser round trips. The six general field dimensions are already batched. A low-risk next experiment would batch each popup's geometry/style/content observations into one snapshot after its existing readiness check, preserving every expectation and all real clicks/Escape actions. Keep interaction-triggered assertions retrying on a coherent snapshot. Measure by named `test.step` groups before editing; protocol overhead is a hypothesis, not an established cause.

2. **Investigate full timezone-list rendering as a product cost.** `web/src/components/Choices.tsx` passes the full option collection into an ordinary ListBox, with no explicit virtualization in application code. Independently importing the zone data yields **480 options** (446 zone IDs plus 34 extra aliases). The breakpoint sweep repeatedly opens an empty source zone, where filtering can expose that full list; each item includes text, description and SVG. CPU/DOM/layout cost is plausible across many tests, but this investigation has not measured rendered counts or traced CPU. First record actual option counts, open/close timing, DOM/layout and main-thread samples in the existing sweep. Only if confirmed, prototype supported list virtualization or another rendering reduction that retains all searchable options, arbitrary offsets, keyboard End/Arrow/Tab behavior, explicit selection, hover noncommit, scrolling, accessibility and small-viewport geometry. Do not truncate options or bypass the visible menu in tests.

3. **Separate success captures from assertions.** The sweep explicitly captures six screenshots each for Chromium, Firefox and Android (18 total), although the successful CI run uploads no diagnostics. WebKit/iPhone do not capture them because screenshot stylesheet injection is deliberately excluded from the CSP journey; WebKit is nevertheless slowest, so screenshots cannot explain the whole bottleneck. A bounded A/B measurement may justify success captures only on requested visual-evidence runs while preserving assertions and failure captures. Do not disable motion, change CSP expectations or hide retries. `app.spec.ts` also captures passing accessibility states; inspect actual screenshot contribution before changing it.

4. **Replace fixed observer margins with proven lifecycle completion where appropriate.** The persistent-corrupt-install case explicitly waits 5,000ms per profile after its startup warning, accounting for 25 concurrent test-seconds of fixed waiting. This guards both retries and must not simply be shortened. Consider explicit bounded retry-attempt/completion observations or a narrowly scoped accelerated application-clock fixture, retaining real-time deadline coverage in the hosted journey. Other delay/cancellation waits represent implicated late completions; keep them until a deterministic completion event establishes the same invariant. Likely saving is modest (~6 wall seconds from this one wait), not enough for acceptance.

The container pull is a secondary infrastructure category. Even removing all 35 seconds would leave the current pair at 291 seconds, above the 245.6-second raw target. A replacement/browser cache must retain exact pinned engines, OS libraries and executable/version checks; it needs equivalent cold-cache measurements, including downloads and extraction. Neither faster runners nor additional jobs are established quota-saving solutions here.

## Recommended next work and measurement

Start with step-level profiling of the existing menu sweep plus representative app/update cases on the current Linux runner, at four workers, normal motion, unchanged profile/viewport/raster settings and source identity. Preserve every first-attempt outcome, retry and capability skip. Record actionability waits, collection/render size, screenshot duration, fixture setup and explicit lifecycle waits separately. Use bounded local diagnostics only to explain causality; compare resulting optimizations on the equivalent successful PR + main publishing pair.

Choose the first implementation from measured step evidence: batch test observations if protocol overhead dominates; investigate list rendering if DOM/layout dominates. Success-capture gating and lifecycle wait synchronization are complementary bounded opportunities. No single identified category currently demonstrates the requested saving, so TIE-375 remains open.

With current 25-second publishing overhead and 55 seconds of nonbrowser Web overhead held constant, raw 20% reduction against 307 seconds requires a browser step at most **165.6s**, approximately **32.7% below 246s**. Rounded-minute acceptance of at least 20% against eight means at most **six total minutes**; with two publication jobs, Web must be at most **240s**. Target margin beyond these boundaries rather than relying on a one-second rounding threshold. Reuse the strict measurement tool and retained raw metadata; report quota and storage separately, including failure/debug runs and cache/artifact retention when discussing monthly usage.

**Investigation verdict:** measured current target failure, strongest cost categories identified, no source defect or successful optimization established. **Original report-resolution verdict:** current efficiency requirement remains unresolved. Hosted bug/interaction publication evidence belongs to the delivery reviewers and is outside this performance investigation.
