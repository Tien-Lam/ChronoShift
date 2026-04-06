package com.chronoshift.nlp

import com.chronoshift.conversion.ExtractedTime
import kotlinx.datetime.Clock
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.LocalTime
import kotlinx.datetime.TimeZone
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
        results.addAll(extractUnixTimestamp(text))
        results.addAll(extractTimeInCity(text))
        return ExtractionResult(results, "Regex")
    }

    // --- Unix timestamps: "1712678400" ---

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

    // --- Time + city name: "5:00 in New York", "3pm in Tokyo" ---

    private fun extractTimeInCity(text: String): List<ExtractedTime> {
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

    private fun adjustAmPm(hour: Int, ampm: String): Int? {
        var h = hour
        when (ampm) {
            "pm" -> if (h != 12) h += 12
            "am" -> if (h == 12) h = 0
            "" -> {}
        }
        return if (h in 0..23) h else null
    }
}
