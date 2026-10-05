# Delivery index input — live read-only snapshot

Linear project/issues/milestones captured 2026-10-05T07:04:59.969Z–07:05:03.185Z;
full remaining tickets captured 07:05:16.109Z–07:05:18.304Z. GitHub inventory
commands completed 07:05:22Z; publication metadata completed 07:05:49Z. Exact
commit API clocks are in capture-provenance.json. This is the implementation/
evidence role; no external updates, source changes, tests, CI dispatch, merge or
publication occurred. Only this new evidence folder was written.

## Inventory and current dates

All four project pages explicitly return hasNextPage=false, including archived
issues: **44 tickets = 32 Done + one Canceled + eleven In Progress**. This is the
four web projects' inventory, not every issue in the workspace. TIE-322 is Canceled
by the user's retirement of native Android work; its historical failures were not
fixed. TIE-315 is Done; installed offline share remains separately open in TIE-314.

| Project | State | Done / open / canceled | Milestones, actual Linear progress |
| --- | --- | --- | --- |
| Web Conversion Foundations | Completed | 11 / 0 / 0 | Contract & browser baseline 100%; Conversion parity 100% |
| Simple Web Experience | In Progress | 12 / 3 / 0 | Usable conversion flow 78.57%; Accessible, low-friction experience 81.25% |
| Offline PWA | In Progress | 5 / 3 / 0 | Offline-ready PWA 50%; Safe updates & offline entry points 75% |
| Web Delivery | In Progress | 4 / 5 / 1 | Web release candidate 50%; Web-only delivery 62.5% |

All four project start dates are 3 October 2026. All four project target dates and
all eight milestone target dates are **unset**. Project-detail display rounding is
79%, 81% and 63% where the milestone list supplies 78.57%, 81.25% and 62.5%.
These are Linear's progress values, not a calculation from Done ticket counts.

## Eleven remaining tickets: keep the causes separate

Nine tickets retain physical or human acceptance. Their engineering/browser
regressions and desktop evidence are supplementary; this inventory does not close
an original unchecked criterion.

| Ticket | Remaining acceptance |
| --- | --- |
| TIE-304 | Real phone input/conversion and actual 200% browser zoom with long text; physical folding/virtual-keyboard acceptance remains explicit. |
| TIE-306 | Actual offline screen-reader use of the target selector, including supported aliases. |
| TIE-309 | Screen-reader core journey and single announcements, actual 200% zoom, corresponding first-time task/friction assessment. |
| TIE-311 | Actual supported installed offline launch on Android, iOS and desktop, recording platform support. |
| TIE-312 | Preference retention after an actual installed-app restart on a named physical device. |
| TIE-314 | Supported installed browser receives OS-shared text offline into a usable input/result flow. |
| TIE-317 | Real Android Chrome/iPhone Safari cached offline restart, target selection and copying. |
| TIE-318 | Named representative phone with reproducible cold/warm p95 and editing/Clear budget assessment; desktop/emulation timing does not certify phone performance. |
| TIE-320 | Actual installed production offline restart and conversion of newly entered input. |

**TIE-370 is a separate historical-cause gap.** The original Chromium legacy-worker
explicit-update failure lost its controller/cache/timing evidence. Bounded delayed
reply recovery and retained successful-retry diagnostics are implemented and
reviewed, but neither establishes that historical cause. The later iPhone rollback
retry is distinct. Keep In Progress for the remaining cause criterion.

**TIE-375 is a separate efficiency target.** Current equivalent expanded-suite
PR/main pair must preserve all coverage and improve raw runner time while reducing
per-job rounded minutes and projected artifact byte-hours by at least 20%. The
final x64 PR sample is 400 runner seconds/seven rounded minutes, already exceeding
the complete-pair six-minute threshold and the 307-second whole-pair raw baseline.
It is not accepted by a green gate. Current ARM/two/six-worker and virtualization
experiments remain rejected. An incrementally approved publisher/diagnostics
implementation can be delivered while this target stays open.

Exact full descriptions, original unchecked criteria, URLs, priorities and provider
update times are preserved in remaining-issues.json; reconciliation.json is the
compact machine-readable inventory. No acceptance text was changed.

## Published release versus source and candidate

At 07:05:37.899Z–07:05:38.200Z, fresh production release.json returned HTTP 200,
sourceCommit **59a182b393e339234f8bfbd1f803b512e8a3c2d8**, base /ChronoShift/,
SHA-256 **8ec990ac2a89f06e1b3681f7f06d5596efec0550d0eddf1d680a6a1422b48275**.
Latest Pages deployment 6852117570 reports success at 05:38:18Z, from main
**67be6094afd71dc512e001df632cb8157bc71d45**, Pages run 37268626778. Read-only
gh commit APIs confirm tested release source and published main share tree
**7a2253291a47837fab35a27d9dc0af9c615d5408**. The prior publication audit retains
full exact artifact/public-file trust proof; this snapshot performs no new payload
authentication or deployment.

Current main **7059da3125ada61123f91d1267bbee9a6f4792ef** is the later evidence
commit (tree e5a521f53d5df9c590dd67756fee50280848df67), rather than a new deployed
runtime. PR #37 is currently OPEN and draft, head
**b288920d072d6ebb6ca56d1ea83f7c95ea7bed02**, tree
**c08c0f507faf6f82fac5ce790eb2e1f89fa59cdf**. Its successful Web run
37274709527 passed the full 258-case inventory, 116 units and one subpath check.
It is **unpublished** at this snapshot; passing PR status does not establish final
source review, successful consolidated Ubuntu Slim publication, manual complete
fallback, paired metrics or goal completion. GitHub release list is empty; the
production release.json is the runtime release identity.

Root will supply the new exact Pages IDs after reviews/merge. Append new logs,
jobs/artifacts, publication checks and strict paired metrics in new records,
preserving these originals. No account-wide/monthly Actions savings can be inferred
from the single successful pair proxy.

