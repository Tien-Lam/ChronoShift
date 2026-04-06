package com.chronoshift.nlp

import kotlinx.datetime.TimeZone
import java.time.ZoneId

class TestCityResolver : CityResolverInterface {

    override fun resolve(cityQuery: String): TimeZone? {
        val q = cityQuery.lowercase().trim()

        CITY_MAP[q]?.let { return tryZone(it) }

        // Fuzzy: edit distance <= 2
        CITY_MAP.entries
            .map { (city, zoneId) -> Triple(city, zoneId, editDistance(q, city)) }
            .filter { it.third <= 2 }
            .minByOrNull { it.third }
            ?.let { return tryZone(it.second) }

        // Prefix/substring
        CITY_MAP.entries
            .filter { (city, _) -> city.startsWith(q) || q in city }
            .maxByOrNull { (city, _) -> city.length }
            ?.let { return tryZone(it.value) }

        return null
    }

    private fun tryZone(iana: String): TimeZone? =
        try { TimeZone.of(iana) } catch (_: Exception) { null }

    private fun editDistance(a: String, b: String): Int {
        if (a == b) return 0
        if (a.isEmpty()) return b.length
        if (b.isEmpty()) return a.length
        val dp = Array(a.length + 1) { IntArray(b.length + 1) }
        for (i in 0..a.length) dp[i][0] = i
        for (j in 0..b.length) dp[0][j] = j
        for (i in 1..a.length) {
            for (j in 1..b.length) {
                val cost = if (a[i - 1] == b[j - 1]) 0 else 1
                dp[i][j] = minOf(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
            }
        }
        return dp[a.length][b.length]
    }

    companion object {
        private val CITY_MAP: Map<String, String> by lazy {
            val aliases = mapOf(
                "san francisco" to "America/Los_Angeles",
                "sf" to "America/Los_Angeles",
                "nyc" to "America/New_York",
            )
            val iana = ZoneId.getAvailableZoneIds()
                .filter { '/' in it && !it.startsWith("Etc/") && !it.startsWith("SystemV/") }
                .associate { zoneId ->
                    zoneId.substringAfterLast('/').replace('_', ' ').lowercase() to zoneId
                }
            aliases + iana
        }
    }
}
