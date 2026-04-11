# Changelog

All notable changes to ChronoShift are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-04-11

Initial release.

### Added

- Text selection integration via `ACTION_PROCESS_TEXT` — select any text, tap ChronoShift
- Streaming two-stage NLP pipeline with immediate Stage 1 results
  - **ML Kit** entity extraction for datetime span detection
  - **Chrono.js** (via Zipline/QuickJS) for instant datetime parsing
  - **Regex** extractor for unix timestamps and "time in City" patterns
  - **Gemma** (LiteRT) as fast on-device LLM
  - **Gemini Nano** as high-quality on-device LLM
- Ambiguity expansion — ambiguous abbreviations (CST, ET, PT, etc.) show all interpretations
- Timezone display as `UTC+N CityName` with curated city labels
- Result merging with instant-based dedup (same instant + same timezone merges, different interpretations kept)
- Settings screen with model download from Hugging Face
- Dark-mode-only Material 3 Expressive theme
- Timestamp pattern corpus and unit test suites
- CI: GitHub Actions for unit tests on push/PR and APK release on version tags
