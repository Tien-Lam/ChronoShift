# Independent adversarial review: TIE-371 live conversion

Original brief: repository `docs/qa/live-convert-2026-10-05/brief.md`, original request “live convert feature. Live convert whatever text is there. No need to press convert”. Independently derived failure paths before relying on implementer tests: draft/settings changes while a worker or copy completes, IME intermediate drafts, partially edited reference dates, delayed import conflicting with a user edit versus automatic conversion, empty/invalid/oversized input, worker failures followed by editing, transient handoff restoration, healthy controlled offline operation, and rendered long timestamps in both themes at desktop/narrow widths. Did not consult the code reviewer's verdict or report before saving this report.

Base: ac90f3880e630f7e4aed8b5ec02512caec022b70.
Inspected runtime source: e141635b8bd6dea0e0cd4862f543ad4d559ed547.
Later notified of test/tool/docs delta 7acd413c92359e6b2d746ac2dad05b4634881911, with no App/runtime change. This original review is of the e141 runtime and its measured artifact identity; it does not independently certify those later test/tool changes.

Production preview: http://127.0.0.1:4254/, root base. Existing candidate dist was served, never rebuilt or mutated by reviewer. `release.json` read `sourceCommit: local`, base `/`; release metadata is therefore not an exact source-SHA attestation. Artifact identity: cache `chronoshift-5d54f7de19e36cb0`; JS index-Bv93Z6Ns.js SHA256 6a328f59c04726f5bbaf8ac3c9627921a3ce36b526116c218b28db87b4a07319; CSS index-CaYJPLtH.css SHA256 a10db3fba1fa5c10a593b03c4af7ce54daf5c9c4ff79b7c07f717a2ccfbe1404; worker-C690IjaR.js SHA256 e17b01198be6045d352561d10fe1f6004eb83d106b13f16ef027f0ec36230704.

Environment: macOS Darwin 27.0.0 arm64 on Tiens-MacBook-Pro; mise-managed Bun 1.4.0, Node 26.8.1, gh 2.100.0; Playwright 1.63.0 bundled Chromium 153.0.8010.12, Firefox 155.0, WebKit 26.6. Fresh browser contexts. Primary Chromium locale en-AU, timezone Australia/Sydney, viewport 1280×900, then 390×900/280×900; dark and light actual app theme. Normal suite UTC time 2026-10-04T19:57:24.727Z–19:57:44.772Z, 20.045s including Firefox/WebKit smoke. Additional error and lifecycle/IME probes finished by 19:58:44Z.

Commands (repository cwd unless specified): `PORT=4254 bun scripts/serve-web.ts`; `bun /tmp/chronoshift-live-adversarial/review.ts`; `bun /tmp/chronoshift-live-adversarial/worker-error.ts`; `bun /tmp/chronoshift-live-adversarial/firefox-ime.ts`; `bun /tmp/chronoshift-live-adversarial/lifecycle.ts`; `shasum -a 256 dist/assets/index-Bv93Z6Ns.js dist/assets/index-CaYJPLtH.css dist/assets/worker-C690IjaR.js`; `uname -a`; `mise current`. Scripts, JSON observations, logs and six screenshot captures are in the review output directory. They were created outside the tracked tree. No tracked files or shared build output were edited.

## Tested conditions and observed results

- Normal incremental message typing (30ms between characters) automatically produced 15:45 for April 9 2026 3:45pm UTC with 24h formatting explicitly selected; no Convert button. Subsequent milliseconds input produced 09:01:02.345.
- Changing text at 260ms near worker startup, then target Asia/Tokyo→UTC, produced only the final 23:00 result and remained final beyond another 700ms. Independent stronger queue probe delayed actual native worker completion handlers by 650ms, retained an old queued callback even after termination, then changed 8am→9am: no stale 8am result appeared when the old callback ran; final 9am appeared. Real workers delivered the data; delayed callback scheduling was deliberate fault injection.
- Source New York→Tokyo independently changed naive 9am input 13:00→00:00 in UTC; 12h/24h display changed automatically; mdy/dmy changed 04/09/2026 April→September automatically.
- Invalid target removed results and displayed timezone guidance, and UTC repaired it. Whitespace cleared, unparsable text displayed no-timestamp guidance, 10,001-character input displayed size guidance, and normal edited input recovered. Clear removed results immediately and stayed empty another 700ms.
- Chromium compositionstart plus intermediate input suppressed worker creation and results for 700ms; compositionend converted the final 2pm input. Firefox independent event logging showed Playwright `fill` itself emits compositionstart, compositionend and input(isComposing=false), so expecting that fill to retain an externally started composition was an invalid harness assumption. A valid synthetic Firefox sequence using the native textarea value setter plus input(isComposing=true) created no worker/result for 700ms, then compositionend created a conversion. Physical IME hardware remains untested.
- Blank partially entered date blocked relative conversion with complete-or-clear guidance; calendar clear recovered. Separate fixed calendar choice October 15 2026 made Tomorrow resolve to October 16 2026 without submit. Completely clearing the committed year segment blocked results; clearing the date recovered. A single Backspace from year2026 becomes the valid explicit year202, so the initial harness assumption that one deleted digit necessarily makes a partial date was corrected.
- Delayed clipboard read (850ms) begun after a user edit remained valid while automatic conversion ran; it imported/converted 6pm without a false conflict. A subsequent user edit while read was pending protected 7pm input and displayed a replacement decision; Replace converted imported 6pm automatically.
- Clipboard write rejection delayed 600ms after a newer edit did not expose obsolete manual-copy text or a notice.
- Exactly one injected Worker-constructor failure displayed edit-to-retry guidance and the next edit converted normally. Separate native worker execution test intercepted its production module once with a throwing module in a serviceWorkers-blocked context: worker onerror displayed edit-to-retry guidance, aria-busy=false, next ordinary edit loaded the real module and converted. Intentionally replaced module requests and clipboard/constructor faults are fault injection, not unexplained normal-use failures.
- Transient sessionStorage update-draft restoration automatically converted 10pm and consumed the handoff key. Single-use IndexedDB shared text automatically converted 11am. This checks handoff restoration semantics; it does not exercise a full waiting-worker activation across incompatible releases.
- Healthy controlled offline state was observed separately: controller http://127.0.0.1:4254/sw.js, registration active=activated, no waiting worker, cache chronoshift-5d54f7de19e36cb0. Chromium context switched offline, reloaded from actual service-worker cache, and fresh 12:34:56.789pm input converted automatically. All normal-use requests stayed on the preview origin, with no console errors or page errors. Normal suite errors array empty.
- Firefox155.0 and WebKit26.6 fresh-context normal typing and immediate-clear smoke passed.

## Actual rendered inspection

Viewed all six full-page captures dark/light at 1280,390,280 widths, actual runtime with UTC target and `12:34:56.789 pm`. Both themes retain the input/result/source/copy hierarchy. Numeric timestamp remained intact; suffix `pm` wrapped as a separate readable line. At280 Copy stacked below result output with clear association; no page overflow, clipping or overlapping control. `Converts as you type` hint fits opposite Paste/Clear. Desktop has two equal panels; narrower sizes stack them. No new visual blocker observed.

Measured CSS pixels (dark and light identical):

| Viewport | Page scroll width | Workspace width | Input/result width | Result height | Time font / time box | Copy dimensions |
| --- | --- | --- | --- | --- | --- | --- |
|1280×900|1280|1072|535 / 535|444.5|56 / 418.969×134.375|55.031×44|
|390×900|390|358|356 / 356|273.594|35.1 / 256.969×84.219|55.031×44|
|280×900|280|248|246 / 246|341.344|32 / 214×76.781|55.031×44|

Full measured x/y/font/overflow data saved in results.json; captures dark-1280.png, dark-390.png, dark-280.png, light-1280.png, light-390.png, light-280.png. Screenshots are actual desktop rendering, not physical-phone evidence.

## Findings and verdicts

Actionable blockers: none in independently exercised feature/lifecycle/visual scope. Harness corrections were display-format defaults, ARIA popover hidden-role lookup, waiting for automatic reprocessing before screenshot measurement, Firefox fill composition semantics, and legal proleptic year after one Backspace. These did not establish product failures.

Implementation verdict: approved within the tested e141 runtime scope. Later unchanged-runtime revision can retain this runtime approval with exact-byte identity; test/tool/docs delta needs its own validation.

Original report-resolution verdict: not applicable (feature request). Demonstrated automatic conversion after typing and all exercised conversion-setting, import and handoff changes; demonstrated edit recovery and latest-owner behavior under the stated bounded faults.

Evidence gaps: physical keyboard/IME/phone, virtual keyboards, installation/OS share sheets, screen readers, actual browser zoom, representative-phone performance, full waiting-update activation/older incompatible tabs, missing/stale assets or damaged caches, real-time installation deadlines, hosted `/ChronoShift/` deployment and exact published source/release metadata were not independently exercised here. Healthy offline cache success is not certification of those failure histories. Existing gates and parent publication verification remain separate evidence.
