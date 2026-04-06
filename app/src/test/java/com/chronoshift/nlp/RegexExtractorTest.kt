package com.chronoshift.nlp

import kotlinx.coroutines.test.runTest
import kotlinx.datetime.TimeZone
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
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

    // --- Unix timestamps ---

    @Test
    fun `unix timestamp`() = runTest {
        val results = extract("created at 1712678400")
        assertEquals(1, results.size)
        assertNotNull(results[0].instant)
        assertEquals(TimeZone.UTC, results[0].sourceTimezone)
    }

    @Test
    fun `rejects out of range unix timestamp`() = runTest {
        val results = extract("id: 9999999999999")
        assertTrue(results.isEmpty())
    }

    // --- City name timezone resolution ---

    @Test
    fun `time in New York`() = runTest {
        val results = extract("5:00 in New York")
        assertEquals(1, results.size)
        assertEquals(5, results[0].localDateTime!!.hour)
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
        assertEquals(TimeZone.of("Europe/London"), results[0].sourceTimezone)
    }

    @Test
    fun `time at San Francisco`() = runTest {
        val results = extract("2:30 PM at San Francisco")
        assertEquals(1, results.size)
        assertEquals(14, results[0].localDateTime!!.hour)
        assertEquals(30, results[0].localDateTime!!.minute)
        assertEquals(TimeZone.of("America/Los_Angeles"), results[0].sourceTimezone)
    }

    @Test
    fun `case insensitive city`() = runTest {
        val results = extract("5pm in new york")
        assertEquals(1, results.size)
        assertEquals(TimeZone.of("America/New_York"), results[0].sourceTimezone)
    }

    @Test
    fun `unknown city returns empty`() = runTest {
        val results = extract("5:00 in Narnia")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `no timestamp returns empty`() = runTest {
        val results = extract("hello world, no times here")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `empty string returns empty`() = runTest {
        val results = extract("")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `always available`() = runTest {
        assertTrue(extractor.isAvailable())
    }
}
