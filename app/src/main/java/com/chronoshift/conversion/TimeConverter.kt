package com.chronoshift.conversion

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
        return extracted
            .mapNotNull { ext -> convert(ext, localZone) }
            .distinctBy { it.originalText + it.localDateTime + it.localTimezone }
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
        return if (mins != 0) {
            "UTC%+d:%02d".format(hours, mins)
        } else if (hours == 0) {
            "UTC"
        } else {
            "UTC%+d".format(hours)
        }
    }
}
