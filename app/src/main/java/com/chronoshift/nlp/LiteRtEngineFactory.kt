package com.chronoshift.nlp

import com.google.ai.edge.litertlm.Backend
import com.google.ai.edge.litertlm.Engine
import com.google.ai.edge.litertlm.EngineConfig
import java.io.File
import javax.inject.Inject

interface LiteRtEngineSession {
    fun initialize()
    fun isInitialized(): Boolean
    fun generate(prompt: String): String
}

interface LiteRtEngineFactory {
    fun create(modelFile: File): LiteRtEngineSession
}

class RealLiteRtEngineFactory @Inject constructor() : LiteRtEngineFactory {
    override fun create(modelFile: File): LiteRtEngineSession {
        return RealLiteRtEngineSession(
            Engine(
                EngineConfig(
                    modelPath = modelFile.absolutePath,
                    backend = Backend.CPU(),
                )
            )
        )
    }
}

private class RealLiteRtEngineSession(
    private val engine: Engine,
) : LiteRtEngineSession {
    override fun initialize() {
        engine.initialize()
    }

    override fun isInitialized(): Boolean = engine.isInitialized()

    override fun generate(prompt: String): String {
        return engine.createConversation().use { conversation ->
            conversation.sendMessage(prompt).contents.toString()
        }
    }
}
