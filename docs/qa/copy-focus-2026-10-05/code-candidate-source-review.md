# Independent exact-candidate source review

Observed 2026-10-05 09:33:53–09:34:26 UTC; report saved at 09:34:58 UTC.
Explicit repository cwd: `/Users/tien/Developer/ChronoShift`. No other reviewer's
verdict was read. No build, browser test, Actions run or API operation was made.

Candidate `35e11bac657a0c379fda48af9b454e674d2ea854`, parent
`eef0d51ea3ca835dfe27d7e157c6bfad1610a7b3`, tree
`8c23c64176c14eaaf243f0beed10a0df9cdefcd4`. Exact App blob
`8bec3cbf656e92265f9f586fb9443de6e3c5aecc`; SHA-256
`aac68d2a4fd94562474104a258b057730eb65822767dd4cf72dbf65fc0fc5fc1`.
The App diff adds a focus-intent counter, mounted document capture listeners,
and guards/diagnostics around the existing manual-copy animation-frame callback.

## Implementation verdict

No actionable source blocker found for the bounded in-document focus race.
Runtime approval remains pending the candidate build and independent browser
checks. The deferred fallback can still appear after focus changes, but its
automatic focus/select now yields to newer focus, pointerdown or keydown intent.

The counter is captured when Copy starts, before awaiting clipboard rejection.
This covers a focus-only handoff while the promise is pending as well as the
original gap between fallback rendering and its deferred frame. Document capture
observes target focus before React or test input handlers run; a keydown on an
already focused field also invalidates ownership without waiting for a value
change. A focus-away/focus-back sequence cannot restore an earlier counter.

Copy activation's preceding pointerdown/focus/keydown occurs before the copy
handler snapshots the counter, so an ordinary immediate rejection with no later
interaction remains eligible for automatic fallback selection. Its own focus
event increments the counter only after the callback's ownership check, which
does not prevent selection in that same callback.

Request identity is checked both after clipboard settlement and inside the
frame. An input/preference invalidation, newer Copy, or later successful Copy
therefore prevents an older frame from selecting a current replacement field.
All existing manual-copy setters are confined to guarded copy completion and
invalidation; no independent field replacement was found that bypasses that
request ownership. The frame reads one current field reference and requires it
to exist. Unmount cleanup advances the intent counter and removes listeners;
an already queued callback then cannot acquire focus even if clipboard settles
after cleanup. StrictMode effect setup/cleanup also preserves those guards.

Focus intent is deliberately separate from draft/import invalidation: merely
focusing a control does not discard results, clear the draft, reject a pending
import as a conflicting edit, or change source/target preferences. The change
does not relax zone ambiguity, correction, clipboard-copy eligibility or the
existing manual selection behavior.

The four fixed diagnostic event names carry only a numeric request ID and, for
skips, a fixed reason (`superseded`, `new-interaction`, `no-field`). Existing
diagnostics return immediately while disabled, write only to the console while
enabled, and retain only the existing opt-in flag in session storage. No message,
copy text, preference, arbitrary DOM string or URL is added to logging, network
requests or permanent storage.

## Boundaries and required runtime evidence

Document listeners establish in-page ownership. Browser chrome/OS focus changes
that produce no document focus, pointerdown or keydown are outside this proof;
no physical-device or browser-permission-dialog behavior is claimed. The change
also does not cancel queued frames, but their bounded guard prevents a stale
frame from focusing a field. Opt-in diagnostics alone do not repair the missing
first-failure trace; see the separate observability recommendation.

Independent runtime checks should preserve normal motion and exact assertions:
hold a genuine fallback frame, focus the target before releasing it, then enter
and commit CST using keyboard input; confirm focus stays with the target,
ambiguity hides results/fallback, and Tokyo correction retains UTC source
interpretation. Also cover immediate uninterrupted fallback selection, delayed
rejection after a focus-only move, value invalidation, superseding copies,
focus-away/back and logs disabled/enabled without arbitrary text metadata.
Scheduling injection must be identified and kept separate from the original
unmodified import case. Parent owns the full gate; independent port is 4317.

## Original-report resolution verdict

The original first attempt on Web37288000068 remains a real unresolved failed
UTC-to-CST interaction, with only the successful retry trace retained. The source
change addresses the independently derived deferred-focus failure path. Parent
reports an old-source keyboard control demonstrating target-to-manual-copy
focus theft and lost keyboard text; I have not substituted that statement for
an independent runtime observation or read the reproduction verdict. Neither
that equivalent schedule nor a future passing candidate can establish the
missing original Playwright `fill` interleaving. Historical TIE-370 and TIE-374
causes, and physical Safari acceptance, remain separate.
