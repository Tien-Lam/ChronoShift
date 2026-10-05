# Independent maintenance configuration review brief

Current source base before documentation-only evidence delivery:
`82843f46e554a04d7a9db9c8b0aaacb77466442e`. The Dependabot file and both workflows
match that base exactly. Root will record the later exact implementation commit
before delivery. Existing runtime is main `28059a91`; no conversion/runtime
change is proposed.

Objective: reduce repeated complete verification runs for routine GitHub Actions
dependency maintenance. Five separate Actions update PRs (17–21) are currently
open. Three successful full gates started within fourteen seconds. The current
Dependabot Actions entry has weekly scheduling, limit five and no group. The
Bun dependency entry is separate.

Proposed change: add one group under only `package-ecosystem: github-actions`,
matching `"*"` and explicitly applying to `version-updates`. Preserve scheduling,
limits, Bun updates, individual security-update behavior, all workflow gates,
pinned action versions, artifact trust and main-only publishing. No dependency
upgrade, automatic merging, workflow filtering or runner change is proposed.

Derive failure paths independently before reading root's validation. Inspect
config scope/indentation, GitHub's supported group identifiers/options, major
update inclusion, security-update separation and unchanged workflow behavior.
Grouping changes PR organization; compatibility review of each included major
upgrade remains necessary. Do not assume the current five PRs are replaced, safe
to merge, or that future grouping has already been observed.

Code reviewer: validate the exact parsed before/candidate configuration and
unchanged neighboring ownership/limits. Adversarial reviewer: challenge scope,
maintenance/security behavior and any savings/adoption claims. Neither reads the
other's initial verdict. Save original reports with actual clock reads and file
hashes under this folder; distinguish configuration correctness from original
TIE-375 resolution.

Use read-only local operations, mise-managed Bun (built-in YAML parser) and gh
for GitHub operations. No developer-tool installation, browser suite, build,
benchmark, Actions dispatch, Git/source or Linear mutation. Static validation is
appropriate for this small configuration change; the existing hosted gate runs
once at the final reviewed PR head. No new mirrored unit test is needed.

Primary specification:
https://docs.github.com/en/code-security/reference/supply-chain-security/dependabot-options-reference#groups

Remaining gap: grouped PR creation and avoided future runs are prospective. The
current accepted full pair is 442 runner seconds/eight rounded minutes versus
307/eight baseline. Grouping does not establish a 20% complete-pair or monthly
usage reduction; TIE-375 stays open.
