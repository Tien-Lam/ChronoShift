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

        // Fast extractors first — emit immediately
        for ((extractor, name) in listOf(chronoExtractor to "Chrono", regexExtractor to "Regex", mlKitExtractor to "ML Kit")) {
            val result = tryExtract(extractor, text)
            if (result == null) {
                unavailable.add(name)
                continue
            }
            ran.add(name)
            addNewResults(merged, result.times, name)
        }

        if (merged.isNotEmpty()) {
            Log.d(TAG, "Fast results: ${merged.size} via ${ran.joinToString(" + ")}")
            emit(ExtractionResult(merged.toList(), buildMethodLabel(ran, unavailable)))
        }

        // Slow extractor — Gemini Nano adds new results, upgrades method on same times
        val geminiResult = tryExtract(geminiExtractor, text)
        if (geminiResult == null) {
            unavailable.add("Gemini Nano")
        } else {
            ran.add(0, "Gemini Nano")
            addNewResults(merged, geminiResult.times, "Gemini Nano")
        }

        Log.d(TAG, "Final: ${merged.size} via ${buildMethodLabel(ran, unavailable)}")
        emit(ExtractionResult(merged.toList(), buildMethodLabel(ran, unavailable)))
    }

    private fun addNewResults(
        merged: MutableList<ExtractedTime>,
        incoming: List<ExtractedTime>,
        method: String,
    ) {
        for (time in incoming) {
            val match = merged.indexOfFirst { isSameTime(it, time) }
            if (match >= 0) {
                val existing = merged[match]
                val combinedMethod = if (method in existing.method) existing.method
                    else "${existing.method} + $method"
                merged[match] = existing.copy(method = combinedMethod)
            } else {
                // Check if this is the same hour:minute but with missing/different timezone
                // (e.g. ML Kit returns UTC-resolved instant, Chrono has the real timezone)
                val fuzzyMatch = merged.indexOfFirst { isSameLocalTime(it, time) }
                if (fuzzyMatch >= 0) {
                    val existing = merged[fuzzyMatch]
                    val combinedMethod = if (method in existing.method) existing.method
                        else "${existing.method} + $method"
                    // Keep the one with timezone info
                    if (existing.sourceTimezone != null) {
                        merged[fuzzyMatch] = existing.copy(method = combinedMethod)
                    } else if (time.sourceTimezone != null) {
                        merged[fuzzyMatch] = time.copy(method = combinedMethod)
                    } else {
                        merged[fuzzyMatch] = existing.copy(method = combinedMethod)
                    }
                } else {
                    merged.add(time.copy(method = method))
                }
            }
        }
    }

    private fun isSameTime(a: ExtractedTime, b: ExtractedTime): Boolean {
        if (a.instant != null && b.instant != null) {
            return a.instant == b.instant
        }
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
        val aMin = a.localDateTime.minute
        val bHour = b.localDateTime?.hour ?: return false
        val bMin = b.localDateTime.minute
        return aHour == bHour && aMin == bMin
    }

    private fun buildMethodLabel(ran: List<String>, unavailable: List<String>): String {
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
