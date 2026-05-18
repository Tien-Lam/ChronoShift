package com.chronoshift.nlp

import android.content.Context
import android.util.Log
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ModelRepository internal constructor(
    private val modelDirectory: File,
    private val manifestUrl: String,
) {
    @Inject
    constructor(@ApplicationContext context: Context) : this(
        modelDirectory = File(context.filesDir, "models"),
        manifestUrl = MANIFEST_URL,
    )

    private val _state = MutableStateFlow(buildState(listOf(ModelDescriptor.Default), null))
    val state: StateFlow<ModelCatalogState> = _state.asStateFlow()

    val modelsDir: File
        get() = modelDirectory

    private val selectedModelMetadata: File
        get() = File(modelsDir, SELECTED_MODEL_METADATA)

    init {
        _state.value = buildState(_state.value.availableModels, null)
    }

    suspend fun refreshManifest() {
        withContext(Dispatchers.IO) {
            var connection: HttpURLConnection? = null
            try {
                val url = URL(manifestUrl)
                connection = url.openConnection() as HttpURLConnection
                connection.connectTimeout = 10_000
                connection.readTimeout = 10_000
                connection.connect()

                if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                    throw IllegalStateException("HTTP ${connection.responseCode}")
                }

                applyManifest(connection.inputStream.bufferedReader().use { it.readText() })
            } catch (e: Exception) {
                Log.w(TAG, "Model manifest refresh failed", e)
                _state.value = buildState(_state.value.availableModels, e.message ?: "Manifest refresh failed")
            } finally {
                connection?.disconnect()
            }
        }
    }

    internal fun applyManifest(json: String) {
        val remoteModels = ModelManifestParser.parse(json)
        val models = (remoteModels + ModelDescriptor.Default)
            .distinctBy { it.id to it.versionCode }
            .sortedByDescending { it.versionCode }
        _state.value = buildState(models, null)
    }

    fun getDownloadTarget(): ModelDescriptor {
        val current = _state.value
        return current.updateCandidate ?: current.recommendedModel
    }

    fun getSelectedModelFile(): File? {
        val installed = getInstalledModel() ?: return null
        return modelFile(installed.descriptor).takeIf { it.exists() }
    }

    fun getInstalledModel(): InstalledModel? {
        val selected = readSelectedModel()
        if (selected != null) {
            val file = modelFile(selected)
            if (file.exists()) return InstalledModel(selected, file.length())
        }

        val legacyFile = modelFile(ModelDescriptor.Default)
        if (legacyFile.exists()) {
            return InstalledModel(ModelDescriptor.Default, legacyFile.length())
        }

        return null
    }

    fun getModelSizeBytes(): Long = getSelectedModelFile()?.length() ?: 0L

    fun isModelInstalled(): Boolean = getSelectedModelFile() != null

    fun modelFile(model: ModelDescriptor): File = File(modelsDir, model.fileName)

    fun tempFile(model: ModelDescriptor): File = File(modelsDir, "${model.fileName}.tmp")

    fun markInstalled(model: ModelDescriptor) {
        val previous = getInstalledModel()?.descriptor
        modelsDir.mkdirs()
        selectedModelMetadata.writeText(ModelManifestParser.toJson(model))
        if (previous != null && modelFile(previous).absolutePath != modelFile(model).absolutePath) {
            modelFile(previous).delete()
            tempFile(previous).delete()
        }
        _state.value = buildState(_state.value.availableModels, null)
    }

    suspend fun deleteInstalledModel() {
        withContext(Dispatchers.IO) {
            getInstalledModel()?.let { installed ->
                modelFile(installed.descriptor).delete()
                tempFile(installed.descriptor).delete()
            }
            modelFile(ModelDescriptor.Default).delete()
            tempFile(ModelDescriptor.Default).delete()
            selectedModelMetadata.delete()
        }
        _state.value = buildState(_state.value.availableModels, null)
    }

    private fun buildState(models: List<ModelDescriptor>, error: String?): ModelCatalogState {
        val compatibleModels = models
            .filter { it.isCompatible() }
            .ifEmpty { listOf(ModelDescriptor.Default) }
            .distinctBy { it.id to it.versionCode }
            .sortedWith(compareByDescending<ModelDescriptor> { if (it.recommended) 1 else 0 }.thenByDescending { it.versionCode })
        return ModelCatalogState(
            availableModels = compatibleModels,
            installedModel = getInstalledModel(),
            refreshError = error,
        )
    }

    private fun readSelectedModel(): ModelDescriptor? {
        return try {
            if (!selectedModelMetadata.exists()) return null
            ModelManifestParser.parseModel(selectedModelMetadata.readText())
        } catch (e: Exception) {
            Log.w(TAG, "Failed to read selected model metadata", e)
            null
        }
    }

    companion object {
        private const val TAG = "ModelRepository"
        private const val SELECTED_MODEL_METADATA = "selected-model.json"
        const val MANIFEST_URL =
            "https://raw.githubusercontent.com/Tien-Lam/ChronoShift/main/model-manifest.json"
    }
}
