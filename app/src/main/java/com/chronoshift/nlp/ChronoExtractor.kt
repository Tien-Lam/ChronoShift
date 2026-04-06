package com.chronoshift.nlp

import android.content.Context
import android.util.Log
import app.cash.quickjs.QuickJs
import com.chronoshift.conversion.ExtractedTime
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.datetime.LocalDateTime
import kotlinx.datetime.TimeZone
import kotlinx.datetime.UtcOffset
import kotlinx.datetime.toInstant
import org.json.JSONArray
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChronoExtractor @Inject constructor(
    @param:ApplicationContext private val context: Context,
    private val cityResolver: CityResolverInterface,
) : TimeExtractor {

    private var engine: QuickJs? = null

    override suspend fun isAvailable(): Boolean {
        initEngine()
        return engine != null
    }

    override suspend fun extract(text: String): ExtractionResult {
        val qjs = engine ?: initEngine() ?: return ExtractionResult(emptyList(), "Chrono")

        return try {
            val escaped = text.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n")
            val json = qjs.evaluate("chronoParse('$escaped')") as? String
                ?: return ExtractionResult(emptyList(), "Chrono")

            ExtractionResult(parseResults(json, text), "Chrono")
        } catch (e: Exception) {
            Log.w(TAG, "Chrono extraction failed", e)
            ExtractionResult(emptyList(), "Chrono")
        }
    }

    @Synchronized
    private fun initEngine(): QuickJs? {
        if (engine != null) return engine
        return try {
            val qjs = QuickJs.create()
            val script = context.assets.open("chrono.js").bufferedReader().readText()
            qjs.evaluate(script)
            engine = qjs
            Log.d(TAG, "Chrono.js engine initialized")
            qjs
        } catch (e: Exception) {
            Log.w(TAG, "Failed to initialize Chrono.js", e)
            null
        }
    }

    private fun parseResults(json: String, originalText: String): List<ExtractedTime> {
        val array = JSONArray(json)
        val results = mutableListOf<ExtractedTime>()

        for (i in 0 until array.length()) {
            try {
                val obj = array.getJSONObject(i)
                val text = obj.getString("text")
                val start = obj.getJSONObject("start")

                val year = start.getInt("year")
                val month = start.getInt("month")
                val day = start.getInt("day")
                val hour = start.optInt("hour", 12)
                val minute = start.optInt("minute", 0)
                val second = start.optInt("second", 0)

                val tzOffsetMinutes = if (start.isNull("timezone")) null else start.getInt("timezone")
                val tz = tzOffsetMinutes?.let { offsetToTimezone(it) }

                val dt = LocalDateTime(year, month, day, hour, minute, second)

                results.add(
                    ExtractedTime(
                        instant = if (tz != null) dt.toInstant(tz) else null,
                        localDateTime = dt,
                        sourceTimezone = tz,
                        originalText = text,
                        confidence = 0.9f,
                    )
                )

                // Handle end time (ranges like "12:00 pm - 12:50 pm EDT")
                if (!obj.isNull("end")) {
                    val end = obj.getJSONObject("end")
                    val endDt = LocalDateTime(
                        end.getInt("year"), end.getInt("month"), end.getInt("day"),
                        end.optInt("hour", 12), end.optInt("minute", 0), end.optInt("second", 0),
                    )
                    val endTz = if (end.isNull("timezone")) tz else offsetToTimezone(end.getInt("timezone"))

                    results.add(
                        ExtractedTime(
                            instant = if (endTz != null) endDt.toInstant(endTz) else null,
                            localDateTime = endDt,
                            sourceTimezone = endTz,
                            originalText = "$text (end)",
                            confidence = 0.9f,
                        )
                    )
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to parse chrono result at index $i", e)
            }
        }

        // Post-process: try to resolve city names for results without timezone
        return results.map { ext ->
            if (ext.sourceTimezone == null) {
                val cityTz = tryCityFromContext(originalText)
                if (cityTz != null) ext.copy(sourceTimezone = cityTz) else ext
            } else ext
        }
    }

    private fun offsetToTimezone(offsetMinutes: Int): TimeZone {
        val hours = offsetMinutes / 60
        val mins = offsetMinutes % 60
        return TimeZone.of(UtcOffset(hours, mins).toString())
    }

    private fun tryCityFromContext(text: String): TimeZone? {
        val cityPattern = Regex("""(?:in|at)\s+([A-Za-z][A-Za-z .'-]{1,30})""", RegexOption.IGNORE_CASE)
        val match = cityPattern.find(text) ?: return null
        return cityResolver.resolve(match.groupValues[1].trim())
    }

    companion object {
        private const val TAG = "ChronoExtractor"
    }
}
