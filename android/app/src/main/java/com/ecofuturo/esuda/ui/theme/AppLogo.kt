package com.ecofuturo.esuda.ui.theme

import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun AppLogo() {

    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {

        Text(
            text = "🌱",
            fontSize = 70.sp
        )

        Spacer(modifier = Modifier.height(10.dp))

        Text(
            text = "EcoFuturo ESUDA",
            color = Color(0xFF00FF66),
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold
        )

        Text(
            text = "Mobilidade Sustentável",
            color = Color.White,
            fontSize = 14.sp
        )
    }
}