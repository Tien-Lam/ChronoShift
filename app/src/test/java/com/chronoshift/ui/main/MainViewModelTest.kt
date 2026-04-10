package com.chronoshift.ui.main

import com.chronoshift.conversion.ConvertedTime
import com.chronoshift.conversion.ExtractedTime
import com.chronoshift.conversion.TimeConverter
import com.chronoshift.nlp.ExtractionResult
import com.chronoshift.nlp.StreamingTimeExtractor
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.advanceUntilIdle
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import kotlinx.datetime.Instant
import kotlinx.datetime.TimeZone
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class MainViewModelTest {

    private val testDispatcher = StandardTestDispatcher()
    private lateinit var fakeExtractor: FakeStreamingExtractor
    private lateinit var converter: TimeConverter
    private lateinit var viewModel: MainViewModel

    @Before
    fun setup() {
        Dispatchers.setMain(testDispatcher)
        fakeExtractor = FakeStreamingExtractor()
        converter = TimeConverter()
    }

    @After
    fun tearDown() {
        Dispatchers.resetMain()
    }

    private fun createViewModel(): MainViewModel {
        return MainViewModel(fakeExtractor, converter)
    }

    // ========== Initial state ==========

    @Test
    fun `initial state is empty`() {
        viewModel = createViewModel()
        val state = viewModel.uiState.value
        assertEquals("", state.inputText)
        assertTrue(state.results.isEmpty())
        assertFalse(state.isProcessing)
        assertNull(state.error)
    }

    // ========== onInputChanged ==========

    @Test
    fun `onInputChanged updates inputText`() {
        viewModel = createViewModel()
        viewModel.onInputChanged("hello world")
        assertEquals("hello world", viewModel.uiState.value.inputText)
    }

    @Test
    fun `onInputChanged does not trigger processing`() {
        viewModel = createViewModel()
        viewModel.onInputChanged("3pm EST")
        assertFalse(viewModel.uiState.value.isProcessing)
        assertTrue(viewModel.uiState.value.results.isEmpty())
    }

    // ========== convert ==========

    @Test
    fun `convert with empty input does nothing`() = runTest {
        viewModel = createViewModel()
        viewModel.onInputChanged("")
        viewModel.convert()
        advanceUntilIdle()
        assertFalse(viewModel.uiState.value.isProcessing)
        assertNull(viewModel.uiState.value.error)
    }

    @Test
    fun `convert with whitespace-only input does nothing`() = runTest {
        viewModel = createViewModel()
        viewModel.onInputChanged("   \t  ")
        viewModel.convert()
        advanceUntilIdle()
        assertFalse(viewModel.uiState.value.isProcessing)
    }

    @Test
    fun `convert with results updates state`() = runTest {
        val time = ExtractedTime(
            instant = Instant.parse("2026-04-09T14:00:00Z"),
            sourceTimezone = TimeZone.UTC,
            originalText = "test",
        )
        fakeExtractor.results = listOf(ExtractionResult(listOf(time), "Chrono"))

        viewModel = createViewModel()
        viewModel.onInputChanged("test")
        viewModel.convert()
        advanceUntilIdle()

        assertFalse(viewModel.uiState.value.isProcessing)
        assertTrue(viewModel.uiState.value.results.isNotEmpty())
        assertNull(viewModel.uiState.value.error)
    }

    @Test
    fun `convert with no results shows error`() = runTest {
        fakeExtractor.results = listOf(ExtractionResult(emptyList(), "Chrono"))

        viewModel = createViewModel()
        viewModel.onInputChanged("no timestamps here")
        viewModel.convert()
        advanceUntilIdle()

        assertFalse(viewModel.uiState.value.isProcessing)
        assertEquals("no_timestamp", viewModel.uiState.value.error)
    }

    @Test
    fun `convert with exception sets error`() = runTest {
        fakeExtractor.throwOnExtract = RuntimeException("engine failed")

        viewModel = createViewModel()
        viewModel.onInputChanged("crash me")
        viewModel.convert()
        advanceUntilIdle()

        assertFalse(viewModel.uiState.value.isProcessing)
        assertEquals("engine failed", viewModel.uiState.value.error)
    }

    // ========== processIncomingText ==========

    @Test
    fun `processIncomingText sets inputText and triggers extraction`() = runTest {
        val time = ExtractedTime(
            instant = Instant.parse("2026-04-09T14:00:00Z"),
            sourceTimezone = TimeZone.UTC,
            originalText = "incoming",
        )
        fakeExtractor.results = listOf(ExtractionResult(listOf(time), "Chrono"))

        viewModel = createViewModel()
        viewModel.processIncomingText("incoming text")
        advanceUntilIdle()

        assertEquals("incoming text", viewModel.uiState.value.inputText)
        assertTrue(viewModel.uiState.value.results.isNotEmpty())
    }

    // ========== Streaming updates ==========

    @Test
    fun `streaming extraction emits intermediate results`() = runTest {
        val time1 = ExtractedTime(
            instant = Instant.parse("2026-04-09T14:00:00Z"),
            sourceTimezone = TimeZone.UTC,
            originalText = "stage 1",
        )
        val time2 = ExtractedTime(
            instant = Instant.parse("2026-04-09T15:00:00Z"),
            sourceTimezone = TimeZone.UTC,
            originalText = "stage 2",
        )
        fakeExtractor.results = listOf(
            ExtractionResult(listOf(time1), "Chrono"),
            ExtractionResult(listOf(time1, time2), "Chrono + Gemini"),
        )

        viewModel = createViewModel()
        viewModel.onInputChanged("multi-stage")
        viewModel.convert()
        advanceUntilIdle()

        // Final state should have results from last emission
        assertFalse(viewModel.uiState.value.isProcessing)
        assertTrue(viewModel.uiState.value.results.isNotEmpty())
    }

    // ========== Job cancellation ==========

    @Test
    fun `second convert cancels first`() = runTest {
        val time = ExtractedTime(
            instant = Instant.parse("2026-04-09T14:00:00Z"),
            sourceTimezone = TimeZone.UTC,
            originalText = "second",
        )
        fakeExtractor.delayMs = 500
        fakeExtractor.results = listOf(ExtractionResult(listOf(time), "Chrono"))

        viewModel = createViewModel()
        viewModel.onInputChanged("first")
        viewModel.convert()

        // Immediately trigger second conversion
        viewModel.onInputChanged("second")
        viewModel.convert()
        advanceUntilIdle()

        // Should complete without error (second replaces first)
        assertFalse(viewModel.uiState.value.isProcessing)
    }

    // ========== Fake extractor ==========

    private class FakeStreamingExtractor : StreamingTimeExtractor {
        var results: List<ExtractionResult> = emptyList()
        var throwOnExtract: Throwable? = null
        var delayMs: Long = 0

        override fun extractStream(text: String): Flow<ExtractionResult> = flow {
            throwOnExtract?.let { throw it }
            if (delayMs > 0) delay(delayMs)
            for (result in results) {
                emit(result)
            }
        }
    }
}
