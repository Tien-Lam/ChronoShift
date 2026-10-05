# CI publishing delivery and unresolved efficiency — 5 October 2026

[PR #37](https://github.com/Tien-Lam/ChronoShift/pull/37) is merged and published.
Trusted reuse configures, uploads and deploys in one Ubuntu Slim job. Manual or
unverifiable reuse runs the complete browser/offline gate before a separate
deployment. Publishing remains main-only and serialized across the entire
workflow; a failed reused deployment cannot fall through to a second publisher.
Bounded timing metadata is opt-in; timing/resource metadata excludes input and
selected-zone values. Retained failure traces, screenshots and context separately
preserve synthetic test input/zone details for investigation. No app/runtime
optimization from the rejected experiments was shipped.

**The current 20% runner-usage target is not achieved. TIE-375 remains open.**
Implementation approval, publication proof and original-report resolution are
separate verdicts. Physical installation/share, screen reader, real zoom and phone
performance acceptance remain unverified; browser emulation does not close them.

## Exact source and two publishing paths

| Identity                                                       | Revision                                   |
| -------------------------------------------------------------- | ------------------------------------------ |
| Base                                                           | `7059da3125ada61123f91d1267bbee9a6f4792ef` |
| Reviewed PR head                                               | `b288920d072d6ebb6ca56d1ea83f7c95ea7bed02` |
| Tested PR merge artifact                                       | `997f3f2367bef1c877c207a4d89872992382d006` |
| Squashed main / manual rebuilt artifact                        | `28059a91ec9984dea4d079b3f684b3a27af669f0` |
| Identical full source tree for those three candidate revisions | `c08c0f507faf6f82fac5ce790eb2e1f89fa59cdf` |
| Unchanged application `web/` tree                              | `78dbdbf65b5328416f0b169cc52d3ed9541d02f9` |

[Final Web run 37274709527](https://github.com/Tien-Lam/ChronoShift/actions/runs/37274709527)
passes 116 unit tests, 258 configured browser cases (249 initial passes, nine
unchanged capability skips), zero failed attempts/retries and one separate
repository-subpath check. [Complete attempt/resource/source reconciliation](final-x64-candidate/report.md)
includes raw logs, API metadata and limitations of cgroup observations.

[Automatic Pages run 37276181716](https://github.com/Tien-Lam/ChronoShift/actions/runs/37276181716)
actually reuses that artifact and deploys in one preparation job: 42 seconds/one
rounded minute. [Root reuse audit](root/publication-reuse-audit.json) records 67
passing checks and all 14 public files plus the root index matching the exact
verified archive. Repackaging changes ZIP/TAR metadata; extracted file-byte
identity, not container-byte equality, establishes unchanged content.

[Manual Pages run 37276826095](https://github.com/Tien-Lam/ChronoShift/actions/runs/37276826095)
actually executes the full fallback: preparation 15 seconds, verification 350,
deployment ten, totaling **375 seconds/eight rounded minutes of additional
validation**. The full inventory again has 249 initial passes/nine unchanged
skips, zero failed attempts/retries, 116 units and one subpath pass. Exactly one
deployment step executed; the preparation environment record alone did not
publish anything. [Root fallback audit](root/publication-fallback-audit.json)
records 68 passing checks, the main source revision, unchanged immutable runtime
assets and every public file/root index matching the rebuilt archive. Both audits
verify successful trusted gates, digest, safe archive and exact source trees.
The branch-protection required-status-check API returned HTTP 404 “Branch not
protected”; the successful Web check and complete gate were independently
verified. The separate Pages environment policy allows main-only deployment.

| Artifact                   | ID          | ZIP SHA-256                                                        |
| -------------------------- | ----------- | ------------------------------------------------------------------ |
| Verified PR                | 11330240757 | `87d46fb4d220e5e7951a72b31779d4fb197012a01cfa6915d5646cef75141181` |
| Automatic publication      | 11330182609 | `500f88e3af805cc8cf66a91915c1bac4ea3b079d91b06b8063d218fc04332318` |
| Manual rebuilt publication | 11331175437 | `1028f12e73b87ebb12f0bb37b1cddac6803fd4ccfc7e562494b9f8069c39da95` |

The automatic artifact intentionally embeds the tested PR merge SHA; the manual
artifact embeds checked-out main. Publication-time audits preceded the later
documentation-only commit; that commit does not rebuild the app.

## Independent review and hosted behavior

The exact clean-context task briefs are saved in [fresh-review-dispatch.md](fresh-review-dispatch.md)
and PR comment 5989792924. Each reviewer received source/report conditions and
derived relevant failure paths before reading the other's verdict:

- [Fresh code review](fresh-code-review.md): complete changed source, unchanged
  lifecycle/trust owners, timing privacy/caps and exact full-gate evidence.
  [Automatic delivery supplement](fresh-code/delivery-review-automatic.md)
  independently downloads/checks archive and published files, preserving the
  original overstrict container-equality check and its correction.
  [Manual supplement](fresh-code/delivery-review-manual.md) independently proves
  fallback execution, complete attempts, artifact/public identity and the bounded
  local runtime probe.
- [Fresh adversarial review](fresh-adversarial-review.md): 25 pure checks and 15
  actual mocked-gh verifier cases, positive controls and artifact/tree proof.
  [Automatic delivery supplement](fresh-adversarial-delivery-supplement.md)
  independently verifies real execution/public files and original baseline cost
  qualifications and complete manual fallback. Follow-up raw evidence is under
  `fresh-adversarial/` and `fresh-code/`, with actual start/end clocks and
  environment.

Both initial reviewers approve the bounded implementation; neither certifies
TIE-375's unmet original usage target or unexercised physical/human conditions.
Their saved supplements establish the real publishing paths, separately from
browser behavior.

Four [hosted checks after reuse](root/hosted-reuse.log) pass in 25.6 seconds; four
[after manual fallback](root/hosted-fallback.log) pass in 27.4. Each covers a
21-second ordinary-use observation, timezone changes, cached offline close/reopen
with fresh input, scoped manifest/release and effective CSP. Deliberate CSP fault
injection is distinct from unexplained normal-use errors.
[Invocation record](root/hosted-fallback-invocation.json) saves the owner's exact
expected-source environment/command and a later observation of the configured
Chromium executable/version. Exact original test-process absolute clocks and
browser version were not emitted; no retrospective clock or process identity is
inferred from that later observation.

The actual browser side panel retains the existing draft
“June 18, 2026 at 7:20pm in Tokyo”, target `Asia/Tokyo` and exact result `19:20`,
18 June, through explicit **Update now** on both publications. Final DOM reports
readiness true and `/ChronoShift/assets/index-CzXW0WLz.js`; normal warning/error
logs are empty. [Before update](root/before-fallback-explicit-update.json),
[final DOM/console](root/published-fallback-side-panel.json) and
[published screenshot](root/published-fallback-side-panel.png) preserve that
journey. This is actual retained-tab update evidence, not only a fresh-session
check. It does not record exact post-update controller/cache identity; the script
path is unchanged across the releases. The unknown historical Chromium failure
still cannot be reconstructed.

## Cost target and rejected hypotheses

The unchanged strict [measurement](ci-efficiency-current.json) exits **1**:
baseline 307 seconds/eight rounded minutes versus current normal PR/publication
pair **442 seconds/eight minutes**. Raw usage increased 43.97%; rounded saving is
zero. The original baseline had 68 browser cases per full gate versus 258 now;
this target comparison is not an isolated same-workload causal speedup.

[Raw metrics, original artifact correction and investigation ledger](publication-input/report.md)
preserve two projected-storage views: 63.00% lower using surviving API artifacts,
69.22% lower including the log-proven original Pages artifact no longer listed by
the API. Neither establishes runner savings. Five rejected/instrumented Actions
experiments add 2,032 runner seconds/36 rounded minutes; manual validation adds
another 375/eight. The normal pair and those additional runs total **2,849
seconds/52 rounded minutes** in this declared subset, not the entire account or
all historical debugging. Storage is configured-retention projection; rounded
minutes are a per-job quota proxy, not monthly billing.

[Cache cleanup](root/cache-cleanup.json), [independently checked](adversarial-cache-claim.md),
removed only a rejected ARM cache and three obsolete merged-PR caches:
1,730,963,608 → 1,096,667,166 bytes, **36.64% lower occupancy**. Main and open
dependency-PR caches remain. Cache occupancy is separate from runner usage and
artifact byte-hours.

Worker-count, ARM and virtualization experiments failed to establish a sufficient
improvement and were reverted. Original reports, actual retries and evidence
corrections are preserved rather than replaced by final green-status summaries.
The correct fixture-served origin/assets matter: earlier virtualization captures
that did not override the WebKit fixture were not independent before/after proof.

A further [local CLI runtime probe](root/runtime-probe/analysis.json)
used the unchanged complete themed-choice journey in all five applicable
profiles, four workers, normal motion and one fixed root-base local artifact.
Order was Bun → Node → Node → Bun; all 20 initial attempts pass. Mean elapsed
time was 22.215 seconds for Bun versus 22.833 for Node (2.78% slower). The switch
was rejected; no new Actions run or app/runtime change followed from this local
comparison. Local macOS ARM and root-base assets are distinct from hosted Linux
x64 and published subpath assets. Raw lists, timing reports, config, file hashes
and the nested HTML-folder warning are preserved in that folder.

The follow-up [bounded dropdown profile](dropdown-profile/report.md) retains 36
unchanged-runtime operations at two widths and four direct native-animation close
observations. Unsampled thread-domain counters point toward collection lifecycle
scripting rather than dominant layout cost; the close observer distinguishes a
running entry animation from an already settled one. These are local explanatory
observations, not a Linux speedup, phone benchmark or approved app candidate.
Both reviewers confirmed 50 negative intervals in the separate CPU sampler output;
its weighted duration/ranking claims are invalid and are explicitly retracted.
Original reports, samples and calculations remain preserved. Exact gzip copies
retain both full timelines without adding the larger uncompressed originals to
Git. Complete collection semantics, normal motion and all existing assertions
remain unchanged; TIE-375 is still open.

## Remaining delivery work

[Live four-project reconciliation](delivery-input/reconciliation.json), captured
07:06:49 UTC, has 44 tickets: 32 Done, one Canceled and 11 In Progress. Foundation
is completed; Experience, Offline PWA and Delivery remain in progress. Milestone
progress is from Linear, not inferred from binary issue counts.

Nine tickets retain actual phone/installed/share/screen-reader/zoom/human
acceptance gaps: TIE-304, 306, 309, 311, 312, 314, 317, 318 and 320. TIE-370
retains the lost historical Chromium controller/cache cause, while the
successful-retry diagnostic-upload gap is now demonstrated by an actual bundle.
TIE-375 retains the expanded-suite usage miss. Implementation and available
automated evidence do not justify closing those gaps or the remaining projects.
