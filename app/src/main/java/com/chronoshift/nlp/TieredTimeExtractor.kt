package com.chronoshift.nlp

import android.util.Log
import com.chronoshift.conversion.ExtractedTime
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TieredTimeExtractor @Inject constructor(
    private val chronoExtractor: ChronoExtractor,
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
        var merged = listOf<ExtractedTime>()
        val ran = mutableListOf<String>()
        val unavailable = mutableListOf<String>()

        // Stage 1: Fast extractors

        // ML Kit detects spans (where datetimes are in the text)
        val spans = try {
            if (mlKitExtractor.isAvailable()) mlKitExtractor.detectSpans(text) else emptyList()
        } catch (e: Exception) {
            Log.w(TAG, "ML Kit span detection failed", e)
            emptyList()
        }
        if (spans.isNotEmpty()) Log.d(TAG, "ML Kit: ${spans.size} span(s) detected")

        // Chrono: parse with ML Kit span hints (or full text if no spans)
        val chronoResult = try {
            if (chronoExtractor.isAvailable()) {
                if (spans.isNotEmpty()) {
                    chronoExtractor.extractWithSpans(text, spans)
                } else {
                    chronoExtractor.extract(text)
                }
            } else null
        } catch (e: Exception) {
            Log.w(TAG, "Chrono failed", e)
            null
        }

        if (chronoResult != null && chronoResult.times.isNotEmpty()) {
            ran.add(chronoResult.method)
            merged = ResultMerger.mergeResults(merged, chronoResult.times, chronoResult.method)
        }

        // Regex: structured formats (ISO 8601, unix, tz abbreviations)
        val regexResult = tryExtract(regexExtractor, text)
        if (regexResult != null) {
            ran.add("Regex")
            merged = ResultMerger.mergeResults(merged, regexResult.times, "Regex")
        }

        if (merged.isNotEmpty()) {
            Log.d(TAG, "Fast: ${merged.size} result(s) via ${ran.joinToString(" + ")}")
            emit(ExtractionResult(merged, buildLabel(ran, unavailable)))
        }

        // Stage 2: Gemini Nano (background, highest quality)
        val geminiResult = tryExtract(geminiExtractor, text)
        if (geminiResult != null) {
            ran.add("Gemini Nano")
            merged = ResultMerger.mergeResults(merged, geminiResult.times, "Gemini Nano")
        } else {
            unavailable.add("Gemini Nano")
        }

        // Align ambiguous timezones across all results (e.g. CST could be US Central or China Standard)
        merged = ChronoResultParser.alignAmbiguousTimezones(merged)

        Log.d(TAG, "Final: ${merged.size} result(s) via ${buildLabel(ran, unavailable)}")
        emit(ExtractionResult(merged, buildLabel(ran, unavailable)))
    }

    private fun buildLabel(ran: List<String>, unavailable: List<String>): String {
        return buildString {
            append(ran.joinToString(" + ").ifEmpty { "none" })
            if (unavailable.isNotEmpty()) {
                append(" (${unavailable.joinToString(", ")} unavailable)")
            }
        }
    }

    private suspend fun tryExtract(extractor: TimeExtractor, text: String): ExtractionResult? {
        if (!extractor.isAvailable()) return null
        return try {
            val result = extractor.extract(text)
            if (result.times.isNotEmpty()) {
                Log.d(TAG, "${result.method}: ${result.times.size} result(s)")
                result
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
