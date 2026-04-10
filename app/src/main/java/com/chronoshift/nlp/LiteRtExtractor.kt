package com.chronoshift.nlp

import android.content.Context
import android.util.Log
import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import dagger.hilt.android.qualifiers.ApplicationContext
import java.io.File
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class LiteRtExtractor @Inject constructor(
    @param:ApplicationContext private val context: Context,
) : TimeExtractor {

    private var engine: Engine? = null
    private var permanentlyUnavailable = false

    override suspend fun isAvailable(): Boolean {
        if (engine != null && engine!!.isInitialized()) return true
        if (permanentlyUnavailable) return false
        return initEngine()
    }

    override suspend fun extract(text: String): ExtractionResult {
        val eng = engine ?: return ExtractionResult(emptyList(), "LiteRT")

        return try {
            eng.createConversation().use { conversation ->
                val prompt = buildPrompt(text)
                val response = conversation.sendMessage(prompt)
                val responseText = response.contents.toString()
                Log.d(TAG, "Response: $responseText")
                ExtractionResult(LlmResultParser.parseResponse(responseText), "LiteRT")
            }
        } catch (e: Exception) {
            Log.w(TAG, "LiteRT inference failed", e)
            ExtractionResult(emptyList(), "LiteRT")
        }
    }

    private fun initEngine(): Boolean {
        val modelFile = findModel()
        if (modelFile == null) {
            Log.d(TAG, "No LiteRT model found on device")
            permanentlyUnavailable = true
            return false
        }

        return try {
            val config = EngineConfig(
                modelPath = modelFile.absolutePath,
                backend = Backend.CPU(),
            )
            val eng = Engine(config)
            eng.initialize()
            engine = eng
            Log.d(TAG, "LiteRT engine initialized: ${modelFile.name}")
            true
        } catch (e: Exception) {
            Log.w(TAG, "LiteRT init failed", e)
            permanentlyUnavailable = true
            false
        }
    }

    private fun findModel(): File? {
        // Check app-specific storage for downloaded models
        val modelsDir = File(context.filesDir, "models")
        if (!modelsDir.exists()) return null

        return modelsDir.listFiles()
            ?.filter { it.extension == "litertlm" || it.name.contains("gemma") }
            ?.maxByOrNull { it.lastModified() }
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

Text: $text
""".trimIndent()
    }

    companion object {
        private const val TAG = "LiteRtExtractor"
    }
}
