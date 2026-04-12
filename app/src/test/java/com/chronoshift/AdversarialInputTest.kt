package com.chronoshift

import com.chronoshift.conversion.ExtractedTime
import com.chronoshift.nlp.ChronoResultParser
import com.chronoshift.nlp.DateTimeSpan
import com.chronoshift.nlp.ExtractionResult
import com.chronoshift.nlp.LlmResultParser
import com.chronoshift.nlp.RegexExtractor
import com.chronoshift.nlp.ResultMerger
import com.chronoshift.nlp.SpanAwareTimeExtractor
import com.chronoshift.nlp.SpanDetector
import com.chronoshift.nlp.TestCityResolver
import com.chronoshift.nlp.TieredTimeExtractor
import com.chronoshift.nlp.TimeExtractor
import com.chronoshift.nlp.TimezoneAbbreviations
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toInstant
import kotlinx.datetime.toLocalDateTime
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class AdversarialInputTest {

    // ========== LlmResultParser adversarial JSON ==========

    @Test
    fun `LlmResultParser - deeply nested JSON returns empty`() {
        val nested = "{" + "\"a\":{".repeat(100) + "\"b\":1" + "}".repeat(101)
        val results = LlmResultParser.parseResponse(nested)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `LlmResultParser - extremely long string in time field`() {
        val longTime = "a".repeat(10_000)
        val json = """[{"time":"$longTime","date":"2026-04-06","timezone":"","original":"test"}]"""
        val results = LlmResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `LlmResultParser - extremely long string in original field`() {
        val longOriginal = "x".repeat(50_000)
        val json = """[{"time":"14:30:00","date":"2026-04-06","timezone":"","original":"$longOriginal"}]"""
        val results = LlmResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertEquals(longOriginal, results[0].originalText)
    }

    @Test
    fun `LlmResultParser - missing time field returns empty`() {
        val json = """[{"date":"2026-04-06","original":"2:30 PM","timezone":""}]"""
        val results = LlmResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `LlmResultParser - missing original field returns empty`() {
        val json = """[{"time":"14:30:00","date":"2026-04-06","timezone":""}]"""
        val results = LlmResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `LlmResultParser - date but no time returns empty`() {
        val json = """[{"date":"2026-04-06","original":"test","timezone":"America/New_York"}]"""
        val results = LlmResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `LlmResultParser - time but no date returns empty`() {
        val json = """[{"time":"14:30:00","date":"","original":"2:30 PM","timezone":""}]"""
        val results = LlmResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `LlmResultParser - extra unexpected fields are ignored`() {
        val json = """[{"time":"14:30:00","date":"2026-04-06","timezone":"","original":"test","foo":"bar","nested":{"x":1},"count":42}]"""
        val results = LlmResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertEquals("test", results[0].originalText)
    }

    @Test
    fun `LlmResultParser - truncated JSON returns empty`() {
        val json = """[{"time":"14:30:00","date":"2026-04-"""
        val results = LlmResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `LlmResultParser - JSON with invalid unicode chars returns empty`() {
        val json = """[{"time":"\u0000\uFFFF","date":"2026-04-06","timezone":"","original":"test"}]"""
        val results = LlmResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `LlmResultParser - empty JSON array returns empty`() {
        val results = LlmResultParser.parseResponse("[]")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `LlmResultParser - JSON with null-like string values`() {
        val json = """[{"time":"null","date":"null","timezone":"null","original":"null"}]"""
        val results = LlmResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `LlmResultParser - JSON with empty string values`() {
        val json = """[{"time":"","date":"","timezone":"","original":""}]"""
        val results = LlmResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `LlmResultParser - JSON object instead of array returns empty`() {
        val json = """{"time":"14:30:00","date":"2026-04-06","timezone":"","original":"test"}"""
        val results = LlmResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `LlmResultParser - array of primitives returns empty`() {
        val json = """[1, 2, 3, "hello"]"""
        val results = LlmResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `LlmResultParser - valid entry among many invalid entries`() {
        val valid = """{"time":"14:30:00","date":"2026-04-06","timezone":"","original":"2:30 PM"}"""
        val noTime = """{"date":"2026-04-06","timezone":"","original":"bad"}"""
        val noOrig = """{"time":"09:00:00","date":"2026-04-06","timezone":""}"""
        val noDate = """{"time":"09:00:00","original":"bad","timezone":""}"""
        val json = "[$noTime,$valid,$noOrig,$noDate]"
        val results = LlmResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertEquals("2:30 PM", results[0].originalText)
    }

    @Test
    fun `LlmResultParser - invalid date format returns empty`() {
        val json = """[{"time":"14:30:00","date":"April 6 2026","timezone":"","original":"test"}]"""
        val results = LlmResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `LlmResultParser - invalid time format returns empty`() {
        val json = """[{"time":"2:30 PM","date":"2026-04-06","timezone":"","original":"test"}]"""
        val results = LlmResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    // ========== RegexExtractor edge cases ==========

    private lateinit var regexExtractor: RegexExtractor

    @Before
    fun setup() {
        regexExtractor = RegexExtractor(TestCityResolver())
    }

    private suspend fun extract(text: String) = regexExtractor.extract(text).times

    @Test
    fun `RegexExtractor - negative sign before unix timestamp still matches positive digits`() = runTest {
        // The regex uses \b word boundary, so "-1712678400" matches "1712678400"
        val results = extract("-1712678400")
        assertEquals(1, results.size)
        assertEquals("1712678400", results[0].originalText)
    }

    @Test
    fun `RegexExtractor - timestamp at exact 2015 boundary is accepted`() = runTest {
        val results = extract("1420070400")
        assertEquals(1, results.size)
        val utcDt = results[0].instant!!.toLocalDateTime(TimeZone.UTC)
        assertEquals(2015, utcDt.year)
    }

    @Test
    fun `RegexExtractor - timestamp just before 2015 boundary is rejected`() = runTest {
        val results = extract("1420070399")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `RegexExtractor - timestamp at max 2035 boundary is accepted`() = runTest {
        // 2035-12-31T23:59:59Z
        val results = extract("2082758399")
        assertEquals(1, results.size)
        val utcDt = results[0].instant!!.toLocalDateTime(TimeZone.UTC)
        assertEquals(2035, utcDt.year)
    }

    @Test
    fun `RegexExtractor - timestamp just after 2035 boundary is rejected`() = runTest {
        // 2036-01-01T00:00:00Z
        val results = extract("2082758400")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `RegexExtractor - very large number is rejected`() = runTest {
        val results = extract("99999999999999999999")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `RegexExtractor - zero is rejected`() = runTest {
        val results = extract("0")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `RegexExtractor - city name with apostrophe`() = runTest {
        // "N'Djamena" is not in the IANA city lookup under a simple name
        val results = extract("5:00 in O'Hare")
        // Should not crash, may or may not find it
        // The point is it handles the apostrophe without error
        assertTrue(results.size <= 1)
    }

    @Test
    fun `RegexExtractor - city name with hyphen`() = runTest {
        val results = extract("3pm in Dar-es-Salaam")
        assertTrue(results.size <= 1)
    }

    @Test
    fun `RegexExtractor - empty string returns empty`() = runTest {
        val results = extract("")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `RegexExtractor - whitespace only returns empty`() = runTest {
        val results = extract("   \n\t\r  ")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `RegexExtractor - string of only digits below min`() = runTest {
        val results = extract("123456")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `RegexExtractor - timestamp embedded between letters is rejected`() = runTest {
        val results = extract("abc1712678400def")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `RegexExtractor - multiple spaces between time and city`() = runTest {
        val results = extract("5:00     in     London")
        // Regex requires single whitespace between components; extra spaces may not match
        assertTrue(results.size <= 1)
    }

    @Test
    fun `RegexExtractor - city with very long name is rejected`() = runTest {
        val longCity = "A".repeat(50)
        val results = extract("3pm in $longCity")
        assertTrue(results.isEmpty())
    }

    // ========== TimezoneAbbreviations edge cases ==========

    @Test
    fun `fixedOffsetTimezone - zero offset is UTC`() {
        val tz = TimezoneAbbreviations.fixedOffsetTimezone(0)
        val dt = LocalDateTime(2026, 4, 10, 12, 0)
        val instant = dt.toInstant(tz)
        assertEquals(12, instant.toLocalDateTime(TimeZone.UTC).hour)
    }

    @Test
    fun `fixedOffsetTimezone - positive half-hour 330`() {
        val tz = TimezoneAbbreviations.fixedOffsetTimezone(330)
        val dt = LocalDateTime(2026, 4, 10, 15, 0)
        val instant = dt.toInstant(tz)
        val utcDt = instant.toLocalDateTime(TimeZone.UTC)
        assertEquals(9, utcDt.hour)
        assertEquals(30, utcDt.minute)
    }

    @Test
    fun `fixedOffsetTimezone - negative half-hour -210`() {
        // Newfoundland Standard: UTC-3:30
        val tz = TimezoneAbbreviations.fixedOffsetTimezone(-210)
        val dt = LocalDateTime(2026, 4, 10, 12, 0)
        val instant = dt.toInstant(tz)
        val utcDt = instant.toLocalDateTime(TimeZone.UTC)
        assertEquals(15, utcDt.hour)
        assertEquals(30, utcDt.minute)
    }

    @Test
    fun `fixedOffsetTimezone - 345 minute offset (Nepal)`() {
        val tz = TimezoneAbbreviations.fixedOffsetTimezone(345)
        val dt = LocalDateTime(2026, 4, 10, 12, 0)
        val instant = dt.toInstant(tz)
        val utcDt = instant.toLocalDateTime(TimeZone.UTC)
        assertEquals(6, utcDt.hour)
        assertEquals(15, utcDt.minute)
    }

    @Test
    fun `fixedOffsetTimezone - negative 570 (Marquesas Islands UTC-9 30)`() {
        val tz = TimezoneAbbreviations.fixedOffsetTimezone(-570)
        val dt = LocalDateTime(2026, 4, 10, 12, 0)
        val instant = dt.toInstant(tz)
        val utcDt = instant.toLocalDateTime(TimeZone.UTC)
        assertEquals(21, utcDt.hour)
        assertEquals(30, utcDt.minute)
    }

    @Test
    fun `fixedOffsetTimezone - large positive offset 780 (NZDT)`() {
        val tz = TimezoneAbbreviations.fixedOffsetTimezone(780)
        val dt = LocalDateTime(2026, 4, 10, 15, 0)
        val instant = dt.toInstant(tz)
        val utcDt = instant.toLocalDateTime(TimeZone.UTC)
        // 15:00 at UTC+13 = 02:00 UTC
        assertEquals(2, utcDt.hour)
    }

    @Test
    fun `fixedOffsetTimezone - large negative offset -720`() {
        val tz = TimezoneAbbreviations.fixedOffsetTimezone(-720)
        val dt = LocalDateTime(2026, 4, 10, 12, 0)
        val instant = dt.toInstant(tz)
        val utcDt = instant.toLocalDateTime(TimeZone.UTC)
        // 12:00 at UTC-12 = 00:00 next day UTC
        assertEquals(0, utcDt.hour)
        assertEquals(11, utcDt.date.dayOfMonth)
    }

    @Test
    fun `computeInstant - ambiguous CST with Chicago uses IANA zone`() {
        val dt = LocalDateTime(2026, 1, 15, 15, 0)
        val tz = TimeZone.of("America/Chicago")
        val result = TimezoneAbbreviations.computeInstant(dt, tz, "3pm CST")
        // CST is ambiguous, but Chicago standard offset (-360) matches one of the CST offsets
        // so it uses the fixed offset -360
        val utcDt = result.toLocalDateTime(TimeZone.UTC)
        assertEquals(21, utcDt.hour)
    }

    @Test
    fun `computeInstant - ambiguous CST with Shanghai uses IANA zone`() {
        val dt = LocalDateTime(2026, 1, 15, 15, 0)
        val tz = TimeZone.of("Asia/Shanghai")
        val result = TimezoneAbbreviations.computeInstant(dt, tz, "3pm CST")
        // Shanghai standard offset (+480) matches the other CST offset
        val utcDt = result.toLocalDateTime(TimeZone.UTC)
        assertEquals(7, utcDt.hour)
    }

    @Test
    fun `computeInstant - no abbreviation in text uses IANA zone directly`() {
        val dt = LocalDateTime(2026, 7, 15, 15, 0)
        val tz = TimeZone.of("America/New_York")
        val result = TimezoneAbbreviations.computeInstant(dt, tz, "3pm tomorrow")
        assertEquals(dt.toInstant(tz), result)
    }

    @Test
    fun `computeInstant - unknown abbreviation uses IANA zone`() {
        val dt = LocalDateTime(2026, 7, 15, 15, 0)
        val tz = TimeZone.of("America/New_York")
        val result = TimezoneAbbreviations.computeInstant(dt, tz, "3pm XYZZY")
        assertEquals(dt.toInstant(tz), result)
    }

    @Test
    fun `computeInstant - empty original text uses IANA zone`() {
        val dt = LocalDateTime(2026, 7, 15, 15, 0)
        val tz = TimeZone.of("America/New_York")
        val result = TimezoneAbbreviations.computeInstant(dt, tz, "")
        assertEquals(dt.toInstant(tz), result)
    }

    // ========== TieredTimeExtractor input limit ==========

    @Test
    fun `TieredTimeExtractor - input at MAX_INPUT_LENGTH succeeds`() = runTest {
        val ext = tieredExtractor()
        val input = "a".repeat(10_000)
        val emissions = ext.extractStream(input).toList()
        assertTrue(emissions.isNotEmpty())
    }

    @Test(expected = IllegalArgumentException::class)
    fun `TieredTimeExtractor - input 1 char over MAX_INPUT_LENGTH throws`() = runTest {
        val ext = tieredExtractor()
        val input = "a".repeat(10_001)
        ext.extractStream(input).toList()
    }

    @Test(expected = IllegalArgumentException::class)
    fun `TieredTimeExtractor - very large input throws`() = runTest {
        val ext = tieredExtractor()
        val input = "a".repeat(100_000)
        ext.extractStream(input).toList()
    }

    // ========== ResultMerger edge cases ==========

    private val utc = TimeZone.UTC
    private val baseDt = LocalDateTime.parse("2026-04-06T14:30:00")
    private val baseInstant = baseDt.toInstant(utc)

    private fun time(
        instant: kotlinx.datetime.Instant? = null,
        localDateTime: LocalDateTime? = null,
        tz: TimeZone? = null,
        original: String = "test",
        method: String = "",
        confidence: Float = 1.0f,
    ) = ExtractedTime(
        instant = instant,
        localDateTime = localDateTime,
        sourceTimezone = tz,
        originalText = original,
        confidence = confidence,
        method = method,
    )

    @Test
    fun `ResultMerger - merge two empty lists returns empty`() {
        val result = ResultMerger.mergeResults(emptyList(), emptyList(), "Test")
        assertTrue(result.isEmpty())
    }

    @Test
    fun `ResultMerger - merge empty into non-empty returns existing`() {
        val existing = listOf(time(instant = baseInstant, method = "A"))
        val result = ResultMerger.mergeResults(existing, emptyList(), "B")
        assertEquals(1, result.size)
        assertEquals("A", result[0].method)
    }

    @Test
    fun `ResultMerger - merge non-empty into empty adds with method`() {
        val incoming = listOf(time(instant = baseInstant))
        val result = ResultMerger.mergeResults(emptyList(), incoming, "B")
        assertEquals(1, result.size)
        assertEquals("B", result[0].method)
    }

    @Test
    fun `ResultMerger - stress test 100+ results`() {
        val existing = (0 until 50).map { i ->
            val dt = LocalDateTime(2026, 4, 6, i % 24, i % 60)
            time(localDateTime = dt, tz = utc, original = "existing-$i", method = "A")
        }
        val incoming = (50 until 150).map { i ->
            val dt = LocalDateTime(2026, 4, 6, i % 24, i % 60)
            time(localDateTime = dt, tz = utc, original = "incoming-$i", method = "")
        }
        val result = ResultMerger.mergeResults(existing, incoming, "B")
        // Some may merge (same hour+minute+date), rest are new
        assertTrue("Should handle 100+ results without error", result.size >= 50)
        assertTrue("Should have results from both sets", result.size <= 150)
    }

    @Test
    fun `ResultMerger - results with null localDateTime and null instant`() {
        val a = time(original = "thing-a", method = "A")
        val b = time(original = "thing-b")
        val result = ResultMerger.mergeResults(listOf(a), listOf(b), "B")
        // Both have null instant and null localDateTime, so no exact or fuzzy match
        assertEquals(2, result.size)
    }

    @Test
    fun `ResultMerger - results with null instant but same localDateTime merge`() {
        val dt = LocalDateTime(2026, 4, 6, 14, 30)
        val a = time(localDateTime = dt, tz = utc, original = "a", method = "A")
        val b = time(localDateTime = dt, tz = utc, original = "b")
        val result = ResultMerger.mergeResults(listOf(a), listOf(b), "B")
        assertEquals(1, result.size)
        assertEquals("A + B", result[0].method)
    }

    @Test
    fun `ResultMerger - result with null localDateTime does not fuzzy match`() {
        val a = time(localDateTime = baseDt, tz = utc, method = "A")
        val b = time(instant = baseInstant, tz = utc)
        val result = ResultMerger.mergeResults(listOf(a), listOf(b), "B")
        // a has localDateTime but no instant; b has instant but no localDateTime
        // isSameTime: a.instant is null, b.instant is not → no exact match
        // isSameLocalTime: b.localDateTime is null → no fuzzy match
        assertEquals(2, result.size)
    }

    @Test
    fun `ResultMerger - merge preserves order of existing results`() {
        val dt1 = LocalDateTime(2026, 4, 6, 10, 0)
        val dt2 = LocalDateTime(2026, 4, 6, 14, 0)
        val dt3 = LocalDateTime(2026, 4, 6, 18, 0)
        val existing = listOf(
            time(localDateTime = dt1, tz = utc, original = "first", method = "A"),
            time(localDateTime = dt2, tz = utc, original = "second", method = "A"),
            time(localDateTime = dt3, tz = utc, original = "third", method = "A"),
        )
        val result = ResultMerger.mergeResults(existing, emptyList(), "B")
        assertEquals("first", result[0].originalText)
        assertEquals("second", result[1].originalText)
        assertEquals("third", result[2].originalText)
    }

    // ========== ChronoResultParser adversarial JSON ==========

    @Test
    fun `ChronoResultParser - empty JSON array returns empty`() {
        val results = ChronoResultParser.parse("[]", "test", TestCityResolver())
        assertTrue(results.isEmpty())
    }

    @Test
    fun `ChronoResultParser - completely invalid JSON returns empty`() {
        val results = ChronoResultParser.parse("not json at all", "test", TestCityResolver())
        assertTrue(results.isEmpty())
    }

    @Test
    fun `ChronoResultParser - truncated JSON returns empty`() {
        val results = ChronoResultParser.parse("""[{"text":"3pm","start":{"year":2026""", "test", TestCityResolver())
        assertTrue(results.isEmpty())
    }

    @Test
    fun `ChronoResultParser - null city resolver does not crash`() {
        val json = """[{"text":"3pm EST","start":{"year":2026,"month":4,"day":6,"hour":15,"minute":0,"second":0,"timezone":-300,"isCertain":{"day":true,"hour":true}}}]"""
        val results = ChronoResultParser.parse(json, "3pm EST", null)
        assertEquals(1, results.size)
    }

    // ========== Helpers ==========

    private fun tieredExtractor(): TieredTimeExtractor {
        return TieredTimeExtractor(
            chronoExtractor = NoOpSpanAwareExtractor(),
            liteRtExtractor = NoOpTimeExtractor("LiteRT"),
            geminiExtractor = NoOpTimeExtractor("Gemini Nano"),
            mlKitExtractor = NoOpSpanDetector(),
            regexExtractor = NoOpTimeExtractor("Regex"),
        )
    }

    private class NoOpTimeExtractor(private val name: String) : TimeExtractor {
        override suspend fun isAvailable() = false
        override suspend fun extract(text: String) = ExtractionResult(emptyList(), name)
    }

    private class NoOpSpanAwareExtractor : SpanAwareTimeExtractor {
        override suspend fun isAvailable() = false
        override suspend fun extract(text: String) = ExtractionResult(emptyList(), "Chrono")
        override suspend fun extractWithSpans(text: String, spans: List<DateTimeSpan>) =
            ExtractionResult(emptyList(), "ML Kit + Chrono")
    }

    private class NoOpSpanDetector : SpanDetector {
        override suspend fun isAvailable() = false
        override suspend fun detectSpans(text: String) = emptyList<DateTimeSpan>()
    }
}
