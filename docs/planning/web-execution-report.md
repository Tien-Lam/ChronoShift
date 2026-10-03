# Web migration execution

The approved plan is published to [Linear initiative I-4](https://linear.app/tienlam/initiative/chronoshift-simple-offline-web-app-d90101850ba1). It contains four projects, eight milestones and TIE-292 through TIE-321, with milestone memberships and blocking relations. Actual identifiers/URLs are in `offline-web-linear-map.json`; planning keys remain stable for traceability.

## Implemented

The production web app provides a single paste/type → Convert → inspect → Copy flow, examples, device/target timezone selection, source/reference-date corrections and locale/display preferences. It shows exact dates, offsets, ambiguity alternatives, DST gaps/folds and assumptions. Clipboard/storage errors retain a usable manual path. Text stays local; there is no model download, account, conversion API or external runtime asset.

The typed engine uses pinned Chrono and bundled Temporal in a cancellable worker. Regional zones use event-date DST rules; explicit EST/PST remain fixed. The migration fixes global first-date propagation, cross-date merging, arbitrary offset city labels and date-only invented times. The adapter preserves seconds/milliseconds and range endpoints. Unknown zones and unsupported informal clock expressions produce correction warnings.

Builds include notices for all six production runtime packages (MIT, ISC and Apache-2.0). The PWA precaches all required assets, confirms readiness, reopens offline, accepts supported offline POST shares, persists preferences only, and waits for an explicit update action. Temporary shared text/update drafts are consumed and removed. Partial updates retain the current version.

## GitHub Pages and adaptive preview, 4 October 2026

The user chose GitHub Pages. The preview is published at https://tien-lam.github.io/ChronoShift/ through pinned official Pages Actions, after full web verification. The `github-pages` environment permits only main and the migration branch; PR events cannot publish. The first published source is ee5d8207841a10dd7a33285356ba0303e55625bc, [successful deployment run](https://github.com/Tien-Lam/ChronoShift/actions/runs/37129610428). HTTPS is enforced, all assets are under `/ChronoShift/`, and the static HTML enforces a same-origin CSP plus no-referrer policy. Pages header limitations are recorded in the developer guide.

The adaptive layout uses fluid/container reflow, safe-area padding, 16px controls, touch targets and short-landscape spacing. Ten viewport sizes from 280 to 1920 CSS pixels retain draft/results in five browser profiles. Three Chromium tests exercise actual viewport-segment media queries: vertical-hinge panel separation, upper-screen tabletop scrolling and notch/home-indicator insets. Browsers without the segment API retain the normal responsive layout. The API follows the [Chrome viewport segments documentation](https://developer.chrome.com/blog/viewport-segments-api-shipped).

68 scenarios pass locally (the original 55 plus 10 responsive and three foldable scenarios), with the additional repository-subpath check passing. Initial Pages CI completed successfully with 67 first-pass scenarios and one successful retry: the iPhone update test inspected storage before reload finished. The test now explicitly waits for DOMContentLoaded; five consecutive local iPhone update runs pass. Four additional checks pass against the public HTTPS origin in desktop and Pixel browser profiles, including offline close/reopen with fresh input, local-only asset requests, manifest/scope/MIME and an actually blocked inline script.

The release file identifies the source commit and participates in the cache version. Hosted update/rollback evidence is tracked separately from preview publishing. Physical Android/iPhone/foldable installation, folding/keyboard behavior, screen-reader/task acceptance and phone performance remain open gates; publishing the preview does not mark Android retirement complete.

## Local verification, 3 October 2026

- Type check and production build pass with the locked mise/Bun toolchain.
- Latest code [GitHub web CI passed on b395c68](https://github.com/Tien-Lam/ChronoShift/actions/runs/37127793996), including frozen install, all browser/subpath checks and build/test artifacts.
- 72 unit tests pass, including 64 independent temporal fixtures and real execution of all 353 imported Android corpus inputs.
- 55 browser scenarios plus one repository-subpath scenario pass in Chromium, Firefox, WebKit, Android Chrome emulation and iPhone WebKit emulation. Each profile runs the 64 exact fixture expectations in the production worker.
- Scenarios cover cached close/reopen followed by fresh input, ambiguity/copy/paste, preference restart/storage denial, input recovery and keyboard shortcuts, 320px light/dark/reduced-motion accessibility checks, worker failure/late-response cancellation, single-use offline POST sharing, explicit update draft restore and incomplete-update recovery, cache-loss/reconnection repair and inert HTML/URL injection.
- WebKit offline tests stop the origin and verify uncached network access fails; this avoids a verified [Playwright offline-emulation defect](https://github.com/microsoft/playwright/issues/42775).
- Production JavaScript/CSS total approximately 183 KiB gzip, including the parser worker. The development-machine Bun benchmark measured p95 approximately 10 ms for 2,000 characters and 45 ms for 10,000 characters. These are estimates/desktop engine timings, not phone or startup acceptance. Exact details: `web-performance-baseline.json`.

The Android corpus audit has zero crashes and 29 differences: 21 concern intentional ambiguity/date-only expectations, and eight concern vague business/colloquial expressions. Military `HHmm`, `3a/3p` and `between 3 and 5pm` gaps were fixed deterministically. `EOD/COB`, half/quarter phrases without a reliable full interpretation and `3ish` require an explicit clock time. They are not silently converted using a partial match. Full findings: `android-corpus-audit.json`. ML Kit-versus-web accuracy has not been measured on an Android device; this remains part of TIE-296.

## Outstanding release evidence

- Actual Android/iOS installed-mode restart/share and desktop branded-browser checks; machine emulation is not real-device proof (TIE-311, TIE-314, TIE-315, TIE-317).
- Manual screen-reader, 200% zoom and first-time task completion checks (TIE-309).
- Multi-tab, incompatible asset versions, cache cleanup and deployed rollback exercises (TIE-313, TIE-314).
- Representative phone startup/performance and production-host/privacy failure-path audit (TIE-318, TIE-319).
- Static HTTPS host/domain and preview/release configuration, followed by release gates and Android retirement (TIE-320, TIE-321).
- Optional learned temporal-span benchmark (TIE-302); research recommends a small learned tagger plus deterministic normalization, but no model has been trained/exported/benchmarked yet.

Android sources, tests, APK releases and existing maintenance PRs remain until cutover acceptance. The implementation branch can be reviewed and run now; the initiative remains active.

The retained Android CI initially failed during SDK setup because the action default requests the discontinued `tools` package. Test/release workflows now explicitly request `platform-tools`. The [subsequent run](https://github.com/Tien-Lam/ChronoShift/actions/runs/37126768788) passes SDK setup and lint, then reports **110 failures out of 855 Android unit tests** on unchanged Android sources. These failures remain visible; the web checks are independent and passing. [TIE-322](https://linear.app/tienlam/issue/TIE-322/triage-the-110-failures-in-retained-android-conversion-tests) tracks legacy-suite triage as a separate migration follow-up, and the PR remains a draft.
