# Independent code review addendum: PR #38 and retained fallback archive

Actual observation clocks: 2026-10-05 11:28:48–11:28:56 UTC; report preparation began 11:28:56 UTC, and the written report was observed at 11:29:07 UTC. Scope is only `pr38-merge-status.json` and its added README link. No external query, runtime operation, source edit or other reviewer's final report inspection was performed.

The retained `gh pr view 38` snapshot has its own 11:28:33–11:28:34 UTC clocks and records `state: CLOSED`, `mergedAt: null`, `mergeCommit: null`, closure at `2026-10-05T11:11:50Z`, and exact retained head `299e3864f01d4e87a1770594628b84cf5a3972c8`. All fields shared with `pr38-final.json` agree. The explicit null merge metadata supports README's bounded “closed without merge” claim at that observation.

New README SHA-256: `c3b3fd341eedf0d6a7011eaf31dbeed97cd6ac0b6830126547e1034e90925946`. Removing only the added merge-status link reproduces the original reviewed README hash `135b27797bb3509f5e8f1ea0e4699abc3bbf87eda3ff9d8996213cfb20f3a300`, confirming other claims are unchanged. The linked snapshot exists; SHA-256 is `c79cab0ebe2c09e0ad1a39f6f2af14bf745fd7b08aaf487ebd4988a1b754d8e0`.

Documentation verdict: **approve this metadata/link delta; no blocker**. Original report remains unchanged (SHA-256 `e877f11b9eceb20a77c4794ce342ce4699abc08038a059cec02ac7c7315f3ad6`). Earlier source approvals remain unchanged. Original-report/goal verdict remains **unresolved**: this snapshot does not establish the 20% CI target, physical-device acceptance or historical flake resolution.

## Subsequent fallback archive preservation

Additional actual observation clocks: 2026-10-05 11:29:26–11:29:27 UTC for archive inspection; the source identity check and written report addition were observed at 11:29:39 UTC. Parent preserved the original owned scratch archive with recorded copy clocks 11:29:06.537–11:29:06.540 UTC in `fallback-archive-preservation.json`. No further README prose change was requested.

Independently rehashed the now-retained binary files: ZIP 374915 bytes, SHA-256 `2676a9e05004bfdda293d70e69ca6cfe94dd717b23cf5a5a92ef229253775984`; TAR 1218560 bytes, SHA-256 `a8d5783ed66b19dc626b3dc6c189a254eaa93eeb1fd7fc3c0dcd0b889edd9a93`. Both agree with the original root fallback audit, preservation record and retained ZIP API digest. ZIP has only `artifact.tar`, and its bytes exactly match the retained TAR. TAR contains three directories and 14 regular files with safe relative paths, no links or special members; every file's size/hash independently matches the original audit inventory. Embedded release source is `cf4d5b9244278da591a33c1952283e76acb6116c`, base `/ChronoShift/`.

This resolves the original final review's narrow missing-binary/independent-rehash limitation through additive evidence. It does not rewrite that original observation, re-query the deployed site, or expand the goal-resolution verdict. **Approve the archive preservation evidence; no blocker.**
