package com.chronoshift.nlp

import kotlinx.coroutines.test.runTest
import kotlinx.datetime.LocalTime
import kotlinx.datetime.Month
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

    // --- ISO 8601 ---

    @Test
    fun `ISO 8601 with Z offset`() = runTest {
        val results = extract("event at 2026-04-09T15:00:00Z")
        assertEquals(1, results.size)
        assertNotNull(results[0].instant)
        assertEquals("2026-04-09T15:00:00Z", results[0].originalText)
    }

    @Test
    fun `ISO 8601 with positive offset`() = runTest {
        val results = extract("starts 2026-04-09T15:00:00+02:00")
        assertEquals(1, results.size)
        assertNotNull(results[0].instant)
    }

    @Test
    fun `ISO 8601 with negative offset`() = runTest {
        val results = extract("2026-04-09T09:00:00-05:00 is the time")
        assertEquals(1, results.size)
        assertNotNull(results[0].instant)
    }

    @Test
    fun `ISO 8601 with space separator`() = runTest {
        val results = extract("2026-04-09 15:00:00Z")
        assertEquals(1, results.size)
    }

    @Test
    fun `ISO 8601 without offset uses localDateTime`() = runTest {
        val results = extract("2026-04-09T15:00:00")
        assertEquals(1, results.size)
        assertNotNull(results[0].localDateTime)
    }

    @Test
    fun `ISO 8601 without seconds`() = runTest {
        val results = extract("2026-04-09T15:00Z")
        assertEquals(1, results.size)
    }

    // --- Time + timezone (no date) ---

    @Test
    fun `simple time with EST`() = runTest {
        val results = extract("9:00 a.m. EST")
        assertEquals(1, results.size)
        val r = results[0]
        assertEquals(TimeZone.of("America/New_York"), r.sourceTimezone)
        assertEquals(9, r.localDateTime!!.hour)
        assertEquals(0, r.localDateTime!!.minute)
    }

    @Test
    fun `pm time with PST`() = runTest {
        val results = extract("3:30 PM PST")
        assertEquals(1, results.size)
        assertEquals(15, results[0].localDateTime!!.hour)
        assertEquals(30, results[0].localDateTime!!.minute)
        assertEquals(TimeZone.of("America/Los_Angeles"), results[0].sourceTimezone)
    }

    @Test
    fun `dotted am with timezone`() = runTest {
        val results = extract("9:00 a.m. EST")
        assertEquals(1, results.size)
        assertEquals(9, results[0].localDateTime!!.hour)
    }

    @Test
    fun `dotted pm with timezone`() = runTest {
        val results = extract("12:00 p.m. ET")
        assertEquals(1, results.size)
        assertEquals(12, results[0].localDateTime!!.hour)
        assertEquals(TimeZone.of("America/New_York"), results[0].sourceTimezone)
    }

    @Test
    fun `informal PT timezone`() = runTest {
        val results = extract("3pm PT")
        assertEquals(1, results.size)
        assertEquals(15, results[0].localDateTime!!.hour)
        assertEquals(TimeZone.of("America/Los_Angeles"), results[0].sourceTimezone)
    }

    @Test
    fun `informal ET timezone`() = runTest {
        val results = extract("6pm ET")
        assertEquals(1, results.size)
        assertEquals(18, results[0].localDateTime!!.hour)
        assertEquals(TimeZone.of("America/New_York"), results[0].sourceTimezone)
    }

    @Test
    fun `24h time with UTC`() = runTest {
        val results = extract("15:00 UTC")
        assertEquals(1, results.size)
        assertEquals(15, results[0].localDateTime!!.hour)
        assertEquals(TimeZone.of("UTC"), results[0].sourceTimezone)
    }

    @Test
    fun `UTC with positive offset`() = runTest {
        val results = extract("15:00 UTC+2")
        assertEquals(1, results.size)
        assertNotNull(results[0].sourceTimezone)
    }

    @Test
    fun `UTC with negative offset`() = runTest {
        val results = extract("15:00 UTC-5")
        assertEquals(1, results.size)
    }

    @Test
    fun `12 PM is noon not midnight`() = runTest {
        val results = extract("12:00 PM EST")
        assertEquals(1, results.size)
        assertEquals(12, results[0].localDateTime!!.hour)
    }

    @Test
    fun `12 AM is midnight not noon`() = runTest {
        val results = extract("12:00 AM EST")
        assertEquals(1, results.size)
        assertEquals(0, results[0].localDateTime!!.hour)
    }

    @Test
    fun `time without minutes`() = runTest {
        val results = extract("3pm EST")
        assertEquals(1, results.size)
        assertEquals(15, results[0].localDateTime!!.hour)
        assertEquals(0, results[0].localDateTime!!.minute)
    }

    // --- EST vs ET ordering: longer abbreviation should match first ---

    @Test
    fun `EST matches fully, not as ET + leftover`() = runTest {
        val results = extract("9:00 AM EST")
        assertEquals(1, results.size)
        assertTrue(results[0].originalText.contains("EST"))
    }

    // --- Month name + date + time + timezone ---

    @Test
    fun `April 9 at 9_00 am PT`() = runTest {
        val results = extract("April 9 at 9:00 a.m. PT")
        assertEquals(1, results.size)
        val r = results[0]
        assertEquals(Month.APRIL, r.localDateTime!!.month)
        assertEquals(9, r.localDateTime!!.dayOfMonth)
        assertEquals(9, r.localDateTime!!.hour)
        assertEquals(TimeZone.of("America/Los_Angeles"), r.sourceTimezone)
    }

    @Test
    fun `Jan 5 2026 3_00 PM EST`() = runTest {
        val results = extract("Jan 5, 2026 3:00 PM EST")
        assertEquals(1, results.size)
        val r = results[0]
        assertEquals(Month.JANUARY, r.localDateTime!!.month)
        assertEquals(5, r.localDateTime!!.dayOfMonth)
        assertEquals(2026, r.localDateTime!!.year)
        assertEquals(15, r.localDateTime!!.hour)
        assertEquals(TimeZone.of("America/New_York"), r.sourceTimezone)
    }

    @Test
    fun `March 15 at 3pm CST`() = runTest {
        val results = extract("March 15 at 3pm CST")
        assertEquals(1, results.size)
        val r = results[0]
        assertEquals(Month.MARCH, r.localDateTime!!.month)
        assertEquals(15, r.localDateTime!!.dayOfMonth)
        assertEquals(15, r.localDateTime!!.hour)
        assertEquals(TimeZone.of("America/Chicago"), r.sourceTimezone)
    }

    @Test
    fun `abbreviated month Sept 1 at 10am GMT`() = runTest {
        val results = extract("Sept 1 at 10am GMT")
        assertEquals(1, results.size)
        val r = results[0]
        assertEquals(Month.SEPTEMBER, r.localDateTime!!.month)
        assertEquals(1, r.localDateTime!!.dayOfMonth)
        assertEquals(10, r.localDateTime!!.hour)
    }

    @Test
    fun `month name with year and comma`() = runTest {
        val results = extract("December 25, 2026, 8:00 AM JST")
        assertEquals(1, results.size)
        val r = results[0]
        assertEquals(Month.DECEMBER, r.localDateTime!!.month)
        assertEquals(25, r.localDateTime!!.dayOfMonth)
        assertEquals(2026, r.localDateTime!!.year)
        assertEquals(8, r.localDateTime!!.hour)
        assertEquals(TimeZone.of("Asia/Tokyo"), r.sourceTimezone)
    }

    // --- Numeric date + time + timezone ---

    @Test
    fun `MM_DD at time timezone`() = runTest {
        val results = extract("12/25 at 3pm EST")
        assertEquals(1, results.size)
        val r = results[0]
        assertEquals(12, r.localDateTime!!.monthNumber)
        assertEquals(25, r.localDateTime!!.dayOfMonth)
        assertEquals(15, r.localDateTime!!.hour)
    }

    @Test
    fun `MM_DD_YYYY time timezone`() = runTest {
        val results = extract("04/09/2026 3:00 PM EST")
        assertEquals(1, results.size)
        val r = results[0]
        assertEquals(4, r.localDateTime!!.monthNumber)
        assertEquals(9, r.localDateTime!!.dayOfMonth)
        assertEquals(2026, r.localDateTime!!.year)
        assertEquals(15, r.localDateTime!!.hour)
    }

    @Test
    fun `MM_DD_YY short year`() = runTest {
        val results = extract("04/09/26 3pm PST")
        assertEquals(1, results.size)
        assertEquals(2026, results[0].localDateTime!!.year)
    }

    // --- ISO date + timezone abbreviation ---

    @Test
    fun `ISO date with tz abbreviation`() = runTest {
        val results = extract("2026-04-09 15:00 EST")
        assertEquals(1, results.size)
        val r = results[0]
        assertEquals(2026, r.localDateTime!!.year)
        assertEquals(15, r.localDateTime!!.hour)
        assertEquals(TimeZone.of("America/New_York"), r.sourceTimezone)
    }

    @Test
    fun `ISO date with am pm and tz`() = runTest {
        val results = extract("2026-04-09 3pm PT")
        assertEquals(1, results.size)
        assertEquals(15, results[0].localDateTime!!.hour)
        assertEquals(TimeZone.of("America/Los_Angeles"), results[0].sourceTimezone)
    }

    // --- Multiple timestamps in one string ---

    @Test
    fun `two timestamps with slash separator`() = runTest {
        val results = extract("April 9 at 9:00 a.m. PT / 12:00 p.m. ET")
        assertTrue("Expected at least 2 results, got ${results.size}: ${results.map { it.originalText }}", results.size >= 2)

        val ptResult = results.find { it.sourceTimezone == TimeZone.of("America/Los_Angeles") }
        val etResult = results.find { it.sourceTimezone == TimeZone.of("America/New_York") }

        assertNotNull("Should find PT result in: ${results.map { "${it.originalText} -> ${it.sourceTimezone}" }}", ptResult)
        assertNotNull("Should find ET result in: ${results.map { "${it.originalText} -> ${it.sourceTimezone}" }}", etResult)
        assertEquals(9, ptResult!!.localDateTime!!.hour)
        assertEquals(12, etResult!!.localDateTime!!.hour)
    }

    @Test
    fun `date propagates from dated result to time-only result`() = runTest {
        val results = extract("April 9 at 9:00 a.m. PT / 12:00 p.m. ET")

        val ptResult = results.find { it.sourceTimezone == TimeZone.of("America/Los_Angeles") }
        val etResult = results.find { it.sourceTimezone == TimeZone.of("America/New_York") }

        assertNotNull("PT result", ptResult)
        assertNotNull("ET result", etResult)

        // Both should have the same date (April 9), not today's date for the ET one
        assertEquals(
            "ET result should inherit April 9 from PT result",
            ptResult!!.localDateTime!!.date,
            etResult!!.localDateTime!!.date,
        )
        assertEquals(4, etResult.localDateTime!!.monthNumber)
        assertEquals(9, etResult.localDateTime!!.dayOfMonth)
    }

    @Test
    fun `date propagates with leading whitespace`() = runTest {
        val results = extract("\n April 9 at 9:00 a.m. PT / 12:00 p.m. ET")
        val etResult = results.find { it.sourceTimezone == TimeZone.of("America/New_York") }
        assertNotNull("ET result", etResult)
        assertEquals(9, etResult!!.localDateTime!!.dayOfMonth)
    }

    // --- Time ranges ---

    @Test
    fun `time range with timezone`() = runTest {
        val results = extract("12:00 pm - 12:50 pm EDT")
        assertEquals(2, results.size)
        assertEquals(12, results[0].localDateTime!!.hour)
        assertEquals(12, results[1].localDateTime!!.hour)
        assertEquals(50, results[1].localDateTime!!.minute)
    }

    @Test
    fun `time range am pm inferred from second`() = runTest {
        val results = extract("9 - 11am PST")
        assertEquals(2, results.size)
        assertEquals(9, results[0].localDateTime!!.hour)
        assertEquals(11, results[1].localDateTime!!.hour)
    }

    @Test
    fun `at-sign separator`() = runTest {
        val results = extract("April 9 @ 3:00 PM EST")
        assertEquals(1, results.size)
        assertEquals(Month.APRIL, results[0].localDateTime!!.month)
        assertEquals(15, results[0].localDateTime!!.hour)
    }

    @Test
    fun `full event string with date range and timezone`() = runTest {
        val results = extract("April 9 @ 12:00 pm - 12:50 pm EDT")
        assertTrue("Expected at least 2 results, got ${results.size}", results.size >= 2)
        val edtResults = results.filter { it.sourceTimezone == TimeZone.of("America/New_York") }
        assertTrue("EDT results", edtResults.isNotEmpty())
    }

    @Test
    fun `multiple ISO timestamps`() = runTest {
        val results = extract("start: 2026-04-09T09:00:00Z end: 2026-04-09T17:00:00Z")
        assertEquals(2, results.size)
    }

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

    // --- Global timezone abbreviations ---

    @Test
    fun `JST timezone`() = runTest {
        val results = extract("3:00 PM JST")
        assertEquals(1, results.size)
        assertEquals(TimeZone.of("Asia/Tokyo"), results[0].sourceTimezone)
    }

    @Test
    fun `IST timezone`() = runTest {
        val results = extract("10:30 AM IST")
        assertEquals(1, results.size)
        assertEquals(TimeZone.of("Asia/Kolkata"), results[0].sourceTimezone)
    }

    @Test
    fun `CET timezone`() = runTest {
        val results = extract("14:00 CET")
        assertEquals(1, results.size)
        assertEquals(TimeZone.of("Europe/Paris"), results[0].sourceTimezone)
    }

    @Test
    fun `AEST timezone`() = runTest {
        val results = extract("9am AEST")
        assertEquals(1, results.size)
        assertEquals(TimeZone.of("Australia/Sydney"), results[0].sourceTimezone)
    }

    @Test
    fun `NZST timezone`() = runTest {
        val results = extract("8:00 PM NZST")
        assertEquals(1, results.size)
        assertEquals(TimeZone.of("Pacific/Auckland"), results[0].sourceTimezone)
    }

    @Test
    fun `GMT timezone`() = runTest {
        val results = extract("10:00 GMT")
        assertEquals(1, results.size)
        assertEquals(TimeZone.of("Europe/London"), results[0].sourceTimezone)
    }

    @Test
    fun `GMT with offset`() = runTest {
        val results = extract("10:00 GMT+5")
        assertEquals(1, results.size)
        assertNotNull(results[0].sourceTimezone)
    }

    @Test
    fun `MSK timezone`() = runTest {
        val results = extract("18:00 MSK")
        assertEquals(1, results.size)
        assertEquals(TimeZone.of("Europe/Moscow"), results[0].sourceTimezone)
    }

    @Test
    fun `BRT timezone`() = runTest {
        val results = extract("2pm BRT")
        assertEquals(1, results.size)
        assertEquals(TimeZone.of("America/Sao_Paulo"), results[0].sourceTimezone)
    }

    @Test
    fun `SGT timezone`() = runTest {
        val results = extract("11:00 AM SGT")
        assertEquals(1, results.size)
        assertEquals(TimeZone.of("Asia/Singapore"), results[0].sourceTimezone)
    }

    // --- Edge cases ---

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
    fun `invalid hour rejected`() = runTest {
        val results = extract("25:00 EST")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `invalid minute rejected`() = runTest {
        val results = extract("12:99 EST")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `case insensitive am pm`() = runTest {
        val r1 = extract("3:00 AM EST")
        val r2 = extract("3:00 am EST")
        val r3 = extract("3:00 A.M. EST")
        assertEquals(r1[0].localDateTime!!.hour, r2[0].localDateTime!!.hour)
        assertEquals(r1[0].localDateTime!!.hour, r3[0].localDateTime!!.hour)
    }

    @Test
    fun `case insensitive timezone`() = runTest {
        val r1 = extract("3pm est")
        val r2 = extract("3pm EST")
        assertEquals(r1.size, r2.size)
        assertEquals(r1[0].sourceTimezone, r2[0].sourceTimezone)
    }

    @Test
    fun `timestamp embedded in longer text`() = runTest {
        val results = extract("Hey, the meeting is at 3:00 PM EST tomorrow, don't be late!")
        assertEquals(1, results.size)
        assertEquals(15, results[0].localDateTime!!.hour)
        assertEquals(TimeZone.of("America/New_York"), results[0].sourceTimezone)
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
    fun `time in Sydney`() = runTest {
        val results = extract("8am in Sydney")
        assertEquals(1, results.size)
        assertEquals(TimeZone.of("Australia/Sydney"), results[0].sourceTimezone)
    }

    @Test
    fun `time in Hong Kong`() = runTest {
        val results = extract("9:00 PM in Hong Kong")
        assertEquals(1, results.size)
        assertEquals(TimeZone.of("Asia/Hong_Kong"), results[0].sourceTimezone)
    }

    @Test
    fun `case insensitive city`() = runTest {
        val results = extract("5pm in new york")
        assertEquals(1, results.size)
        assertEquals(TimeZone.of("America/New_York"), results[0].sourceTimezone)
    }

    @Test
    fun `fuzzy match misspelled city`() = runTest {
        val results = extract("5pm in new yrok")
        assertEquals(1, results.size)
        assertEquals(TimeZone.of("America/New_York"), results[0].sourceTimezone)
    }

    @Test
    fun `fuzzy match tokio for tokyo`() = runTest {
        val results = extract("3pm in tokio")
        assertEquals(1, results.size)
        assertEquals(TimeZone.of("Asia/Tokyo"), results[0].sourceTimezone)
    }

    @Test
    fun `substring match partial city`() = runTest {
        val results = extract("3pm in shangh")
        assertEquals(1, results.size)
        assertEquals(TimeZone.of("Asia/Shanghai"), results[0].sourceTimezone)
    }

    @Test
    fun `unknown city returns empty`() = runTest {
        val results = extract("5:00 in Narnia")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `always available`() = runTest {
        assertTrue(extractor.isAvailable())
    }
}
