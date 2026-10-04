# PR 29 independent final delivery audit

**Final PR verification and artifact reuse eligibility approved.** Main deployment workflow subsequently completed successfully; workflow publication evidence is recorded below, while hosted browser acceptance is root-owned.

PR: https://github.com/Tien-Lam/ChronoShift/pull/29
Final head: `72950c0a09ac40bd8619d489bf979e1b66da6170`
Final tree: `95b5d1e7463e97d91da86435d1a944a9c38d2035`
Web run: https://github.com/Tien-Lam/ChronoShift/actions/runs/37220330336
Job: https://github.com/Tien-Lam/ChronoShift/actions/runs/37220330336/job/111489190919
Attempt: 1; created 2026-10-04 17:23:29 UTC, completed successfully 17:28:22 UTC.

Read-only GitHub CLI/API independently confirms this successful pull_request run belongs to the exact final head and same repository (Tien-Lam/ChronoShift, id 1206473449), pinned Web workflow 373926111 at `.github/workflows/web.yml`. The project's `trustedRun` predicate returns true for the recorded run/jobs and repository/workflow IDs. The PR's web check independently reports COMPLETED/SUCCESS for that head. No workflows rerun, merges, branch/source edits or deployments performed by this reviewer.

Required project gates, independently confirmed from successful steps and actual downloaded run log:

- Frozen Bun install and pinned browser image/version guard: success.
- Formatting: all matched files use Prettier style; success.
- Unit/build: 108 pass, 0 fail, 698 expectations; 108 tests in four files, 426ms. Typechecked and both static builds succeeded.
- Standalone corpus audit: successful checked-in comparison; 353 inputs, zero crashes. Existing 29 legacy-expectation/parser review entries remain inventory findings, not newly asserted accuracy acceptance.
- Full browser gate: 183 passed in 3.7 minutes, no failed/flaky summary.
- Repository-path Pages deployment gate: `/ChronoShift/` build and 1 scenario passed in 1.8 seconds.
- Verified Pages artifact upload: success. configure-pages was intentionally skipped for the PR event; that is not a required PR gate failure.

Artifact identity and integrity:

- Artifact 11309414508, `github-pages`, unexpired, 372,351 bytes, produced by this final Web run.
- API digest, upload-log digest and independently computed SHA256 of downloaded ZIP all equal `af2ba17d0d404d160541ff1c7328c25478eb5d94b2eca8a0b25c07dde5609fa4`.
- ZIP contains only `artifact.tar`. Seventeen tar members pass the repository's safeArchive checks: relative paths, no traversal/backslashes, regular files/directories only; no links. No archive extracted into the repository.
- Artifact release.sourceCommit `1ef1aa07b3e3a2d7cf657150fc6083aa8987699b` identifies the PR merge checkout, rather than the branch SHA. An independent gh commit API read confirms its tree `95b5d1e7463e97d91da86435d1a944a9c38d2035` exactly matches the final branch head's tree. release.base is `/ChronoShift/`; generated worker VERSION is `fedcd4a1116faa6d`.
- Read-back Pages artifact JS SHA256 is `bba11a570acd10bbad13fb2894168d6318169b69269a1c61d24e4b804739e703`, CSS is `f199fc8eb4be1b9fe4c6493741bfe08979efd1279eb0ca099b5498f64880b61e`, worker is `e17b01198be6045d352561d10fe1f6004eb83d106b13f16ef027f0ec36230704`. The compiled Pages base differs from the local root preview: independently replacing only `/ChronoShift/` with `/` (3 occurrences in JS, 1 in CSS) yields the exact previously reviewed root JS `0f63a87fa6d952b0e6c360ca16fc62588ca2cf823e32f05186a43e2955462254` and compact-calendar CSS `5b845452c7654ff87fdecb6a4ed8be1c35eda0dcfe84cd10614073ab8941d6dc` hashes. Worker is byte-identical without normalization.

Commands: `mise exec -- gh pr view 29 --json ...`; `gh run view 37220330336 --json ...`; `gh run view 37220330336 --log`; `gh api` for the run/jobs/artifacts, repository and both head/artifact-source commits; `gh api repos/Tien-Lam/ChronoShift/actions/artifacts/11309414508/zip` downloaded to scratch. Existing unzip/tar and mise-managed Bun independently inspected/hash-verified the archive and applied safeArchive/trustedRun. Polls bounded to 60 seconds, with no unchanged status messages to the root.

Supporting scratch records: `/tmp/chronoshift-menu-code/final-run.json`, `final-jobs.json`, `final-artifacts.json`, `final-web-run.log`, `final-pages.zip`, `final-pages.tar`, `final-tar-paths.txt`, `final-tar-entries.txt`, `final-artifact-assets.json`. Important exact identities, digests and test outcomes are retained above so this report remains meaningful when copied after merge.

Earlier run 37219886921 at head 8850a469 certifies only its superseded tree and is not used for this final acceptance. `gh pr checks 29 --required` previously reported no required checks on the PR branch, so “required” here refers to the project's verification workflow, not an independently established GitHub branch-protection mandate.

Main merge must retain this exact source tree for artifact reuse; a changed tree requires a new complete gate. Publication identity/digest reuse and hosted acceptance will be audited after root supplies the main/deployment run. Hosted historical browser conditions, physical iOS scroll/touch/keyboard, actual zoom/install and representative-phone performance remain separate gaps. Parent owns merge/publication and report closure.

## Main artifact reuse and publication audit

**Main-only publication workflow succeeded with exact verified PR contents.**
Main commit `6676e56d52224b8758a9a5cf6b11b448f5d7f1f6`; independently read main tree `95b5d1e7463e97d91da86435d1a944a9c38d2035`, identical to final PR and artifact-source trees.
Pages push run https://github.com/Tien-Lam/ChronoShift/actions/runs/37220709137
created 2026-10-04 17:29:35 UTC; prepare successful at 17:29:55 UTC; deploy successful at 17:30:06 UTC, workflow completed success.

Actual preparation log confirms: “Reusing verified Web run 37220330336, source 1ef1aa07b3e3a2d7cf657150fc6083aa8987699b, tree 95b5d1e7463e97d91da86435d1a944a9c38d2035” (raw log retained). The complete verify job was correctly skipped because preparation reused the successful trusted artifact. Main upload/configure and deploy steps succeeded. Deployment log identifies main 6676e56d as the deployment.

Main re-uploaded artifact 11310440133, github-pages, 372,350 bytes, unexpired. API/upload-log/independently computed ZIP digest all match `16d731e01af551a85a9fb179bc3fc67af5136a1d7d06212241c9904c3d6c5970`. Repacking produces a different ZIP digest from the PR; this does not mean runtime content changed. Independently downloaded both archives, checked the main tar with safeArchive, verified identical 17-member inventories, and SHA256-compared every one of 14 regular files: **all 14 are byte-identical**. This includes HTML, service worker, release metadata, manifest, runtime JS/CSS/worker/font, icons and notices. Published artifact therefore retains release.sourceCommit 1ef1aa07 and worker fedcd4a1116faa6d as expected for exact artifact reuse.

Read-only commands: gh run view 37220709137 --json..., gh run view 37220709137 --log, gh commit API for main, gh run-artifacts API and gh artifact 11310440133 ZIP API; existing unzip/tar and Bun verified ZIP digest, safe member inventory and per-file equality without extracting into the repository. Scratch evidence includes main-pages-run.log, main-pages-artifacts.json, main-pages.zip, main-pages.tar, main-tar-paths.txt, main-tar-entries.txt and main-reuse-proof.json under `/tmp/chronoshift-menu-code`.

This proves workflow publication completion and unchanged deployment contents. It does not independently prove live HTTPS propagation, cached-tab explicit-update recovery or the user's historical visual conditions; root owns those hosted browser checks. No merges/deployments/reruns or repository mutations by this reviewer.
