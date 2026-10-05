# Bounded ordinary-conversion synchronization probe

**Result:** retain this as a useful test-only candidate. A local ABBA comparison reproduced substantial assertion observation delay after real DOM completion; a MutationObserver wait followed by the same exact assertions avoided that delay. This is not a full-suite adoption approval or Linux/rounded-minute saving. TIE-375 remains open.

The completed probe ran **2026-10-05 07:54:25.758–07:54:47.673Z** at owned origin **http://127.0.0.1:54093/**. The server received SIGTERM and its exit was awaited at 07:54:47.673Z; a separate saved fetch check confirms that origin no longer responds. Bun records a null exitCode for the signal termination. Analysis clock is 07:55:16.169Z. No application/test/config source changes, rebuild, Actions, commit or Linear mutation occurred. Commands used `mise exec -- bun .../probe.ts` and `.../analyze.ts`; all writes are in this QA folder.

Checkout documentation HEAD was `e66c6449c97fd97e72205aba4815b4225da105be`; unchanged runtime source is **28059a91ec9984dea4d079b3f684b3a27af669f0**, web tree **78dbdbf65b5328416f0b169cc52d3ed9541d02f9**. Before/after direct HTML, release-marker, service-worker and JS observations are status200 and byte-identical, with root base `/`, production testMode=0, version **b5d1df7366de0c5f**, **index-DHi9pTHJ.js**, SHA-256 **b2ec5e8a200f317d260cd7e596c1f9a8d417f55f4379803a39867553791ae640**. This checks four text assets; CSS is an HTML reference, not an independently fetched CSS hash.

Environment: mise Bun1.4.0, Darwin arm64/macOS27, Apple M4 Pro/14 logical CPUs/48GiB. Installed engines: Chromium153.0.8010.12, Firefox155.0, WebKit26.6. Each desktop device profile uses the CI 900×640 viewport and 1× raster, en-AU locale, Australia/Sydney timezone, dark theme and `no-preference` reduced motion. One engine/context runs at a time. This matches the requested viewport/raster, not Linux x64 concurrency, a physical phone or a complete six-project suite.

## Conditions and results

Each engine first sets target UTC and 24-hour display through real existing helpers, then completes one ordinary seed conversion. Three ABBA blocks follow, totaling **36 measured conversions**: six A and six B per engine. A is normal fill→exact assertions; B arms the same observer before fill, waits for its pending→ready DOM transition, then runs the same assertions. A also arms the observer for measurement but never awaits it before asserting. All rows include the same instrumentation. The real250ms production debounce, native Worker creation/completion/termination, motion and app lifecycle are untouched.

Inputs advance synthetically from 5:20pm through5:31pm Tokyo on June18, so the preceding result cannot satisfy the new exact time assertion. Both paths retain exact `toHaveText` assertions for the new UTC time, date and zone plus result count1, each with the same10-second timeout. The date display oracle uses browser Intl to format a **fixed independent UTC instant**, never the app's result DOM. This checks conversion/result identity, not independently testing browser locale formatting. Observer records require busy=true followed by busy=false/state=ready and capture settled time/date/zone. All36 measured rows passed; final input/time/date/zone identities match, pending precedes completion, reduced motion is false and page/probe error lists are empty.

| Engine | A fill→all assertions mean ms | B fill→observer→same assertions mean ms | Local mean reduction ms | A / B post-settle observation mean ms |
| --- | ---: | ---: | ---: | ---: |
| Chromium | 633.622 | 308.594 | 325.028 | 333.917 /5.133 |
| Firefox | 578.594 | 334.809 | 243.785 | 253.833 /6.000 |
| WebKit | 638.411 | 305.199 | 333.212 | 340.333 /5.667 |

Every ABBA block has lower B mean total than A. Raw A totals are bimodal: four of six Chromium rows, three of six Firefox rows and four of six WebKit rows take roughly800–837ms; the remaining A rows take roughly292–333ms. All B rows take roughly299–342ms. The complete data therefore retain fast baseline observations too; selected slow rows must not become an every-conversion claim.

Mean pending→settled pipeline times remain similar: Chromium A294.817/B297.533ms, Firefox A315.167/B318.333ms, WebKit A291.833/B291.667ms. The app does not finish earlier in B. Mean time within the four locator assertions drops from628/568/631ms to4.5/5.3/4.8ms because B calls them after genuine readiness. Total B time includes the observer wait, so this saving is not merely a relocated animation/debounce wait.

Installed Playwright1.63 locator expectations retry with `[20,50,100,100,500]` backoff. These raw results are consistent with completion falling just beyond an earlier observation and incurring a later500ms polling interval. Protocol/evaluation timing influences the exact boundary. No installed dependency was patched. `postSettleObservationMs` uses two browser performance timestamps and includes protocol readback after all assertions; host total durations use host performance timestamps. No cross-domain subtraction is made.

## Preservation and adoption limits

The first setup probe failed before any measured rows because Bun's en-AU month abbreviation (`Jun`) differs from Chromium's (`June`). Its exact source, log, raw evidence and stopped-server records are preserved under `initial-probe/`. This is a probe-oracle setup error, not an application defect. The corrected expected-date rule is identical for A/B and fixed before their actions. No failed measured attempt is discarded or retried.

`raw.json`, `probe.ts`, `probe.log`, `summary.json`, `analyze.ts`, `analysis.log` and server records preserve identities, clocks, all rows/errors and the bounded calculation. Synthetic inputs/results are intentionally included here; this is separate from the production sanitized timing reporter. No screenshot, trace injection or CPU sampler is involved.

This supports a bounded candidate for ordinary positive conversion synchronization. It does not establish that every existing suite assertion suffers the same delay, that all455 concurrent expectation-seconds are removable, or that a helper can replace pending/error/cancellation/update/late-response assertions. A final helper must own its transition, preserve each exact existing assertion/deadline, clean up on timeout/page close and retain failures. The injected observer's10-second guard is a probe bound, not certification of final shared-helper deadline behavior.

No full-suite candidate has been implemented or approved. Local serial warmed contexts and36 observations do not forecast Linux x64/four-worker savings. Any source adoption needs independent review and complete matched hosted first-attempt evidence. The accepted normal publication pair remains442 seconds/eight rounded minutes against307/eight; no TIE-375 completion, phone p95 or historical TIE-370 diagnosis follows from this probe.
