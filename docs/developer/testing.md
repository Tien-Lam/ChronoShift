# Testing the web app

Use mise-managed runtimes and the frozen Bun dependency lock.

```bash
bun install --frozen-lockfile
bun run format:check
bun run check
```

`check` runs strict TypeScript checks, 72 real-engine unit tests and the static production build. The 64 temporal fixtures specify expected instants/dates independently of the parser. Relative dates receive an explicit reference instant and source timezone. Tests cover DST folds/gaps, fixed versus regional offsets, ambiguity, range endpoints, date context, city resolution, Unix boundaries, precision, formatting and recovery.

## Browser checks

```bash
bunx --bun playwright install chromium firefox webkit
bun run test:browser
```

The 68 scenarios exercise the production worker on Chromium, Firefox, WebKit, Android Chrome emulation and iPhone WebKit emulation, plus a dedicated Chromium foldable profile. They cover cached close/reopen/new input, clipboard/storage failures, canceled work, HTML/URL injection, updates, cache repair, POST shares, theme/accessibility, ten viewport sizes, real viewport-segment emulation and display safe areas.

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
```

The deterministic audit writes `docs/planning/corpus-audit.json`; CI regenerates it and checks for drift. Update that report when an intentional parser/fixture change affects it. Exact correctness expectations belong in `temporal.json`.

## Published acceptance

```bash
bun run test:hosted
```

Four live HTTPS checks cover desktop/Pixel profiles, manifest/scope/MIME, effective CSP, local-only requests and fresh input after offline close/reopen. Set `HOSTED_EXPECTED_COMMIT` to assert a particular full release SHA. The existing-client update/rollback probe and artifact restoration procedure are in [web.md](web.md).

Emulation does not certify physical installation, folding, virtual keyboards, actual browser zoom, screen readers or representative-phone performance. Follow [the browser smoke test](device-smoke-test.md) and record these results in Linear.
