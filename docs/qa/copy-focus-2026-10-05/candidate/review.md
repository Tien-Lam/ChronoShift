# Bounded copy-focus regression evidence

Report completion observed 2026-10-05 at 09:45:39 UTC. Implementation source is
`35e11bac657a0c379fda48af9b454e674d2ea854`; original source is PR40
`eef0d51ea3ca835dfe27d7e157c6bfad1610a7b3`. This author changed only the new
regression and QA files; root owns the application candidate and delivery.

## Old control and competing control

The initial synchronous document-capture release passed on the old build.
Its target focus at ~802 ms was followed by manual-copy focus, then Playwright
refocused the target before insertion. That result disproves this particular
injection as a reliable reproduction of the original locator.fill interleaving.
Its source, runner log, HTML report and extracted observation are retained in
`../reproduction/initial-focus-release/`; originals remain in reproduction root.

The refined journey waits until real target focus dispatch completes, releases
the uniquely identified held copy callback on a native animation frame, then
uses `page.keyboard.insertText("CST")` without reacquiring focus. On old build
`index-DHi9pTHJ.js` (SHA256
`b2ec5e8a200f317d260cd7e596c1f9a8d417f55f4379803a39867553791ae640`),
both initial/retry attempts lost target focus to manual-copy and left UTC.
Their observation intervals were 09:29:49.130–09:30:00.091 and
09:30:00.634–09:30:11.624 UTC. The generic `.focus()`/`.select()` callback
classifier was then repeated once with `--retries=0`: failure
09:34:54.363–09:35:05.241 UTC. Exactly one matching copy callback was held;
target focus preceded release; no target input event followed release.
See `../reproduction/keyboard/` and `../reproduction/robust-old/` for exact
sources, screenshots, contexts and observations. The retry trace belongs to a
controlled failing retry, distinct from the hosted original's passed-retry trace.

The unchanged existing imports case separately passed first attempt on old
WebKit (2.0 s; runner 2.5 s), retained under `../reproduction/ordinary/`.
This supports an intermittent path, not deterministic failure of ordinary fill.
The command was observed at 09:31:07 UTC; exact journey clocks were not captured
by the custom collector for that unmodified control.

## Candidate observations

All 22 candidate observations fetched the actually loaded JS and stylesheet
from their own actual origin. Every JS is `index-B3d9YDa-.js`, 775642 bytes,
SHA256 `764439adde23302a0e40ff2c221e8fe13055671a6285ac16d528344cf06befc9`.
CSS bytes/hash match the old control. Per-case actual origin, user agent,
viewport, raster, locale, timezone, focus/input events and observation clocks
are preserved in `observations-summary.json` and original results JSON.
All report `prefers-reduced-motion: reduce` false. Darwin ARM/M4 Pro/Bun1.4.0
environment is retained in `../reproduction/environment.json`; these are local
emulated profiles, not Linux CI or physical-device acceptance.

- WebKit eight-case probe: 09:42:15.320–09:42:18.471 UTC, seven passed and one
  fixture precondition failed, no retries, runner 4.0 s. In the failed away/back
  case WebKit click left body active; body was not focusable, so restoring it
  failed the exact-owner assertion **before callback release**. The frame was
  still held. Raw source `copy-focus.spec.ts`, log, marker/screenshot/context
  and observation remain intact. This is not a candidate application failure.
- Corrected away/back and pointer boundaries: 09:43:00.791–09:43:01.845 UTC,
  two first-attempt passes, no retries, runner 1.8 s. Temporary body focusability
  permits returning to the exact prior body element; pointer assertion verifies
  exact owner before releasing the held frame. Full corrected source is
  `boundary-probes.spec.ts`.
- Three core cases on Chromium, Firefox, Android and iPhone emulation:
  09:43:14.641–09:43:21.425 UTC, twelve first-attempt passes, no retries, runner
  7.4 s. Combined with three WebKit first passes, all fifteen core profile/case
  combinations passed. Logs/markers reconcile 22 attempts: 21 passes and one
  preserved fixture failure; none is a retry.

Core checks retain exact CST, no result/manual-copy, ambiguity warning, correction
to Asia/Tokyo at 12:00 am on 10 Apr with source UTC, and usable UTC+09:00 Tokyo
manual fallback. The other core cases require full selected fallback text and
retention of the exact owner after a real same-owner Shift key action. Five QA
boundaries cover focus-only, away/back, pointer intent, superseding copies and
late rejection. All other application animation callbacks use native scheduling;
only a unique focus/select callback registered during the owned copy is held.
No sleep, force click, changed timeout, motion setting, app helper or browser
configuration was introduced.

Commands used explicit repository cwd, `CI=1 PLAYWRIGHT_PORT=4316`, mise-managed
`bunx --bun playwright test e2e/copy-focus.spec.ts`, `--retries=0`, separate
HTML/results directories. First run selected `--project=webkit`; correction
selected `--project=webkit --grep 'focus away and back|same-owner pointer'`;
core profile run selected Chromium/Firefox/Android/iPhone and grep
`'a deferred manual-copy|an unchanged copy owner|same-owner keyboard'`.
Server/origin checks after completion found port4316 and every recorded owned
ephemeral origin unreachable. No deployment or Actions run was dispatched.

## Permanent scope and verdict

The final permanent file contains only the three core cases (+15 cases across
the existing five profiles), preserving all existing 258-case inventory.
SHA256 `6467c3acb6f5da55573678ac9e64b846fd3f8eba1cdb04b4df6ea59c0bfb429e`;
snapshot `permanent-copy-focus.spec.ts`. After the probes, unused boundary APIs
were removed and successful identity/attachment collection was gated behind
`CHRONOSHIFT_COPY_FOCUS_EVIDENCE=1`; cleanup remains unconditional. Callback
exceptions reject the test fixture's release promise and evidence cleanup uses
finally. These final harness-only deltas have formatting verification and are
explicitly subsequent to the above browser snapshots. Root's exact-head full
gate will exercise the permanent quiet path; this report does not claim it ran.

Implementation: the measured candidate prevents the bounded deferred-copy focus
race and preserves usable unchanged-owner fallback in the tested conditions.
Independent source reviews and the final hosted/full gate remain root-owned.
Original report: a matching focus-loss/unchanged UTC/manual-copy symptom and
implicated deferred lifecycle are reproduced and prevented by the candidate;
the missing first-failure trace means the original locator.fill interleaving and
historical causal attribution remain unknown. Published-byte verification and
report-matching hosted checks remain outstanding. TIE375 performance/quota
acceptance is not established by any of these tests.
