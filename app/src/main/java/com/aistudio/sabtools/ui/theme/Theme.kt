package com.aistudio.sabtools.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val LightColorScheme = lightColorScheme(
    primary = TimberPrimary,
    onPrimary = TimberSurface,
    primaryContainer = TimberGoldLight,
    onPrimaryContainer = TimberPrimaryDark,
    secondary = TimberGold,
    onSecondary = TimberDeepCharcoal,
    secondaryContainer = TimberSurfaceVariant,
    onSecondaryContainer = TimberText,
    tertiary = TimberDark,
    onTertiary = TimberSurface,
    background = TimberBackground,
    onBackground = TimberText,
    surface = TimberSurface,
    onSurface = TimberText,
    surfaceVariant = TimberSurfaceVariant,
    onSurfaceVariant = TimberTextSecondary,
    outline = TimberOutline,
    outlineVariant = TimberOutline.copy(alpha = 0.5f),
    error = TimberError,
    onError = TimberSurface,
    errorContainer = TimberErrorContainer,
    onErrorContainer = TimberError
)

@Composable
fun SABTOOLSTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = LightColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window
            if (window != null) {
                window.statusBarColor = colorScheme.background.toArgb()
                WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = true
            }
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
