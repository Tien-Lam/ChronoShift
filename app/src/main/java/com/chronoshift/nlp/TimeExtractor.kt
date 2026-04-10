package com.chronoshift.nlp

import com.chronoshift.conversion.ExtractedTime
import kotlinx.coroutines.flow.Flow

data class ExtractionResult(
    val times: List<ExtractedTime>,
    val method: String,
)

interface TimeExtractor {
    suspend fun isAvailable(): Boolean
    suspend fun extract(text: String): ExtractionResult
}

interface SpanAwareTimeExtractor : TimeExtractor {
    suspend fun extractWithSpans(text: String, spans: List<DateTimeSpan>): ExtractionResult
}

interface SpanDetector {
    suspend fun isAvailable(): Boolean
    suspend fun detectSpans(text: String): List<DateTimeSpan>
}

interface StreamingTimeExtractor {
    fun extractStream(text: String): Flow<ExtractionResult>
}
