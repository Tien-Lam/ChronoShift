package com.chronoshift.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.chronoshift.nlp.DownloadState
import com.chronoshift.nlp.GeminiNanoExtractor
import com.chronoshift.nlp.MlKitEntityExtractor
import com.chronoshift.nlp.ModelDownloader
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.launchIn
import kotlinx.coroutines.flow.onEach
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SettingsUiState(
    val modelInstalled: Boolean = false,
    val modelSizeMb: String = "",
    val downloadState: DownloadState = DownloadState.Idle,
    val geminiNanoAvailable: Boolean = false,
    val mlKitAvailable: Boolean = false,
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val modelDownloader: ModelDownloader,
    private val geminiNanoExtractor: GeminiNanoExtractor,
    private val mlKitEntityExtractor: MlKitEntityExtractor,
) : ViewModel() {

    private val _modelStatus = MutableStateFlow(ModelStatus())
    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState

    init {
        viewModelScope.launch {
            val gemini = geminiNanoExtractor.isAvailable()
            val mlKit = mlKitEntityExtractor.isAvailable()
            _modelStatus.value = ModelStatus(geminiNano = gemini, mlKit = mlKit)
        }

        combine(modelDownloader.state, _modelStatus) { downloadState, status ->
            val installed = modelDownloader.isModelInstalled()
            val sizeBytes = modelDownloader.getModelSizeBytes()
            SettingsUiState(
                modelInstalled = installed,
                modelSizeMb = if (sizeBytes > 0) formatSize(sizeBytes) else "",
                downloadState = downloadState,
                geminiNanoAvailable = status.geminiNano,
                mlKitAvailable = status.mlKit,
            )
        }.onEach { _uiState.value = it }.launchIn(viewModelScope)
    }

    fun downloadModel() {
        viewModelScope.launch { modelDownloader.download() }
    }

    fun cancelDownload() {
        modelDownloader.cancelDownload()
    }

    fun deleteModel() {
        viewModelScope.launch {
            modelDownloader.deleteModel()
            _modelStatus.value = _modelStatus.value.copy()
        }
    }

    private fun formatSize(bytes: Long): String {
        val mb = bytes / (1024.0 * 1024.0)
        return if (mb >= 1024) {
            "%.1f GB".format(mb / 1024.0)
        } else {
            "%.1f MB".format(mb)
        }
    }

    private data class ModelStatus(
        val geminiNano: Boolean = false,
        val mlKit: Boolean = false,
    )
}
