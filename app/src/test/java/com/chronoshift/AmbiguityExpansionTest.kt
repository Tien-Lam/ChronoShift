package com.chronoshift

import com.chronoshift.conversion.TimeConverter
import com.chronoshift.nlp.ChronoResultParser
import com.chronoshift.nlp.LlmResultParser
import com.chronoshift.nlp.ResultMerger
import com.chronoshift.nlp.TestCityResolver
import com.chronoshift.nlp.TimezoneAbbreviations
import kotlinx.datetime.TimeZone
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

/**
 * Tests for ambiguous timezone expansion, zone-based abbreviations (CT/ET/PT/MT/AT),
 * and realistic multi-timezone inputs from real-world usage patterns.
 *
 * Default target: Australia/Sydney (UTC+10/+11) — far from most source zones.
 */
class AmbiguityExpansionTest {

    private val converter = TimeConverter()
    private val cityResolver = TestCityResolver()
    private val sydney = TimeZone.of("Australia/Sydney")
    private val tokyo = TimeZone.of("Asia/Tokyo")

    @Before
    fun setup() {
        ChronoResultParser.clearOffsetCache()
    }

    // --- JSON builder helpers (same as EndToEndTest) ---

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

    /** Full pipeline: chrono parse → gemini merge → expand ambiguous → convert. */
    private fun fullPipeline(
        chronoJson: String,
        originalText: String = "",
        geminiJson: String? = null,
        localZone: TimeZone = sydney,
    ): List<com.chronoshift.conversion.ConvertedTime> {
        val chronoResults = ChronoResultParser.parse(chronoJson, originalText, cityResolver)
        var merged = if (geminiJson != null) {
            val geminiResults = LlmResultParser.parseResponse(geminiJson)
            ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")
        } else {
            chronoResults
        }
        merged = ChronoResultParser.expandAmbiguous(merged)
        return converter.toLocal(merged, localZone)
    }

    // =====================================================================
    // 1. CST ambiguity — US Central Standard (UTC-6) vs China Standard (UTC+8)
    // =====================================================================

    @Test
    fun `CST alone expands to 2 interpretations`() {
        val c = fullPipeline("[${chrono("3pm CST", hour = 15, timezone = -360)}]")
        assertEquals(2, c.size)
        val times = c.map { it.localDateTime }.toSet()
        assertEquals("Two different local times in Sydney", 2, times.size)
    }

    @Test
    fun `CST in multi-timezone message - 8p CEST 7p BST 2p ET 11a PT`() {
        // Gaming announcement pattern: "8p CEST / 7p BST / 2p ET / 11a PT"
        // CEST and BST are ambiguous; ET and PT are zone-based
        val json = """[
            ${chrono("8p CEST", hour = 20, timezone = 120, dayCertain = true)},
            ${chrono("7p BST", hour = 19, timezone = 60, dayCertain = true)},
            ${chrono("2p ET", hour = 14, timezone = -240, dayCertain = true)},
            ${chrono("11a PT", hour = 11, timezone = -420, dayCertain = true)}
        ]"""
        val chronoResults = ChronoResultParser.parse(json, "", null)
        val expanded = ChronoResultParser.expandAmbiguous(chronoResults)
        // CEST is unambiguous. BST is ambiguous (British Summer +1 / Bangladesh +6).
        // ET and PT are zone-based (not ambiguous). So BST should expand.
        val bstResults = expanded.filter { it.originalText == "7p BST" }
        assertEquals("BST should expand to 2 interpretations", 2, bstResults.size)
    }

    @Test
    fun `CST with Gemini agreeing does not duplicate`() {
        val chronoJson = "[${chrono("10am CST", hour = 10, timezone = -360)}]"
        val geminiJson = "[${gemini(time = "10:00", timezone = "America/Chicago", original = "10am CST")}]"
        val c = fullPipeline(chronoJson, geminiJson = geminiJson)
        // Chrono and Gemini both say US Central → merge to 1, expand adds China → 2
        assertEquals(2, c.size)
    }

    @Test
    fun `CST with Gemini saying China produces 2 not 3`() {
        val chronoJson = "[${chrono("10am CST", hour = 10, timezone = -360)}]"
        val geminiJson = "[${gemini(time = "10:00", timezone = "Asia/Shanghai", original = "10am CST")}]"
        val c = fullPipeline(chronoJson, geminiJson = geminiJson)
        // Chrono says US Central, Gemini says China → merge keeps both → expand finds both covered → 2
        assertEquals(2, c.size)
    }

    @Test
    fun `deadline is Friday 5pm CST`() {
        val c = fullPipeline(
            "[${chrono("5pm CST", month = 4, day = 11, hour = 17, timezone = -360, dayCertain = true)}]",
            "deadline is Friday 5pm CST",
        )
        assertEquals("CST expands to US Central + China", 2, c.size)
    }

    @Test
    fun `server maintenance 2am CST`() {
        val c = fullPipeline("[${chrono("2:00 AM CST", hour = 2, timezone = -360)}]")
        assertEquals(2, c.size)
    }

    // =====================================================================
    // 2. IST ambiguity — India Standard (UTC+5:30) vs Irish Standard (UTC+1)
    // =====================================================================

    @Test
    fun `IST alone expands to 2 interpretations`() {
        val c = fullPipeline("[${chrono("3:30pm IST", hour = 15, minute = 30, timezone = 330)}]")
        assertEquals(2, c.size)
        val times = c.map { it.localDateTime }.toSet()
        assertEquals("India vs Ireland should give different Sydney times", 2, times.size)
    }

    @Test
    fun `daily standup at 9am IST`() {
        val c = fullPipeline("[${chrono("9am IST", hour = 9, timezone = 330)}]")
        assertEquals("IST expands to India + Ireland", 2, c.size)
    }

    @Test
    fun `IST with Gemini picking India keeps both`() {
        val chronoJson = "[${chrono("9am IST", hour = 9, timezone = 330)}]"
        val geminiJson = "[${gemini(time = "09:00", timezone = "Asia/Kolkata", original = "9am IST")}]"
        val c = fullPipeline(chronoJson, geminiJson = geminiJson)
        assertEquals("Expand adds Irish interpretation", 2, c.size)
    }

    @Test
    fun `IST with Gemini picking Ireland keeps both`() {
        val chronoJson = "[${chrono("9am IST", hour = 9, timezone = 60)}]"
        val geminiJson = "[${gemini(time = "09:00", timezone = "Europe/Dublin", original = "9am IST")}]"
        val c = fullPipeline(chronoJson, geminiJson = geminiJson)
        assertEquals("Expand adds India interpretation", 2, c.size)
    }

    @Test
    fun `IST half-hour offset preserved through expansion`() {
        val chronoJson = "[${chrono("10:30 AM IST", hour = 10, minute = 30, timezone = 330)}]"
        val chronoResults = ChronoResultParser.parse(chronoJson, "", null)
        val expanded = ChronoResultParser.expandAmbiguous(chronoResults)
        // India interpretation: 10:30 at UTC+5:30
        // Ireland interpretation: 10:30 at UTC+1
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
        val c = fullPipeline("[${chrono("2pm BST", hour = 14, timezone = 60)}]")
        assertEquals(2, c.size)
    }

    @Test
    fun `webinar June 15 7pm BST`() {
        val c = fullPipeline(
            "[${chrono("7pm BST", month = 6, day = 15, hour = 19, timezone = 60, dayCertain = true)}]",
            "webinar: June 15, 7pm BST",
        )
        assertEquals("BST: British Summer + Bangladesh", 2, c.size)
    }

    @Test
    fun `BST with Gemini picking London`() {
        val chronoJson = "[${chrono("3pm BST", hour = 15, timezone = 60)}]"
        val geminiJson = "[${gemini(time = "15:00", timezone = "Europe/London", original = "3pm BST")}]"
        val c = fullPipeline(chronoJson, geminiJson = geminiJson)
        assertEquals("Expand adds Bangladesh interpretation", 2, c.size)
    }

    @Test
    fun `release window 3am BST Saturday`() {
        val c = fullPipeline(
            "[${chrono("3am BST", month = 4, day = 12, hour = 3, timezone = 60, dayCertain = true)}]",
        )
        assertEquals(2, c.size)
    }

    // =====================================================================
    // 4. AST ambiguity — Atlantic Standard (UTC-4) vs Arabia Standard (UTC+3)
    // =====================================================================

    @Test
    fun `AST alone expands to 2 interpretations`() {
        val c = fullPipeline("[${chrono("4pm AST", hour = 16, timezone = -240)}]")
        assertEquals(2, c.size)
    }

    @Test
    fun `flight lands 4 30pm AST`() {
        val c = fullPipeline("[${chrono("4:30pm AST", hour = 16, minute = 30, timezone = -240)}]")
        assertEquals("AST: Atlantic + Arabia", 2, c.size)
        val times = c.map { it.localDateTime }.toSet()
        assertEquals("7-hour difference should give different Sydney times", 2, times.size)
    }

    @Test
    fun `meeting 10am AST with Gemini picking Arabia`() {
        val chronoJson = "[${chrono("10am AST", hour = 10, timezone = 180)}]"
        val geminiJson = "[${gemini(time = "10:00", timezone = "Asia/Riyadh", original = "10am AST")}]"
        val c = fullPipeline(chronoJson, geminiJson = geminiJson)
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
        // "3pm CT" should produce 1 result, not 2
        val chronoJson = "[${chrono("3pm CT", hour = 15, timezone = -300)}]"
        val results = ChronoResultParser.parse(chronoJson, "", null)
        val expanded = ChronoResultParser.expandAmbiguous(results)
        assertEquals("CT is not ambiguous, should not expand", results.size, expanded.size)
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
        val json = """[
            ${chrono("10:00AM PT", hour = 10, timezone = -420, dayCertain = true)},
            ${chrono("1:00PM ET", hour = 13, timezone = -240, dayCertain = true)},
            ${chrono("6:00PM BST", hour = 18, timezone = 60, dayCertain = true)},
            ${chrono("7:00PM CEST", hour = 19, timezone = 120, dayCertain = true)}
        ]"""
        val c = fullPipeline(json)
        // PT, ET → no expansion (zone-based / unambiguous offset)
        // BST → ambiguous (British Summer + Bangladesh) → expands to 2
        // CEST → unambiguous
        // Total: 4 + 1 BST expansion = 5
        assertEquals(5, c.size)
    }

    @Test
    fun `business meeting - 9am PST 12pm EST 5pm GMT 6pm CET`() {
        val json = """[
            ${chrono("9am PST", hour = 9, timezone = -480, dayCertain = true)},
            ${chrono("12pm EST", hour = 12, timezone = -300, dayCertain = true)},
            ${chrono("5pm GMT", hour = 17, timezone = 0, dayCertain = true)},
            ${chrono("6pm CET", hour = 18, timezone = 60, dayCertain = true)}
        ]"""
        val c = fullPipeline(json)
        // All unambiguous → no expansion → 4
        assertEquals(4, c.size)
    }

    @Test
    fun `slack style - standup 9am PT noon ET`() {
        val json = """[
            ${chrono("9am PT", hour = 9, timezone = -420)},
            ${chrono("noon ET", hour = 12, timezone = -240)}
        ]"""
        val c = fullPipeline(json)
        assertEquals(2, c.size)
    }

    @Test
    fun `project sync with IST - 15 00 UTC 11 00 EDT 20 30 IST`() {
        val json = """[
            ${chrono("15:00 UTC", hour = 15, timezone = 0, dayCertain = true)},
            ${chrono("11:00 EDT", hour = 11, timezone = -240, dayCertain = true)},
            ${chrono("20:30 IST", hour = 20, minute = 30, timezone = 330, dayCertain = true)}
        ]"""
        val c = fullPipeline(json)
        // UTC, EDT unambiguous. IST ambiguous → expands.
        // Total: 3 + 1 IST expansion = 4
        assertEquals(4, c.size)
    }

    // =====================================================================
    // 7. EST written in summer (common mistake) — should not expand
    // =====================================================================

    @Test
    fun `EST in July - common mistake - no expansion`() {
        // People write "3pm EST" in July when they mean EDT. EST is unambiguous (-300).
        val c = fullPipeline(
            "[${chrono("3pm EST", month = 7, day = 15, hour = 15, timezone = -300, dayCertain = true)}]",
        )
        assertEquals("EST is unambiguous, should not expand", 1, c.size)
    }

    @Test
    fun `PST in July - common mistake - no expansion`() {
        val c = fullPipeline(
            "[${chrono("10am PST", month = 7, day = 15, hour = 10, timezone = -480, dayCertain = true)}]",
        )
        assertEquals("PST is unambiguous, should not expand", 1, c.size)
    }

    // =====================================================================
    // 8. Time ranges with ambiguous timezones
    // =====================================================================

    @Test
    fun `workshop 2-4pm CST - range with ambiguous tz`() {
        val json = "[${chrono("2-4pm CST", hour = 14, timezone = -360, dayCertain = true,
            end = chronoEnd(hour = 16, timezone = -360))}]"
        val c = fullPipeline(json)
        // Range produces start + end. CST is ambiguous → both expand.
        // Start (2pm CST) → US + China = 2
        // End (2-4pm CST (end)) → US + China = 2
        // Total = 4
        assertEquals(4, c.size)
    }

    @Test
    fun `office hours 9-5 CT - range with zone-based tz`() {
        // CT is zone-based, not ambiguous — no expansion
        val json = "[${chrono("9-5 CT", hour = 9, timezone = -300,
            end = chronoEnd(hour = 17, timezone = -300))}]"
        val c = fullPipeline(json)
        assertEquals("CT range: start + end, no expansion", 2, c.size)
    }

    // =====================================================================
    // 9. Cross-day confusion with ambiguous timezones
    // =====================================================================

    @Test
    fun `Friday 11pm CST crosses midnight for China interpretation`() {
        val json = "[${chrono("11pm CST", month = 4, day = 11, hour = 23, timezone = -360, dayCertain = true)}]"
        val chronoResults = ChronoResultParser.parse(json, "", null)
        val expanded = ChronoResultParser.expandAmbiguous(chronoResults)
        assertEquals(2, expanded.size)
        // US Central: 11pm UTC-6 = 05:00 UTC Apr 12
        // China: 11pm UTC+8 = 15:00 UTC Apr 11
        // Should be different dates in Sydney
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
        val json = """[
            ${chrono("9am IST", hour = 9, timezone = 330, dayCertain = true)},
            ${chrono("7pm CST", hour = 19, timezone = -360, dayCertain = true)}
        ]"""
        val chronoResults = ChronoResultParser.parse(json, "", null)
        val expanded = ChronoResultParser.expandAmbiguous(chronoResults)
        // IST: India + Ireland = 2
        // CST: US Central + China = 2
        // Total = 4
        assertEquals(4, expanded.size)
    }

    @Test
    fun `BST and AST in same message both expand`() {
        val json = """[
            ${chrono("3pm BST", hour = 15, timezone = 60)},
            ${chrono("10am AST", hour = 10, timezone = -240)}
        ]"""
        val chronoResults = ChronoResultParser.parse(json, "", null)
        val expanded = ChronoResultParser.expandAmbiguous(chronoResults)
        assertEquals("BST(2) + AST(2) = 4", 4, expanded.size)
    }

    @Test
    fun `all four ambiguous abbreviations in one message`() {
        val json = """[
            ${chrono("9am CST", hour = 9, timezone = -360)},
            ${chrono("10am IST", hour = 10, timezone = 330)},
            ${chrono("2pm BST", hour = 14, timezone = 60)},
            ${chrono("4pm AST", hour = 16, timezone = -240)}
        ]"""
        val chronoResults = ChronoResultParser.parse(json, "", null)
        val expanded = ChronoResultParser.expandAmbiguous(chronoResults)
        // Each expands to 2 = 8 total
        assertEquals(8, expanded.size)
    }

    // =====================================================================
    // 11. Ambiguous + unambiguous mix — only ambiguous expands
    // =====================================================================

    @Test
    fun `EST and CST together - only CST expands`() {
        val json = """[
            ${chrono("3pm EST", hour = 15, timezone = -300)},
            ${chrono("2pm CST", hour = 14, timezone = -360)}
        ]"""
        val chronoResults = ChronoResultParser.parse(json, "", null)
        val expanded = ChronoResultParser.expandAmbiguous(chronoResults)
        // EST: unambiguous → 1. CST: ambiguous → 2. Total = 3.
        assertEquals(3, expanded.size)
    }

    @Test
    fun `JST and IST together - only IST expands`() {
        val json = """[
            ${chrono("9am JST", hour = 9, timezone = 540)},
            ${chrono("3pm IST", hour = 15, timezone = 330)}
        ]"""
        val chronoResults = ChronoResultParser.parse(json, "", null)
        val expanded = ChronoResultParser.expandAmbiguous(chronoResults)
        assertEquals("JST(1) + IST(2) = 3", 3, expanded.size)
    }

    // =====================================================================
    // 12. Expansion produces correct instants (math checks)
    // =====================================================================

    @Test
    fun `CST expansion - US 3pm is 9pm UTC, China 3pm is 7am UTC`() {
        val json = "[${chrono("3pm CST", hour = 15, timezone = -360)}]"
        val chronoResults = ChronoResultParser.parse(json, "", null)
        val expanded = ChronoResultParser.expandAmbiguous(chronoResults)
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
        val json = "[${chrono("9am IST", hour = 9, timezone = 330)}]"
        val chronoResults = ChronoResultParser.parse(json, "", null)
        val expanded = ChronoResultParser.expandAmbiguous(chronoResults)
        assertEquals(2, expanded.size)
        val instants = expanded.map { it.instant!! }
        assertTrue("Two different instants", instants[0] != instants[1])
    }

    @Test
    fun `BST expansion - British 2pm is 1pm UTC, Bangladesh 2pm is 8am UTC`() {
        val json = "[${chrono("2pm BST", hour = 14, timezone = 60)}]"
        val chronoResults = ChronoResultParser.parse(json, "", null)
        val expanded = ChronoResultParser.expandAmbiguous(chronoResults)
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
        val json = "[${chrono("3pm", hour = 15)}]"
        val results = ChronoResultParser.parse(json, "let's meet at 3pm", null)
        val expanded = ChronoResultParser.expandAmbiguous(results)
        assertEquals(results.size, expanded.size)
    }

    @Test
    fun `city-resolved timezone does not trigger expansion`() {
        val json = "[${chrono("5pm", hour = 17)}]"
        val results = ChronoResultParser.parse(json, "5pm in Tokyo", cityResolver)
        val expanded = ChronoResultParser.expandAmbiguous(results)
        assertEquals("City-resolved tz should not expand", results.size, expanded.size)
    }

    // =====================================================================
    // 14. Expansion idempotency
    // =====================================================================

    @Test
    fun `expanding twice produces same result`() {
        val json = "[${chrono("3pm CST", hour = 15, timezone = -360)}]"
        val results = ChronoResultParser.parse(json, "", null)
        val once = ChronoResultParser.expandAmbiguous(results)
        val twice = ChronoResultParser.expandAmbiguous(once)
        assertEquals("Double expansion should be idempotent", once.size, twice.size)
    }

    @Test
    fun `expanding IST twice is idempotent`() {
        val json = "[${chrono("9am IST", hour = 9, timezone = 330)}]"
        val results = ChronoResultParser.parse(json, "", null)
        val once = ChronoResultParser.expandAmbiguous(results)
        val twice = ChronoResultParser.expandAmbiguous(once)
        assertEquals(once.size, twice.size)
    }

    // =====================================================================
    // 15. Real-world full pipeline scenarios
    // =====================================================================

    @Test
    fun `Zoom invite - Apr 5 2026 09 00 AM Pacific Time`() {
        // Zoom says "Pacific Time" but Chrono would extract "9:00 AM" with offset
        val c = fullPipeline(
            "[${chrono("09:00 AM", hour = 9, timezone = -420, dayCertain = true, month = 4, day = 5)}]",
            "Apr 5, 2026 09:00 AM Pacific Time (US and Canada)",
        )
        assertEquals("Unambiguous PT offset → 1 result", 1, c.size)
    }

    @Test
    fun `email - submit by 11 59pm EST March 15`() {
        val c = fullPipeline(
            "[${chrono("11:59pm EST", month = 3, day = 15, hour = 23, minute = 59, timezone = -300, dayCertain = true)}]",
            "submit by 11:59pm EST on March 15",
        )
        assertEquals(1, c.size)
    }

    @Test
    fun `TV schedule - 8 7c pattern`() {
        // "8/7c" = 8pm ET / 7pm CT — two separate timestamps
        val json = """[
            ${chrono("8pm", hour = 20, timezone = -240)},
            ${chrono("7pm", hour = 19, timezone = -300)}
        ]"""
        val c = fullPipeline(json)
        assertEquals(2, c.size)
    }

    @Test
    fun `airline arrival +1 day - departs 11 45pm arrives 11 30am`() {
        val json = """[
            ${chrono("11:45 PM", hour = 23, minute = 45, timezone = -300, dayCertain = true)},
            ${chrono("11:30 AM", month = 4, day = 10, hour = 11, minute = 30, timezone = 0, dayCertain = true)}
        ]"""
        val c = fullPipeline(json)
        assertEquals(2, c.size)
    }

    @Test
    fun `deployment at 00 00 UTC Saturday`() {
        val c = fullPipeline(
            "[${chrono("00:00 UTC", month = 4, day = 12, hour = 0, timezone = 0, dayCertain = true)}]",
        )
        assertEquals(1, c.size)
    }

    @Test
    fun `CET office hours - 08 00 to 17 00 CET`() {
        val json = "[${chrono("08:00-17:00 CET", hour = 8, timezone = 60, dayCertain = true,
            end = chronoEnd(hour = 17, timezone = 60))}]"
        val c = fullPipeline(json)
        assertEquals("CET unambiguous, range = 2 results", 2, c.size)
    }

    @Test
    fun `Korean sprint review 10am KST`() {
        val c = fullPipeline("[${chrono("10am KST", hour = 10, timezone = 540)}]")
        assertEquals(1, c.size)
    }

    @Test
    fun `Singapore standup 10am SGT`() {
        val c = fullPipeline("[${chrono("10am SGT", hour = 10, timezone = 480)}]")
        assertEquals(1, c.size)
    }

    @Test
    fun `NZST afternoon meeting`() {
        val c = fullPipeline("[${chrono("2pm NZST", hour = 14, timezone = 720)}]")
        assertEquals(1, c.size)
    }

    // =====================================================================
    // 16. Real-world event timestamps (verbatim from websites)
    // Source: Summer Game Fest, WWDC, World Cup, Eventbrite, Meetup, etc.
    // =====================================================================

    // --- Summer Game Fest: "2pm PT / 5pm ET / 9pm GMT" ---

    @Test
    fun `Summer Game Fest - 2pm PT 5pm ET 9pm GMT`() {
        val json = """[
            ${chrono("2pm PT", month = 6, day = 5, hour = 14, timezone = -420, dayCertain = true)},
            ${chrono("5pm ET", month = 6, day = 5, hour = 17, timezone = -240, dayCertain = true)},
            ${chrono("9pm GMT", month = 6, day = 5, hour = 21, timezone = 0, dayCertain = true)}
        ]"""
        val c = fullPipeline(json)
        // PT, ET zone-based; GMT unambiguous → no expansion → 3
        assertEquals(3, c.size)
    }

    // --- Summer Game Fest: "June 03 9:30 pm CST / 6:30 am PT" — CST is ambiguous! ---

    @Test
    fun `Summer Game Fest - 9 30pm CST 6 30am PT - CST expands`() {
        val json = """[
            ${chrono("9:30 pm CST", month = 6, day = 3, hour = 21, minute = 30, timezone = -360, dayCertain = true)},
            ${chrono("6:30 am PT", month = 6, day = 3, hour = 6, minute = 30, timezone = -420, dayCertain = true)}
        ]"""
        val c = fullPipeline(json)
        // PT: no expansion. CST: expands to US Central + China = 2.
        // Total: 1 + 2 = 3
        assertEquals(3, c.size)
    }

    // --- Summer Game Fest: "June 3 2:30 pm BST / 6:30 am PT" — BST is ambiguous ---

    @Test
    fun `Summer Game Fest - 2 30pm BST 6 30am PT - BST expands`() {
        val json = """[
            ${chrono("2:30 pm BST", month = 6, day = 3, hour = 14, minute = 30, timezone = 60, dayCertain = true)},
            ${chrono("6:30 am PT", month = 6, day = 3, hour = 6, minute = 30, timezone = -420, dayCertain = true)}
        ]"""
        val c = fullPipeline(json)
        // BST expands (British Summer + Bangladesh). PT doesn't.
        assertEquals(3, c.size)
    }

    // --- Summer Game Fest cross-midnight: "June 7 12:00 am BST / 4:00 pm PT" ---

    @Test
    fun `Summer Game Fest - midnight BST vs 4pm PT previous day - BST expands`() {
        val json = """[
            ${chrono("12:00 am BST", month = 6, day = 7, hour = 0, timezone = 60, dayCertain = true)},
            ${chrono("4:00 pm PT", month = 6, day = 6, hour = 16, timezone = -420, dayCertain = true)}
        ]"""
        val c = fullPipeline(json)
        // BST midnight expands to British + Bangladesh midnight → 2
        // PT: 1
        // Total: 3
        assertEquals(3, c.size)
    }

    // --- World Cup: "3:00 PM ET" with BST/IST alternatives across dates ---

    @Test
    fun `World Cup - 3pm ET 8pm BST - BST expands`() {
        val json = """[
            ${chrono("3:00 PM ET", month = 7, day = 19, hour = 15, timezone = -240, dayCertain = true)},
            ${chrono("8:00 PM BST", month = 7, day = 19, hour = 20, timezone = 60, dayCertain = true)}
        ]"""
        val c = fullPipeline(json)
        // ET: zone-based, no expansion. BST: ambiguous → expands.
        assertEquals(3, c.size)
    }

    @Test
    fun `World Cup - 12 30 AM IST next day - IST expands`() {
        // "12:30 AM IST on July 20" — IST is ambiguous (India +5:30 vs Ireland +1)
        val json = "[${chrono("12:30 AM IST", month = 7, day = 20, hour = 0, minute = 30, timezone = 330, dayCertain = true)}]"
        val c = fullPipeline(json)
        assertEquals("IST expands to India + Ireland", 2, c.size)
        // India: 00:30 UTC+5:30 = 19:00 UTC Jul 19
        // Ireland: 00:30 UTC+1 = 23:30 UTC Jul 19
        // In Sydney these should be very different times
        val times = c.map { it.localDateTime }.toSet()
        assertEquals(2, times.size)
    }

    @Test
    fun `World Cup - 5am AEST next day - unambiguous`() {
        val json = "[${chrono("5:00 AM AEST", month = 7, day = 20, hour = 5, timezone = 600, dayCertain = true)}]"
        val c = fullPipeline(json)
        assertEquals("AEST unambiguous", 1, c.size)
    }

    // --- Apple WWDC: "10 a.m. PT" / "June 8 at 10:00 a.m. Pacific Time" ---

    @Test
    fun `Apple WWDC - 10am PT June 8`() {
        val c = fullPipeline(
            "[${chrono("10 a.m. PT", month = 6, day = 8, hour = 10, timezone = -420, dayCertain = true)}]",
            "June 8 at 10:00 a.m. Pacific Time",
        )
        assertEquals(1, c.size)
    }

    @Test
    fun `Apple deadline - 11 59pm PT March 30`() {
        val c = fullPipeline(
            "[${chrono("11:59 p.m. PT", month = 3, day = 30, hour = 23, minute = 59, timezone = -420, dayCertain = true)}]",
        )
        assertEquals(1, c.size)
    }

    // --- NVIDIA GTC: "Monday, March 16, 11:00 a.m. PT" ---

    @Test
    fun `NVIDIA GTC - 11am PT March 16`() {
        val c = fullPipeline(
            "[${chrono("11:00 a.m. PT", month = 3, day = 16, hour = 11, timezone = -420, dayCertain = true)}]",
            "Monday, March 16, 11:00 a.m. PT",
        )
        assertEquals(1, c.size)
    }

    @Test
    fun `NVIDIA GTC - 2 30pm PT`() {
        val c = fullPipeline(
            "[${chrono("2:30 p.m. PT", month = 3, day = 19, hour = 14, minute = 30, timezone = -420, dayCertain = true)}]",
        )
        assertEquals(1, c.size)
    }

    // --- Eventbrite: "Sat, Apr 25 • 12:00 AM CDT" ---

    @Test
    fun `Eventbrite - midnight CDT`() {
        val c = fullPipeline(
            "[${chrono("12:00 AM CDT", month = 4, day = 25, hour = 0, timezone = -300, dayCertain = true)}]",
        )
        assertEquals("CDT is unambiguous", 1, c.size)
    }

    @Test
    fun `Eventbrite - 9am PDT`() {
        val c = fullPipeline(
            "[${chrono("9:00 AM PDT", month = 5, day = 14, hour = 9, timezone = -420, dayCertain = true)}]",
        )
        assertEquals(1, c.size)
    }

    // --- Meetup: "Sat, Apr 11 · 10:00 AM AEST" ---

    @Test
    fun `Meetup - 10am AEST`() {
        val c = fullPipeline(
            "[${chrono("10:00 AM AEST", month = 4, day = 11, hour = 10, timezone = 600, dayCertain = true)}]",
        )
        assertEquals(1, c.size)
    }

    @Test
    fun `Meetup - 6 30pm AEST monthly`() {
        val c = fullPipeline(
            "[${chrono("6:30 PM AEST", month = 4, day = 24, hour = 18, minute = 30, timezone = 600, dayCertain = true)}]",
        )
        assertEquals(1, c.size)
    }

    // --- Festival of Rail: "18:00 UTC" (24h + UTC) ---

    @Test
    fun `Festival of Rail - 18 00 UTC`() {
        val c = fullPipeline(
            "[${chrono("18:00 UTC", month = 2, day = 5, hour = 18, timezone = 0, dayCertain = true)}]",
        )
        assertEquals(1, c.size)
    }

    @Test
    fun `Festival of Rail - 19 00 UTC`() {
        val c = fullPipeline(
            "[${chrono("19:00 UTC", month = 2, day = 3, hour = 19, timezone = 0, dayCertain = true)}]",
        )
        assertEquals(1, c.size)
    }

    // --- Nintendo Direct: "6 a.m. PT/9 a.m. ET" (no space around slash) ---

    @Test
    fun `Nintendo Direct - 6am PT 9am ET`() {
        val json = """[
            ${chrono("6 a.m. PT", month = 2, day = 5, hour = 6, timezone = -420, dayCertain = true)},
            ${chrono("9 a.m. ET", month = 2, day = 5, hour = 9, timezone = -300, dayCertain = true)}
        ]"""
        val c = fullPipeline(json)
        assertEquals(2, c.size)
    }

    // --- Google I/O: "10 a.m. PT" ---

    @Test
    fun `Google IO - 10am PT May 19`() {
        val c = fullPipeline(
            "[${chrono("10 a.m. PT", month = 5, day = 19, hour = 10, timezone = -420, dayCertain = true)}]",
            "May 19 at 10 a.m. PT",
        )
        assertEquals(1, c.size)
    }

    // --- Zoom invite: "02:00 PM Eastern Time (US and Canada)" ---

    @Test
    fun `Zoom invite - 2pm Eastern Time`() {
        val c = fullPipeline(
            "[${chrono("02:00 PM", month = 4, day = 10, hour = 14, timezone = -240, dayCertain = true)}]",
            "Apr 10, 2026 02:00 PM Eastern Time (US and Canada)",
        )
        assertEquals(1, c.size)
    }

    // --- Google Calendar: "Wednesday, April 15, 2026 10:00am - 11:00am (Eastern Daylight Time)" ---

    @Test
    fun `Google Calendar - 10am to 11am EDT range`() {
        val json = "[${chrono("10:00am - 11:00am", month = 4, day = 15, hour = 10, timezone = -240, dayCertain = true,
            end = chronoEnd(month = 4, day = 15, hour = 11, timezone = -240))}]"
        val c = fullPipeline(json)
        assertEquals("Range: start + end", 2, c.size)
    }

    // =====================================================================
    // 17. Gaming multi-timezone with ALL ambiguous TZs
    // =====================================================================

    @Test
    fun `gaming showcase - PT ET BST CEST - BST expands`() {
        // "10:00AM PT / 1:00PM ET / 6:00PM BST / 7:00PM CEST"
        val json = """[
            ${chrono("10:00AM PT", hour = 10, timezone = -420, dayCertain = true)},
            ${chrono("1:00PM ET", hour = 13, timezone = -240, dayCertain = true)},
            ${chrono("6:00PM BST", hour = 18, timezone = 60, dayCertain = true)},
            ${chrono("7:00PM CEST", hour = 19, timezone = 120, dayCertain = true)}
        ]"""
        val c = fullPipeline(json)
        // PT(1) + ET(1) + BST(2, ambiguous) + CEST(1) = 5
        assertEquals(5, c.size)
    }

    @Test
    fun `gaming showcase with CST and BST - both expand`() {
        // "6:30 am PT / 9:30 pm CST / 2:30 pm BST"
        val json = """[
            ${chrono("6:30 am PT", hour = 6, minute = 30, timezone = -420, dayCertain = true)},
            ${chrono("9:30 pm CST", hour = 21, minute = 30, timezone = -360, dayCertain = true)},
            ${chrono("2:30 pm BST", hour = 14, minute = 30, timezone = 60, dayCertain = true)}
        ]"""
        val c = fullPipeline(json)
        // PT(1) + CST(2) + BST(2) = 5
        assertEquals(5, c.size)
    }

    @Test
    fun `five timezone gaming announcement with JST`() {
        // "10:30 pm JST / 6:30 am PT / 9:30 am ET / 2:30 pm BST / 3:30 pm CEST"
        val json = """[
            ${chrono("10:30 pm JST", hour = 22, minute = 30, timezone = 540, dayCertain = true)},
            ${chrono("6:30 am PT", hour = 6, minute = 30, timezone = -420, dayCertain = true)},
            ${chrono("9:30 am ET", hour = 9, minute = 30, timezone = -240, dayCertain = true)},
            ${chrono("2:30 pm BST", hour = 14, minute = 30, timezone = 60, dayCertain = true)},
            ${chrono("3:30 pm CEST", hour = 15, minute = 30, timezone = 120, dayCertain = true)}
        ]"""
        val c = fullPipeline(json)
        // JST(1) + PT(1) + ET(1) + BST(2) + CEST(1) = 6
        assertEquals(6, c.size)
    }

    // =====================================================================
    // 18. Sports schedule cross-date with ambiguous TZs
    // =====================================================================

    @Test
    fun `World Cup final - ET BST CET IST AEST JST spanning two dates`() {
        val json = """[
            ${chrono("3:00 PM ET", month = 7, day = 19, hour = 15, timezone = -240, dayCertain = true)},
            ${chrono("8:00 PM BST", month = 7, day = 19, hour = 20, timezone = 60, dayCertain = true)},
            ${chrono("9:00 PM CET", month = 7, day = 19, hour = 21, timezone = 60, dayCertain = true)},
            ${chrono("12:30 AM IST", month = 7, day = 20, hour = 0, minute = 30, timezone = 330, dayCertain = true)},
            ${chrono("5:00 AM AEST", month = 7, day = 20, hour = 5, timezone = 600, dayCertain = true)},
            ${chrono("4:00 AM JST", month = 7, day = 20, hour = 4, timezone = 540, dayCertain = true)}
        ]"""
        val c = fullPipeline(json)
        // ET(1) + BST(2) + CET(1) + IST(2) + AEST(1) + JST(1) = 8
        assertEquals(8, c.size)
    }

    @Test
    fun `match kickoff - 9pm ET with IST next day`() {
        val json = """[
            ${chrono("9:00 PM ET", month = 6, day = 20, hour = 21, timezone = -240, dayCertain = true)},
            ${chrono("6:30 AM IST", month = 6, day = 21, hour = 6, minute = 30, timezone = 330, dayCertain = true)}
        ]"""
        val c = fullPipeline(json)
        // ET(1) + IST(2) = 3
        assertEquals(3, c.size)
    }

    // =====================================================================
    // 19. Edge: ambiguous TZ at midnight / day boundary
    // =====================================================================

    @Test
    fun `CST midnight - US vs China give different Sydney times`() {
        val json = "[${chrono("12:00 AM CST", month = 4, day = 15, hour = 0, timezone = -360, dayCertain = true)}]"
        val c = fullPipeline(json)
        assertEquals(2, c.size)
        // US: midnight UTC-6 = 06:00 UTC = 4pm AEST
        // China: midnight UTC+8 = 16:00 UTC prev day = 2am AEST
        val times = c.map { it.localDateTime }.toSet()
        assertEquals("Midnight CST in US vs China should produce different Sydney times", 2, times.size)
    }

    @Test
    fun `BST midnight - British vs Bangladesh`() {
        val json = "[${chrono("12:00 AM BST", month = 6, day = 7, hour = 0, timezone = 60, dayCertain = true)}]"
        val c = fullPipeline(json)
        assertEquals(2, c.size)
    }

    @Test
    fun `IST 11 59pm - near midnight India vs Ireland`() {
        val json = "[${chrono("11:59 PM IST", hour = 23, minute = 59, timezone = 330)}]"
        val c = fullPipeline(json)
        assertEquals(2, c.size)
    }
}
