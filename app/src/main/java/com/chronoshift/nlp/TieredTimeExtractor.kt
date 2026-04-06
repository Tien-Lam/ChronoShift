package com.chronoshift.nlp

import android.util.Log
import com.chronoshift.conversion.ExtractedTime
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TieredTimeExtractor @Inject constructor(
    private val geminiExtractor: GeminiNanoExtractor,
    private val mlKitExtractor: MlKitEntityExtractor,
    private val regexExtractor: RegexExtractor,
) : TimeExtractor, StreamingTimeExtractor {

    override suspend fun isAvailable(): Boolean = true

    override suspend fun extract(text: String): ExtractionResult {
        var latest = ExtractionResult(emptyList(), "none")
        extractStream(text).collect { latest = it }
        return latest
    }

    override fun extractStream(text: String): Flow<ExtractionResult> = flow {
        val merged = mutableListOf<ExtractedTime>()
        val ran = mutableListOf<String>()
        val unavailable = mutableListOf<String>()

        // Fast extractors first — emit immediately
        for ((extractor, name) in listOf(regexExtractor to "Regex", mlKitExtractor to "ML Kit")) {
            val result = tryExtract(extractor, text)
            if (result == null) {
                unavailable.add(name)
                Log.d(TAG, "$name: unavailable or no results")
                continue
            }
            ran.add(name)
            for (time in result.times) {
                if (!isCovered(time, merged)) merged.add(time.copy(method = name))
            }
        }

        if (merged.isNotEmpty()) {
            Log.d(TAG, "Emitting fast results: ${merged.size} via ${ran.joinToString(" + ")}")
            emit(ExtractionResult(merged.toList(), buildMethodLabel(ran, unavailable)))
        }

        // Slow extractor — Gemini Nano replaces overlapping lower-quality results
        val geminiResult = tryExtract(geminiExtractor, text)
        if (geminiResult == null) {
            unavailable.add("Gemini Nano")
            Log.d(TAG, "Gemini Nano: unavailable or no results")
        } else {
            ran.add(0, "Gemini Nano")
            for (geminiTime in geminiResult.times) {
                // Replace any existing result that covers the same span
                val overlapping = merged.filter { ex ->
                    ex.originalText in geminiTime.originalText || geminiTime.originalText in ex.originalText
                }
                if (overlapping.isNotEmpty()) {
                    Log.d(TAG, "Gemini replacing ${overlapping.size} overlapping result(s): ${overlapping.map { it.method }}")
                    merged.removeAll(overlapping.toSet())
                }
                merged.add(geminiTime.copy(method = "Gemini Nano"))
            }
            Log.d(TAG, "After Gemini merge: ${merged.size} results, methods: ${merged.map { it.method }}")
        }

        Log.d(TAG, "Final emit: ${merged.size} via ${buildMethodLabel(ran, unavailable)}")
        emit(ExtractionResult(merged.toList(), buildMethodLabel(ran, unavailable)))
    }

    private fun buildMethodLabel(ran: List<String>, unavailable: List<String>): String {
        return buildString {
            append(ran.joinToString(" + ").ifEmpty { "none" })
            if (unavailable.isNotEmpty()) {
                append(" (${unavailable.joinToString(", ")} unavailable)")
            }
        }
    }

    private fun isCovered(candidate: ExtractedTime, existing: List<ExtractedTime>): Boolean {
        return existing.any { ex ->
            candidate.originalText in ex.originalText || ex.originalText in candidate.originalText
        }
    }

    private suspend fun tryExtract(extractor: TimeExtractor, text: String): ExtractionResult? {
        if (!extractor.isAvailable()) return null
        return try {
            val result = extractor.extract(text)
            if (result.times.isNotEmpty()) {
                Log.d(TAG, "${result.method}: ${result.times.size} result(s)")
                result
            } else {
                Log.d(TAG, "${result.method}: 0 results")
                null
            }
        } catch (e: Exception) {
            Log.w(TAG, "${extractor::class.simpleName} failed", e)
            null
        }
    }

    companion object {
        private const val TAG = "TieredTimeExtractor"
    }
}
