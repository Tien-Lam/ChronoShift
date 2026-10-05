# Actions migration and copy focus ownership

Delivery is verified on automatic and full manual publishing paths. The
[final delivery record](delivery.md) contains exact revisions, both clean gates,
artifact/public-byte audits, hosted checks and actual draft-preserving updates.
The initial and held-gate review progression below retains its original scope.

TIE-376 tracks grouped PR #40's six official SHA-pinned Actions upgrades.
Base main: `0fb0b915a1e1f2ab19613ad1f8ac9dae0eec43cc`. Initial Dependabot head:
`79c114bbe6823f70456a53f2a10e5428fc6263b6`. Independently reviewed implementation:
`416f94e559a8b49237c58ca44455db8a6067a043` for the migration. That revision
corrects both checkout version comments. The subsequent gate exposed a separate
clipboard focus race tracked by TIE-377. PR40 now also contains the reviewed
App fix `35e11bac657a0c379fda48af9b454e674d2ea854`, three regression cases and
review-workflow guidance. Runtime versions, independent conversion fixtures,
permissions, retention and publishing serialization/trust remain unchanged.

Both clean-context reviewers received the [saved brief](dispatch.md), derived
competing migration paths independently and approved exact static scope:

- [Code initial review](code/initial-review.md) and [exact-source verdict](code/exact-source-review.md).
- [Original adversarial review](adversarial-original.md).

Their clocks, official metadata, original source snapshots and limitations are
preserved. The complete official uploader bundle is stored losslessly as
`code/official/actions-upload-artifact/dist_upload_index.js.gz`; its verified
compression record, original SHA-256 and focused SDK excerpt accompany it. The
raw-file path in the original hash list identifies the uncompressed bytes. This
avoids committing a large uncompressed vendor bundle while retaining the exact
reviewed source; the original report is unchanged.

The [initial automatic gate](initial-ci/review.md) passed 116 units, 249
first-attempt browser cases/nine unchanged skips and one subpath check, with zero
retries or failures. It tested the initial head, not final delivery. Direct
upload-artifact timing/failure branches were skipped, so it does not establish
their upgraded runtime operation. This initial run is additional investigation
usage, separate from a final publication pair.

The held gate below exercised both direct timing and flaky-success diagnostic
uploads with these exact workflow bytes. The final exact-head gate passed in
ordinary mode, without timing instrumentation. Trusted Slim reuse,
artifact/public bytes, hosted offline use and explicit draft-preserving updates
are verified. One complete manual fallback exercised upgraded
configuration/upload in the container and deployment on the separate runner.
Deployment timeout/cancellation
and historical rollback conditions remain unexercised and qualified.

Grouped PR creation is observed: PR #40 combines six updates after five individual
PRs were superseded. This establishes service adoption, not an account-wide
monthly savings figure. TIE-375's 20% complete-pair target stays open. The
previously accepted PR #39 pair uses 356 runner seconds/seven rounded minutes versus the
307/eight baseline, with 63.15% lower API-based projected artifact byte-hours;
raw time is higher and the full target remains unmet. See [PR #39 delivery](../ci-maintenance-grouping-2026-10-05/README.md).

## Held gate and copy-focus continuation

The previously planned exact-head run37288000068 on `eef0d51` finished overall
green with one unexpected first-attempt WebKit failure and a passed retry.
[Complete raw reconciliation](final-ci/review.md) records258 cases/259 attempts,
248 first passes/nine skips,116 units and the subpath check. Both direct v7 timing
and real flaky-success diagnostic uploads executed; their archive sizes/digests
and contents are verified. These observed conditions supersede the earlier
skipped-upload gap, without establishing timeout/cancellation or rollback.

The failure occurs at the first UTC→CST target entry after manual-copy fallback.
The first-failure screenshot/context are distinct from the passed-retry trace;
there is no first-failure trace. No source evidence attributes this app behavior
to Actions upgrades. The [original code assessment](code/final-ci-failure-review.md)
and [copy-focus brief](../copy-focus-2026-10-05/dispatch.md) preserve that limit.
TIE-377 records the separate bounded delayed-focus race. An equivalent old-source
keyboard control reproduced focus theft; the candidate prevents it and retains
normal fallback selection. Independent code and adversarial reviewers approved
the bounded implementation, while keeping the historical untraced fill sequence
unknown. See the [copy-focus record](../copy-focus-2026-10-05/README.md).
PR40 merged after its new clean exact-head gate, and both publishing paths are
verified in the final record. The old green conclusion is not
first-attempt-clean acceptance.

The [timing analysis](adversarial-timing-analysis.md) found no justified new cost
optimization: batching menu reads cannot address the dominant click durations.
Investigation usage remains separate from ordinary pairs; the latest PR40 pair is
recorded in the final delivery record.
