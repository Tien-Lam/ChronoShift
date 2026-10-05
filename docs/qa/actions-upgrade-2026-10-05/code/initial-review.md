# Independent code review — grouped Actions upgrade

Observation interval: actual UTC clocks `2026-10-05 08:52:37` through
`2026-10-05 08:55:59`. Report writing is subsequent to this interval. Reviewer
received the saved dispatch brief and no adversarial verdict. Failure paths were
derived before relying on root-owned validation. This is source inspection, not
a runtime test report.

Base: `0fb0b915a1e1f2ab19613ad1f8ac9dae0eec43cc`. Original grouped PR #40 head:
`79c114bbe6823f70456a53f2a10e5428fc6263b6`, tree
`614d8dc99ccb7e5ea16a7001ef44c7acd28ddd1e`. The original diff changes twelve
Action references in `.github/workflows/web.yml` and `pages.yml`; checkout's
two version comments are stale (`v4`) and were already scheduled for correction
in the brief. The exact local correction was inspected during the same overall
observation interval; its verdict is recorded separately in `exact-source-review.md`.

Environment: macOS arm64 shared workspace, explicit cwd
`/Users/tien/Developer/ChronoShift` for every shell operation. Existing mise
`/opt/homebrew/bin/mise` manages Bun `1.4.0` and gh `2.100.0`; `command -v`
resolved both into the mise installs directory, and `mise exec -- bun --version`
and `mise exec -- gh --version` confirmed these versions. No installation,
tests/build, Actions dispatch, Git/source/GitHub/Linear mutation was performed.
Writes are restricted to these review records and official source snapshots.

## Scope and independently derived failure paths

1. Node 24 action execution could fail before shell steps on a runner lacking
   the required runtime, or against incompatible container libc. Checkout's
   official README requires runner 2.327.1 for Node 24 and 2.329.0 for
   authenticated Git inside a Docker container action. The Web job uses the
   unchanged official Ubuntu 24.04 Playwright image at UID/GID 1001; Slim
   preparation and normal deployment use GitHub-hosted runners. Node installed
   by mise is separate from the runner-owned JavaScript Action runtime.
2. Checkout credentials now live beneath `RUNNER_TEMP`, with `.git/config`
   includeIf references. A UID/mount mismatch can break checkout or cleanup.
   Official source writes the host temp credential path, adds host and Docker
   includeIf entries, and removes matching includeIf values and temp credential
   files in post cleanup. The workspace/temp owner and all Git defaults remain
   unchanged. Actual final-run checkout and post cleanup are still required.
3. Checkout v7's new guard can reject a fork head in a privileged trigger. Its
   source applies only to `pull_request_target` and PR-derived `workflow_run`.
   These workflows use `pull_request`, trusted main `push`, `workflow_dispatch`
   and `workflow_call`; no unsafe opt-in is introduced. Same-repository PR
   publishing and main-only deployment guards remain intact.
4. Mise v5 changes runtime, bootstrap/download integrity, cache key and PATH
   behavior. It defaults to a stable mise release at least 24 hours old and
   verifies cached mise before execution. Exact Bun `1.4.0`, Node `26.8.1`, gh
   `2.100.0` remain in unchanged `mise.toml`; no mise lockfile was found. Web
   installs all configured tools; Slim retains `install_args: bun gh`.
   Cache keys include platform/runner image/config hash and install-argument
   hash, distinguishing Slim's partial install from Web's full install.
   The action still executes `mise install` after restore, prepends bin/shims,
   and exports mise PATH additions through `GITHUB_PATH`. No project `[env]`
   exports or bootstrap are configured. Wings remains default false, including
   the publisher job with OIDC permission. Neither cache hit nor outage behavior
   was executed by this reviewer.
5. Artifact v7's optional raw-file mode could change the verifier's ZIP/digest
   contract. It is opt-in: `archive` defaults true. Pages v5 still creates
   `$RUNNER_TEMP/artifact.tar`, tar dereferences links, excludes `.git`, `.github`
   and hidden files by default, and passes just this tar to its separately pinned
   uploader v7.0.0. The bundled official SDK upload code selects ZIP unless
   `skipArchive`, hashes the same stream sent to blob storage, and finalizes
   `sha256:<hash>`. Artifact ID/digest outputs retain their names. The verifier
   still requires one `artifact.tar` ZIP member, checks the API digest, bounds
   size, rejects unsafe tar paths/links, and requires exact PR/main/release trees.
   No source incompatibility found. Actual downloaded artifact/public bytes are
   root-owned evidence, not established by metadata or source inspection.
6. Configure Pages v6 retains its token, enablement defaults, metadata outputs
   and existing-site GET path; the action comparison shows the runtime migration
   rather than a changed permissions contract. No static-site-generator input
   is set. Deploy Pages v5 retains artifact name, OIDC/token requirements,
   `page_url`, error-count and timeout defaults. Its polling adds 1.5x capped
   backoff and 20% jitter: nominal 30-second cap can produce a 36-second sleep.
   Existing five-minute job bounds are shorter than its ten-minute action
   timeout, so outer cancellation and SIGTERM cancellation remain relevant.
   This is an inherited deadline limitation with a changed observation cadence,
   not demonstrated runtime success or a newly established blocker.

## Trust and surrounding lifecycle

The required-step names used by `trustedRun()` are unchanged and still include
the explicit Pages build upload. Ordinary trusted PR runs can upload Pages but
skip configure Pages because that step requires `inputs.publish-pages`.
Main prepare validates trusted successful same-repository PR evidence, digest,
safe archive and exact source trees before reupload/deploy. Rejected reuse and
manual dispatch run the complete reusable Web gate. Failed reused preparation,
upload or deployment does not fall through to a second publication. Workflow
and deployment concurrency, permissions, retention, base `/ChronoShift/`, image
and version guards are unchanged. No app, browser tests, fixtures or timezone
behavior changes appear in the grouped diff.

Generic uploader v7 has two distinct conditions: timing metadata requires
explicit instrumentation and its file; diagnostics requires failure or a saved
failed-attempt marker and excludes cancellation. The filenames include run and
attempt and retain one/three-day lifetimes. Multiple diagnostics paths remain
valid with archive true. A success in the instrumented timing branch will not
establish the failure diagnostics branch.

## Source provenance and commands

All remote reads used `gh pr view 40`, `gh pr diff 40`, and `gh api` against the
project or primary official Action repositories. Immutable action contents,
official tag JSON and source compare patches are saved in `official/`.
Read `AGENTS.md`, `docs/developer/review.md`, the dispatch brief, workflows,
`mise.toml`, `scripts/reuse-pages-artifact.ts`, `scripts/ci-environment.ts`,
publishing and CI-efficiency docs. `rg --files`, focused `rg`, `cat`, `sed`,
read-only Git revision/diff/blob reads and SHA-256 hashing support the audit.
One first Web-content API command failed because its unquoted query was treated
as a zsh glob; a quoted repeat succeeded. Large GitHub contents API base64
returned an empty bundled uploader file; raw-media API retrieval succeeded and
the actual bundled file was inspected. Neither transient read issue was an
implementation failure.

Verified official version → immutable commit:

| Action | Version | Commit |
| --- | --- | --- |
| actions/checkout | 7.0.1 | `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| jdx/mise-action | 5.0.1 | `7a4e45a543138629540c9a1616d08632b893e492` |
| actions/configure-pages | 6.0.0 | `45bfe0192ca1faeb007ade9deae92b16b8254a0d` |
| actions/upload-pages-artifact | 5.0.0 | `fc324d3547104276b827a68afc52ff2a11cc49c9` |
| actions/deploy-pages | 5.0.1 | `368f82528645a54fb793d4d04e342629a3f51346` |
| actions/upload-artifact | 7.0.1 | `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` |
| Pages composite's actions/upload-artifact | 7.0.0 | `bbbca2ddaa5d8feaa63e36b76fdaad77386f024f` |

The official v7.0.0→v7.0.1 source comparison changes package version but no
Action metadata or upload source, supporting the shared ZIP/digest contract.

## Findings and separate verdicts

Implementation: **no concrete migration blockers found within static scope**.
Correct the known stale checkout comments, then retain final exact-head gate,
artifact and publication validation. No skipped conditional path is marked
passed by this report.

Original report/acceptance: **migration runtime acceptance remains unverified
by this reviewer**. The feature has no original application bug to reproduce.
The PR API showed original automatic Web run 37285626930 green, but this reviewer
did not reconcile its full runner logs, first-attempt inventory or artifacts.
This does not establish generic uploader, configure/deploy, exact Slim reuse,
manual fallback, cancellation, cache-hit, rollback, public bytes or browser
acceptance. Root owns final implementation runtime and publication evidence.
No claim of speed, 20% improvement, monthly avoided usage, physical-device or
human acceptance is made. Historical unavailable artifact bytes stay unknown.
