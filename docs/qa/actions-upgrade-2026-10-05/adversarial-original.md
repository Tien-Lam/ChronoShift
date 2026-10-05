# Independent adversarial review: grouped Actions upgrade

Implementation verdict: approved within the static migration scope; no blockers
found at `416f94e559a8b49237c58ca44455db8a6067a043`. Runtime acceptance is
separate and remains unobserved by this reviewer. Original-report verdict: not
applicable to a reproduced application bug; migration/publication acceptance is
still unverified. This report cannot close a performance target or physical-device
acceptance gap.

## Provenance and independence

- Base: `0fb0b915a1e1f2ab19613ad1f8ac9dae0eec43cc`.
- Initial immutable PR #40 head: `79c114bbe6823f70456a53f2a10e5428fc6263b6`.
- Final local implementation reviewed: `416f94e559a8b49237c58ca44455db8a6067a043`.
  The final delta from the initial head changes only both checkout version
  comments and adds the saved dispatch brief; the action pins are identical.
- Actual source/command observation window: 2026-10-05 08:52:43 UTC through
  08:55:43 UTC, read from `clock.curr_time`. Report writing follows this window.
  Individual network-request start/end clocks were not captured.
- All shell commands used explicit cwd `/Users/tien/Developer/ChronoShift`;
  local zsh execution, `gh` for every GitHub read. No tools were installed and
  no tests, builds, Actions dispatch, Git/source mutation, GitHub mutation or
  Linear mutation were performed. Only this report and copied official source
  evidence were written. No browser journey or runtime runner was exercised.
- Competing paths were derived and sent to the implementer before seeing runtime
  gate evidence. No other reviewer's report/verdict was consulted. Implementer
  results and earlier individual-PR success observations were not used as proof.

Initial `git show` failed because the PR object was not yet locally available;
immutable GitHub contents reads then supplied both workflows. The final local
objects became available and were verified with `git show` and `git diff`.
Other read failures: an initial guessed repository URL returned 404; two unquoted
API query paths were rejected by zsh; the guessed toolkit `artifact@6.2.0` tag
returned 404. Correct repository/query reads succeeded. No retry or first-attempt
runtime claim is made.

## Scope, commands and official sources

Inspected both workflow blobs at the final revision, PR file patches, unchanged
`scripts/reuse-pages-artifact.ts`, `tests/publishing.test.ts`, `mise.toml`, the
publishing documentation and review workflow. `git diff BASE HEAD --stat` showed
only two workflow files and the dispatch record; the verifier, its tests and
runtime configuration diff was empty. Existing tests were read, not executed.

Representative reads: `gh pr view 40 --repo Tien-Lam/ChronoShift --json
baseRefOid,headRefOid,files`; `gh api repos/Tien-Lam/ChronoShift/pulls/40/files`;
immutable `gh api repos/OWNER/REPO/contents/PATH?ref=SHA` with the raw media
header; `git show 416f94e:PATH`; `git diff BASE 416f94e -- PATH`.

Read the six pinned actions' `action.yml`, checkout README/input/auth helpers,
mise v5 installation/cache/environment source, Pages uploader v4/v5 composite,
deploy v4/v5 polling plus v5 API/index source, and uploader v7 README, input and
upload sources/package lock. Official links identify the exact consulted pins:

- [checkout v7 metadata](https://github.com/actions/checkout/blob/3d3c42e5aac5ba805825da76410c181273ba90b1/action.yml)
  and [credential helper](https://github.com/actions/checkout/blob/3d3c42e5aac5ba805825da76410c181273ba90b1/src/git-auth-helper.ts).
- [mise v5 source](https://github.com/jdx/mise-action/blob/7a4e45a543138629540c9a1616d08632b893e492/src/index.ts).
- [configure v6 metadata](https://github.com/actions/configure-pages/blob/45bfe0192ca1faeb007ade9deae92b16b8254a0d/action.yml).
- [Pages upload v5 composite](https://github.com/actions/upload-pages-artifact/blob/fc324d3547104276b827a68afc52ff2a11cc49c9/action.yml).
- [deploy v5 polling](https://github.com/actions/deploy-pages/blob/368f82528645a54fb793d4d04e342629a3f51346/src/internal/deployment.js)
  and [artifact selection/API](https://github.com/actions/deploy-pages/blob/368f82528645a54fb793d4d04e342629a3f51346/src/internal/api-client.js).
- [uploader v7 inputs](https://github.com/actions/upload-artifact/blob/043fb46d1a93c77aae656e7c1c64a875d1fc6a0a/action.yml)
  and [locked SDK dependencies](https://github.com/actions/upload-artifact/blob/043fb46d1a93c77aae656e7c1c64a875d1fc6a0a/package-lock.json).

Copied source evidence is under `adversarial-primary/`: checkout v7 auth, mise
v5 index, and deploy v4/v5 polling. GitHub's current [hosted-runner documentation](https://docs.github.com/en/actions/reference/runners/github-hosted-runners)
was also read; it describes Slim as an unprivileged container with a 15-minute
platform limit. The repository deliberately imposes a shorter five-minute limit.

## Competing failure paths and conclusions

1. **UID1001 and credential migration.** New JavaScript actions use runner-supplied
   Node24, separate from mise-installed project Node26. Checkout now creates a
   credential file in RUNNER_TEMP, references it through includeIf entries, and
   removes those references/files during cleanup. Existing job-container paths
   need writable mounted temp/home; source review cannot prove runner ownership
   or Node24 ABI compatibility. Neither workflow has custom repository/ref inputs
   or pull_request_target/workflow_run triggers, so the new unsafe-checkout guard
   does not block their default checkout. There is no Docker container action,
   private submodule or downstream authenticated Git operation requiring the
   additional credential mount. Final-head container startup/cleanup remains a
   runtime evidence requirement.

2. **mise v5 installation and Slim.** The action uses Node24, defaults to a stable
   mise release at least 24 hours old, verifies signed checksums, exports tool
   PATH additions and a token for mise's GitHub downloads. Wings is disabled by
   default, including in the OIDC-capable publisher. Slim still installs only Bun
   and gh; the browser gate installs the configured pinned Bun/Node/gh. No project
   mise lock was introduced. This is compatible by inspection, but cache/download
   behavior and the Slim deadline need actual execution. No privilege-dependent
   Docker/browser operation was added to Slim.

3. **Artifact format, digest and ownership.** Pages v5 still creates artifact.tar
   with relative GNU-tar paths, dereferences links, and excludes .git/.github and
   other hidden paths by default. Its internal uploader is v7.0.0 (distinct from
   direct diagnostic uploader v7.0.1), with archive default true. Thus the custom
   verifier's ZIP containing only artifact.tar remains the declared contract.
   The direct uploader pins SDK 6.2.0 while deploy still uses SDK 2.x; actual
   backend interoperability is not established by their metadata alone.
   The verifier requires same-repository successful Web PR ownership, every
   required successful step, exact PR/release/current source trees, nonexpired
   named artifact, matching ZIP SHA256 and safe tar entries before replacing dist.
   Deployment v5 lists current-run artifacts and rejects zero/multiple names.
   Reuse therefore re-uploads the verified static files into the publication run;
   it does not point deployment directly at an unrelated PR artifact owner.

4. **Fallback and conditional uploads.** Missing/expired/unverifiable reuse is
   caught and reports reused=false, which selects the complete reusable Web gate.
   Manual publication skips reuse and follows that same complete gate. The
   normal success prerequisite prevents publishing a build after verification
   failure. Configure/upload/deploy failures inside Slim make prepare fail and
   cannot trigger a second fallback publication. Diagnostic uploads use status
   functions, so a failed step or successful retry with attempt-failures.json can
   retain evidence; cancellation intentionally skips them. The timing upload
   requires opt-in plus a real metadata file. A green ordinary run cannot prove
   either conditional uploader executed. Retry-pass and failed-attempt uploads
   remain unobserved here.

5. **Deployment deadline, cancellation and rollback.** Workflow-wide
   pages-publication concurrency still serializes preparation and deployment;
   main guards, environment names, permissions and artifact retention are
   unchanged. v5 adds capped pending-status backoff with 20% jitter: the default
   reaches 30 seconds, with a nominal maximum healthy-poll delay of 36 seconds.
   Both publication jobs remain five minutes while the action default is ten
   minutes. This existing deadline architecture means runner cancellation may
   arrive before the action's own timeout; v5 registers SIGINT/SIGTERM handlers
   which request server cancellation. Success of that cancellation and pending
   server behavior after runner termination are unobserved, so static approval
   cannot certify the older-publication boundary. The new polling can report
   completion later than v4. No new migration blocker is demonstrated.
   Re-running a successful main publishing run resolves the historic pinned tree
   and keeps main-only/environment/concurrency protections; manual-dispatch runs
   rebuild through fallback. A manual fallback on the new tree is not an actual
   historical rollback plus restore journey.

## Remaining acceptance evidence

Root owns the exact final-head gate and reconciliation, opt-in uploader execution,
actual ZIP digest/member inspection, same-tree Slim reuse publication, complete
manual fallback including configure/deploy in their respective environments,
public bytes/hosted browser proof and record of original versus instrumented mode.
None was observed in this review. Timeout/signal cancellation, damaged-artifact
fallback, successful-retry diagnostics, historical rollback/restore, and physical
devices remain untested by this reviewer. Preserve these gaps separately from the
static implementation approval and from any later bounded runtime acceptance.
