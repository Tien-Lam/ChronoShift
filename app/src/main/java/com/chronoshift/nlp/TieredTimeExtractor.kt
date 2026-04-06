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
        val merged = mutableListOf<ExtractedTime>()
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
            addNewResults(merged, chronoResult.times, chronoResult.method)
        }

        // Regex: structured formats (ISO 8601, unix, tz abbreviations)
        val regexResult = tryExtract(regexExtractor, text)
        if (regexResult != null) {
            ran.add("Regex")
            addNewResults(merged, regexResult.times, "Regex")
        }

        if (merged.isNotEmpty()) {
            Log.d(TAG, "Fast: ${merged.size} result(s) via ${ran.joinToString(" + ")}")
            emit(ExtractionResult(merged.toList(), buildLabel(ran, unavailable)))
        }

        // Stage 2: Gemini Nano (background, highest quality)
        val geminiResult = tryExtract(geminiExtractor, text)
        if (geminiResult != null) {
            ran.add("Gemini Nano")
            addNewResults(merged, geminiResult.times, "Gemini Nano")
        } else {
            unavailable.add("Gemini Nano")
        }

        Log.d(TAG, "Final: ${merged.size} result(s) via ${buildLabel(ran, unavailable)}")
        emit(ExtractionResult(merged.toList(), buildLabel(ran, unavailable)))
    }

    private fun addNewResults(
        merged: MutableList<ExtractedTime>,
        incoming: List<ExtractedTime>,
        method: String,
    ) {
        for (time in incoming) {
            val exact = merged.indexOfFirst { isSameTime(it, time) }
            if (exact >= 0) {
                val existing = merged[exact]
                merged[exact] = existing.copy(method = combineMethod(existing.method, method))
                continue
            }
            val fuzzy = merged.indexOfFirst { isSameLocalTime(it, time) }
            if (fuzzy >= 0) {
                val existing = merged[fuzzy]
                if (existing.sourceTimezone != null) {
                    merged[fuzzy] = existing.copy(method = combineMethod(existing.method, method))
                } else if (time.sourceTimezone != null) {
                    merged[fuzzy] = time.copy(method = combineMethod(existing.method, method))
                } else {
                    merged[fuzzy] = existing.copy(method = combineMethod(existing.method, method))
                }
                continue
            }
            merged.add(time.copy(method = method))
        }
    }

    private fun combineMethod(existing: String, new: String): String {
        return if (new in existing) existing else "$existing + $new"
    }

    private fun isSameTime(a: ExtractedTime, b: ExtractedTime): Boolean {
        if (a.instant != null && b.instant != null) return a.instant == b.instant
        if (a.localDateTime != null && b.localDateTime != null) {
            return a.localDateTime.hour == b.localDateTime.hour &&
                a.localDateTime.minute == b.localDateTime.minute &&
                a.localDateTime.date == b.localDateTime.date &&
                a.sourceTimezone == b.sourceTimezone
        }
        return false
    }

    private fun isSameLocalTime(a: ExtractedTime, b: ExtractedTime): Boolean {
        val aHour = a.localDateTime?.hour ?: return false
        val bHour = b.localDateTime?.hour ?: return false
        return aHour == bHour && a.localDateTime.minute == b.localDateTime.minute
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
