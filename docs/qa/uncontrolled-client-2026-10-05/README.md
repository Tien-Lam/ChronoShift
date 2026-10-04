# Hard-refresh readiness warning — 5 October 2026

The latest report shows successful registration and conversion, but no document
controller at startup, pageshow or the 1/4-second lifecycle probes. At 15 seconds,
the page incorrectly labels this as an incomplete offline cache. The user
confirmed a hard refresh and subsequently clarified that the normal-browsing
recurrence was in the same previously hard-refreshed tab.

## Cause and change

Actual hosted Chrome 154 reproduced the warning on the previous release:
registration active/activated, installing and waiting absent, document controller
null, cache complete. Re-registering an already activated worker does not rerun
its activation claim. Focus and conversion do not change this document state.

[PR #32](https://github.com/Tien-Lam/ChronoShift/pull/32) verifies the exact scoped
active worker when the document is uncontrolled. Only a verified complete cache
and an in-scope window may request `clients.claim()`. Page readiness still
requires the actual document controller to match the verified worker. Updates
remain explicit; no automatic reload or waiting-worker activation was added.
An older worker that cannot perform this handshake keeps readiness false and
shows a distinct current-tab recovery instruction while retaining Update now.
Safe opt-in diagnostics now identify lifecycle states and scope/script matches
without recording conversion input, selected zones, URLs or arbitrary errors.

## Review and verification

The [brief](brief.md) was saved before independent dispatch. Initial reports
remain unedited: [code](code-initial.md), [adversarial](adversarial-initial.md).
Final implementation reports approve runtime
`63c9cdc442eac03c30dbae7871d1452b1049c7b0`:
[code](code-final.md), [adversarial](adversarial-final.md).
Separate [code](code-clarification.md) and
[adversarial](adversarial-clarification.md) deltas retain the final user
clarification and supersede the earlier interpretation of a separate unexplained
fresh-normal-navigation report. These local verdicts alone did not close the
hosted ticket.

- Previous hosted failure: [raw matching journey](adversarial-hosted-before.json)
  and [harness](hosted-probe.ts), target interaction near 12 seconds, conversion
  near 13 seconds, warning and absent controller beyond 17 seconds.
- Exact archived candidate and older unsupported baseline worker:
  [transition evidence](transition-after.json), [harness](transition-probe.ts).
  The deployed tree replaces retired assets, leaving them unavailable. Before
  explicit update, conversion/draft remain usable and readiness stays false;
  Update now performs one reload and restores the draft. Candidate hard refresh
  then recovers control without reload, passes 17 seconds and reopens offline.
  This baseline was built with local metadata (worker `e26cfc3dedb05ea4`);
  the exact previous hosted artifact is identified separately in the live
  before-fix journey.
- Independent delayed-handshake candidate: [code raw evidence](code-after.json),
  conversion before recovery, readiness only after control, 16-second observation
  and offline fresh conversion.
- Ordinary navigation investigation: [report](normal-navigation-audit.md),
  [raw evidence](normal-navigation-raw.json). Fresh visit/reload/new tab pass;
  BFCache snapshots and an early-leave experiment have explicit capability gaps.
  This investigation does not certify those unexercised cases.
- [Required CI](https://github.com/Tien-Lam/ChronoShift/actions/runs/37226904832):
  114 units; 222 browser cases pass, six Chromium-specific hard-refresh cases skip
  other engines; typecheck/build/format/corpus and Pages subpath pass.
- [Pages publication](https://github.com/Tien-Lam/ChronoShift/actions/runs/37227337390)
  reused the trusted CI artifact after digest and exact-tree verification. Merge
  `54cc09e1c8a14dceddf36083893436a57f78bae5` and tested source
  `4a771b9d102dbcaf3a807f096fb26861bbfa8e5f` have tree
  `e2f47a192b63d19a9b8eed70f6ffed82d6014a34`.
- [Publication metadata](publication.json): public worker
  `1daf9e89c308221a` equals the tested artifact; all 13 public asset hashes match.
  Four hosted Chrome/Pixel-profile cases pass in 26.9 seconds, including a
  21-second idle interval and fresh offline conversion.
- Matching published Chrome journey: [original independent publication verdict](adversarial-publication.md),
  [raw evidence](hosted-after.json), [harness](hosted-after-probe.ts).
  Hard refresh initially has no controller, with active/activated registration
  and no installing/waiting worker. Control and readiness recover within five
  milliseconds. Target interaction occurs at 12.068 seconds, conversion at
  13.075 seconds; at 17.016 seconds the same tab is ready and controlled, with
  intact input, correct 9:20 am and no warning. Two total navigations confirm no
  automatic reload. Offline close/reopen and fresh conversion pass, with no
  console/page errors. The first helper incorrectly expected the locale's result
  without its `am` suffix; [retained failure classification](hosted-helper-first-failure.md)
  distinguishes that assertion error from app behavior.
- [Code publication and documentation review](code-publication.md) independently
  corroborates CI/Pages success, artifact digests and identical reviewed/tested/main
  trees through `gh`, then audits the matching adversarial published trace. It
  approves both implementation and clarified report resolution within scope;
  it does not claim an additional independent post-publication browser run.
- Side panel: explicit update retained the synthetic message; UTC 8:20 and London
  9:20 conversions pass. [Snapshot](side-panel-after.json) records readiness true
  and no warning 40 seconds after the final conversion;
  [capture](side-panel-after.png) shows the result.

## Why earlier reviews missed this

Earlier scopes tested registration rejection, stale/delayed replies, delayed
installation, cache repair and response-level HTML rewriting. They largely used
fresh or already controlled documents. Verifying a controlling worker's cache
does not exercise an uncontrolled document with a healthy activated registration.
The old diagnostics recorded only controller absence, obscuring that distinction.
The new report supplied the missing lifecycle and refresh history.

This is an evidence-selection gap, not evidence that increasing reviewer count
or changing models would resolve it. The review workflow now explicitly requires
active/installing/waiting/controller distinctions and a real hard refresh followed
by the reported same-tab interactions beyond the deadline when relevant. CI adds
the real reload and unsupported-legacy-worker update regressions. Each review
still records implementation and original-report resolution separately.

Historical user Chrome version, exact worker/cache identity and physical-device
capabilities remain unknown. The matching equivalent lifecycle is established;
unrelated browsing histories are not generally certified. Nine separate physical,
installed and human-acceptance tickets remain open.
