package com.chronoshift.nlp

import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toInstant
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class GeminiResultParserTest {

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
        val results = GeminiResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertEquals("2:30 PM", results[0].originalText)
    }

    @Test
    fun `parseResponse - valid JSON with IANA timezone resolves correctly`() {
        val json = "[${jsonEntry(timezone = "America/New_York")}]"
        val results = GeminiResultParser.parseResponse(json)
        assertEquals(1, results.size)
        val expectedTz = TimeZone.of("America/New_York")
        assertEquals(expectedTz, results[0].sourceTimezone)
        assertNotNull(results[0].instant)
        val expectedInstant = LocalDateTime.parse("2026-04-06T14:30:00").toInstant(expectedTz)
        assertEquals(expectedInstant, results[0].instant)
    }

    @Test
    fun `parseResponse - valid JSON without timezone has null timezone`() {
        val json = "[${jsonEntry()}]"
        val results = GeminiResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertNull(results[0].sourceTimezone)
        assertNull(results[0].instant)
        assertNotNull(results[0].localDateTime)
    }

    @Test
    fun `parseResponse - json fenced response is stripped and parsed`() {
        val json = "```json\n[${jsonEntry()}]\n```"
        val results = GeminiResultParser.parseResponse(json)
        assertEquals(1, results.size)
    }

    @Test
    fun `parseResponse - generic fenced response is stripped and parsed`() {
        val json = "```\n[${jsonEntry()}]\n```"
        val results = GeminiResultParser.parseResponse(json)
        assertEquals(1, results.size)
    }

    @Test
    fun `parseResponse - empty array returns empty list`() {
        val results = GeminiResultParser.parseResponse("[]")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `parseResponse - empty string returns empty list`() {
        val results = GeminiResultParser.parseResponse("")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `parseResponse - malformed JSON returns empty list`() {
        val results = GeminiResultParser.parseResponse("[{broken}")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `parseResponse - not json returns empty list`() {
        val results = GeminiResultParser.parseResponse("not json")
        assertTrue(results.isEmpty())
    }

    @Test
    fun `parseResponse - missing time field returns empty`() {
        val json = """[{"date":"2026-04-06","original":"test","timezone":""}]"""
        val results = GeminiResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `parseResponse - missing original field returns empty`() {
        val json = """[{"time":"14:30:00","date":"2026-04-06","timezone":""}]"""
        val results = GeminiResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `parseResponse - missing date field returns empty`() {
        val json = """[{"time":"14:30:00","original":"2:30 PM","timezone":""}]"""
        val results = GeminiResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `parseResponse - time only no date returns empty`() {
        val json = "[${jsonEntry(date = "")}]"
        val results = GeminiResultParser.parseResponse(json)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `parseResponse - invalid timezone string results in null tz with localDateTime`() {
        val json = "[${jsonEntry(timezone = "Not/A/Zone")}]"
        val results = GeminiResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertNull(results[0].sourceTimezone)
        assertNull(results[0].instant)
        assertNotNull(results[0].localDateTime)
        assertEquals(0.7f, results[0].confidence)
    }

    @Test
    fun `parseResponse - Asia Tokyo timezone resolved correctly`() {
        val json = "[${jsonEntry(timezone = "Asia/Tokyo")}]"
        val results = GeminiResultParser.parseResponse(json)
        assertEquals(1, results.size)
        assertEquals(TimeZone.of("Asia/Tokyo"), results[0].sourceTimezone)
        assertNotNull(results[0].instant)
        assertEquals(0.9f, results[0].confidence)
    }

    @Test
    fun `parseResponse - UTC offset timezone resolved correctly`() {
        val json = "[${jsonEntry(timezone = "+05:30")}]"
        val results = GeminiResultParser.parseResponse(json)
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
        val results = GeminiResultParser.parseResponse(json)
        assertEquals(2, results.size)
    }

    @Test
    fun `parseResponse - mix of valid and invalid entries returns only valid`() {
        val valid = jsonEntry()
        val missingTime = """{"date":"2026-04-06","original":"bad","timezone":""}"""
        val json = "[$valid,$missingTime]"
        val results = GeminiResultParser.parseResponse(json)
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
        val result = GeminiResultParser.parseEntry(obj)
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
        val result = GeminiResultParser.parseEntry(obj)
        assertNotNull(result)
        assertNull(result!!.instant)
        assertNull(result.sourceTimezone)
        assertEquals(0.7f, result.confidence)
        assertNotNull(result.localDateTime)
    }

    @Test
    fun `parseEntry - valid timezone returns confidence 0_9 with instant`() {
        val obj = org.json.JSONObject(
            mapOf(
                "time" to "09:00:00",
                "date" to "2026-04-06",
                "timezone" to "Europe/London",
                "original" to "9 AM GMT",
            )
        )
        val result = GeminiResultParser.parseEntry(obj)
        assertNotNull(result)
        assertNotNull(result!!.instant)
        assertEquals(TimeZone.of("Europe/London"), result.sourceTimezone)
        assertEquals(0.9f, result.confidence)
    }
}
