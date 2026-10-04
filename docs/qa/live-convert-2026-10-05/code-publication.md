# Independent publication audit — TIE-371

Reviewed2026-10-04T20:14–20:16:16UTC on Darwinarm64 with miseBun1.4.0/gh2.100.0. Separate audit after merge/publication; original initial/delta/helper/import-delta reports unchanged. Read-only GitHub operations through gh; downloads/extraction/inventory and JSON reports confined to /tmp/chronoshift-live-code. No build/dist/tracked-file changes.

## Exact revisions and successful gates

PR34 https://github.com/Tien-Lam/ChronoShift/pull/34 merged2026-10-04T20:14:13Z into main, mergef31e78f22fa1a6b8e5d2892b96c888d458827fcd, reviewedhead6324e17f0c300f2c5ada4c481188e2c26e9ae791. Artifact sourceaa99397c07b058447c4c18fa1c938ced4f09ba97. Independently checked git tree identities for all three:564aa9e9c882e8c45d214046b86f07e54262391d; independently confirmed remote GitHub main/tested-source trees via gh API. Remote main remainedf31e at20:16:16Z.

Successful trusted same-repository PR Web run37230895017 (pull_request,head6324e,workflow .github/workflows/web.yml,repository/headrepository1206473449). Required format/unit-build/corpus/browser/subpath/artifact steps all SUCCESS. Log records116unitpass,232browserpass/6skipped,1subpathpass. No `retry #` in complete successful CI log. Run completed20:13:34Z. Pages push run37231323924 on mainf31e completedSUCCESS: prepare reused exact verified run37230895017/sourceaa99397/tree564aa9; full fallback verify job correctly skipped; deploySUCCESS completed20:14:43Z. Checked workflow main-only guard and full preparation/deployment serialization `pages-publication`,cancel-in-progressfalse.

## Artifact integrity and live identity

Independently fetched artifact metadata and binary archives via gh API, then computed each ZIPSHA256:
- CIartifact11313686377,github-pages:9e8433ca150eae9411ce4504a7e39c13f753f8205a702a8fa5c3dcdf383c5404,exactmatchreported digest; unexpired,one-day retention.
- Pagesartifact11313986643,github-pages:ad7dbc934dab87b376ca7af68e961b34715a617a6ec50bde19a30c51f117d895,exactmatchreported digest; unexpired,fourteen-day retention.

Both archives contain only artifact.tar; validated all TAR paths relative with no traversal/backslashes and all members ordinaryfiles/directories before extracting into separate reviewer-owned temporary directories. All14regular-file names,sizes,SHA256s match between independently extracted CI and Pages artifacts. Root-provided /tmp/chronoshift-live-ci-artifact matches same inventory. Different ZIPdigests reflect repackaging/container metadata; extracted files are identical.

At2026-10-04T20:15:51.851Z independently fetched all14publicHTTPSfiles with cache-busting requests and compared exact bytes:allHTTP200/allSHA256matchPagesartifact. Live release.json sourceaa99397c07b058447c4c18fa1c938ced4f09ba97,base/ChronoShift/. sw.js VERSION59be1f21293ff6c0. Runtimeindex-CEcLWwpD.js SHA256ed89d416c2b2d1b0ac1f99ef2ee1d7534f36aa0be3564eaf6328a2e98167af7b; CSSindex-BEANxCaz.css SHA256247ee6801c6ecabcbd05fbe2adb341388dce67433d00a94ca59d3b89baca4b77; engineworker-C690IjaR.js SHA256e17b01198be6045d352561d10fe1f6004eb83d106b13f16ef027f0ec36230704. Full per-file inventory/liveheaders in publication-audit.json.

Repeatable commands/evidence: gh pr view34 --json...,gh run view37230895017/37231323924 --json... and --log; gh api repositories/actions/artifacts and binary ZIPendpoint; git rev-parse SHA^{tree}; `mise exec -- bun /tmp/chronoshift-live-code/audit-publication.ts`. Saved complete CI/Pages logs,artifactmetadataJSON,independentarchives/extractedtrees,and audit script/resultJSON. Root/adversarial browser journeys are separate evidence, not asserted by this artifact audit.

## Proposed review-guidance assessment

Independently reviewed docs/qa/live-convert-2026-10-05/workflow-followup.md. CI37230414503 verifiedfailureheadd3f6a423c22f2ebc44d1ee1ea690e14c8056bdbc; its two expected0/actual1 attempts and faster-local transient0 masking agree with this code reviewer's independent timing reproduction. Guidance paragraph is accurate/useful: audit steady-state edit/import/restore/reset expectations when interaction triggers change; exact final result identity and retained competing completion establish ownership; preserve older-release controls in rollout tooling. Approved for promotion into docs/developer/review.md.

Suggested precision in explanatory narrative: replace softened “initial review did not exhaustively audit every action-specific result expectation” with “initial review missed the restored branch’s obsolete zero-result expectation despite separately verifying automatic restoration.” This records the actual code-review expectation gap candidly without retroactive claims or expanding what the original checks proved. Other reviewer's internal reasoning remains unknown; no claim that every action was exhaustively covered.

## Verdicts and gaps

Publication source/artifact/gate audit APPROVED,no blockers. Prior scoped implementation approval retained. Feature original-report resolution NOT APPLICABLE. Live file identity verification establishes exact deployed source tree/static bytes, not historical browser/controller/device acceptance. Root hosted tests/CUA existing-tab draft-update journey and adversarialfreshChrome are separate pending/complementary checks. PhysicalIME,keyboards/phones/screensreaders/actualzoom/representative-phoneperformance and full real retained-release rollback remain unexercised by this audit. No issue-closure actions were performed.
