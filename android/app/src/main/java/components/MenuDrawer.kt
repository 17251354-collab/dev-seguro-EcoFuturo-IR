package com.ecofuturo.esuda.components

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.ecofuturo.esuda.R
import com.ecofuturo.esuda.ui.theme.*

// DATA CLASS CORRETA - 3 PARÂMETROS
data class MenuItem(
    val titulo: String,
    val rota: String,
    val icone: String
)

@Composable
fun MenuDrawer(
    navController: NavController,
    tipoUsuario: String,
    rotaAtual: String,
    onClose: () -> Unit,
    onLogout: () -> Unit
) {
    val isAdmin = tipoUsuario == "Admin"

    // Itens do menu - COM OS 3 PARÂMETROS (titulo, rota, icone)
    val itens = mutableListOf(
        MenuItem("Dashboard", "dashboard", "📊"),
        MenuItem("Catálogo", "beneficios", "🎁"),
        MenuItem("Meus Vouchers", "resgates", "🎫"),
        MenuItem("Relatórios", "relatorios", "📈"),
        MenuItem("Perfil", "perfil", "👤")
    )

    // ADMIN: adiciona duas telas extras
    if (isAdmin) {
        itens.add(MenuItem("Gerenciar Usuários", "admin_usuarios", "👥"))
        itens.add(MenuItem("Gerenciar Parceiros", "admin_gerenciar", "🤝"))
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .width(280.dp)
            .background(FundoCard)
    ) {
        // HEADER COM LOGO
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(VerdeNeon.copy(alpha = 0.2f))
                .padding(24.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Image(
                    painter = painterResource(id = R.drawable.logo_ecofuturo),
                    contentDescription = "Logo",
                    modifier = Modifier.size(40.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text("ECOFUTURO", color = VerdeNeon, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                    Text("ESUDA", color = VerdeNeon, fontSize = 14.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // LISTA DE ITENS DO MENU
        itens.forEach { item ->
            val selecionado = rotaAtual == item.rota
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable {
                        onClose()
                        navController.navigate(item.rota) {
                            popUpTo(navController.graph.startDestinationId) {
                                saveState = true
                            }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                    .background(
                        if (selecionado) VerdeNeon.copy(alpha = 0.15f)
                        else Color.Transparent
                    )
                    .padding(vertical = 14.dp, horizontal = 20.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = item.icone,
                    fontSize = 22.sp
                )
                Spacer(modifier = Modifier.width(16.dp))
                Text(
                    text = item.titulo,
                    color = if (selecionado) VerdeNeon else Branco,
                    fontSize = 16.sp,
                    fontWeight = if (selecionado) FontWeight.Bold else FontWeight.Normal
                )
            }
        }

        Spacer(modifier = Modifier.weight(1f))

        // DIVISOR
        Divider(
            color = Cinza.copy(alpha = 0.3f),
            modifier = Modifier.padding(horizontal = 16.dp)
        )

        // BOTÃO SAIR
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable {
                    onClose()
                    onLogout()
                }
                .padding(vertical = 14.dp, horizontal = 20.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("🚪", fontSize = 22.sp)
            Spacer(modifier = Modifier.width(16.dp))
            Text(
                "Sair",
                color = Color(0xFFFF5252),
                fontSize = 16.sp,
                fontWeight = FontWeight.Medium
            )
        }

        Spacer(modifier = Modifier.height(16.dp))
    }
}