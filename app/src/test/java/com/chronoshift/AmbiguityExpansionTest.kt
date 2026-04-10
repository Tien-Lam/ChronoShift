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
    // 16. Real-world full-string tests (verbatim from websites)
    // Each test passes the FULL input string and simulates both Chrono + Gemini.
    // =====================================================================

    // --- Summer Game Fest: "Friday, June 5 2026 2pm PT / 5pm ET / 9pm GMT" ---

    @Test
    fun `Summer Game Fest - 2pm PT 5pm ET 9pm GMT full string`() {
        val input = "Friday, June 5 2026 2pm PT / 5pm ET / 9pm GMT"
        val chronoJson = """[
            ${chrono("2pm PT", month = 6, day = 5, hour = 14, timezone = -420, dayCertain = true)},
            ${chrono("5pm ET", month = 6, day = 5, hour = 17, timezone = -240, dayCertain = true)},
            ${chrono("9pm GMT", month = 6, day = 5, hour = 21, timezone = 0, dayCertain = true)}
        ]"""
        val geminiJson = """[
            ${gemini(time = "14:00", date = "2026-06-05", timezone = "America/Los_Angeles", original = "2pm PT")},
            ${gemini(time = "17:00", date = "2026-06-05", timezone = "America/New_York", original = "5pm ET")},
            ${gemini(time = "21:00", date = "2026-06-05", timezone = "Europe/London", original = "9pm GMT")}
        ]"""
        val c = fullPipeline(chronoJson, input, geminiJson)
        assertEquals("PT + ET + GMT, no ambiguous → 3", 3, c.size)
        // All same instant → same Sydney time
        val sydneyTimes = c.map { it.localDateTime }.toSet()
        assertEquals("All 3 should convert to same Sydney time", 1, sydneyTimes.size)
    }

    // --- Summer Game Fest: "June 03 9:30 pm CST / 6:30 am PT" — CST is ambiguous ---

    @Test
    fun `Summer Game Fest - June 03 9 30 pm CST 6 30 am PT full string`() {
        val input = "June 03 9:30 pm CST / 6:30 am PT"
        val chronoJson = """[
            ${chrono("9:30 pm CST", month = 6, day = 3, hour = 21, minute = 30, timezone = -360, dayCertain = true)},
            ${chrono("6:30 am PT", month = 6, day = 3, hour = 6, minute = 30, timezone = -420, dayCertain = true)}
        ]"""
        val geminiJson = """[
            ${gemini(time = "21:30", date = "2026-06-03", timezone = "America/Chicago", original = "9:30 pm CST")},
            ${gemini(time = "06:30", date = "2026-06-03", timezone = "America/Los_Angeles", original = "6:30 am PT")}
        ]"""
        val c = fullPipeline(chronoJson, input, geminiJson)
        // PT(1) + CST(2, US Central + China) = 3
        assertEquals(3, c.size)
        val cstCards = c.filter { it.originalText.contains("CST") }
        assertEquals("CST should have 2 cards (US + China)", 2, cstCards.size)
        assertTrue("CST cards should have different times",
            cstCards[0].localDateTime != cstCards[1].localDateTime)
    }

    // --- Summer Game Fest: "June 3 2:30 pm BST / 6:30 am PT" — BST is ambiguous ---

    @Test
    fun `Summer Game Fest - June 3 2 30 pm BST 6 30 am PT full string`() {
        val input = "June 3 2:30 pm BST / 6:30 am PT"
        val chronoJson = """[
            ${chrono("2:30 pm BST", month = 6, day = 3, hour = 14, minute = 30, timezone = 60, dayCertain = true)},
            ${chrono("6:30 am PT", month = 6, day = 3, hour = 6, minute = 30, timezone = -420, dayCertain = true)}
        ]"""
        val geminiJson = """[
            ${gemini(time = "14:30", date = "2026-06-03", timezone = "Europe/London", original = "2:30 pm BST")},
            ${gemini(time = "06:30", date = "2026-06-03", timezone = "America/Los_Angeles", original = "6:30 am PT")}
        ]"""
        val c = fullPipeline(chronoJson, input, geminiJson)
        assertEquals("PT(1) + BST(2, British + Bangladesh) = 3", 3, c.size)
    }

    // --- Summer Game Fest cross-midnight: "June 7 12:00 am BST / June 6 4:00 pm PT" ---

    @Test
    fun `Summer Game Fest - midnight BST vs 4pm PT cross-day full string`() {
        val input = "June 7 12:00 am BST / June 6 4:00 pm PT"
        val chronoJson = """[
            ${chrono("12:00 am BST", month = 6, day = 7, hour = 0, timezone = 60, dayCertain = true)},
            ${chrono("4:00 pm PT", month = 6, day = 6, hour = 16, timezone = -420, dayCertain = true)}
        ]"""
        val geminiJson = """[
            ${gemini(time = "00:00", date = "2026-06-07", timezone = "Europe/London", original = "12:00 am BST")},
            ${gemini(time = "16:00", date = "2026-06-06", timezone = "America/Los_Angeles", original = "4:00 pm PT")}
        ]"""
        val c = fullPipeline(chronoJson, input, geminiJson)
        // PT(1) + BST midnight(2) = 3
        assertEquals(3, c.size)
    }

    // --- World Cup: "3:00 PM ET on Sunday July 19, 2026 / 8:00 PM BST / 12:30 AM IST on July 20" ---

    @Test
    fun `World Cup - 3pm ET 8pm BST 12 30am IST full string`() {
        val input = "3:00 PM ET on Sunday July 19, 2026 / 8:00 PM BST in the UK / 12:30 AM IST on July 20 in India"
        val chronoJson = """[
            ${chrono("3:00 PM ET", month = 7, day = 19, hour = 15, timezone = -240, dayCertain = true)},
            ${chrono("8:00 PM BST", month = 7, day = 19, hour = 20, timezone = 60, dayCertain = true)},
            ${chrono("12:30 AM IST", month = 7, day = 20, hour = 0, minute = 30, timezone = 330, dayCertain = true)}
        ]"""
        val geminiJson = """[
            ${gemini(time = "15:00", date = "2026-07-19", timezone = "America/New_York", original = "3:00 PM ET")},
            ${gemini(time = "20:00", date = "2026-07-19", timezone = "Europe/London", original = "8:00 PM BST")},
            ${gemini(time = "00:30", date = "2026-07-20", timezone = "Asia/Kolkata", original = "12:30 AM IST")}
        ]"""
        val c = fullPipeline(chronoJson, input, geminiJson)
        // ET(1) + BST(2) + IST(2) = 5
        assertEquals(5, c.size)
        val bstCards = c.filter { it.originalText.contains("BST") }
        val istCards = c.filter { it.originalText.contains("IST") }
        assertEquals("BST: British + Bangladesh", 2, bstCards.size)
        assertEquals("IST: India + Ireland", 2, istCards.size)
    }

    @Test
    fun `World Cup - 5am AEST 4am JST next day unambiguous full string`() {
        val input = "5:00 AM AEST on July 20 in Australia / 4:00 AM JST on July 20 in Japan"
        val chronoJson = """[
            ${chrono("5:00 AM AEST", month = 7, day = 20, hour = 5, timezone = 600, dayCertain = true)},
            ${chrono("4:00 AM JST", month = 7, day = 20, hour = 4, timezone = 540, dayCertain = true)}
        ]"""
        val geminiJson = """[
            ${gemini(time = "05:00", date = "2026-07-20", timezone = "Australia/Sydney", original = "5:00 AM AEST")},
            ${gemini(time = "04:00", date = "2026-07-20", timezone = "Asia/Tokyo", original = "4:00 AM JST")}
        ]"""
        val c = fullPipeline(chronoJson, input, geminiJson)
        assertEquals("AEST + JST both unambiguous", 2, c.size)
    }

    // --- Apple WWDC: "June 8 at 10:00 a.m. Pacific Time" ---

    @Test
    fun `Apple WWDC - June 8 at 10 am Pacific Time full string`() {
        val input = "June 8 at 10:00 a.m. Pacific Time"
        val chronoJson = "[${chrono("10:00 a.m.", month = 6, day = 8, hour = 10, timezone = -420, dayCertain = true)}]"
        val geminiJson = "[${gemini(time = "10:00", date = "2026-06-08", timezone = "America/Los_Angeles", original = "10:00 a.m. Pacific Time")}]"
        val c = fullPipeline(chronoJson, input, geminiJson)
        assertEquals(1, c.size)
        assertTrue("Source should show Los Angeles", c[0].sourceTimezone.contains("Los Angeles"))
    }

    // --- NVIDIA GTC: "Monday, March 16, 11:00 a.m. PT" ---

    @Test
    fun `NVIDIA GTC - Monday March 16 11 am PT full string`() {
        val input = "Monday, March 16, 11:00 a.m. PT"
        val chronoJson = "[${chrono("11:00 a.m. PT", month = 3, day = 16, hour = 11, timezone = -420, dayCertain = true)}]"
        val geminiJson = "[${gemini(time = "11:00", date = "2026-03-16", timezone = "America/Los_Angeles", original = "11:00 a.m. PT")}]"
        val c = fullPipeline(chronoJson, input, geminiJson)
        assertEquals(1, c.size)
    }

    // --- Eventbrite: "Sat, Apr 25 • 12:00 AM CDT" ---

    @Test
    fun `Eventbrite - Sat Apr 25 12 00 AM CDT full string`() {
        val input = "Sat, Apr 25 • 12:00 AM CDT"
        val chronoJson = "[${chrono("12:00 AM CDT", month = 4, day = 25, hour = 0, timezone = -300, dayCertain = true)}]"
        val geminiJson = "[${gemini(time = "00:00", date = "2026-04-25", timezone = "America/Chicago", original = "12:00 AM CDT")}]"
        val c = fullPipeline(chronoJson, input, geminiJson)
        assertEquals("CDT is unambiguous", 1, c.size)
    }

    // --- Meetup: "Sat, Apr 11 · 10:00 AM AEST" ---

    @Test
    fun `Meetup - Sat Apr 11 10 00 AM AEST full string`() {
        val input = "Sat, Apr 11 · 10:00 AM AEST"
        val chronoJson = "[${chrono("10:00 AM AEST", month = 4, day = 11, hour = 10, timezone = 600, dayCertain = true)}]"
        val geminiJson = "[${gemini(time = "10:00", date = "2026-04-11", timezone = "Australia/Sydney", original = "10:00 AM AEST")}]"
        val c = fullPipeline(chronoJson, input, geminiJson)
        assertEquals(1, c.size)
    }

    // --- Nintendo Direct: "Feb 5 at 6am PT/9am ET" ---

    @Test
    fun `Nintendo Direct - Feb 5 at 6am PT 9am ET full string`() {
        // February → PST (-480) and EST (-300), not PDT/EDT
        val input = "Feb 5 at 6am PT/9am ET"
        val chronoJson = """[
            ${chrono("6am PT", month = 2, day = 5, hour = 6, timezone = -480, dayCertain = true)},
            ${chrono("9am ET", month = 2, day = 5, hour = 9, timezone = -300, dayCertain = true)}
        ]"""
        val geminiJson = """[
            ${gemini(time = "06:00", date = "2026-02-05", timezone = "America/Los_Angeles", original = "6am PT")},
            ${gemini(time = "09:00", date = "2026-02-05", timezone = "America/New_York", original = "9am ET")}
        ]"""
        val c = fullPipeline(chronoJson, input, geminiJson)
        assertEquals(2, c.size)
        // Both should be same instant → same Sydney time
        val sydneyTimes = c.map { it.localDateTime }.toSet()
        assertEquals("PT and ET should convert to same Sydney time", 1, sydneyTimes.size)
    }

    // --- Festival of Rail: "Thursday February 5th from 18:00 UTC" ---

    @Test
    fun `Festival of Rail - Thursday February 5th from 18 00 UTC full string`() {
        val input = "Thursday February 5th from 18:00 UTC"
        val chronoJson = "[${chrono("18:00 UTC", month = 2, day = 5, hour = 18, timezone = 0, dayCertain = true)}]"
        val geminiJson = "[${gemini(time = "18:00", date = "2026-02-05", timezone = "UTC", original = "18:00 UTC")}]"
        val c = fullPipeline(chronoJson, input, geminiJson)
        assertEquals(1, c.size)
    }

    // --- Zoom: "Apr 10, 2026 02:00 PM Eastern Time (US and Canada)" ---

    @Test
    fun `Zoom invite - Apr 10 2026 02 00 PM Eastern Time full string`() {
        val input = "Apr 10, 2026 02:00 PM Eastern Time (US and Canada)"
        val chronoJson = "[${chrono("02:00 PM", month = 4, day = 10, hour = 14, timezone = -240, dayCertain = true)}]"
        val geminiJson = "[${gemini(time = "14:00", date = "2026-04-10", timezone = "America/New_York", original = "02:00 PM Eastern Time")}]"
        val c = fullPipeline(chronoJson, input, geminiJson)
        assertEquals(1, c.size)
        assertTrue("Source tz should show New York", c[0].sourceTimezone.contains("New York"))
    }

    // --- Google Calendar: "Wednesday, April 15, 2026 10:00am - 11:00am (Eastern Daylight Time)" ---

    @Test
    fun `Google Calendar - April 15 10am to 11am EDT full string`() {
        val input = "Wednesday, April 15, 2026 10:00am - 11:00am (Eastern Daylight Time)"
        val chronoJson = "[${chrono("10:00am - 11:00am", month = 4, day = 15, hour = 10, timezone = -240, dayCertain = true,
            end = chronoEnd(month = 4, day = 15, hour = 11, timezone = -240))}]"
        val geminiJson = "[${gemini(time = "10:00", date = "2026-04-15", timezone = "America/New_York", original = "10:00am Eastern Daylight Time")}]"
        val c = fullPipeline(chronoJson, input, geminiJson)
        assertEquals("Range: start + end", 2, c.size)
    }

    // =====================================================================
    // 17. Gaming multi-timezone with ALL ambiguous TZs (full strings)
    // =====================================================================

    @Test
    fun `gaming showcase - 10AM PT 1PM ET 6PM BST 7PM CEST full string`() {
        val input = "10:00AM PT / 1:00PM ET / 6:00PM BST / 7:00PM CEST"
        val chronoJson = """[
            ${chrono("10:00AM PT", hour = 10, timezone = -420, dayCertain = true)},
            ${chrono("1:00PM ET", hour = 13, timezone = -240, dayCertain = true)},
            ${chrono("6:00PM BST", hour = 18, timezone = 60, dayCertain = true)},
            ${chrono("7:00PM CEST", hour = 19, timezone = 120, dayCertain = true)}
        ]"""
        val geminiJson = """[
            ${gemini(time = "10:00", timezone = "America/Los_Angeles", original = "10:00AM PT")},
            ${gemini(time = "13:00", timezone = "America/New_York", original = "1:00PM ET")},
            ${gemini(time = "18:00", timezone = "Europe/London", original = "6:00PM BST")},
            ${gemini(time = "19:00", timezone = "Europe/Berlin", original = "7:00PM CEST")}
        ]"""
        val c = fullPipeline(chronoJson, input, geminiJson)
        // PT(1) + ET(1) + BST(2, British+Bangladesh) + CEST(1) = 5
        assertEquals(5, c.size)
        val bstCards = c.filter { it.originalText.contains("BST") }
        assertEquals("BST expands to 2", 2, bstCards.size)
    }

    @Test
    fun `gaming showcase - 6 30am PT 9 30pm CST 2 30pm BST full string`() {
        val input = "6:30 am PT / 9:30 pm CST / 2:30 pm BST"
        val chronoJson = """[
            ${chrono("6:30 am PT", hour = 6, minute = 30, timezone = -420, dayCertain = true)},
            ${chrono("9:30 pm CST", hour = 21, minute = 30, timezone = -360, dayCertain = true)},
            ${chrono("2:30 pm BST", hour = 14, minute = 30, timezone = 60, dayCertain = true)}
        ]"""
        val geminiJson = """[
            ${gemini(time = "06:30", timezone = "America/Los_Angeles", original = "6:30 am PT")},
            ${gemini(time = "21:30", timezone = "America/Chicago", original = "9:30 pm CST")},
            ${gemini(time = "14:30", timezone = "Europe/London", original = "2:30 pm BST")}
        ]"""
        val c = fullPipeline(chronoJson, input, geminiJson)
        // PT(1) + CST(2) + BST(2) = 5
        assertEquals(5, c.size)
    }

    @Test
    fun `five timezone announcement full string`() {
        val input = "10:30 pm JST / 6:30 am PT / 9:30 am ET / 2:30 pm BST / 3:30 pm CEST"
        val chronoJson = """[
            ${chrono("10:30 pm JST", hour = 22, minute = 30, timezone = 540, dayCertain = true)},
            ${chrono("6:30 am PT", hour = 6, minute = 30, timezone = -420, dayCertain = true)},
            ${chrono("9:30 am ET", hour = 9, minute = 30, timezone = -240, dayCertain = true)},
            ${chrono("2:30 pm BST", hour = 14, minute = 30, timezone = 60, dayCertain = true)},
            ${chrono("3:30 pm CEST", hour = 15, minute = 30, timezone = 120, dayCertain = true)}
        ]"""
        val geminiJson = """[
            ${gemini(time = "22:30", timezone = "Asia/Tokyo", original = "10:30 pm JST")},
            ${gemini(time = "06:30", timezone = "America/Los_Angeles", original = "6:30 am PT")},
            ${gemini(time = "09:30", timezone = "America/New_York", original = "9:30 am ET")},
            ${gemini(time = "14:30", timezone = "Europe/London", original = "2:30 pm BST")},
            ${gemini(time = "15:30", timezone = "Europe/Berlin", original = "3:30 pm CEST")}
        ]"""
        val c = fullPipeline(chronoJson, input, geminiJson)
        // JST(1) + PT(1) + ET(1) + BST(2) + CEST(1) = 6
        assertEquals(6, c.size)
    }

    // =====================================================================
    // 18. Sports cross-date with ambiguous TZs (full strings)
    // =====================================================================

    @Test
    fun `World Cup final six timezones full string`() {
        val input = "3:00 PM ET / 8:00 PM BST / 9:00 PM CET / 12:30 AM IST Jul 20 / 5:00 AM AEST Jul 20 / 4:00 AM JST Jul 20"
        val chronoJson = """[
            ${chrono("3:00 PM ET", month = 7, day = 19, hour = 15, timezone = -240, dayCertain = true)},
            ${chrono("8:00 PM BST", month = 7, day = 19, hour = 20, timezone = 60, dayCertain = true)},
            ${chrono("9:00 PM CET", month = 7, day = 19, hour = 21, timezone = 60, dayCertain = true)},
            ${chrono("12:30 AM IST", month = 7, day = 20, hour = 0, minute = 30, timezone = 330, dayCertain = true)},
            ${chrono("5:00 AM AEST", month = 7, day = 20, hour = 5, timezone = 600, dayCertain = true)},
            ${chrono("4:00 AM JST", month = 7, day = 20, hour = 4, timezone = 540, dayCertain = true)}
        ]"""
        val geminiJson = """[
            ${gemini(time = "15:00", date = "2026-07-19", timezone = "America/New_York", original = "3:00 PM ET")},
            ${gemini(time = "20:00", date = "2026-07-19", timezone = "Europe/London", original = "8:00 PM BST")},
            ${gemini(time = "21:00", date = "2026-07-19", timezone = "Europe/Paris", original = "9:00 PM CET")},
            ${gemini(time = "00:30", date = "2026-07-20", timezone = "Asia/Kolkata", original = "12:30 AM IST")},
            ${gemini(time = "05:00", date = "2026-07-20", timezone = "Australia/Sydney", original = "5:00 AM AEST")},
            ${gemini(time = "04:00", date = "2026-07-20", timezone = "Asia/Tokyo", original = "4:00 AM JST")}
        ]"""
        val c = fullPipeline(chronoJson, input, geminiJson)
        // ET(1) + BST(2) + CET(1) + IST(2) + AEST(1) + JST(1) = 8
        assertEquals(8, c.size)
    }

    @Test
    fun `match kickoff 9pm ET 6 30am IST next day full string`() {
        val input = "9:00 PM ET Jun 20 / 6:30 AM IST Jun 21"
        val chronoJson = """[
            ${chrono("9:00 PM ET", month = 6, day = 20, hour = 21, timezone = -240, dayCertain = true)},
            ${chrono("6:30 AM IST", month = 6, day = 21, hour = 6, minute = 30, timezone = 330, dayCertain = true)}
        ]"""
        val geminiJson = """[
            ${gemini(time = "21:00", date = "2026-06-20", timezone = "America/New_York", original = "9:00 PM ET")},
            ${gemini(time = "06:30", date = "2026-06-21", timezone = "Asia/Kolkata", original = "6:30 AM IST")}
        ]"""
        val c = fullPipeline(chronoJson, input, geminiJson)
        // ET(1) + IST(2) = 3
        assertEquals(3, c.size)
    }

    // =====================================================================
    // 19. Edge: ambiguous TZ at midnight / day boundary (full strings)
    // =====================================================================

    @Test
    fun `CST midnight - US vs China give different Sydney times`() {
        val input = "The server maintenance window is 12:00 AM CST"
        val chronoJson = "[${chrono("12:00 AM CST", month = 4, day = 15, hour = 0, timezone = -360, dayCertain = true)}]"
        val geminiJson = "[${gemini(time = "00:00", date = "2026-04-15", timezone = "America/Chicago", original = "12:00 AM CST")}]"
        val c = fullPipeline(chronoJson, input, geminiJson)
        assertEquals(2, c.size)
        val times = c.map { it.localDateTime }.toSet()
        assertEquals("Midnight CST in US vs China should produce different Sydney times", 2, times.size)
    }

    @Test
    fun `BST midnight - British vs Bangladesh full string`() {
        val input = "Release window: 12:00 am BST Saturday"
        val chronoJson = "[${chrono("12:00 am BST", month = 6, day = 7, hour = 0, timezone = 60, dayCertain = true)}]"
        val geminiJson = "[${gemini(time = "00:00", date = "2026-06-07", timezone = "Europe/London", original = "12:00 am BST")}]"
        val c = fullPipeline(chronoJson, input, geminiJson)
        assertEquals(2, c.size)
    }

    @Test
    fun `IST 11 59pm near midnight full string`() {
        val input = "Submit your report by 11:59 PM IST"
        val chronoJson = "[${chrono("11:59 PM IST", hour = 23, minute = 59, timezone = 330)}]"
        val geminiJson = "[${gemini(time = "23:59", timezone = "Asia/Kolkata", original = "11:59 PM IST")}]"
        val c = fullPipeline(chronoJson, input, geminiJson)
        assertEquals(2, c.size)
    }
}
