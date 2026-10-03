# ChronoShift offline web migration roadmap

Prepared 3 October 2026 from repository commit `b7ef48a`.

**Publication status:** Published to the `tienlam` Linear workspace, **Tien’s Team**, after explicit user authorization. [Initiative I-4](https://linear.app/tienlam/initiative/chronoshift-simple-offline-web-app-d90101850ba1) contains four projects, eight milestones and TIE-292–TIE-321. See [verified identifiers](offline-web-linear-map.json) and [execution evidence](web-execution-report.md).

## Objective and recommended scope

## Objective
Make ChronoShift a browser-based timezone converter that is easy to use on a phone or computer and works offline after its first successful online load. Paste or type text, convert it to your timezone, inspect ambiguous interpretations, and copy the result. No account or conversion server.

## First release
- Natural-language dates/times, explicit offsets and IANA zones, relative dates, ranges, Unix seconds, supported city aliases, and ambiguous abbreviations.
- Device timezone by default with a searchable override; explicit missing-zone/date assumptions; readable day changes.
- Local conversion, bundled parser/data/fonts, installable PWA where supported, cached launch and conversion with networking disabled.
- Accessible responsive interface, copy/paste fallbacks, clear recovery states, reliable updates.
- HTTPS static distribution with reproducible web builds; Android becomes a reference during migration and is retired from active release workflows after web acceptance.

## Scope decisions
Use a TypeScript web implementation and reuse Kotlin behavior/data/test cases as the specification. Recommended baseline: React + Vite + chrono-node, a tested timezone adapter (Temporal with a bundled compatibility path if needed), and a service worker. Confirm versions and bundle cost in the foundation tickets.
ML Kit and the existing LiteRT Android runtime are not browser ports. AI is optional today; ship a deterministic conversion baseline and evaluate browser AI separately in a backlog spike. Never introduce cloud inference as an offline dependency.
Android PROCESS_TEXT has no general web equivalent. Paste is universal; installed share-target reception is a capability-based enhancement with an offline POST handler. Extensions, native wrappers, accounts, sync, persistent conversion history, multilingual expansion, and mandatory AI downloads are outside the first release.

## Delivery gates
1. Contract & browser baseline → tested conversion parity.
2. Usable conversion flow → accessible and clear interaction.
3. Offline-ready installation → safe updates and optional share reception.
4. Cross-browser release candidate → web-primary cutover.

## Success / definition of done
- Supported conversion fixtures assert exact instants, interpretation counts/order, and date rollovers through real parsers; current Kotlin bugs are documented rather than reproduced silently.
- New input can be converted after closing and reopening the cached app with networking disabled.
- No pasted text appears in network requests, server logs, URLs, telemetry, or persistent storage by default.
- Core flow passes mobile/desktop browser and accessibility checks; share/install permissions are not prerequisites to conversion.
- HTTPS release, rollback procedure, documentation and Android cutover are complete.

No dates or assignees are committed until capacity is known. Work is ordered by dependencies, with AI discovery outside the critical path.
Repository reviewed at b7ef48a: https://github.com/Tien-Lam/ChronoShift/tree/b7ef48a

## Findings from the repository

| Existing area | Finding | Web migration action |
| --- | --- | --- |
| App/platform | Single-module Kotlin Android app, Compose/Hilt, PROCESS_TEXT entry; no web scaffold. | TypeScript browser app; replace interface and lifecycle. |
| Fast parsing | chrono-node already runs inside Zipline/QuickJS; committed bundle has no pinned embedded version or maintained entry source. ML Kit supplies spans. | Import a pinned package directly; compare full-text results against the ML Kit-dependent cases. |
| Conversion correctness | Custom date propagation/range ordering, fixed offsets, date-based regional abbreviations, ambiguity and deduplication. Some docs differ from code. | Preserve audited rules with exact fixtures; document intentional corrections. |
| Offline cities | IANA/alias/fuzzy table falls back to Android Geocoder and longitude-based approximation. | Bundle reviewed city data; remove network lookup and silent geographic guessing. |
| Optional AI | Android LiteRT/Gemma with a 2,588,147,712-byte model, manifest/download/settings machinery. | Separate feasibility spike; no mandatory model or cloud inference in launch. |
| Current experience | Input/results layouts, icon actions, device timezone only, parser method labels, forced dark theme. | Visible Convert/Copy, editable input, zone override, assumptions, system theme and accessible layout. |
| Test suite | Extensive corpus and regression cases, but many corpus checks are resilience/synthetic-model checks rather than exact real-parser assertions. | Classify fixtures and establish independent exact expected results. |
| Delivery | Gradle Android CI/APK releases, scheduled model validation and Android Dependabot PRs. | Web CI/HTTPS static release and explicit Android cutover after acceptance. |

No open GitHub issues or existing ChronoShift Linear projects/issues/initiatives were found at review time. Open GitHub PRs are Android/dependency maintenance; cutover must account for them. The initial review did not run Android builds/tests. Subsequent web implementation and verification are recorded in web-execution-report.md.

## Delivery organization

One initiative, four projects, eight milestones, **29 first-release tickets plus 1 optional AI discovery ticket**. Project/issue assignments and target dates are intentionally unset until capacity is known. Priorities express importance; dependencies express execution order. Relative S/M sizing expresses complexity only.

### ChronoShift — Web Conversion Foundations

Build a tested browser conversion engine from the existing parsing rules and corpus.

Port the conversion specification to TypeScript, replace Android-only parser plumbing, and establish exact behavioral fixtures. Preserve correct timezone semantics rather than blindly matching current display bugs. Ship deterministic parsing without requiring ML Kit or an LLM. The separate AI feasibility ticket is optional and does not block first release.

| Milestone | Exit criteria |
| --- | --- |
| Contract & browser baseline | Conversion/UX contract recorded, reproducible web scaffold builds, portable exact fixtures exist, and the timezone adapter works on the target browser matrix. |
| Conversion parity | Real browser parser passes the approved fixture set: date context/ranges/order, fixed offsets vs IANA DST, supported cities and Unix seconds, ambiguity and deduplication. Cancellation and input limits are verified. |

| Ticket | Priority | Complexity | Milestone | Blocked by |
| --- | --- | --- | --- | --- |
| [F1 — Define the web product contract and migration acceptance cases](#f1) | High | M | Contract & browser baseline | None |
| [F2 — Create the TypeScript web scaffold with Bun and mise](#f2) | High | S | Contract & browser baseline | F1 |
| [F3 — Turn Kotlin examples into a portable exact conversion fixture suite](#f3) | High | M | Contract & browser baseline | F1 |
| [F4 — Implement a browser timezone adapter with explicit DST semantics](#f4) | High | M | Contract & browser baseline | F2, F3 |
| [F5 — Replace QuickJS with a maintained browser chrono-node adapter](#f5) | High | M | Conversion parity | F2, F3, F4 |
| [F6 — Port contextual date propagation, range endpoints and source ordering](#f6) | High | M | Conversion parity | F5 |
| [F7 — Port abbreviation resolution and preserve ambiguous timezone interpretations](#f7) | High | M | Conversion parity | F5, F4 |
| [F8 — Port Unix seconds and a deterministic offline city resolver](#f8) | High | M | Conversion parity | F2, F3, F4 |
| [F9 — Port result merging without losing distinct source interpretations](#f9) | High | M | Conversion parity | F6, F7, F8 |
| [F10 — Build a cancellable local conversion pipeline with input limits](#f10) | High | M | Conversion parity | F9 |
| [F11 — Benchmark lightweight temporal span models against the Chrono baseline](#f11) | Low | M | Optional backlog; no release milestone | F2, F3 |

### ChronoShift — Simple Web Experience

Make paste, conversion, interpretation and copying clear on phones and computers.

Deliver one focused responsive page: input, Convert, target timezone, readable results and Copy. Progressive disclosure keeps assumptions and ambiguous interpretations understandable. Preferences remain minimal; honor system theme. UX work can start with fixtures before the engine is complete.

| Milestone | Exit criteria |
| --- | --- |
| Usable conversion flow | The responsive core page converts real input, shows original text and local date/time/zone, makes ambiguous options clear, and provides a searchable timezone override. |
| Accessible, low-friction experience | Copy/paste fallbacks, errors and correction, empty/large-input states, keyboard/screen reader support and a small task-based usability check all pass. |

| Ticket | Priority | Complexity | Milestone | Blocked by |
| --- | --- | --- | --- | --- |
| [U1 — Design the minimal paste → convert → copy interface](#u1) | High | S | Usable conversion flow | None |
| [U2 — Build the responsive conversion page and request state](#u2) | High | M | Usable conversion flow | F2, U1, F10 |
| [U3 — Show clear conversion cards, assumptions, ranges and ambiguity choices](#u3) | High | M | Usable conversion flow | U2 |
| [U4 — Add device timezone default and a searchable target timezone override](#u4) | High | M | Usable conversion flow | U2, F4, F8 |
| [U5 — Implement user-triggered paste and copy with permission fallbacks](#u5) | Medium | S | Accessible, low-friction experience | U3 |
| [U6 — Add helpful no-result, correction and large-input recovery states](#u6) | Medium | S | Accessible, low-friction experience | U3, U4 |
| [U7 — Verify accessibility and first-time task completion](#u7) | High | M | Accessible, low-friction experience | U4, U5, U6 |

### ChronoShift — Offline PWA

Support cached offline launch and conversion, installation, safe updates and share reception.

Cache the complete deterministic app and required assets; verify readiness before claiming offline availability. Preferences are local and recoverable. Installation and share reception are capability-based conveniences. Handle cache eviction, storage denial and updates without losing the current input.

| Milestone | Exit criteria |
| --- | --- |
| Offline-ready PWA | App shell/parser/data are cached, readiness is accurate, the app reopens and converts fresh input without networking, preferences survive normal restarts, and installation works where supported. |
| Safe updates & offline entry points | Version updates cannot mix incompatible assets or erase active input; supported installed share targets work offline through POST, and offline/storage/upgrade regressions are covered. |

| Ticket | Priority | Complexity | Milestone | Blocked by |
| --- | --- | --- | --- | --- |
| [P1 — Precache the complete app and verify offline readiness](#p1) | High | M | Offline-ready PWA | F2, F10 |
| [P2 — Add a PWA manifest and unobtrusive install guidance](#p2) | Medium | S | Offline-ready PWA | P1, U2 |
| [P3 — Persist minimal preferences and recover from unavailable browser storage](#p3) | Medium | S | Offline-ready PWA | P1, U4 |
| [P4 — Implement safe service-worker upgrades without losing active input](#p4) | High | M | Safe updates & offline entry points | P1, P3, U2 |
| [P5 — Receive shared text in supported installed browsers with an offline fallback](#p5) | Medium | M | Safe updates & offline entry points | P2, P3, U2 |
| [P6 — Automate offline restart, update, storage and share regression checks](#p6) | High | M | Safe updates & offline entry points | P3, P4, P5, U5 |

### ChronoShift — Web Delivery & Android Cutover

Validate, release and document the web app, then retire active Android delivery.

Establish reproducible Bun/mise web CI, assert cross-browser correctness and performance, audit local-only data handling, and publish HTTPS static assets with rollback. Preserve Android source/history and existing APKs as migration references until web release gates pass; then make web the primary supported app.

| Milestone | Exit criteria |
| --- | --- |
| Web release candidate | Web CI, exact browser acceptance, offline checks, accessibility evidence, performance budgets and privacy audit pass with no unresolved conversion correctness defects. |
| Web becomes the primary app | HTTPS production release and rollback are proven, usage/developer docs describe the web product, and Android release/model/dependency workflows are retired without deleting history. |

| Ticket | Priority | Complexity | Milestone | Blocked by |
| --- | --- | --- | --- | --- |
| [D1 — Add reproducible web CI and browser test gates](#d1) | High | M | Web release candidate | F2, F3 |
| [D2 — Verify exact conversion behavior across desktop and mobile browsers](#d2) | High | M | Web release candidate | F10, U7, P6, D1 |
| [D3 — Measure startup and conversion performance on a representative phone](#d3) | Medium | M | Web release candidate | F10, U2, P1 |
| [D4 — Audit local-only text handling and production web security](#d4) | High | M | Web release candidate | U6, P5, P4, D1 |
| [D5 — Release the static web app over HTTPS with an exercised rollback](#d5) | High | M | Web becomes the primary app | D2, D3, D4 |
| [D6 — Make the web app primary and retire active Android delivery](#d6) | High | M | Web becomes the primary app | D5 |

## Recommended start and critical dependencies

Start **F1** (contract) and **U1** (interaction design). Then establish **F2–F4** (scaffold, fixtures, timezone adapter), followed by **F5–F10** (real parser, context/ambiguity/cities, merge and pipeline). CI (**D1**) begins once the scaffold and fixtures exist. The usable UI and offline caching follow the engine baseline and can proceed alongside each other. Clipboard/recovery/accessibility and update/share/storage checks converge in **D2–D4**, which gate the HTTPS release **D5**. **D6** makes the web product primary only after the release is verified. **F11** can begin after F2/F3 to benchmark lightweight temporal span tagging; it remains optional and has no downstream release dependency.

## Browser constraints informing the plan

- Service workers cache the app for a later disconnected session; all required assets must be available before showing offline-ready. First-ever disconnected access cannot download the app. [MDN offline operation](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation).
- Installed share-target reception has limited browser support; POST can be handled by a service worker for offline receipt. Universal interaction remains paste. [MDN share_target](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Manifest/Reference/share_target).
- Clipboard permission and user-activation behavior differs by browser, so direct paste/manual copy are necessary fallbacks. [MDN Clipboard API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API).
- Temporal has limited availability in the reviewed documentation; a tested bundled compatibility path is required if it is chosen. [MDN Temporal](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Temporal).
- Browser storage is subject to quota, denial and eviction; a persistence request does not make caches permanently guaranteed. [MDN storage](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
- chrono-node exposes reference-date/timezone parsing and result components that can be consumed directly in a browser build. [chrono-node documentation](https://github.com/wanasit/chrono).

## Lightweight ML research follow-up

The [research brief](lightweight-browser-ml-research.md) recommends learned temporal span detection followed by Chrono and deterministic timezone conversion. GLiNER-bi-edge is the first pretrained benchmark candidate; a task-trained BERT-tiny model is the proposed small-download path. Neither has been tested against ChronoShift yet. F11 now defines that experiment and can start after F2/F3.

## Detailed ticket drafts

<a id="f1"></a>

### F1 — Define the web product contract and migration acceptance cases

Project: **ChronoShift — Web Conversion Foundations**. Milestone: **Contract & browser baseline**. Initial status: **Todo**.

#### Problem
The existing Android interaction and parser assumptions need an explicit web contract before a rewrite.

#### Scope
- Record paste/type → Convert → Copy as the primary flow, device target timezone plus override, no account/backend and English-first support.
- Define reference date/zone, missing-zone/date assumptions, date-only output, source ordering and range behavior.
- Set the supported browser/OS matrix: desktop Chrome/Edge/Firefox/Safari, Android Chrome and iOS Safari at tested supported versions. Record install/share capability separately.
- Audit code/doc mismatches: CT/ET/PT use date-based IANA rules in code; date-only data currently defaults to noon; corpus resilience is not an exact parity oracle; city Geocoder is not an offline guarantee.

#### Acceptance criteria
- [ ] Versioned contract lists launch features, optional features and deferred scope.
- [ ] Examples cover ambiguous CST, explicit EST in summer, PT/ET with a date, missing timezone, date-only, midnight rollover and DST gaps/folds.
- [ ] Offline means a successful online load and completed cache preparation before a later offline reopen; first-ever disconnected visit and user-cleared site storage are explained.
- [ ] Acceptance and capability matrix is linked from every workstream; no mandatory AI download.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: None

#### Repository evidence
- [README.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/README.md)
- [docs/architecture/merge-philosophy.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/docs/architecture/merge-philosophy.md)
- [app/src/main/java/com/chronoshift/nlp/TimezoneAbbreviations.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/TimezoneAbbreviations.kt)
- [app/src/main/java/com/chronoshift/nlp/ChronoResultParser.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/ChronoResultParser.kt)
- [app/src/test/java/com/chronoshift/TimestampCorpusTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/TimestampCorpusTest.kt)

<a id="f2"></a>

### F2 — Create the TypeScript web scaffold with Bun and mise

Project: **ChronoShift — Web Conversion Foundations**. Milestone: **Contract & browser baseline**. Initial status: **Backlog**.

#### Problem
The repository has no maintained web source, package lockfile or browser build.

#### Scope
- Create a web workspace with React, Vite and TypeScript as the recommended minimal baseline; confirm fit and pin versions.
- Manage CLI/runtime versions with mise, packages/scripts with Bun and a committed lockfile.
- Separate pure conversion modules from UI/platform adapters; provide dev/build/typecheck/test scripts and a short architecture decision.

#### Acceptance criteria
- [ ] A fresh checkout installs reproducibly and produces static assets without an Android SDK.
- [ ] Production build has no conversion backend or runtime CDN imports.
- [ ] UI and pure engine tests can run independently; source maps and public asset policy are explicit.

#### Delivery
- Priority: High
- Relative complexity: S (S = small, M = medium; not a time commitment)
- Dependencies: F1

#### Repository evidence
- [app/build.gradle.kts](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/build.gradle.kts)
- [settings.gradle.kts](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/settings.gradle.kts)
- [docs/developer/building.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/docs/developer/building.md)

<a id="f3"></a>

### F3 — Turn Kotlin examples into a portable exact conversion fixture suite

Project: **ChronoShift — Web Conversion Foundations**. Milestone: **Contract & browser baseline**. Initial status: **Backlog**.

#### Problem
Existing corpus tests mix resilience checks and synthetic LLM outputs; they do not all prove real parser correctness.

#### Scope
- Extract reusable corpus/integration/ambiguity/merge/adversarial cases into versioned JSON fixtures with fixed clock, source zone, target zone and locale.
- Classify deterministic launch cases, ML Kit-dependent cases, AI-only cases and known defects.
- Assert exact instants, source spans, interpretation count/order, endpoints, date rollovers and displayed assumptions; use the actual parser adapter.
- Record justified behavior changes instead of automatically approving snapshots.

#### Acceptance criteria
- [ ] All cases in TestData.kt are inventoried and categorized; launch subset and expected values are explicit.
- [ ] Expected instants are independently reviewed, not derived from the implementation under test.
- [ ] DST, half/quarter-hour offsets, leap-day, missing zone/date, multiline context and duplicate/cross-date cases are included.
- [ ] AI fixtures remain evidence for the optional spike and cannot conceal deterministic baseline gaps.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F1

#### Repository evidence
- [app/src/test/java/com/chronoshift/TestData.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/TestData.kt)
- [app/src/test/java/com/chronoshift/TimestampCorpusTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/TimestampCorpusTest.kt)
- [app/src/test/java/com/chronoshift/IntegrationTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/IntegrationTest.kt)
- [app/src/test/java/com/chronoshift/AmbiguityExpansionTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/AmbiguityExpansionTest.kt)
- [app/src/test/java/com/chronoshift/nlp/ChronoResultParserMergeTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/nlp/ChronoResultParserMergeTest.kt)
- [app/src/test/java/com/chronoshift/AdversarialInputTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/AdversarialInputTest.kt)

<a id="f4"></a>

### F4 — Implement a browser timezone adapter with explicit DST semantics

Project: **ChronoShift — Web Conversion Foundations**. Milestone: **Contract & browser baseline**. Initial status: **Backlog**.

#### Problem
Kotlinx/java.time conversion and Java zone discovery are unavailable in the browser; fixed offsets must not be confused with regional zones.

#### Scope
- Define domain types for instant, civil date/time, source zone/offset, certainty, matched span, assumptions and optional range endpoints.
- Evaluate Temporal with a locally bundled compatibility path; confirm Intl zone support offline and choose a pinned fallback data policy if needed.
- Inject reference clock, source/default zone, target zone and locale; separate raw fixed-offset labels from geographic IANA labels.
- Specify DST nonexistent/repeated civil-time behavior and allow clear correction or distinct interpretations per contract.

#### Acceptance criteria
- [ ] Exact DST gap/fold, seasonal PT vs fixed PST/EST, +05:45, +09:30 and negative fractional offset cases pass.
- [ ] An offset alone does not falsely identify a specific city; supplied IANA context is preserved.
- [ ] Output timezone offsets are computed at the parsed instant; missing source zone is explicitly reported.
- [ ] Supported browser matrix has a tested feature/fallback path, with no online timezone lookup.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F2, F3

#### Repository evidence
- [app/src/main/java/com/chronoshift/conversion/ExtractedTime.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/conversion/ExtractedTime.kt)
- [app/src/main/java/com/chronoshift/conversion/TimeConverter.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/conversion/TimeConverter.kt)
- [app/src/main/java/com/chronoshift/nlp/TimezoneAbbreviations.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/TimezoneAbbreviations.kt)

<a id="f5"></a>

### F5 — Replace QuickJS with a maintained browser chrono-node adapter

Project: **ChronoShift — Web Conversion Foundations**. Milestone: **Conversion parity**. Initial status: **Backlog**.

#### Problem
Chrono is already JavaScript, but the committed minified Android bundle is unversioned and its bridge is not maintained as normal web source.

#### Scope
- Import a pinned chrono-node package and expose a small typed adapter with injected reference date/timezone.
- Replace Zipline JSON evaluation with typed parser results while preserving spans, certainty, offset and both range endpoints.
- Evaluate full-text parsing and focused parsing against ML Kit-dependent fixtures; add a lightweight span strategy only if measured gaps justify it.

#### Acceptance criteria
- [ ] Real chrono-node integration tests assert supported natural-language, ISO/offset and contextual examples.
- [ ] No QuickJS/Zipline or opaque copied Android bundle is required by the browser.
- [ ] ML Kit removal has a documented accuracy comparison and all launch-critical gaps have a deterministic solution or contract change.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F2, F3, F4

#### Repository evidence
- [app/src/main/java/com/chronoshift/nlp/ChronoExtractor.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/ChronoExtractor.kt)
- [app/src/main/java/com/chronoshift/nlp/MlKitEntityExtractor.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/MlKitEntityExtractor.kt)
- [docs/developer/chrono-js-bundling.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/docs/developer/chrono-js-bundling.md)
- [app/src/main/assets/chrono.js](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/assets/chrono.js)

<a id="f6"></a>

### F6 — Port contextual date propagation, range endpoints and source ordering

Project: **ChronoShift — Web Conversion Foundations**. Milestone: **Conversion parity**. Initial status: **Backlog**.

#### Problem
Chrono results need project-specific context handling to avoid wrong dates and reordered range endpoints.

#### Scope
- Port certainty-aware date propagation and contextual span/full-result reconciliation.
- Preserve textual result ordering and endpoint identity, including overnight ranges.
- Represent date-only matches explicitly instead of presenting an invented noon time; filter contextual-only date fragments when real time matches exist.

#### Acceptance criteria
- [ ] Fixtures assert both endpoints and source order for normal, reversed-token and overnight ranges.
- [ ] Uncertain dates inherit only the relevant context; separate explicit dates remain distinct.
- [ ] Date-only display follows the contract and no synthetic time appears as a parsed certainty.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F5

#### Repository evidence
- [app/src/main/java/com/chronoshift/nlp/ChronoResultParser.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/ChronoResultParser.kt)
- [app/src/test/java/com/chronoshift/nlp/ChronoResultParserMergeTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/nlp/ChronoResultParserMergeTest.kt)
- [app/src/test/java/com/chronoshift/IntegrationTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/IntegrationTest.kt)

<a id="f7"></a>

### F7 — Port abbreviation resolution and preserve ambiguous timezone interpretations

Project: **ChronoShift — Web Conversion Foundations**. Milestone: **Conversion parity**. Initial status: **Backlog**.

#### Problem
Abbreviations like CST are ambiguous, while explicit standard/daylight offsets and colloquial regional abbreviations have different semantics.

#### Scope
- Port the reviewed supported abbreviation data and ambiguity expansion.
- Preserve explicit EST/PST/etc fixed offsets; resolve ET/PT/CT/MT using regional rules for the event date.
- Expose distinct valid interpretations and assumption metadata for the UI rather than silently choosing one.

#### Acceptance criteria
- [ ] CST produces the supported US Central and China interpretations without silent collapse.
- [ ] PT/ET winter/summer and explicit EST/PST in summer yield exact expected instants.
- [ ] Abbreviation recognition avoids lowercase ordinary-word false positives and unsupported abbreviations have a clear fallback.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F5, F4

#### Repository evidence
- [app/src/main/java/com/chronoshift/nlp/TimezoneAbbreviations.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/TimezoneAbbreviations.kt)
- [app/src/test/java/com/chronoshift/AmbiguityExpansionTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/AmbiguityExpansionTest.kt)
- [app/src/test/java/com/chronoshift/nlp/TimezoneAbbreviationsTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/nlp/TimezoneAbbreviationsTest.kt)

<a id="f8"></a>

### F8 — Port Unix seconds and a deterministic offline city resolver

Project: **ChronoShift — Web Conversion Foundations**. Milestone: **Conversion parity**. Initial status: **Backlog**.

#### Problem
Unix/city extraction is Kotlin and the Android Geocoder fallback can use services or approximate a zone incorrectly.

#### Scope
- Port supported Unix seconds semantics and document the current 2015–2035/range assumptions; do not silently add millisecond parsing.
- Bundle a curated city/alias → IANA table and reviewed deterministic fuzzy matching.
- Use explicit unknown/ambiguous-city handling; remove network geocoding and longitude-based zone guessing.
- Resolve city-local reference dates with the injected clock.

#### Acceptance criteria
- [ ] Unix fixtures cover supported boundaries, invalid values and ordinary-number false positives.
- [ ] NYC/Tokyo/Melbourne and aliases work with all network requests blocked.
- [ ] Unknown/ambiguous cities prompt correction rather than guess from coordinates; fuzzy matching has deterministic tie behavior.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F2, F3, F4

#### Repository evidence
- [app/src/main/java/com/chronoshift/nlp/RegexExtractor.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/RegexExtractor.kt)
- [app/src/main/java/com/chronoshift/nlp/CityResolver.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/CityResolver.kt)
- [app/src/test/java/com/chronoshift/nlp/IanaCityLookupTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/nlp/IanaCityLookupTest.kt)
- [app/src/test/java/com/chronoshift/nlp/RegexExtractorTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/nlp/RegexExtractorTest.kt)

<a id="f9"></a>

### F9 — Port result merging without losing distinct source interpretations

Project: **ChronoShift — Web Conversion Foundations**. Milestone: **Conversion parity**. Initial status: **Backlog**.

#### Problem
Deduplication must reduce repeats without hiding timezone ambiguity or merging different dates.

#### Scope
- Port exact instant+source-zone merging, context upgrades and stable source ordering.
- Keep different instants, dates and meaningful source-zone interpretations distinct; audit fuzzy and final display dedup against the documented philosophy.
- Keep parser method/confidence metadata internal unless it explains a user-visible assumption.

#### Acceptance criteria
- [ ] Actual parser fixtures verify true duplicates merge and different instants/source zones/dates survive.
- [ ] Null-zone upgrades preserve the right source span and assumptions.
- [ ] Repeated mentions and range endpoints have explicit identity rules; formatting cannot collapse distinct interpretations.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F6, F7, F8

#### Repository evidence
- [app/src/main/java/com/chronoshift/nlp/ResultMerger.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/ResultMerger.kt)
- [app/src/main/java/com/chronoshift/conversion/TimeConverter.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/conversion/TimeConverter.kt)
- [docs/architecture/merge-philosophy.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/docs/architecture/merge-philosophy.md)
- [app/src/test/java/com/chronoshift/nlp/ResultMergerTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/nlp/ResultMergerTest.kt)

<a id="f10"></a>

### F10 — Build a cancellable local conversion pipeline with input limits

Project: **ChronoShift — Web Conversion Foundations**. Milestone: **Conversion parity**. Initial status: **Backlog**.

#### Problem
The Android streaming Flow and ViewModel cancellation need a browser equivalent that cannot display results for an old request.

#### Scope
- Compose deterministic parsing, merging, ambiguity expansion and conversion behind one typed API.
- Use a dedicated Web Worker if profiling justifies it; keep a request ID/cancellation boundary and separate worker errors from no-result cases.
- Preserve the 10,000-character limit with a clear error; bound expensive work and result count per contract.

#### Acceptance criteria
- [ ] Clear, edit and rapid repeated Convert actions never resurrect stale results.
- [ ] Worker/runtime failure is recoverable and an unsupported background stage cannot block deterministic results.
- [ ] Real end-to-end fixture suite and 10,000/10,001-character tests pass with network disabled.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F9

#### Repository evidence
- [app/src/main/java/com/chronoshift/nlp/TieredTimeExtractor.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/TieredTimeExtractor.kt)
- [app/src/main/java/com/chronoshift/ui/main/MainViewModel.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/main/MainViewModel.kt)
- [app/src/test/java/com/chronoshift/nlp/PipelineConcurrencyTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/nlp/PipelineConcurrencyTest.kt)
- [app/src/test/java/com/chronoshift/AdversarialInputTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/AdversarialInputTest.kt)

<a id="f11"></a>

### F11 — Benchmark lightweight temporal span models against the Chrono baseline

Project: **ChronoShift — Web Conversion Foundations**. Milestone: **None (optional backlog)**. Initial status: **Backlog**.

#### Problem
The Android ML Kit detector needs a browser replacement, and the existing large LiteRT generative model is a poor default download fit. Research favors learned span detection followed by deterministic parsing; actual accuracy and browser export viability remain unmeasured.

#### Scope
- Benchmark knowledgator/gliner-bi-edge-v2.0 as a pretrained custom-label detector; test fixed label embeddings and a local ONNX/WASM export rather than assume generic NER pipeline support.
- Compare real Chrono-only results with hybrid detection on independently reviewed held-out messages; preserve full-text parsing and ambiguity rules.
- Evaluate a task-trained prajjwal1/bert-tiny temporal tagger only if ML provides measurable benefit; include DATE/TIME/TIMEZONE/CITY annotation and contextual linking costs.
- Measure actual model, tokenizer, runtime and worker bytes; phone cold/warm latency, memory, offline cache behavior and long-message windows; compare FP32 and INT8 predictions.
- Recommend defer, opt-in prototype or follow-up training/delivery tickets. Keep the benchmark outside all launch gates.

#### Acceptance criteria
- [ ] Written comparison records exact end-to-end conversions, spans, ambiguity/order/ranges, errors and held-out split design; synthetic AI response fixtures are not treated as actual model accuracy.
- [ ] GLiNER-bi-edge export/browser feasibility and artifact size are verified or failure evidence is recorded; published Python/H100/LiteRT results are not presented as browser benchmarks.
- [ ] BERT-tiny recommendation distinguishes untrained base model, required training work and estimated size from actual measured artifacts; provisional model+tokenizer target is under 20 MB.
- [ ] Any proposed deployment keeps conversion local, uses a tested WASM fallback and cached local assets, avoids truncating long input and does not require an AI download for baseline conversion.
- [ ] No first-release ticket is blocked by this optional benchmark.

#### Delivery
- Priority: Low
- Relative complexity: M (not a time commitment)
- Dependencies: F2, F3
- Optional backlog discovery; outside all first-release milestones and release gates.

#### Research
Recommendation: temporal span tagging + Chrono + deterministic timezone conversion. Start with GLiNER-bi-edge; consider a trained BERT-tiny model for a smaller production download. Research only; no model benchmarks completed yet.
- https://huggingface.co/knowledgator/gliner-bi-edge-v2.0
- https://huggingface.co/prajjwal1/bert-tiny
- https://onnxruntime.ai/docs/tutorials/web/

#### Repository evidence
- [model-manifest.json](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/model-manifest.json)
- [app/src/main/java/com/chronoshift/nlp/LiteRtExtractor.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/LiteRtExtractor.kt)
- [app/src/main/java/com/chronoshift/nlp/LlmResultParser.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/LlmResultParser.kt)
- [app/src/test/java/com/chronoshift/nlp/AiExtractionFixtures.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/nlp/AiExtractionFixtures.kt)
- [docs/developer/on-device-llm.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/docs/developer/on-device-llm.md)

<a id="u1"></a>

### U1 — Design the minimal paste → convert → copy interface

Project: **ChronoShift — Simple Web Experience**. Milestone: **Usable conversion flow**. Initial status: **Todo**.

#### Problem
The Android two-layout/icon-heavy design needs a web interaction designed for discoverability and small screens.

#### Scope
- Create reviewable phone/desktop sketches with a labeled input, visible Convert, example text, target timezone and simple result cards.
- Keep input easy to edit when results appear; show date/day changes and assumptions near the result.
- Specify empty, ambiguous, no-result, loading, offline-ready and update states; honor system theme.

#### Acceptance criteria
- [ ] A first-time user can identify where to paste, how to convert and how to copy without instructions.
- [ ] Prototype covers one timestamp, CST alternatives, a range, a long pasted message and date-only input.
- [ ] Core conversion is available without visiting settings, installing the app or enabling AI.

#### Delivery
- Priority: High
- Relative complexity: S (S = small, M = medium; not a time commitment)
- Dependencies: None

#### Repository evidence
- [app/src/main/java/com/chronoshift/ui/main/MainScreen.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/main/MainScreen.kt)
- [app/src/main/java/com/chronoshift/ui/components/TimeResultCard.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/components/TimeResultCard.kt)

<a id="u2"></a>

### U2 — Build the responsive conversion page and request state

Project: **ChronoShift — Simple Web Experience**. Milestone: **Usable conversion flow**. Initial status: **Backlog**.

#### Problem
The web app needs a focused entry point wired to the tested engine.

#### Scope
- Implement labeled multiline input, examples, Convert, Clear and result region.
- Wire request/cancellation state to F10; preserve editable input with results.
- Support mobile keyboards and a documented keyboard shortcut without stealing normal textarea Enter.

#### Acceptance criteria
- [ ] Paste/type → Convert renders real engine results on phone and desktop.
- [ ] Clear/reconvert handles pending work consistently and no stale results appear.
- [ ] Layout works at 320 CSS pixels and 200% zoom with long input.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F2, U1, F10

#### Repository evidence
- [app/src/main/java/com/chronoshift/ui/main/MainScreen.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/main/MainScreen.kt)
- [app/src/main/java/com/chronoshift/ui/main/MainViewModel.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/main/MainViewModel.kt)
- [app/src/main/java/com/chronoshift/ui/main/MainUiState.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/main/MainUiState.kt)

<a id="u3"></a>

### U3 — Show clear conversion cards, assumptions, ranges and ambiguity choices

Project: **ChronoShift — Simple Web Experience**. Milestone: **Usable conversion flow**. Initial status: **Backlog**.

#### Problem
Correct results still need to explain which source time/zone was interpreted and whether the local date changed.

#### Scope
- Display original matched text, prominent target time, target date/zone/offset and concise source context.
- Group ambiguous alternatives by source match without hiding options; show assumption/correction controls progressively.
- Label endpoints/date-only results accurately and keep engine method badges out of the main flow.

#### Acceptance criteria
- [ ] User can distinguish CST alternatives and identify the correct one before copying.
- [ ] Missing-zone/date assumptions are visible; date rollover and range endpoints are unambiguous.
- [ ] Fixed offsets never imply an unsupported city, and each visible result is traceable to its source span.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: U2

#### Repository evidence
- [app/src/main/java/com/chronoshift/ui/components/TimeResultCard.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/components/TimeResultCard.kt)
- [app/src/main/java/com/chronoshift/conversion/ConvertedTime.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/conversion/ConvertedTime.kt)
- [docs/architecture/merge-philosophy.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/docs/architecture/merge-philosophy.md)

<a id="u4"></a>

### U4 — Add device timezone default and a searchable target timezone override

Project: **ChronoShift — Simple Web Experience**. Milestone: **Usable conversion flow**. Initial status: **Backlog**.

#### Problem
The Android app converts only to the device timezone; web users need an easy visible default and correction.

#### Scope
- Detect the device IANA timezone with a safe explicit fallback.
- Provide a searchable city/IANA zone selector and minimal locale/12–24-hour preference.
- Apply target-zone changes immediately to existing results; use explicit controls to correct source-zone or reference-date assumptions without overwriting explicit parsed values.

#### Acceptance criteria
- [ ] Default zone is visible, unknown detection leads to a usable selector, and device-zone changes are handled.
- [ ] Selector works offline with keyboard/screen reader and includes supported city aliases.
- [ ] Changing target zone changes formatting/conversion without reparsing or losing source interpretations.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: U2, F4, F8

#### Repository evidence
- [app/src/main/java/com/chronoshift/conversion/TimeConverter.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/conversion/TimeConverter.kt)
- [app/src/main/java/com/chronoshift/nlp/CityResolver.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/CityResolver.kt)
- [app/src/main/java/com/chronoshift/ui/settings/SettingsScreen.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/settings/SettingsScreen.kt)

<a id="u5"></a>

### U5 — Implement user-triggered paste and copy with permission fallbacks

Project: **ChronoShift — Simple Web Experience**. Milestone: **Accessible, low-friction experience**. Initial status: **Backlog**.

#### Problem
Browser clipboard APIs can be unavailable or denied; ordinary keyboard/manual copy must remain usable.

#### Scope
- Add optional Paste and per-result Copy, with plain text including date, target zone and relevant ambiguity context.
- Read clipboard only on explicit user action; show success/failure feedback.
- Offer manual select/copy and ordinary paste instructions when browser APIs are unsupported or denied.

#### Acceptance criteria
- [ ] Allowed and denied clipboard flows both complete without blocking conversion.
- [ ] No clipboard reads occur on page load, focus or timers.
- [ ] Copied output identifies the selected interpretation and includes rollover/range context.

#### Delivery
- Priority: Medium
- Relative complexity: S (S = small, M = medium; not a time commitment)
- Dependencies: U3

#### Repository evidence
- [app/src/main/java/com/chronoshift/ui/main/MainScreen.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/main/MainScreen.kt)
- [app/src/main/java/com/chronoshift/ui/components/TimeResultCard.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/components/TimeResultCard.kt)

<a id="u6"></a>

### U6 — Add helpful no-result, correction and large-input recovery states

Project: **ChronoShift — Simple Web Experience**. Milestone: **Accessible, low-friction experience**. Initial status: **Backlog**.

#### Problem
The current UI mainly shows raw errors or no_timestamp; web users need a useful next step.

#### Scope
- Write clear messages for empty/no timestamp, invalid source zone, DST conflict, input limit and runtime failure.
- Keep input intact and provide examples or editable assumptions with a direct retry action.
- Render pasted text as text, tolerate long/multiline messages and avoid jumpy layouts.

#### Acceptance criteria
- [ ] No-result state explains how to try again without erasing the message.
- [ ] 10,001-character input reports the limit immediately and supports editing.
- [ ] Malformed/untrusted text cannot render HTML; source corrections do not replace explicit offsets silently.

#### Delivery
- Priority: Medium
- Relative complexity: S (S = small, M = medium; not a time commitment)
- Dependencies: U3, U4

#### Repository evidence
- [app/src/main/java/com/chronoshift/ui/main/MainViewModel.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/main/MainViewModel.kt)
- [app/src/test/java/com/chronoshift/AdversarialInputTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/AdversarialInputTest.kt)
- [app/src/main/res/values/strings.xml](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/res/values/strings.xml)

<a id="u7"></a>

### U7 — Verify accessibility and first-time task completion

Project: **ChronoShift — Simple Web Experience**. Milestone: **Accessible, low-friction experience**. Initial status: **Backlog**.

#### Problem
Simple use needs observable keyboard, screen reader and mobile evidence.

#### Scope
- Check WCAG 2.2 AA-relevant contrast, focus order, labels, announcements, touch targets, reduced motion and system light/dark.
- Run automated checks plus manual keyboard/screen-reader and mobile review.
- Run a small task-based check: paste meeting text, choose a CST interpretation, change target timezone, copy and reopen offline; document evidence and fix blocking friction.

#### Acceptance criteria
- [ ] All core tasks work with keyboard alone and a screen reader; results/errors are announced once appropriately.
- [ ] 320px, 200% zoom, long text and reduced-motion states remain usable.
- [ ] Task-check findings and resolved issues are recorded; no critical accessibility or discoverability defect remains.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: U4, U5, U6

#### Repository evidence
- [app/src/main/java/com/chronoshift/ui/main/MainScreen.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/main/MainScreen.kt)
- [app/src/main/java/com/chronoshift/ui/theme/Theme.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/theme/Theme.kt)

<a id="p1"></a>

### P1 — Precache the complete app and verify offline readiness

Project: **ChronoShift — Offline PWA**. Milestone: **Offline-ready PWA**. Initial status: **Backlog**.

#### Problem
A web shell that loads while online is insufficient: every conversion dependency must be available after offline restart.

#### Scope
- Add a service worker and versioned precache for HTML, JS, worker, CSS, icons, fonts and required parser/zone/city data.
- Use navigation fallback for supported entry URLs; avoid runtime CDN fonts, online geocoding and conversion fetches.
- Report offline-ready only after cache preparation succeeds; handle unsupported service workers, partial install and fresh offline visit honestly.

#### Acceptance criteria
- [ ] Warm online once, wait for readiness, close the app, disable network, reopen and convert newly entered text.
- [ ] Network-blocked conversion needs no uncached module/font/data or model.
- [ ] Incomplete cache/download never reports ready; hosting scope/base-path tests pass.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F2, F10

#### Repository evidence
- [README.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/README.md)
- [docs/architecture/nlp-pipeline.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/docs/architecture/nlp-pipeline.md)

<a id="p2"></a>

### P2 — Add a PWA manifest and unobtrusive install guidance

Project: **ChronoShift — Offline PWA**. Milestone: **Offline-ready PWA**. Initial status: **Backlog**.

#### Problem
Users should be able to keep the converter on a home screen or desktop without making installation mandatory.

#### Scope
- Provide name, icons, stable app ID, start URL/scope, standalone display and theme metadata.
- Capability-detect install prompting and provide browser-specific manual guidance where appropriate.
- Test normal browser and installed modes on Android, iOS and desktop.

#### Acceptance criteria
- [ ] Manifest/start URL/icon validation passes and installed launch reaches the converter offline.
- [ ] Install guidance appears only when relevant and can be dismissed.
- [ ] Unsupported installation does not remove normal browser conversion or show a dead button.

#### Delivery
- Priority: Medium
- Relative complexity: S (S = small, M = medium; not a time commitment)
- Dependencies: P1, U2

#### Repository evidence
- [app/src/main/res/drawable/ic_launcher_foreground.xml](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/res/drawable/ic_launcher_foreground.xml)
- [app/src/main/AndroidManifest.xml](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/AndroidManifest.xml)

<a id="p3"></a>

### P3 — Persist minimal preferences and recover from unavailable browser storage

Project: **ChronoShift — Offline PWA**. Milestone: **Offline-ready PWA**. Initial status: **Backlog**.

#### Problem
Browser storage can be denied, full, cleared or evicted; conversion must still work with defaults.

#### Scope
- Persist only target-zone/time-format/theme preferences in a small versioned local store; use IndexedDB only where shared service-worker handoff needs it.
- Default input/results to in-memory data; provide reset preferences and safe schema migration.
- Catch storage failures and use a clear fallback. Offline cache readiness should respond accurately to missing resources; persistence requests cannot guarantee storage forever.

#### Acceptance criteria
- [ ] Preferences survive normal browser/installed restarts and migration from an old schema.
- [ ] Storage denial/quota/clear scenarios leave usable defaults and no crash.
- [ ] Pasted text and conversion history are not persisted by default; reset removes app preferences.

#### Delivery
- Priority: Medium
- Relative complexity: S (S = small, M = medium; not a time commitment)
- Dependencies: P1, U4

#### Repository evidence
- [app/src/main/java/com/chronoshift/ui/settings/SettingsScreen.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/settings/SettingsScreen.kt)
- [app/src/main/java/com/chronoshift/ui/settings/SettingsViewModel.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/settings/SettingsViewModel.kt)

<a id="p4"></a>

### P4 — Implement safe service-worker upgrades without losing active input

Project: **ChronoShift — Offline PWA**. Milestone: **Safe updates & offline entry points**. Initial status: **Backlog**.

#### Problem
Uncontrolled service-worker activation can mix assets or force reloads while the user is editing.

#### Scope
- Version caches atomically and preserve the last working version when a new install is incomplete.
- Notify of an available update with an explicit reload action; preserve active input through that action only using a bounded temporary handoff cleared immediately after restore.
- Define compatible message/storage contracts across tabs and remove obsolete caches after successful activation; document rollback behavior.

#### Acceptance criteria
- [ ] Interrupted update leaves the old app operational offline.
- [ ] Old tab/new tab and two successive releases do not mix incompatible parser/worker assets.
- [ ] Accepting an update restores current input and clears temporary text; dismissing preserves the current session.
- [ ] Rollback and obsolete-cache cleanup are exercised without deleting preferences.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: P1, P3, U2

#### Repository evidence
- [.github/workflows/release.yml](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/.github/workflows/release.yml)
- [app/src/main/java/com/chronoshift/ui/main/MainUiState.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/main/MainUiState.kt)

<a id="p5"></a>

### P5 — Receive shared text in supported installed browsers with an offline fallback

Project: **ChronoShift — Offline PWA**. Milestone: **Safe updates & offline entry points**. Initial status: **Backlog**.

#### Problem
Android PROCESS_TEXT cannot be recreated everywhere by a web page; supported installed share targets can reduce copy/paste friction.

#### Scope
- Add capability-based manifest share_target using POST and a service-worker fetch handler.
- Hand title/text/url safely to the input page without network processing; consume and immediately clear any temporary IndexedDB handoff.
- Enforce origin/type/size checks, treat incoming values as untrusted text, never auto-fetch shared URLs.
- Keep ordinary paste as the documented path on unsupported browsers; extension/native context-menu integration is deferred.

#### Acceptance criteria
- [ ] Installed supported browser shares text while offline and opens a usable input/result flow.
- [ ] Shared message does not appear in request query strings, server logs or persistent history.
- [ ] Unsupported browser and invalid/oversized payload scenarios have a clear paste/correction path.

#### Delivery
- Priority: Medium
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: P2, P3, U2

#### Repository evidence
- [app/src/main/java/com/chronoshift/ProcessTextActivity.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ProcessTextActivity.kt)
- [app/src/main/AndroidManifest.xml](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/AndroidManifest.xml)

<a id="p6"></a>

### P6 — Automate offline restart, update, storage and share regression checks

Project: **ChronoShift — Offline PWA**. Milestone: **Safe updates & offline entry points**. Initial status: **Backlog**.

#### Problem
Online happy-path tests do not prove offline durability or capability fallbacks.

#### Scope
- Create browser scenarios for first online preparation, cached close/reopen offline, new input, preference restart, deep-link navigation and denied clipboard.
- Cover incomplete caching, cleared/denied storage, version N→N+1, multi-tab and supported POST share target; complement automation with real-device checks.
- Capture unexpected network requests and distinguish permitted online asset/update loading from forbidden conversion/text transmission.

#### Acceptance criteria
- [ ] Offline scenarios convert newly typed text with all network routes blocked.
- [ ] Upgrade/storage scenarios preserve usable behavior and readiness is truthful.
- [ ] Share/clipboard fallbacks have recorded browser capability coverage.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: P3, P4, P5, U5

#### Repository evidence
- [docs/developer/device-smoke-test.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/docs/developer/device-smoke-test.md)
- [app/src/test/java/com/chronoshift/EndToEndTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/EndToEndTest.kt)

<a id="d1"></a>

### D1 — Add reproducible web CI and browser test gates

Project: **ChronoShift — Web Delivery & Android Cutover**. Milestone: **Web release candidate**. Initial status: **Backlog**.

#### Problem
Current CI builds/lints/tests Android only.

#### Scope
- Add mise-managed developer tools, Bun frozen-lock install, typecheck, formatting/lint as appropriate, engine fixtures and production build.
- Run meaningful browser integration/offline tests as they land, with failures publishing readable diagnostics.
- Keep existing Android checks during the migration and document required web gates.

#### Acceptance criteria
- [ ] Fresh CI build succeeds without relying on a local package cache or unpinned tool versions.
- [ ] Exact conversion failures and browser/offline regressions fail the web gate.
- [ ] Build/test artifacts contain no user input or secrets and commands are documented.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F2, F3

#### Repository evidence
- [.github/workflows/test.yml](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/.github/workflows/test.yml)
- [docs/developer/testing.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/docs/developer/testing.md)

<a id="d2"></a>

### D2 — Verify exact conversion behavior across desktop and mobile browsers

Project: **ChronoShift — Web Delivery & Android Cutover**. Milestone: **Web release candidate**. Initial status: **Backlog**.

#### Problem
JavaScript date/zone behavior and browser API capabilities vary; Android tests alone cannot certify the web release.

#### Scope
- Run exact launch fixtures on Chromium, Firefox and WebKit and record real Android Chrome/iOS Safari evidence.
- Check DST transitions, device-zone differences, non-English display locales, 12/24-hour format, date rollover and explicit offset labels.
- Maintain a feature matrix for conversion, caching, install, clipboard and share; log intentional changes from Android and resolve all correctness gaps.

#### Acceptance criteria
- [ ] Every launch-critical fixture passes or has an explicitly approved contract change with independent expected values.
- [ ] Real mobile cached offline restart, timezone selection and copying are verified.
- [ ] There are no open correctness defects that silently change an instant or hide ambiguity.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F10, U7, P6, D1

#### Repository evidence
- [app/src/test/java/com/chronoshift/IntegrationTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/IntegrationTest.kt)
- [app/src/test/java/com/chronoshift/TimestampCorpusTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/TimestampCorpusTest.kt)
- [app/src/test/java/com/chronoshift/conversion/TimeConverterTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/conversion/TimeConverterTest.kt)
- [docs/developer/device-smoke-test.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/docs/developer/device-smoke-test.md)

<a id="d3"></a>

### D3 — Measure startup and conversion performance on a representative phone

Project: **ChronoShift — Web Delivery & Android Cutover**. Milestone: **Web release candidate**. Initial status: **Backlog**.

#### Problem
Porting parser/data/UI can create a slow first launch or block typing on phones.

#### Scope
- Establish and record device/test conditions and provisional budgets: <500 KiB compressed initial assets, p95 <250 ms for typical ≤2,000-character conversions and <1 s at the 10,000-character limit.
- Measure production cold online and warm offline startup, long-input responsiveness and result rendering.
- Trim unused locales/assets, split only assets that still become offline-ready and move expensive parsing to a worker if justified; revise budgets only with measured rationale.

#### Acceptance criteria
- [ ] Benchmark report includes bundle breakdown and reproducible p95 measurements.
- [ ] Typical flow meets the agreed budgets and worst-case input does not freeze editing/clear controls.
- [ ] Performance optimization preserves exact fixtures and offline readiness.

#### Delivery
- Priority: Medium
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F10, U2, P1

#### Repository evidence
- [app/src/main/java/com/chronoshift/nlp/TieredTimeExtractor.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/TieredTimeExtractor.kt)
- [app/src/test/java/com/chronoshift/AdversarialInputTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/AdversarialInputTest.kt)

<a id="d4"></a>

### D4 — Audit local-only text handling and production web security

Project: **ChronoShift — Web Delivery & Android Cutover**. Milestone: **Web release candidate**. Initial status: **Backlog**.

#### Problem
A static app can still leak pasted text through logging, URLs, share handling, analytics or external dependencies.

#### Scope
- Audit request/log/storage/URL paths with distinctive test text; keep conversions client-side and persistent history off by default.
- Render input only as text, bound incoming data, avoid fetching arbitrary shared URLs and configure a compatible CSP/security header policy.
- Review static asset dependencies/licenses and remove external runtime fonts/scripts and unnecessary telemetry.
- Verify temporary share/update handoffs expire and clear; normal conversion is independent of storage or permissions.

#### Acceptance criteria
- [ ] Request interception and storage/log inspection find no pasted test text outside approved temporary local handoff.
- [ ] Injection payloads cannot execute or generate arbitrary external requests.
- [ ] CSP works with required workers/service workers; offline and exact fixtures still pass.
- [ ] Privacy behavior is accurately documented in plain language.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: U6, P5, P4, D1

#### Repository evidence
- [app/src/main/java/com/chronoshift/nlp/ChronoResultParser.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/ChronoResultParser.kt)
- [app/src/main/java/com/chronoshift/conversion/TimeConverter.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/conversion/TimeConverter.kt)
- [app/src/main/res/xml/network_security_config.xml](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/res/xml/network_security_config.xml)

<a id="d5"></a>

### D5 — Release the static web app over HTTPS with an exercised rollback

Project: **ChronoShift — Web Delivery & Android Cutover**. Milestone: **Web becomes the primary app**. Initial status: **Backlog**.

#### Problem
APK releases must be replaced with a stable HTTPS origin suitable for service workers.

#### Scope
- Choose the static hosting target/domain and base path during implementation; document ownership and cost.
- Build preview/release deployment with correct MIME, scope, headers and cache policy; no conversion server required.
- Release only after candidate gates pass, retain immutable release artifacts and exercise N→N+1 update/rollback on the deployed origin.
- Document readiness, first online load and installation behavior.

#### Acceptance criteria
- [ ] Production HTTPS URL works in browser and installed modes; new input converts after offline restart.
- [ ] Deployment checks catch bad base paths, mixed-content/CDN dependencies and incorrect service-worker caching.
- [ ] Rollback restores a known working release with existing-client update behavior verified.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: D2, D3, D4

#### Repository evidence
- [.github/workflows/release.yml](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/.github/workflows/release.yml)
- [README.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/README.md)

<a id="d6"></a>

### D6 — Make the web app primary and retire active Android delivery

Project: **ChronoShift — Web Delivery & Android Cutover**. Milestone: **Web becomes the primary app**. Initial status: **Backlog**.

#### Problem
Keeping Android release instructions and automated model maintenance active after cutover would confuse users and maintainers.

#### Scope
- Rewrite README, contributor/agent instructions, build/test/architecture docs and release notes around the web product.
- Explain the paste/share transition, supported browser capability differences and optional AI decision.
- After accepted web release, remove or disable active APK/model-manifest/device-eval automation and Gradle-only dependency update configuration; resolve existing Android Dependabot PRs appropriately.
- Preserve Android source in an explicit legacy location/ref and existing APK releases; document that there is no conversion-history database to migrate after checking actual settings.

#### Acceptance criteria
- [ ] README leads with the web URL, offline setup and web development commands; no active instructions direct users to build/sideload for normal use.
- [ ] Default CI/releases/dependency maintenance target web and obsolete Android/model automation no longer runs.
- [ ] Legacy source/releases remain discoverable and no historical artifact is destroyed.
- [ ] Final acceptance checklist links browser/offline/usability/privacy evidence.

#### Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: D5

#### Repository evidence
- [README.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/README.md)
- [CLAUDE.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/CLAUDE.md)
- [AGENTS.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/AGENTS.md)
- [.github/workflows/release.yml](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/.github/workflows/release.yml)
- [.github/workflows/model-manifest.yml](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/.github/workflows/model-manifest.yml)
- [.github/dependabot.yml](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/.github/dependabot.yml)
- [docs/developer/building.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/docs/developer/building.md)

## Prepared publication payload

[`offline-web-roadmap.linear.json`](offline-web-roadmap.linear.json) preserves the approved scope and planning keys. The initiative, projects, milestones, tickets and dependencies have been published and verified; real IDs and URLs are in [`offline-web-linear-map.json`](offline-web-linear-map.json). Current implementation evidence and remaining release gates are in [`web-execution-report.md`](web-execution-report.md).

Execution follow-up: [TIE-322 — Triage retained Android conversion tests](https://linear.app/tienlam/issue/TIE-322/triage-the-110-failures-in-retained-android-conversion-tests) records 110 failures out of 855 tests after the obsolete SDK setup package was fixed. It belongs to the delivery project/release-candidate milestone and blocks Android cutover pending triage. The original 30-ticket plan is preserved; there are now 31 tickets including this discovered follow-up.
