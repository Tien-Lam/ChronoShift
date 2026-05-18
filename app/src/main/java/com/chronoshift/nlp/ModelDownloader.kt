package com.chronoshift.nlp

import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import java.io.BufferedInputStream
import java.net.HttpURLConnection
import java.net.URL
import java.security.MessageDigest
import javax.inject.Inject
import javax.inject.Singleton

sealed class DownloadState {
    object Idle : DownloadState()
    data class Downloading(val progress: Float) : DownloadState()
    object Completed : DownloadState()
    data class Failed(val error: String) : DownloadState()
}

@Singleton
class ModelDownloader @Inject constructor(
    private val modelRepository: ModelRepository,
) {
    private val _state = MutableStateFlow<DownloadState>(DownloadState.Idle)
    val state: StateFlow<DownloadState> = _state.asStateFlow()

    @Volatile
    private var cancelled = false

    fun isModelInstalled(): Boolean = modelRepository.isModelInstalled()

    fun getModelFile() = modelRepository.getSelectedModelFile()

    fun getModelSizeBytes(): Long = modelRepository.getModelSizeBytes()

    suspend fun download() {
        if (_state.value is DownloadState.Downloading) return

        val model = modelRepository.getDownloadTarget()
        cancelled = false
        _state.value = DownloadState.Downloading(0f)

        withContext(Dispatchers.IO) {
            var connection: HttpURLConnection? = null
            try {
                modelRepository.modelsDir.mkdirs()
                val tempFile = modelRepository.tempFile(model)
                val modelFile = modelRepository.modelFile(model)
                tempFile.delete()

                val url = URL(model.url)
                connection = url.openConnection() as HttpURLConnection
                connection.connectTimeout = 30_000
                connection.readTimeout = 30_000
                connection.connect()

                if (connection.responseCode != HttpURLConnection.HTTP_OK) {
                    _state.value = DownloadState.Failed("HTTP ${connection.responseCode}")
                    return@withContext
                }

                val contentLength = connection.contentLengthLong
                var bytesRead = 0L

                BufferedInputStream(connection.inputStream).use { input ->
                    tempFile.outputStream().use { output ->
                        val buffer = ByteArray(8192)
                        var read: Int
                        while (input.read(buffer).also { read = it } != -1) {
                            if (cancelled) {
                                tempFile.delete()
                                _state.value = DownloadState.Idle
                                return@withContext
                            }
                            output.write(buffer, 0, read)
                            bytesRead += read
                            if (contentLength > 0) {
                                _state.value = DownloadState.Downloading(
                                    (bytesRead.toFloat() / contentLength).coerceIn(0f, 1f)
                                )
                            }
                        }
                    }
                }

                val expectedHash = model.sha256
                if (!expectedHash.isNullOrBlank() && sha256(tempFile) != expectedHash.lowercase()) {
                    tempFile.delete()
                    _state.value = DownloadState.Failed("Downloaded model failed checksum verification")
                    return@withContext
                }

                if (modelFile.exists() && !modelFile.delete()) {
                    tempFile.delete()
                    _state.value = DownloadState.Failed("Failed to replace existing model")
                    return@withContext
                }

                if (!tempFile.renameTo(modelFile)) {
                    tempFile.delete()
                    _state.value = DownloadState.Failed("Failed to move downloaded file")
                    return@withContext
                }
                modelRepository.markInstalled(model)
                _state.value = DownloadState.Completed
                Log.d(TAG, "Model download completed: ${model.id} ${model.versionName}")
            } catch (e: Exception) {
                if (cancelled) {
                    _state.value = DownloadState.Idle
                } else {
                    Log.w(TAG, "Model download failed", e)
                    _state.value = DownloadState.Failed(e.message ?: "Unknown error")
                }
            } finally {
                connection?.disconnect()
            }
        }
    }

    fun cancelDownload() {
        cancelled = true
    }

    suspend fun deleteModel() {
        modelRepository.deleteInstalledModel()
        _state.value = DownloadState.Idle
    }

    private fun sha256(file: java.io.File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        file.inputStream().use { input ->
            val buffer = ByteArray(8192)
            var read: Int
            while (input.read(buffer).also { read = it } != -1) {
                digest.update(buffer, 0, read)
            }
        }
        return digest.digest().joinToString("") { "%02x".format(it) }
    }

    companion object {
        private const val TAG = "ModelDownloader"
    }
}
