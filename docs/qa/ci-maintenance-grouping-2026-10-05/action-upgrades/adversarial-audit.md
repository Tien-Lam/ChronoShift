# Independent adversarial audit of Actions PRs 17–21

Prepared only; these upgrades are outside PR 39. No code-review findings read
before this report. No source, Git, GitHub, Actions or Linear mutation, test or
build performed. Writes are limited to audit evidence in this folder.

## Provenance and conditions

- Actual observation clock window: 2026-10-05 08:37:58–08:40:13 UTC, captured
  with `clock.curr_time`; report writing follows. Hosted start/end times below
  come from raw `gh run view` metadata, not this review window.
- Local source HEAD: `66e5fd32f2654e0a61d35ceae6e75b5e4561bc19`; workflow and
  reuse owner hashes in `adversarial-metadata.json`. GitHub remote:
  `Tien-Lam/ChronoShift`.
- Darwin 27.0.0 arm64; mise-managed Bun 1.4.0 and gh 2.100.0.
- Read-only `gh pr view`, `gh pr diff`, `gh run view` and `gh api` inspected exact
  PR metadata/diffs and official action manifests/READMEs at proposed pins.
  The first action-manifest request used an unquoted query path, failed locally
  on zsh globbing, and was corrected with quoting; only corrected reads count.
- Preserved `pr-N-metadata.json`, `pr-N.diff`, `pr-N-run.json`, official action
  manifests/READMEs, deployment polling source and relevant runner log fragments.
  Hashes and source pin mapping are in `adversarial-metadata.json`.

| PR | Exact proposed head | Proposed action/version | Base at observation |
| --- | --- | --- | --- |
| 17 | `0dbe08e8d3740f616a3f048888ab3191519269a4` | checkout 7.0.1 | `9e7c1cbadfa3d213ca819c1bc1e813e39a8aae44` |
| 18 | `2a4f823c7c2177379581922879c128a58a5454e4` | deploy-pages 5.0.1 | `28059a91ec9984dea4d079b3f684b3a27af669f0` |
| 19 | `76528ecd9c341311769b56f015a10e4272e08ef4` | configure-pages 6.0.0 | `28059a91ec9984dea4d079b3f684b3a27af669f0` |
| 20 | `16da028ed3428cc5b1940ea0aa8a461306e609a0` | upload-artifact 7.0.1 | `28059a91ec9984dea4d079b3f684b3a27af669f0` |
| 21 | `a9a9a05a1e8a1ca1b63bf33f8055818679f1c30e` | upload-pages-artifact 5.0.0 | `9e7c1cbadfa3d213ca819c1bc1e813e39a8aae44` |

## Competing failure paths and findings

**Checkout 17:** [official pinned README](https://github.com/actions/checkout/blob/3d3c42e5aac5ba805825da76410c181273ba90b1/README.md)
documents Node 24 (runner >=2.327.1), temporary-file credential storage and the
fork-checkout guard for `pull_request_target`/`workflow_run`. Our triggers avoid
that guard, and no unsafe override is needed. Existing exact-head run
`37181435922` successfully executed checkout and cleanup, then mise/Bun, in the
actual pinned Playwright container with `--user 1001:1001` on runner 2.337.0.
This supports that container path, not the Slim prepare job. **P3 cleanup:** both
changed checkout pins still have `# v4` comments although the pin is v7.0.1;
correct those comments in a future upgrade implementation.

**Upload artifact 20:** [official pinned action manifest](https://github.com/actions/upload-artifact/blob/043fb46d1a93c77aae656e7c1c64a875d1fc6a0a/action.yml)
uses Node 24 and adds direct upload. Direct mode would ignore configured names
and remove the ZIP contract, but `archive` defaults to true and no caller enables
direct mode. Retention and hidden-file defaults remain compatible with these
diagnostic/timing callers. Both changed upload steps were skipped in exact-head
run `37276390625`; a green check therefore provides no execution evidence for
the upgraded action. ESM executes through the runner, independently of Bun/mise.

**Pages upload 21:** [official pinned composite](https://github.com/actions/upload-pages-artifact/blob/fc324d3547104276b827a68afc52ff2a11cc49c9/action.yml)
still creates `artifact.tar`, uploads it through a pinned v7 implementation and
does not set `archive: false`. Thus static inspection preserves the ZIP with one
`artifact.tar`, `github-pages` name and digest expected by our verifier. New
hidden-file input defaults false, matching previous exclusion behavior. Exact-head
run `37181447538` successfully executed the Pages upload in uid1001/container on
runner 2.337.0. No retained artifact was returned by its artifacts API at this
review time, so downloaded ZIP bytes/digest were not independently validated.

**Configure Pages 19:** [official pinned action manifest](https://github.com/actions/configure-pages/blob/45bfe0192ca1faeb007ade9deae92b16b8254a0d/action.yml)
uses Node 24; optional generator/enablement remain unset, so there is no proposed
generator rewrite or new enablement permission requirement. Exact-head run
`37276396741` skipped this action because `inputs.publish-pages` was false.
Neither the uid1001 fallback invocation nor the Slim reuse invocation is proven
by this green check. The diagnostics upload in that run succeeded; that does
not establish a first-attempt browser pass, which this audit does not claim.

**Deploy Pages 18:** [official pinned action manifest](https://github.com/actions/deploy-pages/blob/368f82528645a54fb793d4d04e342629a3f51346/action.yml)
keeps `github-pages`, preview false and `page_url`, with Node 24 and current
Pages/id-token permissions compatible with our GitHub.com workflows. No deploy
step runs in PR Web verification. [Pinned polling source](https://github.com/actions/deploy-pages/blob/368f82528645a54fb793d4d04e342629a3f51346/src/internal/deployment.js)
adds capped successful-poll backoff (30 seconds before jitter) plus error backoff;
this can delay observing completion. The action's 10-minute timeout exceeds the
existing 5-minute prepare/deploy job bounds, so slower deployments can hit the
job bound first. This mismatch already exists and is not a newly proven defect,
but neither Slim reuse nor fallback deployment has upgrade acceptance evidence.

All diffs change action pins/comments only. Required gate names, exact-tree and
SHA-256/ZIP/tar checks, `safeArchive`, main-only preparation, job dependencies,
permissions and full-workflow serialization remain unchanged. Current fallback
requires prepare success and avoids a second publication after failed reuse
deployment. No static trust weakening was found. Older individual-head gates
cannot verify a later combined upgrade tree or current lifecycle owners.

## Verdicts and remaining acceptance

**Static implementation risk:** no demonstrated functional blocker in proposed
pins. PR 17 has the nonblocking version-comment correction above. This audit is
preparation, not approval to merge the five PRs.

**Runtime/deployment acceptance:** incomplete. Checkout/Pages-upload have bounded
historical uid1001 execution evidence; configure/deploy/conditional v7 diagnostic
uploads lack upgraded-path execution evidence. Future authorized integration
should preserve the names/pins/gates and verify the exact final combined tree,
Pages ZIP digest/archive extraction, Slim trusted reuse and the complete fallback
publication path. Record runner identity and deployment timing; do not infer
first-attempt success from green conclusions. No dispatch or merge is authorized
by this report.

**TIE-375:** unresolved; this audit establishes no grouped creation, avoided run
or 20% usage reduction.
