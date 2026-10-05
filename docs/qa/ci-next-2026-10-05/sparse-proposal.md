# Bounded sparse-checkout proposal

Read-only follow-up at checkout `f8c073a289f2c4af1f369a4588d5e0e74daf392c`, full tree `4f49ec284d40321df2878bb4033a2fbf466c715f`. Environment: Darwin arm64, Git 2.56.0, mise-managed Bun 1.4.0 and gh 2.100.0. Observed clocks: 2026-10-05 10:32:26–10:32:58 UTC; initial inspection preceded the first clock. No checkout, sparse configuration change, build, browser, test suite, installation, CI operation or source edit occurred. Git's read-only `sparse-checkout check-rules` inspected path metadata only. One read-only `gh api` request fetched pinned official action source; the two Git manuals were read through web. The root's live ABBA benchmark was not modified. This proposal file is the only intended write during this follow-up.

**Proposal:** apply the same narrow exclusion to both current checkout steps. Include every tracked path except `docs/qa/`; do not maintain a positive allowlist of selected source directories. This avoids accidentally omitting future build inputs, configuration files, licenses or helper scripts elsewhere in the tree. It is a setup experiment, not evidence that the efficiency target is met.

## Exact workflow inputs

In both `.github/workflows/web.yml` → `jobs.web.steps` and `.github/workflows/pages.yml` → `jobs.prepare.steps`, preserve the existing action pin and add only:

```yaml
- uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
  with:
    sparse-checkout: |
      /*
      !/docs/qa/
    sparse-checkout-cone-mode: false
```

Omit `filter`, `ref`, `fetch-depth`, `clean`, `lfs`, `submodules` and credential overrides. The present defaults therefore remain: event-specific ref/SHA (including the PR test merge), one fetched commit, clean checkout, no LFS/submodules, and current authentication lifecycle. Do not substitute a moving `main` ref or PR head for the tested merge. There is no checkout in the fallback deploy job to change. The reusable full-fallback Web job inherits the same proposal automatically.

The include-all pattern precedes the anchored QA-directory exclusion. Quoting/glob handling remains within the structured action input; no shell expands `/*`. [Git's full-pattern documentation](https://git-scm.com/docs/git-sparse-checkout#_internals_full_pattern_set) describes include-all followed by a negated exclusion. It also documents the `check-rules --rules-file --no-cone` read-only inspection used below. Non-cone matching has overhead; these two patterns are intentionally bounded, not a performance guarantee.

## Transfer behavior and primary source evidence

The exact pinned [checkout provider](https://github.com/actions/checkout/blob/3d3c42e5aac5ba805825da76410c181273ba90b1/src/git-source-provider.ts), locally preserved under `../actions-upgrade-2026-10-05/code/official/actions-checkout/`, chooses the requested explicit filter if present; otherwise a nonempty sparse selection sets the fetch filter to **`blob:none`**. It fetches commit/tree metadata, establishes the sparse patterns, and only then checks out the event ref. The exact pinned [Git command manager](https://github.com/actions/checkout/blob/3d3c42e5aac5ba805825da76410c181273ba90b1/src/git-command-manager.ts) was retrieved with:

```text
mise exec -- gh api repos/actions/checkout/contents/src/git-command-manager.ts?ref=3d3c42e5aac5ba805825da76410c181273ba90b1 --jq .content
```

Its `fetch` method passes `--filter=blob:none` to `git fetch`; its non-cone sparse method writes the provided newline-separated patterns before `checkout`. The API response was decoded in memory with mise-managed Bun and not executed. The Git manuals explain that partial clones omit objects until demanded and checkout bulk-fetches required blobs. Thus the source supports a **transfer reduction**, not only fewer worktree writes: QA blobs need not be demanded by this checkout. [Git partial-clone documentation](https://git-scm.com/docs/partial-clone).

The manifest/README shorthand says explicit `filter` overrides sparse checkout. The exact provider actually gives an explicit filter priority over the automatic filter choice while retaining its later sparse-worktree branch. Avoid this wording ambiguity by leaving `filter` unset. Do not set `filter: blob:none` alone: an otherwise full checkout needs all current blobs and demand-fetches them. Do not fully fetch first and remove QA afterward: that cannot save its transfer.

Support still depends on the actual Git transport/server, hosted-runner Git and fresh-workspace configuration. Reject a filter-unsupported warning as transfer-efficiency evidence even if correctness passes. The non-cone method sets `core.sparseCheckout=true`; it does not explicitly reset a previously enabled `core.sparseCheckoutCone`. Current fresh hosted jobs do not intentionally inherit sparse settings. Record actual sparse config/rules and reject stale cone/rule state that changes the selection. No new sparse-index optimization is proposed.

## Read-only exact selection result

Before any proposed change, full-tree metadata contains **2,595 tracked blobs, 148,977,436 uncompressed bytes**. QA accounts for **2,463 blobs, 147,626,598 bytes**; all other tracked files account for **132 blobs, 1,350,838 bytes**. This is 99.09% of uncompressed file bytes, not measured compressed Git wire traffic.

The following inspection was executed against the current checkout without writing an index, worktree or sparse configuration:

```sh
git ls-tree -r --name-only HEAD |
  git sparse-checkout check-rules --no-cone \
    --rules-file=<(printf '%s\n' '/*' '!/docs/qa/')
```

Output count: **132 selected paths, zero selected QA paths**. A read-only `diff -u` of this output against `git ls-tree -r --name-only HEAD` with only anchored `docs/qa/` paths removed exited zero with empty output. This proves the proposed rules select precisely every existing non-QA path on Git 2.56.0; it is not a hosted fetch/checkout test.

## Required inputs retained by both checkouts

Both jobs receive the same complete non-QA selection, even though Pages prepare presently needs fewer files. Existing required paths are therefore retained without changing typecheck, test or formatter discovery:

| Path family / exact exceptions to preserve | Gate ownership |
| --- | --- |
| `package.json`, `bun.lock`, `mise.toml`, root dotfiles including `.gitignore` and `.prettierignore` | Frozen dependencies, runtimes, formatting and generated-output handling. Root `*.ts` files remain selected for the formatter glob. |
| `tsconfig.json`, `vite.config.ts`, `playwright.config.ts`, `playwright.subpath.config.ts`, `playwright.hosted.config.ts` | Typechecking, root production assets, full browser inventory, separate subpath and hosted configuration. |
| Entire `web/`, including `web/src/`, `web/index.html`, `web/sw-template.js`, all `web/public/` assets/fonts/notices/manifest/icons | Application, worker and offline/runtime build inputs. Generated `third-party-notices.txt` remains writable. |
| Entire `scripts/` | Build/offline, third-party notices, corpus audit, static/test preview, release variants, resource/timing helpers, full-tree preview verification, hosted verification and bounded artifact reuse. |
| Entire `tests/`, specifically `tests/fixtures/temporal.json` and `tests/fixtures/resilience-corpus.json` | All 116 units and independent exact/corpus expectations. Preview tests create their own temporary Git repository; outer sparse selection does not modify that repository. |
| Entire `e2e/`, including fixtures, console/choices helpers, attempt/timing reporters, all ordinary/mobile/foldable/lifecycle/subpath/hosted specs | Complete 273 configured scenarios, 264 runnable/nine existing capability skips; per-test isolated origins and normal motion policies remain. |
| Entire `.github/`, specifically `.github/workflows/web.yml` and `pages.yml` | Reusable workflow definition and trusted workflow identity. |
| `docs/planning/corpus-audit.json`, with all other `docs/planning/` retained | Checked-in audit snapshot, unchanged corpus regeneration/diff and failure-artifact inclusion. |
| Entire `docs/licenses/`, especially `client-only.LICENSE` | Mandatory distribution-license fallback in `scripts/third-party-notices.ts`. |
| All remaining tracked non-QA files, including `LICENSE`, `AGENTS.md`, docs and experiments | Included automatically by `/*`; no new allowlist-maintenance gap. |

The read of `web`, `scripts`, tests and specs found no gate input dependency on `docs/qa/`; workflow references to that path are trigger exclusions. `e2e/copy-focus.spec.ts` writes optional evidence outputs through supplied paths; those generated output directories need not exist in a checkout and can still be created. `dist/`, `node_modules/`, `playwright-report/`, `test-results/`, runner-temp artifacts and local Bun caches are generated/runtime outputs, not missing tracked inputs. Their lifecycle and uploads remain unchanged. If a future gate begins reading checked-in QA evidence, this proposal must be revisited before adoption.

## Full-tree trust and source provenance

`scripts/reuse-pages-artifact.ts` invokes only local `git rev-parse HEAD^{tree}`; commit/head/tested-release tree lookups otherwise use the GitHub API through gh. `HEAD^{tree}` resolves the **complete committed tree**, including the excluded QA paths and their blob identities/modes. It does not hash just materialized files and does not need the QA blob contents. Sparse checkout does not create a different commit or tree. Keep API main tree = full local tree = candidate PR-head tree = tested artifact release tree exactly as implemented. An excluded QA-only difference between the tested source and main still changes their full tree IDs and must fail reuse.

`scripts/verify-preview-tree.ts` similarly compares complete `HEAD^{tree}` and requested source tree; no ancestry or selected-file replacement is permitted. `scripts/build-offline.ts` continues to write `release.json.sourceCommit` from the actual workflow `GITHUB_SHA` unless the existing explicit source override is supplied. Preserve that exact tested source and base `/ChronoShift/`.

Retain all successful same-repository/workflow/event/run/job/required-step conditions, complete job/artifact list checks, SHA-256 and archive-size limits, safe member extraction, release source/base validation, static-only treatment of extracted files, main-only environment and permissions, workflow-wide serialization and full fallback. No verifier changes are needed for this proposal. Missing metadata or unverifiable artifacts remain fallback conditions, never approval based on the sparse checkout.

For prospective validation, use tree/path/OID metadata without blob reads: `git rev-parse`, `git ls-tree` **without `--long`**, sparse rules/config and supported missing-object/pack metadata. Do not run `git ls-tree --long`, broad `git show`/`cat-file` blob reads, archive/export or full-tree diffs that demand-fetch excluded QA content merely to audit the optimization. Such operations can erase its transfer benefit. This audit's `ls-tree --long` size figures came from the preexisting full checkout, not a partial clone.

## Acceptance and rejection cases for a future isolated experiment

1. On fresh hosted Web and Slim prepare jobs, preserve event SHA/ref and prove full `HEAD^{tree}` equals the full GitHub tree. Inspect actual filter, sparse configuration and rule selection. All current 132 non-QA paths must materialize with unchanged content/modes; no current QA path should materialize. A later source tree needs the same rule comparison, not a hard-coded 132 count.
2. Reject any missing required source/config/license/corpus fixture, omitted test/formatter discovery, changed fixture hash, browser/profile/motion/assertion reduction, or root/subpath build merging. Full required inventory/checks and zero unexplained first failures/retries remain necessary at the eventual approved candidate.
3. Exercise same-tree/different-commit acceptance and excluded-QA-only different-tree rejection, preserving existing invalid/fork/partial/expired/tampered/unsafe-archive fallback cases. Verify actual successful automatic reuse/upload/deploy and separate complete manual fallback before claiming publication compatibility.
4. Reject a source identity comparison based on sparse paths, Git ancestry, changed-only tests, API head alone or unverified deployment bytes. Reject publication racing/cancellation or a reused-deployment failure that initiates a second publication.
5. Measure cold fresh transfer/setup and repeated job durations separately. Record sparse overhead, actual fetched/pack bytes and unexpected lazy fetches; full current checkout budgets are only 4 seconds Web and 8 seconds Pages. Even complete elimination of both current steps yields a 374-second/seven-minute pair, so sparse checkout alone cannot restore TIE-375. A correct but slower partial-fetch sequence is not an efficiency win.

Implementation is not performed or approved by this analysis. Only rule selection and source semantics were inspected; actual hosted transport savings, compatibility, source/artifact identity and target-sized complete-pair benefit remain unmeasured. Keep substantial-change final code/adversarial reviews separate from this proposal.

## Exact retained tracked-path manifest

This is the full 132-path selection from the committed base, including all directories listed above. No blob contents were read to create this manifest. Root-owned runtime candidate edits visible during final verification are outside this read-only agent's work; base head/tree remain unchanged.

```text
.github/ISSUE_TEMPLATE/bug_report.md
.github/ISSUE_TEMPLATE/feature_request.md
.github/dependabot.yml
.github/pull_request_template.md
.github/workflows/pages.yml
.github/workflows/web.yml
.gitignore
.prettierignore
AGENTS.md
CHANGELOG.md
LICENSE
README.md
bun.lock
docs/architecture/merge-philosophy.md
docs/architecture/nlp-pipeline.md
docs/developer/appearance.md
docs/developer/building.md
docs/developer/ci-efficiency.md
docs/developer/device-smoke-test.md
docs/developer/review.md
docs/developer/testing.md
docs/developer/web.md
docs/images/.gitkeep
docs/licenses/README.md
docs/licenses/client-only.LICENSE
docs/planning/browser-performance-baseline.json
docs/planning/browser-performance-webkit.json
docs/planning/ci-efficiency.json
docs/planning/corpus-audit.json
docs/planning/lightweight-browser-ml-research.md
docs/planning/offline-web-linear-map.json
docs/planning/offline-web-roadmap.linear.json
docs/planning/offline-web-roadmap.md
docs/planning/review-2026-10-04.md
docs/planning/review-glass-command-2026-10-04.md
docs/planning/review-process-audit-2026-10-04.md
docs/planning/web-acceptance.md
docs/planning/web-execution-report.md
docs/planning/web-performance-baseline.json
docs/planning/web-product-contract.md
e2e/app.spec.ts
e2e/attempt-reporter.ts
e2e/choices.ts
e2e/console.ts
e2e/controls.spec.ts
e2e/copy-focus.spec.ts
e2e/diagnostics.spec.ts
e2e/engine.spec.ts
e2e/fixtures.ts
e2e/foldable.spec.ts
e2e/hosted.spec.ts
e2e/imports.spec.ts
e2e/live.spec.ts
e2e/motion.spec.ts
e2e/offline-install.spec.ts
e2e/privacy.spec.ts
e2e/responsive.spec.ts
e2e/subpath.spec.ts
e2e/timing-reporter.ts
e2e/uncontrolled.spec.ts
e2e/updates.spec.ts
experiments/temporal-span/README.md
experiments/temporal-span/browser-assets.json
experiments/temporal-span/browser-inputs.json
experiments/temporal-span/browser-wasm.json
experiments/temporal-span/browser.html
experiments/temporal-span/compare.ts
experiments/temporal-span/comparison.json
experiments/temporal-span/holdout.json
experiments/temporal-span/infer.py
experiments/temporal-span/inference.json
experiments/temporal-span/native-onnx.json
experiments/temporal-span/prepare_browser.py
experiments/temporal-span/quantization-comparison.json
experiments/temporal-span/quantization.ts
experiments/temporal-span/server.ts
experiments/temporal-span/worker.js
mise.toml
package.json
playwright.config.ts
playwright.hosted.config.ts
playwright.subpath.config.ts
scripts/audit-corpus.ts
scripts/benchmark-browser.ts
scripts/benchmark-web.ts
scripts/build-offline.ts
scripts/ci-environment.ts
scripts/ci-metrics.ts
scripts/csp.ts
scripts/reuse-pages-artifact.ts
scripts/serve-web.ts
scripts/test-releases.ts
scripts/third-party-notices.ts
scripts/verify-hosted-rollout.ts
scripts/verify-preview-tree.ts
tests/console-capture.test.ts
tests/conversion.test.ts
tests/corpus.test.ts
tests/fixtures/resilience-corpus.json
tests/fixtures/temporal.json
tests/offline.test.ts
tests/preview.test.ts
tests/publishing.test.ts
tsconfig.json
vite.config.ts
web/index.html
web/public/fonts/README.txt
web/public/fonts/geist-OFL.txt
web/public/icon-192.png
web/public/icon-512.png
web/public/icon.svg
web/public/manifest.webmanifest
web/public/third-party-notices.txt
web/src/App.tsx
web/src/assets/geist-latin-variable.woff2
web/src/components/Choices.tsx
web/src/components/DateChoice.css
web/src/components/DateChoice.tsx
web/src/engine/convert.ts
web/src/engine/limits.ts
web/src/engine/parser.ts
web/src/engine/time.ts
web/src/engine/types.ts
web/src/engine/worker.ts
web/src/engine/zones.ts
web/src/main.tsx
web/src/platform/diagnostics.ts
web/src/platform/handoff.ts
web/src/platform/offline.ts
web/src/platform/preferences.ts
web/src/style.css
web/sw-template.js
```

Final report/identity verification observed **2026-10-05 10:34:17 UTC**. Workflow/script/config/test paths remained unchanged by this agent; root-owned `App.tsx` and `Choices.tsx` edits were already visible during the shared live experiment.
