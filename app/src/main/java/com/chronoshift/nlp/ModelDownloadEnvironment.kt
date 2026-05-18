package com.chronoshift.nlp

import android.content.Context
import android.net.ConnectivityManager
import android.os.StatFs
import java.io.File

data class ModelDownloadPreflight(
    val model: ModelDescriptor,
    val requiredBytes: Long,
    val availableBytes: Long?,
    val isMeteredNetwork: Boolean,
) {
    val hasEnoughStorage: Boolean =
        model.sizeBytes <= 0L || availableBytes == null || availableBytes >= requiredBytes
}

interface ModelDownloadEnvironment {
    fun availableBytes(directory: File): Long?
    fun isActiveNetworkMetered(): Boolean
}

class AndroidModelDownloadEnvironment(
    private val context: Context,
) : ModelDownloadEnvironment {
    override fun availableBytes(directory: File): Long? {
        return try {
            directory.mkdirs()
            StatFs(directory.absolutePath).availableBytes
        } catch (_: Exception) {
            null
        }
    }

    override fun isActiveNetworkMetered(): Boolean {
        return try {
            val connectivityManager = context.getSystemService(ConnectivityManager::class.java)
            connectivityManager?.isActiveNetworkMetered == true
        } catch (_: Exception) {
            false
        }
    }
}

object UnknownModelDownloadEnvironment : ModelDownloadEnvironment {
    override fun availableBytes(directory: File): Long? = null
    override fun isActiveNetworkMetered(): Boolean = false
}
