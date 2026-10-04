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

Update notification and activation retain the installed worker identity when the browser has not exposed `registration.waiting` yet. The regression test keeps that slot hidden through the actual Update now click; drafts and preferences survive every activation. Expiry assertions wait for the startup effect to clear temporary storage. CI retains four workers and default browser compositing, with a 900×640 desktop default window; the responsive suite still exercises widths through 1920px and local profiles keep their normal dimensions/density. Documentation/design-only pushes skip both verification and publication. Trials of per-profile WebKit worker caps, disabled compositing and a separate background layer did not reduce measured total usage and were reverted.

Preview CI now combines PR #16 verification and publication. It proves the merge tree and same-repository migration branch are identical before using the branch SHA for release identity; a mismatch fails closed. All 98 browser scenarios and the repository-subpath gate run once before the tested artifact publishes. Main still has full Pages verification. The source-tree negative control raises the unit suite to 73 checks. The environment allows the exact PR #16 merge ref, with no wildcard preview deployment policy.

Final release `4226225` passes [verification and deployment](https://github.com/Tien-Lam/ChronoShift/actions/runs/37175168562): 73 unit checks, 98 browser scenarios without retries, corpus drift, formatting/type/build checks and the Pages-subpath test. Four hosted checks pass against `422622546fabfc795ea8c7f062e600f1a170de47`, including fresh offline conversion and the correct branch release identity. The final preview workload uses 177 versus 307 raw runner seconds (42.35% lower), four versus eight rounded minutes (50% lower), and 83.1% less projected artifact storage. Separate obsolete-cache cleanup reduces current cache bytes 65.38%. [CI evidence](../developer/ci-efficiency.md) identifies the sample scope and main-cutover re-verification gate; it is not an account-wide monthly billing guarantee.

`scripts/benchmark-browser.ts` measures the production page with disposable-worker startup, parsing and result DOM updates for both designs. It records fresh-context local startup and stopped-origin offline reopening, with five warmups and 30 measured conversions per workload. The development computer’s browser baseline supplements the original Bun-only measurement; named-phone performance and human accessibility still require physical evidence. Timing benchmarks do not run in CI.

Refreshed Glass Command reports identify source `944001d`: complete offline assets total 255,458 estimated gzip bytes across 15 files, including the local font and license; JS/CSS-only total is 188,882 bytes. Chromium p95 is 51.2 ms for 2,000 characters and 79.1 ms for 10,000; WebKit p95 is 33 ms and 61 ms. Cold local form p95 is 53.46/67.37 ms (Chromium/WebKit). Chromium offline p95 is 58.09 ms; WebKit offline p50 is 56.54 ms with an observed p95/max outlier of 1076.27 ms retained. These desktop samples include automation overhead and use a phone-sized viewport, not phone hardware/network evidence. See [Chromium report](browser-performance-baseline.json) and [WebKit report](browser-performance-webkit.json).

Linux verification additionally prompted two robustness improvements: every update scenario uses an isolated origin with explicit publishing instead of cookie-dependent internal service-worker requests, and update detection/activation retain the installed worker when `registration.waiting` is exposed later. The fixture server no longer supports cookie-selected releases; explicit publication also covers deliberately broken CSS downloads. Readiness replies from superseded controllers no longer change current state. The rollback regression deliberately hides the waiting slot through both notification and the Update now click, then verifies draft-preserving activation; this deterministic control passes in every profile.

Optional learned span detection remains a separate benchmark/research ticket. No model is bundled or downloaded by the launch app. Historical native code/releases remain discoverable through Git history, without an active native source directory or workflow.

## Independent review and main cutover — 4 October 2026

The user authorized clean-context adversarial/code review, iterative fixes, autonomous merge and completion of accepted Linear tickets. Both reviewers approved after the fixes in review-2026-10-04.md. The final unit set passes 108 checks, including 34 newly specified temporal regression fixtures and publishing trust negative controls. Three new update scenarios expand the browser suite to 113. The 353-input corpus has zero crashes and unchanged 29 differences. Main-only publishing now reuses only digest/tree-verified successful PR artifacts, with full verification fallback and workflow-wide serialization. Actual trusted-run reuse was exercised locally without publication; final GitHub/main/hosted and usage evidence follows after deployment. Physical/browser-human/phone-performance gates remain open; prior draft sequencing is superseded by the explicit merge authorization.

Final cutover evidence: PR #16 merged as 9e7c1cb; Web run 37181181002 passes 108 units, all 113 scenarios without retries and the subpath check. Main Pages run 37181395700 succeeds through exact verified-artifact reuse; only main is permitted to publish. Four hosted checks pass against tested artifact source 158c0b7551f480d0f6fb7330c832738a5a0ff4d8 (tree-identical to merged main). Equivalent PR + main usage is 237 vs 307 runner seconds (22.8% reduction), 6 vs 8 rounded minutes (25%), and 81.74% lower projected retained artifact storage. Both target flags pass. Seventeen accepted engineering tickets are closed after review/merge; TIE-306 remains open for its explicit human screen-reader criterion, as do other physical/human/phone acceptance tasks and optional TIE-302.
