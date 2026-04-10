package com.chronoshift.nlp

import android.util.Log
import com.chronoshift.conversion.ExtractedTime
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toInstant
import org.json.JSONArray
import org.json.JSONObject

object LlmResultParser {

    private const val TAG = "LlmResultParser"

    fun parseResponse(response: String): List<ExtractedTime> {
        val jsonStr = response.trim()
            .removePrefix("```json").removePrefix("```")
            .removeSuffix("```").trim()

        if (jsonStr.isEmpty() || jsonStr == "[]") return emptyList()

        return try {
            val array = JSONArray(jsonStr)
            val results = (0 until array.length()).mapNotNull { i ->
                parseEntry(array.getJSONObject(i))
            }
            Log.d(TAG, "parseResponse: ${results.size} result(s)")
            results.forEachIndexed { i, r ->
                Log.d(TAG, "  [#$i] text=\"${r.originalText}\" localDt=${r.localDateTime} " +
                    "tz=${r.sourceTimezone?.id} instant=${r.instant} confidence=${r.confidence}")
            }
            results
        } catch (_: Exception) {
            emptyList()
        }
    }

    fun parseEntry(obj: JSONObject): ExtractedTime? {
        return try {
            val time = obj.optString("time", "")
            val date = obj.optString("date", "")
            val tzStr = obj.optString("timezone", "")
            val original = obj.optString("original", "")

            if (time.isEmpty() || original.isEmpty()) return null

            val tz = try { TimeZone.of(tzStr) } catch (_: Exception) { null }

            if (date.isNotEmpty()) {
                val dt = LocalDateTime.parse("${date}T${time}")
                if (tz != null) {
                    val correctedInstant = TimezoneAbbreviations.computeInstant(dt, tz, original)
                    val naiveInstant = dt.toInstant(tz)
                    val correctedTz = if (correctedInstant != naiveInstant) {
                        val utcEpoch = dt.toInstant(TimeZone.UTC).epochSeconds
                        val offsetMinutes = ((utcEpoch - correctedInstant.epochSeconds) / 60).toInt()
                        val newTz = ChronoResultParser.offsetToTimezone(offsetMinutes, correctedInstant)
                        Log.d(TAG, "  abbr correction: \"$original\" tz ${tz.id}→${newTz.id} instant $naiveInstant→$correctedInstant")
                        newTz
                    } else tz
                    ExtractedTime(
                        instant = correctedInstant,
                        localDateTime = dt,
                        sourceTimezone = correctedTz,
                        originalText = original,
                        confidence = 0.9f,
                    )
                } else {
                    ExtractedTime(
                        localDateTime = dt,
                        originalText = original,
                        confidence = 0.7f,
                    )
                }
            } else {
                null
            }
        } catch (_: Exception) {
            null
        }
    }
}
