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
