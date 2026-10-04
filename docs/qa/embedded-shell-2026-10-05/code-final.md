# Independent HTML integrity investigation and code review

Initial source: `00ddf8c8e37e9a59583d3191bc5e46e8d7cf6917`. Candidate: `f0d3759c270b6ebaeb4995a32c481fe1ec1ffd39`. Read AGENTS.md and docs/developer/review.md. No app edits, user Chrome profile changes, deployment or ticket changes by this reviewer. Original initial report is retained separately at `/tmp/chronoshift-html-code-initial.md`.

Environment: UTC October 4, 2026, 18:36–18:42 (Sydney local date October 5); mise-managed Bun 1.4.0 and gh 2.100.0; fresh installed Google Chrome 154.0.8037.93. Local port 4241; isolated candidate checkout `/tmp/chronoshift-html-code/candidate`. Root's dist was not overwritten.

## Original report and competing explanations

Original attachment `/Users/tien/.codex/attachments/b5984be7-c116-46b5-8710-46c525ab801c/Pasted text.txt` identifies worker release `01ee9fa94a59f910`, application `index-BjtJ2w8M.js`, and no controller at startup 18:32:46.044 UTC. Installation rejected `/ChronoShift/index.html` with `release-mismatch` after about 0.308 seconds. Two retries reject at about 1.686 and 5.015 seconds; the startup warning appears at 15 seconds. This is an initial-install integrity failure, not established old-controller corruption or a picker-triggered probe timeout.

Both persistent per-client HTML rewriting and stale edge delivery fit the worker failure. The console's effective style CSP contains `local.adguard.org`, `unsafe-inline` and a nonce absent from deployed HTML. This establishes alteration of document policy, but does not prove that worker-fetched HTML was altered. Extension styling violations are separate symptoms, not causation proof. Actual rejected response bytes, browser/profile details and historical edge response remain unknown.

## Public and artifact identity

`mise exec -- gh run list --workflow pages.yml` identified successful deployment 37223155181 (main head a6a60831). Downloaded its original `github-pages` artifact with gh into `/tmp/chronoshift-html-code/pages/artifact.tar`. Artifact and public worker SHA256 both equal `da4b3ad0bc1dd57a3f7d32f4e31d0afe8e609e28f82e3a8934464804bcefe273`. All 13 artifact/public assets match the worker's expected hashes. The reused PR artifact's release.json sourceCommit is `b766d5b53063fd6872f55e7d0a052f8e84d802ec`; no inconsistent published artifact was found.

Root navigation, index.html, fixed release query and unique review query each returned 1,248 bytes with SHA256 `46bf55bbc54450573b173740feab06f293c7231b59154a89792f6401af6ff884`, matching artifact and worker. These snapshots were taken at 18:36:40–18:37:08 UTC. Requests reached Fastly `cache-wsi-ysbk1060034-WSI`; index and both query forms shared the same GitHub request ID and origin-cache HIT metadata. Query cache-busting therefore does not establish independent origin cache keys. Current healthy responses exclude a universal current artifact mismatch, not historical, per-client or other-edge mismatch.

Headers, hashes and bodies are retained in `/tmp/chronoshift-html-code/live-fetch.json`, `artifact-integrity.json` and adjacent files.

## Independent baseline and candidate journey

Command: `mise exec -- bun /tmp/chronoshift-html-code/probe.ts DIR LABEL`.

The isolated server serves exact release assets at `/ChronoShift/`. Root navigation remains pristine. Every direct index.html request, including the release query, returns the same release HTML with only a CSP domain/nonce insertion. Other runtime bytes remain unchanged. The journey uses a fresh Chrome profile, no controller, real 15-second application deadline and an editable synthetic draft.

Actual previous published artifact: after 16,626 ms, controller false, ready false, exact warning `Offline setup is incomplete. Reconnect and reload to try again.`, unchanged draft and no active/waiting worker. Six index requests show ordinary/query pairs across three installations at approximately 0, 1 and 4 seconds. Staging cache is removed. Evidence: `baseline.json` and `probe.ts` beside it.

Exact candidate: after 16,635 ms, controller true, ready true, no warning and unchanged draft. Zero network index.html requests. Evidence: `candidate.json`. This independently reproduces and prevents the implicated initial-install HTML mismatch with deliberate response alteration. It does not prove the user's particular intermediary or historical response.

## Candidate code review

Reviewed the exact build, worker, tests, preview fixtures, diagnostics fixture and documentation diff. Traced unchanged install, staging, CHECK_READY, activate, fetch, registration retry, observer lifetime, probe cancellation/deadlines, waiting-update ownership and App update handoff boundaries. Registration, picker and explicit activation behavior is unchanged.

The build embeds final production HTML after CSP/referrer injection and writes those bytes before asset/version/integrity hashing. JSON.stringify is inserted using a replacement callback, preserving literal `$&` and proper escaping. Remaining placeholder replacement targets the earlier PRECACHE constant. Shell bytes and template both participate in release identity, avoiding a circular version dependency.

For only the worker's own index.html key, a missing/corrupt cache entry is reconstructed as text/html;charset=utf-8 and checked against the same exact SHA256 before staging. Intact own-cache bytes remain reusable. All other assets retain strict fetch, type and integrity checks. Concurrent repair remains serialized; failed staging does not overwrite intact assets and removes its temporary cache. Internally inconsistent embedded shell bytes still reject. `reused` now counts the local build-owned shell as local reuse; `fetched` correctly stays zero for shell repair.

Tests distinguish the previous implementation: response-level HTML rewriting changes actual fetched bytes; the canonical cache excludes the marker, retains CSP/type and supports offline reopen with conversion. Generic stale/interrupted/persistent corruption moved to fetched release.json. The retired-tree test now deletes old index.html as well as a font notice; timeout/update coverage stalls missing release.json because index.html is locally recoverable. Strict non-shell corruption and inconsistent-shell tests remain independent expectations.

No blockers found. This trusts embedded HTML to the same extent as delivered worker JavaScript; it is not a general guarantee against an intermediary also modifying worker JavaScript.

## Verification

Created an isolated git archive of f0d3759 and reused existing pinned dependencies. `BASE_PATH=/ChronoShift/ CHRONOSHIFT_SOURCE_COMMIT=f0d3759c270b6ebaeb4995a32c481fe1ec1ffd39 mise exec -- bun run build` passes and produces release `62a17b1dcf75c574`. Generated SHELL equals final dist/index.html exactly: 1,248 bytes and SHA256 `46bf55bbc54450573b173740feab06f293c7231b59154a89792f6401af6ff884`. Expected integrity, CSP and Pages asset prefix match. Evidence: `candidate-build-integrity.json`.

`mise exec -- bun test tests/offline.test.ts`: 3 pass, 0 fail, 11 assertions. Strict non-shell rejection, exact HTML without network document, and inconsistent-shell rejection pass.

Independent command `mise exec -- bun /tmp/chronoshift-html-code/recovery.ts`: installed candidate, replaced network document with incompatible bytes, then separately corrupted and deleted the own-cache HTML. Each real CHECK_READY repair returns ready true, unavailable exactly `/ChronoShift/index.html`, reused 13/fetched 0 and identical canonical cached digest. Closed the page, disabled network, reopened from cache, entered a fresh synthetic June 18, 2026 5:20 pm Tokyo message, selected Europe/London and obtained the independent exact expectation 9:20 am. Ready remains true with no warning. No index.html network requests in any phase. Evidence: `candidate-recovery.json` and script beside it.

Waiting-update activation itself was not exercised by this independent probe; surrounding unchanged code was reviewed and the deliverer's gate can supply browser evidence. The full browser gate was not duplicated by this reviewer. Physical devices, extension/proxy recreation and the user's actual profile were not exercised.

## Separate verdicts

**Implementation: approved within exact f0d3759 scope; no blockers.** Canonical HTML embedding and strict verification are correct; unrelated asset rejection and explicit update ownership remain intact. Local equivalent failure/prevention, strict unit cases, corrupt/missing shell repair and offline conversion pass. Required full checks remain the deliverer's responsibility.

**Original report: equivalent initial-install HTML integrity failure reproduced on the actual previous published artifact and prevented by exact candidate locally; publication verification remains pending.** Matching conditions include initial no-controller lifecycle, known previous artifact, repeated same index rejection over bounded retries, real 15-second deadline, warning and preserved draft. CSP modification is deliberate injection. The user's actual altered response bytes, profile/extensions/proxy and historical CDN response remain unknown. Do not describe AdGuard as the proven cause. Exact published candidate identity and a post-publication matching journey are needed before hosted closure; keep the historical cause qualified. Healthy current public fetches establish artifact consistency only.
