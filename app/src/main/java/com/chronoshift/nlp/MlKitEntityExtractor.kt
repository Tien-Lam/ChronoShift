package com.chronoshift.nlp

import android.content.Context
import com.google.mlkit.nl.entityextraction.DateTimeEntity
import com.google.mlkit.nl.entityextraction.Entity
import com.google.mlkit.nl.entityextraction.EntityExtraction
import com.google.mlkit.nl.entityextraction.EntityExtractorOptions
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.suspendCancellableCoroutine
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.coroutines.resume

data class DateTimeSpan(
    val text: String,
    val startIndex: Int,
    val endIndex: Int,
    val timestampMillis: Long,
)

@Singleton
class MlKitEntityExtractor @Inject constructor(
    @param:ApplicationContext private val context: Context,
) : SpanDetector {
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

    override suspend fun detectSpans(text: String): List<DateTimeSpan> {
        if (!isAvailable()) return emptyList()

        val annotations = suspendCancellableCoroutine { cont ->
            extractor.annotate(text)
                .addOnSuccessListener { cont.resume(it) }
                .addOnFailureListener { cont.resume(emptyList()) }
        }

        return annotations.flatMap { annotation ->
            annotation.entities
                .filter { it.type == Entity.TYPE_DATE_TIME }
                .mapNotNull { entity ->
                    val dateTime = entity as? DateTimeEntity ?: return@mapNotNull null
                    DateTimeSpan(
                        text = annotation.annotatedText,
                        startIndex = annotation.start,
                        endIndex = annotation.end,
                        timestampMillis = dateTime.timestampMillis,
                    )
                }
        }
    }
}
