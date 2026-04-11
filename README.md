# ChronoShift

[![Tests](https://github.com/Tien-Lam/ChronoShift/actions/workflows/test.yml/badge.svg)](https://github.com/Tien-Lam/ChronoShift/actions/workflows/test.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Android min SDK](https://img.shields.io/badge/min%20SDK-26-green.svg)](app/build.gradle.kts)

NLP-powered timezone converter for Android. Select text anywhere on your device and instantly convert timestamps to your local time.

## Features

- **Text Selection Integration** — select any text containing a timestamp, tap "ChronoShift" from the context menu, and see it converted
- **Streaming NLP Pipeline** — instant results from fast extractors, refined by on-device LLM in the background
- **Multiple Interpretations** — ambiguous timezones (e.g. "CST") show all possible conversions instead of guessing
- **Fully On-Device** — no network calls for conversion; privacy-first

## Install

Download the latest APK from [Releases](https://github.com/Tien-Lam/ChronoShift/releases) and sideload it, or build from source (see below).

## How It Works

ChronoShift uses a tiered extraction pipeline that streams results as they become available:

| Stage | Engine | Speed | Purpose |
|---|---|---|---|
| 1 | ML Kit + Chrono.js + Regex | Instant | Datetime detection, parsing, and unix timestamp handling |
| 2 | Gemma (LiteRT) + Gemini Nano | Background | On-device LLMs for complex/ambiguous timestamps |

Stage 1 results appear immediately. Stage 2 adds and merges results in the background. Duplicates are merged; ambiguous interpretations are kept.

## Build

Requires Android Studio with its bundled JDK. Java and Gradle are **not** required on PATH.

```bash
JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" \
ANDROID_HOME="$LOCALAPPDATA/Android/Sdk" \
./gradlew assembleDebug
```

See [docs/developer/building.md](docs/developer/building.md) for full setup and CI details.

## Tech Stack

- Kotlin, Jetpack Compose, Material 3 Expressive
- Hilt for dependency injection
- [Zipline](https://github.com/nicholasgasior/nicholasgasior) (QuickJS) for running [chrono-node](https://github.com/wanasit/chrono) on-device
- ML Kit Entity Extraction for datetime span detection
- Google LiteRT-LM for on-device Gemma inference
- Kotlinx Datetime, Coroutines, Flow

## License

[MIT](LICENSE)
