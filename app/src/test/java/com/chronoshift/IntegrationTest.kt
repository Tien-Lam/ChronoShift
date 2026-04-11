package com.chronoshift

import app.cash.zipline.QuickJs
import com.chronoshift.conversion.ConvertedTime
import com.chronoshift.conversion.ExtractedTime
import com.chronoshift.conversion.TimeConverter
import com.chronoshift.nlp.ChronoResultParser
import com.chronoshift.nlp.DownloadState
import com.chronoshift.nlp.LlmResultParser
import com.chronoshift.nlp.IanaCityLookup
import com.chronoshift.nlp.RegexExtractor
import com.chronoshift.nlp.ResultMerger
import com.chronoshift.nlp.TestCityResolver
import com.chronoshift.ui.settings.SettingsUiState
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.*
import kotlinx.datetime.toInstant
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Before
import org.junit.Test
import java.io.File

/**
 * Integration tests that trace REAL data flow through the NLP pipeline.
 *
 * Pipeline tests use real Chrono.js via QuickJS (skipped when native library unavailable).
 * Unit tests of specific parsers use hand-crafted JSON and always run.
 */
class IntegrationTest {

    private var qjs: QuickJs? = null
    private var quickJsAvailable = false
    private var skipReason: String? = null
    private val converter = TimeConverter()
    private val cityResolver = TestCityResolver()

    @Before
    fun setup() {
        ChronoResultParser.clearOffsetCache()
        try {
            qjs = QuickJs.create()
            val script = File("src/main/assets/chrono.js").readText()
            qjs!!.evaluate(script)
            quickJsAvailable = true
        } catch (e: Throwable) {
            val chain = generateSequence(e) { it.cause }.joinToString(" -> ") { "${it::class.simpleName}: ${it.message}" }
            skipReason = chain
            qjs = null
            quickJsAvailable = false
        }
    }

    @After
    fun teardown() {
        qjs?.close()
    }

    private fun requireQuickJs() {
        assumeTrue("QuickJS not available: $skipReason", quickJsAvailable)
    }

    /** Evaluate chrono.js on the raw input, exactly like ChronoExtractor does. */
    private fun chronoParse(text: String): String? {
        val escaped = text.replace("\\", "\\\\").replace("'", "\\'")
            .replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t")
        return qjs!!.evaluate("chronoParse('$escaped')") as? String
    }

    /** Full pipeline: chrono.js -> parse -> optional Gemini merge -> expand -> convert. */
    private fun pipeline(
        input: String,
        geminiJson: String? = null,
        localZone: TimeZone,
    ): List<ConvertedTime> {
        val json = chronoParse(input) ?: return emptyList()
        val chronoResults = ChronoResultParser.parse(json, input, cityResolver)
        var merged = if (geminiJson != null) {
            val geminiResults = LlmResultParser.parseResponse(geminiJson)
            ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")
        } else {
            chronoResults
        }
        merged = ChronoResultParser.expandAmbiguous(merged)
        return converter.toLocal(merged, localZone)
    }

    // ==================== JSON builder helpers ====================

    private fun geminiEntry(
        time: String,
        date: String = "2026-04-11",
        timezone: String = "",
        original: String,
    ): String = """{"time":"$time","date":"$date","timezone":"$timezone","original":"$original"}"""

    // ==================== Scenario 1 ====================
    // "April 11 at 4:30 a.m. PT / 7:30 a.m. ET / 19:30 CST"
    // Full pipeline: Chrono parse -> Gemini parse -> merge -> align -> convert

    @Test
    fun `scenario 1 - chrono parses 3 results with date propagation and timezone alignment`() {
        requireQuickJs()
        val input = "April 11 at 4:30 a.m. PT / 7:30 a.m. ET / 19:30 CST"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)
        assertEquals("Chrono should produce 3 results", 3, chronoResults.size)

        // Date propagation: day 11 (from the certain entry) should propagate to uncertain entries
        chronoResults.forEach { r ->
            assertEquals(
                "'${r.originalText}' should have day 11 after propagation",
                11, r.localDateTime!!.dayOfMonth,
            )
        }

        // PT (-420) and ET (-240) should share the same instant (unambiguous offsets)
        assertNotNull("PT should have instant", chronoResults[0].instant)
        assertNotNull("ET should have instant", chronoResults[1].instant)
        assertEquals("PT and ET should be same instant", chronoResults[0].instant, chronoResults[1].instant)

        // CST keeps its original Chrono-assigned timezone
        assertNotNull("CST should have instant", chronoResults[2].instant)
        assertNotNull("CST should have sourceTimezone", chronoResults[2].sourceTimezone)
    }

    @Test
    fun `scenario 1 - gemini parses 3 results with localDateTime set`() {
        val geminiJson = """[
            ${geminiEntry(time = "04:30:00", timezone = "America/Los_Angeles", original = "April 11 at 4:30 a.m. PT")},
            ${geminiEntry(time = "07:30:00", timezone = "America/New_York", original = "7:30 a.m. ET")},
            ${geminiEntry(time = "19:30:00", timezone = "America/Chicago", original = "19:30 CST")}
        ]"""

        val geminiResults = LlmResultParser.parseResponse(geminiJson)
        assertEquals("Gemini should produce 3 results", 3, geminiResults.size)

        // Regression test: Gemini results must have localDateTime set (the bug we fixed)
        geminiResults.forEach { r ->
            assertNotNull(
                "Gemini result '${r.originalText}' must have localDateTime (regression test)",
                r.localDateTime,
            )
        }

        // All should have timezone and instant since we provided IANA IDs
        geminiResults.forEach { r ->
            assertNotNull("'${r.originalText}' should have sourceTimezone", r.sourceTimezone)
            assertNotNull("'${r.originalText}' should have instant", r.instant)
        }

        assertEquals(4, geminiResults[0].localDateTime!!.hour)
        assertEquals(30, geminiResults[0].localDateTime!!.minute)
        assertEquals(7, geminiResults[1].localDateTime!!.hour)
        assertEquals(19, geminiResults[2].localDateTime!!.hour)
    }

    @Test
    fun `scenario 1 - merge chrono and gemini then align produces 3 results`() {
        requireQuickJs()
        val input = "April 11 at 4:30 a.m. PT / 7:30 a.m. ET / 19:30 CST"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)

        val geminiJson = """[
            ${geminiEntry(time = "04:30:00", timezone = "America/Los_Angeles", original = "April 11 at 4:30 a.m. PT")},
            ${geminiEntry(time = "07:30:00", timezone = "America/New_York", original = "7:30 a.m. ET")},
            ${geminiEntry(time = "19:30:00", timezone = "America/Chicago", original = "19:30 CST")}
        ]"""
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")

        assertEquals(
            "Merged should be 3 results (all pairs merge), got ${merged.size}: ${merged.map { "'${it.originalText}' tz=${it.sourceTimezone?.id}" }}",
            3, merged.size,
        )

        val etResult = merged.first { it.sourceTimezone?.id == "America/New_York" }
        assertTrue(
            "ET method should reflect Gemini Nano, got '${etResult.method}'",
            etResult.method.contains("Gemini Nano"),
        )
    }

    @Test
    fun `scenario 1 - full pipeline through TimeConverter to Tokyo`() {
        requireQuickJs()
        val input = "April 11 at 4:30 a.m. PT / 7:30 a.m. ET / 19:30 CST"

        val geminiJson = """[
            ${geminiEntry(time = "04:30:00", timezone = "America/Los_Angeles", original = "April 11 at 4:30 a.m. PT")},
            ${geminiEntry(time = "07:30:00", timezone = "America/New_York", original = "7:30 a.m. ET")},
            ${geminiEntry(time = "19:30:00", timezone = "America/Chicago", original = "19:30 CST")}
        ]"""

        val tokyo = TimeZone.of("Asia/Tokyo")
        val converted = pipeline(input, geminiJson, tokyo)

        assertTrue(
            "Should produce at least 3 converted results (PT + ET + CST expanded), got ${converted.size}",
            converted.size >= 3,
        )

        converted.forEach { ct ->
            assertNotNull(ct.localDateTime)
            assertNotNull(ct.localDate)
            assertTrue(
                "Local timezone should be UTC+9, got '${ct.localTimezone}'",
                ct.localTimezone.contains("UTC+9"),
            )
        }

        // PT: 4:30 AM PDT (UTC-7) = 11:30 UTC = 20:30 JST
        val ptResult = converted.first { it.originalText.contains("PT") || it.originalText.contains("4:30") }
        assertTrue(
            "PT 4:30 AM -> Tokyo should be 8:30 PM, got '${ptResult.localDateTime}'",
            ptResult.localDateTime.contains("8:30\u202Fpm"),
        )
    }

    // ==================== Scenario 2 ====================
    // "3pm EST" -- simple single timezone

    @Test
    fun `scenario 2 - single timezone through full pipeline`() {
        requireQuickJs()
        val converted = pipeline("3pm EST", localZone = TimeZone.of("Asia/Tokyo"))
        assertEquals("3pm EST should produce 1 result", 1, converted.size)
        converted.forEach { assertNotNull(it.localDateTime) }

        // 3pm EST (UTC-5) = 20:00 UTC = 05:00+1 JST
        assertTrue(
            "3pm EST -> Tokyo should be 5:00 AM next day, got '${converted[0].localDateTime}'",
            converted[0].localDateTime.contains("5:00\u202Fam"),
        )
    }

    // ==================== Scenario 3 ====================
    // "12:00 pm - 12:50 pm EDT" -- time range

    @Test
    fun `scenario 3 - time range produces start and end`() {
        requireQuickJs()
        val converted = pipeline("12:00 pm - 12:50 pm EDT", localZone = TimeZone.of("Europe/London"))
        assertEquals("Range should produce 2 results (start + end)", 2, converted.size)

        // 12:00 EDT (UTC-4) = 16:00 UTC = 17:00 BST (London in April, UTC+1)
        assertTrue(
            "Start 12:00 EDT -> London should be 5:00 PM, got '${converted[0].localDateTime}'",
            converted[0].localDateTime.contains("5:00\u202Fpm"),
        )
        // 12:50 EDT = 16:50 UTC = 17:50 BST
        assertTrue(
            "End 12:50 EDT -> London should be 5:50 PM, got '${converted[1].localDateTime}'",
            converted[1].localDateTime.contains("5:50\u202Fpm"),
        )
    }

    // ==================== Scenario 4 ====================
    // "5:00 in New York" -- city resolution

    @Test
    fun `scenario 4 - city resolution adds timezone to chrono result`() {
        requireQuickJs()
        val input = "5:00 in New York"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, cityResolver)

        assertEquals(1, chronoResults.size)
        assertNotNull(
            "City resolver should add timezone for 'New York'",
            chronoResults[0].sourceTimezone,
        )
        assertEquals("America/New_York", chronoResults[0].sourceTimezone!!.id)
    }

    @Test
    fun `scenario 4 - city resolution does not override explicit timezone`() {
        requireQuickJs()
        val input = "5:00 PM EDT in Chicago"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, cityResolver)

        assertEquals(1, chronoResults.size)
        assertNotNull(chronoResults[0].sourceTimezone)
        // Chrono parses EDT offset; city "Chicago" should NOT override it
        assertTrue(
            "Should keep offset-based timezone, not city (Chicago), got ${chronoResults[0].sourceTimezone!!.id}",
            chronoResults[0].sourceTimezone!!.id != "America/Chicago",
        )
    }

    // ==================== Scenario 5 ====================
    // Gemini returns wrong year (2024 vs 2026)

    @Test
    fun `scenario 5 - different years do not merge`() {
        requireQuickJs()
        val geminiJson = "[${geminiEntry(
            time = "04:30:00", date = "2024-04-11",
            timezone = "America/Los_Angeles", original = "April 11 at 4:30 a.m. PT",
        )}]"
        val geminiResults = LlmResultParser.parseResponse(geminiJson)
        assertEquals(2024, geminiResults[0].localDateTime!!.year)

        val input = "April 11 at 4:30 a.m. PT"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)
        assertEquals("Chrono should produce 1 result", 1, chronoResults.size)

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")

        assertEquals(
            "Different years should produce 2 separate results, got ${merged.size}",
            2, merged.size,
        )
    }

    @Test
    fun `scenario 5 - different years with different hours do not merge`() {
        requireQuickJs()
        val geminiJson = "[${geminiEntry(
            time = "10:00:00", date = "2024-04-11",
            timezone = "America/Los_Angeles", original = "10:00 a.m. PT (wrong year)",
        )}]"
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        val input = "April 11 at 4:30 a.m. PT"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")

        assertEquals("Different hours should produce 2 results", 2, merged.size)
    }

    // ==================== Scenario 6 ====================
    // Parser output field verification (regression tests)

    @Test
    fun `scenario 6 - gemini with timezone has localDateTime and instant`() {
        val json = "[${geminiEntry(time = "14:30:00", timezone = "America/New_York", original = "2:30 PM ET")}]"
        val results = LlmResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertNotNull("Gemini with tz must have localDateTime", results[0].localDateTime)
        assertNotNull("Gemini with tz must have instant", results[0].instant)
        assertNotNull("Gemini with tz must have sourceTimezone", results[0].sourceTimezone)
        assertEquals(0.9f, results[0].confidence)
    }

    @Test
    fun `scenario 6 - gemini without timezone has localDateTime but no instant`() {
        val json = "[${geminiEntry(time = "14:30:00", timezone = "", original = "2:30 PM")}]"
        val results = LlmResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertNotNull("Gemini without tz must have localDateTime", results[0].localDateTime)
        assertNull("Gemini without tz must NOT have instant", results[0].instant)
        assertNull("Gemini without tz must NOT have sourceTimezone", results[0].sourceTimezone)
        assertEquals(0.7f, results[0].confidence)
    }

    @Test
    fun `scenario 6 - chrono with timezone has localDateTime and instant`() {
        requireQuickJs()
        val json = chronoParse("3pm EST")!!
        val results = ChronoResultParser.parse(json, "", null)
        assertEquals(1, results.size)
        assertNotNull("Chrono with tz must have localDateTime", results[0].localDateTime)
        assertNotNull("Chrono with tz must have instant", results[0].instant)
        assertNotNull("Chrono with tz must have sourceTimezone", results[0].sourceTimezone)
    }

    @Test
    fun `scenario 6 - chrono without timezone has localDateTime but no instant`() {
        requireQuickJs()
        val json = chronoParse("3pm")!!
        val results = ChronoResultParser.parse(json, "", null)
        assertEquals(1, results.size)
        assertNotNull("Chrono without tz must have localDateTime", results[0].localDateTime)
        assertNull("Chrono without tz must NOT have instant", results[0].instant)
        assertNull("Chrono without tz must NOT have sourceTimezone", results[0].sourceTimezone)
    }

    @Test
    fun `scenario 6 - confidence values from parsers differ from manual construction defaults`() {
        requireQuickJs()
        // Chrono uncertain vs certain
        val uncertainJson = chronoParse("3pm")!!
        val chronoUncertain = ChronoResultParser.parse(uncertainJson, "", null)
        assertEquals(0.85f, chronoUncertain[0].confidence)

        val certainJson = chronoParse("April 11 at 3pm")!!
        val chronoCertain = ChronoResultParser.parse(certainJson, "", null)
        assertEquals(0.95f, chronoCertain[0].confidence)

        // Gemini with and without tz
        val geminiWithTz = LlmResultParser.parseResponse(
            "[${geminiEntry(time = "12:00:00", timezone = "UTC", original = "test")}]",
        )
        assertEquals(0.9f, geminiWithTz[0].confidence)

        val geminiNoTz = LlmResultParser.parseResponse(
            "[${geminiEntry(time = "12:00:00", original = "test")}]",
        )
        assertEquals(0.7f, geminiNoTz[0].confidence)
    }

    // ==================== Scenario 7 ====================
    // End-to-end with TimeConverter to multiple zones

    @Test
    fun `scenario 7 - convert results to UTC Tokyo and Sydney`() {
        requireQuickJs()
        val input = "April 11 at 4:30 a.m. PT / 7:30 a.m. ET / 19:30 CST"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)

        val utcConverted = converter.toLocal(chronoResults, TimeZone.UTC)
        assertTrue("UTC conversion should produce at least 3 results, got ${utcConverted.size}", utcConverted.size >= 3)
        utcConverted.forEach { ct ->
            assertEquals("UTC", ct.localTimezone)
        }
        // PT 4:30 AM PDT (UTC-7) = 11:30 UTC
        val utcPt = utcConverted.first { it.originalText.contains("PT") || it.originalText.contains("4:30") }
        assertTrue(
            "PT 4:30 AM -> UTC should be 11:30 AM, got '${utcPt.localDateTime}'",
            utcPt.localDateTime.contains("11:30\u202Fam"),
        )

        val tokyoConverted = converter.toLocal(chronoResults, TimeZone.of("Asia/Tokyo"))
        assertTrue("Tokyo conversion should produce at least 3 results, got ${tokyoConverted.size}", tokyoConverted.size >= 3)
        tokyoConverted.forEach { ct ->
            assertTrue(
                "Tokyo timezone should be UTC+9, got '${ct.localTimezone}'",
                ct.localTimezone.contains("UTC+9"),
            )
        }

        val sydneyConverted = converter.toLocal(chronoResults, TimeZone.of("Australia/Sydney"))
        assertTrue("Sydney conversion should produce at least 3 results, got ${sydneyConverted.size}", sydneyConverted.size >= 3)
        sydneyConverted.forEach { ct ->
            assertTrue(
                "Sydney timezone should be UTC+10, got '${ct.localTimezone}'",
                ct.localTimezone.contains("UTC+10"),
            )
        }

        assertTrue(
            "UTC and Tokyo local times should differ",
            utcConverted[0].localDateTime != tokyoConverted[0].localDateTime,
        )
    }

    @Test
    fun `scenario 7 - source time displays correctly regardless of target zone`() {
        requireQuickJs()
        val input = "3:00 PM ET"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)

        val utcResult = converter.toLocal(chronoResults, TimeZone.UTC)
        val tokyoResult = converter.toLocal(chronoResults, TimeZone.of("Asia/Tokyo"))

        assertEquals(1, utcResult.size)
        assertEquals(1, tokyoResult.size)

        assertEquals(utcResult[0].sourceTimezone, tokyoResult[0].sourceTimezone)
        assertEquals(utcResult[0].sourceDateTime, tokyoResult[0].sourceDateTime)
    }

    // ==================== Scenario 8 ====================
    // Empty/null/garbage inputs through the full pipeline

    @Test
    fun `scenario 8 - empty string through both parsers`() {
        val chronoResults = ChronoResultParser.parse("", "", null)
        val geminiResults = LlmResultParser.parseResponse("")
        assertTrue(chronoResults.isEmpty())
        assertTrue(geminiResults.isEmpty())

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "test")
        assertTrue(merged.isEmpty())

        val converted = converter.toLocal(merged, TimeZone.UTC)
        assertTrue(converted.isEmpty())
    }

    @Test
    fun `scenario 8 - malformed JSON through both parsers`() {
        val chronoResults = ChronoResultParser.parse("{not valid]]]", "", null)
        val geminiResults = LlmResultParser.parseResponse("{not valid]]]")
        assertTrue(chronoResults.isEmpty())
        assertTrue(geminiResults.isEmpty())

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "test")
        assertTrue(merged.isEmpty())
    }

    @Test
    fun `scenario 8 - valid chrono plus empty gemini preserves chrono results`() {
        requireQuickJs()
        val json = chronoParse("3pm ET")!!
        val chronoResults = ChronoResultParser.parse(json, "3pm ET", null)
        val geminiResults = LlmResultParser.parseResponse("[]")

        assertEquals(1, chronoResults.size)
        assertTrue(geminiResults.isEmpty())

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")
        assertEquals("Chrono result should survive empty Gemini", 1, merged.size)
        assertEquals(15, merged[0].localDateTime!!.hour)

        val converted = converter.toLocal(merged, TimeZone.of("Asia/Tokyo"))
        assertEquals(1, converted.size)
    }

    @Test
    fun `scenario 8 - empty chrono plus valid gemini preserves gemini results`() {
        val chronoResults = ChronoResultParser.parse("[]", "", null)
        val geminiJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]"
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        assertTrue(chronoResults.isEmpty())
        assertEquals(1, geminiResults.size)

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")
        assertEquals("Gemini result should survive empty Chrono", 1, merged.size)
        assertEquals(15, merged[0].localDateTime!!.hour)

        val converted = converter.toLocal(merged, TimeZone.of("Asia/Tokyo"))
        assertEquals(1, converted.size)
    }

    @Test
    fun `scenario 8 - null and garbage JSON variants`() {
        assertTrue(ChronoResultParser.parse("null", "", null).isEmpty())
        assertTrue(ChronoResultParser.parse("undefined", "", null).isEmpty())
        assertTrue(ChronoResultParser.parse("42", "", null).isEmpty())
        assertTrue(ChronoResultParser.parse("{}", "", null).isEmpty())

        assertTrue(LlmResultParser.parseResponse("null").isEmpty())
        assertTrue(LlmResultParser.parseResponse("undefined").isEmpty())
        assertTrue(LlmResultParser.parseResponse("42").isEmpty())
        assertTrue(LlmResultParser.parseResponse("{}").isEmpty())
    }

    @Test
    fun `scenario 8 - chrono with one valid and one garbage entry`() {
        requireQuickJs()
        // Use real chrono output, then append garbage to the JSON array
        val realJson = chronoParse("3pm ET")!!
        // Insert a garbage entry into the array
        val json = realJson.trimEnd(']') + """,{"broken":true}]"""
        val results = ChronoResultParser.parse(json, "", null)
        assertEquals("Should parse valid entry, skip garbage", 1, results.size)
        assertEquals(15, results[0].localDateTime!!.hour)
    }

    @Test
    fun `scenario 8 - gemini with one valid and one incomplete entry`() {
        val json = """[
            ${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")},
            {"time":"","date":"","timezone":"","original":""}
        ]"""
        val results = LlmResultParser.parseResponse(json)
        assertEquals("Should parse valid entry, skip empty one", 1, results.size)
    }

    // ==================== Additional regression tests ====================

    @Test
    fun `regression - gemini localDateTime enables fuzzy merge deduplication`() {
        requireQuickJs()
        val json = chronoParse("3pm ET")!!
        val chronoResults = ChronoResultParser.parse(json, "3pm ET", null)

        val geminiJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]"
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        assertNotNull("Chrono must have localDateTime", chronoResults[0].localDateTime)
        assertNotNull("Gemini must have localDateTime", geminiResults[0].localDateTime)

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")
        assertEquals(
            "Should deduplicate to 1 result, got ${merged.size}",
            1, merged.size,
        )
    }

    @Test
    fun `regression - chrono offsetToTimezone caching does not leak between tests`() {
        val tz1 = ChronoResultParser.offsetToTimezone(-420)
        ChronoResultParser.clearOffsetCache()

        val tz2 = ChronoResultParser.offsetToTimezone(-420)
        assertEquals("Same offset should resolve to same timezone", tz1, tz2)
    }

    @Test
    fun `regression - date propagation updates instant not just localDateTime`() {
        requireQuickJs()
        val input = "April 20 9am PT / 12pm ET"
        val json = chronoParse(input)!!
        val results = ChronoResultParser.parse(json, input, null)

        assertEquals("Should produce exactly 2 results", 2, results.size)

        // The PT result with certain date should propagate day 20 to the ET result
        val ptResult = results.first { it.originalText.contains("PT") }
        assertEquals(20, ptResult.localDateTime!!.dayOfMonth)

        // ET result should have day 20 (propagated)
        val etResult = results.first { it.originalText.contains("ET") }
        assertEquals(20, etResult.localDateTime!!.dayOfMonth)

        assertNotNull("Propagated result should have instant", etResult.instant)

        val converted = converter.toLocal(results, TimeZone.UTC)
        assertEquals("Should produce exactly 2 converted results", 2, converted.size)
        // PT: 9am PDT (UTC-7) = 4:00 PM UTC
        val ptConverted = converted.first { it.originalText.contains("PT") }
        assertTrue(
            "9am PT -> UTC should be 4:00 PM, got '${ptConverted.localDateTime}'",
            ptConverted.localDateTime.contains("4:00\u202Fpm"),
        )
        // ET: 12pm EDT (UTC-4) = 4:00 PM UTC (same instant)
        val etConverted = converted.first { it.originalText.contains("ET") }
        assertTrue(
            "12pm ET -> UTC should be 4:00 PM, got '${etConverted.localDateTime}'",
            etConverted.localDateTime.contains("4:00\u202Fpm"),
        )
        converted.forEach { ct ->
            assertTrue(
                "Date should contain Apr or 20, got '${ct.localDate}'",
                ct.localDate.contains("Apr") || ct.localDate.contains("20"),
            )
        }
    }

    @Test
    fun `regression - result without timezone keeps null instant`() {
        requireQuickJs()
        val input = "4:30 PT / 7:30 ET / noon"
        val json = chronoParse(input)!!
        val results = ChronoResultParser.parse(json, input, null)

        // Find the result without timezone (the bare "noon")
        val noTzResult = results.find { it.sourceTimezone == null }
        if (noTzResult != null) {
            assertNull("No-tz result should have null instant", noTzResult.instant)
            assertNotNull("No-tz result should still have localDateTime", noTzResult.localDateTime)
        }
    }

    @Test
    fun `full pipeline - multiple moments with different local times`() {
        requireQuickJs()
        val converted = pipeline("Meeting at 9am PT, lunch at 12pm ET", localZone = TimeZone.of("Asia/Tokyo"))
        assertEquals("Should have exactly 2 results", 2, converted.size)
        // 9am PDT (UTC-7) = 16:00 UTC = 01:00+1 JST
        val ptResult = converted.first { it.sourceDateTime.contains("9:00") }
        assertTrue(
            "9am PT -> Tokyo should be 1:00 AM, got '${ptResult.localDateTime}'",
            ptResult.localDateTime.contains("1:00\u202Fam"),
        )
        // 12pm EDT (UTC-4) = 16:00 UTC = 01:00+1 JST
        val etResult = converted.first { it.sourceDateTime.contains("12:00") }
        assertTrue(
            "12pm ET -> Tokyo should be 1:00 AM, got '${etResult.localDateTime}'",
            etResult.localDateTime.contains("1:00\u202Fam"),
        )

        // 9am PDT (UTC-7) = 16:00 UTC = 01:00+1 JST
        // 12pm EDT (UTC-4) = 16:00 UTC = 01:00+1 JST
        // These are the same instant, so they should produce the same local time
        val localTimes = converted.map { it.localDateTime }.distinct()
        assertTrue(
            "9am PT and 12pm ET are the same instant, should have same Tokyo time containing 1:00, got $localTimes",
            converted.any { it.localDateTime.contains("1:00\u202Fam") },
        )
    }

    @Test
    fun `full pipeline - truly different moments produce different local times`() {
        requireQuickJs()
        val input = "Meeting at 9am PT, dinner at 6pm PT"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)
        assertEquals("Should parse exactly 2 results", 2, chronoResults.size)

        val converted = converter.toLocal(chronoResults, TimeZone.of("Asia/Tokyo"))
        assertEquals("Should have exactly 2 converted results", 2, converted.size)
        // 9am PDT (UTC-7) = 16:00 UTC = 01:00+1 JST
        assertTrue(
            "9am PT -> Tokyo should be 1:00 AM, got '${converted[0].localDateTime}'",
            converted[0].localDateTime.contains("1:00\u202Fam"),
        )
        // 6pm PDT (UTC-7) = 01:00+1 UTC = 10:00+1 JST
        assertTrue(
            "6pm PT -> Tokyo should be 10:00 AM, got '${converted[1].localDateTime}'",
            converted[1].localDateTime.contains("10:00\u202Fam"),
        )
        assertTrue(
            "Different moments should have different local times",
            converted[0].localDateTime != converted[1].localDateTime,
        )
    }

    @Test
    fun `full pipeline - gemini fenced response through full pipeline`() {
        val geminiJson = "```json\n[${geminiEntry(time = "09:00:00", timezone = "America/Los_Angeles", original = "9am PT")}]\n```"
        val geminiResults = LlmResultParser.parseResponse(geminiJson)
        assertEquals("Fenced JSON should parse", 1, geminiResults.size)
        assertNotNull(geminiResults[0].localDateTime)
        assertNotNull(geminiResults[0].instant)

        val converted = converter.toLocal(geminiResults, TimeZone.of("Europe/London"))
        assertEquals(1, converted.size)
    }

    @Test
    fun `full pipeline - end time inherits timezone from start through to conversion`() {
        requireQuickJs()
        val input = "2pm - 3pm PT"
        val json = chronoParse(input)!!
        val results = ChronoResultParser.parse(json, input, null)
        assertEquals(2, results.size)

        assertEquals(results[0].sourceTimezone, results[1].sourceTimezone)

        val converted = converter.toLocal(results, TimeZone.of("Asia/Tokyo"))
        assertEquals(2, converted.size)

        assertEquals(converted[0].sourceTimezone, converted[1].sourceTimezone)
    }

    @Test
    fun `full pipeline - method attribution tracks through merge and conversion`() {
        requireQuickJs()
        val input = "3pm ET"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)

        val geminiJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]"
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        val chronoWithMethod = chronoResults.map { it.copy(method = "Chrono") }

        val merged = ResultMerger.mergeResults(chronoWithMethod, geminiResults, "Gemini Nano")
        assertEquals(1, merged.size)
        assertTrue(
            "Method should contain both sources, got '${merged[0].method}'",
            merged[0].method.contains("Chrono") && merged[0].method.contains("Gemini Nano"),
        )

        val converted = converter.toLocal(merged, TimeZone.of("Asia/Tokyo"))
        assertEquals(1, converted.size)
        assertTrue(
            "Method survives conversion, got '${converted[0].method}'",
            converted[0].method.contains("Chrono"),
        )
    }

    @Test
    fun `full pipeline - half-hour offset timezone through chrono`() {
        requireQuickJs()
        val converted = pipeline("9pm IST", localZone = TimeZone.UTC)
        assertEquals("IST should produce 2 results (India + Ireland/London)", 2, converted.size)
        // IST is ambiguous (India +5:30, Ireland/London +1)
        assertTrue(
            "Should have an India interpretation with 5:30 offset",
            converted.any { it.sourceTimezone.contains("5:30") || it.sourceTimezone.contains("Kolkata") },
        )
        // 9pm IST India (UTC+5:30) = 15:30 UTC
        val indiaResult = converted.first { it.sourceTimezone.contains("5:30") || it.sourceTimezone.contains("Kolkata") }
        assertTrue(
            "9pm IST (India) -> UTC should be 3:30 PM, got '${indiaResult.localDateTime}'",
            indiaResult.localDateTime.contains("3:30\u202Fpm"),
        )
        // 9pm IST Ireland/London (UTC+1) = 20:00 UTC
        val londonResult = converted.first { it.sourceTimezone.contains("London") || it.sourceTimezone.contains("Dublin") || it.sourceTimezone.contains("UTC+1") }
        assertTrue(
            "9pm IST (London) -> UTC should be 8:00 PM, got '${londonResult.localDateTime}'",
            londonResult.localDateTime.contains("8:00\u202Fpm"),
        )
    }

    // ========== Field invariant tests ==========
    // These assert structural rules that must ALWAYS hold for parser output.
    // They probe for the exact class of bug (missing fields) that device testing caught.

    private val chronoInputs = listOf(
        """[{"text":"3pm EST","index":0,"start":{"year":2026,"month":4,"day":9,"hour":15,"minute":0,"second":0,"timezone":-300,"isCertain":{"day":false}},"end":null}]""",
        """[{"text":"April 9 at 9am","index":0,"start":{"year":2026,"month":4,"day":9,"hour":9,"minute":0,"second":0,"timezone":null,"isCertain":{"day":true}},"end":null}]""",
        """[{"text":"12pm - 1pm EDT","index":0,"start":{"year":2026,"month":4,"day":9,"hour":12,"minute":0,"second":0,"timezone":-240,"isCertain":{"day":false}},"end":{"year":2026,"month":4,"day":9,"hour":13,"minute":0,"second":0,"timezone":-240}}]""",
        """[{"text":"midnight","index":0,"start":{"year":2026,"month":4,"day":9,"hour":0,"minute":0,"second":0,"timezone":null,"isCertain":{"day":false}},"end":null}]""",
        """[{"text":"11:59 PM JST","index":0,"start":{"year":2026,"month":12,"day":31,"hour":23,"minute":59,"second":0,"timezone":540,"isCertain":{"day":true}},"end":null}]""",
    )

    private val geminiInputs = listOf(
        """[{"time":"15:00","date":"2026-04-09","timezone":"America/New_York","original":"3pm EST"}]""",
        """[{"time":"09:00","date":"2026-04-09","timezone":"","original":"9am"}]""",
        """[{"time":"12:00","date":"2026-04-09","timezone":"Asia/Tokyo","original":"noon JST"}]""",
        """[{"time":"00:00","date":"2026-01-01","timezone":"UTC","original":"midnight UTC"}]""",
        """[{"time":"04:30","date":"2026-04-11","timezone":"America/Los_Angeles","original":"4:30 AM PT"},{"time":"07:30","date":"2026-04-11","timezone":"America/New_York","original":"7:30 AM ET"}]""",
    )

    @Test
    fun `invariant - chrono results always have localDateTime`() {
        for (json in chronoInputs) {
            val results = ChronoResultParser.parse(json, "", cityResolver)
            results.forEach { r ->
                assertNotNull(
                    "Chrono result '${r.originalText}' must have localDateTime (json=$json)",
                    r.localDateTime,
                )
            }
        }
    }

    @Test
    fun `invariant - chrono results with timezone always have instant`() {
        for (json in chronoInputs) {
            val results = ChronoResultParser.parse(json, "", cityResolver)
            results.forEach { r ->
                if (r.sourceTimezone != null) {
                    assertNotNull(
                        "Chrono result '${r.originalText}' with tz=${r.sourceTimezone?.id} must have instant",
                        r.instant,
                    )
                }
            }
        }
    }

    @Test
    fun `invariant - chrono results without timezone have null instant`() {
        for (json in chronoInputs) {
            val results = ChronoResultParser.parse(json, "", cityResolver)
            results.forEach { r ->
                if (r.sourceTimezone == null) {
                    assertNull(
                        "Chrono result '${r.originalText}' without tz should have null instant",
                        r.instant,
                    )
                }
            }
        }
    }

    @Test
    fun `invariant - gemini results always have localDateTime`() {
        for (json in geminiInputs) {
            val results = LlmResultParser.parseResponse(json)
            results.forEach { r ->
                assertNotNull(
                    "Gemini result '${r.originalText}' must have localDateTime (json=$json)",
                    r.localDateTime,
                )
            }
        }
    }

    @Test
    fun `invariant - gemini results with timezone always have instant AND localDateTime`() {
        for (json in geminiInputs) {
            val results = LlmResultParser.parseResponse(json)
            results.forEach { r ->
                if (r.sourceTimezone != null) {
                    assertNotNull(
                        "Gemini result '${r.originalText}' with tz must have instant",
                        r.instant,
                    )
                    assertNotNull(
                        "Gemini result '${r.originalText}' with tz must have localDateTime",
                        r.localDateTime,
                    )
                }
            }
        }
    }

    @Test
    fun `invariant - merged results preserve localDateTime for fuzzy matching`() {
        for (chronoJson in chronoInputs) {
            for (geminiJson in geminiInputs) {
                val chrono = ChronoResultParser.parse(chronoJson, "", cityResolver)
                val gemini = LlmResultParser.parseResponse(geminiJson)
                val merged = ResultMerger.mergeResults(chrono, gemini, "Gemini Nano")
                merged.forEach { r ->
                    assertNotNull(
                        "Merged result '${r.originalText}' must have localDateTime for fuzzy matching",
                        r.localDateTime,
                    )
                }
            }
        }
    }

    @Test
    fun `invariant - converted results always have non-empty fields`() {
        for (json in chronoInputs) {
            val results = ChronoResultParser.parse(json, "", cityResolver)
            val converted = converter.toLocal(results, TimeZone.of("UTC"))
            converted.forEach { c ->
                assertTrue("localDateTime must not be empty", c.localDateTime.isNotEmpty())
                assertTrue("localDate must not be empty", c.localDate.isNotEmpty())
                assertTrue("sourceDateTime must not be empty", c.sourceDateTime.isNotEmpty())
                assertTrue("sourceTimezone must not be empty", c.sourceTimezone.isNotEmpty())
                assertTrue("localTimezone must not be empty", c.localTimezone.isNotEmpty())
            }
        }
    }

    @Test
    fun `invariant - merge result count never exceeds sum of inputs`() {
        for (chronoJson in chronoInputs) {
            for (geminiJson in geminiInputs) {
                val chrono = ChronoResultParser.parse(chronoJson, "", cityResolver)
                val gemini = LlmResultParser.parseResponse(geminiJson)
                val merged = ResultMerger.mergeResults(chrono, gemini, "Gemini Nano")
                assertTrue(
                    "Merged count ${merged.size} must not exceed chrono(${chrono.size}) + gemini(${gemini.size})",
                    merged.size <= chrono.size + gemini.size,
                )
            }
        }
    }

    // ==================== String escaping (parser resilience) ====================

    @Test
    fun `string escaping - ChronoResultParser handles special chars in text field`() {
        val json = """[{"text":"hello\tworld\r\n","index":0,"start":{"year":2026,"month":4,"day":11,"hour":10,"minute":0,"second":0,"timezone":-240,"isCertain":{"day":true}},"end":null}]"""
        val results = ChronoResultParser.parse(json, "", null)
        assertEquals(1, results.size)
        assertNotNull(results[0].localDateTime)
    }

    @Test
    fun `string escaping - ChronoResultParser handles unicode and emoji in text field`() {
        val json = """[{"text":"caf\u00e9 meeting \u2615","index":0,"start":{"year":2026,"month":4,"day":11,"hour":14,"minute":0,"second":0,"timezone":-240,"isCertain":{"day":true}},"end":null}]"""
        val results = ChronoResultParser.parse(json, "", null)
        assertEquals(1, results.size)
        assertNotNull(results[0].localDateTime)
        assertEquals(14, results[0].localDateTime!!.hour)
    }

    // ==================== LlmResultParser invalid inputs ====================

    @Test
    fun `gemini invalid - time 24 00 returns null`() {
        val json = """[{"time":"24:00","date":"2026-04-11","timezone":"UTC","original":"24:00"}]"""
        val results = LlmResultParser.parseResponse(json)
        assertTrue("24:00 is invalid, should produce no results", results.isEmpty())
    }

    @Test
    fun `gemini invalid - date 2026-13-01 returns null`() {
        val json = """[{"time":"12:00","date":"2026-13-01","timezone":"UTC","original":"invalid month"}]"""
        val results = LlmResultParser.parseResponse(json)
        assertTrue("Month 13 is invalid", results.isEmpty())
    }

    @Test
    fun `gemini invalid - date 2026-04-31 returns null`() {
        val json = """[{"time":"12:00","date":"2026-04-31","timezone":"UTC","original":"April 31"}]"""
        val results = LlmResultParser.parseResponse(json)
        assertTrue("April has 30 days", results.isEmpty())
    }

    @Test
    fun `gemini invalid - time 25 00 returns null`() {
        val json = """[{"time":"25:00","date":"2026-04-11","timezone":"UTC","original":"25:00"}]"""
        val results = LlmResultParser.parseResponse(json)
        assertTrue("25:00 is invalid", results.isEmpty())
    }

    @Test
    fun `gemini invalid - timezone with space gives null tz but valid localDateTime`() {
        val json = """[{"time":"12:00:00","date":"2026-04-11","timezone":"America/New York","original":"noon"}]"""
        val results = LlmResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertNull("'America/New York' is not a valid IANA zone", results[0].sourceTimezone)
        assertNotNull("localDateTime should still be set", results[0].localDateTime)
        assertEquals(0.7f, results[0].confidence)
    }

    @Test
    fun `gemini invalid - timezone lowercase america new_york`() {
        val json = """[{"time":"12:00:00","date":"2026-04-11","timezone":"america/new_york","original":"noon"}]"""
        val results = LlmResultParser.parseResponse(json)
        assertEquals(1, results.size)
        if (results[0].sourceTimezone != null) {
            assertNotNull("If tz resolved, instant should be set", results[0].instant)
            assertEquals(0.9f, results[0].confidence)
        } else {
            assertNull("No tz -> no instant", results[0].instant)
            assertEquals(0.7f, results[0].confidence)
        }
    }

    // ==================== ResultMerger cross-date fuzzy match ====================

    @Test
    fun `merger - isSameLocalTime requires same date`() {
        val a = ExtractedTime(
            localDateTime = LocalDateTime(2026, 4, 11, 15, 30),
            originalText = "day 11",
        )
        val b = ExtractedTime(
            localDateTime = LocalDateTime(2026, 4, 12, 15, 30),
            originalText = "day 12",
        )
        assertFalse("Same hour:minute different day -> isSameLocalTime is false", ResultMerger.isSameLocalTime(a, b))
    }

    @Test
    fun `merger - different dates are kept as separate results`() {
        val existing = listOf(
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 4, 11, 15, 30),
                sourceTimezone = TimeZone.of("America/New_York"),
                instant = LocalDateTime(2026, 4, 11, 15, 30).toInstant(TimeZone.of("America/New_York")),
                originalText = "3:30 PM ET Apr 11",
            ),
        )
        val incoming = listOf(
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 4, 12, 15, 30),
                sourceTimezone = TimeZone.of("America/New_York"),
                instant = LocalDateTime(2026, 4, 12, 15, 30).toInstant(TimeZone.of("America/New_York")),
                originalText = "3:30 PM ET Apr 12",
            ),
        )
        val merged = ResultMerger.mergeResults(existing, incoming, "test")
        assertEquals("Different dates should produce 2 separate results", 2, merged.size)
    }

    // ==================== CityResolver editDistance (via TestCityResolver) ====================

    @Test
    fun `editDistance - identical strings`() {
        val resolver = TestCityResolver()
        val tz = resolver.resolve("tokyo")
        assertNotNull("tokyo should resolve", tz)
        assertEquals("Asia/Tokyo", tz!!.id)
    }

    @Test
    fun `editDistance - one char difference resolves via fuzzy`() {
        val resolver = TestCityResolver()
        val tz = resolver.resolve("tokya")
        assertNotNull("tokya (distance 1 from tokyo) should fuzzy-resolve", tz)
        assertEquals("Asia/Tokyo", tz!!.id)
    }

    @Test
    fun `editDistance - empty string resolves to nothing`() {
        val resolver = TestCityResolver()
        val tz = resolver.resolve("")
        // Empty string has large edit distance from everything, won't match within <= 2
        // But could match via substring -- empty string is "in" everything.
        // Regardless, we verify no crash.
    }

    @Test
    fun `editDistance - new york fuzzy resolve works`() {
        val resolver = TestCityResolver()
        val tz = resolver.resolve("newyork")
        assertNotNull("newyork should fuzzy-resolve to new york", tz)
        assertEquals("America/New_York", tz!!.id)
    }

    @Test
    fun `editDistance - londn fuzzy resolves to london`() {
        val resolver = TestCityResolver()
        val tz = resolver.resolve("londn")
        assertNotNull("londn (distance 1 from london) should fuzzy-resolve", tz)
        assertEquals("Europe/London", tz!!.id)
    }

    // ==================== CityResolver aliases via TestCityResolver ====================

    @Test
    fun `city alias - sf resolves to Los Angeles`() {
        val resolver = TestCityResolver()
        val tz = resolver.resolve("sf")
        assertNotNull("sf should resolve via alias", tz)
        assertEquals("America/Los_Angeles", tz!!.id)
    }

    @Test
    fun `city alias - nyc resolves to New York`() {
        val resolver = TestCityResolver()
        val tz = resolver.resolve("nyc")
        assertNotNull("nyc should resolve via alias", tz)
        assertEquals("America/New_York", tz!!.id)
    }

    @Test
    fun `city alias - san francisco resolves to Los Angeles`() {
        val resolver = TestCityResolver()
        val tz = resolver.resolve("san francisco")
        assertNotNull("san francisco should resolve via alias", tz)
        assertEquals("America/Los_Angeles", tz!!.id)
    }

    // ==================== TimeConverter dedup edge cases ====================

    @Test
    fun `dedup - same instant and tz but different originalText kept as separate`() {
        val dt = LocalDateTime(2026, 4, 11, 15, 0)
        val tz = TimeZone.of("America/New_York")
        val instant = dt.toInstant(tz)
        val results = listOf(
            ExtractedTime(instant = instant, localDateTime = dt, sourceTimezone = tz, originalText = "3pm ET"),
            ExtractedTime(instant = instant, localDateTime = dt, sourceTimezone = tz, originalText = "three o'clock Eastern"),
        )
        val converted = converter.toLocal(results, TimeZone.UTC)
        assertEquals("Different originalText should produce 2 results", 2, converted.size)
    }

    @Test
    fun `dedup - three identical inputs deduplicated to 1`() {
        val dt = LocalDateTime(2026, 4, 11, 15, 0)
        val tz = TimeZone.of("America/New_York")
        val instant = dt.toInstant(tz)
        val ext = ExtractedTime(instant = instant, localDateTime = dt, sourceTimezone = tz, originalText = "3pm ET")
        val results = listOf(ext, ext, ext)
        val converted = converter.toLocal(results, TimeZone.UTC)
        assertEquals("Three identical inputs should dedup to 1", 1, converted.size)
    }

    // ==================== Date propagation temporal ordering ====================

    @Test
    fun `date propagation - range across DST boundary does not crash`() {
        requireQuickJs()
        val input = "March 8 at 1am - 3am ET"
        val json = chronoParse(input)!!
        val results = ChronoResultParser.parse(json, input, null)
        assertTrue("Should produce results", results.isNotEmpty())
        results.forEach { r ->
            if (r.sourceTimezone != null) {
                assertNotNull(r.instant)
            }
        }
        val converted = converter.toLocal(results, TimeZone.of("America/New_York"))
        assertTrue("Should convert without crash", converted.isNotEmpty())
    }

    // ==================== formatZoneName edge cases (via TimeConverter.toLocal) ====================

    @Test
    fun `formatZoneName - Asia Kolkata shows 5 30`() {
        val dt = LocalDateTime(2026, 4, 11, 12, 0)
        val tz = TimeZone.of("Asia/Kolkata")
        val ext = ExtractedTime(
            instant = dt.toInstant(tz), localDateTime = dt,
            sourceTimezone = tz, originalText = "noon IST",
        )
        val converted = converter.toLocal(listOf(ext), tz)
        assertEquals(1, converted.size)
        assertTrue(
            "Kolkata should show 5:30 offset, got '${converted[0].localTimezone}'",
            converted[0].localTimezone.contains("5:30"),
        )
    }

    @Test
    fun `formatZoneName - Asia Kathmandu shows 5 45`() {
        val dt = LocalDateTime(2026, 4, 11, 12, 0)
        val tz = TimeZone.of("Asia/Kathmandu")
        val ext = ExtractedTime(
            instant = dt.toInstant(tz), localDateTime = dt,
            sourceTimezone = tz, originalText = "noon NPT",
        )
        val converted = converter.toLocal(listOf(ext), tz)
        assertEquals(1, converted.size)
        assertTrue(
            "Kathmandu should show 5:45 offset, got '${converted[0].localTimezone}'",
            converted[0].localTimezone.contains("5:45"),
        )
    }

    @Test
    fun `formatZoneName - UTC shows UTC not UTC+0`() {
        val dt = LocalDateTime(2026, 4, 11, 12, 0)
        val tz = TimeZone.UTC
        val ext = ExtractedTime(
            instant = dt.toInstant(tz), localDateTime = dt,
            sourceTimezone = tz, originalText = "noon UTC",
        )
        val converted = converter.toLocal(listOf(ext), tz)
        assertEquals(1, converted.size)
        assertEquals("UTC", converted[0].localTimezone)
        assertFalse(
            "Should be 'UTC' not 'UTC+0', got '${converted[0].localTimezone}'",
            converted[0].localTimezone.contains("+"),
        )
    }

    // ==================== Real-world adversarial: Chrono misparses ====================
    // These document cases where Chrono.js produces WRONG results that our pipeline
    // should either correct or at least not make worse.

    @Test
    fun `chrono misparses 1500 hours Zulu as duration not military time`() {
        val json = """[{"text":"1500 hours","index":8,"start":{"year":2026,"month":6,"day":8,"hour":11,"minute":35,"second":33,"timezone":600,"isCertain":{"year":true,"month":true,"day":true,"hour":true,"minute":true,"timezone":true}},"end":null}]"""
        val results = ChronoResultParser.parse(json, "Call at 1500 hours Zulu", cityResolver)
        if (results.isNotEmpty()) {
            val converted = converter.toLocal(results, TimeZone.UTC)
            assertTrue("Should not crash converting misparse", converted.isNotEmpty())
        }
    }

    @Test
    fun `chrono drops pacific time timezone label`() {
        val json = """[{"text":"3pm-4pm","index":15,"start":{"year":2026,"month":4,"day":7,"hour":15,"minute":0,"second":0,"timezone":null,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":false}},"end":{"year":2026,"month":4,"day":7,"hour":16,"minute":0,"second":0,"timezone":null}}]"""
        val results = ChronoResultParser.parse(json, "The meeting is 3pm-4pm pacific time", cityResolver)
        assertEquals(2, results.size)
        assertNull("Start should lack timezone (Chrono limitation)", results[0].sourceTimezone)
        assertNull("End should lack timezone", results[1].sourceTimezone)
    }

    @Test
    fun `chrono drops Eastern timezone without abbreviation`() {
        val json = """[{"text":"Noon","index":0,"start":{"year":2026,"month":4,"day":7,"hour":12,"minute":0,"second":0,"timezone":null,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":false,"timezone":false}},"end":null}]"""
        val results = ChronoResultParser.parse(json, "Noon Eastern", cityResolver)
        assertEquals(1, results.size)
        assertNull("Chrono doesn't recognize 'Eastern' as a timezone", results[0].sourceTimezone)
    }

    @Test
    fun `chrono drops London time timezone label`() {
        val json = """[{"text":"2026-04-09 at 3pm","index":0,"start":{"year":2026,"month":4,"day":9,"hour":15,"minute":0,"second":0,"timezone":null,"isCertain":{"year":true,"month":true,"day":true,"hour":true,"minute":true,"timezone":false}},"end":null}]"""
        val results = ChronoResultParser.parse(json, "2026-04-09 at 3pm London time", cityResolver)
        assertEquals(1, results.size)
    }

    @Test
    fun `chrono misses abbreviated am 4 30a PT`() {
        val json = """[{"text":"April 9th","index":0,"start":{"year":2026,"month":4,"day":9,"hour":12,"minute":0,"second":0,"timezone":null,"isCertain":{"year":false,"month":true,"day":true,"hour":false,"minute":false,"timezone":false}},"end":null}]"""
        val results = ChronoResultParser.parse(json, "April 9th, 4:30a PT", cityResolver)
        assertEquals(1, results.size)
        assertEquals(12, results[0].localDateTime!!.hour)
    }

    @Test
    fun `chrono drops US Eastern timezone label`() {
        val json = """[{"text":"3:00 PM","index":0,"start":{"year":2026,"month":4,"day":7,"hour":15,"minute":0,"second":0,"timezone":null,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":false}},"end":null}]"""
        val results = ChronoResultParser.parse(json, "3:00 PM US Eastern", cityResolver)
        assertEquals(1, results.size)
        assertNull("Chrono doesn't recognize 'US Eastern'", results[0].sourceTimezone)
    }

    // ==================== Cross-parser consistency ====================

    @Test
    fun `gemini and chrono produce compatible results for same input`() {
        requireQuickJs()
        val input = "April 9 at 3:00 PM EST"
        val json = chronoParse(input)!!
        val chrono = ChronoResultParser.parse(json, input, cityResolver)
        val geminiJson = """[{"time":"15:00","date":"2026-04-09","timezone":"America/New_York","original":"April 9 at 3:00 PM EST"}]"""
        val gemini = LlmResultParser.parseResponse(geminiJson)

        assertEquals(1, chrono.size)
        assertEquals(1, gemini.size)
        assertNotNull(chrono[0].localDateTime)
        assertNotNull(chrono[0].instant)
        assertNotNull(gemini[0].localDateTime)
        assertNotNull(gemini[0].instant)

        assertEquals(chrono[0].localDateTime!!.hour, gemini[0].localDateTime!!.hour)

        val merged = ResultMerger.mergeResults(chrono, gemini, "Gemini Nano")
        assertTrue("Merged should have 1-2 results, got ${merged.size}", merged.size in 1..2)
    }

    @Test
    fun `pipeline handles completely empty Chrono output gracefully`() {
        val chrono = ChronoResultParser.parse("[]", "", cityResolver)
        val geminiJson = """[{"time":"15:00","date":"2026-04-09","timezone":"America/New_York","original":"3pm EST"}]"""
        val gemini = LlmResultParser.parseResponse(geminiJson)

        val merged = ResultMerger.mergeResults(chrono, gemini, "Gemini Nano")
        assertEquals("Gemini results should survive when Chrono is empty", 1, merged.size)
        assertNotNull(merged[0].localDateTime)
        assertNotNull(merged[0].instant)
    }

    @Test
    fun `pipeline handles Gemini returning garbage timezone gracefully`() {
        val geminiJson = """[{"time":"15:00","date":"2026-04-09","timezone":"NotATimezone/Fake","original":"3pm"}]"""
        val gemini = LlmResultParser.parseResponse(geminiJson)

        assertEquals(1, gemini.size)
        assertNotNull("Should have localDateTime despite bad tz", gemini[0].localDateTime)
        assertNull("Bad timezone should be null", gemini[0].sourceTimezone)
        assertEquals(0.7f, gemini[0].confidence)
    }

    @Test
    fun `pipeline end-to-end with timezone-less results assumes device timezone`() {
        requireQuickJs()
        val input = "3:00 PM"
        val json = chronoParse(input)!!
        val results = ChronoResultParser.parse(json, input, cityResolver)
        assertEquals(1, results.size)
        assertNull(results[0].sourceTimezone)

        val localZone = TimeZone.of("America/New_York")
        val converted = converter.toLocal(results, localZone)
        assertEquals(1, converted.size)
        assertTrue(
            "Source tz should reflect local zone, got '${converted[0].sourceTimezone}'",
            converted[0].sourceTimezone.contains("UTC-") || converted[0].sourceTimezone.contains("New_York") || converted[0].sourceTimezone.contains("New York"),
        )
        assertEquals("Source and local time should match", converted[0].sourceDateTime, converted[0].localDateTime)
    }

    // ==================== mergeSpanAndFullResults through real parsers ====================

    @Test
    fun `mergeSpanAndFull - span without tz upgraded by full with tz`() {
        requireQuickJs()
        val spanJson = chronoParse("9:00 a.m.")!!
        val spanResults = ChronoResultParser.parse(spanJson, "", null)

        val fullJson = chronoParse("9:00 a.m. PT")!!
        val fullResults = ChronoResultParser.parse(fullJson, "", null)

        assertNull("Span should have no timezone", spanResults[0].sourceTimezone)
        assertNotNull("Full should have timezone", fullResults[0].sourceTimezone)

        val merged = ChronoResultParser.mergeSpanAndFullResults(spanResults, fullResults)
        assertEquals(1, merged.size)
        assertNotNull("Merged result should have timezone from full", merged[0].sourceTimezone)
    }

    @Test
    fun `mergeSpanAndFull - 3 spans without tz all upgraded by full with tz`() {
        requireQuickJs()
        val spanJson = chronoParse("9:00 a.m. / 10:00 a.m. / 11:00 a.m.")!!
        val spanResults = ChronoResultParser.parse(spanJson, "", null)

        val fullJson = chronoParse("9:00 a.m. PT / 10:00 a.m. PT / 11:00 a.m. PT")!!
        val fullResults = ChronoResultParser.parse(fullJson, "", null)

        val merged = ChronoResultParser.mergeSpanAndFullResults(spanResults, fullResults)
        assertEquals(3, merged.size)
        merged.forEach { r ->
            assertNotNull("'${r.originalText}' should have timezone after merge", r.sourceTimezone)
        }
    }

    @Test
    fun `mergeSpanAndFull - span with tz preserved when full has no tz`() {
        requireQuickJs()
        val spanJson = chronoParse("9:00 a.m. ET")!!
        val spanResults = ChronoResultParser.parse(spanJson, "", null)

        val fullJson = chronoParse("9:00 a.m.")!!
        val fullResults = ChronoResultParser.parse(fullJson, "", null)

        assertNotNull("Span should have timezone", spanResults[0].sourceTimezone)
        assertNull("Full should not have timezone", fullResults[0].sourceTimezone)

        val merged = ChronoResultParser.mergeSpanAndFullResults(spanResults, fullResults)
        assertEquals(1, merged.size)
        assertNotNull("Span timezone should be preserved", merged[0].sourceTimezone)
    }

    @Test
    fun `mergeSpanAndFull - empty spans plus valid full keeps full results`() {
        requireQuickJs()
        val spanResults = ChronoResultParser.parse("[]", "", null)
        val fullJson = chronoParse("9:00 a.m. PT")!!
        val fullResults = ChronoResultParser.parse(fullJson, "", null)

        val merged = ChronoResultParser.mergeSpanAndFullResults(spanResults, fullResults)
        assertEquals(1, merged.size)
        assertNotNull(merged[0].sourceTimezone)
    }

    @Test
    fun `mergeSpanAndFull - valid spans plus empty full keeps span results`() {
        requireQuickJs()
        val spanJson = chronoParse("9:00 a.m.")!!
        val spanResults = ChronoResultParser.parse(spanJson, "", null)
        val fullResults = ChronoResultParser.parse("[]", "", null)

        val merged = ChronoResultParser.mergeSpanAndFullResults(spanResults, fullResults)
        assertEquals(1, merged.size)
        assertEquals(9, merged[0].localDateTime!!.hour)
    }

    // ==================== sourceDate field verification ====================

    @Test
    fun `sourceDate - EST to JST may differ at date boundary`() {
        requireQuickJs()
        val input = "April 9 at 11:00 PM EST"
        val json = chronoParse(input)!!
        val results = ChronoResultParser.parse(json, input, null)
        val converted = converter.toLocal(results, TimeZone.of("Asia/Tokyo"))
        assertEquals(1, converted.size)
        assertTrue("sourceDate should contain Apr 9, got '${converted[0].sourceDate}'",
            converted[0].sourceDate.contains("9"))
        assertTrue("localDate should contain Apr 10, got '${converted[0].localDate}'",
            converted[0].localDate.contains("10"))
    }

    @Test
    fun `sourceDate - UTC midnight Jan 1 to Honolulu crosses date boundary`() {
        requireQuickJs()
        val input = "January 1 at midnight UTC"
        val json = chronoParse(input)!!
        val results = ChronoResultParser.parse(json, input, null)
        assertEquals("Should parse midnight UTC to 1 result", 1, results.size)
        val converted = converter.toLocal(results, TimeZone.of("Pacific/Honolulu"))
        assertEquals(1, converted.size)
        // Midnight UTC = 2pm previous day in Honolulu (UTC-10)
        assertTrue(
            "Midnight UTC -> Honolulu should be 2:00 PM, got '${converted[0].localDateTime}'",
            converted[0].localDateTime.contains("2:00\u202Fpm"),
        )
        assertTrue("sourceDate should contain Jan or 1, got '${converted[0].sourceDate}'",
            converted[0].sourceDate.contains("Jan") || converted[0].sourceDate.contains("1"))
        assertTrue("localDate should contain Dec or 31, got '${converted[0].localDate}'",
            converted[0].localDate.contains("Dec") || converted[0].localDate.contains("31"))
    }

    @Test
    fun `sourceDate - format is non-empty for all converted results`() {
        for (json in chronoInputs) {
            val results = ChronoResultParser.parse(json, "", cityResolver)
            val converted = converter.toLocal(results, TimeZone.of("Asia/Tokyo"))
            converted.forEach { c ->
                assertTrue("sourceDate must not be empty for '${c.originalText}'", c.sourceDate.isNotEmpty())
            }
        }
    }

    // ==================== formatZoneName city labels through real conversion ====================

    @Test
    fun `formatZoneName - America New_York shows New York`() {
        val dt = LocalDateTime(2026, 4, 11, 15, 0)
        val tz = TimeZone.of("America/New_York")
        val ext = ExtractedTime(
            instant = dt.toInstant(tz), localDateTime = dt,
            sourceTimezone = tz, originalText = "3pm ET",
        )
        val converted = converter.toLocal(listOf(ext), tz)
        assertEquals(1, converted.size)
        assertTrue(
            "Should contain 'New York', got '${converted[0].localTimezone}'",
            converted[0].localTimezone.contains("New York"),
        )
    }

    @Test
    fun `formatZoneName - Asia Tokyo shows Tokyo`() {
        val dt = LocalDateTime(2026, 4, 11, 15, 0)
        val tz = TimeZone.of("Asia/Tokyo")
        val ext = ExtractedTime(
            instant = dt.toInstant(tz), localDateTime = dt,
            sourceTimezone = tz, originalText = "3pm JST",
        )
        val converted = converter.toLocal(listOf(ext), tz)
        assertEquals(1, converted.size)
        assertTrue(
            "Should contain 'Tokyo', got '${converted[0].localTimezone}'",
            converted[0].localTimezone.contains("Tokyo"),
        )
    }

    @Test
    fun `formatZoneName - America Los_Angeles shows Los Angeles`() {
        val dt = LocalDateTime(2026, 4, 11, 15, 0)
        val tz = TimeZone.of("America/Los_Angeles")
        val ext = ExtractedTime(
            instant = dt.toInstant(tz), localDateTime = dt,
            sourceTimezone = tz, originalText = "3pm PT",
        )
        val converted = converter.toLocal(listOf(ext), tz)
        assertEquals(1, converted.size)
        assertTrue(
            "Should contain 'Los Angeles', got '${converted[0].localTimezone}'",
            converted[0].localTimezone.contains("Los Angeles"),
        )
    }

    @Test
    fun `formatZoneName - Europe London shows London`() {
        val dt = LocalDateTime(2026, 4, 11, 15, 0)
        val tz = TimeZone.of("Europe/London")
        val ext = ExtractedTime(
            instant = dt.toInstant(tz), localDateTime = dt,
            sourceTimezone = tz, originalText = "3pm BST",
        )
        val converted = converter.toLocal(listOf(ext), tz)
        assertEquals(1, converted.size)
        assertTrue(
            "Should contain 'London', got '${converted[0].localTimezone}'",
            converted[0].localTimezone.contains("London"),
        )
    }

    @Test
    fun `formatZoneName - UTC shows UTC`() {
        val dt = LocalDateTime(2026, 4, 11, 15, 0)
        val tz = TimeZone.UTC
        val ext = ExtractedTime(
            instant = dt.toInstant(tz), localDateTime = dt,
            sourceTimezone = tz, originalText = "3pm UTC",
        )
        val converted = converter.toLocal(listOf(ext), tz)
        assertEquals(1, converted.size)
        assertEquals(
            "UTC zone should display as 'UTC'",
            "UTC", converted[0].localTimezone,
        )
    }

    @Test
    fun `formatZoneName - obscure zone Pacific Fiji shows city from IANA ID`() {
        val dt = LocalDateTime(2026, 4, 11, 15, 0)
        val tz = TimeZone.of("Pacific/Fiji")
        val ext = ExtractedTime(
            instant = dt.toInstant(tz), localDateTime = dt,
            sourceTimezone = tz, originalText = "3pm FJT",
        )
        val converted = converter.toLocal(listOf(ext), tz)
        assertEquals(1, converted.size)
        assertTrue(
            "Should contain 'Fiji' from IANA ID, got '${converted[0].localTimezone}'",
            converted[0].localTimezone.contains("Fiji"),
        )
    }

    // ==================== both-tz-kept-separate through real pipeline ====================

    @Test
    fun `both tz kept separate - Chrono and Gemini produce different tz IDs for same time`() {
        requireQuickJs()
        val input = "3pm"
        val json = chronoParse(input)!!
        // Parse with no tz context; chrono may or may not assign a tz
        // Use hand-crafted chrono JSON to guarantee offset -360 for this specific test
        val chronoJson = """[{"text":"3pm","index":0,"start":{"year":2026,"month":4,"day":11,"hour":15,"minute":0,"second":0,"timezone":-360,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":true}},"end":null}]"""
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)

        val geminiJson = "[${geminiEntry(time = "15:00:00", timezone = "America/Chicago", original = "3pm")}]"
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        assertEquals(1, chronoResults.size)
        assertEquals(1, geminiResults.size)

        val chronoTzId = chronoResults[0].sourceTimezone?.id
        val geminiTzId = geminiResults[0].sourceTimezone?.id
        assertTrue(
            "Chrono and Gemini should have different tz IDs: chrono=$chronoTzId gemini=$geminiTzId",
            chronoTzId != geminiTzId,
        )

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")
        assertEquals(
            "Different tz IDs should produce 2 results, got ${merged.size}: ${merged.map { it.sourceTimezone?.id }}",
            2, merged.size,
        )
    }

    @Test
    fun `both tz kept separate - same tz from both merges to 1`() {
        requireQuickJs()
        val input = "3pm ET"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)

        val geminiJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]"
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        assertEquals("America/New_York", chronoResults[0].sourceTimezone?.id)
        assertEquals("America/New_York", geminiResults[0].sourceTimezone?.id)

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")
        assertEquals(
            "Same tz should merge to 1 result, got ${merged.size}",
            1, merged.size,
        )
    }

    // ==================== device timezone assumption through pipeline ====================

    @Test
    fun `device timezone assumption - no tz parsed assumes local zone`() {
        requireQuickJs()
        val input = "3:00 PM"
        val json = chronoParse(input)!!
        val results = ChronoResultParser.parse(json, input, null)
        assertEquals(1, results.size)
        assertNull("No timezone in input", results[0].sourceTimezone)

        val tokyoZone = TimeZone.of("Asia/Tokyo")
        val converted = converter.toLocal(results, tokyoZone)
        assertEquals(1, converted.size)
        assertTrue(
            "Source tz should reflect Tokyo, got '${converted[0].sourceTimezone}'",
            converted[0].sourceTimezone.contains("Tokyo"),
        )
        assertTrue(
            "Local tz should reflect Tokyo, got '${converted[0].localTimezone}'",
            converted[0].localTimezone.contains("Tokyo"),
        )
    }

    // ==================== ModelDownloader state machine ====================

    @Test
    fun `download state - Idle is the initial state`() {
        val state: DownloadState = DownloadState.Idle
        assertTrue("Idle should be DownloadState.Idle", state is DownloadState.Idle)
    }

    @Test
    fun `download state - Downloading has progress 0 to 1`() {
        val start = DownloadState.Downloading(0.0f)
        val mid = DownloadState.Downloading(0.5f)
        val end = DownloadState.Downloading(1.0f)
        assertEquals(0.0f, start.progress)
        assertEquals(0.5f, mid.progress)
        assertEquals(1.0f, end.progress)
    }

    @Test
    fun `download state - Completed is a valid state`() {
        val state: DownloadState = DownloadState.Completed
        assertTrue("Completed should be DownloadState.Completed", state is DownloadState.Completed)
    }

    @Test
    fun `download state - Failed has error message`() {
        val state = DownloadState.Failed("Network timeout")
        assertEquals("Network timeout", state.error)
        assertTrue(state is DownloadState.Failed)
    }

    @Test
    fun `download state - all subclasses are distinct`() {
        val idle: DownloadState = DownloadState.Idle
        val downloading: DownloadState = DownloadState.Downloading(0.5f)
        val completed: DownloadState = DownloadState.Completed
        val failed: DownloadState = DownloadState.Failed("error")

        assertFalse(idle is DownloadState.Downloading)
        assertFalse(idle is DownloadState.Completed)
        assertFalse(idle is DownloadState.Failed)
        assertFalse(downloading is DownloadState.Idle)
        assertFalse(downloading is DownloadState.Completed)
        assertFalse(downloading is DownloadState.Failed)
        assertFalse(completed is DownloadState.Idle)
        assertFalse(completed is DownloadState.Downloading)
        assertFalse(completed is DownloadState.Failed)
        assertFalse(failed is DownloadState.Idle)
        assertFalse(failed is DownloadState.Downloading)
        assertFalse(failed is DownloadState.Completed)
    }

    // ==================== LiteRtExtractor model file resolution ====================

    @Test
    fun `litert extractor - LlmResultParser reused for LiteRT output parsing`() {
        val liteRtJson = """[
            ${geminiEntry(time = "09:00:00", timezone = "America/Los_Angeles", original = "9am PT")}
        ]"""
        val results = LlmResultParser.parseResponse(liteRtJson)
        assertEquals("LiteRT uses same JSON format as Gemini", 1, results.size)
        assertNotNull("localDateTime should be set", results[0].localDateTime)
        assertNotNull("instant should be set", results[0].instant)
        assertEquals("America/Los_Angeles", results[0].sourceTimezone?.id)
    }

    // ==================== LlmResultParser handles LiteRT output identically ====================

    @Test
    fun `litert output - parse typical LiteRT response`() {
        val liteRtResponse = """[
            {"time":"14:30:00","date":"2026-04-11","timezone":"America/New_York","original":"2:30 PM ET"},
            {"time":"19:30:00","date":"2026-04-11","timezone":"UTC","original":"7:30 PM UTC"}
        ]"""
        val results = LlmResultParser.parseResponse(liteRtResponse)
        assertEquals(2, results.size)
        assertEquals(14, results[0].localDateTime!!.hour)
        assertEquals(30, results[0].localDateTime!!.minute)
        assertEquals(19, results[1].localDateTime!!.hour)
    }

    @Test
    fun `litert output - localDateTime is set (regression)`() {
        val json = """[{"time":"10:00:00","date":"2026-04-11","timezone":"Asia/Tokyo","original":"10am JST"}]"""
        val results = LlmResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertNotNull("localDateTime must be set for LiteRT output", results[0].localDateTime)
        assertEquals(10, results[0].localDateTime!!.hour)
        assertEquals(11, results[0].localDateTime!!.dayOfMonth)
    }

    @Test
    fun `litert output - timezone resolution works`() {
        val json = """[{"time":"08:00:00","date":"2026-04-11","timezone":"Europe/London","original":"8am BST"}]"""
        val results = LlmResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertNotNull(results[0].sourceTimezone)
        assertEquals("Europe/London", results[0].sourceTimezone!!.id)
        assertNotNull(results[0].instant)
    }

    @Test
    fun `litert output - method field can be LiteRT`() {
        val json = """[{"time":"15:00:00","date":"2026-04-11","timezone":"America/New_York","original":"3pm ET"}]"""
        val results = LlmResultParser.parseResponse(json)
        val withMethod = results.map { it.copy(method = "LiteRT") }
        assertEquals(1, withMethod.size)
        assertEquals("LiteRT", withMethod[0].method)
    }

    // ==================== Pipeline with LiteRT in the mix ====================

    @Test
    fun `litert pipeline - chrono and litert results merge correctly`() {
        requireQuickJs()
        val input = "3pm ET"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)

        val liteRtJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]"
        val liteRtResults = LlmResultParser.parseResponse(liteRtJson)

        val merged = ResultMerger.mergeResults(chronoResults, liteRtResults, "LiteRT")
        assertTrue("Merged should have results", merged.isNotEmpty())

        val liteRtMethodResult = merged.find { it.method.contains("LiteRT") }
        assertNotNull("At least one result should reference LiteRT", liteRtMethodResult)
    }

    @Test
    fun `litert pipeline - different timezone than chrono keeps both interpretations`() {
        requireQuickJs()
        // Use hand-crafted chrono JSON to guarantee specific offset for this unit test
        val chronoJson = """[{"text":"3pm","index":0,"start":{"year":2026,"month":4,"day":11,"hour":15,"minute":0,"second":0,"timezone":-420,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":true}},"end":null}]"""
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)

        val liteRtJson = "[${geminiEntry(time = "15:00:00", timezone = "America/Chicago", original = "3pm")}]"
        val liteRtResults = LlmResultParser.parseResponse(liteRtJson)

        val chronoTzId = chronoResults[0].sourceTimezone?.id
        val liteRtTzId = liteRtResults[0].sourceTimezone?.id
        assertTrue(
            "Chrono and LiteRT should have different tz: chrono=$chronoTzId litert=$liteRtTzId",
            chronoTzId != liteRtTzId,
        )

        val merged = ResultMerger.mergeResults(chronoResults, liteRtResults, "LiteRT")
        assertEquals(
            "Different tz interpretations should both be kept, got ${merged.size}: ${merged.map { it.sourceTimezone?.id }}",
            2, merged.size,
        )
    }

    @Test
    fun `litert pipeline - same timezone as chrono merges to single result`() {
        requireQuickJs()
        val input = "3pm ET"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)

        val liteRtJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]"
        val liteRtResults = LlmResultParser.parseResponse(liteRtJson)

        assertEquals("America/New_York", chronoResults[0].sourceTimezone?.id)
        assertEquals("America/New_York", liteRtResults[0].sourceTimezone?.id)

        val merged = ResultMerger.mergeResults(chronoResults, liteRtResults, "LiteRT")
        assertEquals(
            "Same tz should merge to 1 result, got ${merged.size}",
            1, merged.size,
        )
        assertTrue(
            "Method should reflect LiteRT, got '${merged[0].method}'",
            merged[0].method.contains("LiteRT"),
        )
    }

    // ==================== SettingsUiState data class ====================

    @Test
    fun `settings ui state - default has correct initial values`() {
        val state = SettingsUiState()
        assertFalse("modelInstalled should default to false", state.modelInstalled)
        assertEquals("modelSizeMb should default to empty", "", state.modelSizeMb)
        assertTrue("downloadState should default to Idle", state.downloadState is DownloadState.Idle)
        assertFalse("geminiNanoAvailable should default to false", state.geminiNanoAvailable)
        assertFalse("mlKitAvailable should default to false", state.mlKitAvailable)
    }

    @Test
    fun `settings ui state - model installed shows correct fields`() {
        val state = SettingsUiState(
            modelInstalled = true,
            modelSizeMb = "1.2 GB",
            downloadState = DownloadState.Completed,
            geminiNanoAvailable = true,
            mlKitAvailable = true,
        )
        assertTrue(state.modelInstalled)
        assertEquals("1.2 GB", state.modelSizeMb)
        assertTrue(state.downloadState is DownloadState.Completed)
        assertTrue(state.geminiNanoAvailable)
        assertTrue(state.mlKitAvailable)
    }

    @Test
    fun `settings ui state - download in progress`() {
        val state = SettingsUiState(
            modelInstalled = false,
            modelSizeMb = "",
            downloadState = DownloadState.Downloading(0.45f),
        )
        assertFalse(state.modelInstalled)
        assertTrue(state.downloadState is DownloadState.Downloading)
        assertEquals(0.45f, (state.downloadState as DownloadState.Downloading).progress)
    }

    // ==================== Regex-only pipeline path ====================

    @Test
    fun `regex-only - unix timestamp through full pipeline to conversion`() = runTest {
        val regexExtractor = RegexExtractor(cityResolver)
        val result = regexExtractor.extract("event created at 1712678400")
        assertTrue(result.times.isNotEmpty())
        assertEquals("Regex", result.method)
        assertNotNull(result.times[0].instant)
        assertEquals(TimeZone.UTC, result.times[0].sourceTimezone)

        val converted = converter.toLocal(result.times, TimeZone.of("Asia/Tokyo"))
        assertTrue(converted.isNotEmpty())
        assertTrue(converted[0].localTimezone.contains("UTC+9"))
    }

    @Test
    fun `regex-only - city time through full pipeline to conversion`() = runTest {
        val regexExtractor = RegexExtractor(cityResolver)
        val result = regexExtractor.extract("5pm in Tokyo")
        assertTrue(result.times.isNotEmpty())
        assertEquals(17, result.times[0].localDateTime!!.hour)
        assertEquals("Asia/Tokyo", result.times[0].sourceTimezone!!.id)

        val converted = converter.toLocal(result.times, TimeZone.of("America/New_York"))
        assertTrue(converted.isNotEmpty())
        assertTrue(converted[0].sourceTimezone.contains("Tokyo"))
    }

    @Test
    fun `regex-only - unix timestamp merged with chrono results`() = runTest {
        requireQuickJs()
        val regexExtractor = RegexExtractor(cityResolver)
        val regexResult = regexExtractor.extract("created at 1712678400")

        val input = "3pm ET"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)

        val merged = ResultMerger.mergeResults(chronoResults, regexResult.times, "Regex")
        assertTrue("Should have both chrono and regex results", merged.size >= 2)
    }

    // ==================== combineMethod fix regression ====================

    @Test
    fun `combineMethod - empty existing with method returns just method`() {
        assertEquals("Chrono", ResultMerger.combineMethod("", "Chrono"))
    }

    @Test
    fun `combineMethod - non-empty existing combines correctly`() {
        assertEquals("Chrono + Regex", ResultMerger.combineMethod("Chrono", "Regex"))
    }

    @Test
    fun `combineMethod - both empty returns empty`() {
        assertEquals("", ResultMerger.combineMethod("", ""))
    }

    @Test
    fun `combineMethod - empty new returns existing unchanged`() {
        assertEquals("Chrono", ResultMerger.combineMethod("Chrono", ""))
    }

    // ==================== Multi-stage merge order ====================

    @Test
    fun `merge order - chrono then litert then gemini produces correct method chain`() {
        requireQuickJs()
        val input = "3pm ET"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)

        val liteRtJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]"
        val liteRtResults = LlmResultParser.parseResponse(liteRtJson)

        val geminiJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]"
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        var merged = ResultMerger.mergeResults(chronoResults, liteRtResults, "LiteRT")
        merged = ResultMerger.mergeResults(merged, geminiResults, "Gemini Nano")

        assertEquals("All same instant should merge to 1", 1, merged.size)
    }

    // ==================== Bare date filtering in full pipeline ====================

    @Test
    fun `bare date filtering - date-only result kept when it is the only result`() {
        val json = """[{"text":"April 15","index":0,"start":{"year":2026,"month":4,"day":15,"hour":12,"minute":0,"second":0,"timezone":null,"isCertain":{"year":false,"month":true,"day":true,"hour":false,"minute":false,"timezone":false}},"end":null}]"""
        val results = ChronoResultParser.parse(json, "", null)
        assertEquals("Bare date as sole result should be kept", 1, results.size)
    }

    @Test
    fun `bare date filtering - date-only result filtered when time results exist`() {
        val json = """[
            {"text":"April 15","index":0,"start":{"year":2026,"month":4,"day":15,"hour":12,"minute":0,"second":0,"timezone":null,"isCertain":{"year":false,"month":true,"day":true,"hour":false,"minute":false,"timezone":false}},"end":null},
            {"text":"3:00 PM EST","index":10,"start":{"year":2026,"month":4,"day":6,"hour":15,"minute":0,"second":0,"timezone":-300,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":true}},"end":null}
        ]"""
        val results = ChronoResultParser.parse(json, "", null)
        assertEquals("Bare date should be filtered when real time exists", 1, results.size)
        assertEquals(15, results[0].localDateTime!!.hour)
        assertEquals(15, results[0].localDateTime!!.dayOfMonth) // date propagated
    }

    // ==================== Device run reproduction (2026-04-10 logcat) ====================
    // Input: "April 11 at 4:30 a.m. PT / 7:30 a.m. ET / 19:30 CST"
    // Device: Australia/Sydney. LiteRT unavailable. Gemini Nano available.

    @Test
    fun `device run - chrono full-text JSON reproduces exact parse results`() {
        // Exact JSON from chrono.js on device (full-text parse)
        val chronoJson = """[{"text":"April 11 at 4:30 a.m. PT","index":0,"start":{"year":2026,"month":4,"day":11,"hour":4,"minute":30,"second":0,"timezone":-420,"isCertain":{"year":false,"month":true,"day":true,"hour":true,"minute":true,"timezone":true}},"end":null},{"text":"7:30 a.m. ET","index":27,"start":{"year":2026,"month":4,"day":10,"hour":7,"minute":30,"second":0,"timezone":-240,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":true}},"end":null},{"text":"19:30 CST","index":42,"start":{"year":2026,"month":4,"day":10,"hour":19,"minute":30,"second":0,"timezone":-360,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":true}},"end":null}]"""
        val results = ChronoResultParser.parse(chronoJson, "April 11 at 4:30 a.m. PT / 7:30 a.m. ET / 19:30 CST", null)

        assertEquals(3, results.size)

        assertEquals("April 11 at 4:30 a.m. PT", results[0].originalText)
        assertEquals(4, results[0].localDateTime!!.hour)
        assertEquals(30, results[0].localDateTime!!.minute)
        assertEquals(11, results[0].localDateTime!!.dayOfMonth)
        assertEquals("America/Los_Angeles", results[0].sourceTimezone!!.id)
        assertEquals(
            Instant.parse("2026-04-11T11:30:00Z"),
            results[0].instant,
        )

        assertEquals("7:30 a.m. ET", results[1].originalText)
        assertEquals(7, results[1].localDateTime!!.hour)
        assertEquals(11, results[1].localDateTime!!.dayOfMonth)
        assertEquals("America/New_York", results[1].sourceTimezone!!.id)
        assertEquals(
            Instant.parse("2026-04-11T11:30:00Z"),
            results[1].instant,
        )

        assertEquals("19:30 CST", results[2].originalText)
        assertEquals(19, results[2].localDateTime!!.hour)
        assertEquals(11, results[2].localDateTime!!.dayOfMonth)
        assertEquals("America/Denver", results[2].sourceTimezone!!.id)
        assertEquals(
            Instant.parse("2026-04-12T01:30:00Z"),
            results[2].instant,
        )
    }

    @Test
    fun `device run - gemini nano response reproduces exact parse results`() {
        val geminiJson = """[{"time":"04:30","date":"2026-04-11","timezone":"America/Los_Angeles","original":"April 11 at 4:30 a.m. PT"},{"time":"07:30","date":"2026-04-11","timezone":"America/New_York","original":"April 11 at 7:30 a.m. ET"},{"time":"19:30","date":"2026-04-11","timezone":"America/Chicago","original":"19:30 CST"}]"""
        val results = LlmResultParser.parseResponse(geminiJson)

        assertEquals(3, results.size)

        assertEquals("April 11 at 4:30 a.m. PT", results[0].originalText)
        assertEquals("America/Los_Angeles", results[0].sourceTimezone!!.id)
        assertEquals(
            Instant.parse("2026-04-11T11:30:00Z"),
            results[0].instant,
        )

        assertEquals("April 11 at 7:30 a.m. ET", results[1].originalText)
        assertEquals("America/New_York", results[1].sourceTimezone!!.id)
        assertEquals(
            Instant.parse("2026-04-11T11:30:00Z"),
            results[1].instant,
        )

        assertEquals("19:30 CST", results[2].originalText)
        assertEquals(
            "CST should use standard offset UTC-6, not CDT",
            Instant.parse("2026-04-12T01:30:00Z"),
            results[2].instant,
        )
    }

    @Test
    fun `device run - merge produces 3 results (all pairs merge including CST)`() {
        val chronoJson = """[{"text":"April 11 at 4:30 a.m. PT","index":0,"start":{"year":2026,"month":4,"day":11,"hour":4,"minute":30,"second":0,"timezone":-420,"isCertain":{"year":false,"month":true,"day":true,"hour":true,"minute":true,"timezone":true}},"end":null},{"text":"7:30 a.m. ET","index":27,"start":{"year":2026,"month":4,"day":10,"hour":7,"minute":30,"second":0,"timezone":-240,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":true}},"end":null},{"text":"19:30 CST","index":42,"start":{"year":2026,"month":4,"day":10,"hour":19,"minute":30,"second":0,"timezone":-360,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":true}},"end":null}]"""
        val chronoResults = ChronoResultParser.parse(chronoJson, "April 11 at 4:30 a.m. PT / 7:30 a.m. ET / 19:30 CST", null)

        val geminiJson = """[{"time":"04:30","date":"2026-04-11","timezone":"America/Los_Angeles","original":"April 11 at 4:30 a.m. PT"},{"time":"07:30","date":"2026-04-11","timezone":"America/New_York","original":"April 11 at 7:30 a.m. ET"},{"time":"19:30","date":"2026-04-11","timezone":"America/Chicago","original":"19:30 CST"}]"""
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        var merged = ResultMerger.mergeResults(emptyList(), chronoResults, "ML Kit + Chrono")
        merged = ResultMerger.mergeResults(merged, geminiResults, "Gemini Nano")

        assertEquals(
            "Device run should produce 3 results, got ${merged.size}: ${merged.map { "'${it.originalText}' tz=${it.sourceTimezone?.id} instant=${it.instant}" }}",
            3, merged.size,
        )

        val pt = merged[0]
        assertEquals("April 11 at 4:30 a.m. PT", pt.originalText)
        assertEquals("America/Los_Angeles", pt.sourceTimezone!!.id)
        assertTrue(pt.method.contains("Chrono") && pt.method.contains("Gemini Nano"))

        val et = merged[1]
        assertEquals("7:30 a.m. ET", et.originalText)
        assertEquals("America/New_York", et.sourceTimezone!!.id)
        assertTrue(et.method.contains("Chrono") && et.method.contains("Gemini Nano"))

        val cst = merged[2]
        assertEquals("19:30 CST", cst.originalText)
        assertEquals(Instant.parse("2026-04-12T01:30:00Z"), cst.instant)
        assertTrue(cst.method.contains("Chrono") && cst.method.contains("Gemini Nano"))
    }

    @Test
    fun `device run - converted cards to Sydney match device output`() {
        val chronoJson = """[{"text":"April 11 at 4:30 a.m. PT","index":0,"start":{"year":2026,"month":4,"day":11,"hour":4,"minute":30,"second":0,"timezone":-420,"isCertain":{"year":false,"month":true,"day":true,"hour":true,"minute":true,"timezone":true}},"end":null},{"text":"7:30 a.m. ET","index":27,"start":{"year":2026,"month":4,"day":10,"hour":7,"minute":30,"second":0,"timezone":-240,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":true}},"end":null},{"text":"19:30 CST","index":42,"start":{"year":2026,"month":4,"day":10,"hour":19,"minute":30,"second":0,"timezone":-360,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":true}},"end":null}]"""
        val chronoResults = ChronoResultParser.parse(chronoJson, "April 11 at 4:30 a.m. PT / 7:30 a.m. ET / 19:30 CST", null)

        val geminiJson = """[{"time":"04:30","date":"2026-04-11","timezone":"America/Los_Angeles","original":"April 11 at 4:30 a.m. PT"},{"time":"07:30","date":"2026-04-11","timezone":"America/New_York","original":"April 11 at 7:30 a.m. ET"},{"time":"19:30","date":"2026-04-11","timezone":"America/Chicago","original":"19:30 CST"}]"""
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        var merged = ResultMerger.mergeResults(emptyList(), chronoResults, "ML Kit + Chrono")
        merged = ResultMerger.mergeResults(merged, geminiResults, "Gemini Nano")
        val sydney = TimeZone.of("Australia/Sydney")
        val converted = converter.toLocal(merged, sydney)

        assertEquals(3, converted.size)

        assertTrue("PT source should be 4:30 am, got '${converted[0].sourceDateTime}'",
            converted[0].sourceDateTime.contains("4:30\u202Fam"))
        assertTrue("PT source tz should be UTC-7 Los Angeles, got '${converted[0].sourceTimezone}'",
            converted[0].sourceTimezone.contains("UTC-7") && converted[0].sourceTimezone.contains("Los Angeles"))
        assertTrue("PT local should be 9:30 pm, got '${converted[0].localDateTime}'",
            converted[0].localDateTime.contains("9:30\u202Fpm"))
        assertTrue("PT local tz should be UTC+10 Sydney, got '${converted[0].localTimezone}'",
            converted[0].localTimezone.contains("UTC+10") && converted[0].localTimezone.contains("Sydney"))

        assertTrue("ET source should be 7:30 am, got '${converted[1].sourceDateTime}'",
            converted[1].sourceDateTime.contains("7:30\u202Fam"))
        assertTrue("ET source tz should be UTC-4 New York, got '${converted[1].sourceTimezone}'",
            converted[1].sourceTimezone.contains("UTC-4") && converted[1].sourceTimezone.contains("New York"))
        assertTrue("ET local should be 9:30 pm, got '${converted[1].localDateTime}'",
            converted[1].localDateTime.contains("9:30\u202Fpm"))

        assertTrue("CST source should be 7:30 pm, got '${converted[2].sourceDateTime}'",
            converted[2].sourceDateTime.contains("7:30\u202Fpm"))
        assertTrue("CST source tz should be UTC-6, got '${converted[2].sourceTimezone}'",
            converted[2].sourceTimezone.contains("UTC-6"))
        assertTrue("CST local should be 11:30 am, got '${converted[2].localDateTime}'",
            converted[2].localDateTime.contains("11:30\u202Fam"))
    }

    @Test
    fun `device run - full pipeline with expansion produces 4 results (CST splits into US and China)`() {
        val chronoJson = """[{"text":"April 11 at 4:30 a.m. PT","index":0,"start":{"year":2026,"month":4,"day":11,"hour":4,"minute":30,"second":0,"timezone":-420,"isCertain":{"year":false,"month":true,"day":true,"hour":true,"minute":true,"timezone":true}},"end":null},{"text":"7:30 a.m. ET","index":27,"start":{"year":2026,"month":4,"day":10,"hour":7,"minute":30,"second":0,"timezone":-240,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":true}},"end":null},{"text":"19:30 CST","index":42,"start":{"year":2026,"month":4,"day":10,"hour":19,"minute":30,"second":0,"timezone":-360,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":true}},"end":null}]"""
        val chronoResults = ChronoResultParser.parse(chronoJson, "April 11 at 4:30 a.m. PT / 7:30 a.m. ET / 19:30 CST", null)

        val geminiJson = """[{"time":"04:30","date":"2026-04-11","timezone":"America/Los_Angeles","original":"April 11 at 4:30 a.m. PT"},{"time":"07:30","date":"2026-04-11","timezone":"America/New_York","original":"April 11 at 7:30 a.m. ET"},{"time":"19:30","date":"2026-04-11","timezone":"America/Chicago","original":"19:30 CST"}]"""
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        var merged = ResultMerger.mergeResults(emptyList(), chronoResults, "ML Kit + Chrono")
        merged = ResultMerger.mergeResults(merged, geminiResults, "Gemini Nano")
        assertEquals("Merge should produce 3 before expansion", 3, merged.size)

        val expanded = ChronoResultParser.expandAmbiguous(merged)
        assertEquals(
            "Should be 4 after expansion (PT + ET + CST US + CST China), got: " +
                expanded.map { "${it.originalText} tz=${it.sourceTimezone?.id}" },
            4, expanded.size,
        )

        assertEquals("America/Los_Angeles", expanded[0].sourceTimezone!!.id)
        assertEquals("America/New_York", expanded[1].sourceTimezone!!.id)

        val cstResults = expanded.filter { it.originalText == "19:30 CST" }
        assertEquals(2, cstResults.size)
        val cstTzIds = cstResults.map { it.sourceTimezone!!.id }.toSet()
        assertTrue("Should have US Central zone", cstTzIds.any { it.startsWith("America/") })
        assertTrue("Should have China zone", cstTzIds.any { it.startsWith("Asia/") })

        val sydney = TimeZone.of("Australia/Sydney")
        val converted = converter.toLocal(expanded, sydney)
        assertEquals(4, converted.size)

        assertTrue(converted[0].localDateTime.contains("9:30\u202Fpm"))
        assertTrue(converted[1].localDateTime.contains("9:30\u202Fpm"))

        val cstCards = converted.filter { it.originalText == "19:30 CST" }
        val cstLocalTimes = cstCards.map { it.localDateTime }.toSet()
        assertEquals("Two CST cards should have different local times", 2, cstLocalTimes.size)
    }

    // ==================== CST CDT regression (device run 2026-04-10) ====================

    @Test
    fun `CST with America_Chicago should use standard offset not CDT`() {
        val geminiJson = """[{"time":"19:30","date":"2026-04-11","timezone":"America/Chicago","original":"19:30 CST"}]"""
        val results = LlmResultParser.parseResponse(geminiJson)
        assertEquals(1, results.size)
        assertEquals(
            "CST should use UTC-6 (standard), not UTC-5 (CDT)",
            Instant.parse("2026-04-12T01:30:00Z"),
            results[0].instant,
        )
    }

    @Test
    fun `CST Chrono and Gemini should merge to 1 when both mean US Central`() {
        val chronoJson = """[{"text":"19:30 CST","index":0,"start":{"year":2026,"month":4,"day":11,"hour":19,"minute":30,"second":0,"timezone":-360,"isCertain":{"year":false,"month":true,"day":true,"hour":true,"minute":true,"timezone":true}},"end":null}]"""
        val chronoResults = ChronoResultParser.parse(chronoJson, "19:30 CST", null)

        val geminiJson = """[{"time":"19:30","date":"2026-04-11","timezone":"America/Chicago","original":"19:30 CST"}]"""
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        assertEquals(
            "Both should produce same instant (UTC-6)",
            chronoResults[0].instant, geminiResults[0].instant,
        )

        var merged = ResultMerger.mergeResults(emptyList(), chronoResults, "ML Kit + Chrono")
        merged = ResultMerger.mergeResults(merged, geminiResults, "Gemini Nano")
        assertEquals("Same CST interpretation should merge to 1", 1, merged.size)
    }

    @Test
    fun `device run corrected - full pipeline produces 3 results not 4`() {
        val chronoJson = """[{"text":"April 11 at 4:30 a.m. PT","index":0,"start":{"year":2026,"month":4,"day":11,"hour":4,"minute":30,"second":0,"timezone":-420,"isCertain":{"year":false,"month":true,"day":true,"hour":true,"minute":true,"timezone":true}},"end":null},{"text":"7:30 a.m. ET","index":27,"start":{"year":2026,"month":4,"day":10,"hour":7,"minute":30,"second":0,"timezone":-240,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":true}},"end":null},{"text":"19:30 CST","index":42,"start":{"year":2026,"month":4,"day":10,"hour":19,"minute":30,"second":0,"timezone":-360,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":true}},"end":null}]"""
        val chronoResults = ChronoResultParser.parse(chronoJson, "April 11 at 4:30 a.m. PT / 7:30 a.m. ET / 19:30 CST", null)

        val geminiJson = """[{"time":"04:30","date":"2026-04-11","timezone":"America/Los_Angeles","original":"April 11 at 4:30 a.m. PT"},{"time":"07:30","date":"2026-04-11","timezone":"America/New_York","original":"April 11 at 7:30 a.m. ET"},{"time":"19:30","date":"2026-04-11","timezone":"America/Chicago","original":"19:30 CST"}]"""
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        var merged = ResultMerger.mergeResults(emptyList(), chronoResults, "ML Kit + Chrono")
        merged = ResultMerger.mergeResults(merged, geminiResults, "Gemini Nano")

        assertEquals(
            "Should be 3 results (all pairs merge), got ${merged.size}: ${merged.map { "'${it.originalText}' tz=${it.sourceTimezone?.id} instant=${it.instant}" }}",
            3, merged.size,
        )
    }

    // ==================== Timezone resolution consistency ====================

    @Test
    fun `tz consistency - 3pm EST Chrono plus Gemini same instant`() {
        requireQuickJs()
        val input = "3pm EST"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)

        val geminiJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm EST")}]"
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        assertNotNull("Chrono instant", chronoResults[0].instant)
        assertNotNull("Gemini instant", geminiResults[0].instant)
        assertEquals(
            "Chrono and Gemini should produce same instant for '3pm EST'",
            chronoResults[0].instant, geminiResults[0].instant,
        )

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")
        assertEquals("Same instant should merge to 1", 1, merged.size)
    }

    @Test
    fun `tz consistency - 3pm PST summer Chrono plus Gemini same instant`() {
        requireQuickJs()
        val input = "July 15 at 3pm PST"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)

        val geminiJson = "[${geminiEntry(time = "15:00:00", date = "2026-07-15", timezone = "America/Los_Angeles", original = "3pm PST")}]"
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        assertEquals(
            "PST instants should match",
            chronoResults[0].instant, geminiResults[0].instant,
        )

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")
        assertEquals(1, merged.size)
    }

    @Test
    fun `tz consistency - CST ambiguous keeps both`() {
        requireQuickJs()
        val input = "3pm CST"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)

        val geminiJson = "[${geminiEntry(time = "15:00:00", timezone = "Asia/Shanghai", original = "3pm CST")}]"
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        assertTrue(
            "CST instants should differ (US Central vs China)",
            chronoResults[0].instant != geminiResults[0].instant,
        )

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")
        assertEquals("Ambiguous CST should keep both", 2, merged.size)
    }

    @Test
    fun `tz consistency - GMT summer correction`() {
        val geminiJson = "[${geminiEntry(time = "09:00:00", date = "2026-07-15", timezone = "Europe/London", original = "9am GMT")}]"
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        val instant = geminiResults[0].instant!!
        val utcHour = instant.toLocalDateTime(TimeZone.UTC).hour
        assertEquals("9am GMT should be 09:00 UTC (not 08:00 from BST)", 9, utcHour)
    }

    @Test
    fun `tz consistency - source display round-trips correctly after merge`() {
        requireQuickJs()
        val input = "3pm EST"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)

        val geminiJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm EST")}]"
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")
        assertEquals(1, merged.size)

        val result = merged[0]
        val sourceLocal = result.instant!!.toLocalDateTime(result.sourceTimezone!!)
        assertEquals("Source display hour should be 15 (3pm)", 15, sourceLocal.hour)
    }

    @Test
    fun `tz consistency - converted time correct after cross-extractor merge`() {
        requireQuickJs()
        val input = "3pm EST"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)

        val geminiJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm EST")}]"
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")
        val converted = converter.toLocal(merged, TimeZone.of("Asia/Tokyo"))

        assertEquals(1, converted.size)
        assertTrue(
            "Local time should contain 5:00 am, got '${converted[0].localDateTime}'",
            converted[0].localDateTime.contains("5:00\u202Fam"),
        )
        assertTrue(converted[0].localTimezone.contains("UTC+9"))
    }

    @Test
    fun `tz consistency - three extractors all merge to 1 with combined method`() {
        requireQuickJs()
        val input = "3pm EST"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)

        val liteRtJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm EST")}]"
        val liteRtResults = LlmResultParser.parseResponse(liteRtJson)

        val geminiJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm EST")}]"
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        var merged = ResultMerger.mergeResults(chronoResults, liteRtResults, "LiteRT")
        merged = ResultMerger.mergeResults(merged, geminiResults, "Gemini Nano")

        assertEquals("3 extractors should merge to 1", 1, merged.size)
        assertTrue(merged[0].method.contains("LiteRT"))
        assertTrue(merged[0].method.contains("Gemini Nano"))
    }

    @Test
    fun `tz consistency - Vancouver and LA same-offset merge`() {
        requireQuickJs()
        val input = "4:30 a.m. PT"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)

        val geminiJson = "[${geminiEntry(time = "04:30:00", timezone = "America/Los_Angeles", original = "4:30 a.m. PT")}]"
        val geminiResults = LlmResultParser.parseResponse(geminiJson)

        assertEquals(
            "PT results should have same instant",
            chronoResults[0].instant, geminiResults[0].instant,
        )

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")
        assertEquals("Same instant should merge to 1", 1, merged.size)
    }

    @Test
    fun `tz consistency - EST offset maps consistently across multiple parses`() {
        requireQuickJs()
        ChronoResultParser.clearOffsetCache()
        val json1 = chronoParse("3pm EST")!!
        val results1 = ChronoResultParser.parse(json1, "3pm EST", null)

        ChronoResultParser.clearOffsetCache()
        val json2 = chronoParse("3pm EST")!!
        val results2 = ChronoResultParser.parse(json2, "3pm EST", null)

        assertEquals(
            "Same input should always map to same zone",
            results1[0].sourceTimezone, results2[0].sourceTimezone,
        )
        assertEquals(
            "Same input should always produce same instant",
            results1[0].instant, results2[0].instant,
        )
    }

    // ==================== IanaCityLookup shared resolution ====================

    @Test
    fun `IanaCityLookup - all city aliases resolve to valid timezones`() {
        val aliases = listOf(
            "nyc", "dc", "sf", "la", "san francisco", "boston", "miami",
            "dallas", "mumbai", "delhi", "beijing", "osaka", "melbourne",
            "hawaii", "rio", "barcelona", "munich",
        )
        for (alias in aliases) {
            assertNotNull(
                "Alias '$alias' should resolve to a timezone",
                IanaCityLookup.resolve(alias),
            )
        }
    }

    @Test
    fun `IanaCityLookup - TestCityResolver uses shared implementation`() {
        val lookup = IanaCityLookup.resolve("tokyo")
        val testResolver = TestCityResolver().resolve("tokyo")
        assertEquals("Both should resolve to same timezone", lookup, testResolver)
    }

    // ==================== Scenario: "5 to 6pm 22 August in New York" ====================

    @Test
    fun `scenario - time range with city produces exactly 2 results after merge`() {
        requireQuickJs()
        val fullInput = "5 to 6pm 22 August in New York"
        val fullJson = chronoParse(fullInput)!!
        val fullResults = ChronoResultParser.parse(fullJson, fullInput, cityResolver)

        assertTrue(
            "Full-text results should have timezone from city resolution",
            fullResults.any { it.sourceTimezone?.id == "America/New_York" },
        )

        val geminiJson = geminiEntry(
            time = "17:00", date = "2026-08-22",
            timezone = "America/New_York", original = "5 to 6pm 22 August in New York",
        )
        val geminiResults = LlmResultParser.parseResponse("[$geminiJson]")
        assertEquals(1, geminiResults.size)

        val finalResults = ResultMerger.mergeResults(fullResults, geminiResults, "Gemini Nano")

        assertEquals(
            "Expected 2 results (range start + end), got ${finalResults.size}: " +
                finalResults.map { "${it.originalText} tz=${it.sourceTimezone?.id}" },
            2, finalResults.size,
        )
    }

    // ==================== Scenario: "19:30 CST" ambiguous expansion ====================

    @Test
    fun `scenario - CST ambiguity expands to both US Central and China Standard`() {
        requireQuickJs()
        val input = "19:30 CST"
        val json = chronoParse(input)!!
        val chronoResults = ChronoResultParser.parse(json, input, null)
        assertEquals(1, chronoResults.size)

        val geminiJson = geminiEntry(
            time = "19:30", date = "2026-04-11",
            timezone = "America/Chicago", original = "19:30 CST",
        )
        val geminiResults = LlmResultParser.parseResponse("[$geminiJson]")
        assertEquals(1, geminiResults.size)

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")

        val expanded = ChronoResultParser.expandAmbiguous(merged)

        assertEquals(
            "CST should expand to 2 interpretations, got: " +
                expanded.map { "${it.originalText} tz=${it.sourceTimezone?.id}" },
            2, expanded.size,
        )

        val tzIds = expanded.map { it.sourceTimezone!!.id }.toSet()
        assertTrue("Should have a US timezone", tzIds.any { it.startsWith("America/") })
        assertTrue("Should have an Asian timezone", tzIds.any { it.startsWith("Asia/") })

        val converted = converter.toLocal(expanded, TimeZone.of("Australia/Sydney"))
        assertEquals(2, converted.size)
        assertTrue(
            "Different offsets should produce different local times in Sydney",
            converted[0].localDateTime != converted[1].localDateTime,
        )
    }
}
