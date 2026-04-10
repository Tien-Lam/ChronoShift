package com.chronoshift.nlp

import android.content.Context
import android.util.Log
import app.cash.zipline.QuickJs
import com.chronoshift.conversion.ExtractedTime
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChronoExtractor @Inject constructor(
    @param:ApplicationContext private val context: Context,
    private val cityResolver: CityResolverInterface,
) : SpanAwareTimeExtractor {

    private var engine: QuickJs? = null

    override suspend fun isAvailable(): Boolean {
        initEngine()
        return engine != null
    }

    override suspend fun extract(text: String): ExtractionResult {
        return chronoParse(text, "Chrono")
    }

    override suspend fun extractWithSpans(text: String, spans: List<DateTimeSpan>): ExtractionResult {
        if (spans.isEmpty()) return extract(text)

        val qjs = engine ?: initEngine() ?: return ExtractionResult(emptyList(), "ML Kit + Chrono")
        val allResults = mutableListOf<ExtractedTime>()

        for (span in spans) {
            try {
                val json = evaluateChrono(qjs, span.text) ?: continue
                allResults.addAll(ChronoResultParser.parse(json, span.text, cityResolver))
            } catch (e: Exception) {
                Log.w(TAG, "Chrono span parse failed for '${span.text}'", e)
            }
        }

        Log.d(TAG, "Span results: ${allResults.size} — ${allResults.map { "${it.originalText} tz=${it.sourceTimezone?.id}" }}")

        // Full-text parse catches context (like timezone) that isolated spans miss
        val fullResult = chronoParse(text, "Chrono")
        Log.d(TAG, "Full-text results: ${fullResult.times.size} — ${fullResult.times.map { "${it.originalText} tz=${it.sourceTimezone?.id}" }}")

        val merged = ChronoResultParser.mergeSpanAndFullResults(allResults, fullResult.times)
        Log.d(TAG, "After merge: ${merged.size} — ${merged.map { "${it.originalText} tz=${it.sourceTimezone?.id}" }}")

        return ExtractionResult(merged, "ML Kit + Chrono")
    }

    private fun chronoParse(text: String, method: String): ExtractionResult {
        val qjs = engine ?: initEngine() ?: return ExtractionResult(emptyList(), method)

        return try {
            val json = evaluateChrono(qjs, text)
                ?: return ExtractionResult(emptyList(), method)
            ExtractionResult(ChronoResultParser.parse(json, text, cityResolver), method)
        } catch (e: Exception) {
            Log.w(TAG, "Chrono extraction failed", e)
            ExtractionResult(emptyList(), method)
        }
    }

    private fun evaluateChrono(qjs: QuickJs, text: String): String? {
        val escaped = text.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n")
        return qjs.evaluate("chronoParse('$escaped')") as? String
    }

    @Synchronized
    private fun initEngine(): QuickJs? {
        if (engine != null) return engine
        return try {
            val qjs = QuickJs.create()
            val script = context.assets.open("chrono.js").bufferedReader().readText()
            qjs.evaluate(script)
            engine = qjs
            Log.d(TAG, "Chrono.js engine initialized")
            qjs
        } catch (e: Exception) {
            Log.w(TAG, "Failed to initialize Chrono.js", e)
            null
        }
    }

    companion object {
        private const val TAG = "ChronoExtractor"
    }
}
