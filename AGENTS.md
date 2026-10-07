# Agent Instructions

ChronoShift is an offline, local-only TypeScript web app hosted on Cloudflare Workers Static Assets. Source is in `web/`; native tooling has been removed.

## Development

- Manage runtimes and CLI tools with `mise`; prefer Bun. Install dependencies with `bun install --frozen-lockfile`. Use `gh` for GitHub operations.
- Build with `bun run build`; verify with `bun run check` and `bun run format:check`. Run appropriate Playwright checks for browser, offline or deployment changes. See [testing](docs/developer/testing.md) and [publishing](docs/developer/web.md).
- Keep the manifest, service worker and runtime assets under the production base `/`; retain `/ChronoShift/` as a subpath regression check. No runtime CDN or conversion backend.
- Show ambiguity rather than guessing. Keep source and target zones independent, date/range context bounded, and fixed offsets distinct from regional DST.
- Keep input text out of network requests and permanent storage. Preserve input/results during resize; activate updates only on user action.
- Maintain independent exact expectations in `tests/fixtures/temporal.json` and the standalone `tests/fixtures/resilience-corpus.json` directly.
- Use noninteractive file operations: `cp -f`, `cp -rf`, `mv -f`, `rm -f` and `rm -rf`.

## Review and Delivery

- Store WIP, QA captures and full review reports locally in `.work/<ticket-id>/` (ignored by Git). Keep concise review and acceptance summaries on the PR and ticket; do not commit generated reports or temporary experiments.
- Use separate worktrees for parallel implementation when useful. Coordinate shared delivery, ports and performance measurements with the orchestrator.
- Assume other agents may be working on this device and repository. Use unique ports, browser profiles, output paths and worktree-local builds; stop only processes you own. Coordinate resource-heavy runs and performance measurements, and record concurrent activity when it can affect evidence.

- For substantial changes, use two independent agents with clean context: an adversarial reviewer and a code reviewer. The code reviewer must use the installed `review-agent` skill and remain read-only; the orchestrator saves its returned report. Follow [the review workflow](docs/developer/review.md), reviewing surrounding lifecycle paths as well as the diff. Fix actionable findings and repeat review until both report no blockers and required checks pass.
- Record each reviewer's tested conditions, findings and separate implementation/report-resolution verdicts. Keep full reports, original symptoms, timings/environment, base/head revisions and evidence gaps in `.work/<ticket-id>/`; save concise durable summaries on the PR and ticket. Approval of a bounded fix does not establish that the original report is resolved. When authorized, merge and complete only Linear tickets with matching acceptance evidence. Physical-device testing is outside the current scope; label browser/DevTools evidence accurately and keep unresolved in-scope report or acceptance gaps open.
- Publish only `main`. Reuse successful trusted PR artifacts only after digest and exact source-tree verification; otherwise run the complete gate. Serialize the entire publishing workflow so older deployments cannot overtake newer ones.
