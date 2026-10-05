# Conversion-test synchronization

The ordinary conversion checks sometimes observe completed results only after
Playwright's next polling interval. The test-only helper observes the new input's
owned idle → busy → ready DOM cycle, then runs the original exact assertion with
the remaining assertion deadline. Production debounce, workers, motion, browser
profiles, fixtures and runtime source are unchanged. Pending replacement, error,
live-typing and update tests keep their original path.

Base: `82843f46e554a04d7a9db9c8b0aaacb77466442e`. Independently reviewed source:
`0f0d9d3ec38b8b53cd42b8413e52c7a0d5067318`. The served local runtime remains main
`28059a91ec9984dea4d079b3f684b3a27af669f0`, web tree
`78dbdbf65b5328416f0b169cc52d3ed9541d02f9`, root base `/`. Test source identity and
served runtime identity are recorded separately.

The [original local probe](../ci-efficiency-2026-10-05/conversion-sync-probe/report.md)
preserves all 36 ABBA observations, including fast baseline observations and an
initial setup-oracle error. Local mean total savings were 244–333 ms per conversion
across Chromium, Firefox and WebKit; native conversion completion times stayed
similar. This does not predict Linux or whole-suite savings.

The [implementation record](../ci-efficiency-2026-10-05/conversion-sync-probe/implementation-record.md)
reconciles source hashes, commands, conditions and structured attempts. Final
source passed 60 existing affected cases across five profiles without failed
attempts/retries; typecheck and formatting pass. The earlier 115-case pass used a
different preserved helper snapshot and is identified separately.

Two independent reviewers received the [saved brief](dispatch.md) with clean
context and derived failure paths before implementation. Neither saw the other's
initial verdict. Both approved exact source `0f0d9d3` with no remaining blockers:

- [Code review](code/final-review.md): 30 valid focused checks across three
  engines, including cleanup, ownership and a shared deadline. Original probe
  setup mistakes and their corrections remain preserved.
- [Adversarial review](adversarial/final-report.md): 48 exact-candidate lifecycle
  checks, competing action/state failures and a real default 10-second boundary
  followed by recovery. Unsupported initially busy calls reject before changing
  input; this is a narrow helper contract, not a general conversion API.

Each report records actual clocks, environment, scope and limitations. All owned
review/implementation previews were stopped. Synthetic input/results in these
test artifacts do not expand production diagnostic payloads.

Implementation approval does not resolve the original efficiency target.
TIE-375 remains open: the last accepted complete normal publication pair uses
442 runner seconds/eight rounded minutes versus the 307/eight baseline. Complete
GitHub verification and a matching published pair for this candidate are pending.
Physical-device, installation, screen-reader and historical-state gaps remain
open. Documentation evidence added to the reviewed source does not change its
implementation scope; subsequent delivery evidence must identify the final
tested source/tree explicitly.
