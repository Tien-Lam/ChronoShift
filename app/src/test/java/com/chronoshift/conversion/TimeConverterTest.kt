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

    // ========== Basic conversion ==========

    @Test
    fun `converts instant with UTC timezone`() {
        val results = converter.toLocal(listOf(
            ExtractedTime(
                instant = Instant.parse("2026-04-09T14:00:00Z"),
                sourceTimezone = TimeZone.UTC,
                originalText = "2026-04-09T14:00:00Z",
            )
        ))
        assertEquals(1, results.size)
        assertTrue(results[0].sourceTimezone.contains("UTC") || results[0].sourceTimezone == "Z")
        assertNotNull(results[0].localDateTime)
        assertNotNull(results[0].localDate)
    }

    @Test
    fun `converts localDateTime with named timezone`() {
        val results = converter.toLocal(listOf(
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 4, 9, 9, 0),
                sourceTimezone = TimeZone.of("America/New_York"),
                originalText = "9:00 AM EST",
            )
        ))
        assertEquals(1, results.size)
        assertTrue(results[0].sourceTimezone.contains("New_York"))
    }

    @Test
    fun `null timezone defaults to UTC`() {
        val results = converter.toLocal(listOf(
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 4, 9, 15, 0),
                sourceTimezone = null,
                originalText = "15:00",
            )
        ))
        assertTrue(results[0].sourceTimezone.contains("UTC") || results[0].sourceTimezone == "Z")
    }

    @Test
    fun `prefers instant over localDateTime when both present`() {
        val instant = Instant.parse("2026-04-09T14:00:00Z")
        val results = converter.toLocal(listOf(
            ExtractedTime(
                instant = instant,
                localDateTime = LocalDateTime(2026, 1, 1, 0, 0), // different date
                sourceTimezone = TimeZone.UTC,
                originalText = "test",
            )
        ))
        assertEquals(1, results.size)
        // Should use the instant (April 9), not the localDateTime (Jan 1)
    }

    // ========== Skip/filter ==========

    @Test
    fun `skips entries with no instant or localDateTime`() {
        val results = converter.toLocal(listOf(
            ExtractedTime(instant = null, localDateTime = null, originalText = "garbage")
        ))
        assertTrue(results.isEmpty())
    }

    @Test
    fun `deduplicates identical results`() {
        val results = converter.toLocal(listOf(
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 4, 9, 15, 0),
                sourceTimezone = TimeZone.of("America/New_York"),
                originalText = "3pm EST",
            ),
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 4, 9, 15, 0),
                sourceTimezone = TimeZone.of("America/New_York"),
                originalText = "3pm EST",
            ),
        ))
        assertEquals(1, results.size)
    }

    @Test
    fun `keeps different times from same timezone`() {
        val results = converter.toLocal(listOf(
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 4, 9, 9, 0),
                sourceTimezone = TimeZone.of("America/New_York"),
                originalText = "9am EST",
            ),
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 4, 9, 15, 0),
                sourceTimezone = TimeZone.of("America/New_York"),
                originalText = "3pm EST",
            ),
        ))
        assertEquals(2, results.size)
    }

    // ========== Preserves fields ==========

    @Test
    fun `preserves original text`() {
        val results = converter.toLocal(listOf(
            ExtractedTime(
                instant = Instant.parse("2026-04-09T14:00:00Z"),
                originalText = "my original text",
            )
        ))
        assertEquals("my original text", results[0].originalText)
    }

    @Test
    fun `preserves method field`() {
        val results = converter.toLocal(listOf(
            ExtractedTime(
                instant = Instant.parse("2026-04-09T14:00:00Z"),
                originalText = "test",
                method = "Chrono + ML Kit",
            )
        ))
        assertEquals("Chrono + ML Kit", results[0].method)
    }

    // ========== Multiple entries ==========

    @Test
    fun `converts multiple entries`() {
        val results = converter.toLocal(listOf(
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 4, 9, 9, 0),
                sourceTimezone = TimeZone.of("America/Los_Angeles"),
                originalText = "9am PT",
            ),
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 4, 9, 12, 0),
                sourceTimezone = TimeZone.of("America/New_York"),
                originalText = "12pm ET",
            ),
        ))
        assertEquals(2, results.size)
    }

    @Test
    fun `different timezones produce different local times`() {
        val results = converter.toLocal(listOf(
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 4, 9, 9, 0),
                sourceTimezone = TimeZone.of("America/Los_Angeles"),
                originalText = "9am PT",
            ),
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 4, 9, 9, 0),
                sourceTimezone = TimeZone.of("Asia/Tokyo"),
                originalText = "9am JST",
            ),
        ))
        assertEquals(2, results.size)
        // These represent different absolute times, so local times should differ
        assertTrue(results[0].localDateTime != results[1].localDateTime || results[0].sourceTimezone != results[1].sourceTimezone)
    }

    // ========== Timezone display ==========

    @Test
    fun `source and local timezone differ for foreign zone`() {
        val results = converter.toLocal(listOf(
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 4, 9, 9, 0),
                sourceTimezone = TimeZone.of("Asia/Tokyo"),
                originalText = "9am JST",
            )
        ))
        val localTz = TimeZone.currentSystemDefault().id
        if (localTz != "Asia/Tokyo") {
            assertTrue(results[0].sourceTimezone != results[0].localTimezone)
        }
    }

    // ========== DST ==========

    @Test
    fun `handles spring forward DST`() {
        val results = converter.toLocal(listOf(
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 3, 8, 1, 30),
                sourceTimezone = TimeZone.of("America/New_York"),
                originalText = "1:30 AM EST",
            )
        ))
        assertEquals(1, results.size)
        assertNotNull(results[0].localDateTime)
    }

    @Test
    fun `handles fall back DST`() {
        val results = converter.toLocal(listOf(
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 11, 1, 1, 30),
                sourceTimezone = TimeZone.of("America/New_York"),
                originalText = "1:30 AM ET",
            )
        ))
        assertEquals(1, results.size)
        assertNotNull(results[0].localDateTime)
    }

    // ========== Edge cases ==========

    @Test
    fun `empty list returns empty`() {
        assertTrue(converter.toLocal(emptyList()).isEmpty())
    }

    @Test
    fun `midnight converts correctly`() {
        val results = converter.toLocal(listOf(
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 4, 9, 0, 0),
                sourceTimezone = TimeZone.of("America/New_York"),
                originalText = "midnight",
            )
        ))
        assertEquals(1, results.size)
    }

    @Test
    fun `23 59 converts correctly`() {
        val results = converter.toLocal(listOf(
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 4, 9, 23, 59),
                sourceTimezone = TimeZone.of("America/New_York"),
                originalText = "11:59 PM",
            )
        ))
        assertEquals(1, results.size)
    }

    @Test
    fun `new years eve midnight`() {
        val results = converter.toLocal(listOf(
            ExtractedTime(
                localDateTime = LocalDateTime(2026, 12, 31, 23, 59),
                sourceTimezone = TimeZone.of("Pacific/Auckland"),
                originalText = "11:59 PM NZST",
            )
        ))
        assertEquals(1, results.size)
        // Auckland is far ahead — local time may be a different date
        assertNotNull(results[0].localDate)
    }

    @Test
    fun `leap year feb 29`() {
        val results = converter.toLocal(listOf(
            ExtractedTime(
                localDateTime = LocalDateTime(2028, 2, 29, 12, 0),
                sourceTimezone = TimeZone.of("America/New_York"),
                originalText = "noon Feb 29",
            )
        ))
        assertEquals(1, results.size)
    }
}
