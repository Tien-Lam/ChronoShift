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
        val extractor = RegexExtractor(TestCityResolver())
        val result = extractor.extract("meeting at 3:00 PM EST")
        assertEquals(1, result.times.size)
        assertEquals("Regex", result.method)
        assertEquals(TimeZone.of("America/New_York"), result.times[0].sourceTimezone)
        assertEquals(15, result.times[0].localDateTime!!.hour)
    }

    @Test
    fun `regex preserves timezone that mlkit would lose`() = runTest {
        val regexExtractor = RegexExtractor(TestCityResolver())

        val regexResult = regexExtractor.extract("9:00 a.m. EST")
        assertEquals(1, regexResult.times.size)
        assertEquals(TimeZone.of("America/New_York"), regexResult.times[0].sourceTimezone)

        val mlKitResult = ExtractedTime(
            localDateTime = LocalDateTime(2026, 4, 9, 9, 0),
            sourceTimezone = null,
            originalText = "9:00 a.m.",
            confidence = 0.75f,
        )
        assertTrue("ML Kit loses timezone", mlKitResult.sourceTimezone == null)
        assertNotNull("Regex preserves timezone", regexResult.times[0].sourceTimezone)
    }

    @Test
    fun `complex multi-timezone string`() = runTest {
        val extractor = RegexExtractor(TestCityResolver())
        val results = extractor.extract("April 9 at 9:00 a.m. PT / 12:00 p.m. ET").times

        val ptResults = results.filter { it.sourceTimezone == TimeZone.of("America/Los_Angeles") }
        val etResults = results.filter { it.sourceTimezone == TimeZone.of("America/New_York") }

        assertTrue("Should find PT results", ptResults.isNotEmpty())
        assertTrue("Should find ET results", etResults.isNotEmpty())
    }

    @Test
    fun `deduplication removes substrings`() = runTest {
        val extractor = RegexExtractor(TestCityResolver())
        val results = extractor.extract("April 9 at 9:00 a.m. PT").times
        assertEquals(
            "Should have exactly 1 result after dedup, got: ${results.map { it.originalText }}",
            1, results.size
        )
    }
}
