package com.chronoshift.nlp

import com.chronoshift.BuildConfig
import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File

class ModelManifestValidationTest {

    @Test
    fun `repository model manifest is compatible and complete`() {
        val manifest = manifestJson()
        assertEquals(1, manifest.getInt("schemaVersion"))

        val models = manifest.getJSONArray("models")
        assertTrue("Manifest must contain at least one model", models.length() > 0)

        val seen = mutableSetOf<String>()
        var recommendedCount = 0
        val parsedModels = buildList {
            for (i in 0 until models.length()) {
                val obj = models.getJSONObject(i)
                val model = ModelManifestParser.parseModel(obj.toString())
                assertNotNull("Manifest model at index $i must parse", model)
                model ?: continue

                assertTrue("id must be non-empty", model.id.isNotBlank())
                assertTrue("${model.id}: name must be non-empty", model.name.isNotBlank())
                assertTrue("${model.id}: versionName must be non-empty", model.versionName.isNotBlank())
                assertTrue("${model.id}: versionCode must be positive", model.versionCode > 0)
                assertTrue("${model.id}: fileName must be .litertlm", model.fileName.endsWith(".litertlm", ignoreCase = true))
                assertEquals("${model.id}: format", ModelDescriptor.FORMAT_LITERTLM, model.format)
                assertEquals("${model.id}: promptVersion", ModelDescriptor.PROMPT_VERSION, model.promptVersion)
                assertTrue("${model.id}: minAppVersionCode must be supported by this app", model.minAppVersionCode <= BuildConfig.VERSION_CODE)
                assertTrue("${model.id}: url must be https", model.url.startsWith("https://"))
                assertTrue("${model.id}: sha256 must be present", !model.sha256.isNullOrBlank())
                assertTrue("${model.id}: sha256 must be lowercase hex", SHA_256.matches(model.sha256.orEmpty()))
                assertTrue("${model.id}: sizeBytes must be positive", model.sizeBytes > 0L)
                assertTrue("${model.id}: must be compatible", model.isCompatible())
                assertTrue("${model.id}: duplicate id/version ${model.versionCode}", seen.add("${model.id}:${model.versionCode}"))
                if (model.recommended) recommendedCount++
                add(model)
            }
        }

        assertTrue("Manifest must include at least one recommended model", recommendedCount > 0)
        assertEquals(
            "Parser should not silently filter entries from the checked-in manifest",
            parsedModels.size,
            ModelManifestParser.parse(manifest.toString()).size,
        )
    }

    @Test
    fun `checked-in default manifest entry matches bundled default descriptor`() {
        val default = ModelDescriptor.Default
        val models = ModelManifestParser.parse(manifestJson().toString())
        val manifestDefault = models.singleOrNull {
            it.id == default.id && it.versionCode == default.versionCode
        }
        assertNotNull("Manifest must include bundled default model ${default.id} v${default.versionCode}", manifestDefault)
        manifestDefault ?: return

        assertEquals(default.name, manifestDefault.name)
        assertEquals(default.versionName, manifestDefault.versionName)
        assertEquals(default.fileName, manifestDefault.fileName)
        assertEquals(default.url, manifestDefault.url)
        assertEquals(default.sha256, manifestDefault.sha256)
        assertEquals(default.sizeBytes, manifestDefault.sizeBytes)
        assertEquals(default.format, manifestDefault.format)
        assertEquals(default.minAppVersionCode, manifestDefault.minAppVersionCode)
        assertEquals(default.promptVersion, manifestDefault.promptVersion)
        assertEquals(default.recommended, manifestDefault.recommended)
    }

    private fun manifestJson(): JSONObject {
        return JSONObject(manifestFile().readText())
    }

    private fun manifestFile(): File {
        val workingDir = requireNotNull(System.getProperty("user.dir")) { "user.dir must be set" }
        var dir = File(workingDir).absoluteFile
        var attempts = 0
        while (attempts < 6) {
            val candidate = File(dir, "model-manifest.json")
            if (candidate.isFile) return candidate
            dir = dir.parentFile ?: break
            attempts++
        }
        throw AssertionError("Could not locate model-manifest.json from $workingDir")
    }

    companion object {
        private val SHA_256 = Regex("^[a-f0-9]{64}$")
    }
}
