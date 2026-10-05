# Publication audit compatibility and requirements

Actual source-inspection clocks: `2026-10-05 09:08:10`–`09:08:28 UTC`.
Read-only inspected copied PR #39 QA script
`docs/qa/ci-maintenance-grouping-2026-10-05/root/publication-audit.ts`, SHA-256
`8c4c377bea611d386ff67a29171c6fdca21cf69f7017518210f82cd2a7d32c2e`.
No execution or API requests; this is audit readiness, not publication evidence.

No deploy-pages v5 metadata-verification incompatibility found. The audit uses
the runner's `Run actions/deploy-pages@` prefix rather than a v4-only step name;
job/run success, `github-pages` artifact selection, one `artifact.tar` ZIP member,
GitHub ZIP digest, extracted runtime/release tree identities and live bytes match
unchanged v5/v7 interfaces already source-reviewed. Extra timing artifacts do
not violate its exactly-one-Pages-artifact predicate. It does not assume a fixed
poll interval or parse v4-only deployment log cadence. It distinguishes sole
executed Slim preparation publication from a successful full fallback Web and
separate deployment, and permits fallback's rebuilt release SHA to be main.

Requirements before using this QA script for migration acceptance:

- Copy it under the migration's root evidence folder before execution. Its
  output uses `import.meta.url`; executing the PR #39 copy would replace that
  preserved `publication-reuse-audit.json`/fallback evidence.
- Supply `AUDIT_PR_NUMBER=40`, final `AUDIT_HEAD_SHA`, exact final PR gate ID,
  actual merged-main SHA and actual successful Pages run ID. Select `reuse` for
  automatic push and `fallback` for complete manual dispatch. When supplied,
  `AUDIT_RELEASE_SHA` must identify the downloaded release: trusted tested merge
  commit for reuse, checked-out main for fallback, not an assumed PR-head SHA.
- Preserve main's exact final tree through both audits. Its intentional current
  main/head/tested tree equality rejects a later evidence-only main commit too.
- Reconcile actual successful configure-pages v6 and mise v5 steps separately
  for Slim and the container fallback. The existing audit's required named
  steps omit these actions, so its approval alone does not establish that they
  executed. The fallback must show the real `inputs.publish-pages` configure
  path, upload and separate v5 deployment; Slim must show configure/upload/v5
  deployment within preparation.
- The direct timing uploader v7 branch requires final gate logs/artifact proof.
  The failure diagnostics path, cancellation/deadline and historical rollback
  conditions remain separate. A successful publication/ZIP audit cannot close
  those gaps or substitute for hosted offline and explicit-update evidence.

Verdict: **audit contract compatible in static scope**, with these operational
and acceptance requirements. No application/workflow change is requested.
