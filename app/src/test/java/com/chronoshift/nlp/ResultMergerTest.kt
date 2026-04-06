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
    fun `mergeResults - fuzzy match both have tz keeps existing`() {
        val existing = listOf(time(localDateTime = baseDt, tz = tokyo, method = "Chrono"))
        val incoming = listOf(time(localDateTime = baseDt, tz = newYork))
        val result = ResultMerger.mergeResults(existing, incoming, "Regex")
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
    fun `combineMethod - empty existing returns combined with new`() {
        assertEquals(" + Regex", ResultMerger.combineMethod("", "Regex"))
    }

    @Test
    fun `combineMethod - empty new returns existing`() {
        assertEquals("Chrono", ResultMerger.combineMethod("Chrono", ""))
    }
}
