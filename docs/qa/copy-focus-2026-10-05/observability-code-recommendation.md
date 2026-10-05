# Bounded first-failure observability recommendation

Actual source/doc inspection clocks: `2026-10-05 09:26:10`–`09:26:54 UTC`.
Explicit project cwd. Read local Playwright configuration, fixture, attempt and
timing reporters, console capture helper, diagnostics whitelist/specs and
developer testing guidance. No tests, APIs, build or source edits. This is a
recommendation separate from the copy-focus candidate review.

CI's `trace: on-first-retry` intentionally avoids recording every successful
first attempt. Failed screenshots/context and the unexpected-attempt marker
already survive successful retries and receive the existing three-day artifact
retention. The current failure demonstrates that this policy works, but a passing
retry trace cannot identify first-failure input/focus ordering. The absence of a
first trace is an accepted cost tradeoff, **not a claim that screenshots supply
equivalent causal evidence**. A targeted cheap observability gap can be filled
without changing trace policy or the product interface.

## Cheapest useful addition

Recommend a **test-only opt-in interaction breadcrumb fixture** for clipboard/
focus/zone-input scenarios. Capture from test start, but attach a JSON file only
on an unexpected failed attempt (`status !== expectedStatus`, excluding skips).
“First-failure-only” describes attachment, not listener installation: beginning
capture after failure cannot recover the preceding race.

Use passive observation without synthetic focus, DOM changes, sleeps or new
React state. Observe `focusin`, `focusout`, `beforeinput`, `input`, and only the
fixed Tab key event; identify Copy activation using the fixed known control
class, not its accessible name. Map elements to a closed label set:
`message`, `target-zone`, `source-zone`, `manual-copy`, `copy-button`, `other`.
Record event kind, ordinal, document-local monotonic milliseconds and active
field label. Never copy DOM values, textContent, attributes, arbitrary IDs,
clipboard contents, selected zones, URLs, input data or general keyboard keys.
For the reported path this distinguishes target focus→manual-copy focus with no
target input from target input→later reset, while revealing Tab/focus order.

Bound to 128 recent events and a maximum 16 KiB serialized attachment, with a
dropped-event count and explicit unavailable-document flag. Document-local
`performance.now()` is one domain; keep a wall-clock document-start anchor
separate rather than subtracting it from monotonic time. Treat navigation/closed
page read loss as evidence unavailable, not an invented empty history. A test
with one navigation and ordinary page teardown can read a page-memory ring once
on failure; do not add IPC or console serialization per passing focus event.
Reset per test/document and remove listeners with fixture teardown.

Write an attachment **path** under the attempt's `testInfo.outputPath` and attach
that file before attempt reporting. The existing marker records only attachments
with paths, while body-only attachments are represented in HTML but not its path
inventory. Keeping the file below `test-results/` reuses the existing failure
uploader and three-day retention; ordinary successful attempts upload nothing.
Preserve filename/attempt association so a successful retry cannot overwrite it.

This is much narrower than full-suite first-attempt tracing: a fixed small
buffer for selected tests, one read/file only on failure, no screenshot/network
capture. Actual overhead has not been measured; do not claim a CI saving or
resolution of TIE-375's complete-pair cost target. Preserve an uninstrumented
case as a control because any listener can affect a tight race's timing.

## Optional product diagnostics alongside the focus fix

For human-enabled diagnostics, add fixed event names to the **existing** logging
path, without a new toggle or UI: `copy.started`, `copy.rejected`,
`copy.focus-scheduled`, `copy.focus-applied`, `copy.focus-skipped`.
Use existing numeric `requestId` and elapsed milliseconds; add only closed
whitelist enums/booleans when needed for owner match and active-field category.
Skip reasons should be constants such as `superseded`, `focus-moved`, `no-field`
or `unmounted`, not exception text. An optional `ui.zone-edit` with the existing
source/target field label can prove application input commit without recording
its value. Logs remain opt-in, local, with no application event history/storage.

This second addition explains request ownership and skipped focus decisions,
but **does not alone fill first-failure evidence**: current imports tests do not
enable detailed logs. Enabling all detailed logs across the entire suite adds
unneeded lifecycle/conversion output. Prefer the targeted test-only breadcrumbs;
enable or collect copy diagnostics only in focused diagnostic/control scenarios
if richer ownership evidence is needed. Avoid reusing semantic worker fields for
copy focus or serializing DOM/Error objects into the logger.

## Required bounded validation if implemented later

Verify failure→retry retention with a genuine scheduled-focus control and a
passing control, including trace/marker/attachment distinction. Verify caps,
drop counts, teardown/navigation loss and privacy with sentinel text/zone values
and assert no recorded input payload or network request. Confirm logging off
stays off and targeted fixture activation does not change normal assertions,
motion or focus. These are future implementation checks, not executed here.

Recommendation verdict: keep retry-only tracing; add the bounded test fixture if
future first-failure focus ordering is desired. Optional existing opt-in copy
logs complement it without polluting user UI. Neither addition can reconstruct
the missing original trace or establish a historical cause by itself.
