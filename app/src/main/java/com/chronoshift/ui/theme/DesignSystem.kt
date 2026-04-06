package com.chronoshift.ui.theme

import androidx.compose.material3.ColorScheme
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

@Immutable
data class ChronoColors(
    val resultCardBackground: Color,
    val resultCardContent: Color,
    val timezoneChipBackground: Color,
    val timezoneChipContent: Color,
    val sourceTimeColor: Color,
    val localTimeColor: Color,
    val divider: Color,
) {
    companion object {
        fun from(scheme: ColorScheme) = ChronoColors(
            resultCardBackground = scheme.secondaryContainer,
            resultCardContent = scheme.onSecondaryContainer,
            timezoneChipBackground = scheme.tertiaryContainer,
            timezoneChipContent = scheme.onTertiaryContainer,
            sourceTimeColor = scheme.onSurfaceVariant,
            localTimeColor = scheme.primary,
            divider = scheme.outlineVariant,
        )
    }
}

val LocalChronoColors = staticCompositionLocalOf {
    ChronoColors(
        resultCardBackground = Color.Unspecified,
        resultCardContent = Color.Unspecified,
        timezoneChipBackground = Color.Unspecified,
        timezoneChipContent = Color.Unspecified,
        sourceTimeColor = Color.Unspecified,
        localTimeColor = Color.Unspecified,
        divider = Color.Unspecified,
    )
}
