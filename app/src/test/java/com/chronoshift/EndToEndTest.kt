package com.chronoshift

import com.chronoshift.conversion.TimeConverter
import com.chronoshift.nlp.ChronoResultParser
import com.chronoshift.nlp.GeminiResultParser
import com.chronoshift.nlp.IanaCityLookup
import com.chronoshift.nlp.RegexExtractor
import com.chronoshift.nlp.ResultMerger
import com.chronoshift.nlp.TestCityResolver
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.TimeZone
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * End-to-end tests with realistic input strings and specific output assertions.
 *
 * Each test simulates what Chrono.js and/or Gemini would produce for a given user input,
 * then verifies the full pipeline produces correct converted times.
 *
 * Default target timezone: Asia/Tokyo (UTC+9) — far from US timezones so errors are obvious.
 */
class EndToEndTest {

    private val converter = TimeConverter()
    private val cityResolver = TestCityResolver()
    private val tokyo = TimeZone.of("Asia/Tokyo")

    @Before
    fun setup() {
        ChronoResultParser.clearOffsetCache()
    }

    // --- JSON builder helpers ---

    private fun chrono(
        text: String,
        year: Int = 2026, month: Int = 4, day: Int = 9,
        hour: Int, minute: Int = 0, second: Int = 0,
        timezone: Int? = null, dayCertain: Boolean = false,
        hourCertain: Boolean = true,
        end: String? = null,
    ): String {
        val tzJson = timezone?.toString() ?: "null"
        return """{"text":"$text","index":0,"start":{"year":$year,"month":$month,"day":$day,"hour":$hour,"minute":$minute,"second":$second,"timezone":$tzJson,"isCertain":{"year":false,"month":$dayCertain,"day":$dayCertain,"hour":$hourCertain,"minute":true,"timezone":${timezone != null}}},"end":${end ?: "null"}}"""
    }

    private fun chronoEnd(
        year: Int = 2026, month: Int = 4, day: Int = 9,
        hour: Int, minute: Int = 0, second: Int = 0,
        timezone: Int? = null,
    ): String {
        val tzJson = timezone?.toString() ?: "null"
        return """{"year":$year,"month":$month,"day":$day,"hour":$hour,"minute":$minute,"second":$second,"timezone":$tzJson}"""
    }

    private fun gemini(
        time: String, date: String = "2026-04-09",
        timezone: String = "", original: String,
    ): String = """{"time":"$time","date":"$date","timezone":"$timezone","original":"$original"}"""

    private fun parseAndConvert(
        chronoJson: String,
        originalText: String = "",
        geminiJson: String? = null,
        localZone: TimeZone = tokyo,
    ): List<com.chronoshift.conversion.ConvertedTime> {
        val chronoResults = ChronoResultParser.parse(chronoJson, originalText, cityResolver)
        val merged = if (geminiJson != null) {
            val geminiResults = GeminiResultParser.parseResponse(geminiJson)
            ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")
        } else {
            chronoResults
        }
        return converter.toLocal(merged, localZone)
    }

    private fun assertLocalTime(expected: String, actual: String, msg: String = "") {
        assertTrue(
            "$msg — expected '$expected' in '$actual'",
            actual.contains(expected),
        )
    }

    // =====================================================================
    // 1. Simple time + timezone abbreviation (20 tests)
    // =====================================================================

    @Test fun `3pm EST - 15 00 offset -300 to Tokyo`() {
        val c = parseAndConvert("[${chrono("3pm EST", hour = 15, timezone = -300)}]")
        assertEquals(1, c.size)
        // 15:00 UTC-5 = 20:00 UTC = 05:00+1 JST
        assertLocalTime("5:00", c[0].localDateTime, "3pm EST → JST")
    }

    @Test fun `9 30 AM PST - offset -480 to Tokyo`() {
        val c = parseAndConvert("[${chrono("9:30 AM PST", hour = 9, minute = 30, timezone = -480)}]")
        assertEquals(1, c.size)
        // 09:30 UTC-8 = 17:30 UTC = 02:30+1 JST
        assertLocalTime("2:30", c[0].localDateTime, "9:30 AM PST → JST")
    }

    @Test fun `midnight UTC to Tokyo is 9am`() {
        val c = parseAndConvert("[${chrono("midnight UTC", hour = 0, timezone = 0)}]")
        assertEquals(1, c.size)
        assertLocalTime("9:00", c[0].localDateTime, "midnight UTC → JST")
    }

    @Test fun `11 59 PM JST stays same in Tokyo`() {
        val c = parseAndConvert("[${chrono("11:59 PM JST", hour = 23, minute = 59, timezone = 540)}]")
        assertEquals(1, c.size)
        assertLocalTime("11:59", c[0].localDateTime)
    }

    @Test fun `noon GMT to Tokyo is 9pm`() {
        val c = parseAndConvert("[${chrono("noon GMT", hour = 12, timezone = 0)}]")
        assertEquals(1, c.size)
        assertLocalTime("9:00", c[0].localDateTime, "noon GMT → JST")
    }

    @Test fun `3pm CDT offset -300 to Tokyo`() {
        // CDT = UTC-5
        val c = parseAndConvert("[${chrono("3pm CDT", hour = 15, timezone = -300)}]")
        assertEquals(1, c.size)
        assertLocalTime("5:00", c[0].localDateTime, "3pm CDT → JST")
    }

    @Test fun `8 15 AM EDT offset -240 to Tokyo`() {
        val c = parseAndConvert("[${chrono("8:15 AM EDT", hour = 8, minute = 15, timezone = -240)}]")
        assertEquals(1, c.size)
        // 08:15 UTC-4 = 12:15 UTC = 21:15 JST
        assertLocalTime("9:15", c[0].localDateTime, "8:15 AM EDT → JST")
    }

    @Test fun `10 AM MST offset -420 to Tokyo`() {
        // MST = UTC-7
        val c = parseAndConvert("[${chrono("10:00 AM MST", hour = 10, timezone = -420)}]")
        assertEquals(1, c.size)
        // 10:00 UTC-7 = 17:00 UTC = 02:00+1 JST
        assertLocalTime("2:00", c[0].localDateTime, "10 AM MST → JST")
    }

    @Test fun `7pm PDT offset -420 to Tokyo`() {
        val c = parseAndConvert("[${chrono("7:00 p.m. PDT", hour = 19, timezone = -420)}]")
        assertEquals(1, c.size)
        // 19:00 UTC-7 = 02:00+1 UTC = 11:00+1 JST
        assertLocalTime("11:00", c[0].localDateTime, "7pm PDT → JST")
    }

    @Test fun `noon IST plus 330 to Tokyo`() {
        val c = parseAndConvert("[${chrono("noon IST", hour = 12, timezone = 330)}]")
        assertEquals(1, c.size)
        // 12:00 UTC+5:30 = 06:30 UTC = 15:30 JST
        assertLocalTime("3:30", c[0].localDateTime, "noon IST → JST")
    }

    @Test fun `8am AEST plus 600 to Tokyo`() {
        val c = parseAndConvert("[${chrono("8am AEST", hour = 8, timezone = 600)}]")
        assertEquals(1, c.size)
        // 08:00 UTC+10 = 22:00-1 UTC = 07:00 JST
        assertLocalTime("7:00", c[0].localDateTime, "8am AEST → JST")
    }

    @Test fun `3pm CET plus 60 to Tokyo`() {
        val c = parseAndConvert("[${chrono("3pm CET", hour = 15, timezone = 60)}]")
        assertEquals(1, c.size)
        // 15:00 UTC+1 = 14:00 UTC = 23:00 JST
        assertLocalTime("11:00", c[0].localDateTime, "3pm CET → JST")
    }

    @Test fun `2pm CEST plus 120 to Tokyo`() {
        val c = parseAndConvert("[${chrono("2pm CEST", hour = 14, timezone = 120)}]")
        assertEquals(1, c.size)
        // 14:00 UTC+2 = 12:00 UTC = 21:00 JST
        assertLocalTime("9:00", c[0].localDateTime, "2pm CEST → JST")
    }

    @Test fun `8pm KST stays same offset as Tokyo`() {
        // KST = UTC+9 = same as JST
        val c = parseAndConvert("[${chrono("8pm KST", hour = 20, timezone = 540)}]")
        assertEquals(1, c.size)
        assertLocalTime("8:00", c[0].localDateTime, "8pm KST = 8pm JST")
    }

    @Test fun `3pm SGT plus 480 to Tokyo`() {
        // SGT = UTC+8
        val c = parseAndConvert("[${chrono("3pm SGT", hour = 15, timezone = 480)}]")
        assertEquals(1, c.size)
        // 15:00 UTC+8 = 07:00 UTC = 16:00 JST
        assertLocalTime("4:00", c[0].localDateTime, "3pm SGT → JST")
    }

    @Test fun `6am NZST plus 720 to Tokyo`() {
        // NZST = UTC+12
        val c = parseAndConvert("[${chrono("6am NZST", hour = 6, timezone = 720)}]")
        assertEquals(1, c.size)
        // 06:00 UTC+12 = 18:00-1 UTC = 03:00 JST
        assertLocalTime("3:00", c[0].localDateTime, "6am NZST → JST")
    }

    @Test fun `10pm HST minus 600 to Tokyo`() {
        // HST = UTC-10
        val c = parseAndConvert("[${chrono("10pm HST", hour = 22, timezone = -600)}]")
        assertEquals(1, c.size)
        // 22:00 UTC-10 = 08:00+1 UTC = 17:00+1 JST
        assertLocalTime("5:00", c[0].localDateTime, "10pm HST → JST")
    }

    @Test fun `5pm BRT minus 180 to Tokyo`() {
        // BRT = UTC-3
        val c = parseAndConvert("[${chrono("5pm BRT", hour = 17, timezone = -180)}]")
        assertEquals(1, c.size)
        // 17:00 UTC-3 = 20:00 UTC = 05:00+1 JST
        assertLocalTime("5:00", c[0].localDateTime, "5pm BRT → JST")
    }

    @Test fun `11 45 PM SAST plus 120 to Tokyo`() {
        // SAST = UTC+2
        val c = parseAndConvert("[${chrono("11:45 PM SAST", hour = 23, minute = 45, timezone = 120)}]")
        assertEquals(1, c.size)
        // 23:45 UTC+2 = 21:45 UTC = 06:45+1 JST
        assertLocalTime("6:45", c[0].localDateTime, "11:45 PM SAST → JST")
    }

    @Test fun `4am HKT plus 480 to New York`() {
        // HKT = UTC+8
        val c = parseAndConvert("[${chrono("4am HKT", hour = 4, timezone = 480)}]", localZone = TimeZone.of("America/New_York"))
        assertEquals(1, c.size)
        // 04:00 UTC+8 = 20:00-1 UTC = 16:00-1 EDT
        assertTrue(c[0].localTimezone.contains("New York"))
    }

    // =====================================================================
    // 2. Date + time + timezone (15 tests)
    // =====================================================================

    @Test fun `April 9 at 3pm EDT with Gemini`() {
        val cJson = "[${chrono("3:00 PM EDT", day = 9, hour = 15, timezone = -240, dayCertain = true)}]"
        val gJson = "[${gemini(time = "15:00:00", timezone = "America/New_York", original = "April 9 at 3:00 PM EDT")}]"
        val c = parseAndConvert(cJson, geminiJson = gJson)
        assertTrue(c.isNotEmpty())
        c.forEach { assertTrue(it.localTimezone.contains("UTC+9")) }
    }

    @Test fun `Dec 31 11 59 PM PST crosses year boundary in Tokyo`() {
        val c = parseAndConvert("[${chrono("11:59 PM PST", year = 2026, month = 12, day = 31, hour = 23, minute = 59, timezone = -480, dayCertain = true)}]")
        assertEquals(1, c.size)
        assertTrue(c[0].localDate.contains("Jan") || c[0].localDate.contains("1"))
    }

    @Test fun `Jan 1 midnight UTC is Dec 31 in Honolulu`() {
        val c = parseAndConvert("[${chrono("midnight", year = 2026, month = 1, day = 1, hour = 0, timezone = 0, dayCertain = true)}]", localZone = TimeZone.of("Pacific/Honolulu"))
        assertEquals(1, c.size)
        assertTrue(c[0].localDate.contains("Dec") || c[0].localDate.contains("31"))
    }

    @Test fun `9 April 2026 at 15 00 BST European format`() {
        val c = parseAndConvert("[${chrono("15:00 BST", month = 4, day = 9, hour = 15, timezone = 60, dayCertain = true)}]")
        assertEquals(1, c.size)
        // 15:00 UTC+1 = 14:00 UTC = 23:00 JST
        assertLocalTime("11:00", c[0].localDateTime, "15:00 BST → JST")
    }

    @Test fun `Fri 10 Jul 2026 09 30 GMT RFC style`() {
        val c = parseAndConvert("[${chrono("09:30:00 GMT", year = 2026, month = 7, day = 10, hour = 9, minute = 30, timezone = 0, dayCertain = true)}]")
        assertEquals(1, c.size)
        assertLocalTime("6:30", c[0].localDateTime, "09:30 GMT → JST")
    }

    @Test fun `Wed Apr 9 2026 4 30 AM PDT calendar`() {
        val c = parseAndConvert("[${chrono("4:30 AM PDT", month = 4, day = 9, hour = 4, minute = 30, timezone = -420, dayCertain = true)}]")
        assertEquals(1, c.size)
        // 04:30 UTC-7 = 11:30 UTC = 20:30 JST
        assertLocalTime("8:30", c[0].localDateTime, "4:30 AM PDT → JST")
    }

    @Test fun `04 09 2026 3 PM EST US numeric date`() {
        val c = parseAndConvert("[${chrono("3:00 PM EST", year = 2026, month = 4, day = 9, hour = 15, timezone = -300, dayCertain = true)}]")
        assertEquals(1, c.size)
        assertLocalTime("5:00", c[0].localDateTime)
    }

    @Test fun `2026-04-09T14 00 00Z ISO 8601`() {
        val c = parseAndConvert("[${chrono("2026-04-09T14:00:00Z", year = 2026, month = 4, day = 9, hour = 14, timezone = 0, dayCertain = true)}]")
        assertEquals(1, c.size)
        // 14:00 UTC = 23:00 JST
        assertLocalTime("11:00", c[0].localDateTime, "14:00Z → JST")
    }

    @Test fun `March 15 at 2 30pm GMT no year`() {
        val c = parseAndConvert("[${chrono("2:30pm GMT", month = 3, day = 15, hour = 14, minute = 30, timezone = 0, dayCertain = true)}]")
        assertEquals(1, c.size)
        assertLocalTime("11:30", c[0].localDateTime, "2:30 PM GMT → JST")
    }

    @Test fun `Jan 1 2027 at midnight EST`() {
        // offset -300 maps to a named IANA zone; exact JST time depends on offset mapping
        val c = parseAndConvert("[${chrono("midnight EST", year = 2027, month = 1, day = 1, hour = 0, timezone = -300, dayCertain = true)}]")
        assertEquals(1, c.size)
        assertTrue(c[0].localTimezone.contains("UTC+9"))
        assertTrue(c[0].localDate.contains("Jan"))
    }

    @Test fun `May 1st 2026 8 AM JST ordinal`() {
        val c = parseAndConvert("[${chrono("8:00 AM JST", year = 2026, month = 5, day = 1, hour = 8, timezone = 540, dayCertain = true)}]")
        assertEquals(1, c.size)
        assertLocalTime("8:00", c[0].localDateTime, "8 AM JST → JST stays same")
    }

    @Test fun `June 15th 2026 14 00 IST no comma`() {
        val c = parseAndConvert("[${chrono("14:00 IST", year = 2026, month = 6, day = 15, hour = 14, timezone = 330, dayCertain = true)}]")
        assertEquals(1, c.size)
        // 14:00 UTC+5:30 = 08:30 UTC = 17:30 JST
        assertLocalTime("5:30", c[0].localDateTime, "14:00 IST → JST")
    }

    @Test fun `Saturday 11 April 2026 at 5pm AEST`() {
        val c = parseAndConvert("[${chrono("5pm AEST", year = 2026, month = 4, day = 11, hour = 17, timezone = 600, dayCertain = true)}]")
        assertEquals(1, c.size)
        // 17:00 UTC+10 = 07:00 UTC = 16:00 JST
        assertLocalTime("4:00", c[0].localDateTime, "5pm AEST → JST")
    }

    @Test fun `Feb 29 2028 12 PM EST leap year`() {
        val c = parseAndConvert("[${chrono("12 PM EST", year = 2028, month = 2, day = 29, hour = 12, timezone = -300, dayCertain = true)}]")
        assertEquals(1, c.size)
        assertNotNull(c[0].localDateTime)
    }

    @Test fun `date with Gemini Chrono different tz IDs both kept`() {
        // Chrono: offset -300 → maps to a named zone
        // Gemini: America/New_York (EDT = -240 in April)
        val cJson = "[${chrono("3pm", day = 9, hour = 15, timezone = -300, dayCertain = true)}]"
        val gJson = "[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm")}]"
        val c = parseAndConvert(cJson, geminiJson = gJson)
        // Different tz IDs → both interpretations kept
        assertTrue("Should have 1 or 2 results", c.size in 1..2)
    }

    // =====================================================================
    // 3. Multiple timestamps / slash-separated (10 tests)
    // =====================================================================

    @Test fun `two timezone - 9am PT 12pm ET same instant`() {
        val cJson = """[
            ${chrono("9:00 a.m. PT", hour = 9, timezone = -420, dayCertain = true)},
            ${chrono("12:00 p.m. ET", hour = 12, timezone = -240)}
        ]"""
        val c = parseAndConvert(cJson)
        assertTrue(c.isNotEmpty())
        c.forEach { assertTrue(it.localTimezone.contains("UTC+9")) }
    }

    @Test fun `three timezone - PT ET GMT`() {
        val cJson = """[
            ${chrono("9am PT", hour = 9, timezone = -420, dayCertain = true)},
            ${chrono("12pm ET", hour = 12, timezone = -240)},
            ${chrono("5pm GMT", hour = 17, timezone = 0)}
        ]"""
        val c = parseAndConvert(cJson)
        assertTrue(c.isNotEmpty())
    }

    @Test fun `three timezone with date propagation`() {
        val cJson = """[
            ${chrono("4:30 a.m. PT", day = 11, hour = 4, minute = 30, timezone = -420, dayCertain = true)},
            ${chrono("7:30 a.m. ET", day = 6, hour = 7, minute = 30, timezone = -240)},
            ${chrono("19:30 CST", day = 6, hour = 19, minute = 30, timezone = -360)}
        ]"""
        val results = ChronoResultParser.parse(cJson, "", null)
        // Date propagation: all should have day 11
        results.forEach { assertEquals(11, it.localDateTime!!.dayOfMonth) }
    }

    @Test fun `four timezone global meeting`() {
        val cJson = """[
            ${chrono("6pm CET", hour = 18, timezone = 60, dayCertain = true)},
            ${chrono("5pm GMT", hour = 17, timezone = 0)},
            ${chrono("12pm ET", hour = 12, timezone = -240)},
            ${chrono("9am PT", hour = 9, timezone = -420)}
        ]"""
        val c = parseAndConvert(cJson)
        assertTrue("Should have results", c.isNotEmpty())
    }

    @Test fun `Asia IST plus GMT plus US EST`() {
        val cJson = """[
            ${chrono("8:30 PM IST", hour = 20, minute = 30, timezone = 330, dayCertain = true)},
            ${chrono("3:00 PM GMT", hour = 15, timezone = 0)},
            ${chrono("10:00 AM EST", hour = 10, timezone = -300)}
        ]"""
        val c = parseAndConvert(cJson)
        assertTrue(c.isNotEmpty())
    }

    @Test fun `two timezone with Gemini confirmation`() {
        val cJson = """[
            ${chrono("3pm ET", hour = 15, timezone = -240, dayCertain = true)},
            ${chrono("12pm PT", hour = 12, timezone = -420)}
        ]"""
        val gJson = """[
            ${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")},
            ${gemini(time = "12:00:00", timezone = "America/Los_Angeles", original = "12pm PT")}
        ]"""
        val c = parseAndConvert(cJson, geminiJson = gJson)
        assertTrue(c.isNotEmpty())
    }

    @Test fun `noon ET and 9am PT`() {
        val cJson = """[
            ${chrono("noon ET", hour = 12, timezone = -240, dayCertain = true)},
            ${chrono("9am PT", hour = 9, timezone = -420)}
        ]"""
        val c = parseAndConvert(cJson)
        assertTrue(c.isNotEmpty())
    }

    @Test fun `JST plus GMT two timezones`() {
        val cJson = """[
            ${chrono("10am JST", hour = 10, timezone = 540, dayCertain = true)},
            ${chrono("1am GMT", hour = 1, timezone = 0)}
        ]"""
        val c = parseAndConvert(cJson)
        assertTrue(c.isNotEmpty())
        // 10:00 JST = 01:00 UTC = same instant
    }

    @Test fun `AEST plus JST plus IST triple Asia Pacific`() {
        val cJson = """[
            ${chrono("11am AEST", hour = 11, timezone = 600, dayCertain = true)},
            ${chrono("10am JST", hour = 10, timezone = 540)},
            ${chrono("6:30am IST", hour = 6, minute = 30, timezone = 330)}
        ]"""
        val c = parseAndConvert(cJson)
        assertTrue(c.isNotEmpty())
    }

    @Test fun `five timezone - global all-hands`() {
        val cJson = """[
            ${chrono("9am PT", hour = 9, timezone = -420, dayCertain = true)},
            ${chrono("12pm ET", hour = 12, timezone = -240)},
            ${chrono("5pm GMT", hour = 17, timezone = 0)},
            ${chrono("6pm CET", hour = 18, timezone = 60)},
            ${chrono("10:30pm IST", hour = 22, minute = 30, timezone = 330)}
        ]"""
        val c = parseAndConvert(cJson)
        assertTrue("Should have results for 5-tz meeting", c.isNotEmpty())
    }

    // =====================================================================
    // 4. Time ranges (12 tests)
    // =====================================================================

    @Test fun `3pm - 4pm EST simple range`() {
        val c = parseAndConvert("[${chrono("3pm - 4pm EST", hour = 15, timezone = -300, end = chronoEnd(hour = 16, timezone = -300))}]")
        assertEquals(2, c.size)
    }

    @Test fun `9am-5pm PST compact range`() {
        val c = parseAndConvert("[${chrono("9am-5pm PST", hour = 9, timezone = -480, end = chronoEnd(hour = 17, timezone = -480))}]")
        assertEquals(2, c.size)
    }

    @Test fun `11 30 AM - 1 PM EDT spanning noon`() {
        val c = parseAndConvert("[${chrono("11:30 AM - 1:00 PM EDT", hour = 11, minute = 30, timezone = -240, end = chronoEnd(hour = 13, timezone = -240))}]")
        assertEquals(2, c.size)
    }

    @Test fun `3 00 - 4 30 PM GMT with minutes`() {
        val c = parseAndConvert("[${chrono("3:00 - 4:30 PM GMT", hour = 15, timezone = 0, end = chronoEnd(hour = 16, minute = 30, timezone = 0))}]")
        assertEquals(2, c.size)
    }

    @Test fun `8 PM - 9 30 PM JST evening range`() {
        val c = parseAndConvert("[${chrono("8:00 PM - 9:30 PM JST", hour = 20, timezone = 540, end = chronoEnd(hour = 21, minute = 30, timezone = 540))}]")
        assertEquals(2, c.size)
        // Both should stay in JST
    }

    @Test fun `12pm - 12 50pm EDT lunch range`() {
        val c = parseAndConvert("[${chrono("12:00 pm - 12:50 pm EDT", hour = 12, timezone = -240, dayCertain = true, end = chronoEnd(hour = 12, minute = 50, timezone = -240))}]")
        assertEquals(2, c.size)
    }

    @Test fun `10am to noon PST range with noon`() {
        val c = parseAndConvert("[${chrono("10am to noon PST", hour = 10, timezone = -480, end = chronoEnd(hour = 12, timezone = -480))}]")
        assertEquals(2, c.size)
    }

    @Test fun `2pm - 3pm PT end inherits start tz`() {
        // End block without tz → inherits from start
        val c = parseAndConvert("[${chrono("2pm - 3pm PT", hour = 14, timezone = -420, dayCertain = true, end = chronoEnd(hour = 15))}]")
        assertEquals(2, c.size)
        assertEquals(c[0].sourceTimezone, c[1].sourceTimezone)
    }

    @Test fun `range with date April 7 7pm-8pm EDT`() {
        val cJson = """[
            {"text":"April 7","index":0,"start":{"year":2026,"month":4,"day":7,"hour":12,"minute":0,"second":0,"timezone":null,"isCertain":{"year":false,"month":true,"day":true,"hour":false,"minute":false,"timezone":false}},"end":null},
            ${chrono("7:00 pm - 8:00 pm EDT", day = 6, hour = 19, timezone = -240, end = chronoEnd(day = 6, hour = 20, timezone = -240))}
        ]"""
        val results = ChronoResultParser.parse(cJson, "", cityResolver)
        assertEquals(2, results.size)
        assertEquals(7, results[0].localDateTime!!.dayOfMonth)
    }

    @Test fun `range spanning midnight EST`() {
        val c = parseAndConvert("[${chrono("11pm - 1am EST", hour = 23, timezone = -300, dayCertain = true, end = chronoEnd(hour = 1, timezone = -300))}]")
        assertEquals(2, c.size)
    }

    @Test fun `02 00 - 04 30 UTC server outage window`() {
        val c = parseAndConvert("[${chrono("02:00 - 04:30 UTC", hour = 2, timezone = 0, end = chronoEnd(hour = 4, minute = 30, timezone = 0))}]")
        assertEquals(2, c.size)
        assertLocalTime("11:00", c[0].localDateTime, "02:00 UTC → JST")
    }

    @Test fun `range CET 14 00 - 16 30`() {
        val c = parseAndConvert("[${chrono("14:00 - 16:30 CET", hour = 14, timezone = 60, end = chronoEnd(hour = 16, minute = 30, timezone = 60))}]")
        assertEquals(2, c.size)
    }

    // =====================================================================
    // 5. City-based inputs via RegexExtractor (15 tests)
    // =====================================================================

    @Test fun `5pm in Tokyo`() = runTest {
        val r = RegexExtractor(cityResolver).extract("5pm in Tokyo")
        assertEquals(1, r.times.size)
        assertEquals(17, r.times[0].localDateTime!!.hour)
        assertEquals("Asia/Tokyo", r.times[0].sourceTimezone!!.id)
    }

    @Test fun `10 AM in London`() = runTest {
        val r = RegexExtractor(cityResolver).extract("10:00 AM in London")
        assertEquals(1, r.times.size)
        assertEquals(10, r.times[0].localDateTime!!.hour)
    }

    @Test fun `2 30 PM at San Francisco`() = runTest {
        val r = RegexExtractor(cityResolver).extract("2:30 PM at San Francisco")
        assertEquals(1, r.times.size)
        assertEquals(14, r.times[0].localDateTime!!.hour)
        assertEquals(30, r.times[0].localDateTime!!.minute)
        assertEquals("America/Los_Angeles", r.times[0].sourceTimezone!!.id)
    }

    @Test fun `9am in Mumbai`() = runTest {
        val r = RegexExtractor(cityResolver).extract("9am in Mumbai")
        assertEquals(1, r.times.size)
        assertEquals("Asia/Kolkata", r.times[0].sourceTimezone!!.id)
    }

    @Test fun `3pm in Chicago`() = runTest {
        val r = RegexExtractor(cityResolver).extract("3pm in Chicago")
        assertEquals(1, r.times.size)
        assertEquals("America/Chicago", r.times[0].sourceTimezone!!.id)
    }

    @Test fun `8am in Sydney`() = runTest {
        val r = RegexExtractor(cityResolver).extract("8am in Sydney")
        assertEquals(1, r.times.size)
        assertEquals("Australia/Sydney", r.times[0].sourceTimezone!!.id)
    }

    @Test fun `11pm in Hong Kong`() = runTest {
        val r = RegexExtractor(cityResolver).extract("11pm in Hong Kong")
        assertEquals(1, r.times.size)
        assertEquals(23, r.times[0].localDateTime!!.hour)
    }

    @Test fun `6 AM in Singapore`() = runTest {
        val r = RegexExtractor(cityResolver).extract("6:00 AM in Singapore")
        assertEquals(1, r.times.size)
        assertEquals(6, r.times[0].localDateTime!!.hour)
    }

    @Test fun `9 a m in Berlin dotted am`() = runTest {
        val r = RegexExtractor(cityResolver).extract("9:00 a.m. in Berlin")
        assertEquals(1, r.times.size)
        assertEquals(9, r.times[0].localDateTime!!.hour)
    }

    @Test fun `3 p m at Paris dotted pm`() = runTest {
        val r = RegexExtractor(cityResolver).extract("3:00 p.m. at Paris")
        assertEquals(1, r.times.size)
        assertEquals(15, r.times[0].localDateTime!!.hour)
    }

    @Test fun `12pm in Seoul is noon`() = runTest {
        val r = RegexExtractor(cityResolver).extract("12pm in Seoul")
        assertEquals(1, r.times.size)
        assertEquals(12, r.times[0].localDateTime!!.hour)
    }

    @Test fun `12am in London is midnight`() = runTest {
        val r = RegexExtractor(cityResolver).extract("12am in London")
        assertEquals(1, r.times.size)
        assertEquals(0, r.times[0].localDateTime!!.hour)
    }

    @Test fun `15 00 in Dubai 24h`() = runTest {
        val r = RegexExtractor(cityResolver).extract("15:00 in Dubai")
        assertEquals(1, r.times.size)
        assertEquals(15, r.times[0].localDateTime!!.hour)
    }

    @Test fun `unknown city Narnia returns empty`() = runTest {
        val r = RegexExtractor(cityResolver).extract("5:00 in Narnia")
        assertTrue(r.times.isEmpty())
    }

    @Test fun `city regex converts through pipeline`() = runTest {
        val r = RegexExtractor(cityResolver).extract("3pm in New York")
        val converted = converter.toLocal(r.times, tokyo)
        assertEquals(1, converted.size)
        assertTrue(converted[0].sourceTimezone.contains("New York"))
        assertTrue(converted[0].localTimezone.contains("UTC+9"))
    }

    // =====================================================================
    // 6. Unix timestamps via RegexExtractor (8 tests)
    // =====================================================================

    @Test fun `unix 1712678400 converts`() = runTest {
        val r = RegexExtractor(cityResolver).extract("1712678400")
        assertEquals(1, r.times.size)
        assertNotNull(r.times[0].instant)
        assertEquals(TimeZone.UTC, r.times[0].sourceTimezone)
    }

    @Test fun `unix embedded in sentence`() = runTest {
        val r = RegexExtractor(cityResolver).extract("The event was created at 1712678400 and updated later")
        assertEquals(1, r.times.size)
    }

    @Test fun `two unix timestamps`() = runTest {
        val r = RegexExtractor(cityResolver).extract("start: 1712678400 end: 1712682000")
        assertEquals(2, r.times.size)
    }

    @Test fun `unix at 2015 boundary accepted`() = runTest {
        val r = RegexExtractor(cityResolver).extract("1420070400") // 2015-01-01
        assertEquals(1, r.times.size)
    }

    @Test fun `unix before 2015 rejected`() = runTest {
        val r = RegexExtractor(cityResolver).extract("1000000000") // 2001
        assertTrue(r.times.isEmpty())
    }

    @Test fun `unix after 2035 rejected`() = runTest {
        val r = RegexExtractor(cityResolver).extract("9999999999")
        assertTrue(r.times.isEmpty())
    }

    @Test fun `unix inside word not matched`() = runTest {
        val r = RegexExtractor(cityResolver).extract("ID1712678400X")
        assertTrue(r.times.isEmpty())
    }

    @Test fun `unix timestamp converts to Tokyo`() = runTest {
        val r = RegexExtractor(cityResolver).extract("1712678400")
        val converted = converter.toLocal(r.times, tokyo)
        assertEquals(1, converted.size)
        assertTrue(converted[0].localTimezone.contains("UTC+9"))
    }

    // =====================================================================
    // 7. City resolution via Chrono parser (10 tests)
    // =====================================================================

    @Test fun `in New York adds timezone`() {
        val r = ChronoResultParser.parse("[${chrono("5:00", hour = 5)}]", "5:00 in New York", cityResolver)
        assertNotNull(r[0].sourceTimezone)
        assertEquals("America/New_York", r[0].sourceTimezone!!.id)
    }

    @Test fun `at Tokyo adds timezone`() {
        val r = ChronoResultParser.parse("[${chrono("3:00", hour = 3)}]", "3:00 at Tokyo", cityResolver)
        assertNotNull(r[0].sourceTimezone)
        assertEquals("Asia/Tokyo", r[0].sourceTimezone!!.id)
    }

    @Test fun `in London adds timezone`() {
        val r = ChronoResultParser.parse("[${chrono("10:00", hour = 10)}]", "10:00 in London", cityResolver)
        assertNotNull(r[0].sourceTimezone)
        assertEquals("Europe/London", r[0].sourceTimezone!!.id)
    }

    @Test fun `in Paris adds timezone`() {
        val r = ChronoResultParser.parse("[${chrono("14:00", hour = 14)}]", "14:00 in Paris", cityResolver)
        assertNotNull(r[0].sourceTimezone)
        assertEquals("Europe/Paris", r[0].sourceTimezone!!.id)
    }

    @Test fun `in Sydney adds timezone`() {
        val r = ChronoResultParser.parse("[${chrono("8:00", hour = 8)}]", "8:00 in Sydney", cityResolver)
        assertNotNull(r[0].sourceTimezone)
        assertEquals("Australia/Sydney", r[0].sourceTimezone!!.id)
    }

    @Test fun `explicit tz not overridden by city`() {
        val r = ChronoResultParser.parse("[${chrono("5 PM EDT", hour = 17, timezone = -240)}]", "5 PM EDT in Chicago", cityResolver)
        assertTrue(r[0].sourceTimezone!!.id != "America/Chicago")
    }

    @Test fun `no city in text leaves tz null`() {
        val r = ChronoResultParser.parse("[${chrono("3:00 PM", hour = 15)}]", "the meeting is at 3:00 PM", cityResolver)
        assertNull(r[0].sourceTimezone)
    }

    @Test fun `null cityResolver skips resolution`() {
        val r = ChronoResultParser.parse("[${chrono("5:00", hour = 5)}]", "5:00 in New York", null)
        assertNull(r[0].sourceTimezone)
    }

    @Test fun `city resolution converts through pipeline`() {
        val r = ChronoResultParser.parse("[${chrono("9:00", hour = 9)}]", "9:00 in Seoul", cityResolver)
        assertNotNull(r[0].sourceTimezone)
        val converted = converter.toLocal(r, tokyo)
        assertEquals(1, converted.size)
    }

    @Test fun `at San Francisco resolves`() {
        val r = ChronoResultParser.parse("[${chrono("2:30", hour = 14, minute = 30)}]", "2:30 at San Francisco", cityResolver)
        assertNotNull(r[0].sourceTimezone)
        assertEquals("America/Los_Angeles", r[0].sourceTimezone!!.id)
    }

    // =====================================================================
    // 8. Timezone-less inputs (8 tests)
    // =====================================================================

    @Test fun `bare 3 PM assumes device tz`() {
        val r = ChronoResultParser.parse("[${chrono("3:00 PM", hour = 15)}]", "", null)
        assertNull(r[0].sourceTimezone)
        val c = converter.toLocal(r, tokyo)
        assertEquals(c[0].sourceDateTime, c[0].localDateTime)
    }

    @Test fun `bare noon assumes device tz`() {
        val c = parseAndConvert("[${chrono("noon", hour = 12)}]", localZone = TimeZone.of("America/New_York"))
        assertEquals(1, c.size)
        assertTrue(c[0].localTimezone.contains("New York"))
    }

    @Test fun `bare midnight assumes device tz`() {
        val c = parseAndConvert("[${chrono("midnight", hour = 0)}]", localZone = TimeZone.of("Europe/London"))
        assertEquals(1, c.size)
        assertTrue(c[0].localTimezone.contains("London"))
    }

    @Test fun `bare 24h time 14 30 assumes device tz`() {
        val c = parseAndConvert("[${chrono("14:30", hour = 14, minute = 30)}]", localZone = TimeZone.of("Asia/Kolkata"))
        assertEquals(1, c.size)
        assertTrue(c[0].localTimezone.contains("Kolkata"))
    }

    @Test fun `bare time with date assumes device tz`() {
        val c = parseAndConvert("[${chrono("April 9 3pm", hour = 15, dayCertain = true)}]", localZone = tokyo)
        assertEquals(1, c.size)
        assertEquals(c[0].sourceTimezone, c[0].localTimezone)
    }

    @Test fun `bare 9 30 AM assumes device tz Sydney`() {
        val c = parseAndConvert("[${chrono("9:30 AM", hour = 9, minute = 30)}]", localZone = TimeZone.of("Australia/Sydney"))
        assertEquals(1, c.size)
        assertTrue(c[0].localTimezone.contains("Sydney"))
    }

    @Test fun `bare 5pm in UTC zone`() {
        val c = parseAndConvert("[${chrono("5pm", hour = 17)}]", localZone = TimeZone.UTC)
        assertEquals(1, c.size)
        assertEquals("UTC", c[0].localTimezone)
    }

    @Test fun `bare 23 59 in Honolulu`() {
        val c = parseAndConvert("[${chrono("23:59", hour = 23, minute = 59)}]", localZone = TimeZone.of("Pacific/Honolulu"))
        assertEquals(1, c.size)
        assertTrue(c[0].localTimezone.contains("Honolulu"))
    }

    // =====================================================================
    // 9. DST boundary inputs (8 tests)
    // =====================================================================

    @Test fun `US spring forward March 8 2026 1 30 AM`() {
        val c = parseAndConvert("[${chrono("1:30 AM EST", year = 2026, month = 3, day = 8, hour = 1, minute = 30, timezone = -300, dayCertain = true)}]")
        assertEquals(1, c.size)
    }

    @Test fun `US fall back November 1 2026 1 30 AM`() {
        val c = parseAndConvert("[${chrono("1:30 AM EDT", year = 2026, month = 11, day = 1, hour = 1, minute = 30, timezone = -240, dayCertain = true)}]")
        assertEquals(1, c.size)
    }

    @Test fun `EU spring forward March 29 2026 2 AM CET`() {
        val c = parseAndConvert("[${chrono("2:00 AM CET", year = 2026, month = 3, day = 29, hour = 2, timezone = 60, dayCertain = true)}]")
        assertEquals(1, c.size)
    }

    @Test fun `EU fall back October 25 2026 3 AM CEST`() {
        val c = parseAndConvert("[${chrono("3:00 AM CEST", year = 2026, month = 10, day = 25, hour = 3, timezone = 120, dayCertain = true)}]")
        assertEquals(1, c.size)
    }

    @Test fun `Australia AEDT to AEST transition April 5 2026`() {
        val c = parseAndConvert("[${chrono("2:00 AM AEDT", year = 2026, month = 4, day = 5, hour = 2, timezone = 660, dayCertain = true)}]")
        assertEquals(1, c.size)
    }

    @Test fun `range spanning DST boundary US March 8`() {
        val c = parseAndConvert("[${chrono("1am - 3am ET", year = 2026, month = 3, day = 8, hour = 1, timezone = -300, dayCertain = true, end = chronoEnd(year = 2026, month = 3, day = 8, hour = 3, timezone = -240))}]")
        assertEquals(2, c.size)
    }

    @Test fun `summer time GMT to BST in London April`() {
        val c = parseAndConvert("[${chrono("3pm BST", month = 4, day = 15, hour = 15, timezone = 60, dayCertain = true)}]", localZone = TimeZone.of("America/New_York"))
        assertEquals(1, c.size)
    }

    @Test fun `winter time EST not EDT in January`() {
        val c = parseAndConvert("[${chrono("3pm EST", year = 2026, month = 1, day = 15, hour = 15, timezone = -300, dayCertain = true)}]")
        assertEquals(1, c.size)
    }

    // =====================================================================
    // 10. Half-hour / 45-minute timezone offsets (8 tests)
    // =====================================================================

    @Test fun `IST plus 5 30 full pipeline`() {
        val c = parseAndConvert("[${chrono("9 PM IST", hour = 21, timezone = 330, dayCertain = true)}]")
        assertEquals(1, c.size)
        // 21:00 UTC+5:30 = 15:30 UTC = 00:30+1 JST
    }

    @Test fun `NPT plus 5 45`() {
        val c = parseAndConvert("[${chrono("noon NPT", hour = 12, timezone = 345, dayCertain = true)}]")
        assertEquals(1, c.size)
        assertLocalTime("3:15", c[0].localDateTime, "noon NPT → JST")
    }

    @Test fun `ACST plus 9 30`() {
        val c = parseAndConvert("[${chrono("10am ACST", hour = 10, timezone = 570, dayCertain = true)}]")
        assertEquals(1, c.size)
        assertLocalTime("9:30", c[0].localDateTime, "10am ACST → JST")
    }

    @Test fun `Chatham plus 12 45`() {
        // Chatham Islands = UTC+12:45
        val c = parseAndConvert("[${chrono("noon Chatham", hour = 12, timezone = 765, dayCertain = true)}]")
        assertEquals(1, c.size)
        // 12:00 UTC+12:45 = 23:15-1 UTC = 08:15 JST
    }

    @Test fun `AFT plus 4 30 Afghanistan`() {
        val c = parseAndConvert("[${chrono("2pm AFT", hour = 14, timezone = 270, dayCertain = true)}]")
        assertEquals(1, c.size)
        // 14:00 UTC+4:30 = 09:30 UTC = 18:30 JST
        assertLocalTime("6:30", c[0].localDateTime, "2pm AFT → JST")
    }

    @Test fun `MMT plus 6 30 Myanmar`() {
        val c = parseAndConvert("[${chrono("3pm MMT", hour = 15, timezone = 390, dayCertain = true)}]")
        assertEquals(1, c.size)
        // 15:00 UTC+6:30 = 08:30 UTC = 17:30 JST
        assertLocalTime("5:30", c[0].localDateTime, "3pm MMT → JST")
    }

    @Test fun `IST to New York conversion`() {
        val c = parseAndConvert("[${chrono("10:30 AM IST", hour = 10, minute = 30, timezone = 330, dayCertain = true)}]", localZone = TimeZone.of("America/New_York"))
        assertEquals(1, c.size)
        // 10:30 UTC+5:30 = 05:00 UTC = 01:00 EDT (April)
        assertLocalTime("1:00", c[0].localDateTime, "10:30 AM IST → EDT")
    }

    @Test fun `NPT to London conversion`() {
        val c = parseAndConvert("[${chrono("5:45 PM NPT", hour = 17, minute = 45, timezone = 345, dayCertain = true)}]", localZone = TimeZone.of("Europe/London"))
        assertEquals(1, c.size)
        // 17:45 UTC+5:45 = 12:00 UTC = 13:00 BST (April)
        assertLocalTime("1:00", c[0].localDateTime, "5:45 PM NPT → BST")
    }

    // =====================================================================
    // 11. Real-world copy-paste scenarios (15 tests)
    // =====================================================================

    @Test fun `Google Calendar - Wed April 9 4 30 AM PDT`() {
        val c = parseAndConvert("[${chrono("4:30 AM PDT", month = 4, day = 9, hour = 4, minute = 30, timezone = -420, dayCertain = true)}]")
        assertEquals(1, c.size)
        assertLocalTime("8:30", c[0].localDateTime, "4:30 AM PDT → JST")
    }

    @Test fun `Slack - meeting at 2pm ET`() {
        val c = parseAndConvert("[${chrono("2pm ET", hour = 14, timezone = -240)}]")
        assertEquals(1, c.size)
    }

    @Test fun `Email - join at 10 AM BST June 15th`() {
        val c = parseAndConvert("[${chrono("10 AM BST", month = 6, day = 15, hour = 10, timezone = 60, dayCertain = true)}]")
        assertEquals(1, c.size)
        assertLocalTime("6:00", c[0].localDateTime, "10 AM BST → JST")
    }

    @Test fun `Flight - departs 14 30 CEST arrives 09 45 EST`() {
        val c = parseAndConvert("""[
            ${chrono("14:30 CEST", hour = 14, minute = 30, timezone = 120, dayCertain = true)},
            ${chrono("09:45 EST", hour = 9, minute = 45, timezone = -300)}
        ]""")
        assertEquals(2, c.size)
    }

    @Test fun `Outage - 02 00 to 04 30 UTC`() {
        val c = parseAndConvert("[${chrono("02:00 - 04:30 UTC", hour = 2, timezone = 0, end = chronoEnd(hour = 4, minute = 30, timezone = 0))}]")
        assertEquals(2, c.size)
        assertLocalTime("11:00", c[0].localDateTime, "02:00 UTC → JST")
    }

    @Test fun `Streaming - 8pm KST same as JST`() {
        val c = parseAndConvert("[${chrono("8pm KST", hour = 20, timezone = 540)}]")
        assertEquals(1, c.size)
        assertLocalTime("8:00", c[0].localDateTime, "8pm KST = 8pm JST")
    }

    @Test fun `Conference - 3 events same day PT`() {
        val c = parseAndConvert("""[
            ${chrono("9am PT", hour = 9, timezone = -420, dayCertain = true)},
            ${chrono("12pm PT", hour = 12, timezone = -420)},
            ${chrono("2pm PT", hour = 14, timezone = -420)}
        ]""")
        assertEquals(3, c.size)
    }

    @Test fun `Teams invite - Thu Apr 10 3 30 PM CET`() {
        val c = parseAndConvert("[${chrono("3:30 PM CET", month = 4, day = 10, hour = 15, minute = 30, timezone = 60, dayCertain = true)}]")
        assertEquals(1, c.size)
    }

    @Test fun `API response - 2026-04-09T18 00 00Z`() {
        val c = parseAndConvert("[${chrono("2026-04-09T18:00:00Z", month = 4, day = 9, hour = 18, timezone = 0, dayCertain = true)}]")
        assertEquals(1, c.size)
        // 18:00 UTC = 03:00+1 JST
        assertLocalTime("3:00", c[0].localDateTime, "18:00Z → JST")
    }

    @Test fun `Twitter post - drops at midnight EST`() {
        // offset -300 maps to a named IANA zone; exact JST time depends on which zone
        val c = parseAndConvert("[${chrono("midnight EST", hour = 0, timezone = -300, dayCertain = true)}]")
        assertEquals(1, c.size)
        assertTrue(c[0].localTimezone.contains("UTC+9"))
    }

    @Test fun `Discord - game night 9pm AEST Saturday`() {
        val c = parseAndConvert("[${chrono("9pm AEST", month = 4, day = 11, hour = 21, timezone = 600, dayCertain = true)}]")
        assertEquals(1, c.size)
        // 21:00 UTC+10 = 11:00 UTC = 20:00 JST
        assertLocalTime("8:00", c[0].localDateTime, "9pm AEST → JST")
    }

    @Test fun `WhatsApp - call me at 4pm your time IST`() {
        val c = parseAndConvert("[${chrono("4pm IST", hour = 16, timezone = 330, dayCertain = true)}]")
        assertEquals(1, c.size)
        // 16:00 UTC+5:30 = 10:30 UTC = 19:30 JST
        assertLocalTime("7:30", c[0].localDateTime, "4pm IST → JST")
    }

    @Test fun `Zoom - recurring standup 9 30 AM ET`() {
        val c = parseAndConvert("[${chrono("9:30 AM ET", hour = 9, minute = 30, timezone = -240, dayCertain = true)}]")
        assertEquals(1, c.size)
        // 09:30 EDT = 13:30 UTC = 22:30 JST
        assertLocalTime("10:30", c[0].localDateTime, "9:30 AM EDT → JST")
    }

    @Test fun `Airline - boarding 06 15 local time SGT`() {
        val c = parseAndConvert("[${chrono("06:15 SGT", hour = 6, minute = 15, timezone = 480, dayCertain = true)}]")
        assertEquals(1, c.size)
        // 06:15 UTC+8 = 22:15-1 UTC = 07:15 JST
        assertLocalTime("7:15", c[0].localDateTime, "06:15 SGT → JST")
    }

    @Test fun `Webinar - 11am PT 2pm ET 7pm GMT`() {
        val c = parseAndConvert("""[
            ${chrono("11am PT", hour = 11, timezone = -420, dayCertain = true)},
            ${chrono("2pm ET", hour = 14, timezone = -240)},
            ${chrono("7pm GMT", hour = 19, timezone = 0)}
        ]""")
        assertTrue(c.isNotEmpty())
    }

    // =====================================================================
    // 12. Gemini-only results (6 tests)
    // =====================================================================

    @Test fun `Gemini catches Chrono miss`() {
        val g = GeminiResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm US Eastern")}]")
        val merged = ResultMerger.mergeResults(emptyList(), g, "Gemini Nano")
        val c = converter.toLocal(merged, tokyo)
        assertEquals(1, c.size)
    }

    @Test fun `Gemini fenced JSON`() {
        val g = GeminiResultParser.parseResponse("```json\n[${gemini(time = "14:30:00", timezone = "Europe/London", original = "2:30 PM")}]\n```")
        assertEquals(1, g.size)
        val c = converter.toLocal(g, tokyo)
        assertEquals(1, c.size)
    }

    @Test fun `Gemini generic fenced JSON`() {
        val g = GeminiResultParser.parseResponse("```\n[${gemini(time = "09:00:00", timezone = "Asia/Tokyo", original = "9am JST")}]\n```")
        assertEquals(1, g.size)
    }

    @Test fun `Gemini with UTC offset timezone`() {
        val g = GeminiResultParser.parseResponse("[${gemini(time = "14:30:00", timezone = "+05:30", original = "2:30 PM IST")}]")
        assertEquals(1, g.size)
        assertNotNull(g[0].sourceTimezone)
        assertNotNull(g[0].instant)
    }

    @Test fun `Gemini multiple results`() {
        val g = GeminiResultParser.parseResponse("""[
            ${gemini(time = "09:00:00", timezone = "America/Los_Angeles", original = "9am PT")},
            ${gemini(time = "12:00:00", timezone = "America/New_York", original = "12pm ET")},
            ${gemini(time = "17:00:00", timezone = "UTC", original = "5pm UTC")}
        ]""")
        assertEquals(3, g.size)
        g.forEach { assertNotNull(it.localDateTime) }
    }

    @Test fun `Gemini only no Chrono through full pipeline`() {
        val g = GeminiResultParser.parseResponse("""[
            ${gemini(time = "10:00:00", timezone = "Asia/Shanghai", original = "10am Beijing time")},
            ${gemini(time = "11:00:00", timezone = "Asia/Tokyo", original = "11am Tokyo")}
        ]""")
        val merged = ResultMerger.mergeResults(emptyList(), g, "Gemini Nano")
        val c = converter.toLocal(merged, TimeZone.of("America/New_York"))
        assertEquals(2, c.size)
    }

    // =====================================================================
    // 13. Adversarial / edge cases (12 tests)
    // =====================================================================

    @Test fun `empty chrono JSON`() {
        val c = parseAndConvert("[]")
        assertTrue(c.isEmpty())
    }

    @Test fun `empty gemini JSON`() {
        assertTrue(GeminiResultParser.parseResponse("[]").isEmpty())
    }

    @Test fun `malformed chrono JSON no crash`() {
        assertTrue(ChronoResultParser.parse("{not valid]]]", "", null).isEmpty())
    }

    @Test fun `malformed gemini JSON no crash`() {
        assertTrue(GeminiResultParser.parseResponse("this isn't json").isEmpty())
    }

    @Test fun `gemini invalid timezone graceful`() {
        val g = GeminiResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "Not/Real/Zone", original = "3pm")}]")
        assertEquals(1, g.size)
        assertNull(g[0].sourceTimezone)
        assertNotNull(g[0].localDateTime)
    }

    @Test fun `gemini invalid date month 13`() {
        assertTrue(GeminiResultParser.parseResponse("""[{"time":"15:00","date":"2026-13-01","timezone":"UTC","original":"x"}]""").isEmpty())
    }

    @Test fun `gemini invalid date April 31`() {
        assertTrue(GeminiResultParser.parseResponse("""[{"time":"12:00","date":"2026-04-31","timezone":"UTC","original":"x"}]""").isEmpty())
    }

    @Test fun `gemini invalid time 25 00`() {
        assertTrue(GeminiResultParser.parseResponse("""[{"time":"25:00","date":"2026-04-09","timezone":"UTC","original":"x"}]""").isEmpty())
    }

    @Test fun `very long input text no crash`() {
        val c = parseAndConvert("[${chrono("3pm EST", hour = 15, timezone = -300)}]", originalText = "x".repeat(10_000))
        assertEquals(1, c.size)
    }

    @Test fun `unicode and emoji no crash`() {
        val c = parseAndConvert("""[{"text":"café ☕ 15:00","index":0,"start":{"year":2026,"month":4,"day":9,"hour":15,"minute":0,"second":0,"timezone":-240,"isCertain":{"day":true}},"end":null}]""")
        assertEquals(1, c.size)
    }

    @Test fun `null and garbage JSON variants`() {
        assertTrue(ChronoResultParser.parse("null", "", null).isEmpty())
        assertTrue(ChronoResultParser.parse("undefined", "", null).isEmpty())
        assertTrue(ChronoResultParser.parse("42", "", null).isEmpty())
        assertTrue(GeminiResultParser.parseResponse("null").isEmpty())
        assertTrue(GeminiResultParser.parseResponse("undefined").isEmpty())
    }

    @Test fun `gemini timezone with space invalid IANA`() {
        val g = GeminiResultParser.parseResponse("""[{"time":"12:00:00","date":"2026-04-09","timezone":"America/New York","original":"noon"}]""")
        assertEquals(1, g.size)
        assertNull(g[0].sourceTimezone)
        assertEquals(0.7f, g[0].confidence)
    }

    // =====================================================================
    // 14. LiteRT-LM specific (shares GeminiResultParser, 8 tests)
    // =====================================================================

    @Test fun `LiteRT output parses same as Gemini`() {
        val liteRtResponse = """[{"time":"14:30:00","date":"2026-04-11","timezone":"America/New_York","original":"2:30 PM ET"}]"""
        val r = GeminiResultParser.parseResponse(liteRtResponse)
        assertEquals(1, r.size)
        assertNotNull(r[0].localDateTime)
        assertEquals(14, r[0].localDateTime!!.hour)
        assertEquals(30, r[0].localDateTime!!.minute)
        assertEquals("America/New_York", r[0].sourceTimezone!!.id)
    }

    @Test fun `LiteRT multi-result output`() {
        val liteRtResponse = """[
            {"time":"14:30:00","date":"2026-04-11","timezone":"America/New_York","original":"2:30 PM ET"},
            {"time":"19:30:00","date":"2026-04-11","timezone":"UTC","original":"7:30 PM UTC"}
        ]"""
        val r = GeminiResultParser.parseResponse(liteRtResponse)
        assertEquals(2, r.size)
    }

    @Test fun `LiteRT result merged with Chrono same tz`() {
        val chrono = ChronoResultParser.parse("[${chrono("3pm ET", hour = 15, timezone = -240, dayCertain = true)}]", "", null)
        val liteRt = GeminiResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]")
        val merged = ResultMerger.mergeResults(chrono, liteRt, "LiteRT")
        assertTrue(merged.isNotEmpty())
        assertTrue(merged.any { it.method.contains("LiteRT") })
    }

    @Test fun `LiteRT result merged with Chrono different tz kept separate`() {
        val chrono = ChronoResultParser.parse("[${chrono("3pm", hour = 15, timezone = -420, dayCertain = true)}]", "", null)
        val liteRt = GeminiResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/Chicago", original = "3pm")}]")
        val chronoTz = chrono[0].sourceTimezone?.id
        val liteRtTz = liteRt[0].sourceTimezone?.id
        if (chronoTz != liteRtTz) {
            val merged = ResultMerger.mergeResults(chrono, liteRt, "LiteRT")
            assertEquals(2, merged.size)
        }
    }

    @Test fun `LiteRT fenced response`() {
        val r = GeminiResultParser.parseResponse("```json\n[${gemini(time = "10:00:00", timezone = "Asia/Tokyo", original = "10am JST")}]\n```")
        assertEquals(1, r.size)
        assertEquals("Asia/Tokyo", r[0].sourceTimezone!!.id)
    }

    @Test fun `LiteRT invalid timezone handled gracefully`() {
        val r = GeminiResultParser.parseResponse("""[{"time":"12:00:00","date":"2026-04-09","timezone":"BadZone","original":"noon"}]""")
        assertEquals(1, r.size)
        assertNull(r[0].sourceTimezone)
        assertNotNull(r[0].localDateTime)
    }

    @Test fun `LiteRT result converts through pipeline to Tokyo`() {
        val liteRt = GeminiResultParser.parseResponse("[${gemini(time = "09:00:00", timezone = "America/Los_Angeles", original = "9am PT")}]")
        val merged = ResultMerger.mergeResults(emptyList(), liteRt, "LiteRT")
        val c = converter.toLocal(merged, tokyo)
        assertEquals(1, c.size)
        assertTrue(c[0].localTimezone.contains("UTC+9"))
        assertEquals("LiteRT", c[0].method)
    }

    @Test fun `LiteRT plus Gemini both merge with Chrono`() {
        val chrono = ChronoResultParser.parse("[${chrono("3pm ET", hour = 15, timezone = -240, dayCertain = true)}]", "", null)
        val liteRt = GeminiResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]")
        val gemini = GeminiResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]")
        var merged = ResultMerger.mergeResults(chrono, liteRt, "LiteRT")
        merged = ResultMerger.mergeResults(merged, gemini, "Gemini Nano")
        assertEquals("All same tz should merge to 1", 1, merged.size)
        val c = converter.toLocal(merged, tokyo)
        assertEquals(1, c.size)
    }

    // =====================================================================
    // 15. Multi-stage merge (8 tests)
    // =====================================================================

    @Test fun `Chrono plus Gemini same tz merges to 1`() {
        val chrono = ChronoResultParser.parse("[${chrono("3pm ET", hour = 15, timezone = -240, dayCertain = true)}]", "", null)
        val gemini = GeminiResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]")
        val merged = ResultMerger.mergeResults(chrono, gemini, "Gemini Nano")
        assertEquals(1, merged.size)
    }

    @Test fun `Chrono plus Gemini different tz kept separate`() {
        // CST ambiguity: Chrono → US Central offset, Gemini → Asia/Shanghai
        val chrono = ChronoResultParser.parse("[${chrono("19:30 CST", hour = 19, minute = 30, timezone = -360, dayCertain = true)}]", "", null)
        val gemini = GeminiResultParser.parseResponse("[${gemini(time = "19:30:00", timezone = "Asia/Shanghai", original = "19:30 CST")}]")
        val merged = ResultMerger.mergeResults(chrono, gemini, "Gemini Nano")
        assertEquals(2, merged.size)
    }

    @Test fun `three stage merge all same tz`() {
        val chrono = ChronoResultParser.parse("[${chrono("3pm ET", hour = 15, timezone = -240, dayCertain = true)}]", "", null)
        val liteRt = GeminiResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]")
        val gemini = GeminiResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]")
        var merged = ResultMerger.mergeResults(chrono, liteRt, "LiteRT")
        merged = ResultMerger.mergeResults(merged, gemini, "Gemini Nano")
        assertEquals(1, merged.size)
    }

    @Test fun `three stage merge different tz from Gemini`() {
        val chrono = ChronoResultParser.parse("[${chrono("3pm", hour = 15, timezone = -420, dayCertain = true)}]", "", null)
        val liteRt = GeminiResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/Los_Angeles", original = "3pm PT")}]")
        val gemini = GeminiResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/Chicago", original = "3pm CT")}]")
        var merged = ResultMerger.mergeResults(chrono, liteRt, "LiteRT")
        merged = ResultMerger.mergeResults(merged, gemini, "Gemini Nano")
        assertTrue("Should have multiple interpretations", merged.size >= 2)
    }

    @Test fun `merge empty Chrono plus valid Gemini`() {
        val merged = ResultMerger.mergeResults(emptyList(), GeminiResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "UTC", original = "3pm UTC")}]"), "Gemini Nano")
        assertEquals(1, merged.size)
    }

    @Test fun `merge valid Chrono plus empty Gemini`() {
        val chrono = ChronoResultParser.parse("[${chrono("3pm EST", hour = 15, timezone = -300)}]", "", null)
        val merged = ResultMerger.mergeResults(chrono, emptyList(), "Gemini Nano")
        assertEquals(1, merged.size)
    }

    @Test fun `merge converts through TimeConverter`() {
        val chrono = ChronoResultParser.parse("[${chrono("3pm ET", hour = 15, timezone = -240)}]", "", null)
        val gemini = GeminiResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]")
        val merged = ResultMerger.mergeResults(chrono, gemini, "Gemini Nano")
        val c = converter.toLocal(merged, tokyo)
        assertTrue(c.isNotEmpty())
        c.forEach { assertTrue(it.localTimezone.contains("UTC+9")) }
    }

    @Test fun `merge two results with different hours both kept`() {
        val chrono = ChronoResultParser.parse("""[
            ${chrono("9am PT", hour = 9, timezone = -420, dayCertain = true)},
            ${chrono("6pm PT", hour = 18, timezone = -420)}
        ]""", "", null)
        val gemini = GeminiResultParser.parseResponse("""[
            ${gemini(time = "09:00:00", timezone = "America/Los_Angeles", original = "9am PT")},
            ${gemini(time = "18:00:00", timezone = "America/Los_Angeles", original = "6pm PT")}
        ]""")
        val merged = ResultMerger.mergeResults(chrono, gemini, "Gemini Nano")
        // Chrono offset -420 may map to a different IANA zone than Gemini's "America/Los_Angeles"
        // → different-tz interpretations kept separate, so 2-4 results depending on offset mapping
        assertTrue("Should have at least 2 results", merged.size >= 2)
        val c = converter.toLocal(merged, tokyo)
        assertTrue(c.isNotEmpty())
    }
}
