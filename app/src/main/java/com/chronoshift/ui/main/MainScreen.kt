@file:OptIn(ExperimentalMaterial3ExpressiveApi::class)

package com.chronoshift.ui.main

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.SizeTransform
import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.scaleIn
import androidx.compose.animation.scaleOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.FilledIconButton
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LoadingIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.chronoshift.R
import com.chronoshift.conversion.ConvertedTime
import com.chronoshift.ui.components.TimeResultCard
import com.chronoshift.ui.theme.ChronoShiftTheme
import androidx.compose.ui.tooling.preview.Preview

@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun MainScreen(
    viewModel: MainViewModel,
    modifier: Modifier = Modifier,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val hasResults = state.results.isNotEmpty()

    Box(
        modifier = modifier
            .fillMaxSize()
            .systemBarsPadding()
            .imePadding(),
    ) {
        AnimatedContent(
            targetState = hasResults,
            transitionSpec = {
                val enter = fadeIn(spring(stiffness = Spring.StiffnessMediumLow)) +
                    slideInVertically(spring(stiffness = Spring.StiffnessLow)) { if (targetState) it / 5 else -it / 5 }
                val exit = fadeOut(spring(stiffness = Spring.StiffnessMedium)) +
                    slideOutVertically(spring(stiffness = Spring.StiffnessLow)) { if (targetState) -it / 5 else it / 5 }
                enter.togetherWith(exit).using(SizeTransform(clip = false))
            },
            label = "mainContent",
        ) { showingResults ->
            if (showingResults) {
                ResultsLayout(
                    inputText = state.inputText,
                    results = state.results,
                    isProcessing = state.isProcessing,
                    error = state.error,
                    onInputChanged = viewModel::onInputChanged,
                    onConvert = viewModel::convert,
                )
            } else {
                InputLayout(
                    inputText = state.inputText,
                    isProcessing = state.isProcessing,
                    error = state.error,
                    onInputChanged = viewModel::onInputChanged,
                    onConvert = viewModel::convert,
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
private fun InputLayout(
    inputText: String,
    isProcessing: Boolean,
    error: String?,
    onInputChanged: (String) -> Unit,
    onConvert: () -> Unit,
) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 32.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.Start,
        ) {
            TextField(
                value = inputText,
                onValueChange = onInputChanged,
                modifier = Modifier.fillMaxWidth(),
                placeholder = {
                    Text(
                        text = stringResource(R.string.input_hint),
                        style = MaterialTheme.typography.headlineSmall,
                    )
                },
                textStyle = MaterialTheme.typography.headlineSmall,
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = MaterialTheme.colorScheme.surface,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                    focusedIndicatorColor = MaterialTheme.colorScheme.surface,
                    unfocusedIndicatorColor = MaterialTheme.colorScheme.surface,
                ),
            )

            AnimatedVisibility(
                visible = error != null,
                enter = fadeIn() + slideInVertically { -it / 2 },
                exit = fadeOut(),
            ) {
                Text(
                    text = if (error == "no_timestamp") stringResource(R.string.no_timestamp_found) else error ?: "",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(top = 12.dp),
                )
            }

            AnimatedVisibility(
                visible = inputText.isNotBlank(),
                enter = fadeIn() + scaleIn(spring(dampingRatio = Spring.DampingRatioMediumBouncy)),
                exit = fadeOut() + scaleOut(),
            ) {
                if (isProcessing) {
                    LoadingIndicator(
                        modifier = Modifier
                            .padding(top = 24.dp)
                            .size(48.dp),
                        color = MaterialTheme.colorScheme.primary,
                    )
                } else {
                    FilledIconButton(
                        onClick = onConvert,
                        modifier = Modifier
                            .padding(top = 24.dp)
                            .size(56.dp),
                        shape = MaterialTheme.shapes.large,
                    ) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.Send,
                            contentDescription = stringResource(R.string.convert),
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3ExpressiveApi::class)
@Composable
private fun ResultsLayout(
    inputText: String,
    results: List<com.chronoshift.conversion.ConvertedTime>,
    isProcessing: Boolean,
    error: String?,
    onInputChanged: (String) -> Unit,
    onConvert: () -> Unit,
) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Compact top bar: input text + action
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(start = 20.dp, end = 8.dp, top = 8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            TextField(
                value = inputText,
                onValueChange = onInputChanged,
                modifier = Modifier.weight(1f),
                placeholder = { Text(stringResource(R.string.input_hint), maxLines = 1) },
                textStyle = MaterialTheme.typography.bodyLarge,
                singleLine = true,
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = MaterialTheme.colorScheme.surface,
                    unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                    focusedIndicatorColor = MaterialTheme.colorScheme.surface,
                    unfocusedIndicatorColor = MaterialTheme.colorScheme.surface,
                ),
            )
            if (isProcessing) {
                LoadingIndicator(
                    modifier = Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.primary,
                )
            } else {
                IconButton(onClick = onConvert) {
                    Icon(Icons.AutoMirrored.Filled.Send, contentDescription = stringResource(R.string.convert))
                }
            }
        }

        AnimatedVisibility(
            visible = error != null,
            enter = fadeIn() + slideInVertically { -it / 2 },
            exit = fadeOut(),
        ) {
            Text(
                text = if (error == "no_timestamp") stringResource(R.string.no_timestamp_found) else error ?: "",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(start = 20.dp, top = 4.dp),
            )
        }

        HorizontalDivider(
            modifier = Modifier.padding(top = 4.dp),
            color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f),
        )

        // Results — flat list separated by thin dividers
        LazyColumn(
            contentPadding = PaddingValues(start = 20.dp, end = 20.dp, bottom = 16.dp),
        ) {
            itemsIndexed(results, key = { _, it -> it.originalText + it.sourceTimezone }) { index, result ->
                TimeResultCard(
                    result = result,
                    animationIndex = index,
                    modifier = Modifier.animateItem(),
                )
                if (index < results.lastIndex) {
                    HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))
                }
            }
        }
    }
}

// --- Previews ---

@Preview(showSystemUi = true)
@Composable
private fun PreviewInputEmpty() {
    ChronoShiftTheme(dynamicColor = false) {
        Surface(Modifier.fillMaxSize()) {
            InputLayout("", false, null, {}, {})
        }
    }
}

@Preview(showSystemUi = true)
@Composable
private fun PreviewInputWithText() {
    ChronoShiftTheme(dynamicColor = false) {
        Surface(Modifier.fillMaxSize()) {
            InputLayout("April 9 at 9:00 a.m. PT / 12:00 p.m. ET", false, null, {}, {})
        }
    }
}

@Preview(showSystemUi = true)
@Composable
private fun PreviewInputError() {
    ChronoShiftTheme(dynamicColor = false) {
        Surface(Modifier.fillMaxSize()) {
            InputLayout("hello world", false, "no_timestamp", {}, {})
        }
    }
}

@Preview(showSystemUi = true)
@Composable
private fun PreviewResults() {
    ChronoShiftTheme(dynamicColor = false) {
        Surface(Modifier.fillMaxSize()) {
            ResultsLayout(
                inputText = "April 9 at 9:00 a.m. PT / 12:00 p.m. ET",
                results = listOf(
                    ConvertedTime("9:00 a.m. PT", "PT (America/Los_Angeles)", "9:00 AM", "6:00 PM", "CET (Europe/Paris)", "Apr 9, 2026"),
                    ConvertedTime("12:00 p.m. ET", "ET (America/New_York)", "12:00 PM", "6:00 PM", "CET (Europe/Paris)", "Apr 9, 2026"),
                ),
                isProcessing = false, error = null, onInputChanged = {}, onConvert = {},
            )
        }
    }
}

@Preview(showSystemUi = true, uiMode = android.content.res.Configuration.UI_MODE_NIGHT_YES)
@Composable
private fun PreviewInputDark() {
    ChronoShiftTheme(dynamicColor = false) {
        Surface(Modifier.fillMaxSize()) {
            InputLayout("", false, null, {}, {})
        }
    }
}

@Preview(showSystemUi = true, uiMode = android.content.res.Configuration.UI_MODE_NIGHT_YES)
@Composable
private fun PreviewResultsDark() {
    ChronoShiftTheme(dynamicColor = false) {
        Surface(Modifier.fillMaxSize()) {
            ResultsLayout(
                inputText = "3:00 PM EST",
                results = listOf(
                    ConvertedTime("3:00 PM EST", "EST (America/New_York)", "3:00 PM", "9:00 PM", "CET (Europe/Paris)", "Apr 6, 2026"),
                ),
                isProcessing = false, error = null, onInputChanged = {}, onConvert = {},
            )
        }
    }
}
