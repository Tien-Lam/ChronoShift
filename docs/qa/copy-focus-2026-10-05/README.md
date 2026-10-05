# Clipboard fallback focus ownership

TIE-377 tracks a deferred manual-copy focus callback stealing subsequent timezone
input. The original report is the first WebKit failure in Web37288000068:
manual-copy fallback opens, then the first CST target entry retains UTC. Its
screenshot/context are preserved in [the held gate](../actions-upgrade-2026-10-05/final-ci/review.md).
The retained trace belongs to the successful retry. The precise original fill
interleaving remains unknown; no evidence attributes the failure to Actions.

The [actual review brief](dispatch.md) preceded reproduction and implementation.
Candidate source is `35e11bac657a0c379fda48af9b454e674d2ea854`, App blob
`8bec3cbf656e92265f9f586fb9443de6e3c5aecc`. A separate interaction epoch records
document focus, pointer and keyboard intent. The deferred callback rechecks both
copy request and interaction ownership immediately before focus/selection.
New interaction wins even when values have not changed or focus returns to its
former element. An undisturbed fallback still selects its full copy text.
Unmount cleanup invalidates ownership and removes the listeners.

Opt-in copy diagnostics contain only fixed event names, timestamp, request ID
and a closed skip reason. They contain no input or timezone values. Reviewer
recommendations for bounded CI focus breadcrumbs are retained separately;
those recommendations do not constitute an implemented first-attempt trace.

## Previous-source control and candidate checks

The previous App blob `bfa956979be3af3c0e8556109f6f5cf3b7671f5f` served
`index-DHi9pTHJ.js`, SHA-256
`b2ec5e8a200f317d260cd7e596c1f9a8d417f55f4379803a39867553791ae640`.
The robust old-source control failed without retries at
09:34:54.363–09:35:05.241 UTC on 2026-10-05. It holds only the copy focus/select
callback, then releases it through a native frame after complete target focus.
Focus moves to the readonly copy field before keyboard CST insertion; the target
retains UTC. This independently distinguishes the bounded race from a timezone
selection reset. It changes scheduling and uses keyboard insertion rather than
the original locator.fill protocol; it cannot reconstruct the missing trace.

The candidate root build served `index-B3d9YDa-.js`, SHA-256
`764439adde23302a0e40ff2c221e8fe13055671a6285ac16d528344cf06befc9`,
with [actual build identity](root-build-identity.json). Local normal-motion checks
preserve target focus and CST ambiguity, remove stale results/fallback, then
recover Tokyo midnight on 10 April with UTC source. All fifteen core case/profile
combinations passed first attempts, with additional WebKit ownership boundaries
recorded separately. The test author retained an initial away/back fixture
precondition failure and its corrected recheck; it occurred before callback
release and is not an application failure.

Three permanent cases cover new target keyboard input/recovery, unchanged full
fallback selection and same-owner keyboard intent. They add fifteen configured
checks to the unchanged 258-case inventory. Additional focus-only, away/back,
pointer, superseding-copy and delayed-rejection probes stay in this evidence
record. Routine CI omits success asset fetches and observation attachments;
explicit investigation mode archives them. Physical-device and OS focus paths
remain unexercised.

## Independent verdicts and delivery boundary

The [code source review](code-candidate-source-review.md) and
[runtime verdict](code-candidate-runtime-review.md), plus the
[adversarial source review](adversarial-candidate-source-original.md) and
[runtime verdict](adversarial-candidate-runtime.md), approve the bounded
implementation. Each preserves its own initial QA assertion/setup mistakes,
corrected expectations, clocks, environment, source identity and evidence gaps.
Reviewers derived competing paths independently and did not consult peer
verdicts before their own initial verdicts.

The adversarial review measured 42 stylesheet CSP messages in fourteen contexts,
all after screenshot capture started. Installed Playwright injects temporary
inline body styling for WebKit screenshot synchronization; the phase evidence
supports capture provenance. No pre-capture warnings or pageerrors occurred in
those probes. These records are not described as zero-warning runs.

The bounded equivalent failure is reproduced and prevented; the historical
Linux fill sequence remains untraced. [Final exact-head CI](final-ci/review.md)
passes all 273 configured cases (264 first passes/nine existing skips),116 units
and subpath without failures/retries. Six hosted focus checks pass normal motion
with matching public JS/CSS; the independent raw audit supports bounded TIE-377
closure. Both publishing paths, four hosted offline checks per path and actual
draft-preserving updates are [verified](../actions-upgrade-2026-10-05/delivery.md).
TIE-377 is Done. TIE-370's unidentified historical offline cause, physical
acceptance and TIE-375's unmet cost target remain separate open gaps.
