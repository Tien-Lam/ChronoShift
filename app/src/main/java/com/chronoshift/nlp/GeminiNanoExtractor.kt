package com.chronoshift.nlp

import android.util.Log
import com.chronoshift.conversion.ExtractedTime
import com.google.mlkit.genai.common.DownloadStatus
import com.google.mlkit.genai.prompt.Generation
import com.google.mlkit.genai.prompt.GenerativeModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.last
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toInstant
import org.json.JSONArray
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class GeminiNanoExtractor @Inject constructor() : TimeExtractor {

    private var model: GenerativeModel? = null
    private var permanentlyUnavailable = false

    override suspend fun isAvailable(): Boolean {
        if (model != null) return true
        if (permanentlyUnavailable) return false

        // FeatureStatus: 0=UNAVAILABLE, 1=DOWNLOADABLE, 2=DOWNLOADING, 3=AVAILABLE
        return try {
            val client = Generation.getClient()
            val status = client.checkStatus()
            Log.d(TAG, "checkStatus=$status")
            when (status) {
                3 -> { // AVAILABLE
                    model = client
                    Log.d(TAG, "Gemini Nano ready")
                    true
                }
                1 -> { // DOWNLOADABLE
                    Log.d(TAG, "Triggering model download")
                    val result = client.download().last()
                    when (result) {
                        is DownloadStatus.DownloadCompleted -> {
                            model = client
                            Log.d(TAG, "Download completed")
                            true
                        }
                        else -> {
                            Log.w(TAG, "Download did not complete: $result")
                            false
                        }
                    }
                }
                2 -> { // DOWNLOADING
                    Log.d(TAG, "Model currently downloading, waiting...")
                    val result = client.download().last()
                    if (result is DownloadStatus.DownloadCompleted) {
                        model = client
                        true
                    } else false
                }
                else -> { // 0 = UNAVAILABLE
                    Log.d(TAG, "Gemini Nano not available on this device")
                    permanentlyUnavailable = true
                    false
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Gemini Nano check failed", e)
            false
        }
    }

    override suspend fun extract(text: String): ExtractionResult {
        val client = model ?: return ExtractionResult(emptyList(), "Gemini Nano")

        return try {
            val response = client.generateContent(buildPrompt(text))
            val responseText = response.candidates.firstOrNull()?.text ?: ""
            Log.d(TAG, "Response: $responseText")
            ExtractionResult(parseResponse(responseText), "Gemini Nano")
        } catch (e: Exception) {
            Log.w(TAG, "Gemini Nano generation failed", e)
            ExtractionResult(emptyList(), "Gemini Nano")
        }
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

            if (date.isNotEmpty()) {
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
