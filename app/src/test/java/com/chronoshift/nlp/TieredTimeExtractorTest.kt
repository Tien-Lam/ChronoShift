package com.chronoshift.nlp

import com.chronoshift.conversion.ExtractedTime
import kotlinx.coroutines.test.runTest
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class TieredTimeExtractorTest {

    @Test
    fun `regex extractor handles real input correctly`() = runTest {
        val extractor = RegexExtractor()
        val results = extractor.extract("meeting at 3:00 PM EST")
        assertEquals(1, results.size)
        assertEquals(TimeZone.of("America/New_York"), results[0].sourceTimezone)
        assertEquals(15, results[0].localDateTime!!.hour)
    }

    @Test
    fun `regex preserves timezone that mlkit would lose`() = runTest {
        val regexExtractor = RegexExtractor()

        val regexResults = regexExtractor.extract("9:00 a.m. EST")
        assertEquals(1, regexResults.size)
        assertEquals(TimeZone.of("America/New_York"), regexResults[0].sourceTimezone)

        // ML Kit would return timestamp without timezone — that was the "Z" bug
        val mlKitResult = ExtractedTime(
            localDateTime = LocalDateTime(2026, 4, 9, 9, 0),
            sourceTimezone = null,
            originalText = "9:00 a.m.",
            confidence = 0.75f,
        )
        assertTrue("ML Kit loses timezone", mlKitResult.sourceTimezone == null)
        assertNotNull("Regex preserves timezone", regexResults[0].sourceTimezone)
    }

    @Test
    fun `complex multi-timezone string`() = runTest {
        val extractor = RegexExtractor()
        val results = extractor.extract("April 9 at 9:00 a.m. PT / 12:00 p.m. ET")

        val ptResults = results.filter { it.sourceTimezone == TimeZone.of("America/Los_Angeles") }
        val etResults = results.filter { it.sourceTimezone == TimeZone.of("America/New_York") }

        assertTrue("Should find PT results, got: ${results.map { "${it.originalText} -> ${it.sourceTimezone}" }}", ptResults.isNotEmpty())
        assertTrue("Should find ET results", etResults.isNotEmpty())
    }

    @Test
    fun `deduplication removes substrings`() = runTest {
        val extractor = RegexExtractor()
        // "April 9 at 9:00 a.m. PT" should produce one result (the full date+time),
        // not also "9:00 a.m. PT" separately
        val results = extractor.extract("April 9 at 9:00 a.m. PT")
        assertEquals(
            "Should have exactly 1 result after dedup, got: ${results.map { it.originalText }}",
            1, results.size
        )
    }
}
