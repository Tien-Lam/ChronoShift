# Remaining acceptance audit and recovery fixes — 4 October 2026

The user requested completion of the remaining ChronoShift projects. The [saved shared brief](review-brief.md) scoped two independent clean-context audits of `b432db067ad8176e7f040c74997e2021b629a07c`. Both inspected implementation before seeing the other verdict. The nine actual phone/installed/screen-reader/zoom/performance acceptance gates remain unverified; their criteria are unchanged.

## Reproduced blockers

- Code reviewer: delayed clipboard delivery overwrites a newer typed/converted draft and clears its results. Unresolved target `CST` silently displays and copies Sydney instead of a chosen zone, even after Convert shows an invalid-zone error. [Code observations](code-before.json) and [original probe](code-probe.ts.txt), Chromium 153 desktop, en-AU/Australia/Sydney. Fresh Vite assets matched the tested production build.
- Adversarial reviewer: delayed IndexedDB share delivery overwrites a newer typed/converted draft while leaving the previous conversion and Copy enabled. [Observations](adversarial-before.json) and [audit](adversarial-audit.md), exact source production build. This was reproduced twice with a dedicated preview and no user-browser mutation.
- Implementer independently reproduced the share race in installed Chrome 154.0.8037.93 ordinary test-browser mode with a 1.2-second IDB success delay: incoming April 9, 2026 3pm UTC replaced June 18, 2026 9am UTC while results still showed June 18. This is a controlled delay, not actual OS share evidence.

New `e2e/imports.spec.ts` initially failed all three Chromium scenarios on unchanged app code: both import races lacked the explicit replacement choice and invalid `CST` retained one copyable result instead of zero. Failed runs are retained as failures, not passes. No application cause is inferred for unavailable physical acceptance.

## Candidate behavior and verification

TIE-334 guards import completion against intervening edits, Clear, restored updates and newer Paste operations. A conflicting receipt stays in memory until the user explicitly replaces or dismisses it; accepting it cancels prior conversion and clears old results. Untouched imports still apply normally. TIE-335 suppresses unresolved-target results/Copy while retaining source interpretations, restores accurate results on correction, and discards obsolete async copy feedback after state changes.

The targeted 15-profile-case run passed after the fixes, including edited/cleared imports, restored share drafts, untouched clipboard reads and reverse-order Paste completions. Type checks, all 108 unit tests, production build and formatting pass. Final reviews, complete browser/subpath gate and publication evidence will be appended before ticket closure. DOM observations are supplementary to actual screen-reader behavior.
