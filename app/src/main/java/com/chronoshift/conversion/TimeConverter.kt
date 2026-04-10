package com.chronoshift.conversion

import android.util.Log
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toInstant
import kotlinx.datetime.toLocalDateTime
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.time.ZoneId as JavaZoneId
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TimeConverter @Inject constructor() {

    private val timeFormatter = DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT)
    private val dateFormatter = DateTimeFormatter.ofLocalizedDate(FormatStyle.MEDIUM)

    fun toLocal(extracted: List<ExtractedTime>, localZone: TimeZone = TimeZone.currentSystemDefault()): List<ConvertedTime> {
        val results = extracted
            .mapNotNull { ext -> convert(ext, localZone) }
            .distinctBy { it.originalText + it.localDateTime + it.localTimezone }
        Log.d(TAG, "toLocal: ${extracted.size} extracted → ${results.size} converted (localZone=${localZone.id})")
        results.forEachIndexed { i, c ->
            Log.d(TAG, "  [card #$i] \"${c.originalText}\" ${c.sourceDateTime} ${c.sourceTimezone} → ${c.localDateTime} ${c.localTimezone} (${c.method})")
        }
        return results
    }

    private fun convert(ext: ExtractedTime, localZone: TimeZone): ConvertedTime? {
        val sourceZone = ext.sourceTimezone ?: localZone
        val instant: Instant = ext.instant
            ?: ext.localDateTime?.toInstant(sourceZone)
            ?: return null

        val localDt = instant.toLocalDateTime(localZone)
        val sourceDt = instant.toLocalDateTime(sourceZone)

        val javaLocalZone = JavaZoneId.of(localZone.id)
        val javaSourceZone = JavaZoneId.of(sourceZone.id)

        val localJavaTime = java.time.LocalDateTime.of(
            localDt.year, localDt.monthNumber, localDt.dayOfMonth,
            localDt.hour, localDt.minute, localDt.second
        )
        val sourceJavaTime = java.time.LocalDateTime.of(
            sourceDt.year, sourceDt.monthNumber, sourceDt.dayOfMonth,
            sourceDt.hour, sourceDt.minute, sourceDt.second
        )

        val javaInstant = java.time.Instant.ofEpochSecond(instant.epochSeconds)

        return ConvertedTime(
            originalText = ext.originalText,
            sourceTimezone = formatZoneName(javaSourceZone, javaInstant),
            sourceDateTime = sourceJavaTime.format(timeFormatter),
            sourceDate = sourceJavaTime.format(dateFormatter),
            localDateTime = localJavaTime.format(timeFormatter),
            localTimezone = formatZoneName(javaLocalZone, javaInstant),
            localDate = localJavaTime.format(dateFormatter),
            method = ext.method,
        )
    }

    private fun formatZoneName(zone: JavaZoneId, instant: java.time.Instant): String {
        val offset = zone.rules.getOffset(instant)
        val totalMinutes = offset.totalSeconds / 60
        val hours = totalMinutes / 60
        val mins = Math.abs(totalMinutes % 60)
        val utcLabel = if (mins != 0) {
            "UTC%+d:%02d".format(hours, mins)
        } else if (hours == 0) {
            "UTC"
        } else {
            "UTC%+d".format(hours)
        }

        val cityLabel = ZONE_LABELS[zone.id]
            ?: zone.id.substringAfterLast('/').replace('_', ' ')
                .takeIf { it != zone.id && it.length > 1 }

        return if (cityLabel != null) "$utcLabel $cityLabel" else utcLabel
    }

    companion object {
        private const val TAG = "TimeConverter"
        private val ZONE_LABELS = mapOf(
            "America/New_York" to "New York",
            "America/Chicago" to "Chicago",
            "America/Denver" to "Denver",
            "America/Los_Angeles" to "Los Angeles",
            "America/Anchorage" to "Anchorage",
            "America/Phoenix" to "Phoenix",
            "America/Toronto" to "Toronto",
            "America/Vancouver" to "Vancouver",
            "America/Mexico_City" to "Mexico City",
            "America/Sao_Paulo" to "São Paulo",
            "America/Argentina/Buenos_Aires" to "Buenos Aires",
            "America/Halifax" to "Halifax",
            "America/St_Johns" to "St. John's",
            "Europe/London" to "London",
            "Europe/Paris" to "Paris",
            "Europe/Berlin" to "Berlin",
            "Europe/Moscow" to "Moscow",
            "Europe/Istanbul" to "Istanbul",
            "Europe/Amsterdam" to "Amsterdam",
            "Europe/Madrid" to "Madrid",
            "Europe/Rome" to "Rome",
            "Europe/Zurich" to "Zurich",
            "Europe/Stockholm" to "Stockholm",
            "Europe/Warsaw" to "Warsaw",
            "Europe/Bucharest" to "Bucharest",
            "Europe/Athens" to "Athens",
            "Europe/Dublin" to "Dublin",
            "Europe/Lisbon" to "Lisbon",
            "Europe/Helsinki" to "Helsinki",
            "Europe/Kyiv" to "Kyiv",
            "Asia/Tokyo" to "Tokyo",
            "Asia/Shanghai" to "Shanghai",
            "Asia/Hong_Kong" to "Hong Kong",
            "Asia/Singapore" to "Singapore",
            "Asia/Seoul" to "Seoul",
            "Asia/Kolkata" to "Kolkata",
            "Asia/Dubai" to "Dubai",
            "Asia/Bangkok" to "Bangkok",
            "Asia/Jakarta" to "Jakarta",
            "Asia/Taipei" to "Taipei",
            "Asia/Manila" to "Manila",
            "Asia/Karachi" to "Karachi",
            "Asia/Dhaka" to "Dhaka",
            "Asia/Tehran" to "Tehran",
            "Asia/Riyadh" to "Riyadh",
            "Asia/Jerusalem" to "Jerusalem",
            "Asia/Kuala_Lumpur" to "Kuala Lumpur",
            "Australia/Sydney" to "Sydney",
            "Australia/Melbourne" to "Melbourne",
            "Australia/Perth" to "Perth",
            "Australia/Adelaide" to "Adelaide",
            "Australia/Brisbane" to "Brisbane",
            "Pacific/Auckland" to "Auckland",
            "Pacific/Honolulu" to "Honolulu",
            "Africa/Cairo" to "Cairo",
            "Africa/Lagos" to "Lagos",
            "Africa/Nairobi" to "Nairobi",
            "Africa/Johannesburg" to "Johannesburg",
            "UTC" to "GMT",
        )
    }
}
