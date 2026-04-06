package com.chronoshift.nlp

import com.chronoshift.conversion.ExtractedTime
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toInstant
import org.json.JSONArray
import org.json.JSONObject

object GeminiResultParser {

    fun parseResponse(response: String): List<ExtractedTime> {
        val jsonStr = response.trim()
            .removePrefix("```json").removePrefix("```")
            .removeSuffix("```").trim()

        if (jsonStr.isEmpty() || jsonStr == "[]") return emptyList()

        return try {
            val array = JSONArray(jsonStr)
            (0 until array.length()).mapNotNull { i ->
                parseEntry(array.getJSONObject(i))
            }
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
                    ExtractedTime(
                        instant = dt.toInstant(tz),
                        localDateTime = dt,
                        sourceTimezone = tz,
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
