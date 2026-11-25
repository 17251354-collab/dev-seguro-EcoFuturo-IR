package com.ecofuturo.esuda.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.ecofuturo.esuda.R
import com.ecofuturo.esuda.ui.theme.*

@Composable
fun LandingScreen(navController: NavController) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Brush.verticalGradient(listOf(Preto, Color(0xFF0A0F1F)))),
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            // Logo
            Image(
                painter = painterResource(id = R.drawable.logo_semfundo),
                contentDescription = "Logo EcoFuturo Esuda",
                modifier = Modifier
                    .height(100.dp)
                    .width(250.dp)
            )

            Spacer(modifier = Modifier.height(16.dp))

            Text(
                "EcoFuturo ESUDA",
                color = VerdeNeon,
                fontSize = 28.sp,
                fontWeight = FontWeight.ExtraBold,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                "Transforme sustentabilidade\nem recompensas reais!",
                color = Branco.copy(alpha = 0.8f),
                fontSize = 16.sp,
                textAlign = TextAlign.Center
            )

            Spacer(modifier = Modifier.height(48.dp))

            // Cards informativos
            CardInfo(emoji = "🌱", titulo = "Ganhe Moedas", descricao = "Registre atividades sustentáveis e acumule moedas")
            Spacer(modifier = Modifier.height(16.dp))
            CardInfo(emoji = "🎁", titulo = "Resgate Benefícios", descricao = "Troque suas moedas por benefícios exclusivos")
            Spacer(modifier = Modifier.height(16.dp))
            CardInfo(emoji = "🌍", titulo = "Salve o Planeta", descricao = "Cada ação sustentável ajuda o meio ambiente")

            Spacer(modifier = Modifier.height(32.dp))

            Button(
                onClick = { navController.navigate("login") },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                colors = ButtonDefaults.buttonColors(containerColor = VerdeNeon),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Entrar", color = Preto, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedButton(
                onClick = { navController.navigate("cadastro") },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, VerdeNeon),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text("Cadastrar", color = VerdeNeon, fontSize = 16.sp, fontWeight = FontWeight.Bold)
            }
        }
    }
}

@Composable
fun CardInfo(emoji: String, titulo: String, descricao: String) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = FundoCard.copy(alpha = 0.7f)),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(20.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(emoji, fontSize = 40.sp)
            Text(titulo, color = VerdeNeon, fontSize = 18.sp, fontWeight = FontWeight.Bold)
            Text(descricao, color = Cinza, fontSize = 12.sp, textAlign = TextAlign.Center)
        }
    }
}