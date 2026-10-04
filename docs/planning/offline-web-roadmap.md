# ChronoShift offline web roadmap

The user explicitly retired native Android support. Remove the active native source/tooling now; cancel TIE-322 and retain independent web fixtures plus historical provenance. Remaining web acceptance does not require native support.

This is the current scope. Historical source references use the immutable original review commit; they do not require those files in the active tree. Actual Linear identifiers and states are recorded in offline-web-linear-map.json.

## Objective
Make ChronoShift a browser-based timezone converter that is easy to use on a phone or computer and works offline after its first successful online load. Paste or type text, convert it to your timezone, inspect ambiguous interpretations, and copy the result. No account or conversion server.

## First release
- Natural-language dates/times, explicit offsets and IANA zones, relative dates, ranges, Unix seconds, supported city aliases, and ambiguous abbreviations.
- Device timezone by default with a searchable override; explicit missing-zone/date assumptions; readable day changes.
- Local conversion, bundled parser/data/fonts, installable PWA where supported, cached launch and conversion with networking disabled.
- Accessible responsive interface, copy/paste fallbacks, clear recovery states, reliable updates.
- GitHub Pages static distribution with reproducible web builds. Native app maintenance is retired at the user's explicit request; retain standalone web fixtures and historical Git provenance.

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
- HTTPS release, rollback, web-only documentation and browser acceptance are complete.

No dates or assignees are committed until capacity is known. Work is ordered by dependencies, with AI discovery outside the critical path.
Repository reviewed at b7ef48a: https://github.com/Tien-Lam/ChronoShift/tree/b7ef48a

## Scope update — 4 October 2026
The user explicitly retired native Android support. Remove the active native source/tooling now; cancel TIE-322 and retain independent web fixtures plus historical provenance. Remaining web acceptance does not require native support.

## Delivery organization

One initiative, four projects, eight milestones, 30 web tickets and one canceled native-triage follow-up. Physical browser acceptance, accessibility and phone performance remain web tasks.

### ChronoShift — Web Conversion Foundations

Port the conversion specification to TypeScript, replace Android-only parser plumbing, and establish exact behavioral fixtures. Preserve correct timezone semantics rather than blindly matching current display bugs. Ship deterministic parsing without requiring ML Kit or an LLM. The separate AI feasibility ticket is optional and does not block first release.

| Milestone | Exit criteria |
| --- | --- |
| Contract & browser baseline | Conversion/UX contract recorded, reproducible web scaffold builds, portable exact fixtures exist, and the timezone adapter works on the target browser matrix. |
| Conversion parity | Real browser parser passes the approved fixture set: date context/ranges/order, fixed offsets vs IANA DST, supported cities and Unix seconds, ambiguity and deduplication. Cancellation and input limits are verified. |

### ChronoShift — Simple Web Experience

Deliver one focused responsive page: input, Convert, target timezone, readable results and Copy. Progressive disclosure keeps assumptions and ambiguous interpretations understandable. Preferences remain minimal; honor system theme. UX work can start with fixtures before the engine is complete.

| Milestone | Exit criteria |
| --- | --- |
| Usable conversion flow | The responsive core page converts real input, shows original text and local date/time/zone, makes ambiguous options clear, and provides a searchable timezone override. |
| Accessible, low-friction experience | Copy/paste fallbacks, errors and correction, empty/large-input states, keyboard/screen reader support and a small task-based usability check all pass. |

### ChronoShift — Offline PWA

Cache the complete deterministic app and required assets; verify readiness before claiming offline availability. Preferences are local and recoverable. Installation and share reception are capability-based conveniences. Handle cache eviction, storage denial and updates without losing the current input.

| Milestone | Exit criteria |
| --- | --- |
| Offline-ready PWA | App shell/parser/data are cached, readiness is accurate, the app reopens and converts fresh input without networking, preferences survive normal restarts, and installation works where supported. |
| Safe updates & offline entry points | Version updates cannot mix incompatible assets or erase active input; supported installed share targets work offline through POST, and offline/storage/upgrade regressions are covered. |

### ChronoShift — Web Delivery

Reproducible Bun/mise web CI, exact browser correctness and performance, local-only data handling, and GitHub Pages publishing/rollback. Native app maintenance is retired at the user's request; historical commits and standalone web fixtures remain. Physical browser acceptance stays separate.

| Milestone | Exit criteria |
| --- | --- |
| Web release candidate | Web CI, exact browser acceptance, offline checks, accessibility evidence, performance budgets and privacy audit pass with no unresolved conversion correctness defects. |
| Web-only delivery | Web-only source, build, publishing, dependencies and documentation; native maintenance retired with historical provenance preserved. |

## Tickets

<a id="f1"></a>

### F1 — [Define the web product contract and migration acceptance cases](https://linear.app/tienlam/issue/TIE-292/define-the-web-product-contract-and-migration-acceptance-cases)

State: **Done**. Project: **ChronoShift — Web Conversion Foundations**.

## Problem
The existing Android interaction and parser assumptions need an explicit web contract before a rewrite.

## Scope
- Record paste/type → Convert → Copy as the primary flow, device target timezone plus override, no account/backend and English-first support.
- Define reference date/zone, missing-zone/date assumptions, date-only output, source ordering and range behavior.
- Set the supported browser/OS matrix: desktop Chrome/Edge/Firefox/Safari, Android Chrome and iOS Safari at tested supported versions. Record install/share capability separately.
- Audit code/doc mismatches: CT/ET/PT use date-based IANA rules in code; date-only data currently defaults to noon; corpus resilience is not an exact parity oracle; city Geocoder is not an offline guarantee.

## Acceptance criteria
- [ ] Versioned contract lists launch features, optional features and deferred scope.
- [ ] Examples cover ambiguous CST, explicit EST in summer, PT/ET with a date, missing timezone, date-only, midnight rollover and DST gaps/folds.
- [ ] Offline means a successful online load and completed cache preparation before a later offline reopen; first-ever disconnected visit and user-cleared site storage are explained.
- [ ] Acceptance and capability matrix is linked from every workstream; no mandatory AI download.

## Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: None

## Repository evidence
- [README.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/README.md)
- [docs/architecture/merge-philosophy.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/docs/architecture/merge-philosophy.md)
- [app/src/main/java/com/chronoshift/nlp/TimezoneAbbreviations.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/TimezoneAbbreviations.kt)
- [app/src/main/java/com/chronoshift/nlp/ChronoResultParser.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/ChronoResultParser.kt)
- [app/src/test/java/com/chronoshift/TimestampCorpusTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/TimestampCorpusTest.kt)

<a id="f2"></a>

### F2 — [Create the TypeScript web scaffold with Bun and mise](https://linear.app/tienlam/issue/TIE-293/create-the-typescript-web-scaffold-with-bun-and-mise)

State: **In Review**. Project: **ChronoShift — Web Conversion Foundations**.

## Problem
The repository has no maintained web source, package lockfile or browser build.

## Scope
- Create a web workspace with React, Vite and TypeScript as the recommended minimal baseline; confirm fit and pin versions.
- Manage CLI/runtime versions with mise, packages/scripts with Bun and a committed lockfile.
- Separate pure conversion modules from UI/platform adapters; provide dev/build/typecheck/test scripts and a short architecture decision.

## Acceptance criteria
- [ ] A fresh checkout installs reproducibly and produces static assets without an Android SDK.
- [ ] Production build has no conversion backend or runtime CDN imports.
- [ ] UI and pure engine tests can run independently; source maps and public asset policy are explicit.

## Delivery
- Priority: High
- Relative complexity: S (S = small, M = medium; not a time commitment)
- Dependencies: F1

## Repository evidence
- [app/build.gradle.kts](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/build.gradle.kts)
- [settings.gradle.kts](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/settings.gradle.kts)
- [docs/developer/building.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/docs/developer/building.md)

<a id="f3"></a>

### F3 — [Maintain independent web fixtures and a standalone conversion corpus](https://linear.app/tienlam/issue/TIE-294/maintain-independent-web-fixtures-and-a-standalone-conversion-corpus)

State: **In Review**. Project: **ChronoShift — Web Conversion Foundations**.

## Problem
Web correctness needs independently specified exact expectations and a self-contained input inventory.

## Scope
- Maintain standalone versioned JSON fixtures with explicit clock, source zone, target zone and locale.
- Retain all 353 original input cases/metadata and immutable Git provenance; no native source import/build is required.
- Assert exact instants, interpretations, ranges, date rollovers and assumptions through the actual browser parser.
- Maintain the deterministic corpus audit directly; document intentional changes and unsupported inputs.

## Acceptance criteria
- [ ] All 353 historical inputs and metadata are retained unchanged as standalone web data.
- [ ] Exact temporal expectations are independently reviewed rather than derived from the implementation.
- [ ] DST, fractional offsets, leap dates, missing zones/dates, multiline context and duplicate/cross-date cases are covered.
- [ ] Optional learned extraction cannot conceal deterministic baseline gaps.

## Delivery
- Dependencies: F1
- State: In Review

<a id="f4"></a>

### F4 — [Implement a browser timezone adapter with explicit DST semantics](https://linear.app/tienlam/issue/TIE-295/implement-a-browser-timezone-adapter-with-explicit-dst-semantics)

State: **In Review**. Project: **ChronoShift — Web Conversion Foundations**.

## Problem
Kotlinx/java.time conversion and Java zone discovery are unavailable in the browser; fixed offsets must not be confused with regional zones.

## Scope
- Define domain types for instant, civil date/time, source zone/offset, certainty, matched span, assumptions and optional range endpoints.
- Evaluate Temporal with a locally bundled compatibility path; confirm Intl zone support offline and choose a pinned fallback data policy if needed.
- Inject reference clock, source/default zone, target zone and locale; separate raw fixed-offset labels from geographic IANA labels.
- Specify DST nonexistent/repeated civil-time behavior and allow clear correction or distinct interpretations per contract.

## Acceptance criteria
- [ ] Exact DST gap/fold, seasonal PT vs fixed PST/EST, +05:45, +09:30 and negative fractional offset cases pass.
- [ ] An offset alone does not falsely identify a specific city; supplied IANA context is preserved.
- [ ] Output timezone offsets are computed at the parsed instant; missing source zone is explicitly reported.
- [ ] Supported browser matrix has a tested feature/fallback path, with no online timezone lookup.

## Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F2, F3

## Repository evidence
- [app/src/main/java/com/chronoshift/conversion/ExtractedTime.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/conversion/ExtractedTime.kt)
- [app/src/main/java/com/chronoshift/conversion/TimeConverter.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/conversion/TimeConverter.kt)
- [app/src/main/java/com/chronoshift/nlp/TimezoneAbbreviations.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/TimezoneAbbreviations.kt)

<a id="f5"></a>

### F5 — [Maintain the typed browser chrono-node adapter](https://linear.app/tienlam/issue/TIE-296/maintain-the-typed-browser-chrono-node-adapter)

State: **In Review**. Project: **ChronoShift — Web Conversion Foundations**.

## Problem
Chrono is already JavaScript, but the committed minified Android bundle is unversioned and its bridge is not maintained as normal web source.

## Scope
- Use pinned chrono-node with a typed adapter and injected reference date/timezone.
- Preserve spans, certainty, offsets and both range endpoints in typed results.
- Evaluate independent temporal fixtures and the standalone corpus; optional learned span detection requires measured web accuracy/size/latency justification.

## Acceptance criteria
- [ ] Real chrono-node integration tests assert supported natural-language, ISO/offset and context cases.
- [ ] No native bridge or copied runtime bundle is required.
- [ ] Supported web launch behavior has independent exact expectations; unsupported vague expressions require correction.

## Delivery
- Dependencies: F2, F3, F4
- State: In Review

<a id="f6"></a>

### F6 — [Port contextual date propagation, range endpoints and source ordering](https://linear.app/tienlam/issue/TIE-297/port-contextual-date-propagation-range-endpoints-and-source-ordering)

State: **In Review**. Project: **ChronoShift — Web Conversion Foundations**.

## Problem
Chrono results need project-specific context handling to avoid wrong dates and reordered range endpoints.

## Scope
- Port certainty-aware date propagation and contextual span/full-result reconciliation.
- Preserve textual result ordering and endpoint identity, including overnight ranges.
- Represent date-only matches explicitly instead of presenting an invented noon time; filter contextual-only date fragments when real time matches exist.

## Acceptance criteria
- [ ] Fixtures assert both endpoints and source order for normal, reversed-token and overnight ranges.
- [ ] Uncertain dates inherit only the relevant context; separate explicit dates remain distinct.
- [ ] Date-only display follows the contract and no synthetic time appears as a parsed certainty.

## Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F5

## Repository evidence
- [app/src/main/java/com/chronoshift/nlp/ChronoResultParser.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/ChronoResultParser.kt)
- [app/src/test/java/com/chronoshift/nlp/ChronoResultParserMergeTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/nlp/ChronoResultParserMergeTest.kt)
- [app/src/test/java/com/chronoshift/IntegrationTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/IntegrationTest.kt)

<a id="f7"></a>

### F7 — [Port abbreviation resolution and preserve ambiguous timezone interpretations](https://linear.app/tienlam/issue/TIE-298/port-abbreviation-resolution-and-preserve-ambiguous-timezone)

State: **In Review**. Project: **ChronoShift — Web Conversion Foundations**.

## Problem
Abbreviations like CST are ambiguous, while explicit standard/daylight offsets and colloquial regional abbreviations have different semantics.

## Scope
- Port the reviewed supported abbreviation data and ambiguity expansion.
- Preserve explicit EST/PST/etc fixed offsets; resolve ET/PT/CT/MT using regional rules for the event date.
- Expose distinct valid interpretations and assumption metadata for the UI rather than silently choosing one.

## Acceptance criteria
- [ ] CST produces the supported US Central and China interpretations without silent collapse.
- [ ] PT/ET winter/summer and explicit EST/PST in summer yield exact expected instants.
- [ ] Abbreviation recognition avoids lowercase ordinary-word false positives and unsupported abbreviations have a clear fallback.

## Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F5, F4

## Repository evidence
- [app/src/main/java/com/chronoshift/nlp/TimezoneAbbreviations.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/TimezoneAbbreviations.kt)
- [app/src/test/java/com/chronoshift/AmbiguityExpansionTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/AmbiguityExpansionTest.kt)
- [app/src/test/java/com/chronoshift/nlp/TimezoneAbbreviationsTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/nlp/TimezoneAbbreviationsTest.kt)

<a id="f8"></a>

### F8 — [Port Unix seconds and a deterministic offline city resolver](https://linear.app/tienlam/issue/TIE-299/port-unix-seconds-and-a-deterministic-offline-city-resolver)

State: **In Review**. Project: **ChronoShift — Web Conversion Foundations**.

## Problem
Unix/city extraction is Kotlin and the Android Geocoder fallback can use services or approximate a zone incorrectly.

## Scope
- Port supported Unix seconds semantics and document the current 2015–2035/range assumptions; do not silently add millisecond parsing.
- Bundle a curated city/alias → IANA table and reviewed deterministic fuzzy matching.
- Use explicit unknown/ambiguous-city handling; remove network geocoding and longitude-based zone guessing.
- Resolve city-local reference dates with the injected clock.

## Acceptance criteria
- [ ] Unix fixtures cover supported boundaries, invalid values and ordinary-number false positives.
- [ ] NYC/Tokyo/Melbourne and aliases work with all network requests blocked.
- [ ] Unknown/ambiguous cities prompt correction rather than guess from coordinates; fuzzy matching has deterministic tie behavior.

## Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F2, F3, F4

## Repository evidence
- [app/src/main/java/com/chronoshift/nlp/RegexExtractor.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/RegexExtractor.kt)
- [app/src/main/java/com/chronoshift/nlp/CityResolver.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/CityResolver.kt)
- [app/src/test/java/com/chronoshift/nlp/IanaCityLookupTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/nlp/IanaCityLookupTest.kt)
- [app/src/test/java/com/chronoshift/nlp/RegexExtractorTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/nlp/RegexExtractorTest.kt)

<a id="f9"></a>

### F9 — [Port result merging without losing distinct source interpretations](https://linear.app/tienlam/issue/TIE-300/port-result-merging-without-losing-distinct-source-interpretations)

State: **In Review**. Project: **ChronoShift — Web Conversion Foundations**.

## Problem
Deduplication must reduce repeats without hiding timezone ambiguity or merging different dates.

## Scope
- Port exact instant+source-zone merging, context upgrades and stable source ordering.
- Keep different instants, dates and meaningful source-zone interpretations distinct; audit fuzzy and final display dedup against the documented philosophy.
- Keep parser method/confidence metadata internal unless it explains a user-visible assumption.

## Acceptance criteria
- [ ] Actual parser fixtures verify true duplicates merge and different instants/source zones/dates survive.
- [ ] Null-zone upgrades preserve the right source span and assumptions.
- [ ] Repeated mentions and range endpoints have explicit identity rules; formatting cannot collapse distinct interpretations.

## Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F6, F7, F8

## Repository evidence
- [app/src/main/java/com/chronoshift/nlp/ResultMerger.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/ResultMerger.kt)
- [app/src/main/java/com/chronoshift/conversion/TimeConverter.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/conversion/TimeConverter.kt)
- [docs/architecture/merge-philosophy.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/docs/architecture/merge-philosophy.md)
- [app/src/test/java/com/chronoshift/nlp/ResultMergerTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/nlp/ResultMergerTest.kt)

<a id="f10"></a>

### F10 — [Build a cancellable local conversion pipeline with input limits](https://linear.app/tienlam/issue/TIE-301/build-a-cancellable-local-conversion-pipeline-with-input-limits)

State: **In Review**. Project: **ChronoShift — Web Conversion Foundations**.

## Problem
The Android streaming Flow and ViewModel cancellation need a browser equivalent that cannot display results for an old request.

## Scope
- Compose deterministic parsing, merging, ambiguity expansion and conversion behind one typed API.
- Use a dedicated Web Worker if profiling justifies it; keep a request ID/cancellation boundary and separate worker errors from no-result cases.
- Preserve the 10,000-character limit with a clear error; bound expensive work and result count per contract.

## Acceptance criteria
- [ ] Clear, edit and rapid repeated Convert actions never resurrect stale results.
- [ ] Worker/runtime failure is recoverable and an unsupported background stage cannot block deterministic results.
- [ ] Real end-to-end fixture suite and 10,000/10,001-character tests pass with network disabled.

## Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F9

## Repository evidence
- [app/src/main/java/com/chronoshift/nlp/TieredTimeExtractor.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/TieredTimeExtractor.kt)
- [app/src/main/java/com/chronoshift/ui/main/MainViewModel.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/main/MainViewModel.kt)
- [app/src/test/java/com/chronoshift/nlp/PipelineConcurrencyTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/nlp/PipelineConcurrencyTest.kt)
- [app/src/test/java/com/chronoshift/AdversarialInputTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/AdversarialInputTest.kt)

<a id="f11"></a>

### F11 — [Benchmark lightweight temporal span models against the Chrono baseline](https://linear.app/tienlam/issue/TIE-302/benchmark-lightweight-temporal-span-models-against-the-chrono-baseline)

State: **Backlog**. Project: **ChronoShift — Web Conversion Foundations**.

## Problem
The Android ML Kit detector needs a browser replacement, and the existing large LiteRT generative model is a poor default download fit. Research favors learned span detection followed by deterministic parsing; actual accuracy and browser export viability remain unmeasured.

## Scope
- Benchmark knowledgator/gliner-bi-edge-v2.0 as a pretrained custom-label detector; test fixed label embeddings and a local ONNX/WASM export rather than assume generic NER pipeline support.
- Compare real Chrono-only results with hybrid detection on independently reviewed held-out messages; preserve full-text parsing and ambiguity rules.
- Evaluate a task-trained prajjwal1/bert-tiny temporal tagger only if ML provides measurable benefit; include DATE/TIME/TIMEZONE/CITY annotation and contextual linking costs.
- Measure actual model, tokenizer, runtime and worker bytes; phone cold/warm latency, memory, offline cache behavior and long-message windows; compare FP32 and INT8 predictions.
- Recommend defer, opt-in prototype or follow-up training/delivery tickets. Keep the benchmark outside all launch gates.

## Acceptance criteria
- [ ] Written comparison records exact end-to-end conversions, spans, ambiguity/order/ranges, errors and held-out split design; synthetic AI response fixtures are not treated as actual model accuracy.
- [ ] GLiNER-bi-edge export/browser feasibility and artifact size are verified or failure evidence is recorded; published Python/H100/LiteRT results are not presented as browser benchmarks.
- [ ] BERT-tiny recommendation distinguishes untrained base model, required training work and estimated size from actual measured artifacts; provisional model+tokenizer target is under 20 MB.
- [ ] Any proposed deployment keeps conversion local, uses a tested WASM fallback and cached local assets, avoids truncating long input and does not require an AI download for baseline conversion.
- [ ] No first-release ticket is blocked by this optional benchmark.

## Delivery
- Priority: Low
- Relative complexity: M (not a time commitment)
- Dependencies: F2, F3
- Optional backlog discovery; outside all first-release milestones and release gates.

## Research
Recommendation: temporal span tagging + Chrono + deterministic timezone conversion. Start with GLiNER-bi-edge; consider a trained BERT-tiny model for a smaller production download. Research only; no model benchmarks completed yet.
- https://huggingface.co/knowledgator/gliner-bi-edge-v2.0
- https://huggingface.co/prajjwal1/bert-tiny
- https://onnxruntime.ai/docs/tutorials/web/

## Repository evidence
- [model-manifest.json](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/model-manifest.json)
- [app/src/main/java/com/chronoshift/nlp/LiteRtExtractor.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/LiteRtExtractor.kt)
- [app/src/main/java/com/chronoshift/nlp/LlmResultParser.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/LlmResultParser.kt)
- [app/src/test/java/com/chronoshift/nlp/AiExtractionFixtures.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/nlp/AiExtractionFixtures.kt)
- [docs/developer/on-device-llm.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/docs/developer/on-device-llm.md)

<a id="u1"></a>

### U1 — [Design the minimal paste → convert → copy interface](https://linear.app/tienlam/issue/TIE-303/design-the-minimal-paste-convert-copy-interface)

State: **Done**. Project: **ChronoShift — Simple Web Experience**.

## Problem
The Android two-layout/icon-heavy design needs a web interaction designed for discoverability and small screens.

## Scope
- Create reviewable phone/desktop sketches with a labeled input, visible Convert, example text, target timezone and simple result cards.
- Keep input easy to edit when results appear; show date/day changes and assumptions near the result.
- Specify empty, ambiguous, no-result, loading, offline-ready and update states; honor system theme.

## Acceptance criteria
- [ ] A first-time user can identify where to paste, how to convert and how to copy without instructions.
- [ ] Prototype covers one timestamp, CST alternatives, a range, a long pasted message and date-only input.
- [ ] Core conversion is available without visiting settings, installing the app or enabling AI.

## Delivery
- Priority: High
- Relative complexity: S (S = small, M = medium; not a time commitment)
- Dependencies: None

## Repository evidence
- [app/src/main/java/com/chronoshift/ui/main/MainScreen.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/main/MainScreen.kt)
- [app/src/main/java/com/chronoshift/ui/components/TimeResultCard.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/components/TimeResultCard.kt)

<a id="u2"></a>

### U2 — [Build the adaptive conversion page for desktop, mobile and foldables](https://linear.app/tienlam/issue/TIE-304/build-the-adaptive-conversion-page-for-desktop-mobile-and-foldables)

State: **In Progress**. Project: **ChronoShift — Simple Web Experience**.

## Problem
The web app needs a focused entry point wired to the tested engine.

## Scope
- Implement labeled multiline input, examples, Convert, Clear and result region.
- Wire request/cancellation state to F10; preserve editable input with results.
- Support mobile keyboards and a documented keyboard shortcut without stealing normal textarea Enter.

## Acceptance criteria
- [ ] Paste/type → Convert renders real engine results on phone and desktop.
- [ ] Clear/reconvert handles pending work consistently and no stale results appear.
- [ ] Layout works at 320 CSS pixels and 200% zoom with long input.

## Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F2, U1, F10

## Repository evidence
- [app/src/main/java/com/chronoshift/ui/main/MainScreen.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/main/MainScreen.kt)
- [app/src/main/java/com/chronoshift/ui/main/MainViewModel.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/main/MainViewModel.kt)
- [app/src/main/java/com/chronoshift/ui/main/MainUiState.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/main/MainUiState.kt)

<a id="u3"></a>

### U3 — [Show clear conversion cards, assumptions, ranges and ambiguity choices](https://linear.app/tienlam/issue/TIE-305/show-clear-conversion-cards-assumptions-ranges-and-ambiguity-choices)

State: **In Review**. Project: **ChronoShift — Simple Web Experience**.

## Problem
Correct results still need to explain which source time/zone was interpreted and whether the local date changed.

## Scope
- Display original matched text, prominent target time, target date/zone/offset and concise source context.
- Group ambiguous alternatives by source match without hiding options; show assumption/correction controls progressively.
- Label endpoints/date-only results accurately and keep engine method badges out of the main flow.

## Acceptance criteria
- [ ] User can distinguish CST alternatives and identify the correct one before copying.
- [ ] Missing-zone/date assumptions are visible; date rollover and range endpoints are unambiguous.
- [ ] Fixed offsets never imply an unsupported city, and each visible result is traceable to its source span.

## Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: U2

## Repository evidence
- [app/src/main/java/com/chronoshift/ui/components/TimeResultCard.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/components/TimeResultCard.kt)
- [app/src/main/java/com/chronoshift/conversion/ConvertedTime.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/conversion/ConvertedTime.kt)
- [docs/architecture/merge-philosophy.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/docs/architecture/merge-philosophy.md)

<a id="u4"></a>

### U4 — [Add device timezone default and a searchable target timezone override](https://linear.app/tienlam/issue/TIE-306/add-device-timezone-default-and-a-searchable-target-timezone-override)

State: **In Review**. Project: **ChronoShift — Simple Web Experience**.

## Problem
The Android app converts only to the device timezone; web users need an easy visible default and correction.

## Scope
- Detect the device IANA timezone with a safe explicit fallback.
- Provide a searchable city/IANA zone selector and minimal locale/12–24-hour preference.
- Apply target-zone changes immediately to existing results; use explicit controls to correct source-zone or reference-date assumptions without overwriting explicit parsed values.

## Acceptance criteria
- [ ] Default zone is visible, unknown detection leads to a usable selector, and device-zone changes are handled.
- [ ] Selector works offline with keyboard/screen reader and includes supported city aliases.
- [ ] Changing target zone changes formatting/conversion without reparsing or losing source interpretations.

## Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: U2, F4, F8

## Repository evidence
- [app/src/main/java/com/chronoshift/conversion/TimeConverter.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/conversion/TimeConverter.kt)
- [app/src/main/java/com/chronoshift/nlp/CityResolver.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/CityResolver.kt)
- [app/src/main/java/com/chronoshift/ui/settings/SettingsScreen.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/settings/SettingsScreen.kt)

<a id="u5"></a>

### U5 — [Implement user-triggered paste and copy with permission fallbacks](https://linear.app/tienlam/issue/TIE-307/implement-user-triggered-paste-and-copy-with-permission-fallbacks)

State: **In Review**. Project: **ChronoShift — Simple Web Experience**.

## Problem
Browser clipboard APIs can be unavailable or denied; ordinary keyboard/manual copy must remain usable.

## Scope
- Add optional Paste and per-result Copy, with plain text including date, target zone and relevant ambiguity context.
- Read clipboard only on explicit user action; show success/failure feedback.
- Offer manual select/copy and ordinary paste instructions when browser APIs are unsupported or denied.

## Acceptance criteria
- [ ] Allowed and denied clipboard flows both complete without blocking conversion.
- [ ] No clipboard reads occur on page load, focus or timers.
- [ ] Copied output identifies the selected interpretation and includes rollover/range context.

## Delivery
- Priority: Medium
- Relative complexity: S (S = small, M = medium; not a time commitment)
- Dependencies: U3

## Repository evidence
- [app/src/main/java/com/chronoshift/ui/main/MainScreen.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/main/MainScreen.kt)
- [app/src/main/java/com/chronoshift/ui/components/TimeResultCard.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/components/TimeResultCard.kt)

<a id="u6"></a>

### U6 — [Add helpful no-result, correction and large-input recovery states](https://linear.app/tienlam/issue/TIE-308/add-helpful-no-result-correction-and-large-input-recovery-states)

State: **In Review**. Project: **ChronoShift — Simple Web Experience**.

## Problem
The current UI mainly shows raw errors or no_timestamp; web users need a useful next step.

## Scope
- Write clear messages for empty/no timestamp, invalid source zone, DST conflict, input limit and runtime failure.
- Keep input intact and provide examples or editable assumptions with a direct retry action.
- Render pasted text as text, tolerate long/multiline messages and avoid jumpy layouts.

## Acceptance criteria
- [ ] No-result state explains how to try again without erasing the message.
- [ ] 10,001-character input reports the limit immediately and supports editing.
- [ ] Malformed/untrusted text cannot render HTML; source corrections do not replace explicit offsets silently.

## Delivery
- Priority: Medium
- Relative complexity: S (S = small, M = medium; not a time commitment)
- Dependencies: U3, U4

## Repository evidence
- [app/src/main/java/com/chronoshift/ui/main/MainViewModel.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/main/MainViewModel.kt)
- [app/src/test/java/com/chronoshift/AdversarialInputTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/AdversarialInputTest.kt)
- [app/src/main/res/values/strings.xml](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/res/values/strings.xml)

<a id="u7"></a>

### U7 — [Verify accessibility and first-time task completion](https://linear.app/tienlam/issue/TIE-309/verify-accessibility-and-first-time-task-completion)

State: **In Progress**. Project: **ChronoShift — Simple Web Experience**.

## Problem
Simple use needs observable keyboard, screen reader and mobile evidence.

## Scope
- Check WCAG 2.2 AA-relevant contrast, focus order, labels, announcements, touch targets, reduced motion and system light/dark.
- Run automated checks plus manual keyboard/screen-reader and mobile review.
- Run a small task-based check: paste meeting text, choose a CST interpretation, change target timezone, copy and reopen offline; document evidence and fix blocking friction.

## Acceptance criteria
- [ ] All core tasks work with keyboard alone and a screen reader; results/errors are announced once appropriately.
- [ ] 320px, 200% zoom, long text and reduced-motion states remain usable.
- [ ] Task-check findings and resolved issues are recorded; no critical accessibility or discoverability defect remains.

## Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: U4, U5, U6

## Repository evidence
- [app/src/main/java/com/chronoshift/ui/main/MainScreen.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/main/MainScreen.kt)
- [app/src/main/java/com/chronoshift/ui/theme/Theme.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/theme/Theme.kt)

<a id="p1"></a>

### P1 — [Precache the complete app and verify offline readiness](https://linear.app/tienlam/issue/TIE-310/precache-the-complete-app-and-verify-offline-readiness)

State: **In Review**. Project: **ChronoShift — Offline PWA**.

## Problem
A web shell that loads while online is insufficient: every conversion dependency must be available after offline restart.

## Scope
- Add a service worker and versioned precache for HTML, JS, worker, CSS, icons, fonts and required parser/zone/city data.
- Use navigation fallback for supported entry URLs; avoid runtime CDN fonts, online geocoding and conversion fetches.
- Report offline-ready only after cache preparation succeeds; handle unsupported service workers, partial install and fresh offline visit honestly.

## Acceptance criteria
- [ ] Warm online once, wait for readiness, close the app, disable network, reopen and convert newly entered text.
- [ ] Network-blocked conversion needs no uncached module/font/data or model.
- [ ] Incomplete cache/download never reports ready; hosting scope/base-path tests pass.

## Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F2, F10

## Repository evidence
- [README.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/README.md)
- [docs/architecture/nlp-pipeline.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/docs/architecture/nlp-pipeline.md)

<a id="p2"></a>

### P2 — [Add a PWA manifest and unobtrusive install guidance](https://linear.app/tienlam/issue/TIE-311/add-a-pwa-manifest-and-unobtrusive-install-guidance)

State: **In Progress**. Project: **ChronoShift — Offline PWA**.

## Problem
Users should be able to keep the converter on a home screen or desktop without making installation mandatory.

## Scope
- Provide name, icons, stable app ID, start URL/scope, standalone display and theme metadata.
- Capability-detect install prompting and provide browser-specific manual guidance where appropriate.
- Test normal browser and installed modes on Android, iOS and desktop.

## Acceptance criteria
- [ ] Manifest/start URL/icon validation passes and installed launch reaches the converter offline.
- [ ] Install guidance appears only when relevant and can be dismissed.
- [ ] Unsupported installation does not remove normal browser conversion or show a dead button.

## Delivery
- Priority: Medium
- Relative complexity: S (S = small, M = medium; not a time commitment)
- Dependencies: P1, U2

## Repository evidence
- [app/src/main/res/drawable/ic_launcher_foreground.xml](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/res/drawable/ic_launcher_foreground.xml)
- [app/src/main/AndroidManifest.xml](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/AndroidManifest.xml)

<a id="p3"></a>

### P3 — [Persist minimal preferences and recover from unavailable browser storage](https://linear.app/tienlam/issue/TIE-312/persist-minimal-preferences-and-recover-from-unavailable-browser)

State: **In Progress**. Project: **ChronoShift — Offline PWA**.

## Problem
Browser storage can be denied, full, cleared or evicted; conversion must still work with defaults.

## Scope
- Persist only target-zone/time-format/theme preferences in a small versioned local store; use IndexedDB only where shared service-worker handoff needs it.
- Default input/results to in-memory data; provide reset preferences and safe schema migration.
- Catch storage failures and use a clear fallback. Offline cache readiness should respond accurately to missing resources; persistence requests cannot guarantee storage forever.

## Acceptance criteria
- [ ] Preferences survive normal browser/installed restarts and migration from an old schema.
- [ ] Storage denial/quota/clear scenarios leave usable defaults and no crash.
- [ ] Pasted text and conversion history are not persisted by default; reset removes app preferences.

## Delivery
- Priority: Medium
- Relative complexity: S (S = small, M = medium; not a time commitment)
- Dependencies: P1, U4

## Repository evidence
- [app/src/main/java/com/chronoshift/ui/settings/SettingsScreen.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/settings/SettingsScreen.kt)
- [app/src/main/java/com/chronoshift/ui/settings/SettingsViewModel.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/settings/SettingsViewModel.kt)

<a id="p4"></a>

### P4 — [Implement safe service-worker upgrades without losing active input](https://linear.app/tienlam/issue/TIE-313/implement-safe-service-worker-upgrades-without-losing-active-input)

State: **In Progress**. Project: **ChronoShift — Offline PWA**.

## Problem
Uncontrolled service-worker activation can mix assets or force reloads while the user is editing.

## Scope
- Version caches atomically and preserve the last working version when a new install is incomplete.
- Notify of an available update with an explicit reload action; preserve active input through that action only using a bounded temporary handoff cleared immediately after restore.
- Define compatible message/storage contracts across tabs and remove obsolete caches after successful activation; document rollback behavior.

## Acceptance criteria
- [ ] Interrupted update leaves the old app operational offline.
- [ ] Old tab/new tab and two successive releases do not mix incompatible parser/worker assets.
- [ ] Accepting an update restores current input and clears temporary text; dismissing preserves the current session.
- [ ] Rollback and obsolete-cache cleanup are exercised without deleting preferences.

## Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: P1, P3, U2

## Repository evidence
- [.github/workflows/release.yml](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/.github/workflows/release.yml)
- [app/src/main/java/com/chronoshift/ui/main/MainUiState.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ui/main/MainUiState.kt)

<a id="p5"></a>

### P5 — [Receive shared text in supported installed browsers with an offline fallback](https://linear.app/tienlam/issue/TIE-314/receive-shared-text-in-supported-installed-browsers-with-an-offline)

State: **In Progress**. Project: **ChronoShift — Offline PWA**.

## Problem
Android PROCESS_TEXT cannot be recreated everywhere by a web page; supported installed share targets can reduce copy/paste friction.

## Scope
- Add capability-based manifest share_target using POST and a service-worker fetch handler.
- Hand title/text/url safely to the input page without network processing; consume and immediately clear any temporary IndexedDB handoff.
- Enforce origin/type/size checks, treat incoming values as untrusted text, never auto-fetch shared URLs.
- Keep ordinary paste as the documented path on unsupported browsers; extension/native context-menu integration is deferred.

## Acceptance criteria
- [ ] Installed supported browser shares text while offline and opens a usable input/result flow.
- [ ] Shared message does not appear in request query strings, server logs or persistent history.
- [ ] Unsupported browser and invalid/oversized payload scenarios have a clear paste/correction path.

## Delivery
- Priority: Medium
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: P2, P3, U2

## Repository evidence
- [app/src/main/java/com/chronoshift/ProcessTextActivity.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/ProcessTextActivity.kt)
- [app/src/main/AndroidManifest.xml](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/AndroidManifest.xml)

<a id="p6"></a>

### P6 — [Automate offline restart, update, storage and share regression checks](https://linear.app/tienlam/issue/TIE-315/automate-offline-restart-update-storage-and-share-regression-checks)

State: **In Progress**. Project: **ChronoShift — Offline PWA**.

## Problem
Online happy-path tests do not prove offline durability or capability fallbacks.

## Scope
- Create browser scenarios for first online preparation, cached close/reopen offline, new input, preference restart, deep-link navigation and denied clipboard.
- Cover incomplete caching, cleared/denied storage, version N→N+1, multi-tab and supported POST share target; complement automation with real-device checks.
- Capture unexpected network requests and distinguish permitted online asset/update loading from forbidden conversion/text transmission.

## Acceptance criteria
- [ ] Offline scenarios convert newly typed text with all network routes blocked.
- [ ] Upgrade/storage scenarios preserve usable behavior and readiness is truthful.
- [ ] Share/clipboard fallbacks have recorded browser capability coverage.

## Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: P3, P4, P5, U5

## Repository evidence
- [docs/developer/device-smoke-test.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/docs/developer/device-smoke-test.md)
- [app/src/test/java/com/chronoshift/EndToEndTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/EndToEndTest.kt)

<a id="d1"></a>

### D1 — [Add reproducible web CI and browser test gates](https://linear.app/tienlam/issue/TIE-316/add-reproducible-web-ci-and-browser-test-gates)

State: **In Review**. Project: **ChronoShift — Web Delivery**.

## Problem
Current CI builds/lints/tests Android only.

## Scope
- Add mise-managed developer tools, Bun frozen-lock install, typecheck, formatting/lint as appropriate, engine fixtures and production build.
- Run meaningful browser integration/offline tests as they land, with failures publishing readable diagnostics.
- Run web-only checks and publishing gates; remove obsolete native workflows and source-dependent corpus import.

## Acceptance criteria
- [ ] Fresh CI build succeeds without relying on a local package cache or unpinned tool versions.
- [ ] Exact conversion failures and browser/offline regressions fail the web gate.
- [ ] Build/test artifacts contain no user input or secrets and commands are documented.

## Delivery
- Dependencies: F2, F3
- State: In Review

<a id="d2"></a>

### D2 — [Verify exact conversion behavior across desktop and mobile browsers](https://linear.app/tienlam/issue/TIE-317/verify-exact-conversion-behavior-across-desktop-and-mobile-browsers)

State: **In Progress**. Project: **ChronoShift — Web Delivery**.

## Problem
JavaScript date/zone behavior and browser API capabilities vary; Android tests alone cannot certify the web release.

## Scope
- Run exact launch fixtures on Chromium, Firefox and WebKit and record real Android Chrome/iOS Safari evidence.
- Check DST transitions, device-zone differences, non-English display locales, 12/24-hour format, date rollover and explicit offset labels.
- Maintain a feature matrix for conversion, caching, install, clipboard and share; log intentional changes from Android and resolve all correctness gaps.

## Acceptance criteria
- [ ] Every launch-critical fixture passes or has an explicitly approved contract change with independent expected values.
- [ ] Real mobile cached offline restart, timezone selection and copying are verified.
- [ ] There are no open correctness defects that silently change an instant or hide ambiguity.

## Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F10, U7, P6, D1

## Repository evidence
- [app/src/test/java/com/chronoshift/IntegrationTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/IntegrationTest.kt)
- [app/src/test/java/com/chronoshift/TimestampCorpusTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/TimestampCorpusTest.kt)
- [app/src/test/java/com/chronoshift/conversion/TimeConverterTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/conversion/TimeConverterTest.kt)
- [docs/developer/device-smoke-test.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/docs/developer/device-smoke-test.md)

<a id="d3"></a>

### D3 — [Measure startup and conversion performance on a representative phone](https://linear.app/tienlam/issue/TIE-318/measure-startup-and-conversion-performance-on-a-representative-phone)

State: **In Progress**. Project: **ChronoShift — Web Delivery**.

## Problem
Porting parser/data/UI can create a slow first launch or block typing on phones.

## Scope
- Establish and record device/test conditions and provisional budgets: <500 KiB compressed initial assets, p95 <250 ms for typical ≤2,000-character conversions and <1 s at the 10,000-character limit.
- Measure production cold online and warm offline startup, long-input responsiveness and result rendering.
- Trim unused locales/assets, split only assets that still become offline-ready and move expensive parsing to a worker if justified; revise budgets only with measured rationale.

## Acceptance criteria
- [ ] Benchmark report includes bundle breakdown and reproducible p95 measurements.
- [ ] Typical flow meets the agreed budgets and worst-case input does not freeze editing/clear controls.
- [ ] Performance optimization preserves exact fixtures and offline readiness.

## Delivery
- Priority: Medium
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: F10, U2, P1

## Repository evidence
- [app/src/main/java/com/chronoshift/nlp/TieredTimeExtractor.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/TieredTimeExtractor.kt)
- [app/src/test/java/com/chronoshift/AdversarialInputTest.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/test/java/com/chronoshift/AdversarialInputTest.kt)

<a id="d4"></a>

### D4 — [Audit local-only text handling and production web security](https://linear.app/tienlam/issue/TIE-319/audit-local-only-text-handling-and-production-web-security)

State: **In Progress**. Project: **ChronoShift — Web Delivery**.

## Problem
A static app can still leak pasted text through logging, URLs, share handling, analytics or external dependencies.

## Scope
- Audit request/log/storage/URL paths with distinctive test text; keep conversions client-side and persistent history off by default.
- Render input only as text, bound incoming data, avoid fetching arbitrary shared URLs and configure a compatible CSP/security header policy.
- Review static asset dependencies/licenses and remove external runtime fonts/scripts and unnecessary telemetry.
- Verify temporary share/update handoffs expire and clear; normal conversion is independent of storage or permissions.

## Acceptance criteria
- [ ] Request interception and storage/log inspection find no pasted test text outside approved temporary local handoff.
- [ ] Injection payloads cannot execute or generate arbitrary external requests.
- [ ] CSP works with required workers/service workers; offline and exact fixtures still pass.
- [ ] Privacy behavior is accurately documented in plain language.

## Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: U6, P5, P4, D1

## Repository evidence
- [app/src/main/java/com/chronoshift/nlp/ChronoResultParser.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/nlp/ChronoResultParser.kt)
- [app/src/main/java/com/chronoshift/conversion/TimeConverter.kt](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/java/com/chronoshift/conversion/TimeConverter.kt)
- [app/src/main/res/xml/network_security_config.xml](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/app/src/main/res/xml/network_security_config.xml)

<a id="d5"></a>

### D5 — [Release the static web app over HTTPS with an exercised rollback](https://linear.app/tienlam/issue/TIE-320/release-the-static-web-app-over-https-with-an-exercised-rollback)

State: **In Progress**. Project: **ChronoShift — Web Delivery**.

## Problem
APK releases must be replaced with a stable HTTPS origin suitable for service workers.

## Scope
- Publish on GitHub Pages at https://tien-lam.github.io/ChronoShift/ with /ChronoShift/ as the base path; document repository ownership and public-repository hosting.
- Build preview/release deployment with correct MIME, scope, headers and cache policy; no conversion server required.
- Release only after candidate gates pass, retain immutable release artifacts and exercise N→N+1 update/rollback on the deployed origin.
- Document readiness, first online load and installation behavior.

## Acceptance criteria
- [ ] Production HTTPS URL works in browser and installed modes; new input converts after offline restart.
- [ ] Deployment checks catch bad base paths, mixed-content/CDN dependencies and incorrect service-worker caching.
- [ ] Rollback restores a known working release with existing-client update behavior verified.

## Delivery
- Priority: High
- Relative complexity: M (S = small, M = medium; not a time commitment)
- Dependencies: D2, D3, D4

## Repository evidence
- [.github/workflows/release.yml](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/.github/workflows/release.yml)
- [README.md](https://github.com/Tien-Lam/ChronoShift/blob/b7ef48a/README.md)

<a id="d6"></a>

### D6 — [Make the repository web-only and remove native app maintenance](https://linear.app/tienlam/issue/TIE-321/make-the-repository-web-only-and-remove-native-app-maintenance)

State: **In Review**. Project: **ChronoShift — Web Delivery**.

## Problem
The user explicitly requests removal of native app support; all active source, tooling and docs must describe the web product.

## Scope
- Remove the native app, Gradle wrappers/configuration and native model maintenance.
- Remove native unit/lint, APK release and scheduled model workflows; disable obsolete jobs and close native-only dependency PRs.
- Rewrite user/agent/build/test/architecture/browser-smoke docs and templates for the offline web app.
- Keep the 353-input corpus as standalone web data with immutable Git provenance; remove native-source generation.
- Use Bun and GitHub Actions dependency maintenance; preserve historical commits and releases without retaining a native directory.

## Acceptance criteria
- [ ] Active tests/build/CI do not require a native SDK or source file.
- [ ] Web unit/browser/subpath/hosted checks pass and the deterministic corpus audit has zero crashes.
- [ ] Docs/templates describe web usage and GitHub Pages publishing remains functional.
- [ ] Native workflow/dependency maintenance is retired and Linear records the changed scope.

## Delivery
- Dependencies: None
- State: In Review

## Publication and evidence

[Linear initiative](https://linear.app/tienlam/initiative/chronoshift-simple-offline-web-app-d90101850ba1), [implementation and verification](web-execution-report.md), [product contract](web-product-contract.md).

TIE-322 is canceled by the native-removal scope decision and no longer blocks delivery. Historical native maintenance is not an active workstream.
