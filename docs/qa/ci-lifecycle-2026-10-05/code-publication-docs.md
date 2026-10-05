# Independent code review: final documentation and publication evidence

## Scope and clock provenance

Reviewer: `ci_lifecycle_code`. Read-only review on macOS/Darwin arm64, repository `/Users/tien/Developer/ChronoShift`, HEAD/main `67be6094afd71dc512e001df632cb8157bc71d45`. Actual UTC clock observations bound this review from **2026-10-05 05:47:06 to 05:50:04**. These are review observations, not inferred browser/build start or end times. Report writing follows that last observation; its exact completion time is not instrumented.

Scope: QA README Publication, publication audit source/log/JSON, hosted and selection observations, side-panel JSON/PNG, developer testing/web/ci-efficiency/review guidance, acceptance status and Linear map. No build, runtime gate, browser experiment, audit rerun or production edit. Prior runtime approval at `9c7965acfbcbe034471ad427625eb624792812eb` is retained within its recorded conditions. This report adds documentation/publication review only.

The audited documentation draft has these SHA-256 identities:

| File                                 | SHA-256                                                            |
| ------------------------------------ | ------------------------------------------------------------------ |
| QA README                            | `19dc3e2ea015bc867659f061a72634b895b4a4deb23a2bab0ba99c770696f66f` |
| developer/testing.md                 | `ede6800c0e5aab63c0b15b21a92f5d94fbb20a63b493efa6639d28e7b3ff6326` |
| developer/web.md                     | `1e4c3e70780244633f6bc9bc2a70b789a76b360f0d0609bfe05a0c27cebc9578` |
| developer/ci-efficiency.md           | `fd3b922433ddb53681e59885e8269015c24f0ed9d3a0b50c3e2002492315f788` |
| developer/review.md                  | `f50fa74be7df7a20b685bca5f6dcb5949f3db1831392a3f80301e22be8d1e06c` |
| planning/web-acceptance.md           | `639389282b4cdecbf37924d6767e5fb61c83393b21565adca4fa00c74fb34b20` |
| planning/offline-web-linear-map.json | `f48087bcd15b0350d0553f0445a5dc290accc376ec4767bd18b250c792c2ebad` |

## Independent checks and findings

No blocker found in this delta. I inspected the audit and hosted script implementations alongside their raw outputs, then independently checked run/commit/artifact metadata with `mise exec -- gh api`, local trees with `git rev-parse`, and retained archive/file hashes with Bun. Saved independent checks: [publication-readonly-verification.json](code/publication-readonly-verification.json), captured `05:48:23.769Z`; [publication-docs-links.json](code/publication-docs-links.json), captured `05:48:46.155Z`. The latter records 82 local link targets, all present. Formatting of the seven scoped documentation files passed. These checks do not repeat public behavioral tests.

### Source and publication identity

GitHub metadata independently confirms successful Web CI `37268219679` at reviewed head `9c7965a`, and successful main Pages run `37268626778` at `67be609`. GitHub commit metadata for tested source `59a182b393e339234f8bfbd1f803b512e8a3c2d8`, and local reviewed/main trees, agree on exact tree `7a2253291a47837fab35a27d9dc0af9c615d5408`. A different commit identity does not imply a different source tree here; the README correctly preserves both.

Independent GitHub artifact metadata and rehashes of the retained downloaded ZIP bytes agree:

| Artifact             | ZIP SHA-256                                                        | Size          |
| -------------------- | ------------------------------------------------------------------ | ------------- |
| Web CI `11327332721` | `2acde49b3b7b3effaa1eee8370164f372b8a9f2e6b8d65bdf5255fd0e95f7163` | 374,682 bytes |
| Pages `11327123688`  | `fded4f4c2d1425987fbad2570dba940ff401d4161ca77b5be479c9aa673d18a5` | 374,673 bytes |

All 14 extracted files in each archive independently match the saved inventories (28 file comparisons). The archive/tar wrappers differ, while extracted runtime files match. The saved audit's 63 checks are actual structural, workflow, identity and public-byte checks, not 63 browser cases. Its source verifies trusted repository/workflow/PR metadata, named gate steps, artifact digest, safe bounded archive structure, inventory equality, and public root/files. The published service-worker version is `137f59cf04783ef5`, JS asset `index-CzXW0WLz.js`.

The audit records `began=05:39:23.823Z`, `ended=05:39:37.470Z`; every saved command interval is ordered and inside those bounds. Required branch-protection lookup returned optional 404 and is an explicit gap, not a successful required-check rule. The script instead verifies the named successful gate steps and Web check. The README makes this limitation visible. I did not refetch the public files: public byte equality remains the saved audit's observation, independently reviewed against its implementation and inventories.

### Hosted behavior and observation limits

The hosted Playwright log supports four passing checks in 28.8 seconds, including the bounded idle and offline close/reopen checks, deployment metadata/MIME/CSP. It does not record absolute runner start/end timestamps; none are inferred here.

The separate installed Chrome selection script/report identifies Chrome `154.0.8037.93`, Darwin arm64, viewport 606×988, locale `en-AU`, timezone `Australia/Sydney`, and expected release `59a182b`. Its actual timestamps are `05:40:41.130Z` through `05:40:46.084Z`. For both fields it moves the pointer before the alias hover, verifies Osaka hovered but not focused, retains canonical Asia/Tokyo on Tab, and checks exact output dates/times plus the other field's independence. It also exercises deliberate keyboard Tab and pointer selection. Its assertions and saved observations support the README's hosted claims; it does not independently test Enter, which remains covered by the earlier candidate review/tests. No page errors are recorded.

I inspected `published-update.json` (`05:41:24.337Z`), `published-side-panel.json` (`05:41:41.876Z`) and the PNG. The recorded draft/result and final canonical Asia/Tokyo / 19:20 / June 18 / ready state agree with the screenshot and asset identity. Intermediate update-click/CST transitions are implementer observations; these two state snapshots do not independently replay their full sequence. The unavailable navigator/service-worker bridge remains explicitly qualified; the panel screenshot is not controller identity proof.

### Guidance, ticket snapshot and remaining gaps

Developer guidance correctly distinguishes failed attempts from final test outcomes, retains screenshots/traces after a successful retry using the marker, and uses nested subpath output so cleaning it cannot delete browser evidence. Clock guidance and selection guidance retain the lessons already reviewed: preserve unsupported original labels with a separate correction, distinguish typed/selected/focused state, prepare pointer modality causally, compare Tab and ordinary blur, and scope to the input-owned list when exiting overlays overlap.

The map's actual `tickets` object totals 44 entries: 32 Done, 11 In Progress, 0 Todo, 1 Canceled. TIE-374 is Done; TIE-370 and new TIE-375 are In Progress. Acceptance and map agree on those counts and source identities. There is no stray `issues` schema key in the current map. The implementer's initially reported wrong-key operation failed before writing; the current evidence is the corrected actual schema. This is consistency review of the saved ticket snapshot, not a fresh independent Linear/project/milestone state query.

Current cost evidence reports 326 aggregate job seconds / 8 rounded hosted minutes versus baseline 307 / 8: raw time increased 6.19%, rounded saving is 0%, and projected artifact byte-hours fell 63.25%. The strict tool flags the unmet timing/rounded target and its implementation returns exit 1; documentation correctly keeps TIE-375 open. The larger suite is not an equal-workload speed comparison, and the older successful optimization sample remains historical. No pending optimization is accepted here.

TIE-370's historical CI cause remains unknown. The bounded readiness fix approval is separate from resolving that report. The selection failure's focused-hover/Tab mechanism was independently reproduced before the fix and prevented after it; CI/publication and hosted evidence now support the published implementation. Incidental original pointer timing and physical iPhone Safari acceptance are still qualified. The nine physical/human acceptance gaps remain open. A hosted successful-retry diagnostic upload has not been newly demonstrated by this all-first-attempt CI success; local retention probes and inspected workflow conditions remain its bounded evidence.

## Separate verdicts

- **Implementation/documentation verdict: approved, no blockers** for this exact documented publication delta, retaining prior runtime approvals and their limits.
- **Original report resolution verdict:** selection mechanism reproduced and fixed with matching published evidence; TIE-374 completion is supported within that scope. Historical TIE-370 CI cause remains unresolved/open. TIE-375's current efficiency target miss and physical/human acceptance gaps remain open. This docs review adds no runtime or physical-device acceptance.
