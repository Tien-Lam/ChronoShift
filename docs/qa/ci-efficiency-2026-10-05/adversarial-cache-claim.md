# Independent cache snapshot claim check

Read-only review at actual clock observations **2026-10-05T06:56:18Z–06:56:54Z**, followed by report writing. Context reused; no peer execution verdict read. Inspected root's cleanup driver and recorded operation, but did not execute it or delete another cache. Source remains b288920. [Independent reader](adversarial/cache-review.ts), [raw live reads/recomputed checks](adversarial/cache-review.json).

Verdict: **the 36.64% cache-occupancy snapshot reduction is supported**. It is not paired runner-minute savings, projected artifact byte-hours or overall monthly cost.

Root operation records actual 06:55:45.567Z–06:55:49.404Z commands: list caches; confirm PR16 MERGED with exact historical head branch; delete four specific IDs; list again. Driver guards IDs plus refs and key prefixes, not an independently inferred list of arbitrary stale caches. It targets rejected ARM PR37 cache8504267365, merged PR16 caches8473474762/8459549294 and its retired branch cache8459547249. ID-targeted deletion avoids deleting matching prefixes broadly. Other entries are retained.

I recomputed all byte sums from the raw before/deleted/after rows: **1,730,963,608 → 1,096,667,166 bytes**, removing **634,296,442 bytes**, **36.64412348523505%**. All seven retained rows preserve exact ID/key/ref/size across the recorded operation, including both main keys and PR17–21 caches.

Independent actual `gh api .../actions/caches?per_page=100` confirms complete current inventory (`total_count` equals returned rows), the same seven IDs/keys/refs/sizes and **1,096,667,166 bytes**, with all four deleted IDs absent. A separate read-only `gh pr list --state open` confirms PR17–21 remain open. These reads and exact timestamps are in the JSON. No pagination/truncation is inferred from the older root list's limit: the independent API count establishes current completeness.

This is an instantaneous repository cache inventory comparison. Re-download cost, future recreation/eviction, already-accrued storage and account billing are not measured. Existing supported x64 cache remains available to the final run. Preserve this claim separately from TIE-375's required matching successful current PR/main raw seconds, per-job rounded minutes and retained artifact byte-hour targets.
