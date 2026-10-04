# Web development

ChronoShift is a TypeScript web app in `web/`. Native sources and tooling have been removed at the user's request; historical commits and standalone conversion fixtures remain. Use the tool versions in `mise.toml`; dependencies and CLI tools are project-local and locked by `bun.lock`.

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

The site is https://tien-lam.github.io/ChronoShift/, owned by the repository owner. GitHub Pages publishes only main. Same-repository PRs run the full production browser and Pages-subpath gate and retain the tested Pages artifact for one day; PRs have no deployment job. On main, scripts/reuse-pages-artifact.ts accepts only a successful trusted Web PR run with every required check, identical head/tested-release/main trees, the GitHub artifact digest and safe archive paths. Main uploads those exact tested files as a fourteen-day rollback artifact. Missing, expired or unverifiable evidence runs the full reusable Web gate. Manual publication always runs the full gate. The complete publishing workflow is serialized, protecting active deployments from cancellation and preventing a slower older verification from overwriting a newer publication. Documentation/design/evidence-only pushes skip both workflows. Failed browser runs retain diagnostics for three days. The github-pages environment permits only main after cutover. Native maintenance is retired; physical web acceptance remains open.

`release.json` identifies the source commit and base path. It participates in the cache version, making releases reproducible and observable. After deployment, run `bun run test:hosted`; optionally set `HOSTED_EXPECTED_COMMIT` to the full deployed SHA. Checks cover HTTPS assets/MIME, effective meta CSP, manifest/scope, local-only requests and new conversion after an offline close/reopen.

For rollback, select a successful main **GitHub Pages** run at the desired source SHA, then `gh run rerun RUN_ID --repo Tien-Lam/ChronoShift`. The workflow rebuilds the pinned source and replaces the site; the release file/cache version returns to that source. Re-running a deployment does not revert Git branches. Verify the live release file and hosted checks, then ask an existing client to check for an update and choose **Update now**. Users with old tabs continue on their cached release until opting in. A server rollback cannot forcibly revoke an installed offline version. To restore the latest release, re-run its successful publishing run. Superseded verification jobs on the same branch or PR are canceled. Deployment jobs share the `github-pages` concurrency group and are never canceled while active; GitHub keeps at most one pending deployment. Manual reruns remain available for rollback.

Historical migration-branch publishing runs no longer have deployment permission after main-only cutover; restore historical source through a reviewed main change when needed.

For a reproducible existing-client proof, run `bun scripts/verify-hosted-rollout.ts COMMAND_JSON REPORT_JSON` against the initial deployment. Keep it running while deploying the next version, re-running the old run for rollback, and restoring the new run. After each deployment, write `{ "stage": "update" | "rollback" | "restore", "sourceCommit": "FULL_SHA" }` to COMMAND_JSON. The probe requires a waiting update, checks that the old page stays active until opt-in, verifies draft preservation, and closes/reopens offline to convert a fresh message after every transition. It writes a report only after actual assertions pass.

## Architecture

- `engine/parser.ts`: pinned Chrono English parsers with bounded military/shorthand/range extensions. No model download is required.
- `engine/convert.ts`: injected reference clock, context, source zones, DST disambiguation, Unix seconds and deduplication. Target changes only reformat results.
- `engine/time.ts`: bundled Temporal compatibility path plus browser Intl zone data; fixed offsets retain offset labels. Seconds and milliseconds are retained when present.
- `engine/worker.ts`: a disposable worker per conversion with request IDs. Editing, clearing and source/date changes invalidate pending work.
- `App.tsx`: responsive accessible form/results, target/city lookup, clipboard and recovery paths.
- `platform/`: versioned preference-only storage, service-worker readiness and short-lived share/update handoffs.
- `sw-template.js` + `scripts/build-offline.ts`: atomic precache, cache-only supported navigation, explicit update activation and offline POST share interception.

Only preferences persist by default. Conversion text stays in memory. A user-accepted update temporarily places the draft in session storage; POST share reception temporarily places text in IndexedDB. Both are single-use and refuse payloads older than five minutes. Abandoned entries are deleted on the next launch/share; a closed browser cannot run a physical erasure timer. Clearing site data removes them immediately. Shared URLs are displayed as text and never fetched. Shares are intercepted locally while the service worker is registered; after clearing site data, reopen the app and restore offline readiness before sharing again. Installation/share-menu availability depends on the actual browser; paste always works.

Old tabs may still need their own hashed worker. Cache cleanup retains older versions while multiple tabs are open and retains one previous version with a single tab. An update never reloads a tab without its Update action. Cache repair stages verified bytes from the controller's own release cache and fetches only missing or corrupt assets, requiring their exact release hashes. A newer Pages deployment may retire older hashed assets and replace mutable documents. Reusing intact cached files avoids unnecessary failed downloads, but a missing old document may still require choosing the waiting **Update now** action. Waiting updates remain visible through readiness failures and timeouts. Failed staging preserves intact existing assets and removes only its temporary cache. Runtime dependency notices are generated into third-party-notices.txt at build time. Rebuilding the previous source produces a different service-worker version from the later release and is the rollback candidate; verify it on the chosen HTTPS origin before release.

### Detailed console diagnostics

Open **More options → Enable detailed logs** before reproducing a problem. Logging is off by default; the explicit opt-in lasts for the current tab session, including reloads and accepted updates. It works in memory if session storage is denied. Uncheck it or reset preferences to stop future logs. Previously printed console entries remain until the browser clears them.

`[ChronoShift]` console entries record timestamps, field focus/open events, conversion duration/counts, registration attempts, installation states, readiness probe reasons/durations, controller cache version and update availability. The current worker additionally reports missing/corrupt bundled asset paths and bounded repair counts/failure categories. Older installed workers can report only their existing protocol fields until an explicit update is accepted; absent repair details are unknown. Message text, parsed dates/locations, selected zones, clipboard/share content and URL queries are excluded. No diagnostic event history or telemetry is stored or sent; session storage contains only the opt-in flag. Browser-generated errors and the installation-banner notice are independent of this logger.

To investigate a warning, compare `ui.zone-focus`/`ui.zone-open` timestamps with `offline.probe-start`, `offline.probe-result` and `offline.state`. Record the cache version, probe reason/duration, unavailable asset paths, repair failure and whether an update is available. Distinguish a natural warning from a deliberately injected missing cache or network response. Healthy fresh sessions cannot reconstruct an affected older client's cache history.

`CHRONOSHIFT_TEST_SERVER=1` enables preview-only release fixtures in `scripts/test-releases.ts`. They rename every JS/CSS asset, rewrite HTML/worker/precache references and require matching worker message protocols. Each multi-release scenario uses a dedicated origin with an explicit test-only publish control, avoiding dependence on cookies in browser-internal service-worker update requests. Multi-tab tests reject a deliberately mixed worker, then prove lazy workers for releases N, N+1 and N+2 still convert offline without reloading old pages. A single-tab rollback proves draft/theme preservation, single-use draft removal and obsolete-cache cleanup. These fixtures never run on GitHub Pages or enter the production bundle. Resetting all preferences removes the saved preference record instead of recreating a default record.

## Verification and evidence

`tests/fixtures/temporal.json` has independently specified instant/date expectations. Unit checks use the real parser; browser checks run the same fixtures in the built worker. `tests/fixtures/resilience-corpus.json` preserves 353 historical inputs and metadata as standalone web data, with immutable Git provenance. Maintain it directly; resilience/count comparisons are an inventory, not an accuracy oracle.

```bash
bun run corpus:audit
bun scripts/benchmark-web.ts
```

CI runs formatting, type checks, real-engine tests, the frozen production build and all browser scenarios. Chromium/Firefox use network-offline emulation. WebKit uses a stopped dedicated origin plus a negative uncached-network check because of [Playwright issue 42775](https://github.com/microsoft/playwright/issues/42775); it does not skip offline tests.

Physical acceptance remains separate from the user-authorized engineering merge. Record real Android Chrome/iOS Safari and desktop Chrome/Edge/Firefox/Safari versions; offline reopen with fresh input; installed share where supported; actual screen-reader/task checks; phone startup and p95 conversions; host headers and N→N+1→rollback. Emulation and desktop benchmarks cannot close those gates. Dependency maintenance targets Bun and GitHub Actions. Bun's text lockfile is supported by [Dependabot's Bun ecosystem](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference).

Offline navigation uses the final CSP-bearing HTML embedded in the generated
worker. Installation and repair verify that shell against the same release's
SHA-256 before caching it as `index.html`. They do not fetch mutable HTML:
network content filters can inject scripts or change CSP, and Pages may already
serve a newer document. All other runtime assets still require exact integrity.
