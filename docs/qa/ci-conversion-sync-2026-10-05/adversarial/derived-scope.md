# Independent adversarial derivation

Initial inspection began at actual clock 2026-10-05 07:58:54 UTC, before candidate helper source existed. Base and inspection HEAD: `82843f46e554a04d7a9db9c8b0aaacb77466442e`; unchanged web tree `78dbdbf65b5328416f0b169cc52d3ed9541d02f9`. Candidate approval remains pending an exact revision.

The result panel has stable ownership in `App.tsx`. `invalidate()` immediately clears results/errors, terminates the previous Worker, increments request ownership and sets busy for a nonempty/noncomposing draft. The effect sets busy before its 250 ms typing debounce, then clears it on success, no-result, validation failure and Worker failure. Error settlement therefore cannot establish positive result correctness. Exact result assertions remain necessary. An existing busy conversion may finish during helper setup; accepting the initial busy state without attributing the new input is a competing synchronization path.

Independently selected failure paths:

- Old settled output must not satisfy new-action readiness; no-op/new-text scope needs explicit handling.
- A conversion already pending during arming must not leave the new action unobserved or cause a stale completion to pass.
- Coalesced true/false attribute mutation records must preserve the transition even when the current attribute is already false.
- Failure before/during the action, Worker launch failure, no-result settlement and assertion rejection must clean up observer/timer/global state and retain meaningful errors.
- Missing cycle and permanently busy state must fail within the original assertion budget, not append an independent 10-second wait and 10-second assertion.
- Panel removal/replacement, page navigation and page close must terminate or remain bounded without leaks or false success.
- A subsequent real conversion must recover after each recoverable failure.

Changed callers will be checked against base assertions and retained pending/cancellation/error/update journeys. Review will use separate port 4324 with actual production dist at root base `/`, not confuse candidate test commit with served application release `28059a91ec9984dea4d079b3f684b3a27af669f0`. No fixture release mutation is planned. Scope excludes Actions/free-quota target certification, physical devices, screen readers and production changes. Both implementation and original-target verdicts will be recorded separately.

This document was written at 07:59 UTC; command/observation clocks are recorded separately in final runner metadata. It does not contain either reviewer's verdict.
