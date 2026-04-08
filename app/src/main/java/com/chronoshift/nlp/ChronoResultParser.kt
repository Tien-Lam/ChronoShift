package com.chronoshift.nlp

import com.chronoshift.conversion.ExtractedTime
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.UtcOffset
import kotlinx.datetime.toInstant
import org.json.JSONArray

object ChronoResultParser {

    data class ParsedResult(
        val extracted: ExtractedTime,
        val dateCertain: Boolean,
    )

    fun parse(json: String, originalText: String, cityResolver: CityResolverInterface?): List<ExtractedTime> {
        val parsed = parseRaw(json)
        val propagated = propagateDates(parsed)
        val hasRealTimes = propagated.any { it.confidence > 0.0f }
        val filtered = if (hasRealTimes) propagated.filter { it.confidence > 0.0f } else propagated
        return resolveCities(filtered, originalText, cityResolver)
    }

    fun parseRaw(json: String): List<ParsedResult> {
        val array = try { JSONArray(json) } catch (_: Exception) { return emptyList() }
        val parsed = mutableListOf<ParsedResult>()

        for (i in 0 until array.length()) {
            val obj = try { array.getJSONObject(i) } catch (_: Exception) { continue }
            try {
                val text = obj.getString("text")
                val start = obj.getJSONObject("start")
                val isCertain = start.optJSONObject("isCertain")

                val year = start.getInt("year")
                val month = start.getInt("month")
                val day = start.getInt("day")
                val hour = start.optInt("hour", 12)
                val minute = start.optInt("minute", 0)
                val second = start.optInt("second", 0)
                val dateCertain = isCertain?.optBoolean("day", false) ?: false
                val hourCertain = isCertain?.optBoolean("hour", false) ?: false

                val tzOffsetMinutes = if (start.isNull("timezone")) null else start.getInt("timezone")
                val tz = tzOffsetMinutes?.let { offsetToTimezone(it) }
                val dt = LocalDateTime(year, month, day, hour, minute, second)

                // Bare date with no time or timezone (e.g. "April 7" defaulting to noon):
                // keep for date propagation but mark as date-only.
                // Detect by: hour is uncertain, uses default value (12), and no timezone.
                val isDateOnly = !hourCertain && hour == 12 && minute == 0 && tz == null

                parsed.add(ParsedResult(
                    extracted = ExtractedTime(
                        instant = if (tz != null) dt.toInstant(tz) else null,
                        localDateTime = dt,
                        sourceTimezone = tz,
                        originalText = text,
                        confidence = if (isDateOnly) 0.0f else if (dateCertain) 0.95f else 0.85f,
                    ),
                    dateCertain = dateCertain,
                ))

                if (!obj.isNull("end")) {
                    val end = obj.getJSONObject("end")
                    val endDt = LocalDateTime(
                        end.getInt("year"), end.getInt("month"), end.getInt("day"),
                        end.optInt("hour", 12), end.optInt("minute", 0), end.optInt("second", 0),
                    )
                    val endTz = if (end.isNull("timezone")) tz else offsetToTimezone(end.getInt("timezone"))

                    parsed.add(ParsedResult(
                        extracted = ExtractedTime(
                            instant = if (endTz != null) endDt.toInstant(endTz) else null,
                            localDateTime = endDt,
                            sourceTimezone = endTz,
                            originalText = "$text (end)",
                            confidence = 0.85f,
                        ),
                        dateCertain = false,
                    ))
                }
            } catch (_: Exception) {
                // skip malformed entry
            }
        }
        return parsed
    }

    fun propagateDates(parsed: List<ParsedResult>): List<ExtractedTime> {
        val refDate = parsed.firstOrNull { it.dateCertain }?.extracted?.localDateTime?.date
            ?: return parsed.map { it.extracted }

        return parsed.map { p ->
            if (!p.dateCertain && p.extracted.localDateTime != null) {
                val fixed = LocalDateTime(refDate, p.extracted.localDateTime.time)
                val tz = p.extracted.sourceTimezone
                p.extracted.copy(
                    localDateTime = fixed,
                    instant = if (tz != null) fixed.toInstant(tz) else null,
                )
            } else {
                p.extracted
            }
        }
    }

    private fun resolveCities(
        results: List<ExtractedTime>,
        originalText: String,
        cityResolver: CityResolverInterface?,
    ): List<ExtractedTime> {
        if (cityResolver == null) return results
        val cityPattern = Regex("""(?:in|at)\s+([A-Za-z][A-Za-z .'-]{1,30})""", RegexOption.IGNORE_CASE)
        val cityMatch = cityPattern.find(originalText)?.groupValues?.get(1)?.trim()
        val cityTz = cityMatch?.let { cityResolver.resolve(it) }

        return results.map { ext ->
            if (ext.sourceTimezone == null && cityTz != null) ext.copy(sourceTimezone = cityTz)
            else ext
        }
    }

    fun mergeSpanAndFullResults(
        spanResults: List<ExtractedTime>,
        fullResults: List<ExtractedTime>,
    ): List<ExtractedTime> {
        val merged = spanResults.toMutableList()
        for (r in fullResults) {
            val matchIdx = merged.indexOfFirst {
                it.localDateTime?.hour == r.localDateTime?.hour &&
                    it.localDateTime?.minute == r.localDateTime?.minute
            }
            if (matchIdx >= 0) {
                val existing = merged[matchIdx]
                if (existing.sourceTimezone == null && r.sourceTimezone != null) {
                    merged[matchIdx] = r
                }
            } else {
                merged.add(r)
            }
        }
        return merged
    }

    private val PREFERRED_ZONES = setOf(
        "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
        "America/Anchorage", "America/Phoenix", "America/Toronto", "America/Vancouver",
        "America/Sao_Paulo", "America/Argentina/Buenos_Aires", "America/Mexico_City",
        "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
        "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore",
        "Asia/Hong_Kong", "Asia/Seoul", "Asia/Bangkok",
        "Australia/Sydney", "Australia/Melbourne", "Australia/Perth",
        "Pacific/Auckland", "Pacific/Honolulu",
        "Africa/Cairo", "Africa/Lagos", "Africa/Johannesburg",
        "UTC",
    )

    private val offsetCache = mutableMapOf<Int, TimeZone>()

    fun clearOffsetCache() { offsetCache.clear() }

    fun offsetToTimezone(offsetMinutes: Int): TimeZone {
        offsetCache[offsetMinutes]?.let { return it }

        val now = java.time.Instant.now()
        val targetOffset = java.time.ZoneOffset.ofTotalSeconds(offsetMinutes * 60)
        val matches = java.time.ZoneId.getAvailableZoneIds()
            .filter { '/' in it && !it.startsWith("Etc/") && !it.startsWith("SystemV/") }
            .filter { java.time.ZoneId.of(it).rules.getOffset(now) == targetOffset }

        // Prefer well-known zones: canonical cities first, then by region
        val named = matches.sortedWith(compareBy<String> { id ->
            if (id in PREFERRED_ZONES) 0 else 1
        }.thenBy { id ->
            when {
                id.startsWith("America/") -> 0
                id.startsWith("Europe/") -> 1
                id.startsWith("Asia/") -> 2
                id.startsWith("Australia/") -> 3
                id.startsWith("Pacific/") -> 4
                id.startsWith("Africa/") -> 5
                else -> 9
            }
        }).firstOrNull()

        val tz = if (named != null) {
            TimeZone.of(named)
        } else {
            val hours = offsetMinutes / 60
            val mins = offsetMinutes % 60
            TimeZone.of(UtcOffset(hours, mins).toString())
        }
        offsetCache[offsetMinutes] = tz
        return tz
    }
}
