package com.chronoshift.nlp

import com.chronoshift.conversion.ExtractedTime
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toInstant
import kotlinx.datetime.toLocalDateTime
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Test

class ChronoResultParserMergeTest {

    private val utc = TimeZone.UTC
    private val newYork = TimeZone.of("America/New_York")
    private val tokyo = TimeZone.of("Asia/Tokyo")

    private fun time(
        original: String = "test",
        hour: Int = 14,
        minute: Int = 0,
        tz: TimeZone? = null,
    ): ExtractedTime {
        val dt = LocalDateTime(2026, 4, 9, hour, minute)
        return ExtractedTime(
            instant = tz?.let { dt.toInstant(it) },
            localDateTime = dt,
            sourceTimezone = tz,
            originalText = original,
        )
    }

    // ========== mergeSpanAndFullResults ==========

    @Test
    fun `empty spans plus empty full returns empty`() {
        val result = ChronoResultParser.mergeSpanAndFullResults(emptyList(), emptyList())
        assertEquals(0, result.size)
    }

    @Test
    fun `spans only returns spans`() {
        val spans = listOf(time("span 1", hour = 10), time("span 2", hour = 14))
        val result = ChronoResultParser.mergeSpanAndFullResults(spans, emptyList())
        assertEquals(2, result.size)
    }

    @Test
    fun `full only returns full`() {
        val full = listOf(time("full 1", hour = 10))
        val result = ChronoResultParser.mergeSpanAndFullResults(emptyList(), full)
        assertEquals(1, result.size)
    }

    @Test
    fun `matching hour and minute upgrades span with timezone from full`() {
        val span = time("9am", hour = 9, tz = null)
        val full = time("9am EST", hour = 9, tz = newYork)

        val result = ChronoResultParser.mergeSpanAndFullResults(listOf(span), listOf(full))

        assertEquals("Should merge to 1", 1, result.size)
        assertNotNull("Should have timezone from full", result[0].sourceTimezone)
        assertEquals(newYork, result[0].sourceTimezone)
    }

    @Test
    fun `span with timezone is not replaced by full`() {
        val span = time("9am JST", hour = 9, tz = tokyo)
        val full = time("9am EST", hour = 9, tz = newYork)

        val result = ChronoResultParser.mergeSpanAndFullResults(listOf(span), listOf(full))

        assertEquals("Span already has tz — keep span", 1, result.size)
        assertEquals(tokyo, result[0].sourceTimezone)
    }

    @Test
    fun `non-matching times are both kept`() {
        val span = time("9am", hour = 9)
        val full = time("3pm EST", hour = 15, tz = newYork)

        val result = ChronoResultParser.mergeSpanAndFullResults(listOf(span), listOf(full))

        assertEquals("Different times both kept", 2, result.size)
    }

    @Test
    fun `multiple spans and full results merge correctly`() {
        val spans = listOf(
            time("9am", hour = 9, tz = null),
            time("12pm", hour = 12, tz = null),
        )
        val full = listOf(
            time("9am EST", hour = 9, tz = newYork),
            time("3pm", hour = 15, tz = null),
        )

        val result = ChronoResultParser.mergeSpanAndFullResults(spans, full)

        // 9am: span upgraded with EST from full (1 result)
        // 12pm: span kept (no match in full) (1 result)
        // 3pm: full added (no match in spans) (1 result)
        assertEquals(3, result.size)
    }

    @Test
    fun `full result with null tz does not replace span with null tz`() {
        val span = time("9am", hour = 9, tz = null)
        val full = time("9 o'clock", hour = 9, tz = null)

        val result = ChronoResultParser.mergeSpanAndFullResults(listOf(span), listOf(full))

        // Same hour+minute, span has no tz, full has no tz — no upgrade possible
        assertEquals("Both null tz — span stays", 1, result.size)
    }

    @Test
    fun `minute precision matters in matching`() {
        val span = time("9:00", hour = 9, minute = 0)
        val full = time("9:30", hour = 9, minute = 30)

        val result = ChronoResultParser.mergeSpanAndFullResults(listOf(span), listOf(full))

        assertEquals("Different minutes should not merge", 2, result.size)
    }

    @Test
    fun `first matching full wins for timezone upgrade, second dropped`() {
        val span = time("9am", hour = 9, tz = null)
        val full1 = time("9am EST", hour = 9, tz = newYork)
        val full2 = time("9am JST", hour = 9, tz = tokyo)

        val result = ChronoResultParser.mergeSpanAndFullResults(listOf(span), listOf(full1, full2))

        // First full (EST) upgrades the span. Second full (JST) matches the now-upgraded
        // span by hour+minute, but since the span already has tz, it's not replaced.
        // mergeSpanAndFullResults is for tz upgrade only — ambiguity is handled by ResultMerger.
        assertEquals(1, result.size)
        assertEquals(newYork, result[0].sourceTimezone)
    }

    // ========== offsetToTimezone with instant ==========

    @Test
    fun `offsetToTimezone - EST offset in winter maps to New York`() {
        ChronoResultParser.clearOffsetCache()
        // January: EST zones are at -300
        val winterInstant = LocalDateTime(2026, 1, 15, 20, 0).toInstant(TimeZone.UTC)
        val tz = ChronoResultParser.offsetToTimezone(-300, winterInstant)
        assertEquals("America/New_York", tz.id)
    }

    @Test
    fun `offsetToTimezone - CDT offset in summer maps to Chicago`() {
        ChronoResultParser.clearOffsetCache()
        // July: CDT zones are at -300 (not EST zones, which are at -240/EDT in summer)
        val summerInstant = LocalDateTime(2026, 7, 15, 20, 0).toInstant(TimeZone.UTC)
        val tz = ChronoResultParser.offsetToTimezone(-300, summerInstant)
        assertEquals("America/Chicago", tz.id)
    }

    @Test
    fun `offsetToTimezone - CST offset in winter maps to Chicago`() {
        ChronoResultParser.clearOffsetCache()
        val winterInstant = LocalDateTime(2026, 1, 15, 21, 0).toInstant(TimeZone.UTC)
        val tz = ChronoResultParser.offsetToTimezone(-360, winterInstant)
        assertEquals("America/Chicago", tz.id)
    }

    @Test
    fun `offsetToTimezone - JST offset maps to Tokyo`() {
        ChronoResultParser.clearOffsetCache()
        val instant = LocalDateTime(2026, 7, 15, 6, 0).toInstant(TimeZone.UTC)
        val tz = ChronoResultParser.offsetToTimezone(540, instant)
        assertEquals("Asia/Tokyo", tz.id)
    }

    @Test
    fun `offsetToTimezone - GMT offset maps to London in winter`() {
        ChronoResultParser.clearOffsetCache()
        val winterInstant = LocalDateTime(2026, 1, 15, 12, 0).toInstant(TimeZone.UTC)
        val tz = ChronoResultParser.offsetToTimezone(0, winterInstant)
        assertEquals("Europe/London", tz.id)
    }

    @Test
    fun `offsetToTimezone - deterministic for same instant`() {
        ChronoResultParser.clearOffsetCache()
        val instant = LocalDateTime(2026, 1, 15, 20, 0).toInstant(TimeZone.UTC)
        val first = ChronoResultParser.offsetToTimezone(-300, instant)
        ChronoResultParser.clearOffsetCache()
        val second = ChronoResultParser.offsetToTimezone(-300, instant)
        assertEquals(first, second)
    }

    @Test
    fun `offsetToTimezone - zone offset at instant matches raw offset`() {
        // Key invariant: the returned zone's offset at the given instant must match the raw offset
        val dt = LocalDateTime(2026, 7, 15, 15, 0)
        val rawOffset = -300
        val instant = dt.toInstant(TimezoneAbbreviations.fixedOffsetTimezone(rawOffset))
        val tz = ChronoResultParser.offsetToTimezone(rawOffset, instant)

        // Converting instant back through the zone should give back the original local time
        val roundTripped = instant.toLocalDateTime(tz)
        assertEquals(dt.hour, roundTripped.hour)
        assertEquals(dt.minute, roundTripped.minute)
    }

    // ========== parseRaw instant from raw offset ==========

    @Test
    fun `parseRaw - instant computed from raw offset not IANA zone DST`() {
        // Chrono returns offset -300 (EST/UTC-5). parseRaw should compute instant from
        // the raw offset, so it's correct regardless of what IANA zone offsetToTimezone picks.
        val json = """[{
            "text": "3pm EST",
            "start": {
                "year": 2026, "month": 7, "day": 15,
                "hour": 15, "minute": 0, "second": 0,
                "timezone": -300,
                "isCertain": {"hour": true, "day": true}
            }
        }]"""
        val results = ChronoResultParser.parseRaw(json)
        assertEquals(1, results.size)
        val instant = results[0].extracted.instant
        assertNotNull(instant)
        // 3pm at UTC-5 = 8pm UTC, regardless of IANA zone DST rules
        assertEquals(20, instant!!.toLocalDateTime(TimeZone.UTC).hour)
    }

    @Test
    fun `parseRaw - preserves raw offset for date propagation`() {
        val json = """[{
            "text": "3pm EST",
            "start": {
                "year": 2026, "month": 7, "day": 15,
                "hour": 15, "minute": 0, "second": 0,
                "timezone": -300,
                "isCertain": {"hour": true, "day": false}
            }
        }]"""
        val results = ChronoResultParser.parseRaw(json)
        assertEquals(-300, results[0].rawOffsetMinutes)
    }

    @Test
    fun `propagateDates - uses raw offset for instant recomputation`() {
        // Date-certain entry + time-only entry with raw offset
        val dateCertain = ChronoResultParser.ParsedResult(
            extracted = ExtractedTime(
                localDateTime = LocalDateTime(2026, 8, 20, 12, 0),
                originalText = "August 20",
                confidence = 0.0f,
            ),
            dateCertain = true,
        )
        val timeOnly = ChronoResultParser.ParsedResult(
            extracted = ExtractedTime(
                instant = LocalDateTime(2026, 4, 9, 15, 0)
                    .toInstant(TimezoneAbbreviations.fixedOffsetTimezone(-300)),
                localDateTime = LocalDateTime(2026, 4, 9, 15, 0),
                sourceTimezone = TimeZone.of("America/New_York"),
                originalText = "3pm EST",
                confidence = 0.85f,
            ),
            dateCertain = false,
            rawOffsetMinutes = -300,
        )

        val propagated = ChronoResultParser.propagateDates(listOf(dateCertain, timeOnly))

        // The time-only entry should get Aug 20 date, and instant recomputed from raw offset
        val result = propagated[1]
        assertEquals(20, result.localDateTime!!.dayOfMonth)
        assertEquals(8, result.localDateTime!!.monthNumber)
        // Instant should use raw offset -300 (UTC-5): 3pm + 5h = 8pm UTC
        assertEquals(20, result.instant!!.toLocalDateTime(TimeZone.UTC).hour)
        // Zone should also be updated to match offset at the new instant
        // In August at UTC-5, that's CDT (Chicago), not EST (New York)
        val sourceHour = result.instant!!.toLocalDateTime(result.sourceTimezone!!).hour
        assertEquals("Source display should round-trip to original hour", 15, sourceHour)
    }

    // ========== IanaCityLookup ==========

    @Test
    fun `IanaCityLookup resolves common cities`() {
        assertNotNull(IanaCityLookup.resolve("new york"))
        assertNotNull(IanaCityLookup.resolve("tokyo"))
        assertNotNull(IanaCityLookup.resolve("london"))
    }

    @Test
    fun `IanaCityLookup resolves aliases`() {
        assertNotNull(IanaCityLookup.resolve("nyc"))
        assertNotNull(IanaCityLookup.resolve("sf"))
        assertNotNull(IanaCityLookup.resolve("la"))
    }

    @Test
    fun `IanaCityLookup fuzzy matching`() {
        // "tokio" is edit distance 1 from "tokyo"
        assertNotNull(IanaCityLookup.resolve("tokio"))
    }

    @Test
    fun `IanaCityLookup returns null for unknown city`() {
        assertNull(IanaCityLookup.resolve("narnia"))
    }

    @Test
    fun `IanaCityLookup is case insensitive`() {
        assertNotNull(IanaCityLookup.resolve("NEW YORK"))
        assertNotNull(IanaCityLookup.resolve("Tokyo"))
    }

    @Test
    fun `editDistance basic cases`() {
        assertEquals(0, IanaCityLookup.editDistance("abc", "abc"))
        assertEquals(1, IanaCityLookup.editDistance("abc", "abd"))
        assertEquals(3, IanaCityLookup.editDistance("abc", ""))
        assertEquals(3, IanaCityLookup.editDistance("", "abc"))
        assertEquals(0, IanaCityLookup.editDistance("", ""))
    }
}
