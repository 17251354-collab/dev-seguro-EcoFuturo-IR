package com.ecofuturo.esuda.ui.theme

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

// Cores
val VerdeNeon = Color(0xFF00FF66)
val Preto = Color(0xFF000000)
val Branco = Color(0xFFFFFFFF)
val Cinza = Color(0xFF888888)
val FundoCard = Color(0xFF1E2A3A)

@Composable
fun EcoFuturoEsudaTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) {
        darkColorScheme(
            primary = VerdeNeon,
            secondary = VerdeNeon,
            tertiary = VerdeNeon,
            background = Preto,
            surface = FundoCard,
            onPrimary = Preto,
            onSecondary = Preto,
            onTertiary = Preto,
            onBackground = Branco,
            onSurface = Branco
        )
    } else {
        lightColorScheme(
            primary = VerdeNeon,
            secondary = VerdeNeon,
            tertiary = VerdeNeon,
            background = Color.White,
            surface = Color.White,
            onPrimary = Preto,
            onSecondary = Preto,
            onTertiary = Preto,
            onBackground = Preto,
            onSurface = Preto
        )
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography(),
        content = content
    )
}