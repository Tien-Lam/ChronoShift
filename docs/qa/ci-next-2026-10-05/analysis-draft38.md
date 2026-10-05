# Draft PR 38: independent adoption assessment

Assessment source: main `f8c073a289f2c4af1f369a4588d5e0e74daf392c`, full tree
`4f49ec284d40321df2878bb4033a2fbf466c715f`; PR38 head
`299e3864f01d4e87a1770594628b84cf5a3972c8`, full tree
`e0363793275e991d25b47bf7b6307e95187aa2bb`; original base
`82843f46e554a04d7a9db9c8b0aaacb77466442e`. `gh pr view 38` confirms that
the PR remains open and draft on `codex/ci-conversion-sync`.

This is a read-only source/evidence assessment, with this report as its sole
owned write. No checkout, application/test/workflow edit, install, browser run,
build, full suite, Actions dispatch/rerun, GitHub mutation or deployment was
performed. Commands use repository cwd and mise-managed gh/Bun1.4.0. The first
observation start clock was not captured and is unknown; actual later command
clocks were `2026-10-05T10:24:25Z` (apply/source check) and
`2026-10-05T10:24:49Z` (offline aggregation complete). Report-writing completion
clock was `2026-10-05T10:25:50Z`. This is not either required final independent review.

**Recommendation:** resolve PR38 by a bounded, same-machine test measurement,
then merge only if it shows a useful incremental saving. If the result is small,
neutral or inconsistent, close it with its correctness evidence preserved.
Nothing in current evidence makes PR38 a plausible sole solution to TIE-375.
An additional runtime synchronization requirement could justify adopting it,
but none is established by the efficiency report.

## Why the local gain did not establish a global improvement

The original [ABBA probe](../ci-efficiency-2026-10-05/conversion-sync-probe/report.md)
measures a real mechanism: after genuine DOM completion, Playwright's backoff can
delay the next locator observation. Local normal fill → four exact assertions
averaged 579–639ms; observer → the same assertions averaged 305–335ms. The
244–333ms average gain occurs after the app's completion; native debounce/worker
completion remains approximately 292–318ms. Fast baseline observations are also
preserved. It is a warmed serial Darwin arm64 experiment with six observations
per mode/engine, not Linux x64 four-worker execution or a complete-suite result.

PR38 adopts **15 effective calls per profile**, across **12 semantic tests**:
six app calls in five tests; two controls calls; five privacy calls (two source
sites each execute in the lens/command loop, plus one shares site); two responsive
calls. Five profiles therefore execute 75 adopted conversions in 60 affected
cases. The foldable project is unaffected. The helper runs the original first
assertion after owned completion; subsequent journey assertions remain in place.

Applying the local mean range to 75 conversions gives only **18.3–25.0 aggregate
case seconds**. Dividing by four gives **4.6–6.2 four-slot-equivalent seconds**.
This is scale arithmetic, not a prediction, a strict wall-time bound or an
exclusive CPU saving: scheduling, contention, native pipeline time, helper
protocol/observer overhead and polling boundaries differ. Even a generous
500ms gain on every adopted call gives only37.5 aggregate case seconds. The
candidate deliberately leaves most suite work untouched. It does not remove
debounce, workers, motion, fixture servers, navigation, menu actions, offline
deadline checks or other expectations.

The [saved Linux reconciliation](../ci-conversion-sync-2026-10-05/ci/review.md)
shows PR38 Web455s/eight rounded minutes versus PR37 Web400s/seven. The
job-start→first-step interval is37s versus1s, accounting for36 of the55s difference.
Browser steps are368s versus347s. CPUs differ (EPYC7763 versus EPYC9V74), so these
single samples prove neither a causal regression nor a causal gain.

I independently parsed the two saved complete list logs, stripping ANSI escapes
and matching passing rows by project/file/title with their final ms/s/m duration.
Both contain249 passing browser rows; the existing adoption title selector
identifies60 affected rows in each:

| Rounded concurrent case seconds |     PR37 |   PR38 | Difference |
| ------------------------------- | -------: | -----: | ---------: |
| Affected60                      |    305.8 |  313.8 |       +8.0 |
| Other189                        | 1018.641 | 1085.6 |    +66.959 |
| Affected Chromium               |     45.2 |   40.1 |       -5.1 |
| Affected Firefox                |     68.1 |   74.0 |       +5.9 |
| Affected WebKit                 |     90.1 |   94.3 |       +4.2 |
| Affected Android                |     40.7 |   41.5 |       +0.8 |
| Affected iPhone                 |     61.7 |   63.9 |       +2.2 |

Inputs were `../ci-efficiency-2026-10-05/final-x64-candidate/run.log` and
`../ci-conversion-sync-2026-10-05/ci/run.log`. Selector:
`pasted HTML|convert, inspect ambiguity|close and reopen offline|preferences persist, input does not|readable at 320px|legacy .* preferences migrate|invalid and oversized local shares|reflows across|touch-sized controls|choice menus support|timezone search preserves`.
No observed failure or retry is excluded. These rounded durations include each
whole journey, not just conversions. Most of the aggregate increase is in
unmodified cases, supporting broad runner variability as a competing explanation;
this is not an adjustment that establishes a hidden candidate improvement.

The candidate has no matching publication pair. The prior success proves258
configured cases/249 first passes/nine skips,116 units and subpath at that exact
source. Today's required inventory is273/264/nine. The additional15 focus cases
and newer workflows make a comparison against the old candidate less equivalent.

## Applicability to current main

The test-only five-file delta applies cleanly without changing the working tree:

```sh
git diff 82843f4 299e3864 -- e2e | git apply --check
```

All four caller files have identical blobs at the original base and current main:

| File                   | Shared blob                              |
| ---------------------- | ---------------------------------------- |
| e2e/app.spec.ts        | c884e3cd36edb239efa22ed02396657f461b5c8f |
| e2e/controls.spec.ts   | 0a61c6c8fc8b9678d0305348934e69bed1b4dd35 |
| e2e/privacy.spec.ts    | d40635ce2015b48d6cb58de59ba10c7df6da3109 |
| e2e/responsive.spec.ts | dfd77d33f2a791304cacfdf9c9e3e561b9243e1e |

Candidate helper SHA-256 is
`49ed73f85d26ca5e7ba7df6a991f65c5baff1a3c875dcb708c212a35f7d2ec45`.
Main's web tree is now `e8a7963096c8dcb09de5a259a966cf1b7aa595d9`, versus the
candidate's original `78dbdbf65b5328416f0b169cc52d3ed9541d02f9`.
The intervening App delta adds clipboard focus-intent tracking and deferred
focus ownership checks. The conversion invalidation/effect/worker ownership,
250ms debounce, result-panel aria-busy and live-state derivation are unchanged.
The added e2e/copy-focus.spec.ts cases remain present and should retain their own
original checks. No alternate synchronization design is required merely to
port this candidate.

A clean apply is not final validation: the previous two reviewers approved the
older runtime/conditions. Rebase onto current main, preserve the exact reviewed
helper, and record the new complete source/runtime identities. Do not replace
current main files with snapshots from PR38 or merge its old full tree wholesale.
Targeted checks must also retain denied clipboard behavior adjacent to adopted
app conversions. A later final gate must retain all273 configured cases,116 units,
subpath, native motion, offline/integrity/update checks and failure diagnostics.

## Decisive measurement before another full hosted gate

Use a pinned Linux image on one machine if available, with no tool installation
outside mise. Run the twelve affected semantic cases using their real fixtures,
all five adopted profiles, CI900×640 desktop/1× mobile raster, unchanged motion,
four workers and the exact same current-main production build. Keep resource,
retry, screenshots and tracing policies identical. Test source is A=current main
and B=current main plus only the five-file helper delta. Use isolated temporary
directories/ports; do not modify the shared main checkout or overwrite existing
reports. Record source/runtime JS/CSS/release hashes and engine/image identity.

Perform a bounded **ABBA sequence of four targeted runs**. If it is close or
unstable, a second predefined ABBA block can resolve it; do not selectively rerun
slow controls or drop failures. Compare A/B actual runner envelope, total affected
case durations and per-profile/case deltas. A small number of fixed, value-free
conversion marks can distinguish DOM-settled→assertion-return savings from app
work; use the same instrumentation on both modes, and compare ordinary helper
overhead separately if instrumentation itself alters polling. In particular,
the original probe armed an observer on A as well as B; PR A has no such helper.
Keep protocol/action/observer windows in their own clock domains. A serial local
repeat is still useful to reproduce the mechanism, but it cannot resolve the
missing four-worker Linux evidence by itself.

Preserve complete attempt inventories, deadlines, page/probe errors, output and
failure markers. Do not add sleeps, force actions, reduced motion or quiet-ready
waits to make an initially busy call eligible. No broadened adoption into typing,
pending replacement, errors, updates or worker cancellation follows from a
positive result. Aggregate expectation spans are overlapping elapsed waits;
they are not removable CPU or serial runner time.

**Merge criteria:** clean current-main application; no new lifecycle/timeout/
ownership findings on exact source; unchanged case/assertion inventory; all first
attempts pass in targeted measurements; repeatable reduction in the affected
four-worker envelope exceeding the observed A/A drift; and an explicit
maintenance/adoption rationale proportional to that incremental gain. Then use
the required two independent reviewers and one final exact-head full gate.
Any original efficiency verdict must remain separate from implementation approval.

**Close criteria:** the targeted result is neutral/regresses, the gain is hidden
inside control variation, or it only saves a few seconds without a separately
established need for the added lifecycle. Preserve PR38's original local and
correctness reports and record that closure rejects its adoption purpose rather
than declaring its implementation broken. Do not spend a new full Actions gate
just to discover that a small targeted saving cannot meet the target.

## Original target and alternatives

The current [ordinary pair](../actions-upgrade-2026-10-05/root/paired-metrics.json)
is Web342s + one Slim publication job44s = **386s/seven rounded minutes**, versus
the historical307s/eight. Storage is already63.13% lower in the surviving-API
projection. With publication44s unchanged, raw pair<307 requires **Web<263s**,
over79s saved; rounding needs Web≤300s to reach at mostsix total minutes (25% less
than eight), at least42s saved. These are thresholds with assumed future
publication cost, not new measurements. The formal tool requires ≥20% rounded
minutes and storage reduction plus raw runner time decreasing; a stricter
all-metric20% result has a separate, stronger raw threshold. Future complete
matched successful PR/publication runs must establish acceptance themselves.

PR38's measured mechanism has no credible target-sized scope. Expanding a helper
to every fill would violate its idle, changed-input, ordinary-success contract
and consume correctness coverage. Persistent idle-worker reuse is a distinct
production lifecycle change; the saved local worker-startup report measures only
15.50–26.25ms per request, also insufficient evidence for a target-sized saving.
Grouped maintenance runs and batching evidence are already adopted run-count
improvements, not proof of this per-pair target. The next useful investigation
must identify measured CPU/renderer/fixture work with enough remaining scale;
case rankings and overlapping wait totals alone do not establish such a cause.

Implementation assessment: existing bounded correctness approval stands; source
ports cleanly but current-runtime execution was not exercised here. Original
report assessment: **unresolved**, no new Linux improvement or accepted pair.
Physical-device/historical/human acceptance gaps remain outside this assessment.
