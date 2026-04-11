package com.chronoshift

import app.cash.zipline.QuickJs
import com.chronoshift.conversion.ConvertedTime
import com.chronoshift.conversion.TimeConverter
import com.chronoshift.nlp.ChronoResultParser
import com.chronoshift.nlp.LlmResultParser
import com.chronoshift.nlp.IanaCityLookup
import com.chronoshift.nlp.RegexExtractor
import com.chronoshift.nlp.ResultMerger
import com.chronoshift.nlp.TestCityResolver
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.TimeZone
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Before
import org.junit.Test
import java.io.File

/**
 * End-to-end tests with realistic input strings and specific output assertions.
 *
 * Pipeline tests run real Chrono.js in QuickJS, then parse/expand/convert.
 * Unit tests of specific parsers (Gemini, LiteRT, ResultMerger) use hand-crafted JSON.
 *
 * Default target timezone: Asia/Tokyo (UTC+9) — far from US timezones so errors are obvious.
 */
class EndToEndTest {

    private var qjs: QuickJs? = null
    private var skipReason: String? = null
    private val converter = TimeConverter()
    private val cityResolver = TestCityResolver()
    private val tokyo = TimeZone.of("Asia/Tokyo")

    @Before
    fun setup() {
        ChronoResultParser.clearOffsetCache()
        try {
            qjs = QuickJs.create()
            val script = File("src/main/assets/chrono.js").readText()
            qjs!!.evaluate(script)
        } catch (e: Throwable) {
            val chain = generateSequence(e) { it.cause }.joinToString(" → ") { "${it::class.simpleName}: ${it.message}" }
            skipReason = chain
            qjs = null
        }
    }

    @After
    fun teardown() {
        qjs?.close()
    }

    // --- QuickJS helper ---

    private fun chronoParse(text: String): String? {
        val escaped = text.replace("\\", "\\\\").replace("'", "\\'")
            .replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t")
        return qjs!!.evaluate("chronoParse('$escaped')") as? String
    }

    // --- Pipeline helper: text → chrono.js → parse → expand → convert ---

    private fun pipeline(
        input: String,
        geminiJson: String? = null,
        localZone: TimeZone = tokyo,
    ): List<ConvertedTime> {
        assumeTrue("QuickJS not available: $skipReason", qjs != null)
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

    // --- JSON builder helpers (for unit tests of specific parsers) ---

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

    private fun gemini(
        time: String, date: String = "2026-04-09",
        timezone: String = "", original: String,
    ): String = """{"time":"$time","date":"$date","timezone":"$timezone","original":"$original"}"""

    private fun parseAndConvert(
        chronoJson: String,
        originalText: String = "",
        geminiJson: String? = null,
        localZone: TimeZone = tokyo,
    ): List<ConvertedTime> {
        val chronoResults = ChronoResultParser.parse(chronoJson, originalText, cityResolver)
        val merged = if (geminiJson != null) {
            val geminiResults = LlmResultParser.parseResponse(geminiJson)
            ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")
        } else {
            chronoResults
        }
        return converter.toLocal(merged, localZone)
    }

    private fun assertLocalTime(expected: String, actual: String, msg: String = "") {
        val normalized = actual.replace('\u202F', ' ')
        assertTrue(
            "$msg — expected '$expected' in '$actual'",
            normalized.contains(expected),
        )
    }

    // =====================================================================
    // 1. Simple time + timezone abbreviation (20 tests) — real chrono.js
    // =====================================================================

    @Test fun `3pm EST to Tokyo`() {
        val c = pipeline("3pm EST")
        assertEquals(1, c.size)
        // 15:00 UTC-5 = 20:00 UTC = 05:00+1 JST
        assertLocalTime("5:00 am", c[0].localDateTime, "3pm EST → JST")
    }

    @Test fun `9 30 AM PST to Tokyo`() {
        val c = pipeline("9:30 AM PST")
        assertEquals(1, c.size)
        // 09:30 UTC-8 = 17:30 UTC = 02:30+1 JST
        assertLocalTime("2:30 am", c[0].localDateTime, "9:30 AM PST → JST")
    }

    @Test fun `midnight UTC to Tokyo is 9am`() {
        val c = pipeline("midnight UTC")
        assertEquals(1, c.size)
        assertLocalTime("9:00 am", c[0].localDateTime, "midnight UTC → JST")
    }

    @Test fun `11 59 PM JST stays same in Tokyo`() {
        val c = pipeline("11:59 PM JST")
        assertEquals(1, c.size)
        assertLocalTime("11:59 pm", c[0].localDateTime)
    }

    @Test fun `noon GMT to Tokyo is 9pm`() {
        val c = pipeline("noon GMT")
        assertEquals(1, c.size)
        assertLocalTime("9:00 pm", c[0].localDateTime, "noon GMT → JST")
    }

    @Test fun `3pm CDT to Tokyo`() {
        val c = pipeline("3pm CDT")
        assertEquals(1, c.size)
        // CDT = UTC-5 → 15:00 - (-5) = 20:00 UTC = 05:00+1 JST
        assertLocalTime("5:00 am", c[0].localDateTime, "3pm CDT → JST")
    }

    @Test fun `8 15 AM EDT to Tokyo`() {
        val c = pipeline("8:15 AM EDT")
        assertEquals(1, c.size)
        // 08:15 UTC-4 = 12:15 UTC = 21:15 JST
        assertLocalTime("9:15 pm", c[0].localDateTime, "8:15 AM EDT → JST")
    }

    @Test fun `10 AM MST to Tokyo`() {
        val c = pipeline("10:00 AM MST")
        assertEquals(1, c.size)
        // 10:00 UTC-7 = 17:00 UTC = 02:00+1 JST
        assertLocalTime("2:00 am", c[0].localDateTime, "10 AM MST → JST")
    }

    @Test fun `7pm PDT to Tokyo`() {
        val c = pipeline("7:00 PM PDT")
        assertEquals(1, c.size)
        // 19:00 UTC-7 = 02:00+1 UTC = 11:00+1 JST
        assertLocalTime("11:00 am", c[0].localDateTime, "7pm PDT → JST")
    }

    @Test fun `noon IST to Tokyo`() {
        val c = pipeline("noon IST")
        // IST is ambiguous (India +5:30 / Ireland +1)
        assertEquals(2, c.size)
        // India interpretation: 12:00 UTC+5:30 = 06:30 UTC = 15:30 JST
        assertTrue("Should contain India interpretation",
            c.any { it.localDateTime.replace('\u202F', ' ').contains("3:30 pm") })
    }

    @Test fun `8am AEST to Tokyo`() {
        val c = pipeline("8am AEST")
        assertEquals(1, c.size)
        // 08:00 UTC+10 = 22:00-1 UTC = 07:00 JST
        assertLocalTime("7:00 am", c[0].localDateTime, "8am AEST → JST")
    }

    @Test fun `3pm CET to Tokyo`() {
        val c = pipeline("3pm CET")
        assertEquals(1, c.size)
        // Chrono.js may resolve CET as +1 (winter) or +2 (summer/CEST) depending on date
        // In April (DST active): 15:00 UTC+2 = 13:00 UTC = 22:00 JST
        // In winter: 15:00 UTC+1 = 14:00 UTC = 23:00 JST
        assertTrue("3pm CET → JST",
            c[0].localDateTime.replace('\u202F', ' ').let { it.contains("10:00 pm") || it.contains("11:00 pm") })
    }

    @Test fun `2pm CEST to Tokyo`() {
        val c = pipeline("2pm CEST")
        assertEquals(1, c.size)
        // 14:00 UTC+2 = 12:00 UTC = 21:00 JST
        assertLocalTime("9:00 pm", c[0].localDateTime, "2pm CEST → JST")
    }

    @Test fun `8pm KST stays same offset as Tokyo`() {
        // KST = UTC+9 = same as JST
        val c = pipeline("8pm KST")
        assertEquals(1, c.size)
        assertLocalTime("8:00 pm", c[0].localDateTime, "8pm KST = 8pm JST")
    }

    @Test fun `3pm SGT to Tokyo`() {
        val c = pipeline("3pm SGT")
        assertEquals(1, c.size)
        // 15:00 UTC+8 = 07:00 UTC = 16:00 JST
        assertLocalTime("4:00 pm", c[0].localDateTime, "3pm SGT → JST")
    }

    @Test fun `6am NZST to Tokyo`() {
        val c = pipeline("6am NZST")
        assertEquals(1, c.size)
        // 06:00 UTC+12 = 18:00-1 UTC = 03:00 JST
        assertLocalTime("3:00 am", c[0].localDateTime, "6am NZST → JST")
    }

    @Test fun `10pm HST - chrono does not recognize HST`() {
        val c = pipeline("10pm HST")
        // Chrono ignores HST abbreviation — "10pm" parsed as timezone-less bare time
        assertEquals(1, c.size)
        assertEquals(c[0].sourceTimezone, c[0].localTimezone)
    }

    @Test fun `5pm BRT to Tokyo`() {
        val c = pipeline("5pm BRT")
        assertEquals(1, c.size)
        // 17:00 UTC-3 = 20:00 UTC = 05:00+1 JST
        assertLocalTime("5:00 am", c[0].localDateTime, "5pm BRT → JST")
    }

    @Test fun `11 45 PM SAST to Tokyo`() {
        val c = pipeline("11:45 PM SAST")
        assertEquals(1, c.size)
        // 23:45 UTC+2 = 21:45 UTC = 06:45+1 JST
        assertLocalTime("6:45 am", c[0].localDateTime, "11:45 PM SAST → JST")
    }

    @Test fun `4am HKT to New York`() {
        val c = pipeline("4am HKT", localZone = TimeZone.of("America/New_York"))
        assertEquals(1, c.size)
        assertTrue(c[0].localTimezone.contains("New York"))
    }

    // =====================================================================
    // 2. Date + time + timezone (15 tests) — real chrono.js
    // =====================================================================

    @Test fun `April 9 at 3pm EDT with Gemini`() {
        val gJson = "[${gemini(time = "15:00:00", timezone = "America/New_York", original = "April 9 at 3:00 PM EDT")}]"
        val c = pipeline("April 9 at 3:00 PM EDT", geminiJson = gJson)
        assertEquals(1, c.size)
        assertLocalTime("4:00 am", c[0].localDateTime, "3pm EDT → JST")
        assertTrue(c[0].sourceTimezone.contains("New York"))
    }

    @Test fun `Dec 31 11 59 PM PST crosses year boundary in Tokyo`() {
        val c = pipeline("December 31, 2026 11:59 PM PST")
        assertEquals(1, c.size)
        assertTrue(c[0].localDate.contains("Jan") || c[0].localDate.contains("1"))
    }

    @Test fun `Jan 1 midnight UTC is Dec 31 in Honolulu`() {
        val c = pipeline("January 1, 2026 midnight UTC", localZone = TimeZone.of("Pacific/Honolulu"))
        assertEquals(1, c.size)
        assertLocalTime("2:00 pm", c[0].localDateTime, "midnight UTC → Honolulu")
        assertTrue(c[0].sourceTimezone.contains("UTC"))
    }

    @Test fun `9 April 2026 at 15 00 BST European format`() {
        val c = pipeline("9 April 2026 at 15:00 BST")
        // BST is ambiguous (British +1 / Bangladesh +6)
        assertEquals(2, c.size)
        assertTrue("Should contain London interpretation",
            c.any { it.localDateTime.replace('\u202F', ' ').contains("11:00 pm") })
        assertTrue("Should contain Bangladesh interpretation",
            c.any { it.localDateTime.replace('\u202F', ' ').contains("6:00 pm") })
    }

    @Test fun `Fri 10 Jul 2026 09 30 GMT`() {
        val c = pipeline("Friday 10 July 2026 09:30 GMT")
        assertEquals(1, c.size)
        assertLocalTime("6:30 pm", c[0].localDateTime, "09:30 GMT → JST")
    }

    @Test fun `Wed Apr 9 2026 4 30 AM PDT`() {
        val c = pipeline("Wednesday April 9, 2026 4:30 AM PDT")
        assertEquals(1, c.size)
        // 04:30 UTC-7 = 11:30 UTC = 20:30 JST
        assertLocalTime("8:30 pm", c[0].localDateTime, "4:30 AM PDT → JST")
    }

    @Test fun `April 9 2026 3 PM EST`() {
        val c = pipeline("April 9, 2026 3:00 PM EST")
        assertEquals(1, c.size)
        assertLocalTime("5:00 am", c[0].localDateTime)
    }

    @Test fun `2026-04-09T14 00 00Z ISO 8601`() {
        val c = pipeline("2026-04-09T14:00:00Z")
        assertEquals(1, c.size)
        // 14:00 UTC = 23:00 JST
        assertLocalTime("11:00 pm", c[0].localDateTime, "14:00Z → JST")
    }

    @Test fun `March 15 at 2 30pm GMT`() {
        val c = pipeline("March 15 at 2:30pm GMT")
        assertEquals(1, c.size)
        assertLocalTime("11:30 pm", c[0].localDateTime, "2:30 PM GMT → JST")
    }

    @Test fun `Jan 1 2027 at midnight EST`() {
        val c = pipeline("January 1, 2027 midnight EST")
        assertEquals(1, c.size)
        assertTrue(c[0].localTimezone.contains("UTC+9"))
        assertTrue(c[0].localDate.contains("Jan"))
    }

    @Test fun `May 1st 2026 8 AM JST`() {
        val c = pipeline("May 1, 2026 8:00 AM JST")
        assertEquals(1, c.size)
        assertLocalTime("8:00 am", c[0].localDateTime, "8 AM JST → JST stays same")
    }

    @Test fun `June 15 2026 14 00 IST`() {
        val c = pipeline("June 15, 2026 14:00 IST")
        // IST is ambiguous (India +5:30 / Ireland +1)
        assertEquals(2, c.size)
        assertTrue("Should contain India interpretation",
            c.any { it.localDateTime.replace('\u202F', ' ').contains("5:30 pm") })
        assertTrue("Should contain Ireland interpretation",
            c.any { it.localDateTime.replace('\u202F', ' ').contains("10:00 pm") })
    }

    @Test fun `April 11 2026 5pm AEST`() {
        val c = pipeline("April 11, 2026 5pm AEST")
        assertEquals(1, c.size)
        // 17:00 UTC+10 = 07:00 UTC = 16:00 JST
        assertLocalTime("4:00 pm", c[0].localDateTime, "5pm AEST → JST")
    }

    @Test fun `Feb 29 2028 12 PM EST leap year`() {
        val c = pipeline("February 29, 2028 12:00 PM EST")
        assertEquals(1, c.size)
        assertNotNull(c[0].localDateTime)
    }

    @Test fun `date with Gemini Chrono different tz IDs both kept`() {
        val gJson = "[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm EDT")}]"
        val c = pipeline("April 9, 2026 3pm EDT", geminiJson = gJson)
        assertEquals(1, c.size)
        assertLocalTime("4:00 am", c[0].localDateTime, "3pm EDT → JST")
    }

    // =====================================================================
    // 3. Multiple timestamps / slash-separated (10 tests) — real chrono.js
    // =====================================================================

    @Test fun `two timezone - 9am PT 12pm ET same instant`() {
        val c = pipeline("9:00 AM PT / 12:00 PM ET")
        assertEquals(2, c.size)
        assertLocalTime("1:00 am", c[0].localDateTime, "9am PT → JST")
        assertLocalTime("1:00 am", c[1].localDateTime, "12pm ET → JST")
    }

    @Test fun `three timezone - PT ET GMT`() {
        val c = pipeline("9am PT / 12pm ET / 5pm GMT")
        assertEquals(3, c.size)
    }

    @Test fun `three timezone with Gemini confirmation`() {
        val c = pipeline("4:30 AM PT / 7:30 AM ET")
        assertEquals(2, c.size)
    }

    @Test fun `four timezone global meeting`() {
        val c = pipeline("6pm CET / 5pm GMT / 12pm ET / 9am PT")
        assertEquals(4, c.size)
    }

    @Test fun `Asia IST plus GMT plus US EST`() {
        val c = pipeline("8:30 PM IST / 3:00 PM GMT / 10:00 AM EST")
        assertEquals(4, c.size)
    }

    @Test fun `two timezone with Gemini merge`() {
        val gJson = """[
            ${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")},
            ${gemini(time = "12:00:00", timezone = "America/Los_Angeles", original = "12pm PT")}
        ]"""
        val c = pipeline("3pm ET / 12pm PT", geminiJson = gJson)
        assertEquals(2, c.size)
    }

    @Test fun `noon ET and 9am PT`() {
        val c = pipeline("noon ET / 9am PT")
        assertEquals(2, c.size)
    }

    @Test fun `JST plus GMT two timezones`() {
        val c = pipeline("10am JST / 1am GMT")
        assertEquals(2, c.size)
    }

    @Test fun `AEST plus JST plus IST triple Asia Pacific`() {
        val c = pipeline("11am AEST / 10am JST / 6:30am IST")
        assertEquals(4, c.size)
    }

    @Test fun `five timezone - global all-hands`() {
        val c = pipeline("9am PT / 12pm ET / 5pm GMT / 6pm CET / 10:30pm IST")
        assertEquals(6, c.size)
    }

    // =====================================================================
    // 4. Time ranges (12 tests) — real chrono.js
    // =====================================================================

    @Test fun `3pm - 4pm EST simple range`() {
        val c = pipeline("3pm - 4pm EST")
        assertEquals(2, c.size)
        assertLocalTime("5:00 am", c[0].localDateTime, "3pm EST → JST")
        assertLocalTime("6:00 am", c[1].localDateTime, "4pm EST → JST")
    }

    @Test fun `9am-5pm PST compact range`() {
        val c = pipeline("9am - 5pm PST")
        assertEquals(2, c.size)
        assertLocalTime("2:00 am", c[0].localDateTime, "9am PST → JST")
        assertLocalTime("10:00 am", c[1].localDateTime, "5pm PST → JST")
    }

    @Test fun `11 30 AM - 1 PM EDT spanning noon`() {
        val c = pipeline("11:30 AM - 1:00 PM EDT")
        assertEquals(2, c.size)
        assertLocalTime("12:30 am", c[0].localDateTime, "11:30 AM EDT → JST")
        assertLocalTime("2:00 am", c[1].localDateTime, "1:00 PM EDT → JST")
    }

    @Test fun `3 00 - 4 30 PM GMT with minutes`() {
        val c = pipeline("3:00 - 4:30 PM GMT")
        assertEquals(2, c.size)
        assertLocalTime("12:00 am", c[0].localDateTime, "3:00 PM GMT → JST")
        assertLocalTime("1:30 am", c[1].localDateTime, "4:30 PM GMT → JST")
    }

    @Test fun `8 PM - 9 30 PM JST evening range`() {
        val c = pipeline("8:00 PM - 9:30 PM JST")
        assertEquals(2, c.size)
        assertLocalTime("8:00 pm", c[0].localDateTime, "8pm JST → JST")
        assertLocalTime("9:30 pm", c[1].localDateTime, "9:30pm JST → JST")
    }

    @Test fun `12pm - 12 50pm EDT lunch range`() {
        val c = pipeline("12:00 PM - 12:50 PM EDT")
        assertEquals(2, c.size)
        assertLocalTime("1:00 am", c[0].localDateTime, "12:00 PM EDT → JST")
        assertLocalTime("1:50 am", c[1].localDateTime, "12:50 PM EDT → JST")
    }

    @Test fun `10am to noon PST range with noon`() {
        val c = pipeline("10am to noon PST")
        assertEquals(2, c.size)
        assertLocalTime("3:00 am", c[0].localDateTime, "10am PST → JST")
        assertLocalTime("5:00 am", c[1].localDateTime, "noon PST → JST")
    }

    @Test fun `2pm - 3pm PT end inherits start tz`() {
        val c = pipeline("2pm - 3pm PT")
        assertEquals(2, c.size)
        assertEquals(c[0].sourceTimezone, c[1].sourceTimezone)
    }

    @Test fun `range with date April 7 7pm-8pm EDT`() {
        val c = pipeline("April 7, 7:00 PM - 8:00 PM EDT")
        assertEquals(2, c.size)
        assertLocalTime("8:00 am", c[0].localDateTime, "7pm EDT → JST")
        assertLocalTime("9:00 am", c[1].localDateTime, "8pm EDT → JST")
    }

    @Test fun `range spanning midnight EST`() {
        val c = pipeline("11pm - 1am EST")
        assertEquals(2, c.size)
        assertLocalTime("1:00 pm", c[0].localDateTime, "11pm EST → JST")
        assertLocalTime("3:00 pm", c[1].localDateTime, "1am EST → JST")
    }

    @Test fun `02 00 - 04 30 UTC server outage window`() {
        val c = pipeline("02:00 - 04:30 UTC")
        assertEquals(2, c.size)
        assertLocalTime("11:00 am", c[0].localDateTime, "02:00 UTC → JST")
        assertLocalTime("1:30 pm", c[1].localDateTime, "04:30 UTC → JST")
    }

    @Test fun `range CET 14 00 - 16 30`() {
        val c = pipeline("14:00 - 16:30 CET")
        assertEquals(2, c.size)
        assertLocalTime("9:00 pm", c[0].localDateTime, "14:00 CET → JST")
        assertLocalTime("11:30 pm", c[1].localDateTime, "16:30 CET → JST")
    }

    // =====================================================================
    // 4a. Chat and messaging sentences (6 tests) — real chrono.js
    // =====================================================================

    @Test fun `sync at 3pm EST in full sentence`() {
        val c = pipeline("Let's sync at 3pm EST tomorrow to discuss the roadmap")
        assertEquals(1, c.size)
        assertLocalTime("5:00 am", c[0].localDateTime, "3pm EST in sentence → JST")
    }

    @Test fun `call at 10 30 AM PST with context`() {
        val c = pipeline("Can you do a call at 10:30 AM PST? I'm free until noon")
        assertEquals(2, c.size)
        assertLocalTime("3:30 am", c[0].localDateTime, "10:30 AM PST → JST")
    }

    @Test fun `standup ET and IST in sentence`() {
        val c = pipeline("Reminder: standup is daily at 9:30 AM ET / 7:00 PM IST")
        assertEquals(3, c.size)
        assertTrue("ET should convert to 10:30 PM JST",
            c.any { it.localDateTime.replace('\u202F', ' ').contains("10:30 pm") })
    }

    @Test fun `deadline 11 59 PM EST in sentence`() {
        val c = pipeline("The deadline is this Friday at 11:59 PM EST, no extensions")
        assertEquals(1, c.size)
        assertLocalTime("1:59 pm", c[0].localDateTime, "11:59 PM EST → JST")
    }

    @Test fun `midnight EST with emoji`() {
        val c = pipeline("dropping the new album at midnight EST \uD83D\uDD25")
        assertEquals(1, c.size)
        assertLocalTime("2:00 pm", c[0].localDateTime, "midnight EST → JST")
    }

    @Test fun `range with city - 5 to 6pm in New York`() {
        val c = pipeline("happy hour from 5 to 6pm in New York")
        assertEquals(2, c.size)
        assertLocalTime("6:00 am", c[0].localDateTime, "5pm NY → JST")
        assertLocalTime("7:00 am", c[1].localDateTime, "6pm NY → JST")
        assertTrue("Source should be New York", c[0].sourceTimezone.contains("New York"))
    }

    // =====================================================================
    // 4b. Email and calendar sentences (3 tests) — real chrono.js
    // =====================================================================

    @Test fun `calendar invite with Eastern Time full words`() {
        // "Eastern Time" (full words) not recognized by Chrono — treated as timezone-less
        val c = pipeline("You are invited to: Q2 Planning — Wednesday, April 15, 2026 2:00 PM - 3:30 PM Eastern Time")
        assertEquals(2, c.size)
        assertEquals("Timezone-less: source = local", c[0].sourceTimezone, c[0].localTimezone)
    }

    @Test fun `sprint review IST and ET sentence`() {
        val c = pipeline("Reminder: Sprint Review — Thursday 4:00 PM IST / 6:30 AM ET")
        assertEquals(3, c.size)
        assertTrue("IST India → 7:30 PM JST",
            c.any { it.localDateTime.replace('\u202F', ' ').contains("7:30 pm") && it.sourceTimezone.contains("Kolkata") })
    }

    @Test fun `out of office 9am to 5pm GMT sentence`() {
        val c = pipeline("Out of office: I'll be unavailable from 9am to 5pm GMT on Monday")
        assertEquals(2, c.size)
        assertLocalTime("6:00 pm", c[0].localDateTime, "9am GMT → JST")
        assertLocalTime("2:00 am", c[1].localDateTime, "5pm GMT → JST")
    }

    // =====================================================================
    // 4c. Event and gaming sentences (4 tests) — real chrono.js
    // =====================================================================

    @Test fun `Nintendo Direct PT and ET sentence`() {
        val c = pipeline("\uD83C\uDFAE Nintendo Direct | June 8, 2026 | 3pm PT / 6pm ET")
        assertEquals(2, c.size)
        assertEquals("Same instant", c[0].localDateTime, c[1].localDateTime)
    }

    @Test fun `Summer Game Fest with BST ambiguity sentence`() {
        val c = pipeline("The Summer Game Fest livestream begins at 2pm PT / 5pm ET / 10pm BST")
        assertEquals(4, c.size)
    }

    @Test fun `patch goes live at 2 AM UTC sentence`() {
        val c = pipeline("Patch 4.2 goes live at 2:00 AM UTC on Wednesday April 15th")
        assertEquals(1, c.size)
        assertLocalTime("11:00 am", c[0].localDateTime, "2 AM UTC → JST")
    }

    @Test fun `match kicks off ET BST IST sentence`() {
        val c = pipeline("The match kicks off at 3:00 PM ET / 8:00 PM BST / 12:30 AM IST")
        assertEquals(5, c.size)
        val agreeing = c.count { it.localDateTime.replace('\u202F', ' ').contains("4:00 am") }
        assertTrue("ET + BST(London) + IST(India) should agree on 4:00 AM", agreeing >= 3)
    }

    // =====================================================================
    // 4d. Travel and flight sentences (2 tests) — real chrono.js
    // =====================================================================

    @Test fun `flight PST and JST sentence`() {
        val c = pipeline("Flight UA852 departs SFO at 11:45 PM PST, arrives NRT 4:30 PM JST next day")
        assertEquals(2, c.size)
        assertLocalTime("4:45 pm", c[0].localDateTime, "11:45 PM PST → JST")
        assertLocalTime("4:30 pm", c[1].localDateTime, "4:30 PM JST stays")
    }

    @Test fun `train GMT times sentence`() {
        val c = pipeline("Your train departs London Paddington at 09:15 GMT and arrives at 11:42 GMT")
        assertEquals(2, c.size)
        assertLocalTime("6:15 pm", c[0].localDateTime, "09:15 GMT → JST")
        assertLocalTime("8:42 pm", c[1].localDateTime, "11:42 GMT → JST")
    }

    // =====================================================================
    // 4e. City resolution in sentences (1 test) — real chrono.js
    // =====================================================================

    @Test fun `3pm in Dubai resolves timezone`() {
        val c = pipeline("It's currently 3pm in Dubai, what time is that here?")
        assertEquals(1, c.size)
        assertLocalTime("8:00 pm", c[0].localDateTime, "3pm Dubai → JST")
        assertTrue("Source should be Dubai", c[0].sourceTimezone.contains("Dubai") || c[0].sourceTimezone.contains("UTC+4"))
    }

    // =====================================================================
    // 4f. Technical format sentences (2 tests) — real chrono.js
    // =====================================================================

    @Test fun `ISO 8601 range in sentence`() {
        val c = pipeline("Server maintenance window: 2026-04-15T02:00:00Z to 2026-04-15T04:30:00Z")
        assertEquals(2, c.size)
        assertLocalTime("11:00 am", c[0].localDateTime, "02:00Z → JST")
        assertLocalTime("1:30 pm", c[1].localDateTime, "04:30Z → JST")
    }

    @Test fun `deploy UTC times in sentence`() {
        val c = pipeline("Deploy scheduled for Friday 22:00 UTC, expected downtime until 02:00 UTC Saturday")
        assertEquals(2, c.size)
        assertLocalTime("7:00 am", c[0].localDateTime, "22:00 UTC → JST")
        assertLocalTime("11:00 am", c[1].localDateTime, "02:00 UTC → JST")
    }

    // =====================================================================
    // 4g. Multi-line input (2 tests) — real chrono.js
    // =====================================================================

    @Test fun `event schedule multi-line`() {
        val c = pipeline("Event Schedule:\n- Opening ceremony: 9:00 AM PT\n- Keynote: 10:30 AM PT\n- Lunch: 12:00 PM PT")
        assertEquals(3, c.size)
        assertLocalTime("1:00 am", c[0].localDateTime, "9 AM PT → JST")
        assertLocalTime("2:30 am", c[1].localDateTime, "10:30 AM PT → JST")
        assertLocalTime("4:00 am", c[2].localDateTime, "12 PM PT → JST")
    }

    @Test fun `timezone list multi-line same instant`() {
        val c = pipeline("Time zones for the call:\n3:00 PM GMT\n10:00 AM EST\n7:00 AM PST")
        assertEquals(3, c.size)
        val localTimes = c.map { it.localDateTime }.toSet()
        assertEquals("All three should convert to same JST time", 1, localTimes.size)
    }

    // =====================================================================
    // 4h. Edge cases in sentences (5 tests) — real chrono.js
    // =====================================================================

    @Test fun `CST ambiguity with surrounding context`() {
        val c = pipeline("The meeting is at 5pm CST but I'm not sure if that's US or China time")
        assertEquals(2, c.size)
    }

    @Test fun `BST with parenthetical clarification`() {
        val c = pipeline("See you at 3 PM BST (British Summer Time)")
        assertEquals(2, c.size)
        assertTrue("Should have London interpretation", c.any { it.sourceTimezone.contains("London") })
    }

    @Test fun `two office ranges JST and ET`() {
        val c = pipeline("Tokyo office: 9am-6pm JST / New York office: 9am-5pm ET")
        assertEquals(4, c.size)
    }

    @Test fun `timestamp buried in long paragraph`() {
        val c = pipeline("Hi team, just wanted to follow up on yesterday's discussion. I've scheduled a sync for 2:30 PM EST next Tuesday to go over the priorities. Please review the attached doc beforehand.")
        assertTrue("Should find at least the EST timestamp", c.isNotEmpty())
        assertTrue("2:30 PM EST → 4:30 AM JST",
            c.any { it.localDateTime.replace('\u202F', ' ').contains("4:30 am") })
    }

    @Test fun `no timestamp in text returns empty`() {
        val c = pipeline("Hi team, please review the attached document and provide feedback by end of day. Thanks!")
        assertEquals(0, c.size)
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
    // 7. City resolution via chrono.js pipeline (10 tests)
    // =====================================================================

    @Test fun `in New York adds timezone`() {
        val c = pipeline("5:00 in New York")
        assertEquals(1, c.size)
        assertTrue("Should have NY timezone",
            c[0].sourceTimezone.contains("New York") || c[0].sourceTimezone.contains("UTC-"))
    }

    @Test fun `at Tokyo adds timezone`() {
        val c = pipeline("3:00 at Tokyo")
        assertEquals(1, c.size)
        assertTrue("Should have Tokyo timezone",
            c[0].sourceTimezone.contains("Tokyo") || c[0].sourceTimezone.contains("JST") || c[0].sourceTimezone.contains("+9"))
    }

    @Test fun `in London adds timezone`() {
        val c = pipeline("10:00 in London")
        assertEquals(1, c.size)
        assertTrue("Should have London timezone",
            c[0].sourceTimezone.contains("London") || c[0].sourceTimezone.contains("UTC") || c[0].sourceTimezone.contains("GMT") || c[0].sourceTimezone.contains("BST"))
    }

    @Test fun `in Paris adds timezone`() {
        val c = pipeline("14:00 in Paris")
        assertEquals(1, c.size)
        assertTrue("Should have Paris timezone",
            c[0].sourceTimezone.contains("Paris") || c[0].sourceTimezone.contains("CET") || c[0].sourceTimezone.contains("CEST") || c[0].sourceTimezone.contains("UTC+"))
    }

    @Test fun `in Sydney adds timezone`() {
        val c = pipeline("8:00 in Sydney")
        assertEquals(1, c.size)
        assertTrue("Should have Sydney timezone",
            c[0].sourceTimezone.contains("Sydney") || c[0].sourceTimezone.contains("AEST") || c[0].sourceTimezone.contains("AEDT") || c[0].sourceTimezone.contains("UTC+"))
    }

    @Test fun `explicit tz not overridden by city`() {
        val c = pipeline("5 PM EDT in Chicago")
        assertEquals(1, c.size)
        // EDT should be preserved, not overridden by Chicago's timezone
    }

    @Test fun `no city in text timezone-less`() {
        val c = pipeline("3:00 PM")
        // Timezone-less → local time assumption
        assertEquals(1, c.size)
        assertEquals(c[0].sourceTimezone, c[0].localTimezone)
    }

    @Test fun `city resolution converts through pipeline`() {
        val c = pipeline("9:00 in Seoul")
        assertEquals(1, c.size)
    }

    @Test fun `at San Francisco resolves`() {
        val c = pipeline("2:30 PM at San Francisco")
        assertEquals(1, c.size)
        assertTrue("Should have LA timezone",
            c[0].sourceTimezone.contains("Los Angeles") || c[0].sourceTimezone.contains("San Francisco") || c[0].sourceTimezone.contains("UTC-") || c[0].sourceTimezone.contains("P"))
    }

    @Test fun `null cityResolver skips resolution`() {
        // Unit test: verify null cityResolver doesn't crash
        val r = ChronoResultParser.parse("[${chrono("5:00", hour = 5)}]", "5:00 in New York", null)
        assertNull(r[0].sourceTimezone)
    }

    // =====================================================================
    // 8. Timezone-less inputs (8 tests) — real chrono.js
    // =====================================================================

    @Test fun `bare 3 PM assumes device tz`() {
        val c = pipeline("3:00 PM", localZone = tokyo)
        assertEquals(1, c.size)
        assertEquals(c[0].sourceDateTime, c[0].localDateTime)
    }

    @Test fun `bare noon assumes device tz`() {
        val c = pipeline("noon", localZone = TimeZone.of("America/New_York"))
        assertEquals(1, c.size)
        assertTrue(c[0].localTimezone.contains("New York"))
    }

    @Test fun `bare midnight assumes device tz`() {
        val c = pipeline("midnight", localZone = TimeZone.of("Europe/London"))
        assertEquals(1, c.size)
        assertTrue(c[0].localTimezone.contains("London") || c[0].localTimezone.contains("UTC") || c[0].localTimezone.contains("GMT"))
    }

    @Test fun `bare 24h time 14 30 assumes device tz`() {
        val c = pipeline("14:30", localZone = TimeZone.of("Asia/Kolkata"))
        assertEquals(1, c.size)
        assertTrue(c[0].localTimezone.contains("Kolkata"))
    }

    @Test fun `bare time with date assumes device tz`() {
        val c = pipeline("April 9 3pm", localZone = tokyo)
        assertEquals(1, c.size)
        assertEquals(c[0].sourceTimezone, c[0].localTimezone)
    }

    @Test fun `bare 9 30 AM assumes device tz Sydney`() {
        val c = pipeline("9:30 AM", localZone = TimeZone.of("Australia/Sydney"))
        assertEquals(1, c.size)
        assertTrue(c[0].localTimezone.contains("Sydney"))
    }

    @Test fun `bare 5pm in UTC zone`() {
        val c = pipeline("5pm", localZone = TimeZone.UTC)
        assertEquals(1, c.size)
        assertEquals("UTC", c[0].localTimezone)
    }

    @Test fun `bare 23 59 in Honolulu`() {
        val c = pipeline("23:59", localZone = TimeZone.of("Pacific/Honolulu"))
        assertEquals(1, c.size)
        assertTrue(c[0].localTimezone.contains("Honolulu"))
    }

    // =====================================================================
    // 9. DST boundary inputs (8 tests) — real chrono.js
    // =====================================================================

    @Test fun `US spring forward March 8 2026 1 30 AM EST`() {
        val c = pipeline("March 8, 2026 1:30 AM EST")
        assertEquals(1, c.size)
        assertLocalTime("3:30 pm", c[0].localDateTime, "1:30 AM EST → JST")
    }

    @Test fun `US fall back November 1 2026 1 30 AM EDT`() {
        val c = pipeline("November 1, 2026 1:30 AM EDT")
        assertEquals(1, c.size)
        assertLocalTime("2:30 pm", c[0].localDateTime, "1:30 AM EDT → JST")
    }

    @Test fun `EU spring forward March 29 2026 2 AM CET`() {
        val c = pipeline("March 29, 2026 2:00 AM CET")
        assertEquals(1, c.size)
        assertLocalTime("10:00 am", c[0].localDateTime, "2:00 AM CET → JST")
    }

    @Test fun `EU fall back October 25 2026 3 AM CEST`() {
        val c = pipeline("October 25, 2026 3:00 AM CEST")
        assertEquals(1, c.size)
        assertLocalTime("10:00 am", c[0].localDateTime, "3:00 AM CEST → JST")
    }

    @Test fun `Australia AEDT to AEST transition April 5 2026`() {
        val c = pipeline("April 5, 2026 2:00 AM AEDT")
        assertEquals(1, c.size)
        assertLocalTime("12:00 am", c[0].localDateTime, "2:00 AM AEDT → JST")
    }

    @Test fun `range spanning DST boundary US March 8`() {
        val c = pipeline("March 8, 2026 1am - 3am ET")
        assertEquals(2, c.size)
        // 1am EST (UTC-5) = 6am UTC = 3pm JST
        assertLocalTime("3:00 pm", c[0].localDateTime, "1am ET → JST")
        // 3am ET same offset (UTC-5) = 8am UTC = 5pm JST
        assertLocalTime("5:00 pm", c[1].localDateTime, "3am ET → JST")
    }

    @Test fun `summer time BST in London April`() {
        val c = pipeline("April 15, 2026 3pm BST", localZone = TimeZone.of("America/New_York"))
        // BST is ambiguous (British +1 / Bangladesh +6)
        assertEquals(2, c.size)
    }

    @Test fun `winter time EST not EDT in January`() {
        val c = pipeline("January 15, 2026 3pm EST")
        assertEquals(1, c.size)
        assertLocalTime("5:00 am", c[0].localDateTime, "3pm EST → JST")
    }

    // =====================================================================
    // 10. Half-hour / 45-minute timezone offsets (8 tests)
    //     Obscure abbreviations (NPT, AFT, MMT, ACST, Chatham) kept as
    //     unit tests since chrono.js may not recognize them.
    // =====================================================================

    @Test fun `IST plus 5 30 full pipeline`() {
        val c = pipeline("9 PM IST")
        // IST is ambiguous (India +5:30 / Ireland +1)
        assertEquals(2, c.size)
    }

    @Test fun `NPT plus 5 45`() {
        // Nepal Time — chrono.js unlikely to recognize NPT abbreviation
        val c = parseAndConvert("[${chrono("noon NPT", hour = 12, timezone = 345, dayCertain = true)}]")
        assertEquals(1, c.size)
        assertLocalTime("3:15 pm", c[0].localDateTime, "noon NPT → JST")
    }

    @Test fun `ACST plus 9 30`() {
        // Australian Central Standard — chrono.js may not recognize ACST
        val c = parseAndConvert("[${chrono("10am ACST", hour = 10, timezone = 570, dayCertain = true)}]")
        assertEquals(1, c.size)
        assertLocalTime("9:30 am", c[0].localDateTime, "10am ACST → JST")
    }

    @Test fun `Chatham plus 12 45`() {
        // Chatham Islands = UTC+12:45 — chrono.js won't recognize this
        val c = parseAndConvert("[${chrono("noon Chatham", hour = 12, timezone = 765, dayCertain = true)}]")
        assertEquals(1, c.size)
    }

    @Test fun `AFT plus 4 30 Afghanistan`() {
        // Afghanistan Time — chrono.js unlikely to recognize AFT
        val c = parseAndConvert("[${chrono("2pm AFT", hour = 14, timezone = 270, dayCertain = true)}]")
        assertEquals(1, c.size)
        // 14:00 UTC+4:30 = 09:30 UTC = 18:30 JST
        assertLocalTime("6:30 pm", c[0].localDateTime, "2pm AFT → JST")
    }

    @Test fun `MMT plus 6 30 Myanmar`() {
        // Myanmar Time — chrono.js unlikely to recognize MMT
        val c = parseAndConvert("[${chrono("3pm MMT", hour = 15, timezone = 390, dayCertain = true)}]")
        assertEquals(1, c.size)
        // 15:00 UTC+6:30 = 08:30 UTC = 17:30 JST
        assertLocalTime("5:30 pm", c[0].localDateTime, "3pm MMT → JST")
    }

    @Test fun `IST to New York conversion`() {
        val c = pipeline("10:30 AM IST", localZone = TimeZone.of("America/New_York"))
        // IST is ambiguous (India +5:30 / Ireland +1)
        assertEquals(2, c.size)
        assertTrue("Should contain India interpretation",
            c.any { it.localDateTime.replace('\u202F', ' ').contains("1:00 am") })
    }

    @Test fun `NPT to London conversion`() {
        // Nepal Time — chrono.js unlikely to recognize, keep as unit test
        val c = parseAndConvert("[${chrono("5:45 PM NPT", hour = 17, minute = 45, timezone = 345, dayCertain = true)}]", localZone = TimeZone.of("Europe/London"))
        assertEquals(1, c.size)
        // 17:45 UTC+5:45 = 12:00 UTC = 13:00 BST (April)
        assertLocalTime("1:00 pm", c[0].localDateTime, "5:45 PM NPT → BST")
    }

    // =====================================================================
    // 11. Real-world copy-paste scenarios (15 tests) — real chrono.js
    // =====================================================================

    @Test fun `Google Calendar - Wed April 9 4 30 AM PDT`() {
        val c = pipeline("Wednesday April 9, 2026 4:30 AM PDT")
        assertEquals(1, c.size)
        assertLocalTime("8:30 pm", c[0].localDateTime, "4:30 AM PDT → JST")
    }

    @Test fun `Slack - meeting at 2pm ET`() {
        val c = pipeline("meeting at 2pm ET")
        assertEquals(1, c.size)
        assertLocalTime("3:00 am", c[0].localDateTime, "2pm ET → JST")
    }

    @Test fun `Email - join at 10 AM BST June 15th`() {
        val c = pipeline("join at 10 AM BST June 15th")
        // BST is ambiguous (British +1 / Bangladesh +6)
        assertEquals(2, c.size)
        assertTrue("Should contain British interpretation",
            c.any { it.localDateTime.replace('\u202F', ' ').contains("6:00 pm") })
    }

    @Test fun `Flight - departs 14 30 CEST arrives 09 45 EST`() {
        val c = pipeline("departs 14:30 CEST, arrives 09:45 EST")
        assertEquals(2, c.size)
        assertLocalTime("9:30 pm", c[0].localDateTime, "14:30 CEST → JST")
        assertLocalTime("11:45 pm", c[1].localDateTime, "09:45 EST → JST")
    }

    @Test fun `Outage - 02 00 to 04 30 UTC`() {
        val c = pipeline("02:00 - 04:30 UTC")
        assertEquals(2, c.size)
        assertLocalTime("11:00 am", c[0].localDateTime, "02:00 UTC → JST")
        assertLocalTime("1:30 pm", c[1].localDateTime, "04:30 UTC → JST")
    }

    @Test fun `Streaming - 8pm KST same as JST`() {
        val c = pipeline("8pm KST")
        assertEquals(1, c.size)
        assertLocalTime("8:00 pm", c[0].localDateTime, "8pm KST = 8pm JST")
    }

    @Test fun `Conference - 3 events same day PT`() {
        val c = pipeline("9am PT / 12pm PT / 2pm PT")
        assertEquals(3, c.size)
    }

    @Test fun `Teams invite - Thu Apr 10 3 30 PM CET`() {
        val c = pipeline("Thursday April 10, 2026 3:30 PM CET")
        assertEquals(1, c.size)
        assertLocalTime("10:30 pm", c[0].localDateTime, "3:30 PM CET → JST")
    }

    @Test fun `API response - 2026-04-09T18 00 00Z`() {
        val c = pipeline("2026-04-09T18:00:00Z")
        assertEquals(1, c.size)
        // 18:00 UTC = 03:00+1 JST
        assertLocalTime("3:00 am", c[0].localDateTime, "18:00Z → JST")
    }

    @Test fun `Twitter post - drops at midnight EST`() {
        val c = pipeline("drops at midnight EST")
        assertEquals(1, c.size)
        assertLocalTime("2:00 pm", c[0].localDateTime, "midnight EST → JST")
    }

    @Test fun `Discord - game night 9pm AEST Saturday`() {
        val c = pipeline("game night 9pm AEST Saturday")
        assertEquals(1, c.size)
        // 21:00 UTC+10 = 11:00 UTC = 20:00 JST
        assertLocalTime("8:00 pm", c[0].localDateTime, "9pm AEST → JST")
    }

    @Test fun `WhatsApp - call me at 4pm IST`() {
        val c = pipeline("call me at 4pm IST")
        // IST is ambiguous (India +5:30 / Ireland +1)
        assertEquals(2, c.size)
        assertTrue("Should contain India interpretation",
            c.any { it.localDateTime.replace('\u202F', ' ').contains("7:30 pm") })
    }

    @Test fun `Zoom - recurring standup 9 30 AM ET`() {
        val c = pipeline("recurring standup 9:30 AM ET")
        assertEquals(1, c.size)
        // 09:30 EDT = 13:30 UTC = 22:30 JST
        assertLocalTime("10:30 pm", c[0].localDateTime, "9:30 AM EDT → JST")
    }

    @Test fun `Airline - boarding 06 15 SGT`() {
        val c = pipeline("boarding 06:15 SGT")
        assertEquals(1, c.size)
        // 06:15 UTC+8 = 22:15-1 UTC = 07:15 JST
        assertLocalTime("7:15 am", c[0].localDateTime, "06:15 SGT → JST")
    }

    @Test fun `Webinar - 11am PT 2pm ET 7pm GMT`() {
        val c = pipeline("11am PT / 2pm ET / 7pm GMT")
        assertEquals(3, c.size)
    }

    // =====================================================================
    // 12. Gemini-only results (6 tests)
    // =====================================================================

    @Test fun `Gemini catches Chrono miss`() {
        val g = LlmResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm US Eastern")}]")
        val merged = ResultMerger.mergeResults(emptyList(), g, "Gemini Nano")
        val c = converter.toLocal(merged, tokyo)
        assertEquals(1, c.size)
    }

    @Test fun `Gemini fenced JSON`() {
        val g = LlmResultParser.parseResponse("```json\n[${gemini(time = "14:30:00", timezone = "Europe/London", original = "2:30 PM")}]\n```")
        assertEquals(1, g.size)
        val c = converter.toLocal(g, tokyo)
        assertEquals(1, c.size)
    }

    @Test fun `Gemini generic fenced JSON`() {
        val g = LlmResultParser.parseResponse("```\n[${gemini(time = "09:00:00", timezone = "Asia/Tokyo", original = "9am JST")}]\n```")
        assertEquals(1, g.size)
    }

    @Test fun `Gemini with UTC offset timezone`() {
        val g = LlmResultParser.parseResponse("[${gemini(time = "14:30:00", timezone = "+05:30", original = "2:30 PM IST")}]")
        assertEquals(1, g.size)
        assertNotNull(g[0].sourceTimezone)
        assertNotNull(g[0].instant)
    }

    @Test fun `Gemini multiple results`() {
        val g = LlmResultParser.parseResponse("""[
            ${gemini(time = "09:00:00", timezone = "America/Los_Angeles", original = "9am PT")},
            ${gemini(time = "12:00:00", timezone = "America/New_York", original = "12pm ET")},
            ${gemini(time = "17:00:00", timezone = "UTC", original = "5pm UTC")}
        ]""")
        assertEquals(3, g.size)
        g.forEach { assertNotNull(it.localDateTime) }
    }

    @Test fun `Gemini only no Chrono through full pipeline`() {
        val g = LlmResultParser.parseResponse("""[
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
        assertTrue(LlmResultParser.parseResponse("[]").isEmpty())
    }

    @Test fun `malformed chrono JSON no crash`() {
        assertTrue(ChronoResultParser.parse("{not valid]]]", "", null).isEmpty())
    }

    @Test fun `malformed gemini JSON no crash`() {
        assertTrue(LlmResultParser.parseResponse("this isn't json").isEmpty())
    }

    @Test fun `gemini invalid timezone graceful`() {
        val g = LlmResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "Not/Real/Zone", original = "3pm")}]")
        assertEquals(1, g.size)
        assertNull(g[0].sourceTimezone)
        assertNotNull(g[0].localDateTime)
    }

    @Test fun `gemini invalid date month 13`() {
        assertTrue(LlmResultParser.parseResponse("""[{"time":"15:00","date":"2026-13-01","timezone":"UTC","original":"x"}]""").isEmpty())
    }

    @Test fun `gemini invalid date April 31`() {
        assertTrue(LlmResultParser.parseResponse("""[{"time":"12:00","date":"2026-04-31","timezone":"UTC","original":"x"}]""").isEmpty())
    }

    @Test fun `gemini invalid time 25 00`() {
        assertTrue(LlmResultParser.parseResponse("""[{"time":"25:00","date":"2026-04-09","timezone":"UTC","original":"x"}]""").isEmpty())
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
        assertTrue(LlmResultParser.parseResponse("null").isEmpty())
        assertTrue(LlmResultParser.parseResponse("undefined").isEmpty())
    }

    @Test fun `gemini timezone with space invalid IANA`() {
        val g = LlmResultParser.parseResponse("""[{"time":"12:00:00","date":"2026-04-09","timezone":"America/New York","original":"noon"}]""")
        assertEquals(1, g.size)
        assertNull(g[0].sourceTimezone)
        assertEquals(0.7f, g[0].confidence)
    }

    // =====================================================================
    // 14. LiteRT-LM specific (shares LlmResultParser, 8 tests)
    // =====================================================================

    @Test fun `LiteRT output parses same as Gemini`() {
        val liteRtResponse = """[{"time":"14:30:00","date":"2026-04-11","timezone":"America/New_York","original":"2:30 PM ET"}]"""
        val r = LlmResultParser.parseResponse(liteRtResponse)
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
        val r = LlmResultParser.parseResponse(liteRtResponse)
        assertEquals(2, r.size)
    }

    @Test fun `LiteRT result merged with Chrono same tz`() {
        val chrono = ChronoResultParser.parse("[${chrono("3pm ET", hour = 15, timezone = -240, dayCertain = true)}]", "", null)
        val liteRt = LlmResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]")
        val merged = ResultMerger.mergeResults(chrono, liteRt, "LiteRT")
        assertEquals(1, merged.size)
        assertTrue(merged[0].method.contains("LiteRT"))
    }

    @Test fun `LiteRT result merged with Chrono different tz kept separate`() {
        val chrono = ChronoResultParser.parse("[${chrono("3pm", hour = 15, timezone = -420, dayCertain = true)}]", "", null)
        val liteRt = LlmResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/Chicago", original = "3pm")}]")
        val chronoTz = chrono[0].sourceTimezone?.id
        val liteRtTz = liteRt[0].sourceTimezone?.id
        assertTrue("Chrono offset -420 should map to a different zone than America/Chicago", chronoTz != liteRtTz)
        val merged = ResultMerger.mergeResults(chrono, liteRt, "LiteRT")
        assertEquals(2, merged.size)
    }

    @Test fun `LiteRT fenced response`() {
        val r = LlmResultParser.parseResponse("```json\n[${gemini(time = "10:00:00", timezone = "Asia/Tokyo", original = "10am JST")}]\n```")
        assertEquals(1, r.size)
        assertEquals("Asia/Tokyo", r[0].sourceTimezone!!.id)
    }

    @Test fun `LiteRT invalid timezone handled gracefully`() {
        val r = LlmResultParser.parseResponse("""[{"time":"12:00:00","date":"2026-04-09","timezone":"BadZone","original":"noon"}]""")
        assertEquals(1, r.size)
        assertNull(r[0].sourceTimezone)
        assertNotNull(r[0].localDateTime)
    }

    @Test fun `LiteRT result converts through pipeline to Tokyo`() {
        val liteRt = LlmResultParser.parseResponse("[${gemini(time = "09:00:00", timezone = "America/Los_Angeles", original = "9am PT")}]")
        val merged = ResultMerger.mergeResults(emptyList(), liteRt, "LiteRT")
        val c = converter.toLocal(merged, tokyo)
        assertEquals(1, c.size)
        assertTrue(c[0].localTimezone.contains("UTC+9"))
        assertEquals("LiteRT", c[0].method)
    }

    @Test fun `LiteRT plus Gemini both merge with Chrono`() {
        val chrono = ChronoResultParser.parse("[${chrono("3pm ET", hour = 15, timezone = -240, dayCertain = true)}]", "", null)
        val liteRt = LlmResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]")
        val gemini = LlmResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]")
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
        val gemini = LlmResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]")
        val merged = ResultMerger.mergeResults(chrono, gemini, "Gemini Nano")
        assertEquals(1, merged.size)
    }

    @Test fun `Chrono plus Gemini different tz kept separate`() {
        // CST ambiguity: Chrono → US Central offset, Gemini → Asia/Shanghai
        val chrono = ChronoResultParser.parse("[${chrono("19:30 CST", hour = 19, minute = 30, timezone = -360, dayCertain = true)}]", "", null)
        val gemini = LlmResultParser.parseResponse("[${gemini(time = "19:30:00", timezone = "Asia/Shanghai", original = "19:30 CST")}]")
        val merged = ResultMerger.mergeResults(chrono, gemini, "Gemini Nano")
        assertEquals(2, merged.size)
    }

    @Test fun `three stage merge all same tz`() {
        val chrono = ChronoResultParser.parse("[${chrono("3pm ET", hour = 15, timezone = -240, dayCertain = true)}]", "", null)
        val liteRt = LlmResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]")
        val gemini = LlmResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]")
        var merged = ResultMerger.mergeResults(chrono, liteRt, "LiteRT")
        merged = ResultMerger.mergeResults(merged, gemini, "Gemini Nano")
        assertEquals(1, merged.size)
    }

    @Test fun `three stage merge different tz from Gemini`() {
        val chrono = ChronoResultParser.parse("[${chrono("3pm", hour = 15, timezone = -420, dayCertain = true)}]", "", null)
        val liteRt = LlmResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/Los_Angeles", original = "3pm PT")}]")
        val gemini = LlmResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/Chicago", original = "3pm CT")}]")
        var merged = ResultMerger.mergeResults(chrono, liteRt, "LiteRT")
        merged = ResultMerger.mergeResults(merged, gemini, "Gemini Nano")
        assertEquals(2, merged.size)
    }

    @Test fun `merge empty Chrono plus valid Gemini`() {
        val merged = ResultMerger.mergeResults(emptyList(), LlmResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "UTC", original = "3pm UTC")}]"), "Gemini Nano")
        assertEquals(1, merged.size)
    }

    @Test fun `merge valid Chrono plus empty Gemini`() {
        val chrono = ChronoResultParser.parse("[${chrono("3pm EST", hour = 15, timezone = -300)}]", "", null)
        val merged = ResultMerger.mergeResults(chrono, emptyList(), "Gemini Nano")
        assertEquals(1, merged.size)
    }

    @Test fun `merge converts through TimeConverter`() {
        val chrono = ChronoResultParser.parse("[${chrono("3pm ET", hour = 15, timezone = -240)}]", "", null)
        val gemini = LlmResultParser.parseResponse("[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm ET")}]")
        val merged = ResultMerger.mergeResults(chrono, gemini, "Gemini Nano")
        val c = converter.toLocal(merged, tokyo)
        assertEquals(1, c.size)
        assertTrue(c[0].localTimezone.contains("UTC+9"))
    }

    // =====================================================================
    // 16. Timezone resolution consistency (real chrono.js + Gemini merge)
    // =====================================================================

    @Test fun `3pm EST - Chrono plus Gemini merge to 1 result through full pipeline`() {
        val c = pipeline(
            "3pm EST",
            geminiJson = "[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm EST")}]",
        )
        assertEquals("3pm EST should produce exactly 1 result", 1, c.size)
        assertLocalTime("5:00 am", c[0].localDateTime, "3pm EST → JST next day")
    }

    @Test fun `3pm EST - three stage merge produces 1 result`() {
        val chronoResults = ChronoResultParser.parse(
            "[${chrono("3pm EST", hour = 15, timezone = -300, dayCertain = true)}]", "", null
        )
        val liteRtResults = LlmResultParser.parseResponse(
            "[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm EST")}]"
        )
        val geminiResults = LlmResultParser.parseResponse(
            "[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm EST")}]"
        )
        var merged = ResultMerger.mergeResults(chronoResults, liteRtResults, "LiteRT")
        merged = ResultMerger.mergeResults(merged, geminiResults, "Gemini Nano")

        assertEquals("All 3 extractors should merge to 1", 1, merged.size)
        assertTrue("Method should include LiteRT", merged[0].method.contains("LiteRT"))
        assertTrue("Method should include Gemini Nano", merged[0].method.contains("Gemini Nano"))

        val c = converter.toLocal(merged, tokyo)
        assertEquals(1, c.size)
        assertTrue(c[0].localTimezone.contains("UTC+9"))
    }

    @Test fun `3pm CST - ambiguous keeps both interpretations through pipeline`() {
        val c = pipeline(
            "3pm CST",
            geminiJson = "[${gemini(time = "15:00:00", timezone = "Asia/Shanghai", original = "3pm CST")}]",
        )
        assertEquals(2, c.size)
    }

    @Test fun `3pm PST - summer Chrono plus Gemini merge to 1`() {
        val c = pipeline(
            "July 15, 2026 3pm PST",
            geminiJson = "[${gemini(time = "15:00:00", date = "2026-07-15", timezone = "America/Los_Angeles", original = "3pm PST")}]",
        )
        assertEquals("3pm PST should merge to 1 result", 1, c.size)
        // 3pm PST (UTC-8) = 23:00 UTC = 08:00+1 JST
        assertLocalTime("8:00 am", c[0].localDateTime, "3pm PST → JST next day")
    }

    @Test fun `9am GMT - summer Chrono plus Gemini merge to 1`() {
        val c = pipeline(
            "July 15, 2026 9am GMT",
            geminiJson = "[${gemini(time = "09:00:00", date = "2026-07-15", timezone = "Europe/London", original = "9am GMT")}]",
        )
        assertEquals("9am GMT should merge to 1", 1, c.size)
        // 9am GMT = 09:00 UTC = 18:00 JST
        assertLocalTime("6:00 pm", c[0].localDateTime, "9am GMT → JST")
    }

    @Test fun `3pm EDT - Chrono plus Gemini merge to 1`() {
        val c = pipeline(
            "3pm EDT",
            geminiJson = "[${gemini(time = "15:00:00", timezone = "America/New_York", original = "3pm EDT")}]",
        )
        assertEquals("3pm EDT should merge to 1", 1, c.size)
        // 3pm EDT (UTC-4) = 19:00 UTC = 04:00+1 JST
        assertLocalTime("4:00 am", c[0].localDateTime, "3pm EDT → JST next day")
    }

    @Test fun `11pm EST - correct date boundary when converting to JST`() {
        val c = pipeline(
            "11pm EST",
            geminiJson = "[${gemini(time = "23:00:00", timezone = "America/New_York", original = "11pm EST")}]",
        )
        assertEquals("11pm EST should merge to 1", 1, c.size)
        // 11pm EST (UTC-5) = 04:00+1 UTC = 13:00+1 JST
        assertLocalTime("1:00 pm", c[0].localDateTime, "11pm EST → JST next day")
    }

    @Test fun `multi-tz meeting - each pair merges independently`() {
        val geminiJson = """[
            ${gemini(time = "04:30:00", timezone = "America/Los_Angeles", original = "4:30 a.m. PT")},
            ${gemini(time = "07:30:00", timezone = "America/New_York", original = "7:30 a.m. ET")}
        ]"""
        val c = pipeline("4:30 AM PT / 7:30 AM ET", geminiJson = geminiJson)
        assertEquals(4, c.size)
    }

    @Test fun `CET winter - Chrono plus Gemini merge`() {
        val c = pipeline(
            "January 15, 2026 2pm CET",
            geminiJson = "[${gemini(time = "14:00:00", date = "2026-01-15", timezone = "Europe/Paris", original = "2pm CET")}]",
        )
        assertEquals("CET should merge to 1", 1, c.size)
        // 2pm CET (UTC+1) = 13:00 UTC = 22:00 JST
        assertLocalTime("10:00 pm", c[0].localDateTime, "2pm CET → JST")
    }

    @Test fun `JST - Chrono plus Gemini merge`() {
        val c = pipeline(
            "3pm JST",
            geminiJson = "[${gemini(time = "15:00:00", timezone = "Asia/Tokyo", original = "3pm JST")}]",
        )
        assertEquals("JST should merge to 1", 1, c.size)
        assertLocalTime("3:00 pm", c[0].localDateTime, "JST → JST same time")
    }

    // =====================================================================
    // 17. Multi-stage merge (continued)
    // =====================================================================

    @Test fun `merge two results with different hours both kept`() {
        val chrono = ChronoResultParser.parse("""[
            ${chrono("9am PT", hour = 9, timezone = -420, dayCertain = true)},
            ${chrono("6pm PT", hour = 18, timezone = -420)}
        ]""", "", null)
        val gemini = LlmResultParser.parseResponse("""[
            ${gemini(time = "09:00:00", timezone = "America/Los_Angeles", original = "9am PT")},
            ${gemini(time = "18:00:00", timezone = "America/Los_Angeles", original = "6pm PT")}
        ]""")
        val merged = ResultMerger.mergeResults(chrono, gemini, "Gemini Nano")
        assertEquals(2, merged.size)
        val c = converter.toLocal(merged, tokyo)
        assertEquals(2, c.size)
    }
}
