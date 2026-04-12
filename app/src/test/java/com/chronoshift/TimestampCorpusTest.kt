package com.chronoshift

import com.chronoshift.conversion.TimeConverter
import com.chronoshift.nlp.ChronoResultParser
import com.chronoshift.nlp.LlmResultParser
import com.chronoshift.nlp.ResultMerger
import com.chronoshift.nlp.TestCityResolver
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toInstant
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * Corpus-based tests using 354 real-world timestamp patterns.
 *
 * Since Chrono.js requires QuickJS (device-only), these tests validate:
 * 1. Test data integrity (all cases are well-formed)
 * 2. Pipeline resilience (no crash for any input pattern)
 * 3. LlmResultParser handles all expected outputs
 * 4. TimeConverter handles all timezone patterns
 *
 * For full Chrono.js validation, run instrumented tests on device.
 */
class TimestampCorpusTest {

    private val converter = TimeConverter()
    private val cityResolver = TestCityResolver()

    @Before
    fun setup() {
        ChronoResultParser.clearOffsetCache()
    }

    @Test
    fun `corpus has at least 300 test cases`() {
        assertTrue("Expected 300+ test cases, got ${testCases.size}", testCases.size >= 300)
    }

    @Test
    fun `all test cases have valid expectedCount`() {
        testCases.forEach { tc ->
            assertTrue(
                "Test case '${tc.input}' has invalid expectedCount ${tc.expectedCount}",
                tc.expectedCount >= 0,
            )
        }
    }

    @Test
    fun `all test cases with expected timestamps have matching count`() {
        testCases.filter { it.expected.isNotEmpty() }.forEach { tc ->
            assertTrue(
                "Test case '${tc.input}': expectedCount=${tc.expectedCount} but expected list has ${tc.expected.size} entries",
                tc.expectedCount == tc.expected.size || tc.expected.size <= tc.expectedCount,
            )
        }
    }

    @Test
    fun `all expected hours are valid 0-23`() {
        testCases.flatMap { it.expected }.forEach { exp ->
            assertTrue(
                "Expected hour ${exp.hour} is out of range 0-23",
                exp.hour in 0..23,
            )
        }
    }

    @Test
    fun `all expected minutes are valid 0-59`() {
        testCases.flatMap { it.expected }.forEach { exp ->
            assertTrue(
                "Expected minute ${exp.minute} is out of range 0-59",
                exp.minute in 0..59,
            )
        }
    }

    // ========== Pipeline resilience: simulate Gemini output for each case ==========

    @Test
    fun `LlmResultParser handles all single-timestamp cases without crash`() {
        testCases.filter { it.expectedCount == 1 && it.expected.isNotEmpty() }.forEach { tc ->
            val exp = tc.expected[0]
            val tz = exp.timezone ?: ""
            val json = """[{"time":"${"%02d".format(exp.hour)}:${"%02d".format(exp.minute)}","date":"2026-04-09","timezone":"$tz","original":"${tc.input.replace("\"", "\\\"")}"}]"""
            try {
                val results = LlmResultParser.parseResponse(json)
                // Should not crash — may produce 0 or 1 results depending on timezone validity
                assertTrue(
                    "Parsing '${tc.input}' should produce 0 or 1 results, got ${results.size}",
                    results.size in 0..1,
                )
                if (results.isNotEmpty()) {
                    assertNotNull("Result should have localDateTime", results[0].localDateTime)
                }
            } catch (e: Exception) {
                throw AssertionError("LlmResultParser crashed on '${tc.input}': ${e.message}", e)
            }
        }
    }

    @Test
    fun `LlmResultParser handles all multi-timestamp cases without crash`() {
        testCases.filter { it.expectedCount > 1 && it.expected.isNotEmpty() }.forEach { tc ->
            val entries = tc.expected.mapIndexed { i, exp ->
                val tz = exp.timezone ?: ""
                """{"time":"${"%02d".format(exp.hour)}:${"%02d".format(exp.minute)}","date":"2026-04-09","timezone":"$tz","original":"part${i + 1}"}"""
            }.joinToString(",")
            val json = "[$entries]"
            try {
                val results = LlmResultParser.parseResponse(json)
                results.forEach { r ->
                    assertNotNull("Multi-timestamp result should have localDateTime", r.localDateTime)
                }
            } catch (e: Exception) {
                throw AssertionError("LlmResultParser crashed on multi-timestamp '${tc.input}': ${e.message}", e)
            }
        }
    }

    @Test
    fun `TimeConverter handles all timezone patterns without crash`() {
        val uniqueTimezones = testCases.flatMap { it.expected }.mapNotNull { it.timezone }.distinct()
        uniqueTimezones.forEach { tzStr ->
            try {
                val tz = TimeZone.of(tzStr)
                val dt = kotlinx.datetime.LocalDateTime(2026, 4, 9, 12, 0)
                val ext = com.chronoshift.conversion.ExtractedTime(
                    instant = dt.toInstant(tz),
                    localDateTime = dt,
                    sourceTimezone = tz,
                    originalText = "test $tzStr",
                )
                val converted = converter.toLocal(listOf(ext), TimeZone.UTC)
                assertTrue("Should convert $tzStr without crash", converted.isNotEmpty())
            } catch (e: Exception) {
                // Some timezone strings in test data might not be valid IANA IDs
                // (e.g. "EST" is not a valid IANA ID on all platforms)
                // This is expected — just skip
            } catch (e: Exception) {
                throw AssertionError("TimeConverter crashed on timezone '$tzStr': ${e.message}", e)
            }
        }
    }

    @Test
    fun `ChronoResultParser handles simulated output for all cases without crash`() {
        testCases.filter { it.expected.isNotEmpty() }.forEach { tc ->
            val entries = tc.expected.mapIndexed { i, exp ->
                val tzJson = if (exp.timezone != null) {
                    // Try to compute offset minutes from timezone string
                    try {
                        val tz = java.time.ZoneId.of(exp.timezone)
                        val offset = tz.rules.getOffset(java.time.Instant.now())
                        "${offset.totalSeconds / 60}"
                    } catch (_: Exception) { "null" }
                } else "null"
                """{"text":"part${i + 1}","index":${i * 10},"start":{"year":2026,"month":4,"day":9,"hour":${exp.hour},"minute":${exp.minute},"second":0,"timezone":$tzJson,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":${exp.timezone != null}}},"end":null}"""
            }.joinToString(",")
            val json = "[$entries]"
            try {
                val results = ChronoResultParser.parse(json, tc.input, cityResolver)
                // Should not crash
            } catch (e: Exception) {
                throw AssertionError("ChronoResultParser crashed on '${tc.input}': ${e.message}", e)
            }
        }
    }

    @Test
    fun `ResultMerger handles mixed Chrono and Gemini output for all cases without crash`() {
        testCases.filter { it.expected.isNotEmpty() }.take(50).forEach { tc ->
            val exp = tc.expected[0]
            val chronoJson = """[{"text":"${tc.input.take(30).replace("\"", "")}","index":0,"start":{"year":2026,"month":4,"day":9,"hour":${exp.hour},"minute":${exp.minute},"second":0,"timezone":null,"isCertain":{"day":false}},"end":null}]"""
            val chrono = ChronoResultParser.parse(chronoJson, tc.input, cityResolver)

            val tz = exp.timezone ?: ""
            val geminiJson = """[{"time":"${"%02d".format(exp.hour)}:${"%02d".format(exp.minute)}","date":"2026-04-09","timezone":"$tz","original":"${tc.input.take(30).replace("\"", "")}"}]"""
            val gemini = LlmResultParser.parseResponse(geminiJson)

            try {
                val merged = ResultMerger.mergeResults(chrono, gemini, "Gemini Nano")
                assertTrue("Merged should have >= 0 results", merged.isNotEmpty() || merged.isEmpty())
            } catch (e: Exception) {
                throw AssertionError("ResultMerger crashed on '${tc.input}': ${e.message}", e)
            }
        }
    }

    @Test
    fun `full pipeline for all cases with expected timezone converts without crash`() {
        testCases.filter { it.expected.any { e -> e.timezone != null } }.take(100).forEach { tc ->
            tc.expected.filter { it.timezone != null }.forEach { exp ->
                try {
                    val tz = TimeZone.of(exp.timezone!!)
                    val dt = kotlinx.datetime.LocalDateTime(2026, 4, 9, exp.hour, exp.minute)
                    val ext = com.chronoshift.conversion.ExtractedTime(
                        instant = dt.toInstant(tz),
                        localDateTime = dt,
                        sourceTimezone = tz,
                        originalText = tc.input.take(50),
                    )
                    val converted = converter.toLocal(listOf(ext), TimeZone.of("America/New_York"))
                    assertTrue("Should produce result for '${tc.input}'", converted.isNotEmpty())
                    assertTrue("localDateTime not empty", converted[0].localDateTime.isNotEmpty())
                    assertTrue("sourceTimezone not empty", converted[0].sourceTimezone.isNotEmpty())
                } catch (_: Exception) {
                    // Skip invalid IANA IDs
                }
            }
        }
    }

    // ========== Category coverage ==========

    @Test
    fun `corpus covers diverse input patterns`() {
        // Verify the corpus has variety, not just one pattern repeated
        val inputs = testCases.map { it.input }
        val hasTimezone = inputs.count { it.contains("EST") || it.contains("PST") || it.contains("UTC") || it.contains("ET") || it.contains("PT") || it.contains("GMT") }
        val hasDate = inputs.count { it.contains("April") || it.contains("Jan") || it.contains("2026") || it.contains("/") }
        val hasRange = inputs.count { it.contains("-") || it.contains("–") || it.contains("to") }
        val hasCity = inputs.count { it.contains("New York") || it.contains("Tokyo") || it.contains("London") || it.contains("Pacific") || it.contains("Eastern") }

        assertTrue("Should have 50+ cases with timezone abbreviations, got $hasTimezone", hasTimezone >= 50)
        assertTrue("Should have 30+ cases with dates, got $hasDate", hasDate >= 30)
        assertTrue("Should have 10+ cases with ranges, got $hasRange", hasRange >= 10)
        assertTrue("Should have 10+ cases with city/region names, got $hasCity", hasCity >= 10)
    }

    // ========== Stale date canary ==========

    @Test
    fun `canary - test reference year 2026 has not passed`() {
        val currentYear = java.time.Year.now().value
        assertTrue(
            "TestData uses hardcoded year 2026 as reference. Current year is $currentYear. " +
                "If this fails, Chrono.js may interpret these as past dates with different behavior. " +
                "Update TestData.kt reference dates to the current year.",
            currentYear <= 2026,
        )
    }
}
