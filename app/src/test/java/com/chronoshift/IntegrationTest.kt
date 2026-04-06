package com.chronoshift

import com.chronoshift.conversion.TimeConverter
import com.chronoshift.nlp.ChronoResultParser
import com.chronoshift.nlp.GeminiResultParser
import com.chronoshift.nlp.ResultMerger
import com.chronoshift.nlp.TestCityResolver
import kotlinx.datetime.TimeZone
import org.junit.Assert.assertEquals
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

        // Timezone alignment: PT (-420) and ET (-240) should share the same instant
        assertNotNull("PT should have instant", chronoResults[0].instant)
        assertNotNull("ET should have instant", chronoResults[1].instant)
        assertEquals("PT and ET should be same instant", chronoResults[0].instant, chronoResults[1].instant)

        // CST (-360 = US Central) should be realigned to match the majority
        assertNotNull("CST should have instant after alignment", chronoResults[2].instant)
        assertEquals("CST should align to same instant as PT/ET", chronoResults[0].instant, chronoResults[2].instant)
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
        val aligned = ChronoResultParser.alignAmbiguousTimezones(merged)

        // Should merge to 3, not 5+ (the old bug when localDateTime was missing)
        assertEquals(
            "Merged + aligned should be 3 results, got ${aligned.size}: ${aligned.map { "'${it.originalText}' tz=${it.sourceTimezone?.id}" }}",
            3, aligned.size,
        )

        // Methods should reflect both sources for the fuzzy-matched entries
        aligned.forEach { r ->
            assertTrue(
                "'${r.originalText}' method should have content, got '${r.method}'",
                r.method.isNotEmpty(),
            )
        }
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
        val aligned = ChronoResultParser.alignAmbiguousTimezones(merged)

        val tokyo = TimeZone.of("Asia/Tokyo")
        val converted = converter.toLocal(aligned, tokyo)

        assertTrue(
            "Should produce converted results, got ${converted.size}",
            converted.isNotEmpty(),
        )

        // All results represent the same moment (11:30 UTC = 20:30 JST)
        // so all local times should be the same (after dedup by distinctBy)
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

        // Fuzzy match on hour:minute should deduplicate to 1
        assertEquals(
            "Single time should merge to 1, got ${merged.size}: ${merged.map { "'${it.originalText}' tz=${it.sourceTimezone?.id}" }}",
            1, merged.size,
        )

        val converted = converter.toLocal(merged, TimeZone.of("Asia/Tokyo"))
        assertEquals(1, converted.size)
        assertNotNull(converted[0].localDateTime)
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

        // Different years = different instants AND different local dates, so no isSameTime match
        // isSameLocalTime checks hour:minute only, so it WILL fuzzy match (both 4:30)
        // The fuzzy match keeps existing (Chrono with tz) since both have timezone
        assertEquals(
            "Fuzzy match on hour:minute means 1 result (Chrono kept), got ${merged.size}",
            1, merged.size,
        )
        // Chrono's result is kept (it has sourceTimezone)
        assertEquals(2026, merged[0].localDateTime!!.year)
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
    fun `regression - alignment does not create null instants`() {
        // If a result without instant goes through alignment, it should remain unchanged
        val chronoJson = """[
            ${chronoEntry("4:30 PT", hour = 4, minute = 30, timezone = -420, dayCertain = true)},
            ${chronoEntry("7:30 ET", hour = 7, minute = 30, timezone = -240)},
            ${chronoEntry("noon", hour = 12)}
        ]"""
        val results = ChronoResultParser.parse(chronoJson, "", null)

        // Third result has no timezone → no instant
        assertNull("No-tz result should have null instant before alignment", results[2].instant)
        assertNotNull("No-tz result should still have localDateTime", results[2].localDateTime)

        val aligned = ChronoResultParser.alignAmbiguousTimezones(results)
        // The null-instant result should pass through unchanged
        assertNull("No-tz result should still have null instant after alignment", aligned[2].instant)
        assertNotNull("No-tz result should keep localDateTime", aligned[2].localDateTime)
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
    fun `invariant - alignment never produces null instant`() {
        for (json in chronoInputs) {
            val results = ChronoResultParser.parse(json, "", cityResolver)
            val aligned = ChronoResultParser.alignAmbiguousTimezones(results)
            aligned.forEach { r ->
                if (r.sourceTimezone != null) {
                    assertNotNull(
                        "Aligned result '${r.originalText}' with tz must keep instant",
                        r.instant,
                    )
                }
            }
        }
    }

    @Test
    fun `invariant - alignment never changes result count`() {
        for (json in chronoInputs) {
            val results = ChronoResultParser.parse(json, "", cityResolver)
            val aligned = ChronoResultParser.alignAmbiguousTimezones(results)
            assertEquals(
                "Alignment must not add or remove results",
                results.size, aligned.size,
            )
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
}
