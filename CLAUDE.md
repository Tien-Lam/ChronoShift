# ChronoShift

NLP-powered timezone converter for Android. Select text anywhere → converts timestamps to local time.

## Build

```bash
JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" ANDROID_HOME="$LOCALAPPDATA/Android/Sdk" ./gradlew assembleDebug
JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" ANDROID_HOME="$LOCALAPPDATA/Android/Sdk" ./gradlew testDebugUnitTest
```

Java and Gradle are NOT on PATH. Always set `JAVA_HOME` and `ANDROID_HOME` as shown above.

## Architecture

Single-module Android app. MVVM. Jetpack Compose. Hilt DI. Dark-mode only.

### NLP Pipeline (streaming)

```
Input text
  ├─ Stage 1 (~50ms, instant) ─────────────────
  │   ML Kit → detects datetime spans in text
  │   Chrono.js (Zipline/QuickJS) → parses spans + full text
  │   Regex → unix timestamps, "time in city"
  │   → emit results immediately
  │
  ├─ Stage 2 (~7s, background) ────────────────
  │   Gemini Nano → on-device LLM, highest quality
  │   → add new results, merge duplicates
  │
  └─ emit final results
```

Orchestrated by `TieredTimeExtractor` (implements `StreamingTimeExtractor`). ViewModel collects `Flow<ExtractionResult>`.

### Merge Philosophy

**Show all interpretations, don't guess.** When timestamps are ambiguous (e.g. "CST" = US Central or China Standard), both conversions are shown. Only true duplicates (same instant + same timezone) merge. User picks the right one.

### Testable Pure Logic (extracted objects)

All complex logic is in pure objects with no Android dependencies:

| Object | What it does |
|---|---|
| `ChronoResultParser` | Chrono JSON parsing, offset→IANA zone, date propagation, city resolution, span+full merge |
| `ResultMerger` | Exact/fuzzy time matching, tz dedup, method label combining |
| `GeminiResultParser` | Gemini Nano JSON parsing, fence stripping, IANA timezone resolution |
| `TimeConverter` | Timezone conversion (injectable localZone), UTC offset + city label display |
| `RegexExtractor` | Unix timestamps, city-to-timezone with CityResolver |

Android-dependent classes (`ChronoExtractor`, `GeminiNanoExtractor`, `MlKitEntityExtractor`, `CityResolver`) are thin wrappers that delegate to these testable objects.

### Key Files

- `nlp/TieredTimeExtractor.kt` — orchestrator, streaming Flow
- `nlp/ChronoExtractor.kt` — Zipline/QuickJS engine, loads `assets/chrono.js`
- `nlp/ChronoResultParser.kt` — Chrono parsing, date propagation, span merging
- `nlp/ResultMerger.kt` — merge/dedup (exact match only, ambiguous kept separate)
- `nlp/GeminiResultParser.kt` — Gemini JSON parsing
- `nlp/RegexExtractor.kt` — unix timestamps + city resolution only
- `nlp/CityResolver.kt` — Android Geocoder + IANA fallback + fuzzy edit distance
- `conversion/TimeConverter.kt` — conversion + `formatZoneName` with city labels
- `ui/main/MainScreen.kt` — two-state layout: InputLayout ↔ ResultsLayout
- `ui/components/TimeResultCard.kt` — input line → hero time → date → tz+method

### Theme

`MaterialExpressiveTheme` (M3 Expressive). Dark-mode only — forced at Compose, XML, and `forceDarkAllowed=false`. No custom colors.

### Display Format

Timezone displayed as `UTC+N CityName` (e.g. "UTC-7 Los Angeles"). 55+ curated city labels in `TimeConverter.ZONE_LABELS`. Obscure zones fall back to IANA city name. Timezone-less results assume device local timezone (not UTC).

## Testing

288 tests across 7 suites. 354-pattern corpus.

Tests use real parsers (not manual ExtractedTime construction) to catch field-population bugs. `TestCityResolver` (IANA-only) for unit tests. Injectable `localZone` on `TimeConverter` for deterministic output.

## Gotchas

- Zipline (`app.cash.zipline`) provides QuickJS with 16KB-aligned native libs
- `chrono.js` in `assets/` is a bundled esbuild build (251KB). Update: `npm install chrono-node && npx esbuild entry.js --bundle --format=iife --minify --outfile=chrono_bundle.js`
- Gemini Nano `checkStatus()`: 0=UNAVAILABLE, 1=DOWNLOADABLE, 2=DOWNLOADING, 3=AVAILABLE
- ML Kit detects datetime spans but has NO timezone awareness — it's a spotter for Chrono
- Chrono returns timezone as minute offsets. `ChronoResultParser.offsetToTimezone()` maps to named IANA zones via `PREFERRED_ZONES` set
- `mergeSpanAndFullResults()` upgrades span results with timezone from full-text results
- Date-only results (uncertain hour, no tz) filtered when real time results exist, kept when alone
- `isSameLocalTime` checks hour + minute + DATE (prevents cross-date silent merge)

## Next Steps

- Integrate Google LiteRT-LM (`com.google.ai.edge.litertlm:litertlm-android`) as fast (~1-2s) on-device LLM between Chrono and Gemini Nano
- Model: Gemma 3n E2B (~1.5GB, runtime download)
