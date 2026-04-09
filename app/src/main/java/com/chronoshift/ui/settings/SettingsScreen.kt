@file:OptIn(ExperimentalMaterial3Api::class)

package com.chronoshift.ui.settings

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilledTonalButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.chronoshift.R
import com.chronoshift.nlp.DownloadState

@Composable
fun SettingsScreen(
    viewModel: SettingsViewModel,
    onBack: () -> Unit,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(stringResource(R.string.settings)) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = stringResource(R.string.settings),
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                ),
            )
        },
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 24.dp),
        ) {
            // --- On-Device Model section ---
            SectionHeader(stringResource(R.string.on_device_model))

            Spacer(Modifier.height(12.dp))

            Text(
                text = stringResource(R.string.gemma_model_name),
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface,
            )

            Spacer(Modifier.height(4.dp))

            ModelStatusRow(state)

            Spacer(Modifier.height(12.dp))

            ModelActionButton(
                downloadState = state.downloadState,
                modelInstalled = state.modelInstalled,
                onDownload = viewModel::downloadModel,
                onCancel = viewModel::cancelDownload,
                onDelete = viewModel::deleteModel,
            )

            Spacer(Modifier.height(32.dp))

            // --- Pipeline Status section ---
            SectionHeader(stringResource(R.string.pipeline_status))

            Spacer(Modifier.height(12.dp))

            PipelineRow(
                name = "Chrono.js",
                status = stringResource(R.string.always_available),
                available = true,
            )
            PipelineRow(
                name = "LiteRT-LM",
                status = if (state.modelInstalled) stringResource(R.string.installed) else stringResource(R.string.not_installed),
                available = state.modelInstalled,
            )
            PipelineRow(
                name = "Gemini Nano",
                status = if (state.geminiNanoAvailable) stringResource(R.string.available) else stringResource(R.string.unavailable),
                available = state.geminiNanoAvailable,
            )
            PipelineRow(
                name = "ML Kit",
                status = if (state.mlKitAvailable) stringResource(R.string.available) else stringResource(R.string.unavailable),
                available = state.mlKitAvailable,
            )

            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun SectionHeader(title: String) {
    Text(
        text = title,
        style = MaterialTheme.typography.labelLarge,
        color = MaterialTheme.colorScheme.primary,
        modifier = Modifier.padding(top = 8.dp),
    )
}

@Composable
private fun ModelStatusRow(state: SettingsUiState) {
    when (state.downloadState) {
        is DownloadState.Idle -> {
            if (state.modelInstalled) {
                Text(
                    text = "${stringResource(R.string.installed)} (${state.modelSizeMb})",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            } else {
                Text(
                    text = stringResource(R.string.not_installed),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        is DownloadState.Downloading -> {
            val downloading = state.downloadState as DownloadState.Downloading
            Column {
                Text(
                    text = "${stringResource(R.string.downloading)} ${(downloading.progress * 100).toInt()}%",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                Spacer(Modifier.height(8.dp))
                LinearProgressIndicator(
                    progress = { downloading.progress },
                    modifier = Modifier.fillMaxWidth(),
                    color = MaterialTheme.colorScheme.primary,
                    trackColor = MaterialTheme.colorScheme.surfaceVariant,
                )
            }
        }
        is DownloadState.Completed -> {
            Text(
                text = "${stringResource(R.string.installed)} (${state.modelSizeMb})",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
        is DownloadState.Failed -> {
            Text(
                text = stringResource(R.string.download_failed),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.error,
            )
        }
    }
}

@Composable
private fun ModelActionButton(
    downloadState: DownloadState,
    modelInstalled: Boolean,
    onDownload: () -> Unit,
    onCancel: () -> Unit,
    onDelete: () -> Unit,
) {
    when (downloadState) {
        is DownloadState.Downloading -> {
            OutlinedButton(onClick = onCancel) {
                Text(stringResource(R.string.cancel_download))
            }
        }
        is DownloadState.Failed -> {
            FilledTonalButton(onClick = onDownload) {
                Text(stringResource(R.string.download_model))
            }
        }
        else -> {
            if (modelInstalled) {
                OutlinedButton(onClick = onDelete) {
                    Text(stringResource(R.string.delete_model))
                }
            } else {
                FilledTonalButton(onClick = onDownload) {
                    Text(stringResource(R.string.download_model))
                }
            }
        }
    }
}

@Composable
private fun PipelineRow(
    name: String,
    status: String,
    available: Boolean,
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(
            text = name,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurface,
        )
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(
                text = status,
                style = MaterialTheme.typography.bodyMedium,
                color = if (available) {
                    MaterialTheme.colorScheme.onSurfaceVariant
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                },
            )
            Spacer(Modifier.width(4.dp))
            Icon(
                imageVector = if (available) Icons.Filled.CheckCircle else Icons.Filled.Close,
                contentDescription = null,
                modifier = Modifier.size(18.dp),
                tint = if (available) {
                    MaterialTheme.colorScheme.primary
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f)
                },
            )
        }
    }
}
