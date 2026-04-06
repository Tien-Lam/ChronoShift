package com.chronoshift.ui.components

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.ContentCopy
import androidx.compose.material.icons.outlined.East
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.chronoshift.R
import com.chronoshift.conversion.ConvertedTime
import com.chronoshift.ui.theme.LocalChronoColors

@Composable
fun TimeResultCard(
    result: ConvertedTime,
    modifier: Modifier = Modifier,
) {
    val colors = LocalChronoColors.current
    val context = LocalContext.current

    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = colors.resultCardBackground,
            contentColor = colors.resultCardContent,
        ),
        shape = MaterialTheme.shapes.large,
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Original text
            Text(
                text = "\"${result.originalText}\"",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(modifier = Modifier.height(12.dp))
            HorizontalDivider(color = colors.divider)
            Spacer(modifier = Modifier.height(12.dp))

            // Source → Local conversion
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                // Source time
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = stringResource(R.string.source_timezone),
                        style = MaterialTheme.typography.labelMedium,
                        color = colors.sourceTimeColor,
                    )
                    Text(
                        text = result.sourceDateTime,
                        style = MaterialTheme.typography.titleLarge,
                        color = colors.sourceTimeColor,
                    )
                    TimezoneChip(result.sourceTimezone)
                }

                Icon(
                    imageVector = Icons.Outlined.East,
                    contentDescription = null,
                    modifier = Modifier.size(24.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant,
                )

                // Local time
                Column(
                    modifier = Modifier.weight(1f),
                    horizontalAlignment = Alignment.End,
                ) {
                    Text(
                        text = stringResource(R.string.local_timezone),
                        style = MaterialTheme.typography.labelMedium,
                        color = colors.localTimeColor,
                    )
                    Text(
                        text = result.localDateTime,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = colors.localTimeColor,
                    )
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        TimezoneChip(result.localTimezone)
                        Spacer(modifier = Modifier.width(4.dp))
                        IconButton(
                            onClick = {
                                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                                clipboard.setPrimaryClip(
                                    ClipData.newPlainText("Converted time", "${result.localDateTime} ${result.localTimezone}")
                                )
                                Toast.makeText(context, R.string.copied, Toast.LENGTH_SHORT).show()
                            },
                            modifier = Modifier.size(32.dp),
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.ContentCopy,
                                contentDescription = stringResource(R.string.copied),
                                modifier = Modifier.size(16.dp),
                            )
                        }
                    }
                }
            }

            // Date row
            if (result.localDate.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = result.localDate,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}
