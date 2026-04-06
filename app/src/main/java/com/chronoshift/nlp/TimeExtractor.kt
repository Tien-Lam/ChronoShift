package com.chronoshift.nlp

import com.chronoshift.conversion.ExtractedTime

interface TimeExtractor {
    suspend fun isAvailable(): Boolean
    suspend fun extract(text: String): List<ExtractedTime>
}
