# TIE-370 adversarial hook delta review

Focused source delta `842b89d` against `a565ed03095022f14b827d270564fd6da1d5c23a`, reviewed with `git show --stat 842b89d` and `git diff a565ed0..842b89d -- e2e/uncontrolled.spec.ts`. Runtime build and worker remain unchanged at `54d351454214d082`; the lifecycle and retention observations in [adversarial-candidate.md](adversarial-candidate.md) remain applicable. No reviewer production edits/builds or broader test run.

The hook now awaits `logs.flush()` on every outcome. A passing test returns early only after clean flush. A genuine capture failure is caught, forces lifecycle attachment with `captureFailed: true`, and is rethrown after attachment. A normal failed test still gets snapshot/log evidence; an ended document is explicitly marked unavailable. Expected navigation-loss errors remain handled narrowly by the unchanged helper. This resolves the independent success-path flush finding; the original finding remains preserved in the candidate review.

Root reports three existing Chromium uncontrolled cases passed in 5.7 seconds on the hook delta; this is implementer evidence, not a reviewer rerun. The patch introduces no new lifecycle or rendering behavior, so source inspection is sufficient for this focused correction. The synthetic reviewer retention audit independently established successful-retry marker/screenshot retention and preservation after a nested clean output run.

**Implementation verdict:** approved within the recorded scope, with no remaining blocker after this delta. Retain the complete required gate/delivery verification owned by root.

**Original-report verdict:** candidate recovers a proved timing-equivalent failure at both the compressed and real 15-second readiness deadlines, and retains failed attempts despite successful retries. Historical Chromium CI cause remains unverified; do not describe a clean final gate as identifying it. Existing TIE-371 navigation capture behavior and this hook fix prevent the narrow observed capture-loss path while surfacing genuine failures. Hosted upload/publication and historical Linux load remain outside this local bounded review.
