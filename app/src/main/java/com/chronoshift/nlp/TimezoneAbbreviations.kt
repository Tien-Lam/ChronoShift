package com.chronoshift.nlp

import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.UtcOffset
import kotlinx.datetime.toInstant

object TimezoneAbbreviations {

    // Unambiguous abbreviations → fixed UTC offset in minutes.
    // Small alias map for the gap that java.util.TimeZone can't fill
    // (it doesn't expose ambiguity info and doesn't recognize daylight abbreviations like EDT/PDT).
    private val UNAMBIGUOUS = mapOf(
        // North America
        "EST" to -300, "EDT" to -240,
        "CDT" to -300,
        "MST" to -420, "MDT" to -360,
        "PST" to -480, "PDT" to -420,
        "AKST" to -540, "AKDT" to -480,
        "HST" to -600,
        "NST" to -210, "NDT" to -150,
        // Europe
        "GMT" to 0, "UTC" to 0,
        "WET" to 0, "WEST" to 60,
        "CET" to 60, "CEST" to 120,
        "EET" to 120, "EEST" to 180,
        "MSK" to 180,
        // Asia
        "JST" to 540,
        "KST" to 540,
        "HKT" to 480,
        "SGT" to 480,
        "ICT" to 420,
        "WIB" to 420,
        "PKT" to 300,
        "NPT" to 345,
        // Oceania
        "AEST" to 600, "AEDT" to 660,
        "ACST" to 570, "ACDT" to 630,
        "AWST" to 480,
        "NZST" to 720, "NZDT" to 780,
        // Africa
        "WAT" to 60, "CAT" to 120, "EAT" to 180, "SAST" to 120,
    )

    // Abbreviations that map to multiple distinct UTC offsets across regions.
    // When the LLM provides an IANA zone, we use the zone's standard offset
    // to disambiguate which interpretation was intended.
    private val AMBIGUOUS = mapOf(
        "CST" to listOf(-360, 480),    // US Central Standard / China Standard
        "IST" to listOf(330, 60),      // India Standard / Irish Standard
        "BST" to listOf(60, 360),      // British Summer / Bangladesh Standard
        "AST" to listOf(-240, 180),    // Atlantic Standard / Arabia Standard
    )

    fun ambiguousOffsets(abbreviation: String): List<Int>? = AMBIGUOUS[abbreviation.uppercase()]

    fun resolveOffset(abbreviation: String): Int? {
        val upper = abbreviation.uppercase()
        if (upper in AMBIGUOUS) return null
        return UNAMBIGUOUS[upper]
    }

    fun isAmbiguous(abbreviation: String): Boolean = abbreviation.uppercase() in AMBIGUOUS

    fun extractAbbreviation(text: String): String? {
        val upper = text.uppercase()
        for (match in WORD_PATTERN.findAll(upper)) {
            val candidate = match.groupValues[1]
            if (candidate in UNAMBIGUOUS || candidate in AMBIGUOUS) return candidate
        }
        return null
    }

    fun fixedOffsetTimezone(offsetMinutes: Int): TimeZone {
        val hours = offsetMinutes / 60
        val mins = offsetMinutes % 60
        return TimeZone.of(UtcOffset(hours, mins).toString())
    }

    fun computeInstant(dt: LocalDateTime, tz: TimeZone, originalText: String): Instant {
        val abbr = extractAbbreviation(originalText) ?: return dt.toInstant(tz)
        val fixedOffset = resolveOffset(abbr)
        if (fixedOffset != null) return dt.toInstant(fixedOffsetTimezone(fixedOffset))

        // Ambiguous abbreviation (e.g. CST = US Central or China Standard).
        // The LLM already picked a region via the IANA zone. Use that zone's standard offset
        // if it matches one of the known offsets for this abbreviation — this honors the
        // "Standard" in CST/IST/etc. instead of applying DST rules.
        val possibleOffsets = AMBIGUOUS[abbr.uppercase()] ?: return dt.toInstant(tz)
        val standardOffset = standardOffsetMinutes(tz)
        if (standardOffset != null && standardOffset in possibleOffsets) {
            return dt.toInstant(fixedOffsetTimezone(standardOffset))
        }
        return dt.toInstant(tz)
    }

    fun standardOffsetMinutes(tz: TimeZone): Int? {
        return try {
            val javaZone = java.time.ZoneId.of(tz.id)
            val reference = java.time.Instant.parse("2025-01-01T00:00:00Z")
            javaZone.rules.getStandardOffset(reference).totalSeconds / 60
        } catch (_: Exception) {
            null
        }
    }

    private val WORD_PATTERN = Regex("""\b([A-Z]{2,5})\b""")
}
