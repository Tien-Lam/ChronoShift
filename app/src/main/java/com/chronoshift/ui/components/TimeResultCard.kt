package com.chronoshift.ui.components

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.widget.Toast
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.SizeTransform
import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.chronoshift.R
import com.chronoshift.conversion.ConvertedTime
import com.chronoshift.ui.theme.ChronoShiftTheme
import com.chronoshift.ui.theme.LocalChronoColors
import androidx.compose.ui.tooling.preview.Preview
import kotlinx.coroutines.delay

@Composable
fun TimeResultCard(
    result: ConvertedTime,
    modifier: Modifier = Modifier,
    animationIndex: Int = 0,
) {
    val colors = LocalChronoColors.current
    val context = LocalContext.current
    val density = LocalDensity.current

    val progress = remember { Animatable(0f) }
    LaunchedEffect(result) {
        delay(animationIndex.toLong() * 60L)
        progress.animateTo(
            targetValue = 1f,
            animationSpec = spring(
                dampingRatio = Spring.DampingRatioMediumBouncy,
                stiffness = Spring.StiffnessMediumLow,
            ),
        )
    }

    Card(
        modifier = modifier
            .fillMaxWidth()
            .graphicsLayer {
                alpha = progress.value
                translationY = (1f - progress.value) * with(density) { 40.dp.toPx() }
            },
        colors = CardDefaults.cardColors(
            containerColor = colors.resultCardBackground,
            contentColor = colors.resultCardContent,
        ),
        shape = MaterialTheme.shapes.extraLarge,
    ) {
        Column(modifier = Modifier.padding(20.dp)) {
            Text(
                text = "\u201c${result.originalText}\u201d",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            Spacer(modifier = Modifier.height(12.dp))
            HorizontalDivider(color = colors.divider)
            Spacer(modifier = Modifier.height(16.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
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
                    Spacer(Modifier.height(4.dp))
                    TimezoneChip(result.sourceTimezone)
                }

                Icon(
                    imageVector = Icons.Outlined.East,
                    contentDescription = null,
                    modifier = Modifier
                        .padding(horizontal = 8.dp)
                        .size(24.dp),
                    tint = MaterialTheme.colorScheme.primary,
                )

                Column(
                    modifier = Modifier.weight(1f),
                    horizontalAlignment = Alignment.End,
                ) {
                    Text(
                        text = stringResource(R.string.local_timezone),
                        style = MaterialTheme.typography.labelMedium,
                        color = colors.localTimeColor,
                    )
                    AnimatedTimeText(
                        text = result.localDateTime,
                        style = MaterialTheme.typography.headlineMedium.copy(
                            fontWeight = FontWeight.Bold,
                        ),
                        color = colors.localTimeColor,
                    )
                    Spacer(Modifier.height(4.dp))
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

@Preview(showBackground = true)
@Composable
private fun PreviewTimeResultCard() {
    ChronoShiftTheme(dynamicColor = false) {
        TimeResultCard(
            result = ConvertedTime(
                originalText = "9:00 a.m. PT",
                sourceTimezone = "PT (America/Los_Angeles)",
                sourceDateTime = "9:00 AM",
                localDateTime = "6:00 PM",
                localTimezone = "CET (Europe/Paris)",
                localDate = "Apr 9, 2026",
            ),
            modifier = Modifier.padding(16.dp),
        )
    }
}

@Preview(showBackground = true, uiMode = android.content.res.Configuration.UI_MODE_NIGHT_YES)
@Composable
private fun PreviewTimeResultCardDark() {
    ChronoShiftTheme(dynamicColor = false) {
        TimeResultCard(
            result = ConvertedTime(
                originalText = "3:00 PM EST",
                sourceTimezone = "EST (America/New_York)",
                sourceDateTime = "3:00 PM",
                localDateTime = "9:00 PM",
                localTimezone = "CET (Europe/Paris)",
                localDate = "Apr 6, 2026",
            ),
            modifier = Modifier.padding(16.dp),
        )
    }
}

@Composable
private fun AnimatedTimeText(
    text: String,
    style: TextStyle,
    color: Color,
) {
    Row {
        text.forEachIndexed { index, char ->
            AnimatedContent(
                targetState = char,
                transitionSpec = {
                    (slideInVertically { -it } + fadeIn())
                        .togetherWith(slideOutVertically { it } + fadeOut())
                        .using(SizeTransform(clip = true))
                },
                label = "char_$index",
            ) { targetChar ->
                Text(
                    text = targetChar.toString(),
                    style = style,
                    color = color,
                )
            }
        }
    }
}
