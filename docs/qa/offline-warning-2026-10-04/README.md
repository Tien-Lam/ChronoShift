# TIE-324 — intermittent offline warning

User report: regular Chrome, normal use → change Convert to timezone → Convert. Repeated uninstrumented live UTC/Sydney/London conversions did not reproduce the intermittent natural timing. The investigation found and reproduced two false-warning paths; it does not establish which occurred in the user's session.

Controlled browser regressions use installed **Google Chrome 154.0.8037.93**, actual production caches and service workers. Previous source `eb4d544`, with the same new regression tests, fails both cases:

- A simulated transient registration rejection while an intact controlling worker/cache exists emits the exact incomplete warning without checking that cache. [Screenshot](chrome-registration-before.png).
- A delayed older negative readiness reply overwrites a newer successful real cache confirmation, producing the exact warning after conversion. [Screenshot](chrome-stale-probe-before.png).

[Before log](chrome-before.log): two failures; the existing genuine missing-cache/reconnect-repair test still passes. [After log](chrome-after.log): all three cases pass with the fix. Failure injection controls registration/response timing; these are bounded reproductions, not a claim that uninstrumented target changes reliably trigger them.

The fix at `c0475af` retrieves only an existing exact-scope registration after registration failure, then confirms the actual expected controller's cache. It closes superseded message ports/timeouts and closes the current probe on abort. Genuine current cache failures still warn and repair; explicit update activation is retained. No conversion or service-worker cache algorithm changed.

108 units, typecheck/build/format and 128 browser scenarios pass (43.9s, no retries). Independent fresh code review approved after passing 15 focused cases across five core profiles. Independent fresh adversarial review approved after four installed-Chrome checks covering both false-warning paths, actual cache failure/repair and explicit update/draft preservation. Both approved the test-only `c3d5ffb` delta: live smoke now repeats UTC/London/Los Angeles conversion and checks readiness/warning absence before offline reopening; hosted desktop can use installed Chrome. These checks do not certify physical phones or assistive technologies.

Reproduce fixed Chrome cases after a production build:

```sh
PLAYWRIGHT_CHROMIUM_CHANNEL=chrome PLAYWRIGHT_PORT=4197 bun run test:browser --project=chromium --grep 'registration check|delayed failed readiness|missing cache'
```

Publication and live verification are recorded in the PR. The nine pre-existing capability-specific acceptance tickets remain separate.

## Published verification

[PR #24](https://github.com/Tien-Lam/ChronoShift/pull/24) merged as `ec1167cdf0b5c9d37ea9dc285e9b2ec3a6133c2c`. [Web CI](https://github.com/Tien-Lam/ChronoShift/actions/runs/37200206642) and [Pages publication](https://github.com/Tien-Lam/ChronoShift/actions/runs/37200408401) succeeded. Pages reused that trusted CI artifact after digest and exact-tree verification: source `4e305cda1b6e670cfed69cf6a97a731ce12c90ce`, tree `664d4b07a8ef37359a98a2ca024630d342c2df63`.

[Final hosted log](hosted-after.log): all four desktop/phone-profile cases pass (5.3s). [Installed Chrome hosted log](hosted-chrome-after.log): both desktop cases pass (3.0s). They cover normal UTC → London → Los Angeles reconversion without the warning, actual ready confirmation, offline close/reopen with fresh input, scoped manifest, expected release and effective CSP. Command: `HOSTED_EXPECTED_COMMIT=4e305cda1b6e670cfed69cf6a97a731ce12c90ce bun run test:hosted`; repeat with `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome` and `--project=hosted-desktop` for installed Chrome.

Final source captures show the controlled [registration case](chrome-registration-after.png) and [stale probe case](chrome-stale-probe-after.png) after the fix. Both pass in installed Chrome; the earlier three-case log also includes genuine cache failure/repair.

The browser side panel independently accepted the waiting live update, preserving the synthetic Tokyo draft, then converted to UTC and changed target to London (9:20am). DOM evidence: `data-offline-ready="true"`, warning absent, script `assets/index-BgHl7uJ4.js`. [Published result screenshot](published-conversion.jpg). TIE-324 is Done; all four criteria have evidence, with the natural-timing limitation above retained.

## Reopened: delayed installation warning

The user reported recurrence after 10–20 seconds on the hosted page, with a console stack ending in `fill → repair → install` and `Offline asset belongs to another release`. That establishes an installation integrity rejection, but not the offending asset. [All 13 current public assets matched the public worker's expected hashes](hosted-integrity-before.log); a fresh installed-Chrome session remained ready at 10 and 22 seconds. Those fresh sessions do not explain the user's prior browser state.

The previous page timed out after 15 seconds before attaching lifecycle observers. An independent real installed-Chrome test delayed only `icon.svg` for 17 seconds: conversion worked, but even after the worker activated and directly confirmed its cache at 21 seconds, the page retained its incomplete warning. [Before log](install-real-delay-before.log), [after log](install-real-delay-after.log). The fixed page clears the warning when actual readiness arrives and keeps its conversion.

[PR #25](https://github.com/Tien-Lam/ChronoShift/pull/25) keeps lifecycle observers active, retries registration at most twice with backoff (including a rejected first install that unregisters itself), and refetches stale/missing responses with a fresh release cache key. Every fetched response still needs the exact expected SHA-256 before cache publication. Persistent wrong bytes remain an error, and errors now identify the path and expected version. Explicit update activation is unchanged.

[Previous-main installed-Chrome cases](install-before-chrome.log): slow install, stale mutable response and rejected first install fail; persistent wrong-release rejection passes. [Final installed-Chrome cases](install-after-chrome.log): all five installation cases pass, including initial registration fetch failure. Matrix regressions accelerate only the page's 15-second deadline to 200ms and use real workers/caches with server-controlled responses. The independent 17-second test above retains real timing.

Both independent reviewers approved final `a91a9bca04359f0e88f2926884f7006767310097` with no blockers. Code review ran nine installation/update cases, then the new initial-registration case across all five profiles. Adversarial review ran ten focused Chrome cases, the real-delay experiment, four delta cases, and [extra budget/cancellation checks](install-budget-abort.log): persistent initial rejection stops after three total attempts; abort during the first retry wait stops at one attempt and emits no warning. The final local gate passes 108 units, typecheck/build/format and 153 browser scenarios (1.0m, no retries).

The hosted smoke now waits 21 seconds and reconverts before offline close/reopen. Final publication and delayed live verification will be appended below; the earlier completion above records the prior attempt rather than proof that this recurrence was already resolved.

Final publication: merged main `0d7c329954f1214d0a59b4ea0c8867b796d4afaa`; [required Web CI](https://github.com/Tien-Lam/ChronoShift/actions/runs/37202234336) passes 108 units, 153 browser scenarios and subpath. [Pages](https://github.com/Tien-Lam/ChronoShift/actions/runs/37202446938) succeeds after verifying and reusing that CI artifact: tested source `10a2399fc5b6cd08ba3ed85a69e5492b7d97517f`, tree `303c547f961c5b22c4136112417a1eeaa66c290a`. [Longer hosted checks](install-hosted-after.log): all four desktop/phone-profile cases pass (26.4s), including 21 seconds idle followed by timezone change/reconversion and offline reopening.

[Installed-Chrome delayed hosted checks](install-hosted-chrome-after.log): both cases pass (26.6s), observing 21 seconds before reconversion and offline reopening. The side panel accepted the waiting update with the synthetic draft preserved, observed 41,282ms, then changed UTC to London and reconverted to 9:20am. Actual ready marker true, warning absent, script `assets/index-Bn2wAXiv.js`. [Final live screenshot](published-install-recovery.jpg). Previous target preference restored; temporary test tab closed. TIE-324 is Done again with this expanded evidence, while the nine pre-existing capability-specific tickets remain open.
