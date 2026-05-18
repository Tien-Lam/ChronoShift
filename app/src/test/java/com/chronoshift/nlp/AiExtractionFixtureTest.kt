package com.chronoshift.nlp

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test

class AiExtractionFixtureTest {

    @Test
    fun `AI extraction fixtures parse to exact structured results in order`() {
        aiExtractionFixtures.forEach { fixture ->
            val actual = LlmResultParser.parseResponse(fixture.modelResponseJson)

            assertEquals(
                "${fixture.name}: result count for '${fixture.input}'",
                fixture.expected.size,
                actual.size,
            )

            fixture.expected.zip(actual).forEachIndexed { index, (expected, result) ->
                assertEquals("${fixture.name}[$index] date", expected.date, result.localDateTime?.date.toString())
                assertEquals("${fixture.name}[$index] time", expected.time, result.localDateTime?.time.toString().take(5))
                assertEquals("${fixture.name}[$index] timezone", expected.timezone, result.sourceTimezone?.id)
                assertEquals("${fixture.name}[$index] original", expected.original, result.originalText)
                assertNotNull("${fixture.name}[$index] instant", result.instant)
            }
        }
    }
}
