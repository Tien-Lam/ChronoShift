package com.chronoshift.nlp

import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import kotlinx.coroutines.runBlocking
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assume.assumeTrue
import org.junit.Test
import org.junit.runner.RunWith
import java.io.File

@RunWith(AndroidJUnit4::class)
class DeviceModelEvalTest {

    @Test
    fun installedLiteRtModelMatchesStructuredEvalCases() = runBlocking {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val repository = ModelRepository(
            modelDirectory = File(context.filesDir, "models"),
            manifestUrl = ModelRepository.MANIFEST_URL,
        )
        assumeTrue(
            "No installed LiteRT model. Download the model in Settings before running this device eval.",
            repository.isModelInstalled(),
        )

        val extractor = LiteRtExtractor(repository, RealLiteRtEngineFactory())
        assumeTrue("Installed LiteRT model is not available", extractor.isAvailable())

        DEVICE_EVAL_CASES.forEach { evalCase ->
            val result = extractor.extract(evalCase.input)
            assertEquals("${evalCase.name}: method", "LiteRT", result.method)
            assertEquals("${evalCase.name}: count", evalCase.expected.size, result.times.size)

            evalCase.expected.zip(result.times).forEachIndexed { index, (expected, actual) ->
                assertNotNull("${evalCase.name}[$index]: localDateTime", actual.localDateTime)
                assertEquals("${evalCase.name}[$index]: time", expected.time, actual.localDateTime?.time.toString().take(5))
                assertEquals("${evalCase.name}[$index]: timezone", expected.timezone, actual.sourceTimezone?.id)
                assertNotNull("${evalCase.name}[$index]: instant", actual.instant)
            }
        }
    }

    private data class DeviceEvalCase(
        val name: String,
        val input: String,
        val expected: List<ExpectedDeviceEval>,
    )

    private data class ExpectedDeviceEval(
        val time: String,
        val timezone: String,
    )

    companion object {
        private val DEVICE_EVAL_CASES = listOf(
            DeviceEvalCase(
                name = "city timezone",
                input = "Let's meet at 5pm in Tokyo",
                expected = listOf(ExpectedDeviceEval("17:00", "Asia/Tokyo")),
            ),
            DeviceEvalCase(
                name = "utc range",
                input = "Deploy window: 2:00 AM - 4:00 AM UTC",
                expected = listOf(
                    ExpectedDeviceEval("02:00", "UTC"),
                    ExpectedDeviceEval("04:00", "UTC"),
                ),
            ),
            DeviceEvalCase(
                name = "explicit winter flight zones",
                input = "On January 9, 2026, flight UA123 departs SFO at 7:00 AM PST and arrives JFK at 3:30 PM EST",
                expected = listOf(
                    ExpectedDeviceEval("07:00", "America/Los_Angeles"),
                    ExpectedDeviceEval("15:30", "America/New_York"),
                ),
            ),
        )
    }
}
