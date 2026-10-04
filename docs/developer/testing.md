# Testing the web app

Use mise-managed runtimes and the frozen Bun dependency lock.

```bash
bun install --frozen-lockfile
bun run format:check
bun run check
```

`check` runs strict TypeScript checks, 114 unit tests and the static production build. The 98 temporal fixtures specify expected instants/dates independently of the parser. Relative dates receive an explicit reference instant and source timezone. Tests cover DST folds/gaps, fixed versus regional offsets, ambiguity, range endpoints, date context, city resolution, Unix boundaries, precision, formatting and recovery. A Git fixture verifies identical trees for distinct commits and rejects changed merge content or invalid refs; production publication now follows the main-only artifact verification described below.

For independent review and bug closure, follow [review.md](review.md). A green suite verifies its exercised states; document relevant untested timing, cache history and browser capabilities separately. Parallel review tests need separate ports **and output directories** so one run cannot overwrite another's evidence.

## Browser checks

```bash
bunx --bun playwright install chromium firefox webkit
bun run test:browser
```

The 228 configured scenarios (222 pass; six hard-refresh cases skip Firefox/WebKit profiles because they require Chromium CDP) exercise the production worker on Chromium, Firefox, WebKit, Android Chrome emulation and iPhone WebKit emulation, plus a dedicated Chromium foldable profile. They cover cached close/reopen/new input, clipboard/storage failures, canceled work, HTML/URL injection, updates, cache repair, transient registration failure, delayed readiness responses, transient first registration failures, slow/rejected first installs, stale CDN responses, persistent integrity rejection, POST shares, delayed clipboard/share ownership and invalid-target result/copy recovery, theme/accessibility, ten viewport sizes, real viewport-segment emulation and display safe areas. Update fixtures have distinct immutable assets and incompatible worker protocols; they prove old/new tabs retain their own lazy workers through two successive activations, offline use and rollback. Privacy cases cover handoff expiry/invalid data, blocked update storage, legacy preference migration/reset/quota, and invalid/oversized POST shares.

If a preview is already on port 4213, use `PLAYWRIGHT_PORT=4175 bun run test:browser`. The runner starts its own production server. WebKit stops a dedicated origin and proves uncached requests fail because [Playwright's offline emulation also rejects service-worker responses](https://github.com/microsoft/playwright/issues/42775).

Verify the Pages repository path separately:

```bash
BASE_PATH=/ChronoShift/ bun run build
bunx --bun playwright test --config=playwright.subpath.config.ts
bun run build
```

The subpath scenario checks manifest/scope, fresh offline input and offline POST sharing. Restore the root build before using the default local preview.

## Standalone input corpus

`tests/fixtures/resilience-corpus.json` contains 353 frozen conversion inputs and original metadata. Its provenance points to immutable Git history; tests and CI have no dependency on native sources. Maintain new cases directly in JSON. Corpus resilience/count comparisons are an inventory, not an exact accuracy oracle.

```bash
bun run corpus:audit
bun scripts/benchmark-web.ts
bun scripts/benchmark-browser.ts chromium
```

The deterministic audit writes `docs/planning/corpus-audit.json`; CI regenerates it and checks for drift. Update that report when an intentional parser/fixture change affects it. Exact correctness expectations belong in `temporal.json`.

The browser benchmark runs a dedicated production preview and writes `docs/planning/browser-performance-baseline.json`. Choose `firefox` or `webkit` instead, and optionally pass a report path as the next argument. Build first with `CHRONOSHIFT_SOURCE_COMMIT` set to the full source SHA to identify the measured release. It measures ten fresh-context starts, ten stopped-origin offline reopenings, and thirty measured conversions after five warmups for each Glass Command workload. Conversion timing includes disposable-worker startup, parsing and result DOM updates. `assets` and `totalGzipBytes` retain the JS/CSS-only bundle estimate; `offlineAssets` and `totalOfflineGzipBytes` inventory every final `dist` file, including the service worker, HTML, manifests, icons, notices and release metadata. Gzip estimates exclude HTTP headers. The 390×844 viewport is a desktop browser measurement; it does not emulate phone CPU/network or certify physical-phone performance. Run benchmarks separately from other browser jobs to avoid contention. These measurements are deliberately outside CI timing gates.

## Published acceptance

```bash
bun run test:hosted
```

Four live HTTPS checks include a 21-second idle window beyond the reported startup warning delay, then cover desktop/Pixel profiles, manifest/scope/MIME, effective CSP, local-only requests and fresh input after offline close/reopen. Set `HOSTED_EXPECTED_COMMIT` to assert a particular full release SHA. The existing-client update/rollback probe and artifact restoration procedure are in [web.md](web.md).

Emulation does not certify physical installation, folding, virtual keyboards, actual browser zoom, screen readers or representative-phone performance. Follow [the browser smoke test](device-smoke-test.md) and record these results in Linear.

## CI efficiency

CI runs all 228 configured browser scenarios using four workers on the public repository’s standard four-core x64 Linux runner. It uses the official multi-platform Playwright 1.63.0 Ubuntu image, pinned by digest, with Chromium, Firefox, WebKit and OS dependencies already installed. A version/executable guard requires the image to match the locked dependency; update both together. Bun and Node still use mise-managed pinned versions. CI records traces on the first retry, retaining failure screenshots and HTML diagnostics without recording every passing test. The root build and repository-path build are both tested. Publishing uploads the verified repository-path files directly, without rebuilding in a separate job. Deployment serves architecture-independent static assets.

To exercise an already installed Google Chrome instead of bundled Chromium, use `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome bun run test:browser --project=chromium`. No browser installation is performed by this override; routine CI keeps its pinned bundled browser. TIE-324 regressions use actual caches/workers while injecting a rejected registration or delayed older response, then change target zones and convert. These earlier controlled paths remain bounded evidence. Later matching hosted Chrome evidence reproduced hard refresh followed by continued use of the same uncontrolled tab; the active worker verifies its cache and claims the document before readiness is confirmed. The hard-refresh regressions use actual CDP reloads; the older-worker fixture separately verifies explicit update recovery. See [the report and publication record](../qa/uncontrolled-client-2026-10-05/README.md). Installation regressions accelerate only the page's 15-second deadline to 200ms while using real service workers/caches and server-side delayed, stale or rejected responses; separate installed-Chrome evidence exercises a real 17-second delay. Fresh cache-key retries still require the same exact release hashes, and failed first installations retry registration at most twice without automatic update activation.

PRs run the complete verification gate and retain a Pages artifact for one day; they do not deploy. Main publication reuses only a successful trusted same-repository PR artifact after exact source/release/main-tree, required-check, archive-digest and safe-extraction verification. Missing or unverifiable evidence and manual publication run the full gate. Preparation through deployment is serialized, and only main may publish. Documentation/design/evidence-only changes skip both workflows. Failures retain reports/traces for three days; main rollback artifacts remain available for fourteen days.

Mobile CI profiles rasterize at 1x device pixel density to reduce software rendering of the glass surfaces. Their viewport sizes, mobile/touch settings, user agents, browser engines and test assertions stay the same. Local runs retain the standard Pixel/iPhone high-density profiles, which also pass. CI screenshots use fewer physical pixels; this is not a phone GPU/performance benchmark or physical-device acceptance.

Measure equivalent successful event pairs with the read-only `gh`-based tool:

```bash
bun scripts/ci-metrics.ts --baseline BASELINE_PR_RUN,BASELINE_PAGES_RUN --candidate NEW_PR_RUN,NEW_MAIN_RUN --output docs/planning/ci-efficiency.json
```

The report includes source commits, run links, every job/step duration, per-job rounded-minute estimates and artifact retention byte-hours. Equivalent main-only comparisons require successful complete PR and main publication runs with matching event/workflow mixes; the tool exits unsuccessfully unless rounded-minute and storage reductions reach 20% and raw runner time decreases. The stricter all-metric result is separate. Historical preview measurements use --consolidated-preview and remain separate from the current main sample. Current numbers are in [ci-efficiency.md](ci-efficiency.md). This is a sample comparison, not an account-wide billing statement or a guarantee of future timings. Standard hosted runners are [free for public repositories](https://docs.github.com/en/billing/concepts/product-billing/github-actions); private-repository minute allowances and storage quotas still make reduced usage valuable.
