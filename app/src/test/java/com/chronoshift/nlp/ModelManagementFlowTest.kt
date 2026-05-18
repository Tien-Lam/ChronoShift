package com.chronoshift.nlp

import com.sun.net.httpserver.HttpServer
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test
import java.io.File
import java.net.InetSocketAddress
import java.security.MessageDigest
import java.nio.file.Files

class ModelManagementFlowTest {

    @Test
    fun `manifest update downloads selected model and LiteRT uses that installed path`() = runTest {
        val testRoot = Files.createTempDirectory("chronoshift-model-flow").toFile()
        val modelBytes = "replacement-model".toByteArray()
        var server: HttpServer? = null

        try {
            val newModel = ModelDescriptor.Default.copy(
                versionName = "test-update",
                versionCode = 2,
                fileName = "gemma-test-update.litertlm",
                url = "",
                sha256 = sha256(modelBytes),
                sizeBytes = modelBytes.size.toLong(),
                recommended = true,
            )
            server = modelServer(modelBytes) { baseUrl ->
                val modelWithUrl = newModel.copy(url = "$baseUrl/model.litertlm")
                """{"schemaVersion":1,"models":[${ModelManifestParser.toJson(modelWithUrl)}]}"""
            }
            val manifestUrl = "http://127.0.0.1:${server.address.port}/manifest.json"
            val repository = ModelRepository(File(testRoot, "models"), manifestUrl)
            val oldModelFile = repository.modelFile(ModelDescriptor.Default)
            repository.modelsDir.mkdirs()
            oldModelFile.writeText("old-model")
            repository.markInstalled(ModelDescriptor.Default)

            val engineFactory = RecordingLiteRtEngineFactory(
                response = """[{"time":"10:00","date":"2026-04-09","timezone":"America/Los_Angeles","original":"10am PT"}]""",
            )
            val extractor = LiteRtExtractor(repository, engineFactory)
            assertTrue(extractor.isAvailable())
            assertEquals(oldModelFile.absolutePath, engineFactory.createdWith.single().absolutePath)

            repository.refreshManifest()

            val update = repository.state.value.updateCandidate
            assertEquals("The manifest should expose the newer compatible model", 2, update?.versionCode)
            assertEquals("test-update", update?.versionName)

            val downloader = ModelDownloader(repository)
            downloader.download()

            assertTrue(downloader.state.value is DownloadState.Completed)
            assertFalse("Updating to a new filename should remove the previous model", oldModelFile.exists())
            assertEquals("The downloaded model bytes should be installed unchanged", modelBytes.toList(), repository.getSelectedModelFile()?.readBytes()?.toList())
            assertEquals(2, repository.getInstalledModel()?.descriptor?.versionCode)

            assertTrue(extractor.isAvailable())
            assertEquals(
                "LiteRT should reinitialize against the updated selected model path",
                repository.getSelectedModelFile()?.absolutePath,
                engineFactory.createdWith.last().absolutePath,
            )
            assertEquals("The same app session should have initialized old then updated model", 2, engineFactory.createdWith.size)

            val extraction = extractor.extract("10am PT")
            assertEquals("LiteRT", extraction.method)
            assertEquals(1, extraction.times.size)
            assertEquals("10am PT", extraction.times[0].originalText)
            assertEquals("America/Los_Angeles", extraction.times[0].sourceTimezone?.id)
        } finally {
            server?.stop(0)
            testRoot.deleteRecursively()
        }
    }

    private fun modelServer(
        modelBytes: ByteArray,
        manifest: (String) -> String,
    ): HttpServer {
        val server = HttpServer.create(InetSocketAddress("127.0.0.1", 0), 0)
        val baseUrl = "http://127.0.0.1:${server.address.port}"
        server.createContext("/manifest.json") { exchange ->
            val bytes = manifest(baseUrl).toByteArray()
            exchange.responseHeaders.add("Content-Type", "application/json")
            exchange.sendResponseHeaders(200, bytes.size.toLong())
            exchange.responseBody.use { it.write(bytes) }
        }
        server.createContext("/model.litertlm") { exchange ->
            exchange.responseHeaders.add("Content-Type", "application/octet-stream")
            exchange.sendResponseHeaders(200, modelBytes.size.toLong())
            exchange.responseBody.use { it.write(modelBytes) }
        }
        server.start()
        return server
    }

    private fun sha256(bytes: ByteArray): String {
        return MessageDigest.getInstance("SHA-256")
            .digest(bytes)
            .joinToString("") { "%02x".format(it) }
    }

    private class RecordingLiteRtEngineFactory(
        private val response: String,
    ) : LiteRtEngineFactory {
        val createdWith = mutableListOf<File>()

        override fun create(modelFile: File): LiteRtEngineSession {
            createdWith += modelFile
            return object : LiteRtEngineSession {
                private var initialized = false

                override fun initialize() {
                    initialized = true
                }

                override fun isInitialized(): Boolean = initialized

                override fun generate(prompt: String): String = response
            }
        }
    }
}
