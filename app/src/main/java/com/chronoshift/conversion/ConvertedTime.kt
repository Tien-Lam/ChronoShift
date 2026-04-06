package com.chronoshift.conversion

data class ConvertedTime(
    val originalText: String,
    val sourceTimezone: String,
    val sourceDateTime: String,
    val localDateTime: String,
    val localTimezone: String,
    val localDate: String,
)
