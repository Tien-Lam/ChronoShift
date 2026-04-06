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

`TieredTimeExtractor` runs all extractors and merges results. Fast ones emit immediately, Gemini Nano updates in background.

| Extractor | Speed | What it does |
|---|---|---|
| **ChronoExtractor** | ~10-50ms | chrono-node v2.9.0 via QuickJS. Handles all NLP: natural language dates, ranges, relative dates, timezones |
| **RegexExtractor** | ~1ms | ISO 8601, unix timestamps, timezone abbreviations, city names |
| **MlKitEntityExtractor** | ~200ms | ML Kit Entity Extraction for broad datetime detection |
| **GeminiNanoExtractor** | ~7s | Gemini Nano on-device LLM via ML Kit GenAI Prompt API. Best quality but slow. Status codes: 0=UNAVAILABLE, 1=DOWNLOADABLE, 2=DOWNLOADING, 3=AVAILABLE |

Results are merged with dedup: earlier extractors take priority for overlapping text spans. Gemini Nano **replaces** existing results when it arrives (higher quality).

Each `ExtractedTime` carries a `method` field that flows through to `ConvertedTime` and is shown per-result in the UI.

### City Resolution

`CityResolver` resolves city names to timezones:
1. Android `Geocoder` (fuzzy, multilingual, needs Play Services)
2. IANA timezone database fallback (~600 cities from `ZoneId.getAvailableZoneIds()`)
3. Alias map for common cities not in IANA (San Francisco, Mumbai, etc.)
4. Fuzzy matching with edit distance ≤ 2

### Key Files

- `nlp/TieredTimeExtractor.kt` — orchestrator, implements `StreamingTimeExtractor` with `Flow`
- `nlp/ChronoExtractor.kt` — QuickJS engine, loads `assets/chrono.js` once
- `nlp/RegexExtractor.kt` — fallback patterns, timezone abbreviation map, date propagation
- `nlp/CityResolver.kt` — city-to-timezone via Geocoder + IANA
- `ui/main/MainScreen.kt` — two-state layout: InputLayout (minimalist) ↔ ResultsLayout (flat list)
- `ui/components/TimeResultCard.kt` — per-character animated time text, tap-to-copy

### Theme

`MaterialExpressiveTheme` (M3 Expressive). Dark-mode only — forced at Compose level, XML level (`android:Theme.Material.NoActionBar`), and `forceDarkAllowed=false`. No custom color palette — uses M3 defaults + dynamic color on Android 12+.

## Conventions

- Confidence scores drive date propagation: ≥0.9 = has explicit date, <0.9 = time-only (inherits date from nearby results)
- `ExtractionResult` wraps `List<ExtractedTime>` + method name string
- `StreamingTimeExtractor.extractStream()` returns `Flow<ExtractionResult>` — ViewModel collects it
- Tests for `ChronoExtractor`/`GeminiNanoExtractor`/`MlKitEntityExtractor` require device (Android instrumented tests) — unit tests cover `RegexExtractor` and `TimeConverter`

## Gotchas

- QuickJS (`app.cash.quickjs`) is native — adds ~1MB per ABI. `jniLibs.useLegacyPackaging = false` for 16KB alignment
- `chrono.js` in `assets/` is a bundled build (esbuild, 251KB). To update: `npm install chrono-node && npx esbuild entry.js --bundle --format=iife --minify --outfile=chrono_bundle.js`
- Gemini Nano `checkStatus()` returns ints, NOT the enum names: 0=UNAVAILABLE, 1=DOWNLOADABLE, 2=DOWNLOADING, 3=AVAILABLE
- ML Kit Entity Extraction returns timestamps without timezone info — that's why Regex/Chrono run first
- `RegexExtractor.TIMEZONE_ABBREVS` keys must be sorted longest-first in `TZ_PATTERN` so "EST" matches before "ET"
