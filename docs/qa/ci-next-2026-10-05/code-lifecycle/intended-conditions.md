# Prepared independent code-review browser conditions

Prepared after the immutable initial source review; **not executed**. Root's four-block local measurement owns browser/build/dist activity. Wait for explicit root release before running.

Source target remains App `8a72819c1c20cc6e20b168578d76e71e80e9af29`, Choices `61cfa2b0e23279b9986d816119f0d722272c6bfd`. `check.ts` verifies these blobs before/after, hashes all input build files, records release metadata and actual served file hashes, and rejects a changed build at the end. Root must supply or approve the intact candidate build directory. This script never builds, installs, alters runtime source or touches other review artifacts.

Reserved origin: **http://127.0.0.1:4198/**. Output: this folder's `raw.json`, plus per-case HTML/PNG on any failure. Three cases run sequentially in fresh contexts in each of Chromium and Firefox, viewport 900×900/raster1, en-AU, Australia/Sydney, normal motion. There are no retries or concurrent browsers. Page errors and CSP events fail the case; deliberate clipboard rejection is caught by the app and tracked as an injected condition, not a normal-use error. Worker instrumentation captures real native completion handlers; it does not fabricate conversion payloads.

1. **Reset/prefs/late worker:** choose source Tokyo, target UTC, 24h and DMY. Hold native completion for `04/09/2026 3pm`, then reset and change source New York/target UTC. Verify current defaults (auto, MDY, dark), preserved independent zone strings, and exact 19:00 UTC April9 meaning. Release the previous September4/Tokyo callback and confirm it cannot resurrect. Invalid target then +05:45 recovery must retain New York and produce April10 00:45.
2. **Import/copy ownership:** hold clipboard read, change source Tokyo→New York on June18 15:00, release read and require replacement choice with current draft/result retained. Hold copy rejection, change target UTC→+05:45, focus message, reject and cross two animation-frame callbacks without refocusing. No manual-copy text, notice or focus theft; keyboard input still reaches message, result is June19 00:45.
3. **Unrelated completion under open popup:** hold real Tokyo→UTC result, open the full target list with 454 owned options, release completion and verify the list remains open and target UTC. Escape and ordinary keyboard selection of Tokyo still produce 15:00 with unchanged source Tokyo.

These checks specifically combine stable callbacks with later state owners. They do not repeat the complete browser gate or establish physical-device, update/cache, Linux throughput or whole-CI acceptance. The initially proposed device-timezone mock is deferred: resetting both zones to blank is covered, but runtime device timezone refresh remains source-reviewed only; a mock should not accidentally change explicit-zone Intl formatting.

Planned command after release (using the approved immutable candidate directory):

```sh
CHRONOSHIFT_REVIEW_DIST=/absolute/approved/candidate-dist mise exec -- bun docs/qa/ci-next-2026-10-05/code-lifecycle/check.ts
```

Do not overwrite execution evidence on a rerun. Preserve the first script/raw/log/failure artifacts in a distinct attempt directory and record any correction additively. The original `../code-review.md` remains immutable. Execution/report verdicts will be saved in a new additive report with actual clocks, browser versions, conditions and separate implementation/CI-goal verdicts.
