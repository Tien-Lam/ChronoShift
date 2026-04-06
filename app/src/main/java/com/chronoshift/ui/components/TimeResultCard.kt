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
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
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
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.chronoshift.R
import com.chronoshift.conversion.ConvertedTime
import com.chronoshift.ui.theme.ChronoShiftTheme
import kotlinx.coroutines.delay

@Composable
fun TimeResultCard(
    result: ConvertedTime,
    modifier: Modifier = Modifier,
    animationIndex: Int = 0,
) {
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

    Column(
        modifier = modifier
            .fillMaxWidth()
            .graphicsLayer {
                alpha = progress.value
                translationY = (1f - progress.value) * with(density) { 30.dp.toPx() }
            }
            .clickable {
                val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                clipboard.setPrimaryClip(
                    ClipData.newPlainText("Converted time", "${result.localDateTime} ${result.localTimezone}")
                )
                Toast.makeText(context, R.string.copied, Toast.LENGTH_SHORT).show()
            }
            .padding(vertical = 16.dp),
    ) {
        // Original text — quiet
        Text(
            text = result.originalText,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )

        Spacer(Modifier.height(8.dp))

        // The converted time — hero
        AnimatedTimeText(
            text = result.localDateTime,
            style = MaterialTheme.typography.displayMedium.copy(
                fontWeight = FontWeight.Bold,
            ),
            color = MaterialTheme.colorScheme.onSurface,
        )

        Spacer(Modifier.height(4.dp))

        // Timezone + date — secondary info
        Row(
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                text = result.localTimezone,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.primary,
            )

            if (result.localDate.isNotEmpty()) {
                Text(
                    text = "  ·  ",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.outlineVariant,
                )
                Text(
                    text = result.localDate,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }

        Spacer(Modifier.height(4.dp))

        // Source — tertiary
        Text(
            text = "${result.sourceDateTime} ${result.sourceTimezone}",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.outline,
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

@Preview
@Composable
private fun PreviewTimeResultCard() {
    ChronoShiftTheme(dynamicColor = false) {
        Surface {
            TimeResultCard(
                result = ConvertedTime("9:00 a.m. PT", "PT (America/Los_Angeles)", "9:00 AM", "6:00 PM", "CET (Europe/Paris)", "Apr 9, 2026"),
                modifier = Modifier.padding(horizontal = 16.dp),
            )
        }
    }
}

@Preview
@Composable
private fun PreviewTwoCards() {
    ChronoShiftTheme(dynamicColor = false) {
        Surface {
            Column(Modifier.padding(horizontal = 16.dp)) {
                TimeResultCard(
                    result = ConvertedTime("9:00 a.m. PT", "PT (America/Los_Angeles)", "9:00 AM", "6:00 PM", "CET (Europe/Paris)", "Apr 9, 2026"),
                )
                HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.3f))
                TimeResultCard(
                    result = ConvertedTime("12:00 p.m. ET", "ET (America/New_York)", "12:00 PM", "6:00 PM", "CET (Europe/Paris)", "Apr 9, 2026"),
                    animationIndex = 1,
                )
            }
        }
    }
}
