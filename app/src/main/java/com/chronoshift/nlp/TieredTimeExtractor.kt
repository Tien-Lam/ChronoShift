package com.chronoshift.nlp

import android.util.Log
import com.chronoshift.conversion.ExtractedTime
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TieredTimeExtractor @Inject constructor(
    private val geminiExtractor: GeminiNanoExtractor,
    private val mlKitExtractor: MlKitEntityExtractor,
    private val regexExtractor: RegexExtractor,
) : TimeExtractor {

    override suspend fun isAvailable(): Boolean = true

    override suspend fun extract(text: String): List<ExtractedTime> {
        // Tier 1: Gemini Nano — full NLP, best quality
        tryExtract(geminiExtractor, text)?.let { return it }

        // Tier 2+3: Regex (preserves timezone) + ML Kit (broad coverage), merged
        val regexResults = tryExtract(regexExtractor, text)
        val mlKitResults = tryExtract(mlKitExtractor, text)

        if (regexResults != null && mlKitResults != null) {
            // Regex results have timezone info, so they take priority.
            // Add ML Kit results only for text spans regex didn't cover.
            val merged = regexResults.toMutableList()
            for (ml in mlKitResults) {
                val alreadyCovered = regexResults.any { rx ->
                    rx.originalText in ml.originalText || ml.originalText in rx.originalText
                }
                if (!alreadyCovered) merged.add(ml)
            }
            Log.d(TAG, "Merged ${regexResults.size} regex + ${merged.size - regexResults.size} ML Kit result(s)")
            return merged
        }

        return regexResults ?: mlKitResults ?: emptyList()
    }

    private suspend fun tryExtract(extractor: TimeExtractor, text: String): List<ExtractedTime>? {
        if (!extractor.isAvailable()) return null
        return try {
            val results = extractor.extract(text)
            if (results.isNotEmpty()) {
                Log.d(TAG, "${extractor::class.simpleName}: ${results.size} result(s)")
                results
            } else null
        } catch (e: Exception) {
            Log.w(TAG, "${extractor::class.simpleName} failed", e)
            null
        }
    }

    companion object {
        private const val TAG = "TieredTimeExtractor"
    }
}
