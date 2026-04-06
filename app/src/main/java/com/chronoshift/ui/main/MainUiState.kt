package com.chronoshift.ui.main

import com.chronoshift.conversion.ConvertedTime

data class MainUiState(
    val inputText: String = "",
    val results: List<ConvertedTime> = emptyList(),
    val isProcessing: Boolean = false,
    val error: String? = null,
)
