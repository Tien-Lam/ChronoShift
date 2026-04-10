package com.chronoshift.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.chronoshift.conversion.TimeConverter
import com.chronoshift.nlp.StreamingTimeExtractor
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
    private val timeExtractor: StreamingTimeExtractor,
    private val timeConverter: TimeConverter,
) : ViewModel() {

    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    private var extractionJob: Job? = null

    fun onInputChanged(text: String) {
        _uiState.update { it.copy(inputText = text) }
    }

    fun clear() {
        extractionJob?.cancel()
        _uiState.update { MainUiState() }
    }

    fun convert() {
        val text = _uiState.value.inputText.trim()
        if (text.isEmpty()) return
        processText(text)
    }

    fun processIncomingText(text: String) {
        _uiState.update { it.copy(inputText = text) }
        processText(text)
    }

    private fun processText(text: String) {
        extractionJob?.cancel()
        extractionJob = viewModelScope.launch {
            _uiState.update { it.copy(isProcessing = true, error = null, results = emptyList()) }
            try {
                var gotResults = false
                timeExtractor.extractStream(text).collect { result ->
                    if (result.times.isNotEmpty()) {
                        gotResults = true
                        val converted = timeConverter.toLocal(result.times)
                        _uiState.update { it.copy(results = converted) }
                    }
                }
                _uiState.update { it.copy(isProcessing = false, error = if (!gotResults) "no_timestamp" else null) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isProcessing = false, error = e.message) }
            }
        }
    }
}
