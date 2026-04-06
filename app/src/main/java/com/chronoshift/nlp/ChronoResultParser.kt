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
        return resolveCities(propagated, originalText, cityResolver)
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

                val tzOffsetMinutes = if (start.isNull("timezone")) null else start.getInt("timezone")
                val tz = tzOffsetMinutes?.let { offsetToTimezone(it) }
                val dt = LocalDateTime(year, month, day, hour, minute, second)

                parsed.add(ParsedResult(
                    extracted = ExtractedTime(
                        instant = if (tz != null) dt.toInstant(tz) else null,
                        localDateTime = dt,
                        sourceTimezone = tz,
                        originalText = text,
                        confidence = if (dateCertain) 0.95f else 0.85f,
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

    private val offsetCache = mutableMapOf<Int, TimeZone>()

    fun offsetToTimezone(offsetMinutes: Int): TimeZone {
        offsetCache[offsetMinutes]?.let { return it }

        val now = java.time.Instant.now()
        val targetOffset = java.time.ZoneOffset.ofTotalSeconds(offsetMinutes * 60)
        val named = java.time.ZoneId.getAvailableZoneIds()
            .filter { '/' in it && !it.startsWith("Etc/") }
            .firstOrNull { java.time.ZoneId.of(it).rules.getOffset(now) == targetOffset }

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
