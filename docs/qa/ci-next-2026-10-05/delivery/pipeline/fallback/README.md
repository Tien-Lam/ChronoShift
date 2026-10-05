# Manual fallback delivery audit

Manual Pages run [37301135549](https://github.com/Tien-Lam/ChronoShift/actions/runs/37301135549) completed successfully on source `cf4d5b9244278da591a33c1952283e76acb6116c`. This read-only follow-up copied the root's original full log and artifact metadata, and independently captured actual run/jobs API JSON with mise-managed `gh`. No source edits, CI dispatches, builds, installs, browser operations, or duplicate binary artifact downloads were performed.

The reusable `verify / web` log deliberately reports `UNKNOWN STEP`. The parser retains those labels and selects the actual `Running 273 tests using 4 workers` through `264 passed` inventory block; it does not infer or invent step labels. The block contains 273 first-attempt rows, all 273 distinct ordinals in the range 1–273, and 273 distinct project/title cases. There are 264 passes and exactly the same nine capability skips as the final ready gate. There are no retry rows, error/retry headers, failed/flaky summaries, or failure glyphs.

Skipped cases are the three Chromium/CDP-only uncontrolled-tab recovery tests in Firefox, WebKit, and iPhone emulation: activated-worker hard-refresh reclamation; timed-out readiness probe recovery; older-worker rejection for an uncontrolled tab. Unit summaries show 116 passes and zero failures. The independent subpath block has one pass. Job metadata separately confirms format, units/root build, corpus, browser, Pages configuration, subpath, and artifact upload succeeded.

Failure diagnostics and one-off timing artifact upload were skipped; the only listed artifact is `github-pages` (11341138658, 374,915 bytes, API SHA-256 `2676a9e05004bfdda293d70e69ca6cfe94dd717b23cf5a5a92ef229253775984`, 14-day expiry). Failure-marker absence is inferred from the conditional diagnostic upload and artifact inventory, since successful raw marker/test-results files are not uploaded. The root independently owns binary digest/full-tree/publication verification and live hosted checks; this report does not enlarge their tested scope.

| Additional manual validation job | Start UTC | End UTC | Runner seconds | Rounded-minute proxy |
| --- | --- | --- | ---: | ---: |
| prepare | 11:09:45 | 11:10:01 | 16 | 1 |
| verify / web | 11:10:06 | 11:17:11 | 425 | 8 |
| deploy | 11:17:15 | 11:17:26 | 11 | 1 |
| Total | | | 452 | 10 |

Manual validation is excluded from the ordinary Web/Pages pair, which remains 380 seconds / 7 rounded-minute proxy versus baseline 307 / 8. The prior canceled label request remains a separate 26 seconds / 1 minute. These are whole-second API job observations with upward per-job rounding, not billing records or an exhaustive project cost ledger; no monthly or counterfactual savings claim follows.

The manual browser step took 371 whole API seconds. Raw resource counters bracket 370.357 seconds from 11:10:51.016Z to 11:17:01.373Z; CPU usage grew from 18,776,197 to 1,301,575,638 microseconds, yielding 1,282.799441 processor seconds and average 3.463684 processors. The runner reports AMD EPYC 7763, Linux x64, four available/logical CPUs, 16,766,414,848 bytes memory, unlimited cgroup CPU quota, no recorded throttling/OOM events, and peak memory rising from 1,400,320,000 to 6,639,894,528 bytes. The ready gate used AMD EPYC 9V74 and took 299 browser-step seconds. These single samples on different CPU models are a noncausal comparison and do not establish model-specific or source performance effects.

Evidence is retained in `run.json`, `jobs.json`, `run.log`, `root-final-fallback.json`, and `artifacts.json`. `analysis.json` records exact assertions, raw counters, actual job steps/timestamps, and separate costs; `browser-attempts.json` preserves each raw row. The helper records its own begin/end wall clock. API captures and root log copies were completed before the clock-tool observation at 2026-10-05 11:19:34 UTC; this is an observation bound, not an exact network timing. `evidence-digests.json` contains file SHA-256/byte counts, excluding itself.

Remaining evidence limits are hosted scheduler/concurrency guarantees, stable runner variance, billing/monthly savings, direct successful marker-file inspection, and any physical-device/human acceptance gaps. Full fallback success supplies the complete gate evidence; it does not resolve those broader acceptance gaps or the unmet 20% quota target.
