package com.chronoshift.nlp

import android.content.Context
import android.util.Log
import app.cash.zipline.QuickJs
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

    private data class ParsedChronoResult(
        val extracted: ExtractedTime,
        val dateCertain: Boolean,
    )

    private fun parseResults(json: String, originalText: String): List<ExtractedTime> {
        val array = JSONArray(json)
        val parsed = mutableListOf<ParsedChronoResult>()

        for (i in 0 until array.length()) {
            try {
                val obj = array.getJSONObject(i)
                val text = obj.getString("text")
                val start = obj.getJSONObject("start")
                val isCertain = start.optJSONObject("isCertain")

                val year = start.getInt("year")
                val month = start.getInt("month")
                val day = start.getInt("day")
                val hour = start.optInt("hour", 12)
                val minute = start.optInt("minute", 0)
                val second = start.optInt("second", 0)
                val dateCertain = isCertain?.optBoolean("day", false) ?: false

                val tzOffsetMinutes = if (start.isNull("timezone")) null else start.getInt("timezone")
                val tz = tzOffsetMinutes?.let { offsetToTimezone(it) }

                val dt = LocalDateTime(year, month, day, hour, minute, second)

                parsed.add(ParsedChronoResult(
                    extracted = ExtractedTime(
                        instant = if (tz != null) dt.toInstant(tz) else null,
                        localDateTime = dt,
                        sourceTimezone = tz,
                        originalText = text,
                        confidence = if (dateCertain) 0.95f else 0.85f,
                    ),
                    dateCertain = dateCertain,
                ))

                if (!obj.isNull("end")) {
                    val end = obj.getJSONObject("end")
                    val endDt = LocalDateTime(
                        end.getInt("year"), end.getInt("month"), end.getInt("day"),
                        end.optInt("hour", 12), end.optInt("minute", 0), end.optInt("second", 0),
                    )
                    val endTz = if (end.isNull("timezone")) tz else offsetToTimezone(end.getInt("timezone"))

                    parsed.add(ParsedChronoResult(
                        extracted = ExtractedTime(
                            instant = if (endTz != null) endDt.toInstant(endTz) else null,
                            localDateTime = endDt,
                            sourceTimezone = endTz,
                            originalText = "$text (end)",
                            confidence = 0.85f,
                        ),
                        dateCertain = false,
                    ))
                }
            } catch (e: Exception) {
                Log.w(TAG, "Failed to parse chrono result at index $i", e)
            }
        }

        val refDate = parsed.firstOrNull { it.dateCertain }?.extracted?.localDateTime?.date
        val results = if (refDate != null) {
            parsed.map { p ->
                if (!p.dateCertain && p.extracted.localDateTime != null) {
                    val fixed = LocalDateTime(refDate, p.extracted.localDateTime.time)
                    val tz = p.extracted.sourceTimezone
                    p.extracted.copy(
                        localDateTime = fixed,
                        instant = if (tz != null) fixed.toInstant(tz) else null,
                    )
                } else {
                    p.extracted
                }
            }
        } else {
            parsed.map { it.extracted }
        }

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
