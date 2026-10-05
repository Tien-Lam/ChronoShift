# Existing Actions upgrade PRs: independent code audit

Preparation only. No upgrade was added to PR 39, and this is not merge or
publication approval. No adversarial findings were read before this initial
report. No source changes, tests, Actions dispatches, comments, merges, pushes,
closures or Linear operations were performed.

## Provenance and method

Actual observation window: `2026-10-05 08:37:46 UTC` through
`2026-10-05 08:41:55 UTC`, bounded by actual clock reads; individual command
timestamps were not captured. These are observation bounds, not report-writing
time. Local environment: macOS arm64, mise-managed Bun 1.4.0 and gh 2.100.0.
Repository was independently
resolved by `gh repo view`: `Tien-Lam/ChronoShift`. Observed local HEAD during the
audit: `66e5fd32f2654e0a61d35ceae6e75b5e4561bc19`. Its unchanged Web workflow hash
was `6701f72007ce6821f9c7ddf24b6200c51ef7adeb6a2277e6de6b26748e172b66`.

Commands: `gh pr view 17..21 --json ...`, `gh pr diff 17..21`, and read-only
`gh api` calls for official `actions/*` version-tag refs, exact-pinned
`action.yml`/README/source, releases, ChronoShift exact-head workflows and job
records. Bun decoded API content, parsed workflow YAML and hashed raw bytes.
Current GitHub hosted-runner documentation was fetched for Slim restrictions;
its linked official runner-images README was also checked through `gh api`.
An initial orchestration syntax error and unquoted shell `?recursive=1` glob
errors performed no reads; subsequent argument-array `Bun.spawnSync` calls
corrected those requests. No result below derives from a failed command.

All five official tags resolved directly to the proposed commit object:

| PR | Exact PR head | Upgrade and exact action pin |
| --- | --- | --- |
| [17](https://github.com/Tien-Lam/ChronoShift/pull/17) | `0dbe08e8d3740f616a3f048888ab3191519269a4` | checkout 4.3.1 → 7.0.1: `3d3c42e5aac5ba805825da76410c181273ba90b1` |
| [18](https://github.com/Tien-Lam/ChronoShift/pull/18) | `2a4f823c7c2177379581922879c128a58a5454e4` | deploy-pages 4.0.5 → 5.0.1: `368f82528645a54fb793d4d04e342629a3f51346` |
| [19](https://github.com/Tien-Lam/ChronoShift/pull/19) | `76528ecd9c341311769b56f015a10e4272e08ef4` | configure-pages 5.0.0 → 6.0.0: `45bfe0192ca1faeb007ade9deae92b16b8254a0d` |
| [20](https://github.com/Tien-Lam/ChronoShift/pull/20) | `16da028ed3428cc5b1940ea0aa8a461306e609a0` | upload-artifact 4.6.2 → 7.0.1: `043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` |
| [21](https://github.com/Tien-Lam/ChronoShift/pull/21) | `a9a9a05a1e8a1ca1b63bf33f8055818679f1c30e` | upload-pages-artifact 4.0.0 → 5.0.0: `fc324d3547104276b827a68afc52ff2a11cc49c9` |

## Compatibility matrix

| Upgrade | Relevant migration and source assessment | Existing execution evidence and remaining gap |
| --- | --- | --- |
| Checkout v7 | [Pinned README](https://github.com/actions/checkout/blob/3d3c42e5aac5ba805825da76410c181273ba90b1/README.md): Node 24; credentials moved into `RUNNER_TEMP` files with Git `includeIf`; unsafe fork checkout restriction applies to `pull_request_target`/`workflow_run`, neither used here. Container/home/temp ownership matters; no root-only operation identified in the inspected auth helper. Bun/mise remain independently managed; the Action uses the runner's JS runtime. **Fix stale `# v4` comments in both proposed lines when delivering this upgrade.** | [Job 111374654430](https://github.com/Tien-Lam/ChronoShift/actions/runs/37181435922/job/111374654430): proposed checkout and post-cleanup succeeded, then mise and frozen Bun install succeeded. Exact PR-head YAML has the same Playwright digest and `--user 1001:1001 --ipc=host --init` as current source. Slim checkout and downstream full-tree publishing reuse were not exercised. |
| Deploy-pages v5.0.1 | [v5 release](https://github.com/actions/deploy-pages/releases/tag/v5.0.0): Node 24. [v5.0.1 release](https://github.com/actions/deploy-pages/releases/tag/v5.0.1): deployment polling gains capped backoff/jitter. Pinned inputs retain `github-pages`, 10-minute action timeout and existing token/OIDC requirements. Current main-only checks, permissions, environments, reuse/fallback branches and serialized publication are untouched. Inference: compatible with static Slim preparation; no Docker/build requirement introduced. Later polling detection must fit the existing 5-minute job deadline. | [Job 111654184328](https://github.com/Tien-Lam/ChronoShift/actions/runs/37276375534/job/111654184328) is Web only; it does not execute either upgraded deployment step. Main Slim reused-artifact publication, full-gate fallback publication and timeout/cancellation behavior remain unverified for this version. |
| Configure-pages v6 | [v6 release](https://github.com/actions/configure-pages/releases/tag/v6.0.0): Node 24. Pinned metadata retains optional generator input and `enablement: false`. No generator is supplied here; inspected entry point only changes generator config when one is supplied. Existing `/ChronoShift/` build input, Bun/mise and trust verifier are unchanged. No new write permission or installation requirement identified. | [Job 111654252226](https://github.com/Tien-Lam/ChronoShift/actions/runs/37276396741/job/111654252226) explicitly **skipped** proposed configure-pages. Both the main Slim reused-artifact branch and reusable publishing gate's configure step remain unexecuted. A successful browser job does not establish compatibility of those paths. |
| Upload-artifact v7.0.1 | [Pinned metadata](https://github.com/actions/upload-artifact/blob/043fb46d1a93c77aae656e7c1c64a875d1fc6a0a/action.yml): Node 24, `archive: true` default, existing naming/retention/digest outputs. Direct unzipped upload is opt-in; current inputs retain ZIP/name semantics. This PR changes only diagnostics/timing upload, **not** the Pages composite's separately pinned dependency, so it does not itself change the verifier's Pages bytes. | [Job 111654232379](https://github.com/Tien-Lam/ChronoShift/actions/runs/37276390625/job/111654232379) explicitly **skipped both** timing and failed-attempt upload steps. Actual single-file timing and multi-path diagnostics uploads under UID1001 remain unverified. No first-attempt pass claim follows from the job conclusion. |
| Upload-pages-artifact v5 | [Pinned composite](https://github.com/actions/upload-pages-artifact/blob/fc324d3547104276b827a68afc52ff2a11cc49c9/action.yml): still makes `artifact.tar`, then embeds upload-artifact `bbbca2ddaa5d8feaa63e36b76fdaad77386f024f` (v7.0.0, Node 24). It does not set `archive: false`; ZIP containing `artifact.tar` remains the expected format. Hidden files remain excluded by default, matching v4. No new root/Docker requirement identified. This affects both container upload and Slim reupload. | [Job 111374687540](https://github.com/Tien-Lam/ChronoShift/actions/runs/37181447538/job/111374687540): upgraded composite upload succeeded in the exact same UID1001/digest container. Artifact list now contains no artifacts, so this audit could not compare downloaded ZIP digest/member names or pass it through main's exact-tree verifier. Slim reupload and deployment remain unverified. |

The runner runtime change does not require installing Node globally or replacing
Bun. Checkout's reference requires runner >=2.327.1 for Node 24; authenticated Git
in Docker **container actions** additionally requires >=2.329.0. These workflows
use a job container and JavaScript/composite Actions. Hosted runner revision was
not reconstructed from setup logs here. Existing Node24 checkout/upload execution
is bounded evidence for the current Playwright job container.

[GitHub's Slim documentation](https://docs.github.com/en/actions/reference/runners/github-hosted-runners#single-cpu-runners)
describes an unprivileged container intended for lightweight operations; Docker
in Docker and elevated system operations are unavailable. The current official
[Slim image manifest](https://github.com/actions/runner-images/blob/main/images/ubuntu-slim/ubuntu-slim-Readme.md)
reports Ubuntu 24.04.5, image `20260925.9.1`, Node 24.21.0, Git, tar and unzip;
raw SHA-256 was `cccaf108c0f6b156a66342ece07446abfec1ecb6f890b765aeb53da510b8f179`.
This published manifest does not prove which image will serve a future job.

`scripts/reuse-pages-artifact.ts` remains strict: same-repository successful Web
run with required steps, exact full Git tree, REST artifact digest matched to
downloaded ZIP bytes, exactly one `artifact.tar` member, bounded archive sizes,
safe tar paths/types, `release.json` source tree and `/ChronoShift/` base. Source
inspection indicates the v5 Pages uploader preserves its expected wire format;
an actual uploaded artifact is still required to establish that contract.

## Pinned metadata hashes and verdict

| Official exact-pin `action.yml` | SHA-256 |
| --- | --- |
| checkout v7.0.1 | `d59219cb79590abdb877deaa14e3b65a00c05318bf5a6f3b989b9162b5d08c35` |
| deploy-pages v5.0.1 | `64c44539fba53559a157b5de16c01d3ab91dbc999c1b98b5c0b2fc3528d5d059` |
| configure-pages v6.0.0 | `55f1486ae3901c69be182cea1c1e3313954c78be626751a85b19ddaf14ae8da6` |
| upload-artifact v7.0.1 (also identical at nested v7.0.0) | `c5979822866a72362e609844b6ebe77d4b7e759af68cc1c2c425dcf51481fab4` |
| upload-pages-artifact v5.0.0 | `f84e759011e0c497e696f5bce4ebb5fbe9bbdc5aea309b73795283fa139c1558` |

Implementation preparation: no source-level compatibility blocker identified
for the specified existing inputs; PR17's version comments need correction.
This is a bounded preliminary audit, not full upgrade approval. Future delivery
must review the refreshed exact combined source and exercise the previously
skipped/unreached paths with matching artifact evidence. Existing green gates
belong to the listed individual heads, not a future combined upgrade.

Original efficiency report: unresolved. Neither grouping nor these Action
upgrades establishes avoided complete gates or a 20% usage reduction.
