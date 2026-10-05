# Independent original copy/focus source assessment

Actual clocks: `2026-10-05 09:22:16`–`09:23:20 UTC`. Original raw failure
assessment was saved earlier in
`../actions-upgrade-2026-10-05/code/final-ci-failure-review.md` and is unchanged.
Read the saved TIE-377 brief and application focus/copy/combobox owners; did not
read the other reproduction/review verdict. No tests, APIs, app changes, build
or commits. Candidate tests are reserved for port 4317 when provided.

Observed local head: `eef0d51ea3ca835dfe27d7e157c6bfad1610a7b3`.
Original Git blob identities:

- `web/src/App.tsx`: `bfa956979be3af3c0e8556109f6f5cf3b7671f5f`;
  SHA-256 `c671e3576c5d61229a0e86850e21ae5da33bd9cdab8637e50c2b69df23928337`.
- `web/src/components/Choices.tsx`: `d92d280bd71c6c2841a424d1ae9dbc53c203577c`;
  SHA-256 `3977874ea3fd83f01333bce6cd9ccd8a971eb39dd52a4963223763098a7c96f1`.
- `e2e/choices.ts`: `6b81841ccf108483f35c9d3bea7ca017db6719ea`.
- `e2e/imports.spec.ts`: `a607347a9f60df82c6802fcfaa349025c43ee3c8`.

## Ownership and failure paths derived from source

`App.copy()` captures copy request ID and rendered result text before awaiting
clipboard write. Both success and rejection check current request ownership
before setting notice/manual fallback. `invalidate()` synchronously increments
the copy token and clears notice/fallback before automatic reconversion; message
and target/source/date/display setting edits use it. The visible fallback
textarea selects itself on focus.

After a current rejection sets fallback text, however, the queued
`requestAnimationFrame` at App.tsx:381–384 focuses and selects the **current ref**
without checking copy ID, focus ownership, fallback identity or lifetime. These
are concrete source gaps:

1. A queued frame can run after another control received focus but before that
   control delivers its first input event. The request token remains current
   until an edit occurs. A token check alone cannot prevent this focus theft.
2. A stale first copy's frame can target a newer copy's fallback through the same
   ref. Even with identical text, newer request ownership is independent.
3. Invalidation can clear fallback and supersede the request before its frame;
   a later fallback may mount before the stale frame executes. The current ref
   then belongs to a different action.
4. Clipboard rejection itself can arrive after focus moved elsewhere without an
   edit. The token is still current, so focus ownership must date from the Copy
   action, not from rejection or animation-frame registration.
5. Component lifetime and queued callback cancellation should remain bounded.
   Clipboard APIs cannot be canceled; stale completion/frame must still refuse
   ownership after teardown. A null ref prevents some physical focus calls but
   is not itself request-lifetime proof.

## Competing explanations and original evidence limits

`ZoneChoice` controls input text and selected option independently, permitting
custom unresolved values and suppressing hover focus selection. Its input commit
updates a current ref, calls target onChange and synchronously invalidates the
conversion/copy state. A pure “CST committed, then controlled selected UTC reset”
would therefore clear manualCopy/notice during that commit. The failed screenshot
retains both; this supports CST never reaching the application input commit.
It does not independently identify the lost event or prove callback ordering.

The unguarded copy frame stealing focus between the fill API's focus and text
insertion fits all retained facts: old UTC remains selected; manualCopy/notice
remain; later locator Tab refocuses the UTC combobox and leaves to More options.
This is the **stronger source-supported hypothesis**, pending the old-source
scheduled-frame control. Competing blur/selected-value reset, popup focus,
manual-copy completion rendering and browser event ordering remain relevant if
that control fails to distinguish the mechanism.

The first failed attempt has no trace. The sole passing retry trace cannot prove
the historical failing order; controlled equivalent failure must be qualified
as such. Historical TIE-370 readiness/navigation cause and prior TIE-374's later
Tokyo→osaka correction are separate conditions.

## Candidate design requirements

Preserve usable manual fallback when clipboard is denied and no subsequent user
interaction moved focus: current request may reveal/select its fallback. Capture
focus ownership at Copy initiation; recheck it inside deferred focus, together
with current copy ID and mounted/current field. Capturing a new origin only at
rejection would claim someone else's later focus. Mere “element is connected”
or matching displayed text does not establish ownership.

Do not focus another control or invalidate the user's draft to solve the race.
If focus has moved to target/source/message/menu/manual field, delayed copy
completion may not take it back. The callback must not select text in a field
owned by a superseding copy or invalidated conversion. Tracking/canceling one
pending frame can bound scheduling; ownership guards still matter because an
already executing callback or delayed clipboard promise can survive cancellation.

If origin-element equality is chosen, inspect whether focus away-and-back can
revive stale ownership; an interaction/focus generation is stronger when that
journey is in scope. A candidate must preserve normal keyboard/pointer and
automatic fallback selection, not obtain a pass by dropping focus behavior,
forcing actions, adding sleeps or weakening unresolved/copy assertions.

Independent candidate journeys should include original UTC→CST after Copy,
editing before delayed rejection, focus-only handoff before rejection/frame,
superseding copies, fallback field already focused, subsequent correction and
usable copy, then stale frame after invalidation. Select bounded meaningful
cases after the exact candidate and old-source proof are supplied; no tests were
run for this source assessment.

Implementation verdict, original copy focus: **unguarded deferred focus is an
actionable ownership gap**; proof that it caused this exact historical CI failure
remains pending. Original-report verdict: **real first failure unresolved**, with
source-supported mechanism and competing paths explicitly separated. Unchanged
Actions source approval does not approve a later App change.
