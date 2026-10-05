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
are unchanged. Delivery is verified below; additive evidence was kept out of
the completed PR head to avoid another cumulative gate solely to record results.

The review workflow also now describes batching reports before the final hosted
gate: evidence commits on an open runtime PR retain its cumulative runtime diff
and change the full source tree. Saving additive delivery evidence separately
avoids a redundant gate solely to annotate the completed run, while further
source changes and unresolved findings still require checks.

This configuration is supported by [GitHub's group options](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#groups).
Static correctness does not establish upgrade compatibility or avoided monthly
usage. Service adoption is now observed: PR #40 groups six updates and the five
individual PRs are superseded. The [separate migration](../actions-upgrade-2026-10-05/README.md)
needs its own exact-source reviews and publishing acceptance.

## Verified delivery

PR #39 merged as main `0fb0b915a1e1f2ab19613ad1f8ac9dae0eec43cc` at
2026-10-05 08:44:10 UTC, as observed by root. [Web 37284698483](ci/review.md) passed 116 units,
249 first-attempt browser cases/nine unchanged skips and one subpath check;
zero retries or failed attempts. Head `66e5fd32` and tested merge
`8b380dcee298b06e7693fcacb9ca9c44486b3a36` share tree
`6bae04113c9ebce83e2c914a04f3f0adf0c07c5d` with merged main.

Pages 37285486254 reused the exact verified artifact in one successful Slim
job. [Independent publication audit](root/publication-reuse-audit.json), observed
08:46:24.017–08:46:32.785 UTC, passed all 66 checks and matched all fourteen
public files. Its copied audit script now requires an explicit positive PR
number instead of its original fixed PR #37; this is QA code only. Main has no
branch-protection required-status policy; the audit separately verifies the
complete gate and actual successful main publication.

[Hosted verification](root/hosted.log) passed four checks in 28.1 seconds,
including the 21-second idle window and offline reopen/fresh input at the exact
tested release. Root observed the explicit Update now action separately. The
[before/after records](root/published-side-panel.json) and
[screenshot](root/published-side-panel.png) corroborate preservation of
the synthetic June 18 Tokyo draft, Asia/Tokyo target and 19:20 result; readiness
is true and captured normal warning/error logs are empty. The before record is
at 08:39:23.140 UTC and final capture at 08:47:34.903 UTC. DOM readiness and an
unchanged script path do not independently identify the controller/cache.
Hosted-process start/end clocks and the exact update-click clock were not saved
separately; runner duration and before/final capture clocks are recorded above.

The [normal pair](ci-efficiency-current.json) uses 356 runner seconds/seven
rounded minutes versus 307/eight baseline: 12.5% fewer proxy minutes, higher raw
time and 63.15% lower API-based projected artifact byte-hours. The measurement
tool exits 1 because the complete 20% target remains unmet. Different CPU models
and setup variability prevent attributing timing differences to grouping,
which does not change browser execution. No account-wide monthly saving is
claimed. TIE-375 remains In Progress. The [held PR #38](../ci-conversion-sync-2026-10-05/README.md)
and its complete gate remain separate evidence.
