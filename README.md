# ChronoShift

NLP-powered timezone converter for Android. Select text anywhere on your device and instantly convert timestamps to your local time.

## Features

- **Text Selection Integration** — select any text containing a timestamp, tap "ChronoShift" from the context menu, and see it converted
- **Streaming NLP Pipeline** — instant results from fast extractors, refined by on-device LLM in the background
- **Multiple Interpretations** — ambiguous timezones (e.g. "CST") show all possible conversions instead of guessing
- **Fully On-Device** — no network calls for conversion; privacy-first

## How It Works

ChronoShift uses a tiered extraction pipeline that streams results as they become available:

| Stage | Engine | Speed | Purpose |
|---|---|---|---|
| 1 | ML Kit + Chrono.js + Regex | ~50ms | Instant datetime detection, parsing, and unix timestamp handling |
| 2 | Gemma 4 E2B (LiteRT) | ~7s | On-device LLM for complex/ambiguous timestamps |

Stage 1 results appear immediately. Stage 2 adds and merges results in the background. Duplicates are merged; ambiguous interpretations are kept.

## Build

Requires Android Studio with its bundled JDK. Java and Gradle are **not** required on PATH.

```bash
JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" \
ANDROID_HOME="$LOCALAPPDATA/Android/Sdk" \
./gradlew assembleDebug
```

**Min SDK:** 26 (Android 8.0)  
**Target SDK:** 35

## Tech Stack

- Kotlin, Jetpack Compose, Material 3 Expressive
- Hilt for dependency injection
- [Zipline](https://github.com/nicholasgasior/nicholasgasior) (QuickJS) for running [chrono-node](https://github.com/wanasit/chrono) on-device
- ML Kit Entity Extraction for datetime span detection
- Google LiteRT-LM for on-device Gemma inference
- Kotlinx Datetime, Coroutines, Flow

## Testing

381 unit tests across 11 suites with a 354-pattern timestamp corpus. Tests use real parsers to catch field-population bugs.

```bash
JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" \
ANDROID_HOME="$LOCALAPPDATA/Android/Sdk" \
./gradlew testDebugUnitTest
```

## License

[MIT](LICENSE)
