# Final native test-preparation delta review

Reviewer `virtualized_zones_code_review`. This separate addendum preserves the earlier originals and [restoration-test-preparation-addendum.md](restoration-test-preparation-addendum.md) unchanged. Scope is **only the e2e test preparation and its retained QA evidence**. The distinct new data-backed collection prototype, current Choices/style source and its runtime behavior were not inspected or approved, and no new source-restoration claim is made.

Actual review observation clocks: **2026-10-05 12:10:01–12:10:42 UTC**, read from the clock tool. Report writing follows that window. This reviewer ran no browser, build, compiler or Actions operation, edited no production/test source and made no commit. Read-only commands inspected Git test diff/hash, raw runner/config/reporter/clock/served files and performed an in-memory Bun reconciliation. `git diff --check -- e2e/controls.spec.ts` passed. This report is the only reviewer write in this turn; writes cease after saving it. No peer review report was read for this final delta.

## Exact test scope and independent assertion preservation

Current `e2e/controls.spec.ts` Git blob independently confirmed as `6afcf2482d8a570469acdae0d75067a136d1a7e6`; base file blob `0a61c6c...` at base revision `cea0de547094ba51a598fdc4303409fdf1d36bb7`. The diff has **nine added lines, zero deletions**. Four preparation lines now precede the CST setup edit, and the previous five lines precede canonical Asia/Tokyo input: native scroll into view, input click, closed-popup assertion, and explanatory comments. The existing later Tokyo pointer-reopen preparation is unchanged.

I independently removed the two exact added text blocks in memory and compared the result to `git show cea0de547094ba51a598fdc4303409fdf1d36bb7:e2e/controls.spec.ts`: byte-for-byte equal. Both files retain four test declarations. Therefore all original assertions, titles and scenario bodies outside those additions are preserved; this conclusion does not rely merely on a green run or the implementer’s description.

The test still captures the other field’s value, fills CST using the existing helper, fills canonical Asia/Tokyo, acquires its owned list, deliberately moves the pointer to0,0 and then hovers Osaka. It verifies the hovered state, Tab retention of the exact canonical input and the unchanged other field, popup removal, exact converted time/date, deliberate ArrowDown/End/Tab alias commit to`osaka`, and input-driven Tokyo pointer selection back to`Asia/Tokyo` plus other-field independence. There is no added sleep, force click, reduced-motion mode, viewport substitution, dynamic locator bypass, alternate expectation or disabled scenario.

Bringing the field into view before **both** edits matters: scrolling/focusing the initial CST setup can start the deferred ancestor-scroll history before the canonical fill. Preparing only the second edit did not consistently remove that history. The two-point preparation makes the bounded hover scenario start with ordinary native focus/scroll prerequisites, then still tests input-driven opening and Tab behavior. A closed assertion is not a universal proof that all queued scroll work has completed; the acceptance evidence is the specific retained matched journey, not that assertion alone.

## Independent reconciliation of root’s exact targeted run

Read full `controls/4-baseline/run.log`, `report.json`, `served.json`, the matching entry in `controls/clocks.json`, controls config, runner and unexpected-attempt reporter. Independently compared the five hover spec IDs against `controls/1-baseline/report.json`: **all five identities match**. Each has exactly one structured result, statuspassed, retry0, errors0 and attachments0. Projects configure retries0 and repeatEach1. The raw log contains exactly five successful results and `5 passed (4.9s)`. Report stats: expected5, skipped0, unexpected0, flaky0; top-level runner errorsempty. `results/attempt-failures.json` is absent, consistent with the reporter removing a stale marker on start and writing one only for unexpected attempts. There are no failure/retry attachments in this block and no Actions uploads claimed.

| Profile | Actual attempt start UTC | Duration | Result |
| --- | --- | --- | --- |
| Chromium | 12:08:43.001 | 2067ms | passed, retry0 |
| Firefox | 12:08:43.001 | 2865ms | passed, retry0 |
| WebKit | 12:08:43.001 | 2222ms | passed, retry0 |
| Android emulation | 12:08:43.001 | 2015ms | passed, retry0 |
| iPhone emulation | 12:08:45.258 | 2164ms | passed, retry0 |

The producer command runs the existing `bunx --bun playwright test --config=docs/qa/ci-virtualized-zones-2026-10-05/controls.config.ts` with `CI=1`, `PLAYWRIGHT_PORT=4191`, block`4-baseline`, and grep`hovering timezone`. It uses the five established profiles, four workers and the existing Playwright1.63.0 test/runtime configuration. Per-browser version strings are not recorded in this block’s report; previous reviewer runtime versions are not substituted for them.

Runner-wrapper clocks from the matching raw record: **12:08:42.570–12:08:47.627 UTC**, elapsed5057.483667ms, exit0. Nested Playwright stats begin12:08:42.730 UTC and last4886.263ms. These are distinct instrumented windows, not performance comparisons. Served verification at **12:08:42.842–12:08:42.847 UTC** checks `http://127.0.0.1:4191/`. All **14 files** return200 with served/file SHA-256 equality, and the before/after file inventories are identical.

The served frozen baseline is identified by main`index-B3d9YDa-.js`, CSS`index-Bst_xchV.css`, and SW hash`2301b0b246a865e4f18e6a7249f9cfc7ac7f0d20f14ae4e1d9b9ae558fb7755a` (baseline version137a92f4186517c7). It is a baseline correctness test, not evidence for the distinct new prototype. Runner source retains original-dist restoration in`finally`; its inventories/served verification support this run’s asset identity, not any assertion about current later production edits.

The previous single-point preparation remains saved as `test-preparation-initial.spec.ts` and failed controls3 output. Its Chromium/Android`id=null` failures are not rewritten as passing or removed. This final block’s zero retries is scoped to controls4 and does not describe the complete preceding investigation as first-attempt success. The original Firefox boundaries and my v1 page-navigation failures remain intact.

## Bounded verdicts

- **Test preparation implementation:** approved within this narrow test/QA scope. All original assertions and five identities are retained, the native prerequisites are applied before both implicated edits, and the exact targeted baseline run passes all five first attempts without retry/failure markers. No actionable blocker remains for this preparation delta. This is not a claim of universal flake elimination or a general product bug fix.
- **Prior preparation failure:** the failed single-point draft is superseded for this specific canonical-hover journey by the two-point version and its five-profile evidence. Earlier raw failures and causes remain qualified; an uninstrumented historical browser state is not reconstructed.
- **Rejected v1 / new prototype:** not approved by this report. The original v1 blocker reports remain, and the distinct prototype requires its own exact-source independent review/gates.
- **Original CI goal:** unresolved. This is one targeted five-profile hover run, not the complete116-unit/273-case gate, a hosted/publication check, an exact-tree trusted artifact or a comparable Linux efficiency/artifact byte-hour pair. It proves no20% rounded-minute/storage saving or raw-time improvement.

No physical-device, screen-reader, actual zoom, OS installation/share, broad visual quality or cached/offline/update lifecycle acceptance is claimed. Future runtime changes require their appropriate review and complete gates; this baseline test-preparation approval cannot supply that evidence.
