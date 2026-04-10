package com.chronoshift.nlp

import android.util.Log
import com.chronoshift.conversion.ExtractedTime
import kotlinx.coroutines.async
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.selects.select
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TieredTimeExtractor @Inject constructor(
    private val chronoExtractor: SpanAwareTimeExtractor,
    @com.chronoshift.di.LiteRt private val liteRtExtractor: TimeExtractor,
    @com.chronoshift.di.Gemini private val geminiExtractor: TimeExtractor,
    private val mlKitExtractor: SpanDetector,
    @com.chronoshift.di.Regex private val regexExtractor: TimeExtractor,
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

        // Stage 1: Fast extractors (ML Kit + Chrono + Regex)
        // Run ML Kit span detection concurrently with Chrono init to cut cold-start latency
        val (chronoResult, regexResult) = coroutineScope {
            val spansDeferred = async {
                try {
                    if (mlKitExtractor.isAvailable()) mlKitExtractor.detectSpans(text) else emptyList()
                } catch (e: Exception) {
                    Log.w(TAG, "ML Kit span detection failed", e)
                    emptyList()
                }
            }

            val regexDeferred = async { tryExtract(regexExtractor, text) }

            val chronoDeferred = async {
                try {
                    if (!chronoExtractor.isAvailable()) return@async null
                    val spans = spansDeferred.await()
                    if (spans.isNotEmpty()) {
                        Log.d(TAG, "ML Kit: ${spans.size} span(s): ${spans.map { "'${it.text}'" }}")
                        chronoExtractor.extractWithSpans(text, spans)
                    } else {
                        chronoExtractor.extract(text)
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "Chrono failed", e)
                    null
                }
            }

            Pair(chronoDeferred.await(), regexDeferred.await())
        }

        if (chronoResult != null && chronoResult.times.isNotEmpty()) {
            ran.add(chronoResult.method)
            merged = ResultMerger.mergeResults(merged, chronoResult.times, chronoResult.method)
        }

        if (regexResult != null) {
            ran.add("Regex")
            merged = ResultMerger.mergeResults(merged, regexResult.times, "Regex")
        }

        if (merged.isNotEmpty()) {
            Log.d(TAG, "Fast: ${merged.size} result(s) via ${ran.joinToString(" + ")}")
            emit(ExtractionResult(merged, buildLabel(ran, unavailable)))
        }

        // Stage 2+3: LiteRT and Gemini Nano run concurrently.
        // Emit as each completes so the faster one (LiteRT ~1-2s) shows before the slower one (Gemini ~7s).
        coroutineScope {
            val liteRtDeferred = async { tryExtract(liteRtExtractor, text) }
            val geminiDeferred = async { tryExtract(geminiExtractor, text) }

            // Wait for whichever finishes first
            val first = select {
                liteRtDeferred.onAwait { "litert" to it }
                geminiDeferred.onAwait { "gemini" to it }
            }

            if (first.first == "litert") {
                val liteRtResult = first.second
                if (liteRtResult != null) {
                    ran.add("LiteRT")
                    merged = ResultMerger.mergeResults(merged, liteRtResult.times, "LiteRT")
                    emit(ExtractionResult(merged, buildLabel(ran, unavailable)))
                } else {
                    unavailable.add("LiteRT")
                }
                // Now wait for Gemini
                val geminiResult = geminiDeferred.await()
                if (geminiResult != null) {
                    ran.add("Gemini Nano")
                    merged = ResultMerger.mergeResults(merged, geminiResult.times, "Gemini Nano")
                } else {
                    unavailable.add("Gemini Nano")
                }
            } else {
                val geminiResult = first.second
                if (geminiResult != null) {
                    ran.add("Gemini Nano")
                    merged = ResultMerger.mergeResults(merged, geminiResult.times, "Gemini Nano")
                    emit(ExtractionResult(merged, buildLabel(ran, unavailable)))
                } else {
                    unavailable.add("Gemini Nano")
                }
                // Now wait for LiteRT
                val liteRtResult = liteRtDeferred.await()
                if (liteRtResult != null) {
                    ran.add("LiteRT")
                    merged = ResultMerger.mergeResults(merged, liteRtResult.times, "LiteRT")
                } else {
                    unavailable.add("LiteRT")
                }
            }
        }

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
