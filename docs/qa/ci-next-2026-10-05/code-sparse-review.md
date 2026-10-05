# Independent code review — original sparse-checkout report

This additive source review does not change the initial runtime approval or its gaps. The other reviewer's initial verdict was not read. No API request, CI operation, browser, build, install, checkout/sparse configuration mutation or runtime/workflow edit was performed. Only this owned report was written; prepared browser journeys remain paused.

## Exact scope and actual timing

Read-only commands/observations began at actual clock **2026-10-05 10:35:21 UTC** and final metadata/source observation was **2026-10-05 10:36:03 UTC**. Report-writing is afterward. Environment remains Darwin 27/arm64, Git **2.56.0**, mise-managed Bun **1.4.0** as recorded by the initial review. Hosted runner Git/transport/cache conditions were not exercised.

Base/HEAD: `f8c073a289f2c4af1f369a4588d5e0e74daf392c`; full committed tree: `4f49ec284d40321df2878bb4033a2fbf466c715f`.

Reviewed exact uncommitted workflow blobs:

- `.github/workflows/web.yml`: `3af8762c6533e71a07414a4c5a80e047f063e6a9`.
- `.github/workflows/pages.yml`: `d92bca178f4596f578bb4e915924ba3d7fb83082`.

Each diff adds exactly six lines to its existing pinned checkout step: `with`, explanatory comment, `sparse-checkout`, `/*`, `!/docs/qa/`, `sparse-checkout-cone-mode: false`. `git diff --check -- .github/workflows` passed. Final hashes matched dispatch. Checkout action pin remains `3d3c42e5aac5ba805825da76410c181273ba90b1`/v7.0.1; no ref/filter/depth/authentication overrides were added.

## Independently checked source behavior

No actionable workflow/source blocker was found for the fresh hosted-workspace experiment described in the dispatch.

**Rule selection and required inputs.** Independently ran read-only `git sparse-checkout check-rules --no-cone` with the exact two patterns against `git ls-tree -r --name-only HEAD`. Output contains **132** selected paths. A `diff -u` against all full-tree paths with only anchored `docs/qa/` removed passed with empty output. Full metadata lists 2,595 tracked paths and 2,463 QA paths. No blob sizes or partial-clone objects were fetched for this check. The include-all approach also includes future paths outside this one excluded subtree, unlike a directory allowlist. Root dotfiles, `.github`, `mise.toml`, package/lock, tsconfig/Vite/Playwright configs, all web source/public/font/manifest assets, scripts, units/browser tests and independent fixtures are selected. The license fallback `docs/licenses/client-only.LICENSE` and checked-in `docs/planning/corpus-audit.json` remain selected.

Inspected package/build/typecheck/formatter definitions, complete Web/Pages jobs, Playwright configs, build-offline and third-party-notices inputs, preview/test-release helpers, publication tests, and text/file references in scripts/tests/e2e. No present gate read dependency on `docs/qa/` was found. Optional evidence output directories can still be generated; ignored dist/dependencies/reports/results are outputs, not omitted tracked inputs. A future checked-in QA fixture used by a gate would require revisiting the exclusion.

**Pinned checkout source.** Read retained primary `src_git-source-provider.ts` (local Git blob hash `b9c1d3575135fcb2aa0fac36662c400efeb6d8e3`) and action manifest/tag metadata. Provider lines 182–185 select automatic `blob:none` when sparse selection is set and explicit filter is absent. It still uses settings ref/commit and depth for fetch, determines checkout identity, calls `sparseCheckoutNonConeMode` when cone mode is false, then checks out that identity. This supports the intended provider path; file-byte omission alone does not prove server-side filtering or a performance win.

The exact manager source cited by the proposal was decoded in memory and is **not retained in the inspected official directory**. Initial searches used the proposal's logical names before locating the actual `src_` provider filename. Root was notified of the missing manager. This report does not independently certify its exact command construction or cone-reset behavior; the proposal's claims about that method remain an identified evidence gap pending retained primary source. No API/browser request was made to fill it.

Provider also falls back to REST download if command-manager creation fails and LFS is not requested; that path downloads repository content and is not sparse-transfer evidence. A successful job alone would not distinguish that fallback from the intended filtered Git path.

**Full-tree trust and publishing lifecycle.** `reuse-pages-artifact.ts` still compares the GitHub publishing commit's complete tree with local `HEAD^{tree}`, candidate PR head tree, and artifact release's tested commit tree. Sparse paths do not redefine `HEAD^{tree}`. An excluded QA-only committed change therefore changes the complete tree and must reject reuse. Metadata-only tree resolution requires no omitted QA blob content. `verify-preview-tree.ts` retains complete tree equality; preview tests create their own separate Git fixture, unaffected by the outer checkout.

The Web job retains frozen install, formatting, 116-unit/production build, independent corpus audit/diff, entire ordinary browser command, separate subpath build/test and verified artifact upload. Runtime/motion/fixture configs are unchanged. Pages retains main-only prepare/environment, strict same-repository successful-workflow/job/required-step requirements, complete API list checks, digest/size/member/archive safety, exact source/base validation and static extracted-file treatment. Failed or missing reuse still invokes the reusable full Web gate. Failed reuse upload/deployment cannot start a second publication. Workflow-wide `pages-publication` serialization with `cancel-in-progress:false`, permissions and deploy gating remain unchanged.

## Hosted rejection conditions and evidence gaps

Reject the intended sparse experiment as correct/efficient if any of these occurs:

- Stale `core.sparseCheckoutCone`/rules or another inherited setting materializes the wrong selection; wrong/missing config, license, corpus/fixture or test input; modified hashes/modes; future required input inside excluded QA.
- REST repository download, server filter-unsupported warning, full blob fetch before sparse setup or unexpected broad lazy fetches presented as evidence of transfer savings. Audit pack/missing-object/path/tree metadata; avoid broad blob reads, archives and full-tree content diffs that demand the excluded objects.
- PR test merge replaced by PR head/moving main, sparse-file/ancestry comparison replacing exact full tree, QA-only mismatch accepted, reduced test/profile/normal-motion/assertion coverage, missing first-attempt evidence, artifact digest/source/base failure or publication race/cancellation.
- A source-correct partial clone that is slower, or uncompressed committed-file byte counts called network bytes, quota minutes or runner savings.

Hosted acceptance must record fresh Web and Slim prepare event SHA/ref, actual filter and sparse configuration/rules, full tree equality and all required materialized inputs. Exercise same-tree/different-commit acceptance and QA-only-different-tree rejection, successful automatic reuse/upload/deploy and separate complete fallback. None was executed by this review. The saved four/eight-second checkout budget is too small to close the original CI goal alone: even eliminating both current checkout steps entirely leaves the saved 386-second pair at 374 seconds, above its 307-second baseline.

## Separate verdicts

**Implementation:** approved within the bounded workflow/provider/rule-selection source scope for the exact two workflow blobs. No source blocker found for fresh hosted workspaces. Exact manager method inspection, actual hosted transport/configuration, gate completion and publication compatibility remain unverified and must not be inferred from this approval.

**Original CI-goal resolution:** **open/unverified**. No >=20% quota/storage reduction or improved raw runner time was established. Sparse file selection and unchanged trust semantics are a setup hypothesis, not cost acceptance. Initial runtime source approval and prepared, unexecuted browser journeys are unchanged.

Actual commands were read-only Git diff/status/hash/rev-parse/ls-tree/check-rules, path comparison/counts and `rg`/`cat`/`sed` source inspection. No broad QA blob-demand audit or size-based efficiency calculation was performed.

## Additive pinned-manager inspection

The original report above is preserved. After its initial observations, root retained the primary manager at `official/git-command-manager.ts`, reporting gh retrieval/decode/hash verification at 10:36:04.353 UTC. This reviewer then independently inspected that local file **2026-10-05 10:36:48–10:36:53 UTC**, with no network access or mutation of official bytes. Local Git blob hash independently matched **`8431658989171114643993ce31b6691fa9b5a410`**. Both workflow hashes remained identical to the initial scope.

Manager lines 277–321 construct protocol-v2 fetch with `--filter=${options.filter}`, preserve depth/refspec handling and use the existing retry helper. Lines 206–221 enable `core.sparseCheckout`, resolve the sparse file through `git rev-parse --git-path info/sparse-checkout`, and **append** newline-separated provided rules. Checkout follows through the provider already inspected. It does not explicitly reset `core.sparseCheckoutCone`; fresh-workspace configuration and rejecting stale cone state remain necessary. Existing prior patterns are appended rather than replaced, which must also be recorded if any inherited worktree is used. The explicit two-pattern suffix still has the intended include-all/exclude-QA ordering for the fresh-workspace case.

Manager initialization requires Git **2.28** for sparse mode. A failed initialization can reach the provider's previously recorded REST fallback; that fallback is not proof of filtered transfer. No hosted Git/configuration/transport run was performed.

**Additive implementation verdict:** the exact-manager source-inspection gap is now resolved for the retained pinned primary file. The bounded fresh-hosted-workspace source approval stands with no blocker. Stale settings, unsupported filtering, actual full gate and publication outcomes remain execution evidence gaps. **CI-goal resolution remains open/unverified**, unchanged.
