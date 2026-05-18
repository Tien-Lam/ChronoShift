package com.chronoshift.nlp

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ModelDownloaderTest {

    @Test
    fun `DownloadState Idle is correct type`() {
        val state: DownloadState = DownloadState.Idle
        assertTrue(state is DownloadState.Idle)
        assertFalse(state is DownloadState.Downloading)
        assertFalse(state is DownloadState.Completed)
        assertFalse(state is DownloadState.Failed)
    }

    @Test
    fun `DownloadState Downloading is correct type`() {
        val state: DownloadState = DownloadState.Downloading(0.5f)
        assertTrue(state is DownloadState.Downloading)
        assertFalse(state is DownloadState.Idle)
        assertFalse(state is DownloadState.Completed)
        assertFalse(state is DownloadState.Failed)
    }

    @Test
    fun `DownloadState Completed is correct type`() {
        val state: DownloadState = DownloadState.Completed
        assertTrue(state is DownloadState.Completed)
        assertFalse(state is DownloadState.Idle)
        assertFalse(state is DownloadState.Downloading)
        assertFalse(state is DownloadState.Failed)
    }

    @Test
    fun `DownloadState Failed is correct type`() {
        val state: DownloadState = DownloadState.Failed("error")
        assertTrue(state is DownloadState.Failed)
        assertFalse(state is DownloadState.Idle)
        assertFalse(state is DownloadState.Downloading)
        assertFalse(state is DownloadState.Completed)
    }

    @Test
    fun `Downloading progress at zero`() {
        val state = DownloadState.Downloading(0.0f)
        assertEquals(0.0f, state.progress)
    }

    @Test
    fun `Downloading progress at midpoint`() {
        val state = DownloadState.Downloading(0.5f)
        assertEquals(0.5f, state.progress)
    }

    @Test
    fun `Downloading progress at one`() {
        val state = DownloadState.Downloading(1.0f)
        assertEquals(1.0f, state.progress)
    }

    @Test
    fun `Downloading progress at small fraction`() {
        val state = DownloadState.Downloading(0.001f)
        assertEquals(0.001f, state.progress)
    }

    @Test
    fun `Downloading progress at near completion`() {
        val state = DownloadState.Downloading(0.999f)
        assertEquals(0.999f, state.progress)
    }

    @Test
    fun `Failed message preservation - simple message`() {
        val state = DownloadState.Failed("HTTP 404")
        assertEquals("HTTP 404", state.error)
    }

    @Test
    fun `Failed message preservation - empty message`() {
        val state = DownloadState.Failed("")
        assertEquals("", state.error)
    }

    @Test
    fun `Failed message preservation - detailed exception message`() {
        val message = "java.net.ConnectException: Failed to connect to huggingface.co/443"
        val state = DownloadState.Failed(message)
        assertEquals(message, state.error)
    }

    @Test
    fun `Failed message preservation - unknown error fallback`() {
        val state = DownloadState.Failed("Unknown error")
        assertEquals("Unknown error", state.error)
    }

    @Test
    fun `Downloading data class equality`() {
        val a = DownloadState.Downloading(0.5f)
        val b = DownloadState.Downloading(0.5f)
        assertEquals(a, b)
    }

    @Test
    fun `Downloading data class inequality`() {
        val a = DownloadState.Downloading(0.3f)
        val b = DownloadState.Downloading(0.7f)
        assertFalse(a == b)
    }

    @Test
    fun `Failed data class equality`() {
        val a = DownloadState.Failed("error")
        val b = DownloadState.Failed("error")
        assertEquals(a, b)
    }

    @Test
    fun `Failed data class inequality`() {
        val a = DownloadState.Failed("error one")
        val b = DownloadState.Failed("error two")
        assertFalse(a == b)
    }

    @Test
    fun `Idle and Completed are singletons`() {
        assertTrue(DownloadState.Idle === DownloadState.Idle)
        assertTrue(DownloadState.Completed === DownloadState.Completed)
    }

    @Test
    fun `manifest parser keeps compatible LiteRT models`() {
        val json = """{
            "models": [
                {
                    "id": "newer",
                    "name": "Newer Gemma",
                    "versionName": "2",
                    "versionCode": 2,
                    "fileName": "newer.litertlm",
                    "url": "https://example.com/newer.litertlm",
                    "format": "litertlm",
                    "minAppVersionCode": 1,
                    "promptVersion": 1,
                    "recommended": true
                }
            ]
        }"""

        val models = ModelManifestParser.parse(json)

        assertEquals(1, models.size)
        assertEquals("newer", models[0].id)
        assertTrue(models[0].recommended)
    }

    @Test
    fun `manifest parser filters incompatible model formats`() {
        val json = """{
            "models": [
                {
                    "id": "wrong-format",
                    "name": "Wrong Format",
                    "versionName": "1",
                    "versionCode": 1,
                    "fileName": "wrong.gguf",
                    "url": "https://example.com/wrong.gguf",
                    "format": "gguf",
                    "minAppVersionCode": 1,
                    "promptVersion": 1,
                    "recommended": true
                }
            ]
        }"""

        val models = ModelManifestParser.parse(json)

        assertTrue(models.isEmpty())
    }

    @Test
    fun `catalog state detects recommended update for installed model`() {
        val installed = ModelDescriptor.Default.copy(versionCode = 1, recommended = false)
        val newer = installed.copy(versionName = "2", versionCode = 2, recommended = true)

        val state = ModelCatalogState(
            availableModels = listOf(installed, newer),
            installedModel = InstalledModel(installed, sizeBytes = 123L),
        )

        assertEquals(newer, state.updateCandidate)
    }
}
