package com.chronoshift.ui.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.chronoshift.nlp.DownloadState
import com.chronoshift.nlp.ModelCatalogState
import com.chronoshift.nlp.ModelDownloader
import com.chronoshift.nlp.ModelRepository
import com.chronoshift.nlp.SpanDetector
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
    val modelName: String = "",
    val modelVersion: String = "",
    val modelSizeMb: String = "",
    val updateAvailable: Boolean = false,
    val updateModelName: String = "",
    val updateModelVersion: String = "",
    val downloadSize: String = "",
    val downloadRequiredStorage: String = "",
    val downloadAvailableStorage: String = "",
    val downloadHasEnoughStorage: Boolean = true,
    val downloadMeteredNetwork: Boolean = false,
    val modelCatalogError: String? = null,
    val downloadState: DownloadState = DownloadState.Idle,
    val mlKitAvailable: Boolean = false,
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val modelDownloader: ModelDownloader,
    private val modelRepository: ModelRepository,
    private val mlKitEntityExtractor: SpanDetector,
) : ViewModel() {

    private val _modelStatus = MutableStateFlow(ModelStatus())
    private val _uiState = MutableStateFlow(SettingsUiState())
    val uiState: StateFlow<SettingsUiState> = _uiState

    init {
        viewModelScope.launch {
            val mlKit = mlKitEntityExtractor.isAvailable()
            _modelStatus.value = ModelStatus(mlKit = mlKit)
        }

        viewModelScope.launch {
            modelRepository.refreshManifest()
        }

        combine(modelDownloader.state, modelRepository.state, _modelStatus) { downloadState, catalog, status ->
            toUiState(downloadState, catalog, status)
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

    private fun toUiState(
        downloadState: DownloadState,
        catalog: ModelCatalogState,
        status: ModelStatus,
    ): SettingsUiState {
        val installed = catalog.installedModel
        val selected = installed?.descriptor ?: catalog.selectedModel
        val update = catalog.updateCandidate
        val downloadTarget = update ?: if (installed == null) selected else null
        val preflight = downloadTarget?.let { modelDownloader.getDownloadPreflight(it) }
        val sizeBytes = installed?.sizeBytes ?: 0L
        return SettingsUiState(
            modelInstalled = installed != null,
            modelName = selected.name,
            modelVersion = selected.versionName,
            modelSizeMb = if (sizeBytes > 0) formatSize(sizeBytes) else "",
            updateAvailable = update != null,
            updateModelName = update?.name.orEmpty(),
            updateModelVersion = update?.versionName.orEmpty(),
            downloadSize = downloadTarget?.sizeBytes?.takeIf { it > 0L }?.let { formatSize(it) }.orEmpty(),
            downloadRequiredStorage = preflight?.requiredBytes?.takeIf { it > 0L }?.let { formatSize(it) }.orEmpty(),
            downloadAvailableStorage = preflight?.availableBytes?.let { formatSize(it) }.orEmpty(),
            downloadHasEnoughStorage = preflight?.hasEnoughStorage ?: true,
            downloadMeteredNetwork = preflight?.isMeteredNetwork ?: false,
            modelCatalogError = catalog.refreshError,
            downloadState = downloadState,
            mlKitAvailable = status.mlKit,
        )
    }

    private data class ModelStatus(
        val mlKit: Boolean = false,
    )
}
