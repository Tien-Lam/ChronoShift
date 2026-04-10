package com.chronoshift.nlp

import android.util.Log
import com.chronoshift.conversion.ExtractedTime
import kotlinx.datetime.toInstant

object ResultMerger {

    private const val TAG = "ResultMerger"

    fun mergeResults(
        existing: List<ExtractedTime>,
        incoming: List<ExtractedTime>,
        method: String,
    ): List<ExtractedTime> {
        if (incoming.isNotEmpty()) {
            Log.d(TAG, "Merging ${incoming.size} incoming ($method) into ${existing.size} existing")
        }
        val merged = existing.toMutableList()
        for (time in incoming) {
            val exact = merged.indexOfFirst { isSameTime(it, time) }
            if (exact >= 0) {
                val entry = merged[exact]
                Log.d(TAG, "  EXACT match: \"${time.originalText}\" tz=${time.sourceTimezone?.id} → merged with \"${entry.originalText}\" tz=${entry.sourceTimezone?.id}")
                merged[exact] = entry.copy(method = combineMethod(entry.method, method))
                continue
            }
            val fuzzy = merged.indexOfFirst { isSameLocalTime(it, time) }
            if (fuzzy >= 0) {
                val entry = merged[fuzzy]
                if (entry.sourceTimezone == null && time.sourceTimezone != null) {
                    Log.d(TAG, "  FUZZY upgrade: \"${time.originalText}\" tz=${time.sourceTimezone?.id} upgrades null-tz \"${entry.originalText}\"")
                    merged[fuzzy] = time.copy(method = combineMethod(entry.method, method))
                } else if (entry.sourceTimezone != null && time.sourceTimezone == null) {
                    Log.d(TAG, "  FUZZY keep: \"${time.originalText}\" has no tz, keeping existing tz=${entry.sourceTimezone?.id}")
                    merged[fuzzy] = entry.copy(method = combineMethod(entry.method, method))
                } else if (isSameInstant(entry, time)) {
                    Log.d(TAG, "  FUZZY same-instant: \"${time.originalText}\" tz=${time.sourceTimezone?.id} instant=${time.instant} == \"${entry.originalText}\" tz=${entry.sourceTimezone?.id} instant=${entry.instant} → merged")
                    merged[fuzzy] = entry.copy(method = combineMethod(entry.method, method))
                } else {
                    Log.d(TAG, "  FUZZY different-instant: \"${time.originalText}\" tz=${time.sourceTimezone?.id} instant=${time.instant} ≠ \"${entry.originalText}\" tz=${entry.sourceTimezone?.id} instant=${entry.instant} → kept separate")
                    merged.add(time.copy(method = method))
                }
                continue
            }
            Log.d(TAG, "  NEW: \"${time.originalText}\" tz=${time.sourceTimezone?.id} localDt=${time.localDateTime} instant=${time.instant}")
            merged.add(time.copy(method = method))
        }
        return merged.toList()
    }

    fun isSameTime(a: ExtractedTime, b: ExtractedTime): Boolean {
        if (a.instant != null && b.instant != null) {
            return a.instant == b.instant && a.sourceTimezone == b.sourceTimezone
        }
        if (a.localDateTime != null && b.localDateTime != null) {
            return a.localDateTime.hour == b.localDateTime.hour &&
                a.localDateTime.minute == b.localDateTime.minute &&
                a.localDateTime.date == b.localDateTime.date &&
                a.sourceTimezone == b.sourceTimezone
        }
        return false
    }

    fun isSameLocalTime(a: ExtractedTime, b: ExtractedTime): Boolean {
        val aDt = a.localDateTime ?: return false
        val bDt = b.localDateTime ?: return false
        return aDt.hour == bDt.hour && aDt.minute == bDt.minute && aDt.date == bDt.date
    }

    fun isSameInstant(a: ExtractedTime, b: ExtractedTime): Boolean {
        if (a.instant != null && b.instant != null) return a.instant == b.instant
        val aTz = a.sourceTimezone ?: return false
        val bTz = b.sourceTimezone ?: return false
        val aDt = a.localDateTime ?: return false
        val bDt = b.localDateTime ?: return false
        return try { aDt.toInstant(aTz) == bDt.toInstant(bTz) } catch (_: Exception) { false }
    }

    fun combineMethod(existing: String, new: String): String {
        if (new.isEmpty() || new in existing) return existing
        if (existing.isEmpty()) return new
        return "$existing + $new"
    }
}
