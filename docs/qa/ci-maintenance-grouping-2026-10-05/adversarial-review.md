# Independent adversarial review: exact implementation

This follows the preserved `adversarial-review-initial.md`. The initial competing
paths were derived before root supplied the implementation commit; no code-review
verdict was read. Root's claimed formatting pass was not used as configuration
evidence.

## Exact scope, timing and environment

- Base: `5502b3cfdf3eac4fa0f09c0ac6f5366982c16499`.
- Reviewed source commit: `4ff0472089817193a39228d93ac062107c9b441b`.
- Scope: five new lines under GitHub Actions in `.github/dependabot.yml`, the
  additive evidence-batching paragraph in `docs/developer/review.md`, and the
  saved dispatch brief. No dependency upgrade or workflow source change.
- Actual static command/reference observation window: 2026-10-05 08:33:59 UTC
  through 08:34:07 UTC, captured with `clock.curr_time`. These bound this delta
  review only; report writing follows. Initial window is recorded separately.
- Same Darwin 27.0.0 arm64 environment and mise-managed Bun 1.4.0 as initial.
- No browser/build/test/Actions/Git/Linear mutation or installation. Reports are
  the only files this reviewer wrote.

## Independent checks and results

`git rev-parse 4ff0472 4ff0472^` established the exact source and base above.
`git show --stat --oneline 4ff0472` and the scoped `git diff 5502b3c 4ff0472`
showed the bounded scope. A read-only `mise exec -- bun -e` parsed both committed
Dependabot blobs with `Bun.YAML.parse`, removed only the candidate Actions group's
key, and asserted deep serialized equality to the base. It separately asserted
the precise group map. Both assertions passed:

```yaml
groups:
  actions-maintenance:
    applies-to: version-updates
    patterns: ["*"]
```

The group belongs only to the GitHub Actions entry. Its name obeys the documented
identifier restriction. No `update-types` restriction is present, so major
updates remain included; this matches the brief and is not a compatibility
approval. Bun's entry, directory `/`, weekly schedules and both limits of five
are exactly unchanged. Security grouping is not added by this configuration.
Repository-wide security settings were not inspected; approval is limited to
preserving behavior controlled by this file.

Both workflow hashes match the initial/base identities, and the unchanged
artifact-reuse owner still requires trusted successful PR steps, artifact digest
and exact source tree. The full gate and SHA pins, main-only preparation,
publication serialization and existing path filters therefore remain unchanged.
No automatic merge or workload filtering was introduced.

The added review paragraph accurately explains why a documentation commit can
still trigger verification on a runtime PR and why changing the tree invalidates
artifact identity. The current [GitHub workflow syntax reference](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#git-diff-comparisons)
documents PR path filtering through a three-dot comparison of the topic head and
its synchronization point with the base. The recommendation to save later
additive delivery evidence separately preserves the tested source head and
explicitly retains checks for further source changes or unresolved findings.

| Committed file at reviewed source | SHA-256 |
| --- | --- |
| `.github/dependabot.yml` | `70ba896b31a57451dbfe71c8d08152096bf170119bfa8038d97ea5ad640ce2dd` |
| `.github/workflows/web.yml` | `6701f72007ce6821f9c7ddf24b6200c51ef7adeb6a2277e6de6b26748e172b66` |
| `.github/workflows/pages.yml` | `ff7ec8b1dd51086de24611fd7f23671efb149f5db4d3d1ea4727a0aea0892a44` |
| `docs/developer/review.md` | `79ec6120dfa8dd4c053064fae4e90144684a6a076c6b8fbc9c6231fb5081afe8` |

The [current Dependabot options reference](https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#groups)
supports the proposed group semantics. Together with parsed exact-blob checks,
this establishes static configuration correctness within the stated scope.

## Findings and separate verdicts

No blocking or actionable defect found in the exact implementation or additive
review paragraph.

**Implementation: approved** at `4ff0472089817193a39228d93ac062107c9b441b`
within this small static configuration/documentation scope. The final hosted gate
is owned by root and was not run or observed by this reviewer.

**Original TIE-375 report: unresolved/unverified.** Grouped PR creation and avoided
future full gates remain prospective. Existing PRs 17–21 were not replaced or
declared mergeable by this review. The limit five and actual future updates may
affect adoption; major upgrades or rebases can introduce additional verification
runs. No 20% complete-pair or monthly usage reduction has been established. The
brief's measured full pair is still 442 runner seconds/eight rounded minutes
versus 307/eight baseline. Keep TIE-375 open until matching acceptance evidence
exists.
