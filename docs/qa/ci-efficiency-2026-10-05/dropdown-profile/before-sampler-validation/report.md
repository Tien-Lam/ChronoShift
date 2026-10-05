# Bounded dropdown attribution on unchanged main runtime

This local investigation uses immutable runtime source
**28059a91ec9984dea4d079b3f684b3a27af669f0**, web tree
**78dbdbf65b5328416f0b169cc52d3ed9541d02f9**. Root's existing build was served at
**http://127.0.0.1:4298/** with production testMode=0 and base=/; no rebuild,
source/config/test edits, motion suppression, screenshots, CI dispatch or source
commit occurred. The owned server was stopped at **07:35:11Z**. Only this QA
folder was written. Documentation HEAD changed to 094e70c between runs; immutable
runtime source/web tree and served bytes did not change.

Actual asset verification before/after both profiles records version
**b5d1df7366de0c5f**, **index-DHi9pTHJ.js**, JS SHA-256
**b2ec5e8a200f317d260cd7e596c1f9a8d417f55f4379803a39867553791ae640**,
and corresponding HTML, CSS reference, release marker and service-worker hashes.
Both profiles confirm identical served bytes. Environment: Darwin arm64/macOS
27.0.0, Apple M4 Pro/14 logical CPUs/48GiB visible RAM, mise Bun 1.4.0, installed
Chromium 153.0.8010.12. This is neither Linux Actions nor a representative phone.

## Conditions and measured observations

Three ordinary open/filter/clear/close cycles at each of 1280×900 and 390×844 ran
**07:31:04.722Z–07:31:10.139Z**, 36 operations. Twelve additional sampled
operations ran **07:32:16.303Z–07:32:19.259Z**. Native motion remained enabled
(no-preference, popup entry 0.14s), real clicks/fills/Escape were used, and list
readiness plus two animation frames were observed. No screenshots or Playwright
trace stylesheet injection occurred; application CSP records are empty in both
viewports/runs, with no page errors.

CDP Performance used its documented **threadTicks** duration domain, alongside
Chromium timeline events and a separate one-millisecond JS sampling pass. Nested
action/assertion wall windows include actionability/protocol calls, assertion
observation and two-rAF instrumentation. The CPU pass's counter window also
contains Profiler.start and protocol instrumentation: metrics were read before
starting the profiler and after the observed action window. Task/script/layout/style
deltas are **not additive** partitions; sampling timeDeltas include idle/program
and the profiler's broader measurement interval, so they are not exact function
CPU costs or utilization. Raw records and reproducible
aggregation are in profile.json, cpu-run/profile.json, summary.json and analyze.ts.
The official [Performance protocol](https://chromedevtools.github.io/devtools-protocol/tot/Performance/)
and [Tracing protocol](https://chromedevtools.github.io/devtools-protocol/tot/Tracing/)
describe the APIs; installed Playwright protocol types confirm threadTicks.

Means below retain first/cold and subsequent warm iterations rather than selecting
a favorable subset. n=3 for every viewport/operation, not a powered benchmark.

| Operation                   | 1280px wall / task / script / layout / style ms | 390px wall / task / script / layout / style ms |
| --------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| Small select open           | 72.2 /17.0 /7.7 /0.4 /2.2                       | 71.9 /17.8 /7.9 /0.4 /2.4                      |
| Small select close          | 218.6 /14.6 /3.2 /0.3 /2.2                      | 210.3 /13.1 /3.0 /0.3 /2.0                     |
| All timezone options open   | 107.0 /54.7 /34.5 /3.8 /5.1                     | 103.8 /51.5 /32.7 /3.5 /5.1                    |
| Filter to two options       | 67.1 /43.5 /30.6 /0.4 /0.6                      | 66.8 /40.9 /30.0 /0.4 /0.6                     |
| Clear filter to all options | 85.6 /54.5 /43.7 /2.5 /1.7                      | 81.2 /56.1 /44.0 /2.5 /1.8                     |
| All timezone options close  | 54.7 /25.7 /23.8 /0.05 /0.20                    | 49.1 /26.1 /24.1 /0.05 /0.19                   |

The full timezone surface mounts **454 options /2728 popup descendants**;
filtered surface two/17; small select three/22. Closing all rows still takes about
24ms scripting while layout is about0.05ms. This points toward large-collection
mount/update/unmount work, rather than layout/reflow being the dominant cost in
these windows. It does not establish exactly which hook or library optimization
would improve Linux throughput.

## Short sampled stack attribution

The sampled bundle addresses are explicitly **zero-based CDP lines/columns**:
for example, CDP line17 means editor line18. They were compared read-only with the exact served
minified code and installed library source, without regenerating source maps.
Observed stack frames include:

- CDP line17,column103735 (editor line18): React Aria overlay position update callback; source
  matches private overlays/useOverlayPosition.js. This does bounding measurements,
  scroll anchoring and immediate positioning styles, plus a second state render.
- CDP line17,column90602 (editor line18): ListBoxItem implementation using useOption/useHover
  and collection/selection context; source matches react-aria-components' ListBox.
- CDP line11,column14194 (editor line12): generic DOMElement render/ref handling; source matches
  react-aria-components/private/utils.js; nearby merged-ref callback line11,column11225.
- CDP line7,column95235 (editor line8): React hook-effect cleanup loop (minified gl), observed
  during filter/clear/close. This shape mapping is not a full symbolic source map.

For example, the 1280px open sample includes 7.4ms sampled self weight in overlay
positioning and 3.1ms in DOMElement; filter/clear/close samples contain DOM/ref,
option hooks and effect cleanup. Most sampled time is idle/program, and every
individual function weight is sparse/noisy. Do not add nested frames together,
assign program time to React, or claim that one callback explains all script time.
The exact coordinates and sampled records are retained for review.

**Causal hypothesis worth narrowing:** mounting/reconciling/removing the entire
option collection and its per-row refs/slot/hooks costs main-thread scripting on
open and input changes; overlay positioning adds real but smaller work. Inspect
and count those lifecycle operations next before proposing a candidate. Stable
render/prop identity or a bounded collection-lifecycle change may merit a local
matched experiment if it demonstrably removes repeated work while retaining all
454 DOM options, collection identities, wrapping, accessible descriptions, focus,
search/custom offsets/aliases and ownership. No such candidate is implemented or
approved here. Previous Virtualizer candidate remains rejected for reliability;
this profile is not permission to reintroduce it or remove ARIA semantics.

## Small-select close wait directly observed

Four additional normal-motion close observations ran
**07:34:48.381Z–07:34:49.557Z**. A MutationObserver recorded actual popup removal,
and the existing entry animation's finished promise recorded completion. It does
not change app animation, rendering or selection behavior.

| Condition                         | Native entry animation     | Popup removed after observer start | Assert observed after removal |
| --------------------------------- | -------------------------- | ---------------------------------- | ----------------------------- |
| Close during entry, first         | Running                    | 171.2ms                            | 10.3ms                        |
| Close after entry settles, first  | Already finished naturally | 5.9ms                              | 2.8ms                         |
| Close during entry, second        | Running                    | 156.9ms                            | 33.1ms                        |
| Close after entry settles, second | Already finished naturally | 7.7ms                              | 3.0ms                         |

Early-close animation finished about 1–2ms before actual removal. The library's
Popover uses useEnterAnimation/useExitAnimation; the observed lifecycle waits for
the running entry animation. CPU sampling independently records **175.339ms idle
sample weight** within a **214.263ms CPU-profile interval** (summed sample weights
214.202ms). The nested action/assertion/two-rAF wall interval is **203.008ms**;
these are distinct instrumentation intervals rather than 175ms idle out of a
203ms CPU window. Thus the large close wall measurement is **native animation
lifecycle plus observer/protocol/assertion delay**, not hundreds of milliseconds
of layout/script execution. Preserve normal motion and the immediate-close
journey. Moving a wait before Escape merely moves that time; it is not a speed win.
Event-based observation could reduce only the measured10–33ms polling margin and
would require proving the same actual hidden/removed/focus invariant. It cannot
justify dropping animation/assertions or explain the whole efficiency shortfall.

## Attribution and next-step verdict

The Linux instrumented control still establishes menu sweep 109.847 concurrent
test-seconds across five profiles: 53.237s clicks, 21.580s leaf expectations and 4.178s
evaluation. Its Mac counterpart is not an exact CPU comparison. Root's Bun/Node
ABBA CLI probe showed no useful gain, so this report proposes no CLI migration.
The local evidence makes a collection lifecycle scripting hypothesis more useful
than a general CSS/layout hypothesis, but does **not** authorize another Actions
sweep or predict a quota win. The whole-menu family alone cannot credibly satisfy
the current large whole-pair shortfall; waits and coverage elsewhere remain real.

TIE-375 remains unresolved at the strict normal pair 442 seconds/eight rounded
minutes. This is a bounded explanatory profile, not implementation or acceptance
approval, performance improvement, phone p95, or diagnosis of TIE-370's historical
cause. Two setup failures are retained under initial-probe/ and invalid-time-domain/:
a stale visible Offline ready assumption (current readiness is a main attribute)
and the unsupported threadTime name. They are probe errors, not application defects.

Raw Chromium timelines total 19.2MB; exact gzip copies total 1.46MB are also saved.
Keep the gzip form if publishing evidence to avoid needless repository growth;
the uncompressed originals remain local for inspection. No artifact/trace upload
or Git commit was performed by this role.
