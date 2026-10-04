# Testing the web app

Use mise-managed runtimes and the frozen Bun dependency lock.

```bash
bun install --frozen-lockfile
bun run format:check
bun run check
```

`check` runs strict TypeScript checks, 73 unit tests and the static production build. The 64 temporal fixtures specify expected instants/dates independently of the parser. Relative dates receive an explicit reference instant and source timezone. Tests cover DST folds/gaps, fixed versus regional offsets, ambiguity, range endpoints, date context, city resolution, Unix boundaries, precision, formatting and recovery. A Git fixture verifies that preview publication accepts distinct commits with identical trees and rejects changed merge content or invalid refs.

## Browser checks

```bash
bunx --bun playwright install chromium firefox webkit
bun run test:browser
```

The 98 scenarios exercise the production worker on Chromium, Firefox, WebKit, Android Chrome emulation and iPhone WebKit emulation, plus a dedicated Chromium foldable profile. They cover cached close/reopen/new input, clipboard/storage failures, canceled work, HTML/URL injection, updates, cache repair, POST shares, theme/accessibility, ten viewport sizes, real viewport-segment emulation and display safe areas. Update fixtures have distinct immutable assets and incompatible worker protocols; they prove old/new tabs retain their own lazy workers through two successive activations, offline use and rollback. Privacy cases cover handoff expiry/invalid data, blocked update storage, legacy preference migration/reset/quota, and invalid/oversized POST shares.

If a preview is already on port 4173, use `PLAYWRIGHT_PORT=4175 bun run test:browser`. The runner starts its own production server. WebKit stops a dedicated origin and proves uncached requests fail because [Playwright's offline emulation also rejects service-worker responses](https://github.com/microsoft/playwright/issues/42775).

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

The browser benchmark runs a dedicated production preview and writes `docs/planning/browser-performance-baseline.json`. Choose `firefox` or `webkit` instead, and optionally pass a report path as the next argument. It measures ten fresh-context starts, ten stopped-origin offline reopenings, and thirty measured conversions after five warmups for each design and workload. Conversion timing includes disposable-worker startup, parsing and result DOM updates. The 390×844 viewport is a desktop browser measurement; it does not emulate phone CPU/network or certify physical-phone performance. Run benchmarks separately from other browser jobs to avoid contention. These measurements are deliberately outside CI timing gates.

## Published acceptance

```bash
bun run test:hosted
```

Four live HTTPS checks cover desktop/Pixel profiles, manifest/scope/MIME, effective CSP, local-only requests and fresh input after offline close/reopen. Set `HOSTED_EXPECTED_COMMIT` to assert a particular full release SHA. The existing-client update/rollback probe and artifact restoration procedure are in [web.md](web.md).

Emulation does not certify physical installation, folding, virtual keyboards, actual browser zoom, screen readers or representative-phone performance. Follow [the browser smoke test](device-smoke-test.md) and record these results in Linear.

## CI efficiency

CI runs all 98 browser scenarios using four workers on the public repository’s standard four-core x64 Linux runner. It uses the official multi-platform Playwright 1.63.0 Ubuntu image, pinned by digest, with Chromium, Firefox, WebKit and OS dependencies already installed. A version/executable guard requires the image to match the locked dependency; update both together. Bun and Node still use mise-managed pinned versions. CI records traces on the first retry, retaining failure screenshots and HTML diagnostics without recording every passing test. The root build and repository-path build are both tested. Publishing uploads the verified repository-path files directly, without rebuilding in a separate job. Deployment serves architecture-independent static assets.

PR #16 consolidates preview publishing and merge-ref verification. `verify-preview-tree.ts` proves the merge tree and same-repository migration branch have identical files/blobs/modes; differing trees fail closed. The job then checks out the identical branch commit for accurate release identity, runs every test and publishes that exact artifact. The migration branch no longer triggers a duplicate Pages verification. Other PRs receive full merge-ref verification without publishing. Main and manual Pages publication still use the full reusable gate. Superseded verification is canceled per branch/PR while active deployments are protected. Documentation/design/evidence-only changes skip both workflows. Failures retain reports/traces for three days; publishing artifacts remain available for 14 days.

Mobile CI profiles rasterize at 1x device pixel density to reduce software rendering of the glass surfaces. Their viewport sizes, mobile/touch settings, user agents, browser engines and test assertions stay the same. Local runs retain the standard Pixel/iPhone high-density profiles, which also pass. CI screenshots use fewer physical pixels; this is not a phone GPU/performance benchmark or physical-device acceptance.

Measure equivalent successful event pairs with the read-only `gh`-based tool:

```bash
bun scripts/ci-metrics.ts --baseline BASELINE_PR_RUN,BASELINE_PAGES_RUN --candidate NEW_PUBLISHING_PR_RUN --consolidated-preview --output docs/planning/ci-efficiency.json
```

The report includes source commits, run links, every job/step duration, per-job rounded-minute estimates and artifact retention byte-hours. Consolidated mode accepts only the explicit full PR verification/preview-deployment topology, with the tree proof, complete browser gate, subpath test and sole Pages artifact. Ordinary comparisons still require identical event mixes. The tool exits unsuccessfully unless rounded-minute and storage reductions reach 20% and raw runner time decreases; the stricter all-metric result is separate. Current numbers are in [ci-efficiency.md](ci-efficiency.md). This is a sample comparison, not an account-wide billing statement or a guarantee of future timings. Standard hosted runners are [free for public repositories](https://docs.github.com/en/billing/concepts/product-billing/github-actions); private-repository minute allowances and storage quotas still make reduced usage valuable.
