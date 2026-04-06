package com.chronoshift.nlp

import android.util.Log
import com.google.mlkit.genai.common.DownloadStatus
import com.google.mlkit.genai.prompt.Generation
import com.google.mlkit.genai.prompt.GenerativeModel
import kotlinx.coroutines.flow.last
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
            ExtractionResult(GeminiResultParser.parseResponse(responseText), "Gemini Nano")
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

    companion object {
        private const val TAG = "GeminiNanoExtractor"
    }
}
