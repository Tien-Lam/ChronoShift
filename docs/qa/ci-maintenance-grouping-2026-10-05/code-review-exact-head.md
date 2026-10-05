# Independent code review: exact implementation

This is the separate candidate verdict following `code-review-original.md`.
Neither the adversarial review nor the implementer's validation results were
used to derive or pass the static assertions below.

## Revision, scope and provenance

- Exact implementation: `4ff0472089817193a39228d93ac062107c9b441b`.
- Immediate implementation base: `5502b3cfdf3eac4fa0f09c0ac6f5366982c16499`.
- Original source base: `82843f46e554a04d7a9db9c8b0aaacb77466442e`.
- Exact-head observations started at actual clock read
  `2026-10-05 08:33:41 UTC`; the YAML/hash assertions completed before actual
  clock read `2026-10-05 08:33:58 UTC`. Documentation reference checks and
  surrounding source reads followed and completed before actual clock read
  `2026-10-05 08:34:49 UTC`; their individual command timestamps were not captured.
  These are observation bounds, not report-writing timestamps.
- Environment and initial failure paths remain as recorded in the original
  report: local macOS arm64, mise-managed Bun 1.4.0.
- Reviewed diff: five added Dependabot lines, nine added review-workflow lines,
  and the saved maintenance brief. Earlier unrelated conversion QA evidence was
  identified by changed-path listing but was not re-audited in this review.

## Commands and conditions

`git rev-parse 4ff0472 5502b3c` resolved full revisions. `git diff 5502b3c
4ff0472 -- .github/dependabot.yml docs/developer/review.md
docs/qa/ci-maintenance-grouping-2026-10-05/dispatch.md` established the bounded
implementation diff. `git diff --name-status ORIGINAL_BASE 4ff0472` separated
earlier documentation delivery from this change.

`mise exec -- bun -e` read each file from both exact Git objects with `git show`,
parsed Dependabot through `Bun.YAML.parse`, compared the candidate to a separately
constructed exact expected object, deleted only the expected Actions group and
compared the remaining object to the base, validated the group identifier, and
SHA-256 hashed exact-head files. All assertions passed (exit 0). This is a
one-time reviewer check, not a new implementation-mirroring unit test.

The expected candidate has exactly:

```yaml
version: 2
updates:
  - package-ecosystem: bun
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
    groups:
      actions-maintenance:
        applies-to: version-updates
        patterns: ["*"]
```

The identifier starts and ends in letters and contains only supported letters
and a hyphen. The wildcard parses as a string. No `update-types`, ignore,
exclusion, target-branch, security group or cross-ecosystem group was added.
Major version changes remain eligible for the group. Bun ownership, directories,
weekly scheduling and both PR limits remain exactly unchanged.

[GitHub's groups reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#groups)
supports these options. Explicit `version-updates` excludes security updates
from this rule. No claim is made about repository settings outside this file or
compatibility of future major updates.

## Exact-head hashes and lifecycle controls

| File | SHA-256 | Unchanged from immediate base |
| --- | --- | --- |
| `.github/dependabot.yml` | `70ba896b31a57451dbfe71c8d08152096bf170119bfa8038d97ea5ad640ce2dd` | No; expected group only |
| `.github/workflows/web.yml` | `6701f72007ce6821f9c7ddf24b6200c51ef7adeb6a2277e6de6b26748e172b66` | Yes |
| `.github/workflows/pages.yml` | `ff7ec8b1dd51086de24611fd7f23671efb149f5db4d3d1ea4727a0aea0892a44` | Yes |
| `scripts/reuse-pages-artifact.ts` | `a2ab1a1b5ba2e240dab974b7a725a096a63adf01e1255e75fe70ea8716ac5af1` | Yes |
| `docs/developer/review.md` | `79ec6120dfa8dd4c053064fae4e90144684a6a076c6b8fbc9c6231fb5081afe8` | No; batching guidance only |
| `dispatch.md` | `549df29a458c6cd498a7e086b847ec482a27be337e28ff2c15af7eaa5d0b22e8` | New |

Every exact-head file above also matched the working tree during the assertion.
Both workflows and the verifier retain their original-base hashes. Consequently
all pinned Actions, complete PR checks, existing filters, permissions, runners,
same-repository artifact trust, source-tree/digest validation, full-gate fallback,
main-only preparation and publication serialization remain unchanged.

The new review guidance is factually bounded by "can still trigger". GitHub
evaluates PR paths using a three-dot comparison with the last base synchronization;
an added documentation commit can leave previously changed runtime paths in that
comparison. This explains why the current last-commit-only documentation content
does not necessarily skip the gate. See
[GitHub's diff comparison reference](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#git-diff-comparisons).
The guidance does not disable gates: source changes and unresolved findings still
require appropriate checks. The unchanged verifier compares full Git trees, so
adding tracked evidence changes artifact-verification identity even when runtime
files are unchanged. Keeping additive post-gate evidence in the PR and a separate
documentation follow-up preserves the tested head.

## Findings and separate verdicts

- Findings: no actionable blocker in the reviewed configuration or added review
  guidance.
- Implementation: approved for exact commit
  `4ff0472089817193a39228d93ac062107c9b441b` within this static configuration and
  documentation scope. Future grouped PRs still require compatibility review and
  the existing complete gate. This approval can carry forward for additive
  review-evidence-only commits if source/config/workflow bytes remain identical.
- Original report (TIE-375): unresolved. Prospective grouping is a bounded
  maintenance change; neither service adoption nor a 20% complete-pair/monthly
  reduction was established.
- Evidence gaps: no final hosted gate was run by this reviewer, no generated
  grouped PR was observed, and no avoided-run or monthly usage measurement was
  made. The dispatch's existing PR counts and runner measurements were treated
  as supplied context, not independently re-audited historical observations.
  No dependency upgrades, browser/build/test runs, GitHub/Linear mutations or
  developer-tool installs were performed.

## Additive provenance reconciliation

At actual clock read `2026-10-05 08:35:47 UTC`, the reviewer reconciled a root
question about the initial HEAD. The original command output remains available
in the reviewer session: the successful `git rev-parse HEAD` output (tool chunk
`08eea7`) was exactly:

```text
82843f46e554a04d7a9db9c8b0aaacb77466442e
```

That command was issued immediately before the actual `08:32:41 UTC` clock read
and used the tool's default configured working directory; it did not include an
explicit `workdir`. The original report's observed HEAD was based on this actual
output, not inferred from the brief. Root reports that its own main checkout had
already reached `5502b3c` when dispatch occurred. The reason for that difference
in observed state is unknown; this reviewer does not infer shared-checkout
ordering from root's timing. The original report is preserved.

A fresh command with explicit
`workdir: /Users/tien/Developer/ChronoShift` returned
`4ff0472089817193a39228d93ac062107c9b441b` during reconciliation. The candidate
review independently resolved and inspected full exact Git objects
`4ff0472089817193a39228d93ac062107c9b441b` and
`5502b3cfdf3eac4fa0f09c0ac6f5366982c16499`, so the initial HEAD discrepancy
does not alter the bounded implementation approval or the recorded unchanged
configuration/workflow hashes.
