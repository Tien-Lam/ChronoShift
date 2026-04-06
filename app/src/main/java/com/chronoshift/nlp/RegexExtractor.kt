package com.chronoshift.nlp

import com.chronoshift.conversion.ExtractedTime
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDate
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.LocalTime
import kotlinx.datetime.Month
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toInstant
import kotlinx.datetime.toLocalDateTime
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class RegexExtractor @Inject constructor(
    private val cityResolver: CityResolverInterface,
) : TimeExtractor {

    override suspend fun isAvailable(): Boolean = true

    override suspend fun extract(text: String): ExtractionResult {
        val results = mutableListOf<ExtractedTime>()
        results.addAll(extractIso8601(text))
        results.addAll(extractDateTimeWithZone(text))
        results.addAll(extractTimeRangeWithZone(text))
        results.addAll(extractTimeWithZone(text))
        results.addAll(extractTimeInCity(text))
        results.addAll(extractUnixTimestamp(text))
        return ExtractionResult(deduplicate(propagateDates(results)), "Regex")
    }

    private fun propagateDates(results: List<ExtractedTime>): List<ExtractedTime> {
        // Find a result with an explicit date (high confidence = came from a date+time pattern)
        val withDate = results.firstOrNull { it.confidence >= 0.9f && it.localDateTime != null }
            ?: return results

        val referenceDate = withDate.localDateTime!!.date

        // Apply that date to lower-confidence results (time-only patterns that defaulted to today)
        return results.map { ext ->
            if (ext.confidence < 0.9f && ext.localDateTime != null) {
                ext.copy(localDateTime = LocalDateTime(referenceDate, ext.localDateTime.time))
            } else {
                ext
            }
        }
    }

    private fun deduplicate(results: List<ExtractedTime>): List<ExtractedTime> {
        // Remove results whose matched text is a substring of a longer result
        return results.filter { candidate ->
            results.none { other ->
                other !== candidate &&
                    candidate.originalText.length < other.originalText.length &&
                    candidate.originalText in other.originalText
            }
        }.distinctBy { "${it.originalText}|${it.localDateTime}|${it.instant}" }
    }

    // --- ISO 8601: "2026-04-09T15:00:00Z", "2026-04-09 15:00+02:00" ---

    private fun extractIso8601(text: String): List<ExtractedTime> {
        val pattern = Regex(
            """(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?)(Z|[+-]\d{2}:?\d{2})?"""
        )
        return pattern.findAll(text).mapNotNull { match ->
            try {
                val dtPart = match.groupValues[1].replace(' ', 'T')
                val tzPart = match.groupValues[2]
                if (tzPart.isNotEmpty()) {
                    val normalized = ensureSeconds(dtPart) + normalizeTzOffset(tzPart)
                    val instant = Instant.parse(normalized)
                    ExtractedTime(
                        instant = instant,
                        originalText = match.value,
                        confidence = 0.95f,
                    )
                } else {
                    val dt = LocalDateTime.parse(ensureSeconds(dtPart))
                    ExtractedTime(
                        localDateTime = dt,
                        originalText = match.value,
                        confidence = 0.8f,
                    )
                }
            } catch (_: Exception) {
                null
            }
        }.toList()
    }

    // --- Natural language date + time + timezone ---
    // "April 9 at 9:00 a.m. PT", "Jan 5, 2026 3:00 PM EST", "March 15 at 3pm CST"
    // "12/25 at 3pm EST", "04/09/2026 3:00 PM EST"

    private fun extractDateTimeWithZone(text: String): List<ExtractedTime> {
        val results = mutableListOf<ExtractedTime>()
        results.addAll(extractMonthNameDateTimeZone(text))
        results.addAll(extractNumericDateTimeZone(text))
        results.addAll(extractIsoDateWithTzAbbrev(text))
        return results
    }

    // "April 9 at 9:00 a.m. PT", "Apr 9 @ 3:00 PM EST", "March 15 at 3pm CST"
    private fun extractMonthNameDateTimeZone(text: String): List<ExtractedTime> {
        val pattern = Regex(
            """($MONTH_PATTERN)\s+(\d{1,2})(?:,?\s+(\d{4}))?\s*(?:,\s*|\s+at\s+|\s*@\s*|\s+)""" +
                """(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\s*""" +
                """($TZ_PATTERN)""",
            RegexOption.IGNORE_CASE
        )
        return pattern.findAll(text).mapNotNull { match ->
            try {
                val monthStr = match.groupValues[1]
                val day = match.groupValues[2].toInt()
                val yearStr = match.groupValues[3]
                var hour = match.groupValues[4].toInt()
                val minute = match.groupValues[5].ifEmpty { "0" }.toInt()
                val ampm = match.groupValues[6].replace(".", "").lowercase()
                val tzAbbrev = match.groupValues[7]

                hour = adjustAmPm(hour, ampm) ?: return@mapNotNull null
                if (hour !in 0..23 || minute !in 0..59) return@mapNotNull null

                val month = parseMonth(monthStr) ?: return@mapNotNull null
                val tz = resolveTimezone(tzAbbrev) ?: return@mapNotNull null
                val now = Clock.System.now().toLocalDateTime(tz)
                val year = yearStr.ifEmpty { null }?.toInt() ?: inferYear(month, day, now)

                val date = LocalDate(year, month, day)
                val dt = LocalDateTime(date, LocalTime(hour, minute))

                ExtractedTime(
                    localDateTime = dt,
                    sourceTimezone = tz,
                    originalText = match.value.trim(),
                    confidence = 0.9f,
                )
            } catch (_: Exception) {
                null
            }
        }.toList()
    }

    // "12/25 at 3pm EST", "04/09/2026 3:00 PM EST", "4/9 3pm PT"
    private fun extractNumericDateTimeZone(text: String): List<ExtractedTime> {
        val pattern = Regex(
            """(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?\s*(?:,\s*|\s+at\s+|\s+)""" +
                """(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\s*""" +
                """($TZ_PATTERN)""",
            RegexOption.IGNORE_CASE
        )
        return pattern.findAll(text).mapNotNull { match ->
            try {
                val monthNum = match.groupValues[1].toInt()
                val day = match.groupValues[2].toInt()
                var yearStr = match.groupValues[3]
                var hour = match.groupValues[4].toInt()
                val minute = match.groupValues[5].ifEmpty { "0" }.toInt()
                val ampm = match.groupValues[6].replace(".", "").lowercase()
                val tzAbbrev = match.groupValues[7]

                hour = adjustAmPm(hour, ampm) ?: return@mapNotNull null
                if (hour !in 0..23 || minute !in 0..59) return@mapNotNull null
                if (monthNum !in 1..12 || day !in 1..31) return@mapNotNull null

                val tz = resolveTimezone(tzAbbrev) ?: return@mapNotNull null
                val now = Clock.System.now().toLocalDateTime(tz)
                val year = when {
                    yearStr.isEmpty() -> inferYear(Month(monthNum), day, now)
                    yearStr.length == 2 -> 2000 + yearStr.toInt()
                    else -> yearStr.toInt()
                }

                val date = LocalDate(year, monthNum, day)
                val dt = LocalDateTime(date, LocalTime(hour, minute))

                ExtractedTime(
                    localDateTime = dt,
                    sourceTimezone = tz,
                    originalText = match.value.trim(),
                    confidence = 0.85f,
                )
            } catch (_: Exception) {
                null
            }
        }.toList()
    }

    // "2026-04-09 15:00 EST", "2026-04-09 3pm PT"
    private fun extractIsoDateWithTzAbbrev(text: String): List<ExtractedTime> {
        val pattern = Regex(
            """(\d{4})-(\d{2})-(\d{2})\s+""" +
                """(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\s*""" +
                """($TZ_PATTERN)""",
            RegexOption.IGNORE_CASE
        )
        return pattern.findAll(text).mapNotNull { match ->
            try {
                val year = match.groupValues[1].toInt()
                val monthNum = match.groupValues[2].toInt()
                val day = match.groupValues[3].toInt()
                var hour = match.groupValues[4].toInt()
                val minute = match.groupValues[5].ifEmpty { "0" }.toInt()
                val ampm = match.groupValues[6].replace(".", "").lowercase()
                val tzAbbrev = match.groupValues[7]

                hour = adjustAmPm(hour, ampm) ?: return@mapNotNull null
                if (hour !in 0..23 || minute !in 0..59) return@mapNotNull null

                val tz = resolveTimezone(tzAbbrev) ?: return@mapNotNull null
                val date = LocalDate(year, monthNum, day)
                val dt = LocalDateTime(date, LocalTime(hour, minute))

                ExtractedTime(
                    localDateTime = dt,
                    sourceTimezone = tz,
                    originalText = match.value.trim(),
                    confidence = 0.9f,
                )
            } catch (_: Exception) {
                null
            }
        }.toList()
    }

    // --- Time ranges: "12:00 pm - 12:50 pm EDT", "9am - 5pm PST" ---
    // Timezone after the second time applies to both.

    private fun extractTimeRangeWithZone(text: String): List<ExtractedTime> {
        val pattern = Regex(
            """(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\s*[-–—to]+\s*""" +
                """(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\s*""" +
                """($TZ_PATTERN)""",
            RegexOption.IGNORE_CASE
        )
        return pattern.findAll(text).flatMap { match ->
            try {
                var hour1 = match.groupValues[1].toInt()
                val min1 = match.groupValues[2].ifEmpty { "0" }.toInt()
                val ampm1 = match.groupValues[3].replace(".", "").lowercase()
                var hour2 = match.groupValues[4].toInt()
                val min2 = match.groupValues[5].ifEmpty { "0" }.toInt()
                val ampm2 = match.groupValues[6].replace(".", "").lowercase()
                val tzAbbrev = match.groupValues[7]

                hour1 = adjustAmPm(hour1, ampm1.ifEmpty { ampm2 }) ?: return@flatMap emptyList()
                hour2 = adjustAmPm(hour2, ampm2.ifEmpty { ampm1 }) ?: return@flatMap emptyList()
                if (hour1 !in 0..23 || hour2 !in 0..23) return@flatMap emptyList()
                if (min1 !in 0..59 || min2 !in 0..59) return@flatMap emptyList()

                val tz = resolveTimezone(tzAbbrev) ?: return@flatMap emptyList()
                val today = Clock.System.now().toLocalDateTime(tz).date

                listOf(
                    ExtractedTime(
                        localDateTime = LocalDateTime(today, LocalTime(hour1, min1)),
                        sourceTimezone = tz,
                        originalText = match.value.trim(),
                        confidence = 0.85f,
                    ),
                    ExtractedTime(
                        localDateTime = LocalDateTime(today, LocalTime(hour2, min2)),
                        sourceTimezone = tz,
                        originalText = match.value.trim(),
                        confidence = 0.85f,
                    ),
                )
            } catch (_: Exception) {
                emptyList()
            }
        }.toList()
    }

    // --- Time + timezone (no date): "9:00 a.m. EST", "3pm PT", "15:00 UTC+2" ---

    private fun extractTimeWithZone(text: String): List<ExtractedTime> {
        val pattern = Regex(
            """(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\s*($TZ_PATTERN)""",
            RegexOption.IGNORE_CASE
        )
        return pattern.findAll(text).mapNotNull { match ->
            try {
                var hour = match.groupValues[1].toInt()
                val minute = match.groupValues[2].ifEmpty { "0" }.toInt()
                val ampm = match.groupValues[3].replace(".", "").lowercase()
                val tzAbbrev = match.groupValues[4]

                hour = adjustAmPm(hour, ampm) ?: return@mapNotNull null
                if (hour !in 0..23 || minute !in 0..59) return@mapNotNull null

                val tz = resolveTimezone(tzAbbrev) ?: return@mapNotNull null
                val today = Clock.System.now().toLocalDateTime(tz).date
                val dt = LocalDateTime(today, LocalTime(hour, minute))

                ExtractedTime(
                    localDateTime = dt,
                    sourceTimezone = tz,
                    originalText = match.value.trim(),
                    confidence = 0.85f,
                )
            } catch (_: Exception) {
                null
            }
        }.toList()
    }

    // --- Time + city name: "5:00 in New York", "3pm in Tokyo", "10:00 AM in London" ---
    // Uses fuzzy matching so "new yrok", "tokio", "sydeny" still resolve.

    private fun extractTimeInCity(text: String): List<ExtractedTime> {
        // Capture: time + "in"/"at" + remaining words (greedy, up to end or punctuation)
        val pattern = Regex(
            """(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\s+(?:in|at)\s+([A-Za-z][A-Za-z .'-]{1,30})""",
            RegexOption.IGNORE_CASE
        )
        return pattern.findAll(text).mapNotNull { match ->
            try {
                var hour = match.groupValues[1].toInt()
                val minute = match.groupValues[2].ifEmpty { "0" }.toInt()
                val ampm = match.groupValues[3].replace(".", "").lowercase()
                val cityQuery = match.groupValues[4].trim()

                hour = adjustAmPm(hour, ampm) ?: return@mapNotNull null
                if (hour !in 0..23 || minute !in 0..59) return@mapNotNull null

                val tz = cityResolver.resolve(cityQuery) ?: return@mapNotNull null
                val today = Clock.System.now().toLocalDateTime(tz).date
                val dt = LocalDateTime(today, LocalTime(hour, minute))

                ExtractedTime(
                    localDateTime = dt,
                    sourceTimezone = tz,
                    originalText = match.value.trim(),
                    confidence = 0.8f,
                )
            } catch (_: Exception) {
                null
            }
        }.toList()
    }

    // --- Unix timestamps ---

    private fun extractUnixTimestamp(text: String): List<ExtractedTime> {
        val pattern = Regex("""\b(1[4-9]\d{8}|[2-9]\d{9})\b""")
        return pattern.findAll(text).mapNotNull { match ->
            try {
                val seconds = match.value.toLong()
                val instant = Instant.fromEpochSeconds(seconds)
                val year = instant.toLocalDateTime(TimeZone.UTC).year
                if (year !in 2015..2035) return@mapNotNull null
                ExtractedTime(
                    instant = instant,
                    sourceTimezone = TimeZone.UTC,
                    originalText = match.value,
                    confidence = 0.6f,
                )
            } catch (_: Exception) {
                null
            }
        }.toList()
    }

    // --- Helpers ---

    private fun adjustAmPm(hour: Int, ampm: String): Int? {
        var h = hour
        when (ampm) {
            "pm" -> if (h != 12) h += 12
            "am" -> if (h == 12) h = 0
            "" -> {} // 24-hour format or no am/pm
        }
        return if (h in 0..23) h else null
    }

    private fun parseMonth(str: String): Month? {
        val lower = str.lowercase()
        return MONTH_MAP.entries.firstOrNull { lower.startsWith(it.key) }?.value
    }

    private fun inferYear(month: Month, day: Int, now: LocalDateTime): Int {
        // If the date has already passed this year, assume next year
        val thisYear = LocalDate(now.year, month, day)
        return if (thisYear < now.date) now.year + 1 else now.year
    }

    private fun ensureSeconds(isoDateTime: String): String {
        // "2026-04-09T15:00" -> "2026-04-09T15:00:00"
        val parts = isoDateTime.split("T")
        if (parts.size == 2) {
            val timeParts = parts[1].split(":")
            if (timeParts.size == 2) return "${parts[0]}T${parts[1]}:00"
        }
        return isoDateTime
    }

    private fun normalizeTzOffset(offset: String): String {
        if (offset == "Z") return "Z"
        val clean = offset.replace(":", "")
        return if (clean.length == 5) {
            "${clean.substring(0, 3)}:${clean.substring(3)}"
        } else {
            "${clean}:00"
        }
    }

    private fun resolveTimezone(abbrev: String): TimeZone? {
        val upper = abbrev.uppercase()
        if (upper.startsWith("UTC") || upper.startsWith("GMT+") || upper.startsWith("GMT-")) {
            return try { TimeZone.of(abbrev) } catch (_: Exception) { null }
        }
        val iana = TIMEZONE_ABBREVS[upper] ?: return null
        return try { TimeZone.of(iana) } catch (_: Exception) { null }
    }

    companion object {
        private val MONTH_MAP = linkedMapOf(
            "january" to Month.JANUARY, "jan" to Month.JANUARY,
            "february" to Month.FEBRUARY, "feb" to Month.FEBRUARY,
            "march" to Month.MARCH, "mar" to Month.MARCH,
            "april" to Month.APRIL, "apr" to Month.APRIL,
            "may" to Month.MAY,
            "june" to Month.JUNE, "jun" to Month.JUNE,
            "july" to Month.JULY, "jul" to Month.JULY,
            "august" to Month.AUGUST, "aug" to Month.AUGUST,
            "september" to Month.SEPTEMBER, "sept" to Month.SEPTEMBER, "sep" to Month.SEPTEMBER,
            "october" to Month.OCTOBER, "oct" to Month.OCTOBER,
            "november" to Month.NOVEMBER, "nov" to Month.NOVEMBER,
            "december" to Month.DECEMBER, "dec" to Month.DECEMBER,
        )

        private val MONTH_PATTERN = "(?:${
            MONTH_MAP.keys
                .sortedByDescending { it.length }
                .joinToString("|")
        })"

        val TIMEZONE_ABBREVS = mapOf(
            // US
            "EST" to "America/New_York",
            "EDT" to "America/New_York",
            "ET" to "America/New_York",
            "CST" to "America/Chicago",
            "CDT" to "America/Chicago",
            "CT" to "America/Chicago",
            "MST" to "America/Denver",
            "MDT" to "America/Denver",
            "MT" to "America/Denver",
            "PST" to "America/Los_Angeles",
            "PDT" to "America/Los_Angeles",
            "PT" to "America/Los_Angeles",
            "AKST" to "America/Anchorage",
            "AKDT" to "America/Anchorage",
            "AKT" to "America/Anchorage",
            "HST" to "Pacific/Honolulu",
            "HAST" to "Pacific/Honolulu",
            "HADT" to "Pacific/Honolulu",
            // Europe
            "GMT" to "Europe/London",
            "BST" to "Europe/London",
            "WET" to "Europe/Lisbon",
            "WEST" to "Europe/Lisbon",
            "CET" to "Europe/Paris",
            "CEST" to "Europe/Paris",
            "EET" to "Europe/Bucharest",
            "EEST" to "Europe/Bucharest",
            "MSK" to "Europe/Moscow",
            // Asia
            "IST" to "Asia/Kolkata",
            "PKT" to "Asia/Karachi",
            "ICT" to "Asia/Bangkok",
            "WIB" to "Asia/Jakarta",
            "JST" to "Asia/Tokyo",
            "KST" to "Asia/Seoul",
            "CST_CN" to "Asia/Shanghai",
            "HKT" to "Asia/Hong_Kong",
            "SGT" to "Asia/Singapore",
            "PHT" to "Asia/Manila",
            "MYT" to "Asia/Kuala_Lumpur",
            "TRT" to "Europe/Istanbul",
            "GST" to "Asia/Dubai",
            // Oceania
            "AEST" to "Australia/Sydney",
            "AEDT" to "Australia/Sydney",
            "AET" to "Australia/Sydney",
            "ACST" to "Australia/Adelaide",
            "ACDT" to "Australia/Adelaide",
            "ACT" to "Australia/Adelaide",
            "AWST" to "Australia/Perth",
            "AWT" to "Australia/Perth",
            "NZST" to "Pacific/Auckland",
            "NZDT" to "Pacific/Auckland",
            "NZT" to "Pacific/Auckland",
            // Americas
            "BRT" to "America/Sao_Paulo",
            "BRST" to "America/Sao_Paulo",
            "ART" to "America/Argentina/Buenos_Aires",
            "CLT" to "America/Santiago",
            "CLST" to "America/Santiago",
            "COT" to "America/Bogota",
            "PET" to "America/Lima",
            "VET" to "America/Caracas",
            "AST" to "America/Halifax",
            "ADT" to "America/Halifax",
            "NST" to "America/St_Johns",
            "NDT" to "America/St_Johns",
            // Universal
            "UTC" to "UTC",
        )

        // Sort longest-first so regex alternation matches "EST" before "ET"
        private val TZ_PATTERN = "(?:${
            TIMEZONE_ABBREVS.keys
                .sortedByDescending { it.length }
                .joinToString("|")
        }|UTC[+-]\\d{1,2}(?::\\d{2})?|GMT[+-]\\d{1,2}(?::\\d{2})?)"
    }
}
