# Factory disqualification and acceptance-document review

**Reject lazy test-release initialization as an implementation candidate.** Its existing construction is negligible in this bounded local check; no source change or hosted experiment is justified. **Approve the small `docs/planning/web-acceptance.md` diff, no blockers**, within documentation/evidence-summary scope. TIE-375 and the eleven open acceptance/report items remain unresolved.

Review began **2026-10-05 07:53:26 UTC**, final source/evidence read completed **07:54:59 UTC**. Checkout HEAD `e66c6449c97fd97e72205aba4815b4225da105be`, unchanged runtime source `28059a91ec9984dea4d079b3f684b3a27af669f0`, web tree `78dbdbf65b5328416f0b169cc52d3ed9541d02f9`. Environment: macOS/Darwin27.0.0 arm64, Apple M4 Pro,14 logical CPUs,48GiB visible RAM, mise Bun1.4.0 at `/Users/tien/.local/share/mise/installs/bun/1.4.0/bin/bun`. No installation, source/config/dist edit, browser/server/build operation, Actions dispatch or ticket mutation occurred.

## Actual factory check

Command: `mise exec -- bun docs/qa/ci-efficiency-2026-10-05/fresh-adversarial/factory-disqualification.ts`. Orchestrator clock **07:54:07.419–07:54:07.631UTC**. Three alternating blocks each ran a new-process single call, then another fresh process with four calls. All15 raw call records remain in [combined JSON](factory-disqualification.json); six per-process stdout files use `factory-disqualification-{1,2,3}-{fresh,warm}.json`. The three additional first calls in warm blocks are retained, not silently selected as warm observations.

| Condition | n | Wall median / range ms | Process CPU median / max ms |
| --- | ---: | ---: | ---: |
| One call per fresh process | 3 | 7.116 / 6.216–7.188 | 8.831 /9.129 |
| Subsequent calls within warm process | 9 | 5.445 /4.817–7.114 | 7.325 /8.782 |

The timing window covers the existing `testReleases(dist)` construction, including its filesystem reads, replacement and integrity work; process/module startup and output hashing are excluded. CPU is process-wide user+system across Bun threads, so it can exceed wall time. Input inventory hashing before the children warms filesystem data; OS page-cache state is uncontrolled. “Fresh” means a fresh process, not a cold disk. Repeated output hashing can also warm subsequent calls. This measures the requested factory component, not browser startup or Linux performance.

Before/after inventories prove every existing `dist` file byte-identical. Release metadata identifies main28059/base `/`. Exact JS hash remains `b2ec5e8a200f317d260cd7e596c1f9a8d417f55f4379803a39867553791ae640`, matching the bounded dropdown profile. Factory source SHA-256 is `82e90fd45a4bd5f94c046a6ebe572e6b879120f2779ddc2186e82edbb2ba6f5a`; every generated release/immutable-map inventory has identical combined hash `300881fdf2c73b45581ee2d087163e8c4fb299b1f92b4b866adac7675431bcad`. Raw data stores all input hashes and actual call clocks.

The proposed lazy path would add deferred-error/concurrent-promise lifecycle complexity to avoid only a few milliseconds per GET-only server in this environment, and merely move work to the first POST for release-changing tests. This fails the initial materiality screen. I withdraw the prior recommendation to implement/prototype that optimization; no Linux gain or target conclusion follows. The earlier raw timing aggregate discrepancy remains a qualified difference between saved raw/summary records, not a diagnosed application/reporter bug.

## Acceptance-document delta

Reviewed document SHA-256: `05a2047596669532329cbfea04617d4b850de00742fa369cfddb8d73adafdd52`. The diff accurately distinguishes automatic tested merge `997f3f2367bef1c877c207a4d89872992382d006` from publishing main `28059a91ec9984dea4d079b3f684b3a27af669f0`, shared complete tree `c08c0f507faf6f82fac5ce790eb2e1f89fa59cdf`, and the subsequent complete manual fallback rebuilding main. These match my previously independent digest/tree/public-byte delivery observations, not merely root's audit booleans. Git read confirms PR36 main67be→PR37 main28059 has no `web/` source diff.

The stated116 units/249 initial browser passes/nine CDP skips/subpath agrees with the complete PR/manual logs and marker/artifact evidence; it does not imply direct structured-attempt retention for those timing-disabled runs. Automatic and fallback hosted logs respectively show four passes25.6s/27.4s. Saved side-panel states retain the June18 Tokyo draft, target/result and readiness. The overview claims bounded explicit-update preservation, not exact post-update controller/cache identity or physical acceptance; the separate delivery supplement retains those gaps.

The four-project reconciliation captured **07:06:49.455UTC** contains44 tickets:32 Done,11 In Progress,one Canceled, no Todo. Nine are physical/installed/human capability gaps, plus TIE-370's unknown historical cause and TIE-375's expanded-suite efficiency shortfall. The doc labels this as a timestamped snapshot and correctly preserves historical project/milestone qualification. Current442 runner seconds/eight rounded minutes and unmet target are stated separately from the earlier168-case sample's25%/26.71%/74.83% savings. Those earlier numbers are now explicitly historical, avoiding a current-suite gain claim. Linked evidence paths exist. Documentation approval does not close any original report or acceptance ticket.
