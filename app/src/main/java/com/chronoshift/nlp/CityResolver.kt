package com.chronoshift.nlp

import android.content.Context
import android.location.Geocoder
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.datetime.TimeZone
import java.time.ZoneId
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton

interface CityResolverInterface {
    fun resolve(cityQuery: String): TimeZone?
}

object IanaCityLookup {
    private val CITY_ALIASES = mapOf(
        "nyc" to "America/New_York",
        "dc" to "America/New_York",
        "sf" to "America/Los_Angeles",
        "la" to "America/Los_Angeles",
        "san francisco" to "America/Los_Angeles",
        "san diego" to "America/Los_Angeles",
        "seattle" to "America/Los_Angeles",
        "portland" to "America/Los_Angeles",
        "las vegas" to "America/Los_Angeles",
        "boston" to "America/New_York",
        "miami" to "America/New_York",
        "atlanta" to "America/New_York",
        "philadelphia" to "America/New_York",
        "dallas" to "America/Chicago",
        "houston" to "America/Chicago",
        "austin" to "America/Chicago",
        "minneapolis" to "America/Chicago",
        "salt lake city" to "America/Denver",
        "mumbai" to "Asia/Kolkata",
        "delhi" to "Asia/Kolkata",
        "bangalore" to "Asia/Kolkata",
        "beijing" to "Asia/Shanghai",
        "osaka" to "Asia/Tokyo",
        "cape town" to "Africa/Johannesburg",
        "rio" to "America/Sao_Paulo",
        "melbourne" to "Australia/Melbourne",
        "brisbane" to "Australia/Brisbane",
        "abu dhabi" to "Asia/Dubai",
        "barcelona" to "Europe/Madrid",
        "milan" to "Europe/Rome",
        "munich" to "Europe/Berlin",
        "hawaii" to "Pacific/Honolulu",
    )

    val CITY_MAP: Map<String, String> by lazy {
        val iana = ZoneId.getAvailableZoneIds()
            .filter { '/' in it && !it.startsWith("Etc/") && !it.startsWith("SystemV/") }
            .associate { zoneId ->
                zoneId.substringAfterLast('/').replace('_', ' ').lowercase() to zoneId
            }
        CITY_ALIASES + iana
    }

    fun resolve(cityQuery: String): TimeZone? {
        val q = cityQuery.lowercase().trim()

        CITY_MAP[q]?.let { return tryZone(it) }

        CITY_MAP.entries
            .map { (city, zoneId) -> Triple(city, zoneId, editDistance(q, city)) }
            .filter { it.third <= 2 }
            .minByOrNull { it.third }
            ?.let { return tryZone(it.second) }

        CITY_MAP.entries
            .filter { (city, _) -> city.startsWith(q) || q in city }
            .maxByOrNull { (city, _) -> city.length }
            ?.let { return tryZone(it.value) }

        return null
    }

    private fun tryZone(iana: String): TimeZone? =
        try { TimeZone.of(iana) } catch (_: Exception) { null }

    fun editDistance(a: String, b: String): Int {
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
}

@Singleton
class CityResolver @Inject constructor(
    @param:ApplicationContext private val context: Context,
) : CityResolverInterface {
    private val geocoder by lazy { Geocoder(context, Locale.getDefault()) }

    override fun resolve(cityQuery: String): TimeZone? {
        IanaCityLookup.resolve(cityQuery)?.let { return it }
        return resolveViaGeocoder(cityQuery)
    }

    private fun resolveViaGeocoder(query: String): TimeZone? {
        return try {
            @Suppress("DEPRECATION")
            val addresses = geocoder.getFromLocationName(query, 1)
            if (addresses.isNullOrEmpty()) return null
            val addr = addresses[0]
            val lat = addr.latitude
            val lng = addr.longitude
            val zoneId = timezoneFromCoordinates(lat, lng)
            TimeZone.of(zoneId)
        } catch (_: Exception) {
            null
        }
    }

    private fun timezoneFromCoordinates(lat: Double, lng: Double): String {
        // Match coordinates to the IANA zone with the closest offset, preferring
        // zones in the same hemisphere. For accurate zone-boundary results, a
        // shapefile lookup would be needed, but this handles city-level resolution.
        val targetOffsetSeconds = (lng / 15.0 * 3600).toInt()
        val now = java.time.Instant.now()

        val preferredRegion = when {
            lat > 15 -> NORTHERN_REGIONS
            lat < -15 -> SOUTHERN_REGIONS
            else -> emptySet()
        }

        return ZoneId.getAvailableZoneIds()
            .filter { '/' in it && !it.startsWith("Etc/") && !it.startsWith("SystemV/") }
            .minByOrNull { zoneId ->
                val offset = ZoneId.of(zoneId).rules.getOffset(now).totalSeconds
                val offsetDiff = Math.abs(offset - targetOffsetSeconds)
                val region = zoneId.substringBefore('/')
                val regionPenalty = if (preferredRegion.isNotEmpty() && region !in preferredRegion) 3600 else 0
                offsetDiff + regionPenalty
            } ?: "UTC"
    }

    companion object {
        private val NORTHERN_REGIONS = setOf("America", "Europe", "Asia", "Arctic")
        private val SOUTHERN_REGIONS = setOf("Australia", "Pacific", "Antarctica", "Africa")
    }

}
