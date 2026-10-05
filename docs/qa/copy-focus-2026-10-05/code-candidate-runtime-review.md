# Independent bounded candidate runtime review

Inspection/preparation began 2026-10-05 09:37:56 UTC. Initial browser run began
09:39:46.820 UTC and lasted 21.463 seconds. The bounded correction run began
09:40:51.377 UTC and lasted 3.349 seconds. Evidence audit completed at
09:41:34.400 UTC; final report writing began 09:41:48 UTC and completed 09:42:17
UTC. Runtime evidence hashes were captured at 09:42:28.124 UTC in
[sha256s.txt](code-runtime/sha256s.txt).
Explicit repository cwd: `/Users/tien/Developer/ChronoShift`.

## Exact source and tested environment

Candidate `35e11bac657a0c379fda48af9b454e674d2ea854`, App blob
`8bec3cbf656e92265f9f586fb9443de6e3c5aecc`. Runtime conclusion supplements
[the independently saved source review](code-candidate-source-review.md).
Observed current App blob still matches the reviewed blob. Observed built asset
`dist/assets/index-B3d9YDa-.js` SHA-256 is
`764439adde23302a0e40ff2c221e8fe13055671a6285ac16d528344cf06befc9`, matching
[root's build identity](root-build-identity.json). Each custom probe checks
release.json's exact candidate revision; the existing-case attachment also
records revision `35e11bac…`, base `/`.

Used existing mise-managed Bun 1.4.0 and Playwright 1.63.0; no installation or
application rebuild. The independent config uses Desktop Safari's WebKit profile,
900×640 viewport, 2× density, locale en-AU, Australia/Sydney timezone, normal
motion, one worker, zero retries, trace retained on failure and screenshot on
failure. Observed UA identifies macOS WebKit/Safari 26.6; this is automated
WebKit, not physical Safari or the original Ubuntu runner. Every captured probe
environment reports reducedMotion=false.

Custom probes ran at `http://127.0.0.1:4317`. The unchanged existing import case
uses its original WebKit fixture's private dynamic origin. Its second observed
passing run records `http://127.0.0.1:58250`; the initial passing run did not yet
have the added QA-only environment attachment, so its dynamic port is not
claimed. Own configuration and wrappers are under [code-runtime](code-runtime/).
Application, shared test/helper files, browser settings, assertions, timeouts and
retry behavior were not modified.

## Results and genuine evidence limits

The initial run had eight retry-zero attempts: seven passed and one QA assertion
failed. The failed probe had already confirmed uninterrupted manual-copy focus,
but my expected regex mistakenly put the date before the time. Retained actual
text and `copyText` source show the documented time-before-date format. I corrected
only that own probe to the exact independent expected literal:
`3:00 pm · Thu, 9 Apr 2026 · UTC`, then newline,
`April 9, 2026 3pm UTC — UTC`. The corrected probe passed at retry zero with
full selection and zero copy diagnostic events while logs were disabled. The
unchanged original case was rerun only to close the missing dynamic-origin
metadata gap, and passed again. This is not reported as an all-green initial run.

The initial failure, logs, JSON attempt record, screenshot and trace are preserved
under [initial-results](code-runtime/initial-results/),
[initial report](code-runtime/initial-report.json) and
[initial log](code-runtime/initial-run.log). Original QA source had
`/9 Apr 2026.*3:00 pm.*UTC/s`; that erroneous regex is also retained verbatim in
the initial failure report. Before any browser case started, a separate server
startup failed because config-relative cwd could not find scripts/serve-web.ts;
[startup log](code-runtime/startup-failure.log) is retained. The config then sets
the explicit repository cwd. Neither failure is attributed to application code.

All six remaining custom ownership/request scenarios passed their first attempt:

- A held genuine copy callback is released through the native frame scheduler
  after target focus. Focus remains on target; keyboard CST entry commits exactly,
  results/manual copy disappear for ambiguity, and Tokyo correction produces
  midnight on 10 April with source interpretation UTC. Diagnostic skip reason
  is `new-interaction`, with no focus-applied event for that request.
- Clipboard rejection delayed until after a focus-only target handoff leaves the
  fallback available, retains target focus and UTC value, and logs
  `new-interaction`; no value-change token is needed to block stolen focus.
- An invalid target edit invalidates a pending clipboard request; its later
  rejection cannot restore manual copy or its notice.
- The newer of two delayed Copy requests succeeds. The older request's later
  rejection cannot replace the successful notice or mount a stale fallback.
- An older held frame survives invalidation and creation of a new Tokyo fallback
  field. Its release cannot focus that replacement field: request identity wins
  with `superseded`, and target focus remains owned by the newer interaction.
- Focus moves away and back to the Copy button before frame release. Returning
  to the old element cannot revive the earlier epoch; fallback remains available
  and focus stays on the Copy button with `new-interaction`.

Scheduling injection is confined to callbacks whose serialized body contains
the fixed `copy.focus-applied` event name. The explicitly armed next copy frame
is held, then released using the original native requestAnimationFrame. Other
motion/layout frames continue normally. Clipboard settlement is independently
controlled by a test-only promise queue. These controlled schedules test the
ownership mechanism; they do not reproduce an unobserved historical trace.

[Runtime summary](code-runtime/runtime-summary.json) contains first-attempt
clocks, exact outcomes, actual origins and observed diagnostic branches. The
console audit checks every retained copy diagnostic payload: only fixed event
names, `at`, numeric `requestId`, and a fixed skip reason occur. No message or
zone value occurs in those metadata payloads. The disabled case records zero
copy events. This console observation supplements the source privacy review;
it does not claim a new whole-app network/storage privacy test.

## Separate verdicts

Implementation: **approved for this bounded in-document focus/request fix**;
no actionable blocker found in independent exact-source and complementary
runtime checks. Existing import assertions were preserved and passed. Root's
exact-head full gate, CI runner/UID behavior, subpath deployment and physical
device acceptance remain root-owned or separate acceptance evidence.

Original report: the candidate prevents the independently derived focus-theft
schedule and passes the original unchanged case locally. Web37288000068's first
failed Playwright `fill` attempt has no retained trace, so its precise original
interleaving remains unproved. A passing local case and controlled keyboard
schedule cannot establish that missing history. Historical TIE-370/TIE-374
causes remain separate. Other reviewer verdicts were not consulted.
