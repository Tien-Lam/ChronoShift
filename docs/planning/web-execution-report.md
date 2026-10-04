# Web implementation and delivery

ChronoShift is a private, adaptive offline web app at https://tien-lam.github.io/ChronoShift/. [PR #16](https://github.com/Tien-Lam/ChronoShift/pull/16) contains the implementation. The [Linear initiative](https://linear.app/tienlam/initiative/chronoshift-simple-offline-web-app-d90101850ba1) remains active with four projects, eight milestones, 30 web tickets and one canceled native-triage follow-up.

## Native app removal — 4 October 2026

The user explicitly requested removal of native Android support. The active tree now contains the TypeScript web app and no native app/Gradle/SDK/model tooling. Native unit/lint, APK release and model-validation workflow files are removed. The existing native test/release workflows were disabled remotely; model validation was already inactive. Native-only Dependabot PRs #6–13 and #15 are closed; the reusable checkout update remains open.

README, contributor/agent instructions, build/test/architecture/browser-smoke guides and issue/PR templates now describe web development. Dependency maintenance targets Bun and GitHub Actions. The former native-source importer is removed. All 353 historical input cases, metadata and source hash remain unchanged as standalone resilience-corpus.json with immutable Git provenance. CI regenerates corpus-audit.json directly through the browser engine.

TIE-321 is scoped to this web-only cleanup and no longer depends on full physical web acceptance. TIE-322 is canceled: its old native failures were not repaired and are no longer a delivery requirement. The delivery project is renamed Web Delivery. Remaining web device/accessibility/performance work stays open.

## Implemented behavior

The single paste/type → Convert → inspect → Copy flow includes target timezone, source/reference-date corrections, numeric-date conventions, readable dates/offsets, ambiguity and DST alternatives, and clipboard/storage fallbacks. The typed pinned Chrono/Temporal engine runs in a disposable worker with request IDs/cancellation. Unsupported vague expressions and unknown zones need correction; no date-only noon or geographic offset guesses are invented.

The layout reflows across 280–1920 CSS-pixel windows, phones, tablets, short landscape and unfolded displays without losing drafts/results. Progressive CSS viewport segments avoid vertical hinges and confine tabletop scrolling to the upper screen; safe-area insets and touch-sized controls are covered.

Atomic service-worker preparation verifies all required local assets before Offline ready. Cached restart converts fresh input. Supported installed POST shares and explicit update drafts use short-lived single-use local handoffs; normal conversion persists only preferences. Partial installs and missing caches recover without replacing the active release prematurely. Notices for all six production dependency packages are bundled.

## Verification

- Locked/frozen Bun installation, formatting, strict type checks and production builds pass.
- 72 real-engine unit tests pass, including 64 independently specified exact temporal fixtures and all 353 resilience inputs.
- After native removal, all 68 browser scenarios pass locally across Chromium, Firefox, WebKit, Android/iPhone emulation and Chromium hinge/safe-area emulation.
- The corpus audit has zero crashes and 29 differences: 21 intentional ambiguity/date-only differences and eight unsupported informal expressions handled with correction warnings. Corpus comparisons are an inventory, not an accuracy oracle.
- Repository-subpath checks cover manifest/scope, offline restart with fresh input and offline POST sharing.
- The prior [successful Pages CI](https://github.com/Tien-Lam/ChronoShift/actions/runs/37130014093) passed all 68 scenarios without retries and deployed d3abf1a. Cleanup CI and publishing run from the same web-only gate; current results are recorded in the PR and TIE-321.
- Four live HTTPS desktop/Pixel checks cover fresh offline conversion, local-only requests, manifest/scope/MIME and effective HTML CSP. Pages header limitations are documented in the developer guide.
- The public origin exercised update ee5d820 → d3abf1a, rollback d3abf1a → ee5d820 and restoration ee5d820 → d3abf1a. Every transition preserved the existing client's draft on opt-in and converted fresh input after offline close/reopen. [TIE-320](https://linear.app/tienlam/issue/TIE-320/release-the-static-web-app-over-https-with-an-exercised-rollback) records the durable proof; scripts/verify-hosted-rollout.ts reproduces it.

## Remaining web acceptance

Record physical Android Chrome/iPhone Safari/foldable installation and keyboard/folding behavior; actual browser zoom, screen-reader/task acceptance, representative-phone startup/conversion performance, and installed update/share capability. Browser emulation and desktop measurements do not certify these. They concern the web product and do not require native app support. The current capability and remaining-ticket matrix is [web-acceptance.md](web-acceptance.md).

## Update/privacy continuation — 4 October 2026

At `63a2553`, all 98 browser scenarios pass across five core profiles plus hinge/safe-area coverage; 72 unit tests, formatting/type checks, production builds and the Pages-subpath scenario also pass. The 353-input corpus remains crash-free with the same 29 documented differences.

Preview-only release fixtures now have distinct immutable app/CSS/worker assets and incompatible worker contracts. A negative control rejects a mixed worker; old/new tabs successfully convert with their own lazy workers after two successive activations and offline reopen. Single-tab rollback preserves the draft and appearance preferences, clears the temporary draft and removes obsolete caches. These close the outstanding automated multi-version/cache-cleanup coverage in TIE-313.

Privacy scenarios verify expired/future/malformed/oversized update/share handoffs are rejected and erased, blocked update storage preserves the active draft until it can be copied or cleared, and invalid/oversized POST shares offer a paste fallback. Legacy preference migration strips unrelated fields, quota failure keeps conversion usable, and Reset preferences removes the saved record. Reset previously recreated a default record immediately; this is corrected.

`scripts/benchmark-browser.ts` measures the production page with disposable-worker startup, parsing and result DOM updates for both designs. It records fresh-context local startup and stopped-origin offline reopening, with five warmups and 30 measured conversions per workload. The development computer’s browser baseline supplements the original Bun-only measurement; named-phone performance and human accessibility still require physical evidence. Timing benchmarks do not run in CI.

Committed browser reports identify source `63a2553`: 188,418 estimated gzip bytes of JS/CSS/worker assets. Chromium 153 p95 is 54.9–55.1 ms for 2,000-character meetings and 106.4–107 ms for 10,000-character meetings across both designs; WebKit 26.6 p95 is 38–39 ms and 86–87 ms respectively. Cold local navigation-to-form p95 is 54.86/64.99 ms (Chromium/WebKit), warm offline reopening 50.8/54.71 ms. These include documented automation overhead and use a desktop CPU with a phone-sized viewport, not phone hardware/network evidence. See [Chromium report](browser-performance-baseline.json) and [WebKit report](browser-performance-webkit.json).

Optional learned span detection remains a separate benchmark/research ticket. No model is bundled or downloaded by the launch app. Historical native code/releases remain discoverable through Git history, without an active native source directory or workflow.
