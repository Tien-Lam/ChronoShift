package com.chronoshift.nlp

import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toInstant
import kotlinx.datetime.toLocalDateTime
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class LlmResultParserTest {

    private fun jsonEntry(
        time: String = "14:30:00",
        date: String = "2026-04-06",
        timezone: String = "",
        original: String = "2:30 PM",
    ): String = """{"time":"$time","date":"$date","timezone":"$timezone","original":"$original"}"""

    // ========== parseResponse ==========

    @Test
    fun `parseResponse - valid JSON array with one entry returns 1 result`() {
        val json = "[${jsonEntry()}]"
        val results = LlmResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertEquals("2:30 PM", results[0].originalText)
    }

    @Test
    fun `parseResponse - valid JSON with IANA timezone resolves correctly`() {
        val json = "[${jsonEntry(timezone = "America/New_York")}]"
        val results = LlmResultParser.parseResponse(json)
        assertEquals(1, results.size)
        val expectedTz = TimeZone.of("America/New_York")
        assertEquals(expectedTz, results[0].sourceTimezone)
        assertNotNull(results[0].instant)
        // Original text "2:30 PM" has no timezone abbreviation → uses IANA zone directly
        val expectedInstant = LocalDateTime.parse("2026-04-06T14:30:00").toInstant(expectedTz)
        assertEquals(expectedInstant, results[0].instant)
    }

    @Test
    fun `parseResponse - valid JSON without timezone has null timezone`() {
        val json = "[${jsonEntry()}]"
        val results = LlmResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertNull(results[0].sourceTimezone)
        assertNull(results[0].instant)
        assertNotNull(results[0].localDateTime)
    }

    @Test
    fun `parseResponse - json fenced response is stripped and parsed`() {
        val json = "```json\n[${jsonEntry()}]\n```"
        val results = LlmResultParser.parseResponse(json)
        assertEquals(1, results.size)
    }

    @Test
    fun `parseResponse - generic fenced response is stripped and parsed`() {
        val json = "```\n[${jsonEntry()}]\n```"
        val results = LlmResultParser.parseResponse(json)
        assertEquals(1, results.size)
    }

    @Test
    fun `parseResponse - empty array returns empty list`() {
        val results = LlmResultParser.parseResponse("[]")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `parseResponse - empty string returns empty list`() {
        val results = LlmResultParser.parseResponse("")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `parseResponse - malformed JSON returns empty list`() {
        val results = LlmResultParser.parseResponse("[{broken}")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `parseResponse - not json returns empty list`() {
        val results = LlmResultParser.parseResponse("not json")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `parseResponse - missing time field returns empty`() {
        val json = """[{"date":"2026-04-06","original":"test","timezone":""}]"""
        val results = LlmResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `parseResponse - missing original field returns empty`() {
        val json = """[{"time":"14:30:00","date":"2026-04-06","timezone":""}]"""
        val results = LlmResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `parseResponse - missing date field returns empty`() {
        val json = """[{"time":"14:30:00","original":"2:30 PM","timezone":""}]"""
        val results = LlmResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `parseResponse - time only no date returns empty`() {
        val json = "[${jsonEntry(date = "")}]"
        val results = LlmResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `parseResponse - invalid timezone string results in null tz with localDateTime`() {
        val json = "[${jsonEntry(timezone = "Not/A/Zone")}]"
        val results = LlmResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertNull(results[0].sourceTimezone)
        assertNull(results[0].instant)
        assertNotNull(results[0].localDateTime)
        assertEquals(0.7f, results[0].confidence)
    }

    @Test
    fun `parseResponse - Asia Tokyo timezone resolved correctly`() {
        val json = "[${jsonEntry(timezone = "Asia/Tokyo")}]"
        val results = LlmResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertEquals(TimeZone.of("Asia/Tokyo"), results[0].sourceTimezone)
        assertNotNull(results[0].instant)
        assertEquals(0.9f, results[0].confidence)
    }

    @Test
    fun `parseResponse - UTC offset timezone resolved correctly`() {
        val json = "[${jsonEntry(timezone = "+05:30")}]"
        val results = LlmResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertNotNull(results[0].sourceTimezone)
        assertNotNull(results[0].instant)
        val expectedInstant = LocalDateTime.parse("2026-04-06T14:30:00")
            .toInstant(TimeZone.of("+05:30"))
        assertEquals(expectedInstant, results[0].instant)
    }

    @Test
    fun `parseResponse - multiple entries all parsed`() {
        val json = "[${jsonEntry(time = "14:30:00")},${jsonEntry(time = "09:00:00")}]"
        val results = LlmResultParser.parseResponse(json)
        assertEquals(2, results.size)
    }

    @Test
    fun `parseResponse - mix of valid and invalid entries returns only valid`() {
        val valid = jsonEntry()
        val missingTime = """{"date":"2026-04-06","original":"bad","timezone":""}"""
        val json = "[$valid,$missingTime]"
        val results = LlmResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertEquals("2:30 PM", results[0].originalText)
    }

    // ========== parseEntry ==========

    @Test
    fun `parseEntry - all fields present with valid tz returns ExtractedTime with instant`() {
        val obj = org.json.JSONObject(
            mapOf(
                "time" to "14:30:00",
                "date" to "2026-04-06",
                "timezone" to "America/New_York",
                "original" to "2:30 PM ET",
            )
        )
        val result = LlmResultParser.parseEntry(obj)
        assertNotNull(result)
        assertNotNull(result!!.instant)
        assertEquals(TimeZone.of("America/New_York"), result.sourceTimezone)
        assertEquals(0.9f, result.confidence)
        assertEquals("2:30 PM ET", result.originalText)
    }

    @Test
    fun `parseEntry - invalid IANA timezone returns confidence 0_7 no instant`() {
        val obj = org.json.JSONObject(
            mapOf(
                "time" to "14:30:00",
                "date" to "2026-04-06",
                "timezone" to "Fake/Zone",
                "original" to "2:30 PM",
            )
        )
        val result = LlmResultParser.parseEntry(obj)
        assertNotNull(result)
        assertNull(result!!.instant)
        assertNull(result.sourceTimezone)
        assertEquals(0.7f, result.confidence)
        assertNotNull(result.localDateTime)
    }

    @Test
    fun `parseEntry - valid timezone returns confidence 0_9 with instant`() {
        // "9 AM GMT" in April: London is BST (+1) in April, but GMT means UTC+0.
        // The abbreviation correction fixes the instant and zone to use UTC+0.
        val obj = org.json.JSONObject(
            mapOf(
                "time" to "09:00:00",
                "date" to "2026-04-06",
                "timezone" to "Europe/London",
                "original" to "9 AM GMT",
            )
        )
        val result = LlmResultParser.parseEntry(obj)
        assertNotNull(result)
        assertNotNull(result!!.instant)
        // GMT = UTC+0, so instant should be 9:00 UTC (not 8:00 UTC which BST would give)
        val utcHour = result.instant!!.toLocalDateTime(TimeZone.UTC).hour
        assertEquals("9 AM GMT should be 09:00 UTC", 9, utcHour)
        assertEquals(0.9f, result.confidence)
    }

    // ========== Abbreviation-corrected instant ==========

    @Test
    fun `parseEntry - EST in original corrects instant from EDT zone`() {
        // Summer date: America/New_York uses EDT (-4), but "EST" means UTC-5
        val obj = org.json.JSONObject(
            mapOf(
                "time" to "15:00:00",
                "date" to "2026-07-15",
                "timezone" to "America/New_York",
                "original" to "3pm EST",
            )
        )
        val result = LlmResultParser.parseEntry(obj)
        assertNotNull(result)
        assertNotNull(result!!.instant)
        // EST = UTC-5: 3pm + 5h = 8pm UTC (not 7pm UTC which EDT would give)
        val utcHour = result.instant!!.toLocalDateTime(TimeZone.UTC).hour
        assertEquals("3pm EST should be 20:00 UTC", 20, utcHour)
    }

    @Test
    fun `parseEntry - PST in original corrects instant from PDT zone`() {
        val obj = org.json.JSONObject(
            mapOf(
                "time" to "15:00:00",
                "date" to "2026-07-15",
                "timezone" to "America/Los_Angeles",
                "original" to "3pm PST",
            )
        )
        val result = LlmResultParser.parseEntry(obj)!!
        assertNotNull(result.instant)
        // PST = UTC-8: 3pm + 8h = 11pm UTC (not 10pm which PDT would give)
        val utcHour = result.instant!!.toLocalDateTime(TimeZone.UTC).hour
        assertEquals("3pm PST should be 23:00 UTC", 23, utcHour)
    }

    @Test
    fun `parseEntry - CST in original does not correct (ambiguous)`() {
        // CST is ambiguous (US Central / China Standard) → no correction, use IANA zone
        val obj = org.json.JSONObject(
            mapOf(
                "time" to "15:00:00",
                "date" to "2026-01-15",
                "timezone" to "America/Chicago",
                "original" to "3pm CST",
            )
        )
        val result = LlmResultParser.parseEntry(obj)
        assertNotNull(result)
        // Falls back to IANA zone: Chicago in Jan = CST = UTC-6
        val expected = LocalDateTime.parse("2026-01-15T15:00:00")
            .toInstant(TimeZone.of("America/Chicago"))
        assertEquals(expected, result!!.instant)
    }

    @Test
    fun `parseEntry - no abbreviation in original uses IANA zone directly`() {
        val obj = org.json.JSONObject(
            mapOf(
                "time" to "15:00:00",
                "date" to "2026-07-15",
                "timezone" to "America/New_York",
                "original" to "3pm Eastern",
            )
        )
        val result = LlmResultParser.parseEntry(obj)
        assertNotNull(result)
        // "Eastern" is not a recognized abbreviation → uses IANA zone (EDT in July)
        val expected = LocalDateTime.parse("2026-07-15T15:00:00")
            .toInstant(TimeZone.of("America/New_York"))
        assertEquals(expected, result!!.instant)
    }

    @Test
    fun `parseEntry - GMT in original uses fixed offset 0`() {
        val obj = org.json.JSONObject(
            mapOf(
                "time" to "15:00:00",
                "date" to "2026-07-15",
                "timezone" to "Europe/London",
                "original" to "3pm GMT",
            )
        )
        val result = LlmResultParser.parseEntry(obj)!!
        assertNotNull(result.instant)
        // GMT = UTC+0: 3pm + 0 = 3pm UTC (not BST +1 which London would give in July)
        val utcHour = result.instant!!.toLocalDateTime(TimeZone.UTC).hour
        assertEquals("3pm GMT should be 15:00 UTC", 15, utcHour)
    }
}
