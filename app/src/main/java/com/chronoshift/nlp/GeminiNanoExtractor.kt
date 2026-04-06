package com.chronoshift.nlp

import android.content.Context
import android.util.Log
import com.chronoshift.conversion.ExtractedTime
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toInstant
import org.json.JSONArray
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GeminiNanoExtractor @Inject constructor(
    @param:ApplicationContext private val context: Context,
) : TimeExtractor {

    override suspend fun isAvailable(): Boolean {
        return try {
            val clazz = Class.forName("com.google.ai.edge.aicore.GenerativeModel")
            true
        } catch (_: ClassNotFoundException) {
            false
        }
    }

    override suspend fun extract(text: String): List<ExtractedTime> {
        if (!isAvailable()) return emptyList()

        return try {
            val response = runGeminiNano(text)
            parseResponse(response)
        } catch (e: Exception) {
            Log.w(TAG, "Gemini Nano extraction failed", e)
            emptyList()
        }
    }

    private suspend fun runGeminiNano(text: String): String {
        // ML Kit GenAI prompt API - calls Gemini Nano on-device
        // This uses reflection to avoid hard compile-time dependency on AICore
        // which is only available on supported devices
        val modelClass = Class.forName("com.google.ai.edge.aicore.GenerativeModel")
        val configClass = Class.forName("com.google.ai.edge.aicore.GenerationConfig")

        val configBuilder = configClass.getDeclaredMethod("builder").invoke(null)
        val config = configBuilder.javaClass.getDeclaredMethod("build").invoke(configBuilder)

        val model = modelClass.getConstructor(configClass).newInstance(config)
        val generateMethod = modelClass.getDeclaredMethod("generateContent", String::class.java)

        val prompt = buildPrompt(text)
        val result = generateMethod.invoke(model, prompt)
        val getText = result.javaClass.getDeclaredMethod("getText")
        return getText.invoke(result) as? String ?: ""
    }

    private fun buildPrompt(text: String): String = """
Extract all timestamps, times, and dates from this text. For each one found, return a JSON array of objects with these fields:
- "time": the time in 24-hour format "HH:mm"
- "date": the date in "YYYY-MM-DD" format (use today's date if not specified)
- "timezone": IANA timezone ID or UTC offset (e.g. "America/New_York" or "+05:30")
- "original": the exact text that was matched

Return ONLY the JSON array, no other text. If no timestamps found, return [].

Text: $text
""".trimIndent()

    private fun parseResponse(response: String): List<ExtractedTime> {
        val jsonStr = response.trim()
            .removePrefix("```json").removePrefix("```")
            .removeSuffix("```").trim()

        if (jsonStr.isEmpty() || jsonStr == "[]") return emptyList()

        return try {
            val array = JSONArray(jsonStr)
            (0 until array.length()).mapNotNull { i ->
                parseEntry(array.getJSONObject(i))
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to parse Gemini response: $jsonStr", e)
            emptyList()
        }
    }

    private fun parseEntry(obj: JSONObject): ExtractedTime? {
        return try {
            val time = obj.optString("time", "")
            val date = obj.optString("date", "")
            val tzStr = obj.optString("timezone", "")
            val original = obj.optString("original", "")

            if (time.isEmpty() || original.isEmpty()) return null

            val tz = try { TimeZone.of(tzStr) } catch (_: Exception) { null }

            if (date.isNotEmpty() && time.isNotEmpty()) {
                val dt = LocalDateTime.parse("${date}T${time}")
                if (tz != null) {
                    ExtractedTime(
                        instant = dt.toInstant(tz),
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

    companion object {
        private const val TAG = "GeminiNanoExtractor"
    }
}
