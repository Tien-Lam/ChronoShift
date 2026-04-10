package com.chronoshift.nlp

import com.chronoshift.conversion.ExtractedTime
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class TieredTimeExtractorTest {

    private val utc = TimeZone.UTC

    private fun time(
        original: String = "test",
        hour: Int = 14,
        tz: TimeZone = utc,
    ): ExtractedTime {
        val dt = LocalDateTime(2026, 4, 9, hour, 0)
        return ExtractedTime(
            instant = Instant.parse("2026-04-09T${hour.toString().padStart(2, '0')}:00:00Z"),
            localDateTime = dt,
            sourceTimezone = tz,
            originalText = original,
        )
    }

    private fun extractor(
        chronoResults: List<ExtractedTime> = emptyList(),
        liteRtResults: List<ExtractedTime> = emptyList(),
        geminiResults: List<ExtractedTime> = emptyList(),
        regexResults: List<ExtractedTime> = emptyList(),
        chronoAvailable: Boolean = true,
        liteRtAvailable: Boolean = false,
        geminiAvailable: Boolean = false,
        mlKitAvailable: Boolean = false,
        chronoThrows: Boolean = false,
        liteRtThrows: Boolean = false,
        mlKitSpans: List<DateTimeSpan> = emptyList(),
    ): TieredTimeExtractor {
        return TieredTimeExtractor(
            chronoExtractor = FakeSpanAwareExtractor(chronoAvailable, chronoResults, chronoThrows),
            liteRtExtractor = FakeTimeExtractor("LiteRT", liteRtAvailable, liteRtResults, liteRtThrows),
            geminiExtractor = FakeTimeExtractor("Gemini Nano", geminiAvailable, geminiResults),
            mlKitExtractor = FakeSpanDetector(mlKitAvailable, mlKitSpans),
            regexExtractor = FakeTimeExtractor("Regex", true, regexResults),
        )
    }

    // ========== Basic streaming ==========

    @Test
    fun `emits results from chrono`() = runTest {
        val t = time("3pm")
        val ext = extractor(chronoResults = listOf(t))
        val emissions = ext.extractStream("3pm").toList()

        assertTrue("Should emit at least once", emissions.isNotEmpty())
        assertTrue("Should contain chrono result", emissions.any { it.times.isNotEmpty() })
    }

    @Test
    fun `emits results from regex`() = runTest {
        val t = time("1712678400")
        val ext = extractor(regexResults = listOf(t))
        val emissions = ext.extractStream("1712678400").toList()

        assertTrue(emissions.isNotEmpty())
        assertTrue(emissions.any { it.times.isNotEmpty() })
    }

    @Test
    fun `no results from any extractor emits final with empty times`() = runTest {
        val ext = extractor()
        val emissions = ext.extractStream("nothing").toList()

        assertTrue("Should emit at least final", emissions.isNotEmpty())
        val last = emissions.last()
        assertTrue("Final emission should be empty", last.times.isEmpty())
    }

    // ========== Multi-stage merging ==========

    @Test
    fun `chrono and regex merge into first emission`() = runTest {
        val chronoTime = time("3pm chrono", hour = 15)
        val regexTime = time("1712678400", hour = 14)
        val ext = extractor(chronoResults = listOf(chronoTime), regexResults = listOf(regexTime))
        val emissions = ext.extractStream("test").toList()

        val firstWithResults = emissions.first { it.times.isNotEmpty() }
        assertEquals(2, firstWithResults.times.size)
    }

    @Test
    fun `litert adds to chrono results in stage 2`() = runTest {
        val chronoTime = time("chrono", hour = 15)
        val liteRtTime = time("litert new", hour = 18)
        val ext = extractor(
            chronoResults = listOf(chronoTime),
            liteRtAvailable = true,
            liteRtResults = listOf(liteRtTime),
        )
        val emissions = ext.extractStream("test").toList()

        assertTrue("Should have at least 2 emissions", emissions.size >= 2)
        val last = emissions.last()
        assertTrue("Final should have 2+ results", last.times.size >= 2)
    }

    @Test
    fun `gemini adds to merged results in stage 3`() = runTest {
        val chronoTime = time("chrono", hour = 15)
        val geminiTime = time("gemini new", hour = 20)
        val ext = extractor(
            chronoResults = listOf(chronoTime),
            geminiAvailable = true,
            geminiResults = listOf(geminiTime),
        )
        val emissions = ext.extractStream("test").toList()

        val last = emissions.last()
        assertTrue("Final should have 2+ results", last.times.size >= 2)
    }

    @Test
    fun `duplicate results across stages are merged`() = runTest {
        val sharedTime = time("3pm", hour = 15, tz = utc)
        val ext = extractor(
            chronoResults = listOf(sharedTime),
            geminiAvailable = true,
            geminiResults = listOf(sharedTime),
        )
        val emissions = ext.extractStream("test").toList()
        val last = emissions.last()

        assertEquals("Duplicates should merge to 1", 1, last.times.size)
        assertTrue("Method should combine", last.times[0].method.contains("+"))
    }

    // ========== Three stages together ==========

    @Test
    fun `all three stages produce combined results`() = runTest {
        val ext = extractor(
            chronoResults = listOf(time("chrono", hour = 10)),
            liteRtAvailable = true,
            liteRtResults = listOf(time("litert", hour = 14)),
            geminiAvailable = true,
            geminiResults = listOf(time("gemini", hour = 18)),
        )
        val emissions = ext.extractStream("test").toList()
        val last = emissions.last()

        assertEquals("Should have 3 unique results", 3, last.times.size)
    }

    @Test
    fun `stage 2 emission includes stage 1 results`() = runTest {
        val ext = extractor(
            chronoResults = listOf(time("chrono", hour = 10)),
            liteRtAvailable = true,
            liteRtResults = listOf(time("litert", hour = 14)),
        )
        val emissions = ext.extractStream("test").toList()

        val stage1 = emissions.first { it.times.isNotEmpty() }
        assertEquals(1, stage1.times.size)

        val liteRtEmissions = emissions.filter { it.times.size >= 2 }
        assertTrue("Should have a stage 2 emission with both results", liteRtEmissions.isNotEmpty())
    }

    // ========== Availability ==========

    @Test
    fun `unavailable extractors are skipped`() = runTest {
        val ext = extractor(
            chronoAvailable = false,
            liteRtAvailable = false,
            geminiAvailable = false,
        )
        val emissions = ext.extractStream("test").toList()
        val last = emissions.last()
        assertTrue(last.times.isEmpty())
    }

    @Test
    fun `method label shows unavailable extractors`() = runTest {
        val ext = extractor(
            liteRtAvailable = false,
            geminiAvailable = false,
        )
        val emissions = ext.extractStream("test").toList()
        val last = emissions.last()
        assertTrue("Should mention unavailable", last.method.contains("unavailable"))
    }

    @Test
    fun `only regex available still produces results`() = runTest {
        val regexTime = time("1712678400")
        val ext = extractor(
            chronoAvailable = false,
            regexResults = listOf(regexTime),
        )
        val emissions = ext.extractStream("test").toList()
        assertTrue(emissions.any { it.times.isNotEmpty() })
    }

    @Test
    fun `method label lists all ran extractors`() = runTest {
        val ext = extractor(
            chronoResults = listOf(time("c")),
            regexResults = listOf(time("r", hour = 15)),
            liteRtAvailable = true,
            liteRtResults = listOf(time("l", hour = 16)),
        )
        val emissions = ext.extractStream("test").toList()
        val last = emissions.last()
        assertTrue("Method should contain Chrono", last.method.contains("Chrono"))
        assertTrue("Method should contain Regex", last.method.contains("Regex"))
        assertTrue("Method should contain LiteRT", last.method.contains("LiteRT"))
    }

    // ========== Error handling ==========

    @Test
    fun `chrono failure does not crash pipeline`() = runTest {
        val ext = extractor(
            chronoThrows = true,
            regexResults = listOf(time("regex")),
        )
        val emissions = ext.extractStream("test").toList()
        assertTrue("Should still emit regex results", emissions.any { it.times.isNotEmpty() })
    }

    @Test
    fun `litert failure does not crash pipeline`() = runTest {
        val chronoTime = time("chrono")
        val ext = extractor(
            chronoResults = listOf(chronoTime),
            liteRtAvailable = true,
            liteRtThrows = true,
        )
        val emissions = ext.extractStream("test").toList()
        assertTrue("Should still have chrono results", emissions.any { it.times.isNotEmpty() })
    }

    // ========== extract (non-streaming) ==========

    @Test
    fun `extract returns last emission`() = runTest {
        val t = time("result")
        val ext = extractor(chronoResults = listOf(t))
        val result = ext.extract("test")
        assertTrue(result.times.isNotEmpty())
    }

    @Test
    fun `isAvailable always returns true`() = runTest {
        val ext = extractor()
        assertTrue(ext.isAvailable())
    }

    // ========== ML Kit span detection integration ==========

    @Test
    fun `ml kit spans are passed to chrono extractWithSpans`() = runTest {
        val spanResult = time("span result", hour = 10)
        val ext = extractor(
            chronoResults = listOf(spanResult),
            mlKitAvailable = true,
            mlKitSpans = listOf(DateTimeSpan("3pm", 0, 3, 0)),
        )
        val emissions = ext.extractStream("3pm").toList()
        assertTrue(emissions.any { e ->
            e.times.isNotEmpty() && e.method.contains("ML Kit")
        })
    }

    @Test
    fun `ml kit failure falls back to regular chrono extract`() = runTest {
        val result = time("chrono result")
        val ext = TieredTimeExtractor(
            chronoExtractor = FakeSpanAwareExtractor(true, listOf(result)),
            liteRtExtractor = FakeTimeExtractor("LiteRT", false, emptyList()),
            geminiExtractor = FakeTimeExtractor("Gemini Nano", false, emptyList()),
            mlKitExtractor = FailingSpanDetector(),
            regexExtractor = FakeTimeExtractor("Regex", true, emptyList()),
        )
        val emissions = ext.extractStream("test").toList()
        assertTrue("Should still get chrono results", emissions.any { it.times.isNotEmpty() })
    }

    // ========== Fake implementations ==========

    private class FakeSpanAwareExtractor(
        private val available: Boolean,
        private val results: List<ExtractedTime>,
        private val throws: Boolean = false,
    ) : SpanAwareTimeExtractor {
        override suspend fun isAvailable() = available
        override suspend fun extract(text: String): ExtractionResult {
            if (throws) throw RuntimeException("boom")
            return ExtractionResult(results, "Chrono")
        }
        override suspend fun extractWithSpans(text: String, spans: List<DateTimeSpan>): ExtractionResult {
            if (throws) throw RuntimeException("boom")
            return ExtractionResult(results, "ML Kit + Chrono")
        }
    }

    private class FakeSpanDetector(
        private val available: Boolean,
        private val spans: List<DateTimeSpan> = emptyList(),
    ) : SpanDetector {
        override suspend fun isAvailable() = available
        override suspend fun detectSpans(text: String) = spans
    }

    private class FailingSpanDetector : SpanDetector {
        override suspend fun isAvailable() = true
        override suspend fun detectSpans(text: String): List<DateTimeSpan> = throw RuntimeException("ML Kit boom")
    }

    private class FakeTimeExtractor(
        private val name: String,
        private val available: Boolean,
        private val results: List<ExtractedTime>,
        private val throws: Boolean = false,
    ) : TimeExtractor {
        override suspend fun isAvailable() = available
        override suspend fun extract(text: String): ExtractionResult {
            if (throws) throw RuntimeException("$name boom")
            return ExtractionResult(results, name)
        }
    }
}
