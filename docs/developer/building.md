# Building ChronoShift

ChronoShift is a static TypeScript web app. The runtimes in `mise.toml` and dependencies in `bun.lock` are pinned; no native SDK is required.

```bash
mise install
bun install --frozen-lockfile
bun run dev
```

The development server supplies live reload. Service-worker caching is tested in the production build:

```bash
bun run check
bun run format:check
bun run preview
```

Open http://127.0.0.1:4173. Offline setup runs in the background; the header has no connection-status badge. For a development check, wait until the main element has `data-offline-ready="true"`, then verify fresh conversion after offline reopening. Opening HTML directly from the filesystem does not enable service workers.

## Repository layout

- `web/`: browser UI, engine, worker, platform helpers and public assets.
- `scripts/`: static build, preview, dependency notices, corpus audit and verification tools.
- `tests/`: real-engine unit tests, exact temporal fixtures and a standalone resilience corpus.
- `e2e/`: browser, offline, responsive, hinge and hosted checks.
- `.github/workflows/`: web verification and Cloudflare static publishing.

## Subpath compatibility build

```bash
BASE_PATH=/ChronoShift/ bun run build
BASE_PATH=/ChronoShift/ bun run preview
```

Use the same trailing-slash base path for building and serving. All assets, the manifest and service worker share it. Production uses `/`; GitHub Actions publishes the verified root `dist/` with the pinned project-local Wrangler. The subpath build is a separate compatibility check. No Bun server runs on the host.

See [web architecture and publishing](web.md), [testing](testing.md) and [device acceptance](device-smoke-test.md).
