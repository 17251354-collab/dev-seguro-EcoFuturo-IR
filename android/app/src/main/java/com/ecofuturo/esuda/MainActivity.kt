package com.ecofuturo.esuda

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.ecofuturo.esuda.data.AtividadesData
import com.ecofuturo.esuda.data.UsuarioLogado
import com.ecofuturo.esuda.screens.*
import com.ecofuturo.esuda.ui.theme.EcoFuturoEsudaTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        UsuarioLogado.init(this)
        AtividadesData.init(this) // <-- ESSA LINHA QUE FALTAVA! Faz as atividades não sumirem
        setContent {
            EcoFuturoEsudaTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation()
                }
            }
        }
    }
}

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(
        navController = navController,
        startDestination = "landing"
    ) {
        composable("landing") { LandingScreen(navController = navController) }
        composable("login") { LoginScreen(navController = navController) }
        composable("cadastro") { CadastroScreen(navController = navController) }
        composable("dashboard") { DashboardScreen(navController = navController) }
        composable("beneficios") { CatalogoScreen(navController = navController) }
        composable("resgates") { VoucherScreen(navController = navController) }
        composable("relatorios") { RelatorioScreen(navController = navController) }
        composable("perfil") { PerfilScreen(navController = navController) }
        composable("admin_usuarios") { AdminUsuariosScreen(navController = navController) }
        composable("admin_gerenciar") { AdminGerenciarScreen(navController = navController) }
    }
}