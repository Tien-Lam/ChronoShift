# Web development

The web app is an independent TypeScript implementation in `web/`. Android remains a reference until web release acceptance. Use the tool versions in `mise.toml`; dependencies and CLI tools are project-local and locked by `bun.lock`.

```bash
mise install
bun install --frozen-lockfile
bun run dev
```

Build and exercise the real offline app:

```bash
bun run check
bun run format:check
bunx --bun playwright install chromium firefox webkit
bun run test:browser
bun run preview
```

Preview is served on `http://127.0.0.1:4173`. Service workers require HTTPS or a loopback origin. Opening `index.html` from the filesystem or a phone pointing to an ordinary HTTP LAN address does not enable offline installation. Deployment is a static copy of `dist/`; no Bun/Node conversion server runs in production.

For a project subpath, set the same base for build and preview:

```bash
BASE_PATH=/ChronoShift/ bun run build
BASE_PATH=/ChronoShift/ bun run preview
```

`BASE_PATH` is `/` or a path with a trailing slash. Never serve a build at a different base. The manifest, navigation fallback, worker URLs and cache scope all share it. The generated service worker version includes every asset and the worker template. Keep `sw.js`, HTML and the manifest revalidated; hashed assets may have immutable caching. Serve JavaScript, CSS and the manifest with correct MIME types, use HTTPS, and enable gzip/Brotli on the host.

The preview server sets a restrictive CSP and avoids request/body logging. GitHub Pages serves the production static app and does not offer custom application response headers. The build injects a CSP meta tag for same-origin scripts/styles/images/fonts/connections/workers, no objects, same-origin base/forms, plus a no-referrer meta tag. Meta CSP cannot enforce `frame-ancestors` or protect a worker response with its own policy. GitHub controls MIME, cache and other response headers; verify these on the live URL. A host that returns an HTML fallback for missing script assets will fail offline preparation.

## GitHub Pages publishing

The site is https://tien-lam.github.io/ChronoShift/, owned by the repository owner. It uses GitHub's public-repository Pages hosting without a conversion backend or purchased domain. `.github/workflows/pages.yml` runs the complete web verification workflow before building at the base path returned by Pages, uploading a 14-day retained artifact, then deploying with pinned official Pages actions. The `github-pages` environment allows only `main` and `codex/offline-web-migration`; PR events cannot publish. The migration branch publishes the preview now. Remove that trigger and its environment branch policy when reviewed main becomes the sole source. Android retirement remains gated separately.

`release.json` identifies the source commit and base path. It participates in the cache version, making releases reproducible and observable. After deployment, run `bun run test:hosted`; optionally set `HOSTED_EXPECTED_COMMIT` to the full deployed SHA. Checks cover HTTPS assets/MIME, effective meta CSP, manifest/scope, local-only requests and new conversion after an offline close/reopen.

For rollback, select a successful **GitHub Pages** run at the desired source SHA, then `gh run rerun RUN_ID --repo Tien-Lam/ChronoShift`. The workflow rebuilds the pinned source and replaces the site; the release file/cache version returns to that source. Re-running a deployment does not revert Git branches. Verify the live release file and hosted checks, then ask an existing client to check for an update and choose **Update now**. Users with old tabs continue on their cached release until opting in. A server rollback cannot forcibly revoke an installed offline version. To restore the latest release, re-run its successful Pages run. Concurrent publications are queued rather than canceled.

## Architecture

- `engine/parser.ts`: pinned Chrono English parsers with bounded military/shorthand/range extensions. No Android bridge or model runtime.
- `engine/convert.ts`: injected reference clock, context, source zones, DST disambiguation, Unix seconds and deduplication. Target changes only reformat results.
- `engine/time.ts`: bundled Temporal compatibility path plus browser Intl zone data; fixed offsets retain offset labels. Seconds and milliseconds are retained when present.
- `engine/worker.ts`: a disposable worker per conversion with request IDs. Editing, clearing and source/date changes invalidate pending work.
- `App.tsx`: responsive accessible form/results, target/city lookup, clipboard and recovery paths.
- `platform/`: versioned preference-only storage, service-worker readiness and short-lived share/update handoffs.
- `sw-template.js` + `scripts/build-offline.ts`: atomic precache, cache-only supported navigation, explicit update activation and offline POST share interception.

Only preferences persist by default. Conversion text stays in memory. A user-accepted update temporarily places the draft in session storage; POST share reception temporarily places text in IndexedDB. Both are single-use and refuse payloads older than five minutes. Abandoned entries are deleted on the next launch/share; a closed browser cannot run a physical erasure timer. Clearing site data removes them immediately. Shared URLs are displayed as text and never fetched. Shares are intercepted locally while the service worker is registered; after clearing site data, reopen the app and restore offline readiness before sharing again. Installation/share-menu availability depends on the actual browser; paste always works.

Old tabs may still need their own hashed worker. Cache cleanup retains older versions while multiple tabs are open and retains one previous version with a single tab. An update never reloads a tab without its Update action. Failed installs delete only the incomplete new cache, keeping the active one intact. If cached assets are cleared or evicted, readiness becomes incomplete; reconnecting repairs all assets via a staging cache before restoring readiness. Runtime dependency notices are generated into third-party-notices.txt at build time. Rebuilding the previous source produces a different service-worker version from the later release and is the rollback candidate; verify it on the chosen HTTPS origin before release.

## Verification and evidence

`tests/fixtures/temporal.json` has independently specified instant/date expectations. Unit checks use the real parser; browser checks run the same fixtures in the built worker. `tests/fixtures/android-corpus.json` preserves all 353 inputs and metadata from `TestData.kt`; resilience/count comparisons are an inventory, not an accuracy oracle.

```bash
bun run corpus:import
bun run corpus:audit
bun scripts/benchmark-web.ts
```

CI runs formatting, type checks, real-engine tests, the frozen production build and all browser scenarios. Chromium/Firefox use network-offline emulation. WebKit uses a stopped dedicated origin plus a negative uncached-network check because of [Playwright issue 42775](https://github.com/microsoft/playwright/issues/42775); it does not skip offline tests.

Before release, record real Android Chrome/iOS Safari and desktop Chrome/Edge/Firefox/Safari versions; offline reopen with fresh input; installed share where supported; actual screen-reader/task checks; phone startup and p95 conversions; host headers and N→N+1→rollback. Emulation and desktop benchmarks cannot close those gates. Keep Android release workflows until TIE-320 and TIE-321 acceptance.
