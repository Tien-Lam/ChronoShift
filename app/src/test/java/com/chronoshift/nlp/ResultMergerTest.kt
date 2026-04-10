package com.chronoshift.nlp

import com.chronoshift.conversion.ExtractedTime
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toInstant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ResultMergerTest {

    private val utc = TimeZone.UTC
    private val tokyo = TimeZone.of("Asia/Tokyo")
    private val newYork = TimeZone.of("America/New_York")

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

    // ========== mergeResults ==========

    @Test
    fun `mergeResults - empty existing + empty incoming returns empty`() {
        val result = ResultMerger.mergeResults(emptyList(), emptyList(), "Chrono")
        assertTrue(result.isEmpty())
    }

    @Test
    fun `mergeResults - empty existing + non-empty incoming adds with method`() {
        val incoming = listOf(time(instant = baseInstant, original = "2pm"))
        val result = ResultMerger.mergeResults(emptyList(), incoming, "Chrono")
        assertEquals(1, result.size)
        assertEquals("Chrono", result[0].method)
        assertEquals(baseInstant, result[0].instant)
    }

    @Test
    fun `mergeResults - non-empty existing + empty incoming returns existing unchanged`() {
        val existing = listOf(time(instant = baseInstant, method = "Chrono", original = "2pm"))
        val result = ResultMerger.mergeResults(existing, emptyList(), "Regex")
        assertEquals(1, result.size)
        assertEquals("Chrono", result[0].method)
    }

    @Test
    fun `mergeResults - exact duplicate same instant combines method`() {
        val existing = listOf(time(instant = baseInstant, method = "Chrono", original = "2pm"))
        val incoming = listOf(time(instant = baseInstant, original = "2pm"))
        val result = ResultMerger.mergeResults(existing, incoming, "Regex")
        assertEquals(1, result.size)
        assertEquals("Chrono + Regex", result[0].method)
    }

    @Test
    fun `mergeResults - fuzzy match upgrades tz when existing lacks it`() {
        val existing = listOf(time(localDateTime = baseDt, tz = null, method = "Chrono"))
        val incoming = listOf(time(localDateTime = baseDt, tz = tokyo))
        val result = ResultMerger.mergeResults(existing, incoming, "Regex")
        assertEquals(1, result.size)
        assertEquals(tokyo, result[0].sourceTimezone)
        assertEquals("Chrono + Regex", result[0].method)
    }

    @Test
    fun `mergeResults - fuzzy match keeps existing tz when incoming lacks it`() {
        val existing = listOf(time(localDateTime = baseDt, tz = tokyo, method = "Chrono"))
        val incoming = listOf(time(localDateTime = baseDt, tz = null))
        val result = ResultMerger.mergeResults(existing, incoming, "Regex")
        assertEquals(1, result.size)
        assertEquals(tokyo, result[0].sourceTimezone)
        assertEquals("Chrono + Regex", result[0].method)
    }

    @Test
    fun `mergeResults - fuzzy match both have different tz and different offset keeps both`() {
        val existing = listOf(time(localDateTime = baseDt, tz = tokyo, method = "Chrono"))
        val incoming = listOf(time(localDateTime = baseDt, tz = newYork))
        val result = ResultMerger.mergeResults(existing, incoming, "Gemini Nano")
        // Tokyo (+9) and New York (-5/-4) have different offsets → genuinely different
        assertEquals(2, result.size)
        assertEquals(tokyo, result[0].sourceTimezone)
        assertEquals(newYork, result[1].sourceTimezone)
    }

    @Test
    fun `mergeResults - fuzzy match both have different tz but same instant merges`() {
        // Vancouver and LA have different IANA IDs but the same offset at all times
        val vancouver = TimeZone.of("America/Vancouver")
        val la = TimeZone.of("America/Los_Angeles")
        val dt = LocalDateTime.parse("2026-04-11T04:30:00")
        val instant = dt.toInstant(vancouver)

        val existing = listOf(time(instant = instant, localDateTime = dt, tz = vancouver, method = "Chrono"))
        val incoming = listOf(time(instant = instant, localDateTime = dt, tz = la))
        val result = ResultMerger.mergeResults(existing, incoming, "Gemini Nano")
        // Same instant → same interpretation → merge
        assertEquals(1, result.size)
        assertEquals("Chrono + Gemini Nano", result[0].method)
    }

    @Test
    fun `mergeResults - fuzzy match same tz keeps existing`() {
        val existing = listOf(time(localDateTime = baseDt, tz = tokyo, method = "Chrono"))
        val incoming = listOf(time(localDateTime = baseDt, tz = tokyo))
        val result = ResultMerger.mergeResults(existing, incoming, "Gemini Nano")
        assertEquals(1, result.size)
        assertEquals(tokyo, result[0].sourceTimezone)
    }

    @Test
    fun `mergeResults - no match adds incoming as new entry`() {
        val dt2 = LocalDateTime.parse("2026-04-06T18:00:00")
        val existing = listOf(time(localDateTime = baseDt, tz = utc, method = "Chrono"))
        val incoming = listOf(time(localDateTime = dt2, tz = utc))
        val result = ResultMerger.mergeResults(existing, incoming, "Regex")
        assertEquals(2, result.size)
        assertEquals("Regex", result[1].method)
    }

    @Test
    fun `mergeResults - multiple incoming items some match some new`() {
        val dt2 = LocalDateTime.parse("2026-04-06T18:00:00")
        val existing = listOf(time(localDateTime = baseDt, tz = utc, method = "Chrono"))
        val incoming = listOf(
            time(localDateTime = baseDt, tz = utc),
            time(localDateTime = dt2, tz = utc),
        )
        val result = ResultMerger.mergeResults(existing, incoming, "Regex")
        assertEquals(2, result.size)
        assertEquals("Chrono + Regex", result[0].method)
        assertEquals("Regex", result[1].method)
    }

    @Test
    fun `mergeResults - method combining Chrono + Regex`() {
        val existing = listOf(time(instant = baseInstant, method = "Chrono"))
        val incoming = listOf(time(instant = baseInstant))
        val result = ResultMerger.mergeResults(existing, incoming, "Regex")
        assertEquals("Chrono + Regex", result[0].method)
    }

    @Test
    fun `mergeResults - method combining no duplicate when already present`() {
        val existing = listOf(time(instant = baseInstant, method = "Chrono + Regex"))
        val incoming = listOf(time(instant = baseInstant))
        val result = ResultMerger.mergeResults(existing, incoming, "Chrono")
        assertEquals("Chrono + Regex", result[0].method)
    }

    @Test
    fun `mergeResults - three-way merge fuzzy match and new entry`() {
        val dtB = LocalDateTime.parse("2026-04-06T14:30:00")
        val dtC = LocalDateTime.parse("2026-04-06T20:00:00")
        val existing = listOf(time(localDateTime = baseDt, tz = null, method = "A"))
        val incoming = listOf(
            time(localDateTime = dtB, tz = tokyo),
            time(localDateTime = dtC, tz = utc),
        )
        val result = ResultMerger.mergeResults(existing, incoming, "B")
        assertEquals(2, result.size)
        assertEquals(tokyo, result[0].sourceTimezone)
        assertTrue(result[0].method.contains("A"))
        assertTrue(result[0].method.contains("B"))
        assertEquals("B", result[1].method)
    }

    // ========== isSameTime ==========

    @Test
    fun `isSameTime - both have instant same returns true`() {
        val a = time(instant = baseInstant)
        val b = time(instant = baseInstant)
        assertTrue(ResultMerger.isSameTime(a, b))
    }

    @Test
    fun `isSameTime - both have instant different returns false`() {
        val other = LocalDateTime.parse("2026-04-06T15:00:00").toInstant(utc)
        val a = time(instant = baseInstant)
        val b = time(instant = other)
        assertFalse(ResultMerger.isSameTime(a, b))
    }

    @Test
    fun `isSameTime - one has instant other does not returns false`() {
        val a = time(instant = baseInstant)
        val b = time(localDateTime = baseDt, tz = utc)
        assertFalse(ResultMerger.isSameTime(a, b))
    }

    @Test
    fun `isSameTime - both localDateTime same tz same time returns true`() {
        val a = time(localDateTime = baseDt, tz = utc)
        val b = time(localDateTime = baseDt, tz = utc)
        assertTrue(ResultMerger.isSameTime(a, b))
    }

    @Test
    fun `isSameTime - both localDateTime different tz returns false`() {
        val a = time(localDateTime = baseDt, tz = utc)
        val b = time(localDateTime = baseDt, tz = tokyo)
        assertFalse(ResultMerger.isSameTime(a, b))
    }

    @Test
    fun `isSameTime - both localDateTime same tz different time returns false`() {
        val dt2 = LocalDateTime.parse("2026-04-06T15:00:00")
        val a = time(localDateTime = baseDt, tz = utc)
        val b = time(localDateTime = dt2, tz = utc)
        assertFalse(ResultMerger.isSameTime(a, b))
    }

    @Test
    fun `isSameTime - both null fields returns false`() {
        val a = time(original = "a")
        val b = time(original = "b")
        assertFalse(ResultMerger.isSameTime(a, b))
    }

    // ========== isSameLocalTime ==========

    @Test
    fun `isSameLocalTime - same hour and minute returns true`() {
        val a = time(localDateTime = baseDt)
        val b = time(localDateTime = baseDt)
        assertTrue(ResultMerger.isSameLocalTime(a, b))
    }

    @Test
    fun `isSameLocalTime - same hour different minute returns false`() {
        val dt2 = LocalDateTime.parse("2026-04-06T14:31:00")
        val a = time(localDateTime = baseDt)
        val b = time(localDateTime = dt2)
        assertFalse(ResultMerger.isSameLocalTime(a, b))
    }

    @Test
    fun `isSameLocalTime - one null localDateTime returns false`() {
        val a = time(localDateTime = baseDt)
        val b = time(original = "none")
        assertFalse(ResultMerger.isSameLocalTime(a, b))
    }

    @Test
    fun `isSameLocalTime - both null localDateTime returns false`() {
        val a = time(original = "a")
        val b = time(original = "b")
        assertFalse(ResultMerger.isSameLocalTime(a, b))
    }

    // ========== combineMethod ==========

    @Test
    fun `combineMethod - new method not in existing combines them`() {
        assertEquals("Chrono + Regex", ResultMerger.combineMethod("Chrono", "Regex"))
    }

    @Test
    fun `combineMethod - new method already in existing returns unchanged`() {
        assertEquals("Chrono + Regex", ResultMerger.combineMethod("Chrono + Regex", "Chrono"))
    }

    @Test
    fun `combineMethod - empty existing returns new`() {
        assertEquals("Regex", ResultMerger.combineMethod("", "Regex"))
    }

    @Test
    fun `combineMethod - empty new returns existing`() {
        assertEquals("Chrono", ResultMerger.combineMethod("Chrono", ""))
    }

    @Test
    fun `combineMethod - both empty returns empty`() {
        assertEquals("", ResultMerger.combineMethod("", ""))
    }

    // ========== Device scenario reproduction ==========

    @Test
    fun `merge Chrono 3 results plus Gemini 3 results device scenario`() {
        // REAL device scenario: Gemini results have instant + localDateTime + sourceTimezone
        // Chrono results have instant + localDateTime + sourceTimezone
        // Key difference: Gemini used to NOT set localDateTime, causing fuzzy match to fail
        val vancouver = TimeZone.of("America/Vancouver")
        val la = TimeZone.of("America/Los_Angeles")
        val ny = TimeZone.of("America/New_York")
        val shanghai = TimeZone.of("Asia/Shanghai")
        val chicago = TimeZone.of("America/Chicago")

        val dt430 = LocalDateTime(2026, 4, 11, 4, 30)
        val dt730 = LocalDateTime(2026, 4, 11, 7, 30)
        val dt1930 = LocalDateTime(2026, 4, 11, 19, 30)

        val correctInstant = dt430.toInstant(vancouver) // 11:30 UTC
        val wrongInstant = dt1930.toInstant(chicago)     // 00:30 UTC Apr 12

        // Chrono results: have both instant and localDateTime
        val chronoResults = listOf(
            ExtractedTime(instant = correctInstant, localDateTime = dt430, sourceTimezone = vancouver, originalText = "4:30 a.m. PT", method = "ML Kit + Chrono"),
            ExtractedTime(instant = correctInstant, localDateTime = dt730, sourceTimezone = ny, originalText = "7:30 a.m. ET", method = "ML Kit + Chrono"),
            ExtractedTime(instant = correctInstant, localDateTime = dt1930, sourceTimezone = shanghai, originalText = "19:30 CST", method = "ML Kit + Chrono"),
        )

        // Gemini results: NOW have localDateTime (after fix), enabling fuzzy match
        val geminiResults = listOf(
            ExtractedTime(instant = correctInstant, localDateTime = dt430, sourceTimezone = la, originalText = "April 11 at 4:30 a.m. PT", method = "Gemini Nano"),
            ExtractedTime(instant = correctInstant, localDateTime = dt730, sourceTimezone = ny, originalText = "7:30 a.m. ET", method = "Gemini Nano"),
            ExtractedTime(instant = wrongInstant, localDateTime = dt1930, sourceTimezone = chicago, originalText = "19:30 CST", method = "Gemini Nano"),
        )

        val merged = ResultMerger.mergeResults(chronoResults, geminiResults, "Gemini Nano")

        // ET exact-matches (same instant + same tz New_York).
        // PT: Vancouver vs LA have different IANA IDs but same instant → merged via isSameInstant.
        // CST: Shanghai vs Chicago have different instants → kept as separate interpretations.
        // Total: 1 PT + 1 ET + 2 CST = 4
        assertEquals(
            "Should merge to 4 results (same-offset merged, different-offset kept), got ${merged.size}: ${merged.map { "${it.originalText} tz=${it.sourceTimezone?.id}" }}",
            4, merged.size
        )
    }

    @Test
    fun `mergeResults - 3pm EST from Chrono and Gemini produces one result`() {
        // Core bug scenario: "3pm EST" → Chrono uses raw offset -300, Gemini uses America/New_York
        // Both should produce the same instant (3pm at UTC-5 = 8pm UTC) and merge
        val dt = LocalDateTime(2026, 7, 15, 15, 0)
        val estOffset = TimezoneAbbreviations.fixedOffsetTimezone(-300)
        val correctInstant = dt.toInstant(estOffset) // 8pm UTC

        val chronoResult = time(
            instant = correctInstant,
            localDateTime = dt,
            tz = TimeZone.of("America/New_York"),
            original = "3pm EST",
            method = "Chrono",
        )
        val geminiResult = time(
            instant = correctInstant, // After abbreviation correction
            localDateTime = dt,
            tz = TimeZone.of("America/New_York"),
            original = "3pm EST",
        )

        val merged = ResultMerger.mergeResults(listOf(chronoResult), listOf(geminiResult), "Gemini Nano")
        assertEquals(1, merged.size)
        assertEquals("Chrono + Gemini Nano", merged[0].method)
    }

    @Test
    fun `mergeResults - 3pm CST keeps both interpretations`() {
        // CST is ambiguous: US Central (-6) or China Standard (+8)
        val dt = LocalDateTime(2026, 1, 15, 15, 0)
        val chicagoInstant = dt.toInstant(TimeZone.of("America/Chicago"))  // 9pm UTC
        val shanghaiInstant = dt.toInstant(TimeZone.of("Asia/Shanghai"))   // 7am UTC

        val chronoResult = time(
            instant = chicagoInstant,
            localDateTime = dt,
            tz = TimeZone.of("America/Chicago"),
            original = "3pm CST",
            method = "Chrono",
        )
        val geminiResult = time(
            instant = shanghaiInstant,
            localDateTime = dt,
            tz = TimeZone.of("Asia/Shanghai"),
            original = "3pm CST",
        )

        val merged = ResultMerger.mergeResults(listOf(chronoResult), listOf(geminiResult), "Gemini Nano")
        // Different instants → genuinely different interpretations → keep both
        assertEquals(2, merged.size)
    }

    @Test
    fun `merge fails when Gemini results lack localDateTime`() {
        // This reproduces the ORIGINAL bug: Gemini didn't set localDateTime,
        // so fuzzy match couldn't deduplicate, producing 5 results instead of 3
        val vancouver = TimeZone.of("America/Vancouver")
        val la = TimeZone.of("America/Los_Angeles")
        val ny = TimeZone.of("America/New_York")
        val shanghai = TimeZone.of("Asia/Shanghai")
        val chicago = TimeZone.of("America/Chicago")

        val dt430 = LocalDateTime(2026, 4, 11, 4, 30)
        val dt730 = LocalDateTime(2026, 4, 11, 7, 30)
        val dt1930 = LocalDateTime(2026, 4, 11, 19, 30)

        val correctInstant = dt430.toInstant(vancouver)
        val wrongInstant = dt1930.toInstant(chicago)

        val chronoResults = listOf(
            ExtractedTime(instant = correctInstant, localDateTime = dt430, sourceTimezone = vancouver, originalText = "4:30 a.m. PT"),
            ExtractedTime(instant = correctInstant, localDateTime = dt730, sourceTimezone = ny, originalText = "7:30 a.m. ET"),
            ExtractedTime(instant = correctInstant, localDateTime = dt1930, sourceTimezone = shanghai, originalText = "19:30 CST"),
        )

        // Gemini results WITHOUT localDateTime (the old bug)
        val geminiResultsNoDt = listOf(
            ExtractedTime(instant = correctInstant, localDateTime = null, sourceTimezone = la, originalText = "April 11 at 4:30 a.m. PT"),
            ExtractedTime(instant = correctInstant, localDateTime = null, sourceTimezone = ny, originalText = "7:30 a.m. ET"),
            ExtractedTime(instant = wrongInstant, localDateTime = null, sourceTimezone = chicago, originalText = "19:30 CST"),
        )

        val merged = ResultMerger.mergeResults(chronoResults, geminiResultsNoDt, "Gemini Nano")

        // Without localDateTime, fuzzy match fails → 5 results (the bug)
        // Gemini ET has same instant+tz as Chrono ET → exact match → dedup to 1
        // Gemini PT has same instant but different tz (LA vs Vancouver) → no exact match
        //   AND no fuzzy match (localDateTime is null) → added as new → 4 results
        // Gemini CST has different instant AND no fuzzy match → added as new → 5 results
        assertEquals(
            "Without localDateTime, merge produces 5 (the bug): ${merged.map { "${it.originalText} tz=${it.sourceTimezone?.id}" }}",
            5, merged.size
        )
    }

    // ========== isSameInstant ==========

    @Test
    fun `isSameInstant - both have same instant returns true`() {
        val a = time(instant = baseInstant, tz = utc)
        val b = time(instant = baseInstant, tz = tokyo)
        assertTrue(ResultMerger.isSameInstant(a, b))
    }

    @Test
    fun `isSameInstant - both have different instants returns false`() {
        val other = LocalDateTime.parse("2026-04-06T15:00:00").toInstant(utc)
        val a = time(instant = baseInstant, tz = utc)
        val b = time(instant = other, tz = utc)
        assertFalse(ResultMerger.isSameInstant(a, b))
    }

    @Test
    fun `isSameInstant - no instants but same tz same local time returns true`() {
        val a = time(localDateTime = baseDt, tz = utc)
        val b = time(localDateTime = baseDt, tz = utc)
        assertTrue(ResultMerger.isSameInstant(a, b))
    }

    @Test
    fun `isSameInstant - no instants different tz returns false`() {
        val a = time(localDateTime = baseDt, tz = utc)
        val b = time(localDateTime = baseDt, tz = tokyo)
        assertFalse(ResultMerger.isSameInstant(a, b))
    }

    @Test
    fun `isSameInstant - one missing tz returns false`() {
        val a = time(localDateTime = baseDt, tz = utc)
        val b = time(localDateTime = baseDt, tz = null)
        assertFalse(ResultMerger.isSameInstant(a, b))
    }

    @Test
    fun `isSameInstant - Vancouver and LA same local time returns true`() {
        val vancouver = TimeZone.of("America/Vancouver")
        val la = TimeZone.of("America/Los_Angeles")
        val dt = LocalDateTime(2026, 4, 11, 4, 30)
        val a = time(localDateTime = dt, tz = vancouver)
        val b = time(localDateTime = dt, tz = la)
        // Vancouver and LA always have the same offset
        assertTrue(ResultMerger.isSameInstant(a, b))
    }
}
