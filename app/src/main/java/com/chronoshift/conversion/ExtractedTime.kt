package com.chronoshift.conversion

import kotlinx.datetime.Instant
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone

data class ExtractedTime(
    val instant: Instant? = null,
    val localDateTime: LocalDateTime? = null,
    val sourceTimezone: TimeZone? = null,
    val originalText: String,
    val confidence: Float = 1.0f,
)
