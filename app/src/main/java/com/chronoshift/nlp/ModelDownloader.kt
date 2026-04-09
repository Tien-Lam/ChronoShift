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

sealed class DownloadState {
    object Idle : DownloadState()
    data class Downloading(val progress: Float) : DownloadState()
    object Completed : DownloadState()
    data class Failed(val error: String) : DownloadState()
}

@Singleton
class ModelDownloader @Inject constructor(
    @ApplicationContext private val context: Context,
) {
    private val _state = MutableStateFlow<DownloadState>(DownloadState.Idle)
    val state: StateFlow<DownloadState> = _state.asStateFlow()

    @Volatile
    private var cancelled = false

    private val modelsDir: File
        get() = File(context.filesDir, "models")

    private val modelPath: File
        get() = File(modelsDir, MODEL_NAME)

    fun isModelInstalled(): Boolean = modelPath.exists()

    fun getModelFile(): File? = if (modelPath.exists()) modelPath else null

    fun getModelSizeBytes(): Long = if (modelPath.exists()) modelPath.length() else 0L

    suspend fun download() {
        if (_state.value is DownloadState.Downloading) return

        cancelled = false
        _state.value = DownloadState.Downloading(0f)

        withContext(Dispatchers.IO) {
            var connection: HttpURLConnection? = null
            try {
                modelsDir.mkdirs()
                val tempFile = File(modelsDir, "$MODEL_NAME.tmp")

                val url = URL(DOWNLOAD_URL)
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

                connection.inputStream.use { input ->
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

                tempFile.renameTo(modelPath)
                _state.value = DownloadState.Completed
                Log.d(TAG, "Model download completed")
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
        withContext(Dispatchers.IO) {
            modelPath.delete()
            File(modelsDir, "$MODEL_NAME.tmp").delete()
        }
        _state.value = DownloadState.Idle
    }

    companion object {
        private const val TAG = "ModelDownloader"
        const val MODEL_NAME = "gemma-4-E2B-it.litertlm"
        private const val DOWNLOAD_URL =
            "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it.litertlm"
    }
}
