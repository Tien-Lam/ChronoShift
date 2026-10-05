# Copy fallback focus ownership brief

TIE-377 records Web37288000068 on PR40 head
`eef0d51ea3ca835dfe27d7e157c6bfad1610a7b3`, tree
`6d01fce2b52fcfc27f6343812c02099857856f28`. App/test source is unchanged from
main `0fb0b915a1e1f2ab19613ad1f8ac9dae0eec43cc`.

Original observed report: WebKit imports.spec.ts:173 reaches manual-copy fallback
after rejecting clipboard write for an April9 UTC conversion. It then calls
enterZone("CST") at line197. The helper fills the target and presses Tab, but its
10-second assertion sees UTC. The retained first-failure screenshot still has
the original UTC result, manual-copy field and notice; More options is focused.
Retry1 passes7.7seconds. Full258-case inventory has248 first passes/nine skips,
one original failed attempt/one successful retry;116 units and subpath pass.
Original raw files/digests/clocks live in ../actions-upgrade-2026-10-05/final-ci.
There is no first-failure trace; the sole trace is the passed retry. No evidence
attributes this to Actions migration or establishes TIE-370's historical cause.

Competing hypotheses must be derived independently. Root suspects App.copy's
deferred requestAnimationFrame focus/select can steal target focus between
Playwright's focus and text insertion; controlled selected-key blur/reset remains
a competing path. Keeping the copy notice suggests CST was never accepted,
because invalidate would remove that notice. This is a hypothesis, not a finding.

Reproduction owner: fresh_ci_code. Save a normal-motion old-source control that
holds the copy focus frame and releases it as the target receives focus, using
real visible input/keyboard APIs. Assert focus ownership and exact CST value,
then correction and usable fallback. Identify all injected scheduling and keep
the original unmodified case separately. Do not alter app code, expectations,
timeouts, retries, core helper or browser config to make it pass. Root will fix
only after evidence distinguishes the candidate cause. Use port4316 and owned
output directories, mise/Bun, explicit repository cwd. No Actions rerun.

Code and adversarial reviewers independently inspect the failed original and
competing source paths before reading each other's verdict. For the eventual
candidate, trace request identity, focus ownership, stale completion/frame,
superseding copies, invalidation and fallback selection. Give implementation
and original-report verdicts separately. A controlled equivalent failure can
establish the bounded race; it cannot manufacture missing historical trace data.
Use independent port4317/4318 and separate output directories when meaningful.

Root owns source changes, exact final-head full gate, publication and Linear
closure. Preserve existing source/target independence, full coverage/independent
expectations, normal motion, privacy, no permanent text storage and explicit
draft-preserving update. Batch fixes/reports before the next final gate; leave
the original eef gate and reports intact. The Actions upgrade's static approval
is inherited for unchanged workflow bytes, not for a new application change.
