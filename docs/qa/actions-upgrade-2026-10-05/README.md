# Grouped Actions migration

TIE-376 tracks grouped PR #40's six official SHA-pinned Actions upgrades.
Base main: `0fb0b915a1e1f2ab19613ad1f8ac9dae0eec43cc`. Initial Dependabot head:
`79c114bbe6823f70456a53f2a10e5428fc6263b6`. Independently reviewed implementation:
`416f94e559a8b49237c58ca44455db8a6067a043`. Its only additional source change
corrects both checkout version comments. App code, tests, independent fixtures,
browser coverage, runtime versions, permissions, retention and publishing
serialization/trust remain unchanged.

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

Root will run the final exact-head gate with bounded timing enabled to exercise
the direct uploader, then verify trusted Slim reuse, artifact/public bytes,
hosted offline use and an explicit draft-preserving update. A complete manual
fallback will exercise upgraded configuration/deployment in its container path.
These results remain pending. An exercised timing upload does not establish an
actual failed-first/successful-retry diagnostic upload; report each condition
separately. Deployment timeout/cancellation and historical rollback conditions
are unexercised and retain their review qualifications.

Grouped PR creation is observed: PR #40 combines six updates after five individual
PRs were superseded. This establishes service adoption, not an account-wide
monthly savings figure. TIE-375's 20% complete-pair target stays open. The latest
accepted PR #39 pair uses 356 runner seconds/seven rounded minutes versus the
307/eight baseline, with 63.15% lower API-based projected artifact byte-hours;
raw time is higher and the full target remains unmet. See [PR #39 delivery](../ci-maintenance-grouping-2026-10-05/README.md).
