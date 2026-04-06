package com.chronoshift.ui.components

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
        modifier = modifier,
        shape = MaterialTheme.shapes.small,
        color = colors.timezoneChipBackground,
        contentColor = colors.timezoneChipContent,
    ) {
        Text(
            text = timezone,
            style = MaterialTheme.typography.labelMedium,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
        )
    }
}
