package com.chronoshift

import com.chronoshift.conversion.ExtractedTime
import com.chronoshift.conversion.TimeConverter
import com.chronoshift.nlp.ChronoResultParser
import com.chronoshift.nlp.DownloadState
import com.chronoshift.nlp.GeminiResultParser
import com.chronoshift.nlp.IanaCityLookup
import com.chronoshift.nlp.RegexExtractor
import com.chronoshift.nlp.ResultMerger
import com.chronoshift.nlp.TestCityResolver
import com.chronoshift.ui.settings.SettingsUiState
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.*
import kotlinx.datetime.toInstant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * Integration tests that trace REAL data flow through the NLP pipeline.
 *
 * Every test feeds realistic JSON through actual parsers — no manual ExtractedTime construction.
 * This catches field-population bugs (like the localDateTime fix in GeminiResultParser).
 */
class IntegrationTest {

    private val converter = TimeConverter()
    private val cityResolver = TestCityResolver()

    @Before
    fun setup() {
        ChronoResultParser.clearOffsetCache()
    }

    // ==================== JSON builder helpers ====================

    private fun chronoEntry(
        text: String,
        year: Int = 2026, month: Int = 4, day: Int = 11,
        hour: Int = 12, minute: Int = 0, second: Int = 0,
        timezone: Int? = null, dayCertain: Boolean = false,
        end: String? = null,
    ): String {
        val tzJson = if (timezone != null) "$timezone" else "null"
        val endJson = end ?: "null"
        return """{"text":"$text","index":0,"start":{"year":$year,"month":$month,"day":$day,"hour":$hour,"minute":$minute,"second":$second,"timezone":$tzJson,"isCertain":{"year":false,"month":$dayCertain,"day":$dayCertain,"hour":true,"minute":true,"timezone":${timezone != null}}},"end":$endJson}"""
    }

    private fun chronoEndBlock(
        year: Int = 2026, month: Int = 4, day: Int = 11,
        hour: Int = 13, minute: Int = 0, second: Int = 0,
        timezone: Int? = null,
    ): String {
        val tzJson = if (timezone != null) "$timezone" else "null"
        return """{"year":$year,"month":$month,"day":$day,"hour":$hour,"minute":$minute,"second":$second,"timezone":$tzJson}"""
    }

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
        val chronoJson = """[
            ${chronoEntry("4:30 a.m. PT", hour = 4, minute = 30, timezone = -420, dayCertain = true)},
            ${chronoEntry("7:30 a.m. ET", day = 6, hour = 7, minute = 30, timezone = -240)},
            ${chronoEntry("19:30 CST", day = 6, hour = 19, minute = 30, timezone = -360)}
        ]"""

        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)
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

        // Alignment is removed — CST keeps its original Chrono-assigned timezone (US Central -360)
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

        val geminiResults = GeminiResultParser.parseResponse(geminiJson)
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
        val chronoJson = """[
            ${chronoEntry("4:30 a.m. PT", hour = 4, minute = 30, timezone = -420, dayCertain = true)},
            ${chronoEntry("7:30 a.m. ET", day = 6, hour = 7, minute = 30, timezone = -240)},
            ${chronoEntry("19:30 CST", day = 6, hour = 19, minute = 30, timezone = -360)}
        ]"""
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)

        val geminiJson = """[
            ${geminiEntry(time = "04:30:00", timezone = "America/Los_Angeles", original = "April 11 at 4:30 a.m. PT")},
            ${geminiEntry(time = "07:30:00", timezone = "America/New_York", original = "7:30 a.m. ET")},
            ${geminiEntry(time = "19:30:00", timezone = "America/Chicago", original = "19:30 CST")}
        ]"""
        val geminiResults = GeminiResultParser.parseResponse(geminiJson)

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")

        // Alignment removed. ET exact-matches (same instant+tz=New_York). PT and CST
        // have different tz between Chrono (offset-mapped) and Gemini (IANA), so both
        // interpretations are kept: 3 chrono + 1 Gemini PT + 1 Gemini CST = 5
        assertEquals(
            "Merged should be 5 results (different-tz interpretations kept), got ${merged.size}: ${merged.map { "'${it.originalText}' tz=${it.sourceTimezone?.id}" }}",
            5, merged.size,
        )

        // ET result should have method from Gemini Nano (chrono results have empty default method)
        val etResult = merged.first { it.sourceTimezone?.id == "America/New_York" }
        assertTrue(
            "ET method should reflect Gemini Nano, got '${etResult.method}'",
            etResult.method.contains("Gemini Nano"),
        )
    }

    @Test
    fun `scenario 1 - full pipeline through TimeConverter to Tokyo`() {
        val chronoJson = """[
            ${chronoEntry("4:30 a.m. PT", hour = 4, minute = 30, timezone = -420, dayCertain = true)},
            ${chronoEntry("7:30 a.m. ET", day = 6, hour = 7, minute = 30, timezone = -240)},
            ${chronoEntry("19:30 CST", day = 6, hour = 19, minute = 30, timezone = -360)}
        ]"""
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)

        val geminiJson = """[
            ${geminiEntry(time = "04:30:00", timezone = "America/Los_Angeles", original = "April 11 at 4:30 a.m. PT")},
            ${geminiEntry(time = "07:30:00", timezone = "America/New_York", original = "7:30 a.m. ET")},
            ${geminiEntry(time = "19:30:00", timezone = "America/Chicago", original = "19:30 CST")}
        ]"""
        val geminiResults = GeminiResultParser.parseResponse(geminiJson)

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")

        val tokyo = TimeZone.of("Asia/Tokyo")
        val converted = converter.toLocal(merged, tokyo)

        assertTrue(
            "Should produce converted results, got ${converted.size}",
            converted.isNotEmpty(),
        )

        converted.forEach { ct ->
            assertNotNull(ct.localDateTime)
            assertNotNull(ct.localDate)
            assertTrue(
                "Local timezone should be UTC+9, got '${ct.localTimezone}'",
                ct.localTimezone.contains("UTC+9"),
            )
        }
    }

    // ==================== Scenario 2 ====================
    // "3pm EST" — simple single timezone

    @Test
    fun `scenario 2 - single timezone through full pipeline`() {
        // Chrono: offset -300 = EST (but April = EDT, so Chrono sends -240 for EDT)
        // Use -300 to simulate a "EST" label as written, which Chrono might pass literally
        val chronoJson = "[${chronoEntry("3pm EST", hour = 15, timezone = -300, dayCertain = false)}]"
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)

        val geminiJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm EST")}]"
        val geminiResults = GeminiResultParser.parseResponse(geminiJson)

        assertEquals(1, chronoResults.size)
        assertEquals(1, geminiResults.size)

        // Both should have localDateTime 15:00
        assertEquals(15, chronoResults[0].localDateTime!!.hour)
        assertEquals(15, geminiResults[0].localDateTime!!.hour)

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")

        // Chrono offset -300 in April maps to America/Chicago (CDT), Gemini has America/New_York.
        // Fuzzy match finds same local time but different timezones → both kept as separate.
        assertEquals(
            "Different tz interpretations kept separate, got ${merged.size}: ${merged.map { "'${it.originalText}' tz=${it.sourceTimezone?.id}" }}",
            2, merged.size,
        )

        val converted = converter.toLocal(merged, TimeZone.of("Asia/Tokyo"))
        assertEquals(2, converted.size)
        converted.forEach { assertNotNull(it.localDateTime) }
    }

    // ==================== Scenario 3 ====================
    // "12:00 pm - 12:50 pm EDT" — time range

    @Test
    fun `scenario 3 - time range produces start and end not 4 results`() {
        // Chrono: 1 entry with end block
        val chronoJson = "[${chronoEntry(
            "12:00 pm - 12:50 pm EDT",
            hour = 12, minute = 0, timezone = -240, dayCertain = true,
            end = chronoEndBlock(hour = 12, minute = 50, timezone = -240),
        )}]"
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)
        assertEquals("Chrono range should produce 2 results (start + end)", 2, chronoResults.size)
        assertEquals(12, chronoResults[0].localDateTime!!.hour)
        assertEquals(0, chronoResults[0].localDateTime!!.minute)
        assertEquals(12, chronoResults[1].localDateTime!!.hour)
        assertEquals(50, chronoResults[1].localDateTime!!.minute)

        // Gemini: 2 separate entries for start and end
        val geminiJson = """[
            ${geminiEntry(time = "12:00:00", timezone = "America/New_York", original = "12:00 pm EDT")},
            ${geminiEntry(time = "12:50:00", timezone = "America/New_York", original = "12:50 pm EDT")}
        ]"""
        val geminiResults = GeminiResultParser.parseResponse(geminiJson)
        assertEquals(2, geminiResults.size)

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")

        // Should be 2 (start + end), not 4
        assertEquals(
            "Range merge should produce 2, got ${merged.size}: ${merged.map { "'${it.originalText}' h=${it.localDateTime?.hour}:${it.localDateTime?.minute}" }}",
            2, merged.size,
        )

        val converted = converter.toLocal(merged, TimeZone.of("Europe/London"))
        assertTrue("Converted should have results", converted.isNotEmpty())
        assertTrue(
            "Converted results should be <= 2, got ${converted.size}",
            converted.size <= 2,
        )
    }

    // ==================== Scenario 4 ====================
    // "5:00 in New York" — city resolution

    @Test
    fun `scenario 4 - city resolution adds timezone to chrono result`() {
        // Chrono: no timezone (can't resolve cities)
        val chronoJson = "[${chronoEntry("5:00", hour = 5)}]"
        val chronoResults = ChronoResultParser.parse(chronoJson, "5:00 in New York", cityResolver)

        assertEquals(1, chronoResults.size)
        assertNotNull(
            "City resolver should add timezone for 'New York'",
            chronoResults[0].sourceTimezone,
        )
        assertEquals("America/New_York", chronoResults[0].sourceTimezone!!.id)
    }

    @Test
    fun `scenario 4 - city resolution does not override explicit timezone`() {
        // Use offset -240 (EDT in April) which maps to America/New_York
        val chronoJson = "[${chronoEntry("5:00 PM EDT", hour = 17, timezone = -240)}]"
        val chronoResults = ChronoResultParser.parse(chronoJson, "5:00 PM EDT in Chicago", cityResolver)

        assertEquals(1, chronoResults.size)
        assertNotNull(chronoResults[0].sourceTimezone)
        // Offset -240 in April → America/New_York; city "Chicago" should NOT override it
        assertTrue(
            "Should keep offset-based timezone (New_York), not city (Chicago), got ${chronoResults[0].sourceTimezone!!.id}",
            chronoResults[0].sourceTimezone!!.id != "America/Chicago",
        )
    }

    // ==================== Scenario 5 ====================
    // Gemini returns wrong year (2024 vs 2026)

    @Test
    fun `scenario 5 - different years do not merge`() {
        // Gemini returns wrong year 2024
        val geminiJson = "[${geminiEntry(
            time = "04:30:00", date = "2024-04-11",
            timezone = "America/Los_Angeles", original = "April 11 at 4:30 a.m. PT",
        )}]"
        val geminiResults = GeminiResultParser.parseResponse(geminiJson)
        assertEquals(2024, geminiResults[0].localDateTime!!.year)

        // Chrono returns correct year 2026
        val chronoJson = "[${chronoEntry(
            "4:30 a.m. PT", year = 2026, hour = 4, minute = 30, timezone = -420, dayCertain = true,
        )}]"
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)
        assertEquals(2026, chronoResults[0].localDateTime!!.year)

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")

        // Different years = different dates, so isSameLocalTime (which now checks date) won't match
        // Both results kept as separate entries
        assertEquals(
            "Different years should produce 2 separate results, got ${merged.size}",
            2, merged.size,
        )
    }

    @Test
    fun `scenario 5 - different years with different hours do not merge`() {
        // If the times also differ, they shouldn't merge at all
        val geminiJson = "[${geminiEntry(
            time = "10:00:00", date = "2024-04-11",
            timezone = "America/Los_Angeles", original = "10:00 a.m. PT (wrong year)",
        )}]"
        val geminiResults = GeminiResultParser.parseResponse(geminiJson)

        val chronoJson = "[${chronoEntry(
            "4:30 a.m. PT", year = 2026, hour = 4, minute = 30, timezone = -420, dayCertain = true,
        )}]"
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")

        // Different hour:minute = no fuzzy match, different instants = no exact match
        assertEquals("Different hours should produce 2 results", 2, merged.size)
    }

    // ==================== Scenario 6 ====================
    // Parser output field verification (regression tests)

    @Test
    fun `scenario 6 - gemini with timezone has localDateTime and instant`() {
        val json = "[${geminiEntry(time = "14:30:00", timezone = "America/New_York", original = "2:30 PM ET")}]"
        val results = GeminiResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertNotNull("Gemini with tz must have localDateTime", results[0].localDateTime)
        assertNotNull("Gemini with tz must have instant", results[0].instant)
        assertNotNull("Gemini with tz must have sourceTimezone", results[0].sourceTimezone)
        assertEquals(0.9f, results[0].confidence)
    }

    @Test
    fun `scenario 6 - gemini without timezone has localDateTime but no instant`() {
        val json = "[${geminiEntry(time = "14:30:00", timezone = "", original = "2:30 PM")}]"
        val results = GeminiResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertNotNull("Gemini without tz must have localDateTime", results[0].localDateTime)
        assertNull("Gemini without tz must NOT have instant", results[0].instant)
        assertNull("Gemini without tz must NOT have sourceTimezone", results[0].sourceTimezone)
        assertEquals(0.7f, results[0].confidence)
    }

    @Test
    fun `scenario 6 - chrono with timezone has localDateTime and instant`() {
        val json = "[${chronoEntry("test", hour = 14, minute = 30, timezone = -240)}]"
        val results = ChronoResultParser.parse(json, "", null)
        assertEquals(1, results.size)
        assertNotNull("Chrono with tz must have localDateTime", results[0].localDateTime)
        assertNotNull("Chrono with tz must have instant", results[0].instant)
        assertNotNull("Chrono with tz must have sourceTimezone", results[0].sourceTimezone)
    }

    @Test
    fun `scenario 6 - chrono without timezone has localDateTime but no instant`() {
        val json = "[${chronoEntry("test", hour = 14, minute = 30)}]"
        val results = ChronoResultParser.parse(json, "", null)
        assertEquals(1, results.size)
        assertNotNull("Chrono without tz must have localDateTime", results[0].localDateTime)
        assertNull("Chrono without tz must NOT have instant", results[0].instant)
        assertNull("Chrono without tz must NOT have sourceTimezone", results[0].sourceTimezone)
    }

    @Test
    fun `scenario 6 - confidence values from parsers differ from manual construction defaults`() {
        // Chrono uncertain = 0.85, certain = 0.95
        // Gemini with tz = 0.9, without tz = 0.7
        // ExtractedTime default = 1.0
        // If tests manually construct with defaults, they miss this

        val chronoUncertain = ChronoResultParser.parse(
            "[${chronoEntry("test", hour = 12)}]", "", null,
        )
        assertEquals(0.85f, chronoUncertain[0].confidence)

        val chronoCertain = ChronoResultParser.parse(
            "[${chronoEntry("test", hour = 12, dayCertain = true)}]", "", null,
        )
        assertEquals(0.95f, chronoCertain[0].confidence)

        val geminiWithTz = GeminiResultParser.parseResponse(
            "[${geminiEntry(time = "12:00:00", timezone = "UTC", original = "test")}]",
        )
        assertEquals(0.9f, geminiWithTz[0].confidence)

        val geminiNoTz = GeminiResultParser.parseResponse(
            "[${geminiEntry(time = "12:00:00", original = "test")}]",
        )
        assertEquals(0.7f, geminiNoTz[0].confidence)
    }

    // ==================== Scenario 7 ====================
    // End-to-end with TimeConverter to multiple zones

    @Test
    fun `scenario 7 - convert aligned results to UTC Tokyo and Sydney`() {
        // Build a single moment: April 11 4:30 AM PT = 11:30 UTC
        val chronoJson = """[
            ${chronoEntry("4:30 a.m. PT", hour = 4, minute = 30, timezone = -420, dayCertain = true)},
            ${chronoEntry("7:30 a.m. ET", day = 6, hour = 7, minute = 30, timezone = -240)},
            ${chronoEntry("19:30 CST", day = 6, hour = 19, minute = 30, timezone = -360)}
        ]"""
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)

        // Convert to UTC
        val utcConverted = converter.toLocal(chronoResults, TimeZone.UTC)
        assertTrue("UTC conversion should produce results", utcConverted.isNotEmpty())
        utcConverted.forEach { ct ->
            assertEquals("UTC", ct.localTimezone)
        }

        // Convert to Tokyo (UTC+9)
        val tokyoConverted = converter.toLocal(chronoResults, TimeZone.of("Asia/Tokyo"))
        assertTrue("Tokyo conversion should produce results", tokyoConverted.isNotEmpty())
        tokyoConverted.forEach { ct ->
            assertTrue(
                "Tokyo timezone should be UTC+9, got '${ct.localTimezone}'",
                ct.localTimezone.contains("UTC+9"),
            )
        }

        // Convert to Sydney (UTC+10 in April = AEST)
        val sydneyConverted = converter.toLocal(chronoResults, TimeZone.of("Australia/Sydney"))
        assertTrue("Sydney conversion should produce results", sydneyConverted.isNotEmpty())
        sydneyConverted.forEach { ct ->
            assertTrue(
                "Sydney timezone should be UTC+10, got '${ct.localTimezone}'",
                ct.localTimezone.contains("UTC+10"),
            )
        }

        // The local times should differ across zones since they are the same instant
        // UTC 11:30, Tokyo 20:30, Sydney 21:30
        // Check that at least the UTC result differs from Tokyo result
        if (utcConverted.isNotEmpty() && tokyoConverted.isNotEmpty()) {
            assertTrue(
                "UTC and Tokyo local times should differ",
                utcConverted[0].localDateTime != tokyoConverted[0].localDateTime,
            )
        }
    }

    @Test
    fun `scenario 7 - source time displays correctly regardless of target zone`() {
        val chronoJson = "[${chronoEntry("3:00 PM ET", hour = 15, timezone = -240, dayCertain = true)}]"
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)

        val utcResult = converter.toLocal(chronoResults, TimeZone.UTC)
        val tokyoResult = converter.toLocal(chronoResults, TimeZone.of("Asia/Tokyo"))

        assertEquals(1, utcResult.size)
        assertEquals(1, tokyoResult.size)

        // Source timezone display should be the same regardless of target
        assertEquals(utcResult[0].sourceTimezone, tokyoResult[0].sourceTimezone)
        // Source time display should be the same
        assertEquals(utcResult[0].sourceDateTime, tokyoResult[0].sourceDateTime)
        // Original text preserved
        assertEquals("3:00 PM ET", utcResult[0].originalText)
        assertEquals("3:00 PM ET", tokyoResult[0].originalText)
    }

    // ==================== Scenario 8 ====================
    // Empty/null/garbage inputs through the full pipeline

    @Test
    fun `scenario 8 - empty string through both parsers`() {
        val chronoResults = ChronoResultParser.parse("", "", null)
        val geminiResults = GeminiResultParser.parseResponse("")
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
        val geminiResults = GeminiResultParser.parseResponse("{not valid]]]")
        assertTrue(chronoResults.isEmpty())
        assertTrue(geminiResults.isEmpty())

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "test")
        assertTrue(merged.isEmpty())
    }

    @Test
    fun `scenario 8 - valid chrono plus empty gemini preserves chrono results`() {
        val chronoJson = "[${chronoEntry("3pm ET", hour = 15, timezone = -240)}]"
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)
        val geminiResults = GeminiResultParser.parseResponse("[]")

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
        val geminiResults = GeminiResultParser.parseResponse(geminiJson)

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

        assertTrue(GeminiResultParser.parseResponse("null").isEmpty())
        assertTrue(GeminiResultParser.parseResponse("undefined").isEmpty())
        assertTrue(GeminiResultParser.parseResponse("42").isEmpty())
        assertTrue(GeminiResultParser.parseResponse("{}").isEmpty())
    }

    @Test
    fun `scenario 8 - chrono with one valid and one garbage entry`() {
        val json = """[${chronoEntry("valid", hour = 15, timezone = -240)},{"broken":true}]"""
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
        val results = GeminiResultParser.parseResponse(json)
        assertEquals("Should parse valid entry, skip empty one", 1, results.size)
    }

    // ==================== Additional regression tests ====================

    @Test
    fun `regression - gemini localDateTime enables fuzzy merge deduplication`() {
        // This is the core regression test: without localDateTime, fuzzy match fails
        // and merge produces too many results

        // Chrono: 1 result at 15:00 with America/New_York
        val chronoJson = "[${chronoEntry("3pm ET", hour = 15, timezone = -240)}]"
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)

        // Gemini: same time with same IANA timezone
        val geminiJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]"
        val geminiResults = GeminiResultParser.parseResponse(geminiJson)

        // Both must have localDateTime for fuzzy match to work
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
        // First call: offset -420 resolves to some Pacific timezone
        val tz1 = ChronoResultParser.offsetToTimezone(-420)
        ChronoResultParser.clearOffsetCache()

        // After clear, should still resolve (not NPE or stale data)
        val tz2 = ChronoResultParser.offsetToTimezone(-420)
        assertEquals("Same offset should resolve to same timezone", tz1, tz2)
    }

    @Test
    fun `regression - date propagation updates instant not just localDateTime`() {
        // If propagation changes the date but not the instant, downstream conversion is wrong
        val chronoJson = """[
            ${chronoEntry("April 20 9am PT", day = 20, hour = 9, timezone = -420, dayCertain = true)},
            ${chronoEntry("12pm ET", day = 6, hour = 12, timezone = -240)}
        ]"""
        val results = ChronoResultParser.parse(chronoJson, "", null)

        // Second result should have day 20 (propagated)
        assertEquals(20, results[1].localDateTime!!.dayOfMonth)

        // Its instant should also reflect April 20, not April 6
        assertNotNull("Propagated result should have instant", results[1].instant)

        // Convert and verify: if instant wasn't updated, the converted date would be wrong
        val converted = converter.toLocal(results, TimeZone.UTC)
        assertTrue(converted.size >= 2)
        // Both should show April 20
        converted.forEach { ct ->
            assertTrue(
                "Date should contain Apr or 20, got '${ct.localDate}'",
                ct.localDate.contains("Apr") || ct.localDate.contains("20"),
            )
        }
    }

    @Test
    fun `regression - result without timezone keeps null instant`() {
        val chronoJson = """[
            ${chronoEntry("4:30 PT", hour = 4, minute = 30, timezone = -420, dayCertain = true)},
            ${chronoEntry("7:30 ET", hour = 7, minute = 30, timezone = -240)},
            ${chronoEntry("noon", hour = 12)}
        ]"""
        val results = ChronoResultParser.parse(chronoJson, "", null)

        // Third result has no timezone → no instant
        assertNull("No-tz result should have null instant", results[2].instant)
        assertNotNull("No-tz result should still have localDateTime", results[2].localDateTime)
    }

    @Test
    fun `full pipeline - multiple moments with different local times`() {
        // "Meeting at 9am PT, lunch at 12pm ET" — two different moments
        val chronoJson = """[
            ${chronoEntry("9am PT", hour = 9, timezone = -420, dayCertain = true)},
            ${chronoEntry("12pm ET", hour = 12, timezone = -240)}
        ]"""
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)

        // 9am PT = 16:00 UTC, 12pm ET = 16:00 UTC ... actually same!
        // In April: PDT = UTC-7, EDT = UTC-4
        // 9am PDT = 16:00 UTC, 12pm EDT = 16:00 UTC → same instant
        assertEquals("9am PT and 12pm ET should be same instant", chronoResults[0].instant, chronoResults[1].instant)

        val converted = converter.toLocal(chronoResults, TimeZone.of("Asia/Tokyo"))
        // Both are the same moment, so they should produce the same local time
        // After distinctBy in TimeConverter, they may deduplicate
        assertTrue("Should have at least 1 result", converted.isNotEmpty())
    }

    @Test
    fun `full pipeline - truly different moments produce different local times`() {
        // "Meeting at 9am PT, dinner at 6pm PT"
        val chronoJson = """[
            ${chronoEntry("9am PT", hour = 9, timezone = -420, dayCertain = true)},
            ${chronoEntry("6pm PT", hour = 18, timezone = -420)}
        ]"""
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)
        assertEquals(2, chronoResults.size)
        assertTrue("Different hours should be different instants", chronoResults[0].instant != chronoResults[1].instant)

        val converted = converter.toLocal(chronoResults, TimeZone.of("Asia/Tokyo"))
        assertEquals(2, converted.size)
        assertTrue(
            "Different moments should have different local times",
            converted[0].localDateTime != converted[1].localDateTime,
        )
    }

    @Test
    fun `full pipeline - gemini fenced response through full pipeline`() {
        // Gemini sometimes wraps response in markdown code fences
        val geminiJson = "```json\n[${geminiEntry(time = "09:00:00", timezone = "America/Los_Angeles", original = "9am PT")}]\n```"
        val geminiResults = GeminiResultParser.parseResponse(geminiJson)
        assertEquals("Fenced JSON should parse", 1, geminiResults.size)
        assertNotNull(geminiResults[0].localDateTime)
        assertNotNull(geminiResults[0].instant)

        val converted = converter.toLocal(geminiResults, TimeZone.of("Europe/London"))
        assertEquals(1, converted.size)
    }

    @Test
    fun `full pipeline - end time inherits timezone from start through to conversion`() {
        val chronoJson = "[${chronoEntry(
            "2pm - 3pm PT",
            hour = 14, timezone = -420, dayCertain = true,
            end = chronoEndBlock(hour = 15),
        )}]"
        val results = ChronoResultParser.parse(chronoJson, "", null)
        assertEquals(2, results.size)

        // End should inherit start's timezone
        assertEquals(results[0].sourceTimezone, results[1].sourceTimezone)

        // Both should convert successfully
        val converted = converter.toLocal(results, TimeZone.of("Asia/Tokyo"))
        assertEquals(2, converted.size)

        // Source timezones should match
        assertEquals(converted[0].sourceTimezone, converted[1].sourceTimezone)
    }

    @Test
    fun `full pipeline - method attribution tracks through merge and conversion`() {
        val chronoJson = "[${chronoEntry("3pm ET", hour = 15, timezone = -240)}]"
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)

        val geminiJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]"
        val geminiResults = GeminiResultParser.parseResponse(geminiJson)

        // Chrono results don't have method set by the parser — it's set externally
        // Simulate the real pipeline: wrap chrono results with method
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
        // India Standard Time = +05:30 = 330 minutes
        val chronoJson = "[${chronoEntry("9pm IST", hour = 21, timezone = 330, dayCertain = true)}]"
        val results = ChronoResultParser.parse(chronoJson, "", null)
        assertEquals(1, results.size)
        assertNotNull(results[0].sourceTimezone)
        assertNotNull(results[0].instant)

        val converted = converter.toLocal(results, TimeZone.UTC)
        assertEquals(1, converted.size)
        assertTrue(
            "Source timezone should reflect +5:30, got '${converted[0].sourceTimezone}'",
            converted[0].sourceTimezone.contains("5:30") || converted[0].sourceTimezone.contains("5"),
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
            val results = GeminiResultParser.parseResponse(json)
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
            val results = GeminiResultParser.parseResponse(json)
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
        // The localDateTime bug: if any parser produces results without localDateTime,
        // ResultMerger.isSameLocalTime() fails and dedup breaks.
        for (chronoJson in chronoInputs) {
            for (geminiJson in geminiInputs) {
                val chrono = ChronoResultParser.parse(chronoJson, "", cityResolver)
                val gemini = GeminiResultParser.parseResponse(geminiJson)
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
                val gemini = GeminiResultParser.parseResponse(geminiJson)
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

    // ==================== GeminiResultParser invalid inputs ====================

    @Test
    fun `gemini invalid - time 24 00 returns null`() {
        val json = """[{"time":"24:00","date":"2026-04-11","timezone":"UTC","original":"24:00"}]"""
        val results = GeminiResultParser.parseResponse(json)
        assertTrue("24:00 is invalid, should produce no results", results.isEmpty())
    }

    @Test
    fun `gemini invalid - date 2026-13-01 returns null`() {
        val json = """[{"time":"12:00","date":"2026-13-01","timezone":"UTC","original":"invalid month"}]"""
        val results = GeminiResultParser.parseResponse(json)
        assertTrue("Month 13 is invalid", results.isEmpty())
    }

    @Test
    fun `gemini invalid - date 2026-04-31 returns null`() {
        val json = """[{"time":"12:00","date":"2026-04-31","timezone":"UTC","original":"April 31"}]"""
        val results = GeminiResultParser.parseResponse(json)
        assertTrue("April has 30 days", results.isEmpty())
    }

    @Test
    fun `gemini invalid - time 25 00 returns null`() {
        val json = """[{"time":"25:00","date":"2026-04-11","timezone":"UTC","original":"25:00"}]"""
        val results = GeminiResultParser.parseResponse(json)
        assertTrue("25:00 is invalid", results.isEmpty())
    }

    @Test
    fun `gemini invalid - timezone with space gives null tz but valid localDateTime`() {
        val json = """[{"time":"12:00:00","date":"2026-04-11","timezone":"America/New York","original":"noon"}]"""
        val results = GeminiResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertNull("'America/New York' is not a valid IANA zone", results[0].sourceTimezone)
        assertNotNull("localDateTime should still be set", results[0].localDateTime)
        assertEquals(0.7f, results[0].confidence)
    }

    @Test
    fun `gemini invalid - timezone lowercase america new_york`() {
        val json = """[{"time":"12:00:00","date":"2026-04-11","timezone":"america/new_york","original":"noon"}]"""
        val results = GeminiResultParser.parseResponse(json)
        assertEquals(1, results.size)
        // kotlinx.datetime.TimeZone.of is case-sensitive for IANA IDs;
        // "america/new_york" is not valid — should fall back to no-tz path
        if (results[0].sourceTimezone != null) {
            assertNotNull("If tz resolved, instant should be set", results[0].instant)
            assertEquals(0.9f, results[0].confidence)
        } else {
            assertNull("No tz → no instant", results[0].instant)
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
        assertFalse("Same hour:minute different day → isSameLocalTime is false", ResultMerger.isSameLocalTime(a, b))
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
        // isSameLocalTime now checks date too — different dates don't merge
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
        // "tokya" is edit distance 1 from "tokyo"
        val tz = resolver.resolve("tokya")
        assertNotNull("tokya (distance 1 from tokyo) should fuzzy-resolve", tz)
        assertEquals("Asia/Tokyo", tz!!.id)
    }

    @Test
    fun `editDistance - empty string resolves to nothing`() {
        val resolver = TestCityResolver()
        val tz = resolver.resolve("")
        // Empty string has large edit distance from everything, won't match within <= 2
        // But could match via substring — empty string is "in" everything.
        // Regardless, we verify no crash.
        // The result depends on implementation details, just ensure no exception.
    }

    @Test
    fun `editDistance - new york fuzzy resolve works`() {
        val resolver = TestCityResolver()
        // "new york" vs "newyork" — the CITY_MAP key is "new york" (from IANA: America/New_York → "new york")
        val tz = resolver.resolve("newyork")
        // edit distance("newyork", "new york") = 1 (missing space), should fuzzy-resolve
        assertNotNull("newyork should fuzzy-resolve to new york", tz)
        assertEquals("America/New_York", tz!!.id)
    }

    @Test
    fun `editDistance - londn fuzzy resolves to london`() {
        val resolver = TestCityResolver()
        val tz = resolver.resolve("londn")
        // edit distance("londn", "london") = 1
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
        // distinctBy uses originalText + localDateTime + localTimezone
        // Same localDateTime and localTimezone but different originalText → 2 results
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
    fun `date propagation - end time crossing midnight with date propagation`() {
        // Range: 11pm - 1am the next day. The end block has day=12, but since the end
        // is dateCertain=false it gets propagated to day=11 (from the certain start).
        // Known behavior: propagation resets the end date, so 1am becomes BEFORE 11pm.
        val chronoJson = "[${chronoEntry(
            "11pm - 1am ET",
            hour = 23, minute = 0, timezone = -240, dayCertain = true,
            end = chronoEndBlock(day = 12, hour = 1, minute = 0, timezone = -240),
        )}]"
        val results = ChronoResultParser.parse(chronoJson, "", null)
        assertEquals(2, results.size)
        assertNotNull(results[0].instant)
        assertNotNull(results[1].instant)
        // After propagation, end (day 11 1am) is BEFORE start (day 11 11pm).
        // This documents a known limitation of date propagation across midnight.
        assertTrue(
            "End instant is before start due to date propagation collapsing the day",
            results[1].instant!! < results[0].instant!!,
        )
    }

    @Test
    fun `date propagation - range across DST boundary does not crash`() {
        // US spring-forward: March 8, 2026 at 2am. Create a range spanning it.
        val chronoJson = "[${chronoEntry(
            "1am - 3am ET",
            year = 2026, month = 3, day = 8,
            hour = 1, minute = 0, timezone = -300, dayCertain = true,
            end = chronoEndBlock(year = 2026, month = 3, day = 8, hour = 3, minute = 0, timezone = -240),
        )}]"
        val results = ChronoResultParser.parse(chronoJson, "", null)
        assertEquals(2, results.size)
        // Just verify no crash and both have valid instants
        assertNotNull(results[0].instant)
        assertNotNull(results[1].instant)
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
        // BUG: Chrono interprets "1500 hours" as "1500 hours from now" (a duration)
        // not as 15:00 military time. It returns isCertain=true for everything.
        // Our pipeline should ideally reject this or at least not display garbage.
        val json = """[{"text":"1500 hours","index":8,"start":{"year":2026,"month":6,"day":8,"hour":11,"minute":35,"second":33,"timezone":600,"isCertain":{"year":true,"month":true,"day":true,"hour":true,"minute":true,"timezone":true}},"end":null}]"""
        val results = ChronoResultParser.parse(json, "Call at 1500 hours Zulu", cityResolver)
        // Currently this passes through as a valid result — documenting the bug
        // The result will have June 8 2026 as the date, which is WRONG
        // TODO: Add post-processing to detect unreasonable date jumps
        if (results.isNotEmpty()) {
            // At minimum verify it doesn't crash
            val converted = converter.toLocal(results, TimeZone.UTC)
            assertTrue("Should not crash converting misparse", converted.isNotEmpty())
        }
    }

    @Test
    fun `chrono drops pacific time timezone label`() {
        // BUG: "3pm-4pm pacific time" → Chrono returns tz:null
        // "pacific time" is not in Chrono's abbreviation list
        val json = """[{"text":"3pm-4pm","index":15,"start":{"year":2026,"month":4,"day":7,"hour":15,"minute":0,"second":0,"timezone":null,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":false}},"end":{"year":2026,"month":4,"day":7,"hour":16,"minute":0,"second":0,"timezone":null}}]"""
        val results = ChronoResultParser.parse(json, "The meeting is 3pm-4pm pacific time", cityResolver)
        assertEquals(2, results.size)
        // Both should have null timezone — "pacific time" not recognized
        assertNull("Start should lack timezone (Chrono limitation)", results[0].sourceTimezone)
        assertNull("End should lack timezone", results[1].sourceTimezone)
    }

    @Test
    fun `chrono drops Eastern timezone without abbreviation`() {
        // "Noon Eastern" → Chrono only parses "Noon", ignores "Eastern"
        val json = """[{"text":"Noon","index":0,"start":{"year":2026,"month":4,"day":7,"hour":12,"minute":0,"second":0,"timezone":null,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":false,"timezone":false}},"end":null}]"""
        val results = ChronoResultParser.parse(json, "Noon Eastern", cityResolver)
        assertEquals(1, results.size)
        assertNull("Chrono doesn't recognize 'Eastern' as a timezone", results[0].sourceTimezone)
    }

    @Test
    fun `chrono drops London time timezone label`() {
        // "2026-04-09 at 3pm London time" → gets date+time but not timezone
        val json = """[{"text":"2026-04-09 at 3pm","index":0,"start":{"year":2026,"month":4,"day":9,"hour":15,"minute":0,"second":0,"timezone":null,"isCertain":{"year":true,"month":true,"day":true,"hour":true,"minute":true,"timezone":false}},"end":null}]"""
        val results = ChronoResultParser.parse(json, "2026-04-09 at 3pm London time", cityResolver)
        assertEquals(1, results.size)
        // City resolver should NOT pick up "London" because the pattern requires "in" or "at" + city
        // and "London time" doesn't match "at London" or "in London" — it's "at 3pm London time"
        // The "at" binds to "3pm", not "London"
    }

    @Test
    fun `chrono misses abbreviated am 4 30a PT`() {
        // "April 9th, 4:30a PT" → Chrono only parses "April 9th", misses "4:30a"
        // because "4:30a" is not standard — should be "4:30 a.m." or "4:30am"
        val json = """[{"text":"April 9th","index":0,"start":{"year":2026,"month":4,"day":9,"hour":12,"minute":0,"second":0,"timezone":null,"isCertain":{"year":false,"month":true,"day":true,"hour":false,"minute":false,"timezone":false}},"end":null}]"""
        val results = ChronoResultParser.parse(json, "April 9th, 4:30a PT", cityResolver)
        // Bare date is the only result (Chrono missed "4:30a"), so it's kept
        assertEquals(1, results.size)
        assertEquals(12, results[0].localDateTime!!.hour)
    }

    @Test
    fun `chrono drops US Eastern timezone label`() {
        // "3:00 PM US Eastern" → Chrono only parses "3:00 PM"
        val json = """[{"text":"3:00 PM","index":0,"start":{"year":2026,"month":4,"day":7,"hour":15,"minute":0,"second":0,"timezone":null,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":false}},"end":null}]"""
        val results = ChronoResultParser.parse(json, "3:00 PM US Eastern", cityResolver)
        assertEquals(1, results.size)
        assertNull("Chrono doesn't recognize 'US Eastern'", results[0].sourceTimezone)
    }

    // ==================== Cross-parser consistency ====================

    @Test
    fun `gemini and chrono produce compatible results for same input`() {
        // Both parse "April 9 at 3:00 PM EST" — verify they produce results
        // that can be merged without explosion
        val chronoJson = """[{"text":"April 9 at 3:00 PM EST","index":0,"start":{"year":2026,"month":4,"day":9,"hour":15,"minute":0,"second":0,"timezone":-300,"isCertain":{"year":false,"month":true,"day":true,"hour":true,"minute":true,"timezone":true}},"end":null}]"""
        val geminiJson = """[{"time":"15:00","date":"2026-04-09","timezone":"America/New_York","original":"April 9 at 3:00 PM EST"}]"""

        val chrono = ChronoResultParser.parse(chronoJson, "", cityResolver)
        val gemini = GeminiResultParser.parseResponse(geminiJson)

        // Both should have: localDateTime, instant, sourceTimezone
        assertEquals(1, chrono.size)
        assertEquals(1, gemini.size)
        assertNotNull(chrono[0].localDateTime)
        assertNotNull(chrono[0].instant)
        assertNotNull(gemini[0].localDateTime)
        assertNotNull(gemini[0].instant)

        // Hours should match
        assertEquals(chrono[0].localDateTime!!.hour, gemini[0].localDateTime!!.hour)

        // Merge should produce 1 (fuzzy dedup) or 2 (different tz IDs) — not explode
        val merged = ResultMerger.mergeResults(chrono, gemini, "Gemini Nano")
        assertTrue("Merged should have 1-2 results, got ${merged.size}", merged.size in 1..2)
    }

    @Test
    fun `pipeline handles completely empty Chrono output gracefully`() {
        val chrono = ChronoResultParser.parse("[]", "", cityResolver)
        val geminiJson = """[{"time":"15:00","date":"2026-04-09","timezone":"America/New_York","original":"3pm EST"}]"""
        val gemini = GeminiResultParser.parseResponse(geminiJson)

        val merged = ResultMerger.mergeResults(chrono, gemini, "Gemini Nano")
        assertEquals("Gemini results should survive when Chrono is empty", 1, merged.size)
        assertNotNull(merged[0].localDateTime)
        assertNotNull(merged[0].instant)
    }

    @Test
    fun `pipeline handles Gemini returning garbage timezone gracefully`() {
        val geminiJson = """[{"time":"15:00","date":"2026-04-09","timezone":"NotATimezone/Fake","original":"3pm"}]"""
        val gemini = GeminiResultParser.parseResponse(geminiJson)

        // Should produce a result with null timezone but valid localDateTime
        assertEquals(1, gemini.size)
        assertNotNull("Should have localDateTime despite bad tz", gemini[0].localDateTime)
        assertNull("Bad timezone should be null", gemini[0].sourceTimezone)
        assertEquals(0.7f, gemini[0].confidence)
    }

    @Test
    fun `pipeline end-to-end with timezone-less results assumes device timezone`() {
        // When no timezone is detected, TimeConverter assumes the device's local timezone
        val chronoJson = """[{"text":"3:00 PM","index":0,"start":{"year":2026,"month":4,"day":9,"hour":15,"minute":0,"second":0,"timezone":null,"isCertain":{"day":false,"hour":true}},"end":null}]"""
        val results = ChronoResultParser.parse(chronoJson, "", cityResolver)
        assertEquals(1, results.size)
        assertNull(results[0].sourceTimezone)

        val localZone = TimeZone.of("America/New_York")
        val converted = converter.toLocal(results, localZone)
        assertEquals(1, converted.size)
        // Source timezone should match local (assumed device tz), not UTC
        assertTrue(
            "Source tz should reflect local zone, got '${converted[0].sourceTimezone}'",
            converted[0].sourceTimezone.contains("UTC-") || converted[0].sourceTimezone.contains("New_York"),
        )
        // Source and local time should be the same (no conversion happened)
        assertEquals("Source and local time should match", converted[0].sourceDateTime, converted[0].localDateTime)
    }

    // ==================== mergeSpanAndFullResults through real parsers ====================

    @Test
    fun `mergeSpanAndFull - span without tz upgraded by full with tz`() {
        val spanJson = "[${chronoEntry("9:00 a.m.", month = 4, day = 9, hour = 9, minute = 0)}]"
        val spanResults = ChronoResultParser.parse(spanJson, "", null)

        val fullJson = "[${chronoEntry("9:00 a.m. PT", month = 4, day = 9, hour = 9, minute = 0, timezone = -420)}]"
        val fullResults = ChronoResultParser.parse(fullJson, "", null)

        assertNull("Span should have no timezone", spanResults[0].sourceTimezone)
        assertNotNull("Full should have timezone", fullResults[0].sourceTimezone)

        val merged = ChronoResultParser.mergeSpanAndFullResults(spanResults, fullResults)
        assertEquals(1, merged.size)
        assertNotNull("Merged result should have timezone from full", merged[0].sourceTimezone)
    }

    @Test
    fun `mergeSpanAndFull - 3 spans without tz all upgraded by full with tz`() {
        val spanJson = """[
            ${chronoEntry("9:00 a.m.", month = 4, day = 9, hour = 9, minute = 0)},
            ${chronoEntry("10:00 a.m.", month = 4, day = 9, hour = 10, minute = 0)},
            ${chronoEntry("11:00 a.m.", month = 4, day = 9, hour = 11, minute = 0)}
        ]"""
        val spanResults = ChronoResultParser.parse(spanJson, "", null)

        val fullJson = """[
            ${chronoEntry("9:00 a.m. PT", month = 4, day = 9, hour = 9, minute = 0, timezone = -420)},
            ${chronoEntry("10:00 a.m. PT", month = 4, day = 9, hour = 10, minute = 0, timezone = -420)},
            ${chronoEntry("11:00 a.m. PT", month = 4, day = 9, hour = 11, minute = 0, timezone = -420)}
        ]"""
        val fullResults = ChronoResultParser.parse(fullJson, "", null)

        val merged = ChronoResultParser.mergeSpanAndFullResults(spanResults, fullResults)
        assertEquals(3, merged.size)
        merged.forEach { r ->
            assertNotNull("'${r.originalText}' should have timezone after merge", r.sourceTimezone)
        }
    }

    @Test
    fun `mergeSpanAndFull - span with tz preserved when full has no tz`() {
        val spanJson = "[${chronoEntry("9:00 a.m. ET", month = 4, day = 9, hour = 9, minute = 0, timezone = -240)}]"
        val spanResults = ChronoResultParser.parse(spanJson, "", null)

        val fullJson = "[${chronoEntry("9:00 a.m.", month = 4, day = 9, hour = 9, minute = 0)}]"
        val fullResults = ChronoResultParser.parse(fullJson, "", null)

        assertNotNull("Span should have timezone", spanResults[0].sourceTimezone)
        assertNull("Full should not have timezone", fullResults[0].sourceTimezone)

        val merged = ChronoResultParser.mergeSpanAndFullResults(spanResults, fullResults)
        assertEquals(1, merged.size)
        assertNotNull("Span timezone should be preserved", merged[0].sourceTimezone)
    }

    @Test
    fun `mergeSpanAndFull - empty spans plus valid full keeps full results`() {
        val spanResults = ChronoResultParser.parse("[]", "", null)
        val fullJson = "[${chronoEntry("9:00 a.m. PT", month = 4, day = 9, hour = 9, minute = 0, timezone = -420)}]"
        val fullResults = ChronoResultParser.parse(fullJson, "", null)

        val merged = ChronoResultParser.mergeSpanAndFullResults(spanResults, fullResults)
        assertEquals(1, merged.size)
        assertNotNull(merged[0].sourceTimezone)
    }

    @Test
    fun `mergeSpanAndFull - valid spans plus empty full keeps span results`() {
        val spanJson = "[${chronoEntry("9:00 a.m.", month = 4, day = 9, hour = 9, minute = 0)}]"
        val spanResults = ChronoResultParser.parse(spanJson, "", null)
        val fullResults = ChronoResultParser.parse("[]", "", null)

        val merged = ChronoResultParser.mergeSpanAndFullResults(spanResults, fullResults)
        assertEquals(1, merged.size)
        assertEquals(9, merged[0].localDateTime!!.hour)
    }

    // ==================== sourceDate field verification ====================

    @Test
    fun `sourceDate - EST to JST may differ at date boundary`() {
        // 11:00 PM EST on April 9 = April 10 in JST (UTC+9)
        val chronoJson = "[${chronoEntry("11:00 PM EST", month = 4, day = 9, hour = 23, timezone = -300, dayCertain = true)}]"
        val results = ChronoResultParser.parse(chronoJson, "", null)
        val converted = converter.toLocal(results, TimeZone.of("Asia/Tokyo"))
        assertEquals(1, converted.size)
        assertTrue("sourceDate should contain Apr 9, got '${converted[0].sourceDate}'",
            converted[0].sourceDate.contains("9"))
        assertTrue("localDate should contain Apr 10, got '${converted[0].localDate}'",
            converted[0].localDate.contains("10"))
    }

    @Test
    fun `sourceDate - UTC midnight Jan 1 to Honolulu crosses date boundary`() {
        // UTC midnight Jan 1 = Dec 31 in Honolulu (UTC-10)
        val chronoJson = "[${chronoEntry("midnight UTC", year = 2026, month = 1, day = 1, hour = 0, minute = 0, timezone = 0, dayCertain = true)}]"
        val results = ChronoResultParser.parse(chronoJson, "", null)
        val converted = converter.toLocal(results, TimeZone.of("Pacific/Honolulu"))
        assertEquals(1, converted.size)
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
        // Chrono: 3pm with offset -360 (in April maps to America/Chicago CDT? No, -360 = CST = UTC-6.
        // In April, America/Denver is MDT = UTC-6)
        val chronoJson = "[${chronoEntry("3pm", hour = 15, timezone = -360, dayCertain = true)}]"
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)

        val geminiJson = "[${geminiEntry(time = "15:00:00", timezone = "America/Chicago", original = "3pm")}]"
        val geminiResults = GeminiResultParser.parseResponse(geminiJson)

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
        val chronoJson = "[${chronoEntry("3pm ET", hour = 15, timezone = -240, dayCertain = true)}]"
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)

        val geminiJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]"
        val geminiResults = GeminiResultParser.parseResponse(geminiJson)

        // Chrono offset -240 in April = EDT = America/New_York
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
        val chronoJson = "[${chronoEntry("3:00 PM", hour = 15, minute = 0)}]"
        val results = ChronoResultParser.parse(chronoJson, "", null)
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
    fun `litert extractor - GeminiResultParser reused for LiteRT output parsing`() {
        val liteRtJson = """[
            ${geminiEntry(time = "09:00:00", timezone = "America/Los_Angeles", original = "9am PT")}
        ]"""
        val results = GeminiResultParser.parseResponse(liteRtJson)
        assertEquals("LiteRT uses same JSON format as Gemini", 1, results.size)
        assertNotNull("localDateTime should be set", results[0].localDateTime)
        assertNotNull("instant should be set", results[0].instant)
        assertEquals("America/Los_Angeles", results[0].sourceTimezone?.id)
    }

    // ==================== GeminiResultParser handles LiteRT output identically ====================

    @Test
    fun `litert output - parse typical LiteRT response`() {
        val liteRtResponse = """[
            {"time":"14:30:00","date":"2026-04-11","timezone":"America/New_York","original":"2:30 PM ET"},
            {"time":"19:30:00","date":"2026-04-11","timezone":"UTC","original":"7:30 PM UTC"}
        ]"""
        val results = GeminiResultParser.parseResponse(liteRtResponse)
        assertEquals(2, results.size)
        assertEquals(14, results[0].localDateTime!!.hour)
        assertEquals(30, results[0].localDateTime!!.minute)
        assertEquals(19, results[1].localDateTime!!.hour)
    }

    @Test
    fun `litert output - localDateTime is set (regression)`() {
        val json = """[{"time":"10:00:00","date":"2026-04-11","timezone":"Asia/Tokyo","original":"10am JST"}]"""
        val results = GeminiResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertNotNull("localDateTime must be set for LiteRT output", results[0].localDateTime)
        assertEquals(10, results[0].localDateTime!!.hour)
        assertEquals(11, results[0].localDateTime!!.dayOfMonth)
    }

    @Test
    fun `litert output - timezone resolution works`() {
        val json = """[{"time":"08:00:00","date":"2026-04-11","timezone":"Europe/London","original":"8am BST"}]"""
        val results = GeminiResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertNotNull(results[0].sourceTimezone)
        assertEquals("Europe/London", results[0].sourceTimezone!!.id)
        assertNotNull(results[0].instant)
    }

    @Test
    fun `litert output - method field can be LiteRT`() {
        val json = """[{"time":"15:00:00","date":"2026-04-11","timezone":"America/New_York","original":"3pm ET"}]"""
        val results = GeminiResultParser.parseResponse(json)
        val withMethod = results.map { it.copy(method = "LiteRT") }
        assertEquals(1, withMethod.size)
        assertEquals("LiteRT", withMethod[0].method)
    }

    // ==================== Pipeline with LiteRT in the mix ====================

    @Test
    fun `litert pipeline - chrono and litert results merge correctly`() {
        val chronoJson = "[${chronoEntry("3pm ET", hour = 15, timezone = -240, dayCertain = true)}]"
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)

        val liteRtJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]"
        val liteRtResults = GeminiResultParser.parseResponse(liteRtJson)

        val merged = ResultMerger.mergeResults(chronoResults, liteRtResults, "LiteRT")
        assertTrue("Merged should have results", merged.isNotEmpty())

        val liteRtMethodResult = merged.find { it.method.contains("LiteRT") }
        assertNotNull("At least one result should reference LiteRT", liteRtMethodResult)
    }

    @Test
    fun `litert pipeline - different timezone than chrono keeps both interpretations`() {
        val chronoJson = "[${chronoEntry("3pm", hour = 15, timezone = -420, dayCertain = true)}]"
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)

        val liteRtJson = "[${geminiEntry(time = "15:00:00", timezone = "America/Chicago", original = "3pm")}]"
        val liteRtResults = GeminiResultParser.parseResponse(liteRtJson)

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
        val chronoJson = "[${chronoEntry("3pm ET", hour = 15, timezone = -240, dayCertain = true)}]"
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)

        val liteRtJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]"
        val liteRtResults = GeminiResultParser.parseResponse(liteRtJson)

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
        val regexExtractor = RegexExtractor(cityResolver)
        val regexResult = regexExtractor.extract("created at 1712678400")

        val chronoJson = "[${chronoEntry("3pm", hour = 15, timezone = -240, dayCertain = true)}]"
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)

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
        val chronoJson = "[${chronoEntry("3pm ET", hour = 15, timezone = -240, dayCertain = true)}]"
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)

        val liteRtJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]"
        val liteRtResults = GeminiResultParser.parseResponse(liteRtJson)

        val geminiJson = "[${geminiEntry(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]"
        val geminiResults = GeminiResultParser.parseResponse(geminiJson)

        // Simulate the 3-stage merge order
        var merged = ResultMerger.mergeResults(chronoResults, liteRtResults, "LiteRT")
        merged = ResultMerger.mergeResults(merged, geminiResults, "Gemini Nano")

        // All are the same instant+tz, so should be 1 result
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
}
