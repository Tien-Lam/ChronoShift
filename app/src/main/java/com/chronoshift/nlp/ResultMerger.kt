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
                if (entry.sourceTimezone == null && time.sourceTimezone != null) {
                    merged[fuzzy] = time.copy(method = combineMethod(entry.method, method))
                } else if (entry.sourceTimezone != null && time.sourceTimezone == null) {
                    merged[fuzzy] = entry.copy(method = combineMethod(entry.method, method))
                } else {
                    // Both have tz (possibly different) or both lack tz — add as separate
                    merged.add(time.copy(method = method))
                }
                continue
            }
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

    fun combineMethod(existing: String, new: String): String {
        if (new.isEmpty() || new in existing) return existing
        if (existing.isEmpty()) return new
        return "$existing + $new"
    }
}
