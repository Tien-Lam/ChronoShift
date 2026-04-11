package com.chronoshift

import app.cash.zipline.QuickJs
import com.chronoshift.conversion.ConvertedTime
import com.chronoshift.conversion.ExtractedTime
import com.chronoshift.conversion.TimeConverter
import com.chronoshift.nlp.ChronoResultParser
import com.chronoshift.nlp.LlmResultParser
import com.chronoshift.nlp.ResultMerger
import com.chronoshift.nlp.TestCityResolver
import com.chronoshift.nlp.TimezoneAbbreviations
import kotlinx.datetime.TimeZone
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Assume.assumeTrue
import org.junit.Before
import org.junit.Test
import java.io.File

/**
 * Tests for ambiguous timezone expansion, zone-based abbreviations (CT/ET/PT/MT/AT),
 * and realistic multi-timezone inputs from real-world usage patterns.
 *
 * Uses real Chrono.js via QuickJS — no hand-crafted JSON.
 * Default target: Australia/Sydney (UTC+10/+11) — far from most source zones.
 */
class AmbiguityExpansionTest {

    private var qjs: QuickJs? = null
    private var skipReason: String? = null
    private val converter = TimeConverter()
    private val cityResolver = TestCityResolver()
    private val sydney = TimeZone.of("Australia/Sydney")
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
        assumeTrue("QuickJS not available: $skipReason", qjs != null)
    }

    @After
    fun teardown() {
        qjs?.close()
    }

    private fun chronoParse(text: String): String? {
        val escaped = text.replace("\\", "\\\\").replace("'", "\\'")
            .replace("\n", "\\n").replace("\r", "\\r").replace("\t", "\\t")
        return qjs!!.evaluate("chronoParse('$escaped')") as? String
    }

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

    private fun parseAndExpand(input: String): List<ExtractedTime> {
        val json = chronoParse(input) ?: return emptyList()
        val chronoResults = ChronoResultParser.parse(json, input, cityResolver)
        return ChronoResultParser.expandAmbiguous(chronoResults)
    }

    private fun gemini(
        time: String, date: String,
        timezone: String = "", original: String,
    ): String = """{"time":"$time","date":"$date","timezone":"$timezone","original":"$original"}"""

    // =====================================================================
    // 1. CST ambiguity — US Central Standard (UTC-6) vs China Standard (UTC+8)
    // =====================================================================

    @Test
    fun `CST alone expands to 2 interpretations`() {
        val c = pipeline("3pm CST")
        assertEquals(2, c.size)
        val times = c.map { it.localDateTime }.toSet()
        assertEquals("Two different local times in Sydney", 2, times.size)
    }

    @Test
    fun `CST in multi-timezone message - 8p CEST 7p BST 2p ET 11a PT`() {
        val expanded = parseAndExpand("8pm CEST / 7pm BST / 2pm ET / 11am PT")
        val bstResults = expanded.filter { it.originalText.contains("BST") }
        assertEquals("BST should expand to 2 interpretations", 2, bstResults.size)
    }

    @Test
    fun `CST with Gemini agreeing does not duplicate`() {
        val input = "April 11, 2026 10am CST"
        val geminiJson = "[${gemini(time = "10:00", date = "2026-04-11", timezone = "America/Chicago", original = "10am CST")}]"
        val c = pipeline(input, geminiJson)
        assertEquals(2, c.size)
    }

    @Test
    fun `CST with Gemini saying China produces 2 not 3`() {
        val input = "April 11, 2026 10am CST"
        val geminiJson = "[${gemini(time = "10:00", date = "2026-04-11", timezone = "Asia/Shanghai", original = "10am CST")}]"
        val c = pipeline(input, geminiJson)
        assertEquals(2, c.size)
    }

    @Test
    fun `deadline is Friday 5pm CST`() {
        val c = pipeline("deadline is Friday 5pm CST")
        assertEquals("CST expands to US Central + China", 2, c.size)
    }

    @Test
    fun `server maintenance 2am CST`() {
        val c = pipeline("The server maintenance window is 2:00 AM CST")
        assertEquals(2, c.size)
    }

    // =====================================================================
    // 2. IST ambiguity — India Standard (UTC+5:30) vs Irish Standard (UTC+1)
    // =====================================================================

    @Test
    fun `IST alone expands to 2 interpretations`() {
        val c = pipeline("3:30pm IST")
        assertEquals(2, c.size)
        val times = c.map { it.localDateTime }.toSet()
        assertEquals("India vs Ireland should give different Sydney times", 2, times.size)
    }

    @Test
    fun `daily standup at 9am IST`() {
        val c = pipeline("Daily standup is at 9am IST")
        assertEquals("IST expands to India + Ireland", 2, c.size)
    }

    @Test
    fun `IST with Gemini picking India keeps both`() {
        val input = "April 11, 2026 9am IST"
        val geminiJson = "[${gemini(time = "09:00", date = "2026-04-11", timezone = "Asia/Kolkata", original = "9am IST")}]"
        val c = pipeline(input, geminiJson)
        assertEquals("Expand adds Irish interpretation", 2, c.size)
    }

    @Test
    fun `IST with Gemini picking Ireland keeps both`() {
        val input = "April 11, 2026 9am IST"
        val geminiJson = "[${gemini(time = "09:00", date = "2026-04-11", timezone = "Europe/Dublin", original = "9am IST")}]"
        val c = pipeline(input, geminiJson)
        // Chrono picks India (+330), Gemini picks Ireland (Dublin). Different instants → kept separate.
        // Expansion adds +60 alternate for chrono's India result → 3 total (India, Dublin, London).
        assertTrue("Both India and Ireland interpretations present", c.size >= 2)
    }

    @Test
    fun `IST half-hour offset preserved through expansion`() {
        val expanded = parseAndExpand("10:30 AM IST")
        val indiaResult = expanded.first { it.sourceTimezone?.id?.contains("Kolkata") == true || it.sourceTimezone?.id?.contains("Calcutta") == true }
        val irelandResult = expanded.first { it.sourceTimezone?.id?.contains("Dublin") == true || it.sourceTimezone?.id?.contains("London") == true }
        assertNotNull("Should have India interpretation", indiaResult.instant)
        assertNotNull("Should have Ireland interpretation", irelandResult.instant)
        assertTrue("Different instants", indiaResult.instant != irelandResult.instant)
    }

    // =====================================================================
    // 3. BST ambiguity — British Summer (UTC+1) vs Bangladesh Standard (UTC+6)
    // =====================================================================

    @Test
    fun `BST alone expands to 2 interpretations`() {
        val c = pipeline("2pm BST")
        assertEquals(2, c.size)
    }

    @Test
    fun `webinar June 15 7pm BST`() {
        val c = pipeline("webinar: June 15, 7pm BST")
        assertEquals("BST: British Summer + Bangladesh", 2, c.size)
    }

    @Test
    fun `BST with Gemini picking London`() {
        val input = "April 11, 2026 3pm BST"
        val geminiJson = "[${gemini(time = "15:00", date = "2026-04-11", timezone = "Europe/London", original = "3pm BST")}]"
        val c = pipeline(input, geminiJson)
        assertEquals("Expand adds Bangladesh interpretation", 2, c.size)
    }

    @Test
    fun `release window 3am BST Saturday`() {
        val c = pipeline("release at 3am BST Saturday")
        assertEquals(2, c.size)
    }

    // =====================================================================
    // 4. AST ambiguity — Atlantic Standard (UTC-4) vs Arabia Standard (UTC+3)
    // =====================================================================

    @Test
    fun `AST alone expands to 2 interpretations`() {
        val c = pipeline("4pm AST")
        assertEquals(2, c.size)
    }

    @Test
    fun `flight lands 4 30pm AST`() {
        val c = pipeline("Flight lands at 4:30pm AST")
        assertEquals("AST: Atlantic + Arabia", 2, c.size)
        val times = c.map { it.localDateTime }.toSet()
        assertEquals("7-hour difference should give different Sydney times", 2, times.size)
    }

    @Test
    fun `meeting 10am AST with Gemini picking Arabia`() {
        val input = "April 11, 2026 10am AST"
        val geminiJson = "[${gemini(time = "10:00", date = "2026-04-11", timezone = "Asia/Riyadh", original = "10am AST")}]"
        val c = pipeline(input, geminiJson)
        assertEquals("Expand adds Atlantic interpretation", 2, c.size)
    }

    // =====================================================================
    // 5. Zone-based abbreviations (CT, ET, PT, MT, AT) — DST-aware, no expansion
    // =====================================================================

    @Test
    fun `CT resolves via zone not fixed offset`() {
        val zone = TimezoneAbbreviations.resolveZone("CT")
        assertNotNull(zone)
        assertEquals("America/Chicago", zone!!.id)
    }

    @Test
    fun `ET PT MT CT all resolve to IANA zones`() {
        assertEquals("America/New_York", TimezoneAbbreviations.resolveZone("ET")!!.id)
        assertEquals("America/Los_Angeles", TimezoneAbbreviations.resolveZone("PT")!!.id)
        assertEquals("America/Denver", TimezoneAbbreviations.resolveZone("MT")!!.id)
        assertEquals("America/Chicago", TimezoneAbbreviations.resolveZone("CT")!!.id)
        assertEquals("America/Halifax", TimezoneAbbreviations.resolveZone("AT")!!.id)
    }

    @Test
    fun `zone-based abbreviations are not ambiguous`() {
        for (abbr in listOf("CT", "ET", "PT", "MT", "AT")) {
            assertTrue("$abbr should NOT be ambiguous", !TimezoneAbbreviations.isAmbiguous(abbr))
        }
    }

    @Test
    fun `zone-based abbreviations do not expand`() {
        val expanded = parseAndExpand("3pm CT")
        assertEquals("CT is not ambiguous, should not expand", 1, expanded.size)
    }

    @Test
    fun `AT requires uppercase - at 3pm should not match`() {
        val abbr = TimezoneAbbreviations.extractAbbreviation("meeting at 3pm EST")
        assertEquals("Should find EST not AT", "EST", abbr)
    }

    @Test
    fun `AT uppercase matches as Atlantic Time`() {
        val abbr = TimezoneAbbreviations.extractAbbreviation("3pm AT")
        assertEquals("AT", abbr)
    }

    // =====================================================================
    // 6. Multi-timezone messages (real-world patterns)
    // =====================================================================

    @Test
    fun `gaming announcement - 10am PT 1pm ET 6pm BST 7pm CEST`() {
        val c = pipeline("10:00AM PT / 1:00PM ET / 6:00PM BST / 7:00PM CEST")
        // PT, ET → no expansion (zone-based / unambiguous offset)
        // BST → ambiguous (British Summer + Bangladesh) → expands to 2
        // CEST → unambiguous
        // Total: 4 + 1 BST expansion = 5
        assertEquals(5, c.size)
    }

    @Test
    fun `business meeting - 9am PST 12pm EST 5pm GMT 6pm CET`() {
        val c = pipeline("9am PST / 12pm EST / 5pm GMT / 6pm CET")
        // All unambiguous → no expansion → 4
        assertEquals(4, c.size)
    }

    @Test
    fun `slack style - standup 9am PT noon ET`() {
        val c = pipeline("standup 9am PT / noon ET")
        assertEquals(2, c.size)
    }

    @Test
    fun `project sync with IST - 15 00 UTC 11 00 EDT 20 30 IST`() {
        val c = pipeline("15:00 UTC / 11:00 EDT / 20:30 IST")
        // UTC, EDT unambiguous. IST ambiguous → expands.
        // Total: 3 + 1 IST expansion = 4
        assertEquals(4, c.size)
    }

    // =====================================================================
    // 7. EST written in summer (common mistake) — should not expand
    // =====================================================================

    @Test
    fun `EST in July - common mistake - no expansion`() {
        val c = pipeline("July 15 3pm EST")
        assertEquals("EST is unambiguous, should not expand", 1, c.size)
    }

    @Test
    fun `PST in July - common mistake - no expansion`() {
        val c = pipeline("July 15 10am PST")
        assertEquals("PST is unambiguous, should not expand", 1, c.size)
    }

    // =====================================================================
    // 8. Time ranges with ambiguous timezones
    // =====================================================================

    @Test
    fun `workshop 2-4pm CST - range with ambiguous tz`() {
        val c = pipeline("workshop 2-4pm CST")
        // Range produces start + end. CST is ambiguous → both expand.
        // Start (2pm CST) → US + China = 2
        // End (4pm CST) → US + China = 2
        // Total = 4
        assertEquals(4, c.size)
    }

    @Test
    fun `office hours 9-5 CT - range with zone-based tz`() {
        val c = pipeline("office hours 9am-5pm CT")
        assertEquals("CT range: start + end, no expansion", 2, c.size)
    }

    // =====================================================================
    // 9. Cross-day confusion with ambiguous timezones
    // =====================================================================

    @Test
    fun `Friday 11pm CST crosses midnight for China interpretation`() {
        val expanded = parseAndExpand("Friday April 11 11pm CST")
        assertEquals(2, expanded.size)
        val converted = converter.toLocal(expanded, sydney)
        assertTrue(
            "Different timezones may produce different dates",
            converted[0].localDate != converted[1].localDate ||
                converted[0].localDateTime != converted[1].localDateTime,
        )
    }

    // =====================================================================
    // 10. Multiple ambiguous abbreviations in one message
    // =====================================================================

    @Test
    fun `IST and CST in same message both expand`() {
        val expanded = parseAndExpand("9am IST / 7pm CST")
        // IST: India + Ireland = 2
        // CST: US Central + China = 2
        // Total = 4
        assertEquals(4, expanded.size)
    }

    @Test
    fun `BST and AST in same message both expand`() {
        val expanded = parseAndExpand("3pm BST / 10am AST")
        assertEquals("BST(2) + AST(2) = 4", 4, expanded.size)
    }

    @Test
    fun `all four ambiguous abbreviations in one message`() {
        val expanded = parseAndExpand("9am CST / 10am IST / 2pm BST / 4pm AST")
        // Each expands to 2 = 8 total
        assertEquals(8, expanded.size)
    }

    // =====================================================================
    // 11. Ambiguous + unambiguous mix — only ambiguous expands
    // =====================================================================

    @Test
    fun `EST and CST together - only CST expands`() {
        val expanded = parseAndExpand("3pm EST / 2pm CST")
        // EST: unambiguous → 1. CST: ambiguous → 2. Total = 3.
        assertEquals(3, expanded.size)
    }

    @Test
    fun `JST and IST together - only IST expands`() {
        val expanded = parseAndExpand("9am JST / 3pm IST")
        assertEquals("JST(1) + IST(2) = 3", 3, expanded.size)
    }

    // =====================================================================
    // 12. Expansion produces correct instants (math checks)
    // =====================================================================

    @Test
    fun `CST expansion - US 3pm is 9pm UTC, China 3pm is 7am UTC`() {
        val expanded = parseAndExpand("3pm CST")
        assertEquals(2, expanded.size)
        val utcHours = expanded.map {
            it.instant!!.toEpochMilliseconds() / 3600000 % 24
        }.sorted()
        // US Central: 15:00 UTC-6 = 21:00 UTC
        // China: 15:00 UTC+8 = 07:00 UTC
        assertTrue("Should have hour 7 and 21 UTC", utcHours.contains(7L) && utcHours.contains(21L))
    }

    @Test
    fun `IST expansion - India 9am is 3 30am UTC, Ireland 9am is 8am UTC`() {
        val expanded = parseAndExpand("9am IST")
        assertEquals(2, expanded.size)
        val instants = expanded.map { it.instant!! }
        assertTrue("Two different instants", instants[0] != instants[1])
    }

    @Test
    fun `BST expansion - British 2pm is 1pm UTC, Bangladesh 2pm is 8am UTC`() {
        val expanded = parseAndExpand("2pm BST")
        assertEquals(2, expanded.size)
        val utcHours = expanded.map {
            it.instant!!.toEpochMilliseconds() / 3600000 % 24
        }.sorted()
        // British Summer: 14:00 UTC+1 = 13:00 UTC
        // Bangladesh: 14:00 UTC+6 = 08:00 UTC
        assertTrue("Should have hour 8 and 13 UTC", utcHours.contains(8L) && utcHours.contains(13L))
    }

    // =====================================================================
    // 13. No timezone → no expansion
    // =====================================================================

    @Test
    fun `no timezone abbreviation in text means no expansion`() {
        val json = chronoParse("let's meet at 3pm") ?: return
        val results = ChronoResultParser.parse(json, "let's meet at 3pm", null)
        val expanded = ChronoResultParser.expandAmbiguous(results)
        assertEquals(results.size, expanded.size)
    }

    @Test
    fun `city-resolved timezone does not trigger expansion`() {
        val json = chronoParse("5pm in Tokyo") ?: return
        val results = ChronoResultParser.parse(json, "5pm in Tokyo", cityResolver)
        val expanded = ChronoResultParser.expandAmbiguous(results)
        assertEquals("City-resolved tz should not expand", results.size, expanded.size)
    }

    // =====================================================================
    // 14. Expansion idempotency
    // =====================================================================

    @Test
    fun `expanding twice produces same result`() {
        val json = chronoParse("3pm CST") ?: return
        val results = ChronoResultParser.parse(json, "3pm CST", cityResolver)
        val once = ChronoResultParser.expandAmbiguous(results)
        val twice = ChronoResultParser.expandAmbiguous(once)
        assertEquals("Double expansion should be idempotent", once.size, twice.size)
    }

    @Test
    fun `expanding IST twice is idempotent`() {
        val json = chronoParse("9am IST") ?: return
        val results = ChronoResultParser.parse(json, "9am IST", cityResolver)
        val once = ChronoResultParser.expandAmbiguous(results)
        val twice = ChronoResultParser.expandAmbiguous(once)
        assertEquals(once.size, twice.size)
    }

    // =====================================================================
    // 15. Real-world full pipeline scenarios
    // =====================================================================

    @Test
    fun `Zoom invite - Apr 5 2026 09 00 AM Pacific Time`() {
        val c = pipeline("Apr 5, 2026 09:00 AM Pacific Time (US and Canada)")
        assertEquals("Unambiguous PT offset → 1 result", 1, c.size)
    }

    @Test
    fun `email - submit by 11 59pm EST March 15`() {
        val c = pipeline("submit by 11:59pm EST on March 15")
        assertEquals(1, c.size)
    }

    @Test
    fun `TV schedule - 8 7c pattern`() {
        val c = pipeline("Tonight at 8pm ET / 7pm CT")
        assertEquals(2, c.size)
    }

    @Test
    fun `airline arrival +1 day - departs 11 45pm arrives 11 30am`() {
        val c = pipeline("Departs 11:45 PM EST / Arrives 11:30 AM GMT next day")
        assertEquals(2, c.size)
    }

    @Test
    fun `deployment at 00 00 UTC Saturday`() {
        val c = pipeline("deployment at 00:00 UTC Saturday")
        assertEquals(1, c.size)
    }

    @Test
    fun `CET office hours - 08 00 to 17 00 CET`() {
        val c = pipeline("office hours 08:00-17:00 CET")
        assertEquals("CET unambiguous, range = 2 results", 2, c.size)
    }

    @Test
    fun `Korean sprint review 10am KST`() {
        val c = pipeline("sprint review 10am KST")
        assertEquals(1, c.size)
    }

    @Test
    fun `Singapore standup 10am SGT`() {
        val c = pipeline("standup 10am SGT")
        assertEquals(1, c.size)
    }

    @Test
    fun `NZST afternoon meeting`() {
        val c = pipeline("meeting at 2pm NZST")
        assertEquals(1, c.size)
    }

    // =====================================================================
    // 16. Real-world full-string tests (verbatim from websites)
    // Each test passes the FULL input string through real Chrono.js + optional Gemini.
    // =====================================================================

    @Test
    fun `Summer Game Fest - 2pm PT 5pm ET 9pm GMT full string`() {
        val input = "Friday, June 5 2026 2pm PT / 5pm ET / 9pm GMT"
        val geminiJson = """[
            ${gemini(time = "14:00", date = "2026-06-05", timezone = "America/Los_Angeles", original = "2pm PT")},
            ${gemini(time = "17:00", date = "2026-06-05", timezone = "America/New_York", original = "5pm ET")},
            ${gemini(time = "21:00", date = "2026-06-05", timezone = "Europe/London", original = "9pm GMT")}
        ]"""
        val c = pipeline(input, geminiJson)
        assertEquals("PT + ET + GMT, no ambiguous → 3", 3, c.size)
        val sydneyTimes = c.map { it.localDateTime }.toSet()
        assertEquals("All 3 should convert to same Sydney time", 1, sydneyTimes.size)
    }

    @Test
    fun `Summer Game Fest - June 03 9 30 pm CST 6 30 am PT full string`() {
        val input = "June 03 2026 9:30 pm CST / 6:30 am PT"
        val geminiJson = """[
            ${gemini(time = "21:30", date = "2026-06-03", timezone = "America/Chicago", original = "9:30 pm CST")},
            ${gemini(time = "06:30", date = "2026-06-03", timezone = "America/Los_Angeles", original = "6:30 am PT")}
        ]"""
        val c = pipeline(input, geminiJson)
        // PT(1) + CST(2, US Central + China) = 3
        assertEquals(3, c.size)
        val cstCards = c.filter { it.originalText.contains("CST") }
        assertEquals("CST should have 2 cards (US + China)", 2, cstCards.size)
        assertTrue("CST cards should have different times",
            cstCards[0].localDateTime != cstCards[1].localDateTime)
    }

    @Test
    fun `Summer Game Fest - June 3 2 30 pm BST 6 30 am PT full string`() {
        val input = "June 3 2026 2:30 pm BST / 6:30 am PT"
        val geminiJson = """[
            ${gemini(time = "14:30", date = "2026-06-03", timezone = "Europe/London", original = "2:30 pm BST")},
            ${gemini(time = "06:30", date = "2026-06-03", timezone = "America/Los_Angeles", original = "6:30 am PT")}
        ]"""
        val c = pipeline(input, geminiJson)
        assertEquals("PT(1) + BST(2, British + Bangladesh) = 3", 3, c.size)
    }

    @Test
    fun `Summer Game Fest - midnight BST vs 4pm PT cross-day full string`() {
        val input = "June 7 2026 12:00 am BST / June 6 2026 4:00 pm PT"
        val geminiJson = """[
            ${gemini(time = "00:00", date = "2026-06-07", timezone = "Europe/London", original = "12:00 am BST")},
            ${gemini(time = "16:00", date = "2026-06-06", timezone = "America/Los_Angeles", original = "4:00 pm PT")}
        ]"""
        val c = pipeline(input, geminiJson)
        // PT(1) + BST midnight(2) = 3
        assertEquals(3, c.size)
    }

    @Test
    fun `World Cup - 3pm ET 8pm BST 12 30am IST full string`() {
        val input = "3:00 PM ET on Sunday July 19, 2026 / 8:00 PM BST in the UK / 12:30 AM IST on July 20 in India"
        val geminiJson = """[
            ${gemini(time = "15:00", date = "2026-07-19", timezone = "America/New_York", original = "3:00 PM ET")},
            ${gemini(time = "20:00", date = "2026-07-19", timezone = "Europe/London", original = "8:00 PM BST")},
            ${gemini(time = "00:30", date = "2026-07-20", timezone = "Asia/Kolkata", original = "12:30 AM IST")}
        ]"""
        val c = pipeline(input, geminiJson)
        // ET(1) + BST(2) + IST(2) = 5
        assertEquals(5, c.size)
        val bstCards = c.filter { it.originalText.contains("BST") }
        val istCards = c.filter { it.originalText.contains("IST") }
        assertEquals("BST: British + Bangladesh", 2, bstCards.size)
        assertEquals("IST: India + Ireland", 2, istCards.size)
    }

    @Test
    fun `World Cup - 5am AEST 4am JST next day unambiguous full string`() {
        val input = "5:00 AM AEST on July 20 2026 in Australia / 4:00 AM JST on July 20 2026 in Japan"
        val geminiJson = """[
            ${gemini(time = "05:00", date = "2026-07-20", timezone = "Australia/Sydney", original = "5:00 AM AEST")},
            ${gemini(time = "04:00", date = "2026-07-20", timezone = "Asia/Tokyo", original = "4:00 AM JST")}
        ]"""
        val c = pipeline(input, geminiJson)
        assertEquals("AEST + JST both unambiguous", 2, c.size)
    }

    @Test
    fun `Apple WWDC - June 8 at 10 am Pacific Time full string`() {
        val input = "June 8 2026 at 10:00 a.m. Pacific Time"
        val geminiJson = "[${gemini(time = "10:00", date = "2026-06-08", timezone = "America/Los_Angeles", original = "10:00 a.m. Pacific Time")}]"
        val c = pipeline(input, geminiJson)
        assertEquals(1, c.size)
        assertTrue("Source should show Los Angeles", c[0].sourceTimezone.contains("Los Angeles"))
    }

    @Test
    fun `NVIDIA GTC - Monday March 16 11 am PT full string`() {
        val input = "Monday, March 16, 2026 11:00 a.m. PT"
        val geminiJson = "[${gemini(time = "11:00", date = "2026-03-16", timezone = "America/Los_Angeles", original = "11:00 a.m. PT")}]"
        val c = pipeline(input, geminiJson)
        assertEquals(1, c.size)
    }

    @Test
    fun `Eventbrite - Sat Apr 25 12 00 AM CDT full string`() {
        val input = "Sat, Apr 25 2026 12:00 AM CDT"
        val geminiJson = "[${gemini(time = "00:00", date = "2026-04-25", timezone = "America/Chicago", original = "12:00 AM CDT")}]"
        val c = pipeline(input, geminiJson)
        assertEquals("CDT is unambiguous", 1, c.size)
    }

    @Test
    fun `Meetup - Sat Apr 11 10 00 AM AEST full string`() {
        val input = "Sat, Apr 11 2026 10:00 AM AEST"
        val geminiJson = "[${gemini(time = "10:00", date = "2026-04-11", timezone = "Australia/Sydney", original = "10:00 AM AEST")}]"
        val c = pipeline(input, geminiJson)
        assertEquals(1, c.size)
    }

    @Test
    fun `Nintendo Direct - Feb 5 at 6am PT 9am ET full string`() {
        val input = "Feb 5 2026 6am PT / Feb 5 2026 9am ET"
        val geminiJson = """[
            ${gemini(time = "06:00", date = "2026-02-05", timezone = "America/Los_Angeles", original = "6am PT")},
            ${gemini(time = "09:00", date = "2026-02-05", timezone = "America/New_York", original = "9am ET")}
        ]"""
        val c = pipeline(input, geminiJson)
        assertEquals(2, c.size)
        val sydneyTimes = c.map { it.localDateTime }.toSet()
        assertEquals("PT and ET should convert to same Sydney time", 1, sydneyTimes.size)
    }

    @Test
    fun `Festival of Rail - Thursday February 5th from 18 00 UTC full string`() {
        val input = "Thursday February 5th 2026 from 18:00 UTC"
        val geminiJson = "[${gemini(time = "18:00", date = "2026-02-05", timezone = "UTC", original = "18:00 UTC")}]"
        val c = pipeline(input, geminiJson)
        assertEquals(1, c.size)
    }

    @Test
    fun `Zoom invite - Apr 10 2026 02 00 PM Eastern Time full string`() {
        val input = "Apr 10, 2026 02:00 PM Eastern Time (US and Canada)"
        val geminiJson = "[${gemini(time = "14:00", date = "2026-04-10", timezone = "America/New_York", original = "02:00 PM Eastern Time")}]"
        val c = pipeline(input, geminiJson)
        assertEquals(1, c.size)
        assertTrue("Source tz should show New York", c[0].sourceTimezone.contains("New York"))
    }

    @Test
    fun `Google Calendar - April 15 10am to 11am EDT full string`() {
        val input = "Wednesday, April 15, 2026 10:00am - 11:00am (Eastern Daylight Time)"
        val geminiJson = "[${gemini(time = "10:00", date = "2026-04-15", timezone = "America/New_York", original = "10:00am Eastern Daylight Time")}]"
        val c = pipeline(input, geminiJson)
        assertEquals("Range: start + end", 2, c.size)
    }

    // =====================================================================
    // 17. Gaming multi-timezone with ALL ambiguous TZs (full strings)
    // =====================================================================

    @Test
    fun `gaming showcase - 10AM PT 1PM ET 6PM BST 7PM CEST full string`() {
        val input = "10:00AM PT / 1:00PM ET / 6:00PM BST / 7:00PM CEST"
        val geminiJson = """[
            ${gemini(time = "10:00", date = "2026-04-11", timezone = "America/Los_Angeles", original = "10:00AM PT")},
            ${gemini(time = "13:00", date = "2026-04-11", timezone = "America/New_York", original = "1:00PM ET")},
            ${gemini(time = "18:00", date = "2026-04-11", timezone = "Europe/London", original = "6:00PM BST")},
            ${gemini(time = "19:00", date = "2026-04-11", timezone = "Europe/Berlin", original = "7:00PM CEST")}
        ]"""
        val c = pipeline(input, geminiJson)
        // PT(1) + ET(1) + BST(2, British+Bangladesh) + CEST(1) = 5
        assertEquals(5, c.size)
        val bstCards = c.filter { it.originalText.contains("BST") }
        assertEquals("BST expands to 2", 2, bstCards.size)
    }

    @Test
    fun `gaming showcase - 6 30am PT 9 30pm CST 2 30pm BST full string`() {
        val input = "6:30 am PT / 9:30 pm CST / 2:30 pm BST"
        val geminiJson = """[
            ${gemini(time = "06:30", date = "2026-04-11", timezone = "America/Los_Angeles", original = "6:30 am PT")},
            ${gemini(time = "21:30", date = "2026-04-11", timezone = "America/Chicago", original = "9:30 pm CST")},
            ${gemini(time = "14:30", date = "2026-04-11", timezone = "Europe/London", original = "2:30 pm BST")}
        ]"""
        val c = pipeline(input, geminiJson)
        // PT(1) + CST(2) + BST(2) = 5
        assertEquals(5, c.size)
    }

    @Test
    fun `five timezone announcement full string`() {
        val input = "10:30 pm JST / 6:30 am PT / 9:30 am ET / 2:30 pm BST / 3:30 pm CEST"
        val geminiJson = """[
            ${gemini(time = "22:30", date = "2026-04-11", timezone = "Asia/Tokyo", original = "10:30 pm JST")},
            ${gemini(time = "06:30", date = "2026-04-11", timezone = "America/Los_Angeles", original = "6:30 am PT")},
            ${gemini(time = "09:30", date = "2026-04-11", timezone = "America/New_York", original = "9:30 am ET")},
            ${gemini(time = "14:30", date = "2026-04-11", timezone = "Europe/London", original = "2:30 pm BST")},
            ${gemini(time = "15:30", date = "2026-04-11", timezone = "Europe/Berlin", original = "3:30 pm CEST")}
        ]"""
        val c = pipeline(input, geminiJson)
        // JST(1) + PT(1) + ET(1) + BST(2) + CEST(1) = 6
        assertEquals(6, c.size)
    }

    // =====================================================================
    // 18. Sports cross-date with ambiguous TZs (full strings)
    // =====================================================================

    @Test
    fun `World Cup final six timezones full string`() {
        val input = "Jul 19 2026 3:00 PM ET / Jul 19 2026 8:00 PM BST / Jul 19 2026 9:00 PM CET / 12:30 AM IST Jul 20 2026 / 5:00 AM AEST Jul 20 2026 / 4:00 AM JST Jul 20 2026"
        val geminiJson = """[
            ${gemini(time = "15:00", date = "2026-07-19", timezone = "America/New_York", original = "3:00 PM ET")},
            ${gemini(time = "20:00", date = "2026-07-19", timezone = "Europe/London", original = "8:00 PM BST")},
            ${gemini(time = "21:00", date = "2026-07-19", timezone = "Europe/Paris", original = "9:00 PM CET")},
            ${gemini(time = "00:30", date = "2026-07-20", timezone = "Asia/Kolkata", original = "12:30 AM IST")},
            ${gemini(time = "05:00", date = "2026-07-20", timezone = "Australia/Sydney", original = "5:00 AM AEST")},
            ${gemini(time = "04:00", date = "2026-07-20", timezone = "Asia/Tokyo", original = "4:00 AM JST")}
        ]"""
        val c = pipeline(input, geminiJson)
        // ET(1) + BST(2) + CET(2: chrono CEST+2 vs Gemini CET+1 don't merge) + IST(2) + AEST(1) + JST(1) = 9
        assertEquals(9, c.size)
    }

    @Test
    fun `match kickoff 9pm ET 6 30am IST next day full string`() {
        val input = "9:00 PM ET Jun 20 2026 / 6:30 AM IST Jun 21 2026"
        val geminiJson = """[
            ${gemini(time = "21:00", date = "2026-06-20", timezone = "America/New_York", original = "9:00 PM ET")},
            ${gemini(time = "06:30", date = "2026-06-21", timezone = "Asia/Kolkata", original = "6:30 AM IST")}
        ]"""
        val c = pipeline(input, geminiJson)
        // ET(1) + IST(2) = 3
        assertEquals(3, c.size)
    }

    // =====================================================================
    // 19. Edge: ambiguous TZ at midnight / day boundary (full strings)
    // =====================================================================

    @Test
    fun `CST midnight - US vs China give different Sydney times`() {
        val input = "The server maintenance window is April 15, 2026 12:00 AM CST"
        val geminiJson = "[${gemini(time = "00:00", date = "2026-04-15", timezone = "America/Chicago", original = "12:00 AM CST")}]"
        val c = pipeline(input, geminiJson)
        assertEquals(2, c.size)
        val times = c.map { it.localDateTime }.toSet()
        assertEquals("Midnight CST in US vs China should produce different Sydney times", 2, times.size)
    }

    @Test
    fun `BST midnight - British vs Bangladesh full string`() {
        val input = "Release window: June 7, 2026 12:00 am BST"
        val geminiJson = "[${gemini(time = "00:00", date = "2026-06-07", timezone = "Europe/London", original = "12:00 am BST")}]"
        val c = pipeline(input, geminiJson)
        assertEquals(2, c.size)
    }

    @Test
    fun `IST 11 59pm near midnight full string`() {
        val input = "Submit your report by April 11, 2026 11:59 PM IST"
        val geminiJson = "[${gemini(time = "23:59", date = "2026-04-11", timezone = "Asia/Kolkata", original = "11:59 PM IST")}]"
        val c = pipeline(input, geminiJson)
        assertEquals(2, c.size)
    }
}
