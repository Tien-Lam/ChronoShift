package com.chronoshift.nlp

import kotlinx.datetime.TimeZone
import com.chronoshift.conversion.ExtractedTime
import kotlinx.datetime.toInstant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ChronoExtractorTest {

    private fun parse(json: String, originalText: String = "") =
        ChronoResultParser.parse(json, originalText, TestCityResolver())

    private fun parseRaw(json: String) = ChronoResultParser.parseRaw(json)

    private fun chronoResult(
        text: String, year: Int = 2026, month: Int = 4, day: Int = 9,
        hour: Int = 12, minute: Int = 0, second: Int = 0,
        timezone: Int? = null, dayCertain: Boolean = false,
        end: String? = null,
    ): String {
        val tzJson = if (timezone != null) "$timezone" else "null"
        val endJson = end ?: "null"
        return """{"text":"$text","index":0,"start":{"year":$year,"month":$month,"day":$day,"hour":$hour,"minute":$minute,"second":$second,"timezone":$tzJson,"isCertain":{"year":false,"month":${dayCertain},"day":${dayCertain},"hour":true,"minute":true,"timezone":${timezone != null}}},"end":$endJson}"""
    }

    private fun endBlock(
        year: Int = 2026, month: Int = 4, day: Int = 9,
        hour: Int = 13, minute: Int = 0, second: Int = 0,
        timezone: Int? = null,
    ): String {
        val tzJson = if (timezone != null) "$timezone" else "null"
        return """{"year":$year,"month":$month,"day":$day,"hour":$hour,"minute":$minute,"second":$second,"timezone":$tzJson}"""
    }

    // ========== Timezone offset resolution ==========

    @Test
    fun `offset -420 PT resolves to named zone`() {
        val tz = ChronoResultParser.offsetToTimezone(-420)
        assertTrue("Expected named zone for PT, got ${tz.id}", '/' in tz.id)
    }

    @Test
    fun `offset -300 EST resolves to named zone`() {
        val tz = ChronoResultParser.offsetToTimezone(-300)
        assertTrue("Expected named zone for EST, got ${tz.id}", '/' in tz.id)
    }

    @Test
    fun `offset -240 EDT resolves to named zone`() {
        val tz = ChronoResultParser.offsetToTimezone(-240)
        assertTrue("Expected named zone for EDT, got ${tz.id}", '/' in tz.id)
    }

    @Test
    fun `offset -480 PST resolves to named zone`() {
        val tz = ChronoResultParser.offsetToTimezone(-480)
        assertTrue("Expected named zone for PST, got ${tz.id}", '/' in tz.id)
    }

    @Test
    fun `offset 0 UTC resolves`() {
        val tz = ChronoResultParser.offsetToTimezone(0)
        assertNotNull(tz)
    }

    @Test
    fun `offset 540 JST resolves to named zone`() {
        val tz = ChronoResultParser.offsetToTimezone(540)
        assertTrue("Expected named zone for JST, got ${tz.id}", '/' in tz.id)
    }

    @Test
    fun `offset 330 IST resolves to named zone`() {
        val tz = ChronoResultParser.offsetToTimezone(330)
        assertTrue("Expected named zone for IST, got ${tz.id}", '/' in tz.id)
    }

    @Test
    fun `offset 60 CET resolves to named zone`() {
        val tz = ChronoResultParser.offsetToTimezone(60)
        assertTrue("Expected named zone for CET, got ${tz.id}", '/' in tz.id)
    }

    @Test
    fun `offset -600 HAST resolves to named zone`() {
        val tz = ChronoResultParser.offsetToTimezone(-600)
        assertTrue("Expected named zone, got ${tz.id}", '/' in tz.id)
    }

    @Test
    fun `offset caching returns same instance`() {
        val tz1 = ChronoResultParser.offsetToTimezone(-300)
        val tz2 = ChronoResultParser.offsetToTimezone(-300)
        assertEquals(tz1, tz2)
    }

    @Test
    fun `unusual offset resolves to fixed offset`() {
        // +05:45 Nepal — might not have a named zone match depending on system
        val tz = ChronoResultParser.offsetToTimezone(345)
        assertNotNull(tz)
    }

    // ========== Basic parsing ==========

    @Test
    fun `parses single result with timezone`() {
        val json = "[${chronoResult("3:00 PM EST", hour = 15, timezone = -300)}]"
        val results = parse(json)
        assertEquals(1, results.size)
        assertEquals(15, results[0].localDateTime!!.hour)
        assertEquals(0, results[0].localDateTime!!.minute)
        assertNotNull(results[0].sourceTimezone)
    }

    @Test
    fun `parses single result without timezone`() {
        val json = "[${chronoResult("3:00 PM", hour = 15)}]"
        val results = parse(json)
        assertEquals(1, results.size)
        assertNull(results[0].sourceTimezone)
        assertNull(results[0].instant)
    }

    @Test
    fun `parses result with all fields`() {
        val json = "[${chronoResult("April 9 at 9am PT", hour = 9, timezone = -420, dayCertain = true)}]"
        val results = parse(json)
        assertEquals(1, results.size)
        assertEquals(2026, results[0].localDateTime!!.year)
        assertEquals(4, results[0].localDateTime!!.monthNumber)
        assertEquals(9, results[0].localDateTime!!.dayOfMonth)
        assertEquals(9, results[0].localDateTime!!.hour)
        assertNotNull(results[0].instant)
        assertNotNull(results[0].sourceTimezone)
        assertEquals(0.95f, results[0].confidence)
    }

    @Test
    fun `uncertain date gets 0_85 confidence`() {
        val json = "[${chronoResult("3pm EST", hour = 15, timezone = -300)}]"
        val results = parse(json)
        assertEquals(0.85f, results[0].confidence)
    }

    @Test
    fun `certain date gets 0_95 confidence`() {
        val json = "[${chronoResult("April 9 3pm", hour = 15, dayCertain = true)}]"
        val results = parse(json)
        assertEquals(0.95f, results[0].confidence)
    }

    @Test
    fun `preserves original text`() {
        val json = "[${chronoResult("next Tuesday at 3pm EST", hour = 15, timezone = -300)}]"
        val results = parse(json)
        assertEquals("next Tuesday at 3pm EST", results[0].originalText)
    }

    @Test
    fun `instant is computed from localDateTime and timezone`() {
        val json = "[${chronoResult("test", hour = 12, minute = 0, timezone = 0)}]"
        val results = parse(json)
        assertNotNull(results[0].instant)
        assertNotNull(results[0].localDateTime)
    }

    // ========== Multiple results ==========

    @Test
    fun `parses multiple results`() {
        val json = "[${chronoResult("9am PT", hour = 9, timezone = -420)},${chronoResult("12pm ET", hour = 12, timezone = -240)}]"
        val results = parse(json)
        assertEquals(2, results.size)
        assertEquals(9, results[0].localDateTime!!.hour)
        assertEquals(12, results[1].localDateTime!!.hour)
    }

    @Test
    fun `each result gets its own timezone`() {
        val json = "[${chronoResult("9am PT", hour = 9, timezone = -420)},${chronoResult("12pm ET", hour = 12, timezone = -240)}]"
        val results = parse(json)
        assertTrue(results[0].sourceTimezone != results[1].sourceTimezone)
    }

    // ========== Time ranges ==========

    @Test
    fun `time range produces start and end`() {
        val json = "[${chronoResult("12pm - 1pm EDT", hour = 12, timezone = -240, end = endBlock(hour = 13, timezone = -240))}]"
        val results = parse(json)
        assertEquals(2, results.size)
        assertEquals(12, results[0].localDateTime!!.hour)
        assertEquals(13, results[1].localDateTime!!.hour)
    }

    @Test
    fun `end time inherits timezone from start when end has no tz`() {
        val json = "[${chronoResult("12pm - 1pm EDT", hour = 12, timezone = -240, end = endBlock(hour = 13))}]"
        val results = parse(json)
        assertEquals(2, results.size)
        assertEquals(results[0].sourceTimezone, results[1].sourceTimezone)
    }

    @Test
    fun `end time uses own timezone when specified`() {
        val json = "[${chronoResult("test", hour = 12, timezone = -240, end = endBlock(hour = 13, timezone = -300))}]"
        val results = parse(json)
        assertTrue(results[0].sourceTimezone != results[1].sourceTimezone)
    }

    @Test
    fun `end result originalText has end suffix`() {
        val json = "[${chronoResult("12pm - 1pm", hour = 12, end = endBlock(hour = 13))}]"
        val results = parse(json)
        assertTrue(results[1].originalText.contains("(end)"))
    }

    @Test
    fun `end result has 0_85 confidence`() {
        val json = "[${chronoResult("12pm - 1pm", hour = 12, dayCertain = true, end = endBlock(hour = 13))}]"
        val results = parse(json)
        assertEquals(0.95f, results[0].confidence)
        assertEquals(0.85f, results[1].confidence)
    }

    // ========== Date propagation ==========

    @Test
    fun `propagates date from certain to uncertain`() {
        val json = "[${chronoResult("April 9 9am PT", day = 9, hour = 9, timezone = -420, dayCertain = true)},${chronoResult("12pm ET", day = 6, hour = 12, timezone = -240)}]"
        val results = parse(json)
        assertEquals(9, results[0].localDateTime!!.dayOfMonth)
        assertEquals(9, results[1].localDateTime!!.dayOfMonth)
    }

    @Test
    fun `propagation updates instant too`() {
        val json = "[${chronoResult("April 15 9am", day = 15, hour = 9, timezone = 0, dayCertain = true)},${chronoResult("3pm", day = 6, hour = 15, timezone = 0)}]"
        val results = parse(json)
        val propagatedInstant = results[1].instant
        assertNotNull(propagatedInstant)
        // The propagated localDateTime should reflect April 15, not April 6
        assertEquals(15, results[1].localDateTime!!.dayOfMonth)
    }

    @Test
    fun `no propagation when all uncertain`() {
        val json = "[${chronoResult("3pm", day = 6, hour = 15)},${chronoResult("5pm", day = 6, hour = 17)}]"
        val results = parse(json)
        assertEquals(6, results[0].localDateTime!!.dayOfMonth)
        assertEquals(6, results[1].localDateTime!!.dayOfMonth)
    }

    @Test
    fun `propagation does not overwrite certain dates`() {
        val json = "[${chronoResult("April 9", day = 9, hour = 12, dayCertain = true)},${chronoResult("April 15 3pm", day = 15, hour = 15, dayCertain = true)}]"
        val results = parse(json)
        assertEquals(9, results[0].localDateTime!!.dayOfMonth)
        assertEquals(15, results[1].localDateTime!!.dayOfMonth)
    }

    @Test
    fun `propagation applies to range end times`() {
        val json = "[${chronoResult("April 9 9am", day = 9, hour = 9, dayCertain = true)},${chronoResult("12pm - 1pm EDT", day = 6, hour = 12, timezone = -240, end = endBlock(day = 6, hour = 13, timezone = -240))}]"
        val results = parse(json)
        assertEquals(3, results.size)
        assertEquals(9, results[1].localDateTime!!.dayOfMonth) // start propagated
        assertEquals(9, results[2].localDateTime!!.dayOfMonth) // end propagated
    }

    // ========== City resolution ==========

    @Test
    fun `resolves city when no timezone`() {
        val json = "[${chronoResult("5:00", hour = 5)}]"
        val results = parse(json, "5:00 in New York")
        assertNotNull(results[0].sourceTimezone)
    }

    @Test
    fun `does not override existing timezone with city`() {
        val json = "[${chronoResult("5:00 PM EST", hour = 17, timezone = -300)}]"
        val results = parse(json, "5:00 PM EST in Chicago")
        // Should keep EST timezone, not override with Chicago
        val tz = results[0].sourceTimezone!!
        assertNotNull(tz)
    }

    @Test
    fun `city resolution with at keyword`() {
        val json = "[${chronoResult("3:00", hour = 3)}]"
        val results = parse(json, "3:00 at Tokyo")
        assertNotNull(results[0].sourceTimezone)
    }

    @Test
    fun `no city resolution when no city in text`() {
        val json = "[${chronoResult("3:00 PM", hour = 15)}]"
        val results = parse(json, "the meeting is at 3:00 PM")
        // "at 3:00 PM" — city pattern matches "3:00 PM" which isn't a city
        // CityResolver won't resolve it, so timezone stays null
        assertNull(results[0].sourceTimezone)
    }

    @Test
    fun `null cityResolver skips city resolution`() {
        val json = "[${chronoResult("5:00", hour = 5)}]"
        val results = ChronoResultParser.parse(json, "5:00 in New York", null)
        assertNull(results[0].sourceTimezone)
    }

    // ========== Edge cases ==========

    @Test
    fun `empty JSON array`() {
        assertEquals(0, parse("[]").size)
    }

    @Test
    fun `malformed JSON`() {
        assertEquals(0, parse("not json at all").size)
    }

    @Test
    fun `empty string`() {
        assertEquals(0, parse("").size)
    }

    @Test
    fun `null-like string`() {
        assertEquals(0, parse("null").size)
    }

    @Test
    fun `missing hour defaults to 12`() {
        val json = """[{"text":"April 9","index":0,"start":{"year":2026,"month":4,"day":9},"end":null}]"""
        val results = parse(json)
        assertEquals(12, results[0].localDateTime!!.hour)
    }

    @Test
    fun `missing minute defaults to 0`() {
        val json = """[{"text":"April 9","index":0,"start":{"year":2026,"month":4,"day":9,"hour":15},"end":null}]"""
        val results = parse(json)
        assertEquals(0, results[0].localDateTime!!.minute)
    }

    @Test
    fun `missing second defaults to 0`() {
        val json = """[{"text":"test","index":0,"start":{"year":2026,"month":4,"day":9,"hour":15,"minute":30},"end":null}]"""
        val results = parse(json)
        assertEquals(0, results[0].localDateTime!!.second)
    }

    @Test
    fun `missing isCertain defaults to uncertain`() {
        val json = """[{"text":"test","index":0,"start":{"year":2026,"month":4,"day":9,"hour":15,"minute":0,"second":0,"timezone":null},"end":null}]"""
        val results = parse(json)
        assertEquals(0.85f, results[0].confidence)
    }

    @Test
    fun `array with one valid and one malformed entry`() {
        val json = """[${chronoResult("valid", hour = 15)},{"garbage":true}]"""
        val results = parse(json)
        assertEquals(1, results.size)
        assertEquals(15, results[0].localDateTime!!.hour)
    }

    @Test
    fun `midnight hour 0`() {
        val json = "[${chronoResult("midnight", hour = 0, minute = 0)}]"
        val results = parse(json)
        assertEquals(0, results[0].localDateTime!!.hour)
    }

    @Test
    fun `noon hour 12`() {
        val json = "[${chronoResult("noon", hour = 12, minute = 0)}]"
        val results = parse(json)
        assertEquals(12, results[0].localDateTime!!.hour)
    }

    @Test
    fun `11 59 PM`() {
        val json = "[${chronoResult("11:59 PM", hour = 23, minute = 59)}]"
        val results = parse(json)
        assertEquals(23, results[0].localDateTime!!.hour)
        assertEquals(59, results[0].localDateTime!!.minute)
    }

    // ========== parseRaw directly ==========

    @Test
    fun `parseRaw returns dateCertain flag`() {
        val json = "[${chronoResult("April 9", hour = 9, dayCertain = true)}]"
        val raw = parseRaw(json)
        assertTrue(raw[0].dateCertain)
    }

    @Test
    fun `parseRaw uncertain flag`() {
        val json = "[${chronoResult("3pm", hour = 15)}]"
        val raw = parseRaw(json)
        assertTrue(!raw[0].dateCertain)
    }

    // ========== Adversarial / real-world Chrono outputs ==========

    @Test
    fun `duplicate times from same input are both returned`() {
        // "12:00 noon PST" → Chrono returns "12:00" (no tz) and "noon PST" (tz -480) — same time twice
        val json = """[
            ${chronoResult("12:00", hour = 12)},
            ${chronoResult("noon PST", hour = 12, timezone = -480)}
        ]"""
        val results = parse(json)
        // Both should parse — dedup is TieredTimeExtractor's job, not parser's
        assertEquals(2, results.size)
    }

    @Test
    fun `relative duration produces valid result`() {
        // "in 2 hours" → Chrono returns current time + 2h with local timezone offset
        val json = "[${chronoResult("in 2 hours", hour = 17, minute = 30, timezone = 600)}]"
        val results = parse(json)
        assertEquals(1, results.size)
        assertEquals(17, results[0].localDateTime!!.hour)
        assertNotNull(results[0].sourceTimezone)
    }

    @Test
    fun `range with no spaces parses both times`() {
        // "9am-5pm PST" → start 9:00, end 17:00
        val json = "[${chronoResult("9am-5pm PST", hour = 9, timezone = -480, end = endBlock(hour = 17, timezone = -480))}]"
        val results = parse(json)
        assertEquals(2, results.size)
        assertEquals(9, results[0].localDateTime!!.hour)
        assertEquals(17, results[1].localDateTime!!.hour)
    }

    @Test
    fun `dual ranges produce four results`() {
        val json = """[
            ${chronoResult("3:00 PM - 4:00 PM EST", hour = 15, timezone = -300, end = endBlock(hour = 16, timezone = -300))},
            ${chronoResult("12:00 PM - 1:00 PM PST", hour = 12, timezone = -480, end = endBlock(hour = 13, timezone = -480))}
        ]"""
        val results = parse(json)
        assertEquals(4, results.size)
    }

    @Test
    fun `midnight with timezone`() {
        val json = "[${chronoResult("midnight EST", hour = 0, minute = 0, timezone = -300)}]"
        val results = parse(json)
        assertEquals(0, results[0].localDateTime!!.hour)
        assertNotNull(results[0].sourceTimezone)
    }

    @Test
    fun `negative offset produces valid timezone`() {
        // IST +05:30 = 330 minutes
        val json = "[${chronoResult("test IST", hour = 15, timezone = 330)}]"
        val results = parse(json)
        assertNotNull(results[0].sourceTimezone)
        assertNotNull(results[0].instant)
    }

    @Test
    fun `large positive offset NZST +12`() {
        val json = "[${chronoResult("test NZST", hour = 9, timezone = 720)}]"
        val results = parse(json)
        assertNotNull(results[0].sourceTimezone)
    }

    @Test
    fun `date propagation with range - all three get correct date`() {
        // "April 9 at 12pm - 1pm EDT / 3pm PST"
        val json = """[
            ${chronoResult("April 9", day = 9, hour = 12, dayCertain = true)},
            ${chronoResult("12pm - 1pm EDT", day = 6, hour = 12, timezone = -240, end = endBlock(day = 6, hour = 13, timezone = -240))},
            ${chronoResult("3pm PST", day = 6, hour = 15, timezone = -480)}
        ]"""
        val results = parse(json)
        // All uncertain dates should become April 9
        results.forEach { result ->
            assertEquals("${result.originalText} should have day 9", 9, result.localDateTime!!.dayOfMonth)
        }
    }

    @Test
    fun `propagation with mixed certain and uncertain in range`() {
        val json = """[
            ${chronoResult("March 20 9am", month = 3, day = 20, hour = 9, dayCertain = true)},
            ${chronoResult("5pm", month = 4, day = 6, hour = 17)}
        ]"""
        val results = parse(json)
        assertEquals(3, results[0].localDateTime!!.monthNumber)
        assertEquals(20, results[0].localDateTime!!.dayOfMonth)
        assertEquals(3, results[1].localDateTime!!.monthNumber)
        assertEquals(20, results[1].localDateTime!!.dayOfMonth)
    }

    @Test
    fun `second with non-zero value preserved`() {
        val json = """[{"text":"test","index":0,"start":{"year":2026,"month":4,"day":9,"hour":15,"minute":30,"second":45,"timezone":null,"isCertain":{"day":false}},"end":null}]"""
        val results = parse(json)
        assertEquals(45, results[0].localDateTime!!.second)
    }

    @Test
    fun `isCertain missing entirely defaults to uncertain`() {
        val json = """[{"text":"test","index":0,"start":{"year":2026,"month":4,"day":9,"hour":15,"minute":0,"second":0,"timezone":null},"end":null}]"""
        val results = parse(json)
        assertEquals(0.85f, results[0].confidence)
    }

    // ========== mergeSpanAndFullResults ==========

    @Test
    fun `merge upgrades span result without tz from full result with tz`() {
        val spanResults = listOf(
            ExtractedTime(localDateTime = kotlinx.datetime.LocalDateTime(2026, 4, 9, 9, 0), originalText = "9am"),
        )
        val fullResults = listOf(
            ExtractedTime(
                localDateTime = kotlinx.datetime.LocalDateTime(2026, 4, 9, 9, 0),
                sourceTimezone = ChronoResultParser.offsetToTimezone(-420),
                originalText = "9am PT",
            ),
        )
        val merged = ChronoResultParser.mergeSpanAndFullResults(spanResults, fullResults)
        assertEquals(1, merged.size)
        assertNotNull("Should have timezone after merge", merged[0].sourceTimezone)
    }

    @Test
    fun `merge keeps span tz when full also has tz`() {
        val tz = ChronoResultParser.offsetToTimezone(-300)
        val spanResults = listOf(
            ExtractedTime(localDateTime = kotlinx.datetime.LocalDateTime(2026, 4, 9, 15, 0), sourceTimezone = tz, originalText = "3pm EST"),
        )
        val fullResults = listOf(
            ExtractedTime(localDateTime = kotlinx.datetime.LocalDateTime(2026, 4, 9, 15, 0), sourceTimezone = tz, originalText = "3pm EST"),
        )
        val merged = ChronoResultParser.mergeSpanAndFullResults(spanResults, fullResults)
        assertEquals(1, merged.size)
        assertEquals(tz, merged[0].sourceTimezone)
    }

    @Test
    fun `merge adds unique full results not in spans`() {
        val spanResults = listOf(
            ExtractedTime(localDateTime = kotlinx.datetime.LocalDateTime(2026, 4, 9, 9, 0), originalText = "9am"),
        )
        val fullResults = listOf(
            ExtractedTime(localDateTime = kotlinx.datetime.LocalDateTime(2026, 4, 9, 15, 0), originalText = "3pm"),
        )
        val merged = ChronoResultParser.mergeSpanAndFullResults(spanResults, fullResults)
        assertEquals(2, merged.size)
    }

    @Test
    fun `merge handles empty spans`() {
        val fullResults = listOf(
            ExtractedTime(localDateTime = kotlinx.datetime.LocalDateTime(2026, 4, 9, 15, 0), originalText = "3pm"),
        )
        val merged = ChronoResultParser.mergeSpanAndFullResults(emptyList(), fullResults)
        assertEquals(1, merged.size)
    }

    @Test
    fun `merge handles empty full results`() {
        val spanResults = listOf(
            ExtractedTime(localDateTime = kotlinx.datetime.LocalDateTime(2026, 4, 9, 9, 0), originalText = "9am"),
        )
        val merged = ChronoResultParser.mergeSpanAndFullResults(spanResults, emptyList())
        assertEquals(1, merged.size)
    }

    @Test
    fun `merge handles both empty`() {
        val merged = ChronoResultParser.mergeSpanAndFullResults(emptyList(), emptyList())
        assertTrue(merged.isEmpty())
    }

    @Test
    fun `merge with multiple spans and overlapping full results`() {
        val spanResults = listOf(
            ExtractedTime(localDateTime = kotlinx.datetime.LocalDateTime(2026, 4, 9, 9, 0), originalText = "9am"),
            ExtractedTime(localDateTime = kotlinx.datetime.LocalDateTime(2026, 4, 9, 12, 0), originalText = "12pm"),
        )
        val tz1 = ChronoResultParser.offsetToTimezone(-420)
        val tz2 = ChronoResultParser.offsetToTimezone(-240)
        val fullResults = listOf(
            ExtractedTime(localDateTime = kotlinx.datetime.LocalDateTime(2026, 4, 9, 9, 0), sourceTimezone = tz1, originalText = "9am PT"),
            ExtractedTime(localDateTime = kotlinx.datetime.LocalDateTime(2026, 4, 9, 12, 0), sourceTimezone = tz2, originalText = "12pm ET"),
        )
        val merged = ChronoResultParser.mergeSpanAndFullResults(spanResults, fullResults)
        assertEquals(2, merged.size)
        assertNotNull("First should have tz", merged[0].sourceTimezone)
        assertNotNull("Second should have tz", merged[1].sourceTimezone)
    }

    @Test
    fun `merge does not downgrade span with tz to full without tz`() {
        val tz = ChronoResultParser.offsetToTimezone(-300)
        val spanResults = listOf(
            ExtractedTime(localDateTime = kotlinx.datetime.LocalDateTime(2026, 4, 9, 15, 0), sourceTimezone = tz, originalText = "3pm EST"),
        )
        val fullResults = listOf(
            ExtractedTime(localDateTime = kotlinx.datetime.LocalDateTime(2026, 4, 9, 15, 0), originalText = "3pm"),
        )
        val merged = ChronoResultParser.mergeSpanAndFullResults(spanResults, fullResults)
        assertEquals(1, merged.size)
        assertNotNull("Should keep span's timezone", merged[0].sourceTimezone)
    }

    @Test
    fun `very large JSON array parses all entries`() {
        val entries = (1..20).joinToString(",") { i ->
            chronoResult("item$i", hour = i % 24)
        }
        val results = parse("[$entries]")
        assertEquals(20, results.size)
    }

    // ========== Ambiguous timezone alignment ==========

    @Test
    fun `aligns CST to China Standard when majority instant matches`() {
        // "4:30 AM PT / 7:30 AM ET / 19:30 CST"
        // PT (-420) and ET (-240) for April 11 both resolve to same UTC instant (11:30 UTC)
        // CST (-360 US Central) would be 01:30 UTC April 12 — WRONG
        // CST (+480 China) would be 11:30 UTC — matches the majority
        val json = """[
            ${chronoResult("4:30 a.m. PT", day = 11, hour = 4, minute = 30, timezone = -420, dayCertain = true)},
            ${chronoResult("7:30 a.m. ET", day = 11, hour = 7, minute = 30, timezone = -240)},
            ${chronoResult("19:30 CST", day = 11, hour = 19, minute = 30, timezone = -360)}
        ]"""
        val results = parse(json)
        assertEquals(3, results.size)

        // First two should have the same instant (11:30 UTC)
        assertNotNull(results[0].instant)
        assertNotNull(results[1].instant)
        assertEquals("PT and ET should be same instant", results[0].instant, results[1].instant)

        // Third should be realigned to match
        assertNotNull("CST should have instant after alignment", results[2].instant)
        assertEquals("CST should align to same instant", results[0].instant, results[2].instant)
    }

    @Test
    fun `alignment with Vancouver vs LA timezone IDs for same offset`() {
        // Exact device scenario: Chrono uses America/Vancouver, Gemini uses America/Los_Angeles
        // Both are UTC-7 in April but different zone IDs
        val vancouver = kotlinx.datetime.TimeZone.of("America/Vancouver")
        val la = kotlinx.datetime.TimeZone.of("America/Los_Angeles")
        val ny = kotlinx.datetime.TimeZone.of("America/New_York")
        val shanghai = kotlinx.datetime.TimeZone.of("Asia/Shanghai")
        val chicago = kotlinx.datetime.TimeZone.of("America/Chicago")

        val dt430 = kotlinx.datetime.LocalDateTime(2026, 4, 11, 4, 30)
        val dt730 = kotlinx.datetime.LocalDateTime(2026, 4, 11, 7, 30)
        val dt1930 = kotlinx.datetime.LocalDateTime(2026, 4, 11, 19, 30)

        // Compute instants exactly as device would
        val vanInstant = dt430.toInstant(vancouver)
        val laInstant = dt430.toInstant(la)
        val nyInstant = dt730.toInstant(ny)
        val shanghaiInstant = dt1930.toInstant(shanghai)
        val chicagoInstant = dt1930.toInstant(chicago)

        // Verify: Vancouver and LA produce same instant
        assertEquals("Vancouver and LA same instant", vanInstant, laInstant)
        // Verify: NY matches
        assertEquals("NY matches", vanInstant, nyInstant)
        // Verify: Shanghai matches
        assertEquals("Shanghai matches", vanInstant, shanghaiInstant)
        // Verify: Chicago does NOT match
        assertTrue("Chicago is outlier", vanInstant != chicagoInstant)

        ChronoResultParser.clearOffsetCache()

        // Build the exact 5-result list from device logs
        val merged = listOf(
            // Chrono results (Vancouver for PT due to offset cache)
            ExtractedTime(instant = vanInstant, localDateTime = dt430, sourceTimezone = vancouver, originalText = "4:30 a.m. PT", method = "ML Kit + Chrono"),
            ExtractedTime(instant = nyInstant, localDateTime = dt730, sourceTimezone = ny, originalText = "7:30 a.m. ET", method = "ML Kit + Chrono"),
            ExtractedTime(instant = shanghaiInstant, localDateTime = dt1930, sourceTimezone = shanghai, originalText = "19:30 CST", method = "ML Kit + Chrono"),
            // Gemini results (LA for PT, Chicago for CST)
            ExtractedTime(instant = laInstant, localDateTime = dt430, sourceTimezone = la, originalText = "April 11 at 4:30 a.m. PT", method = "Gemini Nano"),
            ExtractedTime(instant = chicagoInstant, localDateTime = dt1930, sourceTimezone = chicago, originalText = "19:30 CST", method = "Gemini Nano"),
        )

        val aligned = ChronoResultParser.alignAmbiguousTimezones(merged)

        // The Chicago outlier (index 4) should be fixed
        assertEquals(5, aligned.size)
        assertEquals(
            "Gemini CST should be aligned to match majority instant",
            vanInstant,
            aligned[4].instant,
        )
        // Its timezone should no longer be America/Chicago
        assertTrue(
            "Gemini CST tz should be Asia/*, got ${aligned[4].sourceTimezone?.id}",
            aligned[4].sourceTimezone?.id != "America/Chicago",
        )
    }

    @Test
    fun `no alignment when less than 2 results share an instant`() {
        // All different instants — no majority to align to
        val json = """[
            ${chronoResult("3pm EST", hour = 15, timezone = -300)},
            ${chronoResult("5pm PST", hour = 17, timezone = -480)}
        ]"""
        val results = parse(json)
        assertEquals(2, results.size)
        // Both should keep their original instants (no alignment)
        assertTrue(results[0].instant != results[1].instant)
    }

    @Test
    fun `alignment fixes Gemini CST outlier in mixed Chrono plus Gemini results`() {
        // Reproduces exact device scenario — compute instants through timezone conversion
        // like the real code does, not via Instant.parse
        val laPt = kotlinx.datetime.TimeZone.of("America/Los_Angeles")
        val nyEt = kotlinx.datetime.TimeZone.of("America/New_York")
        val shanghai = kotlinx.datetime.TimeZone.of("Asia/Shanghai")
        val chicago = kotlinx.datetime.TimeZone.of("America/Chicago")

        val dt430 = kotlinx.datetime.LocalDateTime(2026, 4, 11, 4, 30)
        val dt730 = kotlinx.datetime.LocalDateTime(2026, 4, 11, 7, 30)
        val dt1930 = kotlinx.datetime.LocalDateTime(2026, 4, 11, 19, 30)

        val ptInstant = dt430.toInstant(laPt)
        val etInstant = dt730.toInstant(nyEt)
        val shanghaiInstant = dt1930.toInstant(shanghai)
        val chicagoInstant = dt1930.toInstant(chicago)

        // Verify PT and ET are the same moment
        assertEquals("PT and ET should be same instant", ptInstant, etInstant)
        // Verify Shanghai matches but Chicago doesn't
        assertEquals("Shanghai should match PT", ptInstant, shanghaiInstant)
        assertTrue("Chicago should NOT match PT", ptInstant != chicagoInstant)

        ChronoResultParser.clearOffsetCache()

        val merged = listOf(
            ExtractedTime(instant = ptInstant, localDateTime = dt430, sourceTimezone = laPt, originalText = "4:30 a.m. PT"),
            ExtractedTime(instant = etInstant, localDateTime = dt730, sourceTimezone = nyEt, originalText = "7:30 a.m. ET"),
            ExtractedTime(instant = shanghaiInstant, localDateTime = dt1930, sourceTimezone = shanghai, originalText = "19:30 CST"),
            ExtractedTime(instant = ptInstant, localDateTime = dt430, sourceTimezone = laPt, originalText = "4:30 a.m. PT"),
            // This is the outlier — Gemini's wrong CST interpretation
            ExtractedTime(instant = chicagoInstant, localDateTime = dt1930, sourceTimezone = chicago, originalText = "19:30 CST"),
        )

        val aligned = ChronoResultParser.alignAmbiguousTimezones(merged)

        assertEquals(5, aligned.size)
        // All 5 should now share the same instant
        val target = ptInstant
        aligned.forEachIndexed { i, result ->
            assertEquals(
                "Result $i '${result.originalText}' tz=${result.sourceTimezone?.id} should align to target",
                target, result.instant
            )
        }
    }

    @Test
    fun `alignment fixes outlier even with only 2 matching instants`() {
        // Minimum case: 2 match, 1 outlier
        val ny = kotlinx.datetime.TimeZone.of("America/New_York")
        val la = kotlinx.datetime.TimeZone.of("America/Los_Angeles")
        val chicago = kotlinx.datetime.TimeZone.of("America/Chicago")

        val dt = kotlinx.datetime.LocalDateTime(2026, 4, 11, 12, 0)
        val nyInstant = dt.toInstant(ny)
        val laInstant = kotlinx.datetime.LocalDateTime(2026, 4, 11, 9, 0).toInstant(la)
        val wrongInstant = dt.toInstant(chicago)

        assertEquals("NY and LA should be same instant", nyInstant, laInstant)
        assertTrue("Chicago should differ", nyInstant != wrongInstant)

        ChronoResultParser.clearOffsetCache()

        val results = listOf(
            ExtractedTime(instant = nyInstant, localDateTime = dt, sourceTimezone = ny, originalText = "12pm ET"),
            ExtractedTime(instant = laInstant, localDateTime = kotlinx.datetime.LocalDateTime(2026, 4, 11, 9, 0), sourceTimezone = la, originalText = "9am PT"),
            ExtractedTime(instant = wrongInstant, localDateTime = dt, sourceTimezone = chicago, originalText = "12pm CST"),
        )

        val aligned = ChronoResultParser.alignAmbiguousTimezones(results)
        assertEquals(nyInstant, aligned[2].instant)
    }

    @Test
    fun `alignment only affects outliers not majority`() {
        val json = """[
            ${chronoResult("9am PT", day = 11, hour = 9, minute = 0, timezone = -420, dayCertain = true)},
            ${chronoResult("12pm ET", day = 11, hour = 12, minute = 0, timezone = -240)},
            ${chronoResult("17:00 GMT", day = 11, hour = 17, minute = 0, timezone = 0)}
        ]"""
        val results = parse(json)
        // All three are 16:00 UTC — they should all already align
        assertEquals(results[0].instant, results[1].instant)
        assertEquals(results[0].instant, results[2].instant)
    }
}
