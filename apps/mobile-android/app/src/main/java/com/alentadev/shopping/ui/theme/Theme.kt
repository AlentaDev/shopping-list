package com.alentadev.shopping.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = ShoppingGreenDarkTheme,
    onPrimary = ShoppingGreenContainerDark,
    primaryContainer = ShoppingGreenContainerDark,
    onPrimaryContainer = ShoppingGreenLight
)

private val LightColorScheme = lightColorScheme(
    primary = ShoppingGreen,
    onPrimary = androidx.compose.ui.graphics.Color.White,
    primaryContainer = ShoppingGreenLight,
    onPrimaryContainer = ShoppingGreenDark
)

@Composable
fun ShoppingTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = false,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
