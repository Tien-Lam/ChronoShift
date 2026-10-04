# ChronoShift

ChronoShift is a private offline TypeScript web app hosted at https://tien-lam.github.io/ChronoShift/.

Follow [AGENTS.md](AGENTS.md). Manage runtimes with mise, use Bun for JavaScript/TypeScript tooling, and use gh for GitHub operations.

## Commands

```bash
mise install
bun install --frozen-lockfile
bun run check
bun run format:check
bun run test:browser
bun run test:hosted
```

## Key files

- `web/src/App.tsx`: paste/convert/copy UI and request lifecycle.
- `web/src/engine/`: real Chrono parsing, explicit source/reference clock, Temporal DST interpretation and formatting.
- `web/src/platform/`: preference-only persistence, offline readiness and short-lived handoffs.
- `web/sw-template.js` and `scripts/build-offline.ts`: atomic offline preparation and explicit updates.
- `tests/fixtures/temporal.json`: independent exact conversion expectations.
- `tests/fixtures/resilience-corpus.json`: standalone input inventory, maintained directly.
- `.github/workflows/pages.yml`: verified GitHub Pages publishing.

Show ambiguity rather than guessing. Keep source/target zones independent, date/range context bounded, fixed offsets distinct from regional DST, and input text out of requests and permanent storage. Preserve work during resizing and update only on user action.

See [pipeline](docs/architecture/nlp-pipeline.md), [merging](docs/architecture/merge-philosophy.md), [testing](docs/developer/testing.md) and [publishing](docs/developer/web.md).
