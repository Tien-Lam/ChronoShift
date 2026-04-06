package com.chronoshift.nlp

import com.chronoshift.conversion.ExtractedTime

object ResultMerger {

    fun mergeResults(
        existing: List<ExtractedTime>,
        incoming: List<ExtractedTime>,
        method: String,
    ): List<ExtractedTime> {
        val merged = existing.toMutableList()
        for (time in incoming) {
            val exact = merged.indexOfFirst { isSameTime(it, time) }
            if (exact >= 0) {
                val entry = merged[exact]
                merged[exact] = entry.copy(method = combineMethod(entry.method, method))
                continue
            }
            val fuzzy = merged.indexOfFirst { isSameLocalTime(it, time) }
            if (fuzzy >= 0) {
                val entry = merged[fuzzy]
                val combined = combineMethod(entry.method, method)
                if (entry.sourceTimezone == null && time.sourceTimezone != null) {
                    // Incoming has tz, existing doesn't → upgrade
                    merged[fuzzy] = time.copy(method = combined)
                } else if (entry.sourceTimezone != null && time.sourceTimezone != null
                    && entry.sourceTimezone != time.sourceTimezone) {
                    // Both have tz but they differ → prefer incoming (later = higher quality)
                    merged[fuzzy] = time.copy(method = combined)
                } else {
                    // Same tz or incoming lacks tz → keep existing
                    merged[fuzzy] = entry.copy(method = combined)
                }
                continue
            }
            merged.add(time.copy(method = method))
        }
        return merged.toList()
    }

    fun isSameTime(a: ExtractedTime, b: ExtractedTime): Boolean {
        if (a.instant != null && b.instant != null) {
            // Same instant + same local display = true duplicate
            // Same instant + different timezone = same moment shown differently, keep both
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

    fun combineMethod(existing: String, new: String): String {
        return if (new in existing) existing else "$existing + $new"
    }
}
