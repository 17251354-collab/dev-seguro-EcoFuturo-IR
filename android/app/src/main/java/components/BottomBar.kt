package com.ecofuturo.esuda.components

import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.ecofuturo.esuda.data.UsuarioLogado
import com.ecofuturo.esuda.ui.theme.*

@Composable
fun BottomBar(navController: NavController, rotaAtual: String) {
    val isAdmin = UsuarioLogado.isAdmin()

    val itens = mutableListOf(
        BottomNavItem("Dashboard", "dashboard", "📊"),
        BottomNavItem("Catálogo", "beneficios", "🎁"),
        BottomNavItem("Vouchers", "resgates", "🎫"),
        BottomNavItem("Relatórios", "relatorios", "📈"),
        BottomNavItem("Perfil", "perfil", "👤")
    )

    // Admin tem duas telas extras
    if (isAdmin) {
        itens.add(BottomNavItem("👥 Usuários", "admin_usuarios", "👥"))
        itens.add(BottomNavItem("🤝 Parceiros", "admin_gerenciar", "🤝"))
    }

    NavigationBar(containerColor = Color(0xFF0D1117)) {
        itens.forEach { item ->
            val selecionado = rotaAtual == item.rota
            NavigationBarItem(
                selected = selecionado,
                onClick = {
                    navController.navigate(item.rota) {
                        popUpTo(navController.graph.startDestinationId) { saveState = true }
                        launchSingleTop = true
                        restoreState = true
                    }
                },
                icon = { Text(item.icone, fontSize = 20.sp) },
                label = { Text(item.titulo, fontSize = 10.sp) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = VerdeNeon,
                    unselectedIconColor = Cinza,
                    selectedTextColor = VerdeNeon,
                    unselectedTextColor = Cinza
                )
            )
        }
    }
}

data class BottomNavItem(
    val titulo: String,
    val rota: String,
    val icone: String
)