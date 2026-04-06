package com.chronoshift.nlp

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class ChronoExtractorTest {

    private fun parse(json: String, originalText: String = "") =
        ChronoResultParser.parse(json, originalText, TestCityResolver())

    // --- Timezone offset resolution ---

    @Test
    fun `PT offset -420 resolves to named IANA zone`() {
        val tz = ChronoResultParser.offsetToTimezone(-420)
        assertTrue("Expected named zone, got ${tz.id}", '/' in tz.id)
    }

    @Test
    fun `ET offset -240 resolves to named IANA zone`() {
        val tz = ChronoResultParser.offsetToTimezone(-240)
        assertTrue("Expected named zone, got ${tz.id}", '/' in tz.id)
    }

    @Test
    fun `UTC offset 0 resolves`() {
        val tz = ChronoResultParser.offsetToTimezone(0)
        assertNotNull(tz)
    }

    @Test
    fun `JST offset 540 resolves to named IANA zone`() {
        val tz = ChronoResultParser.offsetToTimezone(540)
        assertTrue("Expected named zone, got ${tz.id}", '/' in tz.id)
    }

    // --- parseResults basic ---

    @Test
    fun `parses single result with timezone`() {
        val json = """[{"text":"3:00 PM EST","index":0,"start":{"year":2026,"month":4,"day":9,"hour":15,"minute":0,"second":0,"timezone":-300,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":true}},"end":null}]"""
        val results = parse(json)
        assertEquals(1, results.size)
        assertEquals(15, results[0].localDateTime!!.hour)
        assertNotNull("Should have timezone", results[0].sourceTimezone)
        assertTrue("Should be named zone, got ${results[0].sourceTimezone!!.id}", '/' in results[0].sourceTimezone!!.id)
    }

    @Test
    fun `parses result without timezone`() {
        val json = """[{"text":"3:00 PM","index":0,"start":{"year":2026,"month":4,"day":6,"hour":15,"minute":0,"second":0,"timezone":null,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":false}},"end":null}]"""
        val results = parse(json)
        assertEquals(1, results.size)
        assertEquals(null, results[0].sourceTimezone)
    }

    // --- Time ranges ---

    @Test
    fun `parses time range into start and end`() {
        val json = """[{"text":"12:00 pm - 12:50 pm EDT","index":0,"start":{"year":2026,"month":4,"day":9,"hour":12,"minute":0,"second":0,"timezone":-240,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":true}},"end":{"year":2026,"month":4,"day":9,"hour":12,"minute":50,"second":0,"timezone":-240}}]"""
        val results = parse(json)
        assertEquals(2, results.size)
        assertEquals(12, results[0].localDateTime!!.hour)
        assertEquals(0, results[0].localDateTime!!.minute)
        assertEquals(12, results[1].localDateTime!!.hour)
        assertEquals(50, results[1].localDateTime!!.minute)
    }

    // --- Date propagation ---

    @Test
    fun `propagates date from certain result to uncertain`() {
        val json = """[{"text":"April 9 at 9:00 a.m. PT","index":0,"start":{"year":2026,"month":4,"day":9,"hour":9,"minute":0,"second":0,"timezone":-420,"isCertain":{"year":false,"month":true,"day":true,"hour":true,"minute":true,"timezone":true}},"end":null},{"text":"12:00 p.m. ET","index":30,"start":{"year":2026,"month":4,"day":6,"hour":12,"minute":0,"second":0,"timezone":-240,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":true}},"end":null}]"""
        val results = parse(json)
        assertEquals(2, results.size)
        assertEquals(9, results[0].localDateTime!!.dayOfMonth)
        assertEquals(9, results[1].localDateTime!!.dayOfMonth)
        assertEquals(4, results[1].localDateTime!!.monthNumber)
    }

    @Test
    fun `no propagation when no certain date`() {
        val json = """[{"text":"3:00 PM EST","index":0,"start":{"year":2026,"month":4,"day":6,"hour":15,"minute":0,"second":0,"timezone":-300,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":true}},"end":null}]"""
        val results = parse(json)
        assertEquals(1, results.size)
        assertEquals(6, results[0].localDateTime!!.dayOfMonth)
    }

    // --- City resolution ---

    @Test
    fun `resolves city from context when no timezone`() {
        val json = """[{"text":"5:00","index":0,"start":{"year":2026,"month":4,"day":6,"hour":5,"minute":0,"second":0,"timezone":null,"isCertain":{"year":false,"month":false,"day":false,"hour":true,"minute":true,"timezone":false}},"end":null}]"""
        val results = parse(json, "5:00 in New York")
        assertEquals(1, results.size)
        assertNotNull("Should resolve city timezone", results[0].sourceTimezone)
    }

    // --- Edge cases ---

    @Test
    fun `empty JSON array returns empty`() {
        assertEquals(0, parse("[]").size)
    }

    @Test
    fun `malformed JSON returns empty`() {
        assertEquals(0, parse("not json").size)
    }

    @Test
    fun `missing optional fields use defaults`() {
        val json = """[{"text":"something","index":0,"start":{"year":2026,"month":1,"day":1},"end":null}]"""
        val results = parse(json)
        assertEquals(1, results.size)
        assertEquals(12, results[0].localDateTime!!.hour)
    }
}
