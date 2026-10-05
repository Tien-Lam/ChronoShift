# Snapshot preservation addendum

The original verdict reports are preserved. Report writing clock:
`2026-10-05 08:57:35 UTC`. Subsequent snapshot-preservation commands finished
before the actual clock `2026-10-05 08:58:07 UTC`.

The exact committed workflows were saved with read-only `git show`; their
SHA-256 hashes are:

- `exact-web.yml`: `67132c1065583edff041336b3731951989fa36cbf66fdccb237018c58a091854`.
- `exact-pages.yml`: `3123f5b0bba0f6d0928f8f76747605babb31d6d5ace90fb473fe71cc08aa0e6f`.
- `initial-web.yml`: `eb78ccda42697ae2dca3eb384bfb3ab2aa0c4827a85276a45c160f6b649453cb`.
- `initial-pages.yml`: `0721d8950934e53c41b41fc547c936164d2e4b5354df1de1184313fc3fe36cd1`.

The full official bundled uploader source at immutable commit
`043fb46d1a93c77aae656e7c1c64a875d1fc6a0a` has SHA-256
`79a9b54b64c68e4d0d9c2ae745f7e6ed2ac18eb015e37560ee58e0d0232e58a0`.
It was obtained by `gh api` raw-media request. The compact bundled SDK excerpt,
full digest, official metadata and comparisons are also retained. For delivery,
the implementer may choose the excerpt plus immutable source link/hash rather
than committing the large full bundle.

Automatic approval review rejected a batched snapshot/cleanup command because
it included `rm -f`, stating that such commands are not permitted and asking for
a safer approach. That batch did not run. A subsequent batch omitted cleanup,
successfully saved exact snapshots/delta and hashes, and retained the full file.
No permission request or implementation change was necessary.

`source-hashes.sha256` enumerates preserved review artifacts before this
addendum; this addendum's own hash will be added by a final manifest refresh.
No additional runtime observations or verdict changes result from preservation.
