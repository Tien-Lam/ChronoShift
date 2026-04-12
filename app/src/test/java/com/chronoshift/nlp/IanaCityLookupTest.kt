package com.chronoshift.nlp

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class IanaCityLookupTest {

    // ========== Known city aliases ==========

    @Test
    fun `alias nyc resolves to America New_York`() {
        val tz = IanaCityLookup.resolve("nyc")
        assertNotNull(tz)
        assertEquals("America/New_York", tz!!.id)
    }

    @Test
    fun `alias sf resolves to America Los_Angeles`() {
        val tz = IanaCityLookup.resolve("sf")
        assertNotNull(tz)
        assertEquals("America/Los_Angeles", tz!!.id)
    }

    @Test
    fun `alias mumbai resolves to Asia Kolkata`() {
        val tz = IanaCityLookup.resolve("mumbai")
        assertNotNull(tz)
        assertEquals("Asia/Kolkata", tz!!.id)
    }

    @Test
    fun `alias hawaii resolves to Hawaii zone`() {
        val tz = IanaCityLookup.resolve("hawaii")
        assertNotNull(tz)
        // IANA map has "hawaii" -> "US/Hawaii" which overrides the CITY_ALIASES entry
        // because CITY_MAP is CITY_ALIASES + iana (right side wins)
        assertTrue(tz!!.id == "US/Hawaii" || tz.id == "Pacific/Honolulu")
    }

    // ========== IANA city names ==========

    @Test
    fun `IANA city tokyo resolves to Asia Tokyo`() {
        val tz = IanaCityLookup.resolve("tokyo")
        assertNotNull(tz)
        assertEquals("Asia/Tokyo", tz!!.id)
    }

    @Test
    fun `IANA city london resolves to Europe London`() {
        val tz = IanaCityLookup.resolve("london")
        assertNotNull(tz)
        assertEquals("Europe/London", tz!!.id)
    }

    // ========== Fuzzy matching (edit distance <= 2) ==========

    @Test
    fun `fuzzy match tokio resolves to Asia Tokyo`() {
        val tz = IanaCityLookup.resolve("tokio")
        assertNotNull(tz)
        assertEquals("Asia/Tokyo", tz!!.id)
    }

    @Test
    fun `fuzzy match sydny resolves to Australia Sydney`() {
        val tz = IanaCityLookup.resolve("sydny")
        assertNotNull(tz)
        assertEquals("Australia/Sydney", tz!!.id)
    }

    // ========== Prefix and substring matching ==========

    @Test
    fun `prefix los finds Los Angeles`() {
        val tz = IanaCityLookup.resolve("los")
        assertNotNull("'los' should match 'los angeles' via substring", tz)
        assertEquals("America/Los_Angeles", tz!!.id)
    }

    // ========== Unknown cities ==========

    @Test
    fun `unknown city returns null`() {
        val tz = IanaCityLookup.resolve("xyzabc123")
        assertNull(tz)
    }

    // ========== Case insensitivity ==========

    @Test
    fun `uppercase NYC resolves to America New_York`() {
        val tz = IanaCityLookup.resolve("NYC")
        assertNotNull(tz)
        assertEquals("America/New_York", tz!!.id)
    }

    @Test
    fun `uppercase TOKYO resolves to Asia Tokyo`() {
        val tz = IanaCityLookup.resolve("TOKYO")
        assertNotNull(tz)
        assertEquals("Asia/Tokyo", tz!!.id)
    }

    // ========== Whitespace handling ==========

    @Test
    fun `leading and trailing whitespace is trimmed`() {
        val tz = IanaCityLookup.resolve(" tokyo ")
        assertNotNull(tz)
        assertEquals("Asia/Tokyo", tz!!.id)
    }

    // ========== editDistance function ==========

    @Test
    fun `editDistance single substitution`() {
        assertEquals(1, IanaCityLookup.editDistance("cat", "bat"))
    }

    @Test
    fun `editDistance empty to non-empty`() {
        assertEquals(3, IanaCityLookup.editDistance("", "abc"))
    }

    @Test
    fun `editDistance non-empty to empty`() {
        assertEquals(3, IanaCityLookup.editDistance("abc", ""))
    }

    @Test
    fun `editDistance identical strings`() {
        assertEquals(0, IanaCityLookup.editDistance("abc", "abc"))
    }

    @Test
    fun `editDistance both empty`() {
        assertEquals(0, IanaCityLookup.editDistance("", ""))
    }

    @Test
    fun `editDistance insertion`() {
        assertEquals(1, IanaCityLookup.editDistance("ab", "abc"))
    }

    @Test
    fun `editDistance deletion`() {
        assertEquals(1, IanaCityLookup.editDistance("abc", "ab"))
    }

    @Test
    fun `editDistance multiple edits`() {
        assertEquals(3, IanaCityLookup.editDistance("kitten", "sitting"))
    }
}
