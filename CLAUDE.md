# ChronoShift

NLP-powered timezone converter for Android. Select text anywhere → converts timestamps to local time.

See [AGENTS.md](AGENTS.md) for issue tracking (beads) and agent workflow.

## Build

```bash
JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" ANDROID_HOME="$LOCALAPPDATA/Android/Sdk" ./gradlew assembleDebug
JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" ANDROID_HOME="$LOCALAPPDATA/Android/Sdk" ./gradlew testDebugUnitTest
JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" ANDROID_HOME="$LOCALAPPDATA/Android/Sdk" ./gradlew testDebugUnitTest --tests "com.chronoshift.IntegrationTest"
```

Java and Gradle are NOT on PATH. Always set `JAVA_HOME` and `ANDROID_HOME` as shown above.

## Architecture

Single-module Android app. MVVM. Jetpack Compose. Hilt DI. Dark-mode only.

### NLP Pipeline (streaming)

```
Input text
  ├─ Stage 1 (instant) ────────────────────────
  │   ML Kit → detects datetime spans in text
  │   Chrono.js (Zipline/QuickJS) → parses spans + full text
  │   Regex → unix timestamps, "time in city"
  │   → emit results immediately
  │
  ├─ Stage 2 (background, concurrent) ─────────
  │   LiteRT (Gemma) → fast on-device LLM
  │   Gemini Nano → high-quality on-device LLM
  │   → emit as each completes, merge duplicates
  │
  └─ expand ambiguous abbreviations
     → emit final results
```

Orchestrated by `TieredTimeExtractor` (uses `SpanAwareTimeExtractor`, `SpanDetector`, `TimeExtractor` interfaces). ViewModel collects `Flow<ExtractionResult>`.

### Merge Philosophy

**Show all interpretations, don't guess.** When timestamps are ambiguous (e.g. "CST" = US Central or China Standard), both conversions are shown. Only true duplicates (same instant + same timezone) merge. User picks the right one.

### Key Files

- `nlp/TieredTimeExtractor.kt` — orchestrator, streaming Flow
- `nlp/ChronoExtractor.kt` — Zipline/QuickJS engine, loads `assets/chrono.js`
- `nlp/ChronoResultParser.kt` — Chrono parsing, date propagation, span merging
- `nlp/ResultMerger.kt` — merge/dedup (instant-based: same instant merges, different instants kept separate)
- `nlp/LlmResultParser.kt` — LLM JSON parsing (shared by Gemini Nano + LiteRT)
- `nlp/LiteRtExtractor.kt` — LiteRT/Gemma engine, model loading, prompt building
- `nlp/ModelDownloader.kt` — Hugging Face model download for LiteRT
- `nlp/TimezoneAbbreviations.kt` — abbreviation→offset resolution, ambiguity detection, instant correction
- `nlp/RegexExtractor.kt` — unix timestamps + city resolution only
- `nlp/CityResolver.kt` — `IanaCityLookup` (shared IANA + aliases + fuzzy edit distance), `CityResolver` (Geocoder wrapper)
- `di/Qualifiers.kt` — `@LiteRt`, `@Gemini`, `@Regex` qualifier annotations for DI
- `conversion/TimeConverter.kt` — conversion + `formatZoneName` with city labels
- `ui/main/MainScreen.kt` — two-state layout: InputLayout ↔ ResultsLayout
- `ui/components/TimeResultCard.kt` — input line → hero time → date → tz+method

### Theme

`MaterialExpressiveTheme` (M3 Expressive). Dark-mode only — forced at Compose, XML, and `forceDarkAllowed=false`. No custom colors.

### Display Format

Timezone displayed as `UTC+N CityName` (e.g. "UTC-7 Los Angeles"). Curated city labels in `TimeConverter.ZONE_LABELS`. Obscure zones fall back to IANA city name. Timezone-less results assume device local timezone (not UTC).

## Testing

Tests use real parsers (not manual ExtractedTime construction) to catch field-population bugs. `TestCityResolver` (delegates to `IanaCityLookup`) for unit tests. Injectable `localZone` on `TimeConverter` for deterministic output. `unitTests.isReturnDefaultValues = true` for `android.util.Log` in TieredTimeExtractor tests.

## Gotchas

- Zipline (`app.cash.zipline`) provides QuickJS with 16KB-aligned native libs
- `chrono.js` in `assets/` is a bundled esbuild build. Update: `npm install chrono-node && npx esbuild entry.js --bundle --format=iife --minify --outfile=chrono_bundle.js`
- Gemini Nano `checkStatus()`: 0=UNAVAILABLE, 1=DOWNLOADABLE, 2=DOWNLOADING, 3=AVAILABLE
- ML Kit detects datetime spans but has NO timezone awareness — it's a spotter for Chrono
- Chrono returns timezone as minute offsets. Instant is computed from the raw offset (not IANA zone DST rules). `offsetToTimezone(offset, instant)` finds a matching IANA zone at the parsed instant for display
- `mergeSpanAndFullResults()` upgrades span results with timezone from full-text results
- Date-only results (uncertain hour, no tz) filtered when real time results exist, kept when alone
- `isSameLocalTime` checks hour + minute + DATE (prevents cross-date silent merge)
