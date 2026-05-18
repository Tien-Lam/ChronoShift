package com.chronoshift.nlp

import android.util.Log
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LiteRtExtractor @Inject constructor(
    private val modelRepository: ModelRepository,
    private val engineFactory: LiteRtEngineFactory,
) : TimeExtractor {

    private var engine: LiteRtEngineSession? = null
    private var activeModelPath: String? = null
    private var failedModelPath: String? = null

    override suspend fun isAvailable(): Boolean {
        val modelFile = modelRepository.getSelectedModelFile() ?: return false
        if (engine != null && engine!!.isInitialized() && activeModelPath == modelFile.absolutePath) {
            return true
        }
        if (failedModelPath == modelFile.absolutePath) return false
        return initEngine(modelFile)
    }

    override suspend fun extract(text: String): ExtractionResult {
        val eng = engine ?: return ExtractionResult(emptyList(), "LiteRT")

        return try {
            val responseText = eng.generate(buildPrompt(text))
            Log.d(TAG, "Response: $responseText")
            ExtractionResult(LlmResultParser.parseResponse(responseText), "LiteRT")
        } catch (e: Exception) {
            Log.w(TAG, "LiteRT inference failed", e)
            ExtractionResult(emptyList(), "LiteRT")
        }
    }

    private fun initEngine(modelFile: File): Boolean {
        return try {
            val eng = engineFactory.create(modelFile)
            eng.initialize()
            engine = eng
            activeModelPath = modelFile.absolutePath
            failedModelPath = null
            Log.d(TAG, "LiteRT engine initialized: ${modelFile.name}")
            true
        } catch (e: Exception) {
            Log.w(TAG, "LiteRT init failed", e)
            activeModelPath = null
            failedModelPath = modelFile.absolutePath
            false
        }
    }

    private fun buildPrompt(text: String): String {
        val today = java.time.LocalDate.now().toString()
        return """
Extract all timestamps, times, and dates from this text. For each one found, return a JSON array of objects with these fields:
- "time": the time in 24-hour format "HH:mm"
- "date": the date in "YYYY-MM-DD" format. Today is $today. Use the current year if no year is specified.
- "timezone": IANA timezone ID or UTC offset (e.g. "America/New_York" or "+05:30")
- "original": the exact text that was matched

Return ONLY the JSON array, no other text. If no timestamps found, return [].

<user_text>
$text
</user_text>
""".trimIndent()
    }

    companion object {
        private const val TAG = "LiteRtExtractor"
    }
}
