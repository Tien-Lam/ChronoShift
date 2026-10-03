# ChronoShift

ChronoShift is moving to a simple, private web app that works offline after its first complete online load. The web preview supports natural-language times, cities, explicit zones/offsets, ranges, Unix seconds and labeled timezone ambiguity. Paste → Convert → Copy, with no account or conversion server.

[Open the web preview](https://tien-lam.github.io/ChronoShift/). The interface adapts to phones, tablets, desktop windows and foldable screens; supported browsers keep input and results clear of a hinge. Wait for **Offline ready** before disconnecting.

```bash
mise install
bun install --frozen-lockfile
bun run build
bun run preview
```

Open `http://127.0.0.1:4173` and wait for **Offline ready** before disconnecting. `bun run dev` is for development; offline caching runs in the production preview. See [web development and release gates](docs/developer/web.md), the [migration initiative](https://linear.app/tienlam/initiative/chronoshift-simple-offline-web-app-d90101850ba1), and [implementation evidence](docs/planning/web-execution-report.md).

The web release is still undergoing real-device, accessibility and deployment acceptance. The Android implementation below remains available during migration.

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
| 2 | Gemma (LiteRT) | Background | On-device LLM for complex/ambiguous timestamps |

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
