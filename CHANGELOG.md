# Changelog

All notable changes to Time to Local (formerly ChronoShift) are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Private, adaptive offline web app with local Chrono/Temporal conversion, timezone corrections, ambiguity, copying and install support.
- GitHub Pages hosting, verified updates/rollback, exact web fixtures and browser/offline checks.
- Desktop, phone, tablet and foldable layouts with safe-area and hinge-aware enhancements.

### Removed

- Native Android application, Gradle tooling, APK release/test workflows and native model maintenance.
- Native dependency maintenance and source-dependent corpus generation. The conversion input corpus is maintained as standalone web data.

## [0.1.0] - 2026-04-11

Initial release.

### Added

- Text selection integration via `ACTION_PROCESS_TEXT` — select any text, tap ChronoShift
- Streaming two-stage NLP pipeline with immediate Stage 1 results
  - **ML Kit** entity extraction for datetime span detection
  - **Chrono.js** (via Zipline/QuickJS) for instant datetime parsing
  - **Regex** extractor for unix timestamps and "time in City" patterns
  - **Gemma** (LiteRT) as on-device LLM
- Ambiguity expansion — ambiguous abbreviations (CST, ET, PT, etc.) show all interpretations
- Timezone display as `UTC+N CityName` with curated city labels
- Result merging with instant-based dedup (same instant + same timezone merges, different interpretations kept)
- Settings screen with model download from Hugging Face
- Dark-mode-only Material 3 Expressive theme
- Timestamp pattern corpus and unit test suites
- CI: GitHub Actions for unit tests on push/PR and APK release on version tags
