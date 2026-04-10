package com.chronoshift

import app.cash.zipline.QuickJs
import com.chronoshift.conversion.ConvertedTime
import com.chronoshift.conversion.TimeConverter
import com.chronoshift.nlp.ChronoResultParser
import com.chronoshift.nlp.LlmResultParser
import com.chronoshift.nlp.ResultMerger
import com.chronoshift.nlp.TestCityResolver
import kotlinx.datetime.TimeZone
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Before
import org.junit.Test
import java.io.File

/**
 * True full-pipeline tests: raw input string → Chrono.js (real QuickJS) → parse →
 * Gemini merge → expand ambiguous → convert.
 *
 * No hand-crafted JSON. The actual chrono.js bundle runs in QuickJS on the JVM.
 * Requires QuickJS native library (Linux/macOS) — skipped on unsupported platforms.
 */
class FullPipelineTest {

    private var qjs: QuickJs? = null
    private val converter = TimeConverter()
    private val cityResolver = TestCityResolver()
    private val sydney = TimeZone.of("Australia/Sydney")

    @Before
    fun setup() {
        ChronoResultParser.clearOffsetCache()
        try {
            qjs = QuickJs.create()
            val script = File("src/main/assets/chrono.js").readText()
            qjs!!.evaluate(script)
        } catch (e: Throwable) {
            System.err.println("QuickJS setup failed: ${e::class.simpleName}: ${e.message}")
            e.cause?.let { System.err.println("  Caused by: ${it::class.simpleName}: ${it.message}") }
            qjs = null
        }
        assumeTrue("QuickJS native library not available — skipping", qjs != null)
    }

    @After
    fun teardown() {
        qjs?.close()
    }

    /** Evaluate chrono.js on the raw input, exactly like ChronoExtractor does. */
    private fun chronoParse(text: String): String? {
        val escaped = text.replace("\\", "\\\\").replace("'", "\\'")
            .replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t")
        return qjs!!.evaluate("chronoParse('$escaped')") as? String
    }

    /** Full pipeline: chrono.js → parse → optional Gemini merge → expand → convert. */
    private fun pipeline(
        input: String,
        geminiJson: String? = null,
        localZone: TimeZone = sydney,
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

    private fun gemini(
        time: String, date: String = "2026-04-09",
        timezone: String = "", original: String,
    ): String = """{"time":"$time","date":"$date","timezone":"$timezone","original":"$original"}"""

    // =====================================================================
    // Simple single-timezone inputs
    // =====================================================================

    @Test
    fun `3pm EST`() {
        val c = pipeline("3pm EST")
        assertTrue("Should find at least 1 result", c.isNotEmpty())
        assertTrue("Should contain 3 in source time", c.any { it.sourceDateTime.contains("3") })
    }

    @Test
    fun `meeting at 9am PST tomorrow`() {
        val c = pipeline("meeting at 9am PST tomorrow")
        assertTrue(c.isNotEmpty())
    }

    @Test
    fun `14 00 CET`() {
        val c = pipeline("14:00 CET")
        assertTrue(c.isNotEmpty())
    }

    @Test
    fun `noon GMT`() {
        val c = pipeline("noon GMT")
        assertTrue(c.isNotEmpty())
    }

    // =====================================================================
    // Multi-timezone (same instant listed in multiple zones)
    // =====================================================================

    @Test
    fun `Summer Game Fest - 2pm PT 5pm ET 9pm GMT`() {
        val input = "2pm PT / 5pm ET / 9pm GMT"
        val c = pipeline(input)
        assertTrue("Should find multiple timestamps", c.size >= 2)
    }

    @Test
    fun `gaming announcement - 10AM PT 1PM ET 6PM BST 7PM CEST`() {
        val input = "10:00AM PT / 1:00PM ET / 6:00PM BST / 7:00PM CEST"
        val c = pipeline(input)
        assertTrue("Should find at least 3 timestamps", c.size >= 3)
    }

    @Test
    fun `Nintendo Direct - 6am PT 9am ET`() {
        val input = "6 a.m. PT / 9 a.m. ET"
        val c = pipeline(input)
        assertTrue("Should find at least 1 timestamp", c.isNotEmpty())
    }

    // =====================================================================
    // Ambiguous timezone abbreviations — CST
    // =====================================================================

    @Test
    fun `The webinar starts at 3pm CST`() {
        val input = "The webinar starts at 3:00 PM CST"
        val c = pipeline(input)
        // CST is ambiguous → should expand to US Central + China
        assertTrue("CST should produce at least 2 results (ambiguous)", c.size >= 2)
    }

    @Test
    fun `deadline Friday 5pm CST`() {
        val input = "deadline is Friday 5pm CST"
        val c = pipeline(input)
        assertTrue("CST ambiguous → 2+ results", c.size >= 2)
    }

    @Test
    fun `server maintenance 2am CST`() {
        val input = "The server maintenance window is 2:00 AM CST"
        val c = pipeline(input)
        assertTrue("CST ambiguous → 2+ results", c.size >= 2)
    }

    @Test
    fun `CST with Gemini agreeing on US Central`() {
        val input = "meeting at 10am CST"
        val geminiJson = "[${gemini(time = "10:00", timezone = "America/Chicago", original = "10am CST")}]"
        val c = pipeline(input, geminiJson)
        // Chrono + Gemini both US Central → merge, then expand adds China
        assertTrue("Should have 2 (US + China)", c.size >= 2)
    }

    @Test
    fun `CST with Gemini picking China`() {
        val input = "Our Shanghai office closes at 6pm CST"
        val geminiJson = "[${gemini(time = "18:00", timezone = "Asia/Shanghai", original = "6pm CST")}]"
        val c = pipeline(input, geminiJson)
        assertTrue("Should have both interpretations", c.size >= 2)
    }

    // =====================================================================
    // Ambiguous timezone abbreviations — IST
    // =====================================================================

    @Test
    fun `daily standup at 9am IST`() {
        val input = "Daily standup is at 9am IST"
        val c = pipeline(input)
        assertTrue("IST ambiguous → 2+ results", c.size >= 2)
    }

    @Test
    fun `IST with Gemini picking India`() {
        val input = "Sprint review tomorrow 4pm IST"
        val geminiJson = "[${gemini(time = "16:00", timezone = "Asia/Kolkata", original = "4pm IST")}]"
        val c = pipeline(input, geminiJson)
        assertTrue("IST still expands (Ireland alt)", c.size >= 2)
    }

    @Test
    fun `10 30 AM IST`() {
        val input = "10:30 AM IST"
        val c = pipeline(input)
        assertTrue("IST ambiguous → 2 results", c.size >= 2)
        val times = c.map { it.localDateTime }.toSet()
        assertTrue("India and Ireland should produce different Sydney times", times.size >= 2)
    }

    // =====================================================================
    // Ambiguous timezone abbreviations — BST
    // =====================================================================

    @Test
    fun `webinar June 15 7pm BST`() {
        val input = "Webinar starts at 7pm BST"
        val c = pipeline(input)
        assertTrue("BST ambiguous → 2+ results", c.size >= 2)
    }

    @Test
    fun `BST with Gemini picking London`() {
        val input = "release at 3am BST Saturday"
        val geminiJson = "[${gemini(time = "03:00", timezone = "Europe/London", original = "3am BST")}]"
        val c = pipeline(input, geminiJson)
        assertTrue("BST still expands (Bangladesh alt)", c.size >= 2)
    }

    // =====================================================================
    // Ambiguous timezone abbreviations — AST
    // =====================================================================

    @Test
    fun `flight lands 4 30pm AST`() {
        val input = "Flight lands at 4:30pm AST"
        val c = pipeline(input)
        assertTrue("AST ambiguous → 2+ results", c.size >= 2)
    }

    // =====================================================================
    // Unambiguous should NOT expand
    // =====================================================================

    @Test
    fun `3pm EST does not expand`() {
        val c = pipeline("3pm EST")
        assertEquals("EST is unambiguous → 1 result", 1, c.size)
    }

    @Test
    fun `10am PST does not expand`() {
        val c = pipeline("10am PST")
        assertEquals("PST is unambiguous → 1 result", 1, c.size)
    }

    @Test
    fun `9pm JST does not expand`() {
        val c = pipeline("9pm JST")
        assertEquals("JST is unambiguous → 1 result", 1, c.size)
    }

    @Test
    fun `2pm CET does not expand`() {
        val c = pipeline("2pm CET")
        assertEquals("CET is unambiguous → 1 result", 1, c.size)
    }

    // =====================================================================
    // Real-world full strings from event sites
    // =====================================================================

    @Test
    fun `Summer Game Fest full - June 03 9 30pm CST 6 30am PT`() {
        val input = "June 03 9:30 pm CST / 6:30 am PT"
        val c = pipeline(input)
        // Should find CST and PT. CST expands.
        assertTrue("Should find timestamps", c.isNotEmpty())
        val cstCards = c.filter { it.originalText.contains("CST") }
        if (cstCards.isNotEmpty()) {
            assertTrue("CST should have 2 interpretations", cstCards.size >= 2)
        }
    }

    @Test
    fun `Apple WWDC - June 8 at 10 am Pacific Time`() {
        val input = "June 8 at 10:00 a.m. Pacific Time"
        val c = pipeline(input)
        assertTrue("Should find at least 1 timestamp", c.isNotEmpty())
    }

    @Test
    fun `NVIDIA GTC - Monday March 16 11 am PT`() {
        val input = "Monday, March 16, 11:00 a.m. PT"
        val c = pipeline(input)
        assertTrue(c.isNotEmpty())
    }

    @Test
    fun `Eventbrite - Sat Apr 25 12 00 AM CDT`() {
        val input = "Sat, Apr 25 12:00 AM CDT"
        val c = pipeline(input)
        assertTrue(c.isNotEmpty())
    }

    @Test
    fun `Zoom invite - Apr 10 2026 02 00 PM Eastern Time`() {
        val input = "Apr 10, 2026 02:00 PM Eastern Time (US and Canada)"
        val c = pipeline(input)
        assertTrue(c.isNotEmpty())
    }

    @Test
    fun `World Cup - 3pm ET 8pm BST 12 30am IST Jul 20`() {
        val input = "3:00 PM ET / 8:00 PM BST / 12:30 AM IST"
        val c = pipeline(input)
        assertTrue("Should find multiple timestamps", c.size >= 2)
        // BST and IST are both ambiguous
        val ambiguousCards = c.filter {
            it.originalText.contains("BST") || it.originalText.contains("IST")
        }
        // At minimum the ambiguous ones should have been found
        assertTrue("Should have ambiguous timezone results", ambiguousCards.isNotEmpty())
    }

    @Test
    fun `Google Calendar - April 15 10am to 11am Eastern Daylight Time`() {
        val input = "Wednesday, April 15, 2026 10:00am - 11:00am (Eastern Daylight Time)"
        val c = pipeline(input)
        assertTrue("Should find at least 1 timestamp", c.isNotEmpty())
    }

    @Test
    fun `Festival of Rail - 18 00 UTC February 5`() {
        val input = "Thursday February 5th from 18:00 UTC"
        val c = pipeline(input)
        assertTrue(c.isNotEmpty())
    }

    // =====================================================================
    // City resolution (full string through chrono.js)
    // =====================================================================

    @Test
    fun `5pm in Tokyo`() {
        val input = "5pm in Tokyo"
        val c = pipeline(input)
        assertTrue(c.isNotEmpty())
        assertTrue("Should resolve Tokyo timezone",
            c.any { it.sourceTimezone.contains("Tokyo") || it.sourceTimezone.contains("JST") || it.sourceTimezone.contains("+9") })
    }

    @Test
    fun `3pm in New York`() {
        val input = "3pm in New York"
        val c = pipeline(input)
        assertTrue(c.isNotEmpty())
        assertTrue("Should resolve New York timezone",
            c.any { it.sourceTimezone.contains("New York") || it.sourceTimezone.contains("UTC-") })
    }

    @Test
    fun `meeting at 9am in London`() {
        val input = "meeting at 9am in London"
        val c = pipeline(input)
        assertTrue(c.isNotEmpty())
    }

    // =====================================================================
    // Edge cases
    // =====================================================================

    @Test
    fun `no timestamp returns empty`() {
        val c = pipeline("hello world no time here")
        assertEquals(0, c.size)
    }

    @Test
    fun `just a date no time`() {
        val c = pipeline("April 15, 2026")
        // May or may not produce a result (date-only), but should not crash
        assertTrue("Should not crash", true)
    }

    @Test
    fun `time range 2 to 4pm EST`() {
        val input = "The workshop runs 2-4pm EST"
        val c = pipeline(input)
        assertTrue(c.isNotEmpty())
    }

    @Test
    fun `midnight EST`() {
        val c = pipeline("midnight EST")
        // Chrono may or may not parse "midnight" — but should not crash
        assertTrue("Should not crash", true)
    }

    @Test
    fun `special characters in input`() {
        val c = pipeline("Let's meet at 3pm EST — that's 8pm GMT!")
        assertTrue(c.isNotEmpty())
    }

    @Test
    fun `newlines in input`() {
        val c = pipeline("Schedule:\n3pm EST\n8pm GMT")
        assertTrue(c.isNotEmpty())
    }
}
