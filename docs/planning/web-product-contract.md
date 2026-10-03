# ChronoShift web product contract

Implementation contract for TIE-292. The app is a private, English-first timezone converter on a phone or computer. The main task is paste/type → Convert → inspect → Copy. No account, server conversion, cloud inference or conversion history.

## Input and interpretation

- Support natural-language dates/times, ISO timestamps, explicit offsets/IANA zones, supported timezone abbreviations and city aliases, relative dates, ranges and Unix seconds.
- Limit input to 10,000 characters. A limit/error does not erase the input. Treat everything as text; never render or fetch a shared URL.
- Inject a reference instant and a source/default timezone into the engine. Default source timezone is the device timezone, independently of the selected target timezone.
- Missing source zone uses the source/default timezone, labeled on the result. Missing dates use the reference date in the source zone and are labeled. Explicit input wins over correction defaults.
- Relative dates are resolved from the reference date; the user can choose a reference date for an old message. English numeric dates default to month/day; a day/month preference is explicit and visible in More options. Never infer the numeric date convention from an ambiguous timezone abbreviation.
- Share a date with subsequent times in the same sentence/list context. A new explicit date replaces that context. Do not propagate a date globally into unrelated paragraphs.
- Keep range endpoints associated, in textual order, including overnight date changes. Date-only results remain plain dates and never invent noon as a timestamp.
- Keep unique instants/source-zone interpretations; merge true duplicate mentions and retain occurrence context. Formatting is not a deduplication key.

## Timezones and ambiguity

- EST/PST and other explicit standard/daylight abbreviations are fixed offsets even in another season. PT/ET/CT/MT are regional IANA zones and use the event date's DST rules.
- Supported ambiguous abbreviations follow the audited existing data: CST (-06:00, +08:00), IST (+05:30, +01:00), BST (+01:00, +06:00), AST (-04:00, +03:00). Show labeled alternatives together. Cities do not silently erase them.
- An arbitrary UTC offset must be displayed as an offset, without inventing a city. IANA/city context retains its actual location label.
- A repeated local time at the autumn DST transition produces both instants. A nonexistent spring-forward local time requires correction and is not silently shifted.
- Unknown cities/zone-like tokens produce a correction warning; no online geocoder or longitude-based approximation. Fuzzy city matches must have one unique candidate and be disclosed; ties remain unresolved.
- Detect the device timezone and provide a searchable target override. If detection fails, use a visible UTC fallback. Preferences store an override or Auto; the Auto setting follows a device timezone change.

## Example acceptance values

These expectations are independent of parser output. Reference instant for unspecified dates: 2026-04-06T12:00:00Z; source default UTC; target Australia/Sydney.

| Input | Expected instant / behavior |
| --- | --- |
| April 9, 2026 at 3pm EST | 2026-04-09T20:00:00Z (fixed -05:00); Sydney 10 April 06:00 |
| July 15, 2026 at 3pm PT | 2026-07-15T22:00:00Z (Los Angeles summer -07:00) |
| January 15, 2026 at 3pm PT | 2026-01-15T23:00:00Z (Los Angeles winter -08:00) |
| April 9, 2026 at 3pm CST | 2026-04-09T21:00:00Z and 2026-04-09T07:00:00Z |
| 2026-04-09 15:00 UTC+05:45 | 2026-04-09T09:15:00Z |
| 2026-04-09 15:00 UTC-03:30 | 2026-04-09T18:30:00Z; label UTC-03:30 |
| Tomorrow at 9am UTC | 2026-04-07T09:00:00Z |
| March 8, 2026 2:30am America/New_York | Nonexistent time; correction warning, no manufactured instant |
| November 1, 2026 1:30am America/New_York | 2026-11-01T05:30:00Z and 2026-11-01T06:30:00Z |
| April 9, 2026 | Date-only output, no time/instant |

## Interface

One page, stable editable input, labeled Convert, examples, target timezone and readable results. Large target time, full date, offset/zone and source text appear together. Copy includes date/zone and the chosen interpretation. Errors explain the next step. More options contains source defaults, reference date, numeric date convention and display preferences. Honor system theme/reduced motion; no model management in the main flow.

Phone sketch:

```text
ChronoShift                      Offline ready
Make time local.
Paste a message. Find your time.
[ multiline message                         ]
[Paste] [Clear]                    [Convert]
Convert to: [Your timezone / searchable zone]
More options ▸
---------------------------------------------
"3pm CST"                         2 possible zones
US Central Standard                [Copy]
7:00 AM · Fri 10 Apr · UTC+10 Sydney
China Standard                     [Copy]
5:00 PM · Thu 9 Apr · UTC+10 Sydney
```

Desktop uses a readable centered workspace, with input/results side by side when space allows; phone stacks them. No horizontal scroll at 320 CSS pixels or 200% zoom. Keyboard Enter remains a textarea newline; Ctrl/Cmd+Enter converts. Result/error announcements and labels support a screen reader. Copy/paste are user actions with manual fallbacks.

Adapt dynamically when a window resizes or a device folds/rotates, preserving draft input, results and preferences. Cover screens down to 280 CSS pixels, tablets, unfolded screens and short landscape windows must reflow without horizontal page scrolling. Respect display safe areas and offer controls at least 44 pixels high on touch screens. When supported, CSS viewport segments place input/results on separate sides of a vertical hinge; tabletop posture keeps the scrollable task within the upper segment. Other browsers use the fluid single/two-column layout. Actual folding and virtual-keyboard behavior require physical-device acceptance.

## Offline and privacy

Host on GitHub Pages at https://tien-lam.github.io/ChronoShift/. All asset URLs, manifest and service-worker scope use `/ChronoShift/`. Publish a preview from the migration branch while release gates remain open; reviewed main updates become the continuing publishing source. Keep Android cutover separate from preview publishing.

- Offline conversion becomes available after the first online visit completes all required cache assets. Only show Offline ready after successful preparation and control. Installation is optional.
- No text in URLs, conversion requests, analytics, server logs or permanent storage. Only preferences persist by default. Explicit update reload and shared-text entry may use a short-lived local handoff, consumed/deleted immediately with a five-minute maximum age.
- Cache parser, polyfill, worker, CSS, icons and any data on the same origin. No runtime CDN fonts/scripts. No automatic clipboard reads.
- Service-worker updates wait for user action and preserve active input only for that action. Partial updates retain the last usable version. Cleared/denied browser storage may require reconnecting and must not crash the app.
- Installed share reception is a browser capability enhancement via POST intercepted locally. Ordinary paste works on every supported browser. Android PROCESS_TEXT, extensions and native wrappers are deferred.

## Supported matrix and release gates

Test current supported Chrome/Edge, Firefox and Safari on desktop; Android Chrome and iOS Safari on real devices before cutover. Automated Chromium, Firefox and WebKit checks supplement real-device evidence and do not replace it. Installation/share reception are separately feature-detected. Use a bundled Temporal compatibility path, browser Intl timezone data, and exact DST fixtures; no promise to freeze OS timezone rules forever.

The first release requires exact engine fixtures, fresh-input conversion after offline reopen, clipboard/storage/update fallbacks, keyboard/screen-reader checks, phone performance measurements, HTTPS release/rollback and local-only data audit. AI is an optional experiment and may only enhance deterministic results if benchmarks justify it. Android source and release workflows remain during migration until the release gates are met.

## Known behavior changes

Do not copy Android defects: global first-date propagation, fuzzy span merges that disregard dates, fixed-offset-to-arbitrary-city labeling, date-only noon display, or assumed accuracy from synthetic model responses. Inventory all existing corpus patterns; use reviewed exact fixtures for launch fidelity and retain unsupported/AI-only cases as an explicit gap list.
