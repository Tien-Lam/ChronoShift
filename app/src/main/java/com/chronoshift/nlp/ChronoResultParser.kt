package com.chronoshift.nlp

import android.util.Log
import com.chronoshift.conversion.ExtractedTime
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.UtcOffset
import kotlinx.datetime.toInstant
import org.json.JSONArray

object ChronoResultParser {

    data class ParsedResult(
        val extracted: ExtractedTime,
        val dateCertain: Boolean,
        val rawOffsetMinutes: Int? = null,
    )

    private const val TAG = "ChronoResultParser"

    fun parse(json: String, originalText: String, cityResolver: CityResolverInterface?): List<ExtractedTime> {
        Log.d(TAG, "parse: input=\"$originalText\" jsonLength=${json.length}")
        val parsed = parseRaw(json)
        Log.d(TAG, "parseRaw: ${parsed.size} entry(ies)")
        parsed.forEachIndexed { i, p ->
            Log.d(TAG, "  [raw #$i] text=\"${p.extracted.originalText}\" localDt=${p.extracted.localDateTime} " +
                "rawOffset=${p.rawOffsetMinutes} tz=${p.extracted.sourceTimezone?.id} instant=${p.extracted.instant}")
        }
        val propagated = propagateDates(parsed)
        val hasRealTimes = propagated.any { it.confidence > 0.0f }
        val filtered = if (hasRealTimes) propagated.filter { it.confidence > 0.0f } else propagated
        val results = resolveCities(filtered, originalText, cityResolver)
        Log.d(TAG, "parse: ${results.size} final result(s)")
        return results
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
                val dt = LocalDateTime(year, month, day, hour, minute, second)

                // Compute instant from the raw offset (always correct, no DST ambiguity)
                val instant = tzOffsetMinutes?.let {
                    dt.toInstant(TimezoneAbbreviations.fixedOffsetTimezone(it))
                }
                // Find IANA zone matching this offset at this instant (for display labels)
                val tz = if (tzOffsetMinutes != null && instant != null) {
                    offsetToTimezone(tzOffsetMinutes, instant)
                } else null

                // Bare date with no time or timezone (e.g. "April 7" defaulting to noon):
                // keep for date propagation but mark as date-only.
                // Detect by: hour is uncertain, uses default value (12), and no timezone.
                val isDateOnly = !hourCertain && hour == 12 && minute == 0 && tz == null

                parsed.add(ParsedResult(
                    extracted = ExtractedTime(
                        instant = instant,
                        localDateTime = dt,
                        sourceTimezone = tz,
                        originalText = text,
                        confidence = if (isDateOnly) 0.0f else if (dateCertain) 0.95f else 0.85f,
                    ),
                    dateCertain = dateCertain,
                    rawOffsetMinutes = tzOffsetMinutes,
                ))

                if (!obj.isNull("end")) {
                    val end = obj.getJSONObject("end")
                    val endDt = LocalDateTime(
                        end.getInt("year"), end.getInt("month"), end.getInt("day"),
                        end.optInt("hour", 12), end.optInt("minute", 0), end.optInt("second", 0),
                    )
                    val endRawOffset = if (end.isNull("timezone")) tzOffsetMinutes else end.getInt("timezone")
                    val endInstant = endRawOffset?.let {
                        endDt.toInstant(TimezoneAbbreviations.fixedOffsetTimezone(it))
                    }
                    val endTz = if (endRawOffset != null && endInstant != null) {
                        offsetToTimezone(endRawOffset, endInstant)
                    } else tz

                    parsed.add(ParsedResult(
                        extracted = ExtractedTime(
                            instant = endInstant,
                            localDateTime = endDt,
                            sourceTimezone = endTz,
                            originalText = "$text (end)",
                            confidence = 0.85f,
                        ),
                        dateCertain = false,
                        rawOffsetMinutes = endRawOffset,
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
                val rawOffset = p.rawOffsetMinutes
                val tz = p.extracted.sourceTimezone
                val newInstant = if (rawOffset != null) {
                    fixed.toInstant(TimezoneAbbreviations.fixedOffsetTimezone(rawOffset))
                } else if (tz != null) {
                    fixed.toInstant(tz)
                } else null
                val newTz = if (rawOffset != null && newInstant != null) {
                    offsetToTimezone(rawOffset, newInstant)
                } else tz
                p.extracted.copy(
                    localDateTime = fixed,
                    instant = newInstant,
                    sourceTimezone = newTz,
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

    fun expandAmbiguous(results: List<ExtractedTime>): List<ExtractedTime> {
        val expanded = results.toMutableList()

        // Group by ambiguous abbreviation found in original text
        val groups = mutableMapOf<String, MutableList<ExtractedTime>>()
        for (result in results) {
            if (result.sourceTimezone == null || result.localDateTime == null) continue
            val abbr = TimezoneAbbreviations.extractAbbreviation(result.originalText) ?: continue
            if (TimezoneAbbreviations.isAmbiguous(abbr)) {
                groups.getOrPut(abbr) { mutableListOf() }.add(result)
            }
        }

        for ((abbr, group) in groups) {
            val offsets = TimezoneAbbreviations.ambiguousOffsets(abbr) ?: continue
            val coveredOffsets = offsets.filter { offset ->
                group.any { result ->
                    val tz = result.sourceTimezone!!
                    val inst = result.instant
                    (inst != null && offsetToTimezone(offset, inst) == tz) ||
                        TimezoneAbbreviations.standardOffsetMinutes(tz) == offset
                }
            }.toSet()

            val template = group.first()
            val dt = template.localDateTime!!
            for (missingOffset in offsets) {
                if (missingOffset in coveredOffsets) continue
                val altInstant = dt.toInstant(TimezoneAbbreviations.fixedOffsetTimezone(missingOffset))
                val altTz = offsetToTimezone(missingOffset, altInstant)
                expanded.add(template.copy(instant = altInstant, sourceTimezone = altTz))
            }
        }

        return expanded
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
        val hasRealTimes = merged.any { it.confidence > 0.0f }
        return if (hasRealTimes) merged.filter { it.confidence > 0.0f } else merged
    }

    private val PREFERRED_ZONE_LIST = listOf(
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
    private val PREFERRED_ZONES = PREFERRED_ZONE_LIST.toSet()

    private val offsetCache = java.util.concurrent.ConcurrentHashMap<Int, TimeZone>()

    fun clearOffsetCache() { offsetCache.clear() }

    fun offsetToTimezone(offsetMinutes: Int, atInstant: Instant? = null): TimeZone {
        if (atInstant == null) {
            offsetCache[offsetMinutes]?.let { return it }
        }

        // Find IANA zones whose offset at the given instant matches.
        // Using the actual parsed instant (not system time) makes this deterministic:
        // same input always produces the same zone, and the zone's offset at the instant
        // matches the raw offset (so instant.toLocalDateTime(zone) gives back the original time).
        val reference = if (atInstant != null) {
            java.time.Instant.ofEpochSecond(atInstant.epochSeconds)
        } else {
            java.time.Instant.now()
        }
        val targetOffset = java.time.ZoneOffset.ofTotalSeconds(offsetMinutes * 60)
        val matches = java.time.ZoneId.getAvailableZoneIds()
            .filter { '/' in it && !it.startsWith("Etc/") && !it.startsWith("SystemV/") }
            .filter { java.time.ZoneId.of(it).rules.getOffset(reference) == targetOffset }

        // Prefer well-known zones: by position in PREFERRED list (earlier = higher priority),
        // then by region, then alphabetical for full determinism
        val named = matches.sortedWith(compareBy<String> { id ->
            val idx = PREFERRED_ZONE_LIST.indexOf(id)
            if (idx >= 0) idx else Int.MAX_VALUE
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
        }.thenBy { it }).firstOrNull()

        val tz = if (named != null) {
            TimeZone.of(named)
        } else {
            val hours = offsetMinutes / 60
            val mins = offsetMinutes % 60
            TimeZone.of(UtcOffset(hours, mins).toString())
        }
        if (atInstant == null) {
            offsetCache[offsetMinutes] = tz
        }
        return tz
    }
}
