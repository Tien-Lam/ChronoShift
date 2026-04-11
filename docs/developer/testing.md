# Testing

381 tests across 11 suites, including a 354-pattern timestamp corpus.

## Running Tests

```bash
JAVA_HOME="C:/Program Files/Android/Android Studio/jbr" \
ANDROID_HOME="$LOCALAPPDATA/Android/Sdk" \
./gradlew testDebugUnitTest
```

Test results are written to `app/build/test-results/` (JUnit XML) and `app/build/reports/tests/` (HTML).

## Test Architecture

### Real Parsers, Not Manual Construction

Tests use the actual parser chain (Chrono.js via QuickJS, `LlmResultParser`, `RegexExtractor`, etc.) rather than manually constructing `ExtractedTime` objects. This catches field-population bugs that mock-based tests miss — e.g., a parser forgetting to set `localDateTime` would break downstream merge logic.

### Testable Pure Logic

All complex logic is extracted into pure Kotlin objects with no Android dependencies:

| Object | Test file |
|---|---|
| `ChronoResultParser` | `ChronoResultParserTest.kt` |
| `ResultMerger` | `ResultMergerTest.kt` |
| `LlmResultParser` | `LlmResultParserTest.kt` |
| `TimeConverter` | `TimeConverterTest.kt` |
| `RegexExtractor` | `RegexExtractorTest.kt` |
| `TimezoneAbbreviations` | `TimezoneAbbreviationsTest.kt` |

Android-dependent classes (`ChronoExtractor`, `GeminiNanoExtractor`, `MlKitEntityExtractor`) are thin wrappers that delegate to these testable objects.

### Test Helpers

- **`TestCityResolver`** — delegates to `IanaCityLookup` (pure IANA data + alias + fuzzy matching) so tests don't need Android's `Geocoder`.
- **Injectable `localZone`** — `TimeConverter.toLocal()` accepts a `localZone` parameter, making output deterministic regardless of the machine running tests.
- **`unitTests.isReturnDefaultValues = true`** — configured in `build.gradle.kts` so `android.util.Log` calls in `TieredTimeExtractor` return defaults instead of throwing.

### QuickJS in Unit Tests

Chrono.js integration tests run the real QuickJS engine via `zipline-jvm`. The test dependency is `app.cash.zipline:zipline-jvm` (separate from the runtime `zipline` dependency which includes Android native libs).

## Test Suites

| Suite | Focus |
|---|---|
| `TimestampCorpusTest` | 354-pattern corpus covering real-world timestamp formats |
| `IntegrationTest` | End-to-end parser data flow through real Chrono.js |
| `EndToEndTest` | Settings, model download, LiteRT pipeline |
| `ChronoResultParserTest` | JSON parsing, offset-to-IANA, date propagation, span merge |
| `ResultMergerTest` | Exact/fuzzy matching, tz dedup, method combining |
| `LlmResultParserTest` | LLM JSON parsing, fence stripping, tz resolution |
| `TimeConverterTest` | Timezone conversion, city labels, UTC display |
| `RegexExtractorTest` | Unix timestamps, city resolution |
| `TimezoneAbbreviationsTest` | Abbreviation expansion, ambiguity detection |
| `TieredTimeExtractorTest` | Orchestrator streaming, stage ordering |
| `DeviceScenarioTest` | Reproduction of real-device merge/alignment scenarios |

## Adding Tests

1. For new timestamp patterns, add them to the corpus in `TimestampCorpusTest`.
2. For parser logic changes, add cases to the relevant `*Test.kt` file using real parser invocations.
3. For cross-component behavior, add to `IntegrationTest` which traces data through the full pipeline.
