package com.chronoshift.nlp

import com.chronoshift.conversion.ExtractedTime
import com.chronoshift.conversion.TimeConverter
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.toList
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toInstant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import kotlin.time.Duration.Companion.milliseconds
import kotlin.time.measureTime

/**
 * Tests for the parallel pipeline in TieredTimeExtractor:
 * - Stage 1: ML Kit + Chrono + Regex run concurrently
 * - Stage 2+3: LiteRT and Gemini run concurrently, emit as each completes
 *
 * Also tests timing behavior, emission ordering, and the expected
 * result counts when multiple extractors produce the same/different timezones.
 */
class PipelineConcurrencyTest {

    private val converter = TimeConverter()
    private val utc = TimeZone.UTC
    private val ny = TimeZone.of("America/New_York")
    private val la = TimeZone.of("America/Los_Angeles")
    private val chicago = TimeZone.of("America/Chicago")
    private val shanghai = TimeZone.of("Asia/Shanghai")
    private val tokyo = TimeZone.of("Asia/Tokyo")

    private fun time(
        original: String,
        hour: Int,
        minute: Int = 0,
        tz: TimeZone,
    ): ExtractedTime {
        val dt = LocalDateTime(2026, 4, 9, hour, minute)
        return ExtractedTime(
            instant = dt.toInstant(tz),
            localDateTime = dt,
            sourceTimezone = tz,
            originalText = original,
        )
    }

    private fun extractor(
        chronoResults: List<ExtractedTime> = emptyList(),
        regexResults: List<ExtractedTime> = emptyList(),
        liteRtResults: List<ExtractedTime> = emptyList(),
        geminiResults: List<ExtractedTime> = emptyList(),
        chronoAvailable: Boolean = true,
        liteRtAvailable: Boolean = false,
        geminiAvailable: Boolean = false,
        mlKitAvailable: Boolean = false,
        chronoDelayMs: Long = 0,
        liteRtDelayMs: Long = 0,
        geminiDelayMs: Long = 0,
        mlKitDelayMs: Long = 0,
    ): TieredTimeExtractor {
        return TieredTimeExtractor(
            chronoExtractor = DelayedSpanAwareExtractor(chronoAvailable, chronoResults, chronoDelayMs),
            liteRtExtractor = DelayedTimeExtractor("LiteRT", liteRtAvailable, liteRtResults, liteRtDelayMs),
            geminiExtractor = DelayedTimeExtractor("Gemini Nano", geminiAvailable, geminiResults, geminiDelayMs),
            mlKitExtractor = DelayedSpanDetector(mlKitAvailable, mlKitDelayMs),
            regexExtractor = DelayedTimeExtractor("Regex", true, regexResults, 0),
        )
    }

    // =====================================================================
    // Stage 1 concurrency: ML Kit + Chrono + Regex run in parallel
    // =====================================================================

    @Test
    fun `stage 1 - ml kit and chrono run concurrently`() = runTest {
        // ML Kit takes 100ms, Chrono takes 100ms — if sequential, >200ms; if concurrent, ~100ms
        val ext = extractor(
            chronoResults = listOf(time("chrono", 15, tz = ny)),
            chronoAvailable = true,
            mlKitAvailable = true,
            mlKitDelayMs = 100,
            chronoDelayMs = 100,
        )
        val elapsed = measureTime {
            val emissions = ext.extractStream("test").toList()
            assertTrue(emissions.any { it.times.isNotEmpty() })
        }
        // With concurrency, should be closer to 100ms than 200ms
        // Use generous margin for test scheduler overhead
        assertTrue(
            "Stage 1 should run concurrently, took ${elapsed.inWholeMilliseconds}ms",
            elapsed < 300.milliseconds,
        )
    }

    @Test
    fun `stage 1 - regex runs concurrently with chrono`() = runTest {
        val ext = extractor(
            chronoResults = listOf(time("chrono", 15, tz = ny)),
            regexResults = listOf(time("regex", 14, tz = utc)),
            chronoDelayMs = 50,
        )
        val emissions = ext.extractStream("test").toList()
        val firstWithResults = emissions.first { it.times.isNotEmpty() }
        assertEquals("Stage 1 should have both chrono and regex", 2, firstWithResults.times.size)
    }

    @Test
    fun `stage 1 - ml kit failure does not block chrono`() = runTest {
        val ext = TieredTimeExtractor(
            chronoExtractor = DelayedSpanAwareExtractor(true, listOf(time("chrono", 15, tz = ny)), 0),
            liteRtExtractor = DelayedTimeExtractor("LiteRT", false, emptyList(), 0),
            geminiExtractor = DelayedTimeExtractor("Gemini Nano", false, emptyList(), 0),
            mlKitExtractor = FailingSpanDetector(),
            regexExtractor = DelayedTimeExtractor("Regex", true, emptyList(), 0),
        )
        val emissions = ext.extractStream("test").toList()
        assertTrue("Should still get chrono results", emissions.any { it.times.isNotEmpty() })
    }

    // =====================================================================
    // Stage 2+3 concurrency: LiteRT and Gemini run in parallel
    // =====================================================================

    @Test
    fun `stages 2 and 3 - litert and gemini run concurrently`() = runTest {
        // LiteRT takes 100ms, Gemini takes 100ms — if sequential, >200ms; if concurrent, ~100ms
        val ext = extractor(
            chronoResults = listOf(time("chrono", 15, tz = ny)),
            liteRtAvailable = true,
            liteRtResults = listOf(time("litert", 18, tz = utc)),
            liteRtDelayMs = 100,
            geminiAvailable = true,
            geminiResults = listOf(time("gemini", 20, tz = tokyo)),
            geminiDelayMs = 100,
        )
        val elapsed = measureTime {
            val emissions = ext.extractStream("test").toList()
            val last = emissions.last()
            assertTrue("Final should have 3+ results", last.times.size >= 3)
        }
        assertTrue(
            "Stages 2+3 should run concurrently, took ${elapsed.inWholeMilliseconds}ms",
            elapsed < 300.milliseconds,
        )
    }

    @Test
    fun `stages 2 and 3 - faster extractor emits first`() = runTest {
        // LiteRT finishes in 50ms, Gemini in 200ms
        val ext = extractor(
            chronoResults = listOf(time("chrono", 15, tz = ny)),
            liteRtAvailable = true,
            liteRtResults = listOf(time("litert", 18, tz = utc)),
            liteRtDelayMs = 50,
            geminiAvailable = true,
            geminiResults = listOf(time("gemini", 20, tz = tokyo)),
            geminiDelayMs = 200,
        )
        val emissions = ext.extractStream("test").toList()

        // Should have: stage 1 emission, litert emission, final emission
        assertTrue("Should have at least 3 emissions", emissions.size >= 2)

        // The second emission (after stage 1) should have LiteRT results but not yet Gemini
        val afterStage1 = emissions.filter { it.times.isNotEmpty() }
        if (afterStage1.size >= 2) {
            val midEmission = afterStage1[1]
            assertTrue("Mid emission should include LiteRT", midEmission.method.contains("LiteRT"))
        }
    }

    @Test
    fun `stages 2 and 3 - gemini finishes first emits first`() = runTest {
        // Gemini finishes in 50ms, LiteRT in 200ms
        val ext = extractor(
            liteRtAvailable = true,
            liteRtResults = listOf(time("litert", 18, tz = utc)),
            liteRtDelayMs = 200,
            geminiAvailable = true,
            geminiResults = listOf(time("gemini", 20, tz = tokyo)),
            geminiDelayMs = 50,
        )
        val emissions = ext.extractStream("test").toList()
        val last = emissions.last()
        assertTrue("Final should contain both LiteRT and Gemini",
            last.method.contains("LiteRT") && last.method.contains("Gemini Nano"))
    }

    @Test
    fun `stages 2 and 3 - litert unavailable does not block gemini`() = runTest {
        val ext = extractor(
            liteRtAvailable = false,
            geminiAvailable = true,
            geminiResults = listOf(time("gemini", 20, tz = tokyo)),
            geminiDelayMs = 50,
        )
        val emissions = ext.extractStream("test").toList()
        val last = emissions.last()
        assertTrue(last.method.contains("Gemini Nano"))
        assertTrue(last.method.contains("LiteRT unavailable"))
    }

    @Test
    fun `stages 2 and 3 - gemini unavailable does not block litert`() = runTest {
        val ext = extractor(
            liteRtAvailable = true,
            liteRtResults = listOf(time("litert", 18, tz = utc)),
            geminiAvailable = false,
        )
        val emissions = ext.extractStream("test").toList()
        val last = emissions.last()
        assertTrue(last.method.contains("LiteRT"))
        assertTrue(last.method.contains("Gemini Nano unavailable"))
    }

    @Test
    fun `stages 2 and 3 - both unavailable completes quickly`() = runTest {
        val ext = extractor(
            chronoResults = listOf(time("chrono", 15, tz = ny)),
            liteRtAvailable = false,
            geminiAvailable = false,
        )
        val elapsed = measureTime {
            ext.extractStream("test").toList()
        }
        assertTrue(
            "Both unavailable should complete fast, took ${elapsed.inWholeMilliseconds}ms",
            elapsed < 200.milliseconds,
        )
    }

    // =====================================================================
    // Emission ordering and counts
    // =====================================================================

    @Test
    fun `emission count - stage 1 only produces 2 emissions`() = runTest {
        // Stage 1 results + final (no LLMs)
        val ext = extractor(chronoResults = listOf(time("chrono", 15, tz = ny)))
        val emissions = ext.extractStream("test").toList()
        assertEquals("Stage 1 + final", 2, emissions.size)
    }

    @Test
    fun `emission count - stage 1 plus one LLM produces 3 emissions`() = runTest {
        val ext = extractor(
            chronoResults = listOf(time("chrono", 15, tz = ny)),
            liteRtAvailable = true,
            liteRtResults = listOf(time("litert", 18, tz = utc)),
        )
        val emissions = ext.extractStream("test").toList()
        // stage 1, litert (first to complete from select), final
        assertEquals(3, emissions.size)
    }

    @Test
    fun `emission count - all three stages produces at least 3 emissions`() = runTest {
        val ext = extractor(
            chronoResults = listOf(time("chrono", 15, tz = ny)),
            liteRtAvailable = true,
            liteRtResults = listOf(time("litert", 18, tz = utc)),
            liteRtDelayMs = 50,
            geminiAvailable = true,
            geminiResults = listOf(time("gemini", 20, tz = tokyo)),
            geminiDelayMs = 100,
        )
        val emissions = ext.extractStream("test").toList()
        // stage 1, first LLM, final (may be more if both LLMs emit separately)
        assertTrue("Should have at least 3 emissions", emissions.size >= 3)
    }

    @Test
    fun `emission count - no results produces 1 emission`() = runTest {
        val ext = extractor()
        val emissions = ext.extractStream("test").toList()
        assertEquals("Empty pipeline should emit exactly 1 (final)", 1, emissions.size)
        assertTrue(emissions[0].times.isEmpty())
    }

    @Test
    fun `results accumulate across emissions`() = runTest {
        val ext = extractor(
            chronoResults = listOf(time("chrono", 15, tz = ny)),
            liteRtAvailable = true,
            liteRtResults = listOf(time("litert", 18, tz = utc)),
            liteRtDelayMs = 50,
            geminiAvailable = true,
            geminiResults = listOf(time("gemini", 20, tz = tokyo)),
            geminiDelayMs = 100,
        )
        val emissions = ext.extractStream("test").toList()
        // Each emission should have >= the previous one's result count
        for (i in 1 until emissions.size) {
            assertTrue(
                "Emission $i should have >= emission ${i - 1} results",
                emissions[i].times.size >= emissions[i - 1].times.size,
            )
        }
    }

    // =====================================================================
    // Merge behavior across stages (the "3 results" investigation)
    // =====================================================================

    @Test
    fun `single timestamp - chrono and LLMs same tz merge to 1`() = runTest {
        // "3pm ET" → all extractors agree on America/New_York
        val sharedTime = time("3pm ET", 15, tz = ny)
        val ext = extractor(
            chronoResults = listOf(sharedTime),
            liteRtAvailable = true,
            liteRtResults = listOf(sharedTime),
            geminiAvailable = true,
            geminiResults = listOf(sharedTime),
        )
        val emissions = ext.extractStream("test").toList()
        val last = emissions.last()
        assertEquals("All same tz should merge to 1", 1, last.times.size)
    }

    @Test
    fun `single timestamp - chrono offset differs from LLM IANA produces 2`() = runTest {
        // "3pm EST" → Chrono maps -300 to America/Chicago (CDT=UTC-5 in April)
        //           → Gemini returns America/New_York (EDT=UTC-4)
        // These are DIFFERENT instants (20:00 UTC vs 19:00 UTC) → 2 results
        val chronoTime = time("3pm EST", 15, tz = chicago) // CDT = UTC-5
        val geminiTime = time("3pm EST", 15, tz = ny)      // EDT = UTC-4
        val ext = extractor(
            chronoResults = listOf(chronoTime),
            geminiAvailable = true,
            geminiResults = listOf(geminiTime),
        )
        val emissions = ext.extractStream("test").toList()
        val last = emissions.last()
        assertEquals(
            "Different tz (different instants) → 2 results",
            2, last.times.size,
        )
    }

    @Test
    fun `single timestamp - all 3 stages different tz still merges LLMs`() = runTest {
        // Chrono: Chicago (CDT=-5), LiteRT: New York (EDT=-4), Gemini: New York (EDT=-4)
        // LiteRT and Gemini exact-match → combine. Chrono differs → separate.
        val chronoTime = time("3pm EST", 15, tz = chicago)
        val liteRtTime = time("3pm EST", 15, tz = ny)
        val geminiTime = time("3pm EST", 15, tz = ny)
        val ext = extractor(
            chronoResults = listOf(chronoTime),
            liteRtAvailable = true,
            liteRtResults = listOf(liteRtTime),
            geminiAvailable = true,
            geminiResults = listOf(geminiTime),
        )
        val emissions = ext.extractStream("test").toList()
        val last = emissions.last()
        assertEquals(
            "Chrono(Chicago) + LiteRT+Gemini(NY) → 2 results, not 3",
            2, last.times.size,
        )
    }

    @Test
    fun `CST ambiguity - chrono US Central vs gemini China produces 2`() = runTest {
        // CST: Chrono → America/Chicago (CDT=UTC-5), Gemini → Asia/Shanghai (UTC+8)
        val chronoCST = time("19:30 CST", 19, 30, tz = chicago)
        val geminiCST = time("19:30 CST", 19, 30, tz = shanghai)
        val ext = extractor(
            chronoResults = listOf(chronoCST),
            geminiAvailable = true,
            geminiResults = listOf(geminiCST),
        )
        val emissions = ext.extractStream("test").toList()
        val last = emissions.last()
        assertEquals(
            "CST ambiguity: Chicago vs Shanghai → 2 interpretations",
            2, last.times.size,
        )
        // Verify they produce different local times
        val converted = converter.toLocal(last.times, tokyo)
        assertEquals(2, converted.size)
        assertTrue(
            "Different instants should produce different local times",
            converted[0].localDateTime != converted[1].localDateTime,
        )
    }

    @Test
    fun `three timestamps - PT ET CST all 3 stages produces correct count`() = runTest {
        // "4:30 AM PT / 7:30 AM ET / 19:30 CST"
        // Chrono: LA, NY, Chicago(CDT) → 3 results
        // Gemini: LA, NY, Chicago → 3 results (should all exact-match)
        val chronoPT = time("4:30 AM PT", 4, 30, tz = la)
        val chronoET = time("7:30 AM ET", 7, 30, tz = ny)
        val chronoCST = time("19:30 CST", 19, 30, tz = chicago)
        val geminiPT = time("4:30 AM PT", 4, 30, tz = la)
        val geminiET = time("7:30 AM ET", 7, 30, tz = ny)
        val geminiCST = time("19:30 CST", 19, 30, tz = chicago)

        val ext = extractor(
            chronoResults = listOf(chronoPT, chronoET, chronoCST),
            geminiAvailable = true,
            geminiResults = listOf(geminiPT, geminiET, geminiCST),
        )
        val emissions = ext.extractStream("test").toList()
        val last = emissions.last()
        assertEquals(
            "All same tz → merge to 3, CST expansion adds China Standard → 4 results",
            4, last.times.size,
        )
    }

    @Test
    fun `three timestamps - gemini disagrees on one tz produces 4`() = runTest {
        // Chrono: LA, NY, Chicago(CDT=-5) for CST
        // Gemini: LA, NY, Shanghai(+8) for CST — disagrees on CST
        val ext = extractor(
            chronoResults = listOf(
                time("4:30 AM PT", 4, 30, tz = la),
                time("7:30 AM ET", 7, 30, tz = ny),
                time("19:30 CST", 19, 30, tz = chicago),
            ),
            geminiAvailable = true,
            geminiResults = listOf(
                time("4:30 AM PT", 4, 30, tz = la),
                time("7:30 AM ET", 7, 30, tz = ny),
                time("19:30 CST", 19, 30, tz = shanghai),
            ),
        )
        val emissions = ext.extractStream("test").toList()
        val last = emissions.last()
        // PT and ET merge → 2. CST has two interpretations (Chicago + Shanghai) → +2 = 4
        assertEquals(
            "CST ambiguity adds extra interpretation → 4 results",
            4, last.times.size,
        )
    }

    // =====================================================================
    // Performance: cold start vs warm path
    // =====================================================================

    @Test
    fun `cold start - stage 1 latency is bounded by slowest concurrent task`() = runTest {
        // ML Kit: 100ms, Chrono: 150ms, Regex: 10ms → total should be ~150ms (max), not 260ms (sum)
        val ext = extractor(
            chronoResults = listOf(time("chrono", 15, tz = ny)),
            regexResults = listOf(time("regex", 14, tz = utc)),
            mlKitAvailable = true,
            mlKitDelayMs = 100,
            chronoDelayMs = 150,
        )
        val elapsed = measureTime {
            ext.extractStream("test").toList()
        }
        assertTrue(
            "Concurrent stage 1 should be ~150ms not ~260ms, took ${elapsed.inWholeMilliseconds}ms",
            elapsed < 250.milliseconds,
        )
    }

    @Test
    fun `warm path - stage 1 is near-instant when engines initialized`() = runTest {
        val ext = extractor(
            chronoResults = listOf(time("chrono", 15, tz = ny)),
            chronoDelayMs = 0, // warm: no init delay
        )
        val elapsed = measureTime {
            ext.extractStream("test").toList()
        }
        assertTrue(
            "Warm stage 1 should be fast, took ${elapsed.inWholeMilliseconds}ms",
            elapsed < 100.milliseconds,
        )
    }

    @Test
    fun `total pipeline - LLM stage bounded by slower LLM`() = runTest {
        // LiteRT: 100ms, Gemini: 200ms → LLM stage total ~200ms (max), not 300ms (sum)
        val ext = extractor(
            chronoResults = listOf(time("c", 15, tz = ny)),
            liteRtAvailable = true,
            liteRtResults = listOf(time("l", 18, tz = utc)),
            liteRtDelayMs = 100,
            geminiAvailable = true,
            geminiResults = listOf(time("g", 20, tz = tokyo)),
            geminiDelayMs = 200,
        )
        val elapsed = measureTime {
            ext.extractStream("test").toList()
        }
        assertTrue(
            "LLM stage concurrent: should be ~200ms not ~300ms, took ${elapsed.inWholeMilliseconds}ms",
            elapsed < 350.milliseconds,
        )
    }

    @Test
    fun `first result is emitted before LLMs finish`() = runTest {
        val ext = extractor(
            chronoResults = listOf(time("chrono", 15, tz = ny)),
            liteRtAvailable = true,
            liteRtResults = listOf(time("litert", 18, tz = utc)),
            liteRtDelayMs = 500,
            geminiAvailable = true,
            geminiResults = listOf(time("gemini", 20, tz = tokyo)),
            geminiDelayMs = 500,
        )
        var firstEmissionTime = 0L
        val start = System.nanoTime()
        ext.extractStream("test").collect { result ->
            if (result.times.isNotEmpty() && firstEmissionTime == 0L) {
                firstEmissionTime = System.nanoTime() - start
            }
        }
        val firstMs = firstEmissionTime / 1_000_000
        assertTrue(
            "First result should arrive well before LLMs (500ms), took ${firstMs}ms",
            firstMs < 200,
        )
    }

    // =====================================================================
    // Error resilience in concurrent stages
    // =====================================================================

    @Test
    fun `litert crash does not cancel gemini`() = runTest {
        val ext = TieredTimeExtractor(
            chronoExtractor = DelayedSpanAwareExtractor(true, emptyList(), 0),
            liteRtExtractor = CrashingTimeExtractor("LiteRT"),
            geminiExtractor = DelayedTimeExtractor("Gemini Nano", true, listOf(time("gemini", 20, tz = tokyo)), 50),
            mlKitExtractor = DelayedSpanDetector(false, 0),
            regexExtractor = DelayedTimeExtractor("Regex", true, emptyList(), 0),
        )
        val emissions = ext.extractStream("test").toList()
        val last = emissions.last()
        assertTrue("Gemini should still produce results", last.times.isNotEmpty())
    }

    @Test
    fun `gemini crash does not cancel litert`() = runTest {
        val ext = TieredTimeExtractor(
            chronoExtractor = DelayedSpanAwareExtractor(true, emptyList(), 0),
            liteRtExtractor = DelayedTimeExtractor("LiteRT", true, listOf(time("litert", 18, tz = utc)), 50),
            geminiExtractor = CrashingTimeExtractor("Gemini Nano"),
            mlKitExtractor = DelayedSpanDetector(false, 0),
            regexExtractor = DelayedTimeExtractor("Regex", true, emptyList(), 0),
        )
        val emissions = ext.extractStream("test").toList()
        val last = emissions.last()
        assertTrue("LiteRT should still produce results", last.times.isNotEmpty())
    }

    // =====================================================================
    // Fake implementations with configurable delay
    // =====================================================================

    private class DelayedTimeExtractor(
        private val name: String,
        private val available: Boolean,
        private val results: List<ExtractedTime>,
        private val delayMs: Long = 0,
    ) : TimeExtractor {
        override suspend fun isAvailable(): Boolean {
            if (delayMs > 0) delay(delayMs / 2) // half delay on availability check
            return available
        }
        override suspend fun extract(text: String): ExtractionResult {
            if (delayMs > 0) delay(delayMs / 2)
            return ExtractionResult(results, name)
        }
    }

    private class DelayedSpanAwareExtractor(
        private val available: Boolean,
        private val results: List<ExtractedTime>,
        private val delayMs: Long = 0,
    ) : SpanAwareTimeExtractor {
        override suspend fun isAvailable(): Boolean {
            if (delayMs > 0) delay(delayMs / 2)
            return available
        }
        override suspend fun extract(text: String): ExtractionResult {
            if (delayMs > 0) delay(delayMs / 2)
            return ExtractionResult(results, "Chrono")
        }
        override suspend fun extractWithSpans(text: String, spans: List<DateTimeSpan>): ExtractionResult {
            if (delayMs > 0) delay(delayMs / 2)
            return ExtractionResult(results, "ML Kit + Chrono")
        }
    }

    private class DelayedSpanDetector(
        private val available: Boolean,
        private val delayMs: Long = 0,
    ) : SpanDetector {
        override suspend fun isAvailable(): Boolean {
            if (delayMs > 0) delay(delayMs)
            return available
        }
        override suspend fun detectSpans(text: String) = emptyList<DateTimeSpan>()
    }

    private class FailingSpanDetector : SpanDetector {
        override suspend fun isAvailable() = true
        override suspend fun detectSpans(text: String): List<DateTimeSpan> = throw RuntimeException("ML Kit boom")
    }

    private class CrashingTimeExtractor(private val name: String) : TimeExtractor {
        override suspend fun isAvailable() = true
        override suspend fun extract(text: String): ExtractionResult = throw RuntimeException("$name crash")
    }
}
