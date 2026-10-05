# Prepared independent competing browser conditions

Prepared after the source-phase report, starting at the actual clock 2026-10-05 10:32:45 UTC. **Not executed.** Root's serial full-gate ABBA owns `dist` and browser resources. Execution requires an explicit root release; the script also refuses to run without `CHRONOSHIFT_ADVERSARIAL_RELEASE=1`.

Owned source: `journeys.ts`, separate static server port 4277, all output in this folder. The script serves the final candidate `dist` without builds, fixtures, source changes, installation, permanent CI test additions, or test-server release substitution. It verifies the exact App/Choices blobs, hashes every served file before/after, and records release metadata. Do not assume current `dist` is candidate while the ABBA is active.

Intended invocation after release only: `CHRONOSHIFT_ADVERSARIAL_RELEASE=1 bun docs/qa/ci-next-2026-10-05/adversarial-browser/journeys.ts`.

Run Chromium, Firefox and WebKit serially. Fresh context per condition, normal motion, desktop 900×960, raster 1×, en-AU, Australia/Sydney. No force clicks, arbitrary settling sleeps, retries, or production deadlines changed. Synthetic messages and fixed independent expected results are used. All assertions and setup failures remain in raw records. Capture-related CSP observations are separated from normal use.

1. Open each timezone's owned filtered list across an actual pending→ready conversion transition. Hover Osaka before completion and verify Tab retains `Asia/Tokyo`; deliberate keyboard End/Tab must instead commit `osaka`. Verify the other field's exact value and fixed UTC-derived result/date/zone.
2. Patch only `Intl.DateTimeFormat().resolvedOptions().timeZone` in the test realm, then dispatch the existing window focus refresh event. With unchanged empty preferences, verify both changed placeholders and exact device-fallback output; with explicit target UTC, verify a later mocked device change cannot overwrite it. This is device-owner fault injection, not physical OS coverage.
3. Select nondefault zone/format/date/theme preferences, reset them, then recover through invalid input, +05:45, empty fallback, deliberate Tokyo selection, ordinary blur and Tab. Assert exact results, invalid state, separate source, and preferences after reload.
4. Keep a target-owned list open through system-theme context changes and resize 900→280→900. Assert owned list identity, full 454-item manual collection, known IDs/labels/descriptions, bounded popup/control dimensions, contents without horizontal clipping, unchanged zones/draft/results, and normal-motion immediate keyboard dismissal/reopen. Save captures and CSS dimensions. WebKit captures are separate from normal-use CSP checks because its screenshot helper may inject styles.

These conditions complement closed-popup conversion timing. They do not establish Linux CI savings, physical-device performance, screen-reader behavior, or the full repository gate. Original `adversarial-review.md` remains immutable; execution evidence and verdict corrections will be additive.
