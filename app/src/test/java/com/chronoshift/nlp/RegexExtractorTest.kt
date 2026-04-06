package com.chronoshift.nlp

import kotlinx.coroutines.test.runTest
import kotlinx.datetime.TimeZone
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class RegexExtractorTest {

    private lateinit var extractor: RegexExtractor

    @Before
    fun setup() {
        extractor = RegexExtractor(TestCityResolver())
    }

    private suspend fun extract(text: String) = extractor.extract(text).times

    // ========== Unix timestamps ==========

    @Test
    fun `unix timestamp parses correctly`() = runTest {
        val results = extract("created at 1712678400")
        assertEquals(1, results.size)
        assertNotNull(results[0].instant)
        assertEquals(TimeZone.UTC, results[0].sourceTimezone)
    }

    @Test
    fun `unix timestamp preserves original text`() = runTest {
        val results = extract("ts: 1712678400")
        assertEquals("1712678400", results[0].originalText)
    }

    @Test
    fun `unix timestamp confidence is low`() = runTest {
        val results = extract("1712678400")
        assertEquals(0.6f, results[0].confidence)
    }

    @Test
    fun `rejects timestamp before 2015`() = runTest {
        val results = extract("1000000000") // 2001
        assertTrue(results.isEmpty())
    }

    @Test
    fun `rejects timestamp after 2035`() = runTest {
        val results = extract("9999999999")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `rejects number that is too long`() = runTest {
        val results = extract("99999999999999")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `accepts timestamp at 2015 boundary`() = runTest {
        val results = extract("1420070400") // 2015-01-01
        assertEquals(1, results.size)
    }

    @Test
    fun `multiple unix timestamps in text`() = runTest {
        val results = extract("start: 1712678400 end: 1712682000")
        assertEquals(2, results.size)
    }

    @Test
    fun `unix timestamp embedded in sentence`() = runTest {
        val results = extract("The event was created at 1712678400 and updated later")
        assertEquals(1, results.size)
    }

    @Test
    fun `number inside a word is not a timestamp`() = runTest {
        val results = extract("ID1712678400X")
        assertTrue(results.isEmpty())
    }

    // ========== City timezone resolution ==========

    @Test
    fun `time in New York`() = runTest {
        val results = extract("5:00 in New York")
        assertEquals(1, results.size)
        assertEquals(5, results[0].localDateTime!!.hour)
        assertEquals(0, results[0].localDateTime!!.minute)
        assertEquals(TimeZone.of("America/New_York"), results[0].sourceTimezone)
    }

    @Test
    fun `3pm in Tokyo`() = runTest {
        val results = extract("3pm in Tokyo")
        assertEquals(1, results.size)
        assertEquals(15, results[0].localDateTime!!.hour)
        assertEquals(TimeZone.of("Asia/Tokyo"), results[0].sourceTimezone)
    }

    @Test
    fun `10 AM in London`() = runTest {
        val results = extract("10:00 AM in London")
        assertEquals(1, results.size)
        assertEquals(10, results[0].localDateTime!!.hour)
    }

    @Test
    fun `time at San Francisco`() = runTest {
        val results = extract("2:30 PM at San Francisco")
        assertEquals(1, results.size)
        assertEquals(14, results[0].localDateTime!!.hour)
        assertEquals(30, results[0].localDateTime!!.minute)
    }

    @Test
    fun `case insensitive city`() = runTest {
        val results = extract("5pm in new york")
        assertEquals(1, results.size)
        assertEquals(TimeZone.of("America/New_York"), results[0].sourceTimezone)
    }

    @Test
    fun `unknown city returns empty`() = runTest {
        assertTrue(extract("5:00 in Narnia").isEmpty())
    }

    @Test
    fun `city with dotted am`() = runTest {
        val results = extract("9:00 a.m. in London")
        assertEquals(1, results.size)
        assertEquals(9, results[0].localDateTime!!.hour)
    }

    @Test
    fun `city with dotted pm`() = runTest {
        val results = extract("3:00 p.m. at Tokyo")
        assertEquals(1, results.size)
        assertEquals(15, results[0].localDateTime!!.hour)
    }

    @Test
    fun `12 PM in city is noon`() = runTest {
        val results = extract("12pm in London")
        assertEquals(12, results[0].localDateTime!!.hour)
    }

    @Test
    fun `12 AM in city is midnight`() = runTest {
        val results = extract("12am in London")
        assertEquals(0, results[0].localDateTime!!.hour)
    }

    @Test
    fun `24h time in city`() = runTest {
        val results = extract("15:00 in Tokyo")
        assertEquals(1, results.size)
        assertEquals(15, results[0].localDateTime!!.hour)
    }

    @Test
    fun `city confidence is 0_8`() = runTest {
        val results = extract("3pm in Tokyo")
        assertEquals(0.8f, results[0].confidence)
    }

    @Test
    fun `rejects invalid hour`() = runTest {
        assertTrue(extract("25:00 in London").isEmpty())
    }

    @Test
    fun `rejects invalid minute`() = runTest {
        assertTrue(extract("12:99 in London").isEmpty())
    }

    // ========== General ==========

    @Test
    fun `no timestamp returns empty`() = runTest {
        assertTrue(extract("hello world, no times here").isEmpty())
    }

    @Test
    fun `empty string returns empty`() = runTest {
        assertTrue(extract("").isEmpty())
    }

    @Test
    fun `whitespace only returns empty`() = runTest {
        assertTrue(extract("   \n\t  ").isEmpty())
    }

    @Test
    fun `always available`() = runTest {
        assertTrue(extractor.isAvailable())
    }

    @Test
    fun `method is Regex`() = runTest {
        val result = extractor.extract("1712678400")
        assertEquals("Regex", result.method)
    }
}
