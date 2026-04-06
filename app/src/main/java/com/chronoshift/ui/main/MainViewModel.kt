package com.chronoshift.ui.main

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.chronoshift.conversion.TimeConverter
import com.chronoshift.nlp.TimeExtractor
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MainViewModel @Inject constructor(
    private val timeExtractor: TimeExtractor,
    private val timeConverter: TimeConverter,
) : ViewModel() {

    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    fun onInputChanged(text: String) {
        _uiState.update { it.copy(inputText = text) }
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
        viewModelScope.launch {
            _uiState.update { it.copy(isProcessing = true, error = null, results = emptyList()) }
            try {
                val extracted = timeExtractor.extract(text)
                if (extracted.isEmpty()) {
                    _uiState.update { it.copy(isProcessing = false, error = "no_timestamp") }
                    return@launch
                }
                val converted = timeConverter.toLocal(extracted)
                _uiState.update { it.copy(isProcessing = false, results = converted) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isProcessing = false, error = e.message) }
            }
        }
    }
}
