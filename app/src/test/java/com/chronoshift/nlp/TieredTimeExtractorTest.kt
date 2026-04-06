package com.chronoshift.nlp

import kotlinx.coroutines.test.runTest
import kotlinx.datetime.TimeZone
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class TieredTimeExtractorTest {

    @Test
    fun `regex handles unix timestamp`() = runTest {
        val extractor = RegexExtractor(TestCityResolver())
        val result = extractor.extract("event at 1712678400")
        assertEquals(1, result.times.size)
        assertEquals("Regex", result.method)
    }

    @Test
    fun `regex handles city timezone`() = runTest {
        val extractor = RegexExtractor(TestCityResolver())
        val result = extractor.extract("5:00 in New York")
        assertEquals(1, result.times.size)
        assertEquals(TimeZone.of("America/New_York"), result.times[0].sourceTimezone)
    }

    @Test
    fun `regex returns empty for plain text`() = runTest {
        val extractor = RegexExtractor(TestCityResolver())
        val result = extractor.extract("no timestamps here")
        assertTrue(result.times.isEmpty())
    }
}
