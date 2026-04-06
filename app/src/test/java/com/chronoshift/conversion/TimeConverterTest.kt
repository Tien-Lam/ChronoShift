package com.chronoshift.conversion

import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class TimeConverterTest {

    private lateinit var converter: TimeConverter

    @Before
    fun setup() {
        converter = TimeConverter()
    }

    @Test
    fun `converts instant with known timezone`() {
        val extracted = listOf(
            ExtractedTime(
                instant = Instant.parse("2026-04-09T14:00:00Z"),
                sourceTimezone = TimeZone.UTC,
                originalText = "2026-04-09T14:00:00Z",
            )
        )
        val results = converter.toLocal(extracted)
        assertEquals(1, results.size)
        assertTrue(results[0].sourceTimezone.contains("UTC") || results[0].sourceTimezone == "Z")
        assertNotNull(results[0].localDateTime)
        assertNotNull(results[0].localDate)
    }

    @Test
    fun `converts localDateTime with source timezone`() {
        val extracted = listOf(
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 4, 9, 9, 0),
                sourceTimezone = TimeZone.of("America/New_York"),
                originalText = "9:00 AM EST",
            )
        )
        val results = converter.toLocal(extracted)
        assertEquals(1, results.size)
        assertTrue(results[0].sourceTimezone.contains("New_York"))
    }

    @Test
    fun `null timezone defaults to UTC`() {
        val extracted = listOf(
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 4, 9, 15, 0),
                sourceTimezone = null,
                originalText = "15:00",
            )
        )
        val results = converter.toLocal(extracted)
        assertEquals(1, results.size)
        assertTrue(
            "Source TZ should indicate UTC, was: ${results[0].sourceTimezone}",
            results[0].sourceTimezone.contains("UTC") || results[0].sourceTimezone == "Z"
        )
    }

    @Test
    fun `skips entries with no instant or localDateTime`() {
        val extracted = listOf(
            ExtractedTime(
                instant = null,
                localDateTime = null,
                originalText = "garbage",
            )
        )
        val results = converter.toLocal(extracted)
        assertTrue(results.isEmpty())
    }

    @Test
    fun `preserves original text in output`() {
        val extracted = listOf(
            ExtractedTime(
                instant = Instant.parse("2026-04-09T14:00:00Z"),
                originalText = "2026-04-09T14:00:00Z",
            )
        )
        val results = converter.toLocal(extracted)
        assertEquals("2026-04-09T14:00:00Z", results[0].originalText)
    }

    @Test
    fun `converts multiple entries`() {
        val extracted = listOf(
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 4, 9, 9, 0),
                sourceTimezone = TimeZone.of("America/Los_Angeles"),
                originalText = "9:00 a.m. PT",
            ),
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 4, 9, 12, 0),
                sourceTimezone = TimeZone.of("America/New_York"),
                originalText = "12:00 p.m. ET",
            ),
        )
        val results = converter.toLocal(extracted)
        assertEquals(2, results.size)
    }

    @Test
    fun `source and local timezone differ when not in same zone`() {
        val extracted = listOf(
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 4, 9, 9, 0),
                sourceTimezone = TimeZone.of("Asia/Tokyo"),
                originalText = "9:00 AM JST",
            )
        )
        val results = converter.toLocal(extracted)
        assertEquals(1, results.size)
        val localTz = TimeZone.currentSystemDefault().id
        if (localTz != "Asia/Tokyo") {
            assertTrue(
                "Source and local should differ",
                results[0].sourceTimezone != results[0].localTimezone
            )
        }
    }

    @Test
    fun `handles DST transition correctly`() {
        val extracted = listOf(
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 3, 8, 1, 30),
                sourceTimezone = TimeZone.of("America/New_York"),
                originalText = "1:30 AM EST",
            )
        )
        val results = converter.toLocal(extracted)
        assertEquals(1, results.size)
        assertNotNull(results[0].localDateTime)
    }
}
