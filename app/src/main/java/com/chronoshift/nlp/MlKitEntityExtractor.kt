package com.chronoshift.nlp

import android.content.Context
import com.chronoshift.conversion.ExtractedTime
import com.google.mlkit.nl.entityextraction.DateTimeEntity
import com.google.mlkit.nl.entityextraction.Entity
import com.google.mlkit.nl.entityextraction.EntityExtraction
import com.google.mlkit.nl.entityextraction.EntityExtractorOptions
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.datetime.Instant
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.coroutines.resume

@Singleton
class MlKitEntityExtractor @Inject constructor(
    @param:ApplicationContext private val context: Context,
) : TimeExtractor {

    private val extractor by lazy {
        EntityExtraction.getClient(
            EntityExtractorOptions.Builder(EntityExtractorOptions.ENGLISH).build()
        )
    }

    private var modelReady = false

    override suspend fun isAvailable(): Boolean {
        if (modelReady) return true
        return suspendCancellableCoroutine { cont ->
            extractor.downloadModelIfNeeded()
                .addOnSuccessListener {
                    modelReady = true
                    cont.resume(true)
                }
                .addOnFailureListener { cont.resume(false) }
        }
    }

    override suspend fun extract(text: String): ExtractionResult {
        if (!isAvailable()) return ExtractionResult(emptyList(), "ML Kit")

        val annotations = suspendCancellableCoroutine { cont ->
            extractor.annotate(text)
                .addOnSuccessListener { cont.resume(it) }
                .addOnFailureListener { cont.resume(emptyList()) }
        }

        val times = annotations.flatMap { annotation ->
            annotation.entities
                .filter { it.type == Entity.TYPE_DATE_TIME }
                .mapNotNull { entity ->
                    val dateTime = entity as? DateTimeEntity ?: return@mapNotNull null
                    val millis = dateTime.timestampMillis
                    ExtractedTime(
                        instant = Instant.fromEpochMilliseconds(millis),
                        originalText = annotation.annotatedText,
                        confidence = 0.75f,
                    )
                }
        }
        return ExtractionResult(times, "ML Kit")
    }
}
