package com.chronoshift.ui.components

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.chronoshift.ui.theme.LocalChronoColors

@Composable
fun TimezoneChip(
    timezone: String,
    modifier: Modifier = Modifier,
) {
    val colors = LocalChronoColors.current
    Surface(
        modifier = modifier.animateContentSize(),
        shape = MaterialTheme.shapes.small,
        color = colors.timezoneChipBackground,
        contentColor = colors.timezoneChipContent,
        tonalElevation = 1.dp,
    ) {
        Text(
            text = timezone,
            style = MaterialTheme.typography.labelMedium,
            modifier = Modifier.padding(horizontal = 10.dp, vertical = 4.dp),
        )
    }
}
