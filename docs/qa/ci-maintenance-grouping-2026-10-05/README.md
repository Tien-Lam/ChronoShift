# Grouped Actions maintenance

Five separate GitHub Actions dependency PRs (17–21) were open during the
read-only workflow audit. Related upgrades can each trigger the complete browser
gate. The candidate adds a single `actions-maintenance` group to the weekly
Actions version-update entry in `.github/dependabot.yml`. Bun updates and
security grouping, schedules, limits, pinned dependencies and both workflows
retain their existing behavior. Every actual grouped upgrade still needs
compatibility review and the complete applicable gate.

Base: `5502b3cfdf3eac4fa0f09c0ac6f5366982c16499`. Independently reviewed source:
`4ff0472089817193a39228d93ac062107c9b441b`. Both clean-context reviewers received
the [saved brief](dispatch.md), derived failure paths before implementation and
approved the exact parsed configuration. Original reports are preserved:

- [Code initial review](code-review-original.md) and [exact-source verdict](code-review-exact-head.md).
- [Adversarial initial review](adversarial-review-initial.md) and [exact-source verdict](adversarial-review.md).

Formatting and whitespace checks pass for the authored source/documents.
Reviewers independently compared committed YAML objects and unchanged workflow
hashes. Runtime code, tests, fixtures, browser profiles and publishing integrity
are unchanged. Final hosted verification and publication remain pending; later
delivery evidence belongs in the PR and a separate documentation-only commit.

The review workflow also now describes batching reports before the final hosted
gate: evidence commits on an open runtime PR retain its cumulative runtime diff
and change the full source tree. Saving additive delivery evidence separately
avoids a redundant gate solely to annotate the completed run, while further
source changes and unresolved findings still require checks.

This configuration is supported by [GitHub's group options](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#groups).
Static correctness does not establish Dependabot service adoption, replacement
of current PRs, upgrade compatibility or avoided future runs. No 20% complete-pair
or monthly usage saving is claimed. TIE-375 remains In Progress; its accepted
normal pair is still 442 runner seconds/eight rounded minutes versus 307/eight
baseline. The [held PR #38](../ci-conversion-sync-2026-10-05/README.md) and its
complete gate remain separate evidence.
