# Agent Instructions

ChronoShift is an offline, local-only TypeScript web app hosted on GitHub Pages. Source is in `web/`; native tooling has been removed.

## Development

- Manage runtimes and CLI tools with `mise`; prefer Bun. Install dependencies with `bun install --frozen-lockfile`. Use `gh` for GitHub operations.
- Build with `bun run build`; verify with `bun run check` and `bun run format:check`. Run appropriate Playwright checks for browser, offline or deployment changes. See [testing](docs/developer/testing.md) and [publishing](docs/developer/web.md).
- Keep the manifest, service worker and runtime assets under the Pages base path `/ChronoShift/`. No runtime CDN or conversion backend.
- Show ambiguity rather than guessing. Keep source and target zones independent, date/range context bounded, and fixed offsets distinct from regional DST.
- Keep input text out of network requests and permanent storage. Preserve input/results during resize; activate updates only on user action.
- Maintain independent exact expectations in `tests/fixtures/temporal.json` and the standalone `tests/fixtures/resilience-corpus.json` directly.
- Use noninteractive file operations: `cp -f`, `cp -rf`, `mv -f`, `rm -f` and `rm -rf`.

## Review and Delivery

- For substantial changes, use two independent agents with clean context: an adversarial reviewer and a code reviewer. Provide intended behavior, revision and scope. Fix actionable findings, add meaningful regression coverage and repeat review until both report no blockers and required checks pass.
- Record findings, fixes and verification in the PR. When authorized, merge and complete only Linear tickets whose acceptance criteria have evidence. Keep unverified physical-device or human acceptance work open.
- Publish only `main`. Reuse successful trusted PR artifacts only after digest and exact source-tree verification; otherwise run the complete gate. Serialize the entire publishing workflow so older deployments cannot overtake newer ones.
