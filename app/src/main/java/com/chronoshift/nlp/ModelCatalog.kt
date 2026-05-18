package com.chronoshift.nlp

import com.chronoshift.BuildConfig
import org.json.JSONArray
import org.json.JSONObject

data class ModelDescriptor(
    val id: String,
    val name: String,
    val versionName: String,
    val versionCode: Int,
    val fileName: String,
    val url: String,
    val sha256: String? = null,
    val sizeBytes: Long = 0L,
    val format: String = FORMAT_LITERTLM,
    val minAppVersionCode: Int = 1,
    val promptVersion: Int = PROMPT_VERSION,
    val recommended: Boolean = false,
) {
    fun isCompatible(): Boolean {
        return format.equals(FORMAT_LITERTLM, ignoreCase = true) &&
            minAppVersionCode <= BuildConfig.VERSION_CODE &&
            promptVersion == PROMPT_VERSION &&
            fileName.endsWith(".litertlm", ignoreCase = true)
    }

    companion object {
        const val FORMAT_LITERTLM = "litertlm"
        const val PROMPT_VERSION = 1

        val Default = ModelDescriptor(
            id = "gemma-4-e2b-it",
            name = "Gemma 4 E2B",
            versionName = "4 E2B",
            versionCode = 1,
            fileName = "gemma-4-E2B-it.litertlm",
            url = "https://huggingface.co/litert-community/gemma-4-E2B-it-litert-lm/resolve/main/gemma-4-E2B-it.litertlm",
            recommended = true,
        )
    }
}

data class InstalledModel(
    val descriptor: ModelDescriptor,
    val sizeBytes: Long,
)

data class ModelCatalogState(
    val availableModels: List<ModelDescriptor> = listOf(ModelDescriptor.Default),
    val installedModel: InstalledModel? = null,
    val selectedModel: ModelDescriptor = installedModel?.descriptor ?: recommendedModel(availableModels),
    val refreshError: String? = null,
) {
    val recommendedModel: ModelDescriptor = recommendedModel(availableModels)
    val updateCandidate: ModelDescriptor? =
        installedModel?.descriptor?.let { installed ->
            availableModels
                .filter { it.id != installed.id || it.versionCode > installed.versionCode }
                .filter { it.recommended || it.id == installed.id }
                .maxByOrNull { it.versionCode }
        }

    companion object {
        fun recommendedModel(models: List<ModelDescriptor>): ModelDescriptor {
            return models
                .filter { it.isCompatible() }
                .maxWithOrNull(
                    compareBy<ModelDescriptor> { if (it.recommended) 1 else 0 }
                        .thenBy { it.versionCode }
                )
                ?: ModelDescriptor.Default
        }
    }
}

object ModelManifestParser {
    fun parse(json: String): List<ModelDescriptor> {
        val root = JSONObject(json)
        val models = root.optJSONArray("models") ?: JSONArray()
        return buildList {
            for (i in 0 until models.length()) {
                val obj = models.optJSONObject(i) ?: continue
                parseModel(obj)?.let { add(it) }
            }
        }.filter { it.isCompatible() }
    }

    fun parseModel(json: String): ModelDescriptor? {
        return parseModel(JSONObject(json))
    }

    fun toJson(model: ModelDescriptor): String {
        return JSONObject()
            .put("id", model.id)
            .put("name", model.name)
            .put("versionName", model.versionName)
            .put("versionCode", model.versionCode)
            .put("fileName", model.fileName)
            .put("url", model.url)
            .put("sha256", model.sha256)
            .put("sizeBytes", model.sizeBytes)
            .put("format", model.format)
            .put("minAppVersionCode", model.minAppVersionCode)
            .put("promptVersion", model.promptVersion)
            .put("recommended", model.recommended)
            .toString()
    }

    private fun parseModel(obj: JSONObject): ModelDescriptor? {
        val id = obj.optString("id").trim()
        val name = obj.optString("name").trim()
        val versionName = obj.optString("versionName", obj.optString("version", "")).trim()
        val fileName = obj.optString("fileName").trim()
        val url = obj.optString("url").trim()
        if (id.isEmpty() || name.isEmpty() || versionName.isEmpty() || fileName.isEmpty() || url.isEmpty()) {
            return null
        }

        return ModelDescriptor(
            id = id,
            name = name,
            versionName = versionName,
            versionCode = obj.optInt("versionCode", 0),
            fileName = fileName,
            url = url,
            sha256 = obj.optString("sha256").trim().ifEmpty { null },
            sizeBytes = obj.optLong("sizeBytes", 0L),
            format = obj.optString("format", ModelDescriptor.FORMAT_LITERTLM),
            minAppVersionCode = obj.optInt("minAppVersionCode", 1),
            promptVersion = obj.optInt("promptVersion", ModelDescriptor.PROMPT_VERSION),
            recommended = obj.optBoolean("recommended", false),
        )
    }
}
