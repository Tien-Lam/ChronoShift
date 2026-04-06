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
  │   Chrono.js (QuickJS) → parses spans + full text
  │   Regex → unix timestamps, "time in city"
  │   → emit results immediately
  │
  ├─ Stage 2 (~7s, background) ────────────────
  │   Gemini Nano → full NLP, highest quality
  │   → merge/upgrade existing results
  │
  └─ emit final results
```

Orchestrated by `TieredTimeExtractor` which implements `StreamingTimeExtractor`. ViewModel collects the `Flow<ExtractionResult>`.

### Testable Pure Logic (extracted objects)

All complex logic is in pure objects with no Android dependencies:

| Object | Tests | What it does |
|---|---|---|
| `ChronoResultParser` | 69 | Chrono JSON parsing, offset→IANA zone, date propagation, city resolution, span+full merge |
| `ResultMerger` | 27 | Exact/fuzzy time matching, timezone upgrade, method label combining |
| `GeminiResultParser` | 21 | Gemini Nano JSON parsing, fence stripping, IANA timezone resolution |
| `TimeConverter` | 41 | Timezone conversion (injectable localZone for deterministic tests) |
| `RegexExtractor` | 29 | Unix timestamps, city-to-timezone with CityResolver |

Android-dependent classes (`ChronoExtractor`, `GeminiNanoExtractor`, `MlKitEntityExtractor`, `CityResolver`) are thin wrappers that delegate to these testable objects.

### City Resolution

`CityResolver` resolves city names to timezones:
1. Android `Geocoder` (fuzzy, multilingual, needs Play Services)
2. IANA timezone database fallback (~600 cities from `ZoneId.getAvailableZoneIds()`)
3. Alias map for common cities not in IANA (San Francisco, Mumbai, etc.)
4. Fuzzy matching with edit distance ≤ 2

### Key Files

- `nlp/TieredTimeExtractor.kt` — orchestrator, streaming Flow
- `nlp/ChronoExtractor.kt` — QuickJS engine, loads `assets/chrono.js`
- `nlp/ChronoResultParser.kt` — all Chrono parsing logic (testable)
- `nlp/ResultMerger.kt` — merge/dedup logic (testable)
- `nlp/GeminiResultParser.kt` — Gemini JSON parsing (testable)
- `nlp/RegexExtractor.kt` — unix timestamps + city resolution only (Chrono handles NLP)
- `nlp/CityResolver.kt` — city-to-timezone via Geocoder + IANA
- `conversion/TimeConverter.kt` — timezone conversion (injectable localZone)
- `ui/main/MainScreen.kt` — two-state layout: InputLayout ↔ ResultsLayout

### Theme

`MaterialExpressiveTheme` (M3 Expressive). Dark-mode only — forced at Compose level, XML level (`android:Theme.Material.NoActionBar`), and `forceDarkAllowed=false`. No custom color palette — uses M3 defaults + dynamic color on Android 12+.

## Testing

190 unit tests. Run with `./gradlew testDebugUnitTest`.

Tests use `TestCityResolver` (IANA-only, no Geocoder) and injectable `localZone` parameter on `TimeConverter` for deterministic output regardless of test machine timezone/locale.

Android-dependent classes (QuickJS, ML Kit, Geocoder) need instrumented tests on device — not yet written.

## Gotchas

- Zipline (`app.cash.zipline`) provides QuickJS with 16KB-aligned native libs for Play Store compatibility
- `chrono.js` in `assets/` is a bundled build (esbuild, 251KB). To update: `npm install chrono-node && npx esbuild entry.js --bundle --format=iife --minify --outfile=chrono_bundle.js`
- Gemini Nano `checkStatus()` returns ints: 0=UNAVAILABLE, 1=DOWNLOADABLE, 2=DOWNLOADING, 3=AVAILABLE
- ML Kit Entity Extraction detects datetime spans but has NO timezone awareness — it's a spotter, not a parser
- Chrono returns timezone as minute offsets (e.g. -420 for PT). `ChronoResultParser.offsetToTimezone()` maps these to named IANA zones via cached lookup
- When Chrono parses ML Kit spans individually, the span may lack timezone context that the full text has. `mergeSpanAndFullResults()` upgrades span results with timezone from full-text results
- `ResultMerger.isSameLocalTime()` matches by hour:minute only — used to merge ML Kit results (no tz) with Chrono results (has tz)
