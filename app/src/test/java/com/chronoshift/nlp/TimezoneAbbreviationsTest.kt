package com.chronoshift.nlp

import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toInstant
import kotlinx.datetime.toLocalDateTime
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class TimezoneAbbreviationsTest {

    // ========== resolveOffset ==========

    @Test
    fun `resolveOffset - EST returns -300`() {
        assertEquals(-300, TimezoneAbbreviations.resolveOffset("EST"))
    }

    @Test
    fun `resolveOffset - EDT returns -240`() {
        assertEquals(-240, TimezoneAbbreviations.resolveOffset("EDT"))
    }

    @Test
    fun `resolveOffset - PST returns -480`() {
        assertEquals(-480, TimezoneAbbreviations.resolveOffset("PST"))
    }

    @Test
    fun `resolveOffset - PDT returns -420`() {
        assertEquals(-420, TimezoneAbbreviations.resolveOffset("PDT"))
    }

    @Test
    fun `resolveOffset - JST returns 540`() {
        assertEquals(540, TimezoneAbbreviations.resolveOffset("JST"))
    }

    @Test
    fun `resolveOffset - GMT returns 0`() {
        assertEquals(0, TimezoneAbbreviations.resolveOffset("GMT"))
    }

    @Test
    fun `resolveOffset - UTC returns 0`() {
        assertEquals(0, TimezoneAbbreviations.resolveOffset("UTC"))
    }

    @Test
    fun `resolveOffset - CET returns 60`() {
        assertEquals(60, TimezoneAbbreviations.resolveOffset("CET"))
    }

    @Test
    fun `resolveOffset - NZST returns 720`() {
        assertEquals(720, TimezoneAbbreviations.resolveOffset("NZST"))
    }

    @Test
    fun `resolveOffset - case insensitive`() {
        assertEquals(-300, TimezoneAbbreviations.resolveOffset("est"))
        assertEquals(-300, TimezoneAbbreviations.resolveOffset("Est"))
    }

    @Test
    fun `resolveOffset - CST returns null (ambiguous)`() {
        assertNull(TimezoneAbbreviations.resolveOffset("CST"))
    }

    @Test
    fun `resolveOffset - IST returns null (ambiguous)`() {
        assertNull(TimezoneAbbreviations.resolveOffset("IST"))
    }

    @Test
    fun `resolveOffset - BST returns null (ambiguous)`() {
        assertNull(TimezoneAbbreviations.resolveOffset("BST"))
    }

    @Test
    fun `resolveOffset - AST returns null (ambiguous)`() {
        assertNull(TimezoneAbbreviations.resolveOffset("AST"))
    }

    @Test
    fun `resolveOffset - unknown abbreviation returns null`() {
        assertNull(TimezoneAbbreviations.resolveOffset("XYZ"))
        assertNull(TimezoneAbbreviations.resolveOffset("HELLO"))
    }

    // ========== isAmbiguous ==========

    @Test
    fun `isAmbiguous - CST is ambiguous`() {
        assertTrue(TimezoneAbbreviations.isAmbiguous("CST"))
    }

    @Test
    fun `isAmbiguous - EST is not ambiguous`() {
        assertFalse(TimezoneAbbreviations.isAmbiguous("EST"))
    }

    @Test
    fun `isAmbiguous - unknown is not ambiguous`() {
        assertFalse(TimezoneAbbreviations.isAmbiguous("XYZ"))
    }

    // ========== extractAbbreviation ==========

    @Test
    fun `extractAbbreviation - finds EST in 3pm EST`() {
        assertEquals("EST", TimezoneAbbreviations.extractAbbreviation("3pm EST"))
    }

    @Test
    fun `extractAbbreviation - finds PST in 3 00 PM PST`() {
        assertEquals("PST", TimezoneAbbreviations.extractAbbreviation("3:00 PM PST"))
    }

    @Test
    fun `extractAbbreviation - finds CST in 19 30 CST`() {
        assertEquals("CST", TimezoneAbbreviations.extractAbbreviation("19:30 CST"))
    }

    @Test
    fun `extractAbbreviation - case insensitive`() {
        assertEquals("EST", TimezoneAbbreviations.extractAbbreviation("3pm est"))
    }

    @Test
    fun `extractAbbreviation - finds abbreviation in longer text`() {
        assertEquals("EST", TimezoneAbbreviations.extractAbbreviation("meeting at 3pm EST tomorrow"))
    }

    @Test
    fun `extractAbbreviation - returns first known abbreviation`() {
        assertEquals("EST", TimezoneAbbreviations.extractAbbreviation("3pm EST or PST"))
    }

    @Test
    fun `extractAbbreviation - returns null when no abbreviation found`() {
        assertNull(TimezoneAbbreviations.extractAbbreviation("3pm"))
        assertNull(TimezoneAbbreviations.extractAbbreviation("meeting tomorrow"))
    }

    @Test
    fun `extractAbbreviation - does not match non-timezone words`() {
        assertNull(TimezoneAbbreviations.extractAbbreviation("THE CAR IS RED"))
    }

    @Test
    fun `extractAbbreviation - matches zone-based PT and ET`() {
        assertEquals("PT", TimezoneAbbreviations.extractAbbreviation("4:30 a.m. PT"))
        assertEquals("ET", TimezoneAbbreviations.extractAbbreviation("7:30 a.m. ET"))
    }

    // ========== fixedOffsetTimezone ==========

    @Test
    fun `fixedOffsetTimezone - negative offset`() {
        val tz = TimezoneAbbreviations.fixedOffsetTimezone(-300)
        val dt = LocalDateTime(2026, 4, 10, 15, 0)
        val instant = dt.toInstant(tz)
        // 3pm at UTC-5 = 8pm UTC
        assertEquals(20, instant.toLocalDateTime(TimeZone.UTC).hour)
    }

    @Test
    fun `fixedOffsetTimezone - positive offset`() {
        val tz = TimezoneAbbreviations.fixedOffsetTimezone(540)
        val dt = LocalDateTime(2026, 4, 10, 15, 0)
        val instant = dt.toInstant(tz)
        // 3pm at UTC+9 = 6am UTC
        assertEquals(6, instant.toLocalDateTime(TimeZone.UTC).hour)
    }

    @Test
    fun `fixedOffsetTimezone - half-hour offset`() {
        val tz = TimezoneAbbreviations.fixedOffsetTimezone(330)
        val dt = LocalDateTime(2026, 4, 10, 15, 0)
        val instant = dt.toInstant(tz)
        // 3pm at UTC+5:30 = 9:30am UTC
        val utc = instant.toLocalDateTime(TimeZone.UTC)
        assertEquals(9, utc.hour)
        assertEquals(30, utc.minute)
    }

    // ========== computeInstant ==========

    @Test
    fun `computeInstant - uses abbreviation offset not IANA zone DST`() {
        // Scenario: "3pm EST" in summer. IANA zone America/New_York would use EDT (-4),
        // but EST is always -5. computeInstant should use -5.
        val dt = LocalDateTime(2026, 7, 15, 15, 0)
        val tz = TimeZone.of("America/New_York")

        val result = TimezoneAbbreviations.computeInstant(dt, tz, "3pm EST")
        val naive = dt.toInstant(tz) // EDT: 3pm + 4h = 7pm UTC

        // EST: 3pm + 5h = 8pm UTC
        assertEquals(20, result.toLocalDateTime(TimeZone.UTC).hour)
        // Verify it differs from the naive computation
        assertEquals(19, naive.toLocalDateTime(TimeZone.UTC).hour)
    }

    @Test
    fun `computeInstant - ambiguous abbreviation uses IANA zone`() {
        val dt = LocalDateTime(2026, 1, 15, 15, 0)
        val tz = TimeZone.of("America/Chicago")
        val result = TimezoneAbbreviations.computeInstant(dt, tz, "3pm CST")
        // CST is ambiguous → falls back to IANA zone (Chicago in winter = CST = -6)
        assertEquals(dt.toInstant(tz), result)
    }

    @Test
    fun `computeInstant - no abbreviation uses IANA zone`() {
        val dt = LocalDateTime(2026, 7, 15, 15, 0)
        val tz = TimeZone.of("America/New_York")
        val result = TimezoneAbbreviations.computeInstant(dt, tz, "3pm Eastern")
        assertEquals(dt.toInstant(tz), result)
    }

    @Test
    fun `computeInstant - corrects Gemini wrong instant for EST`() {
        // Gemini returns America/New_York for "3pm EST". In summer, NY is EDT (-4).
        // computeInstant should correct to EST (-5).
        val dt = LocalDateTime(2026, 7, 15, 15, 0)
        val geminiZone = TimeZone.of("America/New_York")

        val corrected = TimezoneAbbreviations.computeInstant(dt, geminiZone, "3pm EST")
        val expected = dt.toInstant(TimezoneAbbreviations.fixedOffsetTimezone(-300))
        assertEquals(expected, corrected)
    }

    @Test
    fun `computeInstant - PST in summer corrected from PDT zone`() {
        val dt = LocalDateTime(2026, 7, 15, 15, 0)
        val tz = TimeZone.of("America/Los_Angeles")

        val result = TimezoneAbbreviations.computeInstant(dt, tz, "3pm PST")
        // PST = UTC-8, not PDT (UTC-7)
        val expected = dt.toInstant(TimezoneAbbreviations.fixedOffsetTimezone(-480))
        assertEquals(expected, result)
    }

    // ========== Cross-extractor consistency ==========

    @Test
    fun `same input 3pm EST produces same instant from both Chrono and Gemini paths`() {
        val dt = LocalDateTime(2026, 7, 15, 15, 0)

        // Chrono path: raw offset -300 → fixed offset timezone
        val chronoInstant = dt.toInstant(TimezoneAbbreviations.fixedOffsetTimezone(-300))

        // Gemini path: IANA zone + abbreviation correction
        val geminiInstant = TimezoneAbbreviations.computeInstant(
            dt, TimeZone.of("America/New_York"), "3pm EST"
        )

        assertEquals(chronoInstant, geminiInstant)
    }

    @Test
    fun `same input 3pm PST produces same instant from both paths`() {
        val dt = LocalDateTime(2026, 7, 15, 15, 0)

        val chronoInstant = dt.toInstant(TimezoneAbbreviations.fixedOffsetTimezone(-480))
        val geminiInstant = TimezoneAbbreviations.computeInstant(
            dt, TimeZone.of("America/Los_Angeles"), "3pm PST"
        )

        assertEquals(chronoInstant, geminiInstant)
    }
}
