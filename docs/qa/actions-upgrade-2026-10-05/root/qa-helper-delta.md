# Root QA helper changes

Before the actual clock observation 2026-10-05 09:15:01 UTC, root read the action-execution helper's complete
reuse/fallback assertions, formatted that authored helper, and added an actual
helper SHA-256 to each future report. Assertions, independent pins and expected
workflow hashes are unchanged. A separate start clock was not captured. The original creation report and its original
hash remain preserved; the invoked report identifies the formatted source.

The copied publication audit writes into this migration's root folder, preserving
PR39's prior evidence. A small run-hosted wrapper records actual process start/end
clocks, exact expected release, argv, environment and exit status. It invokes the
existing four hosted checks unchanged, with separate outputs per publishing path.
These are QA-only helpers and do not change the final PR head or deployed source.
