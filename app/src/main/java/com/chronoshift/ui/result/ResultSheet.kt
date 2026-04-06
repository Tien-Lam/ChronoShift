package com.chronoshift.ui.result

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExperimentalMaterial3ExpressiveApi
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.LoadingIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.chronoshift.R
import com.chronoshift.ui.components.TimeResultCard
import com.chronoshift.ui.main.MainViewModel

private enum class SheetContent { Loading, Error, Results }

@OptIn(ExperimentalMaterial3Api::class, ExperimentalMaterial3ExpressiveApi::class)
@Composable
fun ResultSheet(
    viewModel: MainViewModel,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)

    val contentState = when {
        state.isProcessing -> SheetContent.Loading
        state.error != null -> SheetContent.Error
        else -> SheetContent.Results
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        modifier = modifier,
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .padding(bottom = 32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
        ) {
            AnimatedContent(
                targetState = contentState,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                label = "sheetContent",
            ) { target ->
                when (target) {
                    SheetContent.Loading -> {
                        LoadingIndicator(
                            modifier = Modifier
                                .padding(24.dp)
                                .size(48.dp),
                            color = MaterialTheme.colorScheme.primary,
                        )
                    }

                    SheetContent.Error -> {
                        Text(
                            text = if (state.error == "no_timestamp") stringResource(R.string.no_timestamp_found) else state.error ?: "",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.error,
                        )
                    }

                    SheetContent.Results -> {
                        Column {
                            state.results.forEachIndexed { index, result ->
                                TimeResultCard(result = result, animationIndex = index)
                                if (index < state.results.lastIndex) {
                                    HorizontalDivider(
                                        color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f),
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
