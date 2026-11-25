package com.ecofuturo.esuda.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.ecofuturo.esuda.R
import com.ecofuturo.esuda.components.BottomBar
import com.ecofuturo.esuda.components.MenuDrawer
import com.ecofuturo.esuda.data.UsuarioLogado
import com.ecofuturo.esuda.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(navController: NavController) {
    val usuario = UsuarioLogado.getUsuario()
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            MenuDrawer(
                navController = navController,
                tipoUsuario = usuario.tipo,
                rotaAtual = "home",
                onClose = { scope.launch { drawerState.close() } },
                onLogout = { navController.navigate("login") { popUpTo(0) { inclusive = true } } }
            )
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            // LOGO - ÍCONE
                            Image(
                                painter = painterResource(id = R.drawable.logo_ecofuturo),
                                contentDescription = "Logo EcoFuturo",
                                modifier = Modifier
                                    .size(32.dp)
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            // NOME
                            Column {
                                Text(
                                    "ECOFUTURO",
                                    color = VerdeNeon,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    lineHeight = 16.sp
                                )
                                Text(
                                    "ESUDA",
                                    color = VerdeNeon,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp
                                )
                            }
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(Icons.Filled.Menu, "Menu", tint = Branco)
                        }
                    },
                    actions = {
                        IconButton(
                            onClick = { navController.navigate("perfil") },
                            modifier = Modifier
                                .padding(end = 8.dp)
                                .size(40.dp)
                                .clip(CircleShape)
                                .background(VerdeNeon.copy(alpha = 0.2f))
                                .border(1.dp, VerdeNeon, CircleShape)
                        ) {
                            Icon(Icons.Filled.Person, "Perfil", tint = VerdeNeon)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Preto)
                )
            },
            bottomBar = { BottomBar(navController = navController, rotaAtual = "home") },
            containerColor = Preto
        ) { padding ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .background(Preto)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    // CARD PRINCIPAL
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(24.dp))
                            .background(Preto.copy(alpha = 0.85f))
                            .border(1.dp, VerdeNeon.copy(alpha = 0.4f), RoundedCornerShape(24.dp))
                            .padding(32.dp)
                    ) {
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            // LOGO BOX COM LOGO COMPLETA
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth(0.8f)
                                    .clip(RoundedCornerShape(12.dp))
                                    .background(Color(0xFF2A3441))
                                    .padding(vertical = 12.dp, horizontal = 16.dp),
                                horizontalArrangement = Arrangement.Center,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Image(
                                    painter = painterResource(id = R.drawable.logo_semfundo),
                                    contentDescription = "Logo",
                                    modifier = Modifier.size(28.dp)
                                )
                                Spacer(modifier = Modifier.width(8.dp))
                                Column {
                                    Text(
                                        "ECOFUTURO",
                                        color = VerdeNeon,
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        "ESUDA",
                                        color = VerdeNeon,
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                }
                            }

                            Spacer(Modifier.height(24.dp))

                            Text(
                                "EcoFuturo\nESUDA",
                                color = Branco,
                                fontSize = 32.sp,
                                fontWeight = FontWeight.ExtraBold,
                                textAlign = TextAlign.Center,
                                lineHeight = 36.sp
                            )

                            Spacer(Modifier.height(12.dp))

                            Text(
                                "Transforme sustentabilidade\nem recompensas reais!",
                                color = Branco.copy(alpha = 0.8f),
                                fontSize = 14.sp,
                                textAlign = TextAlign.Center
                            )

                            Spacer(Modifier.height(28.dp))

                            // BOTÃO GANHE MOEDAS
                            Button(
                                onClick = { navController.navigate("dashboard") },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(50.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = VerdeNeon.copy(alpha = 0.2f)),
                                shape = RoundedCornerShape(24.dp)
                            ) {
                                Text("🌱  Ganhe Moedas", color = VerdeNeon, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                            }

                            Spacer(Modifier.height(12.dp))

                            // BOTÃO RESGATE BENEFÍCIOS
                            Button(
                                onClick = { navController.navigate("beneficios") },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(50.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = VerdeNeon.copy(alpha = 0.2f)),
                                shape = RoundedCornerShape(24.dp)
                            ) {
                                Text("🎁  Resgate Benefícios", color = VerdeNeon, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                            }

                            Spacer(Modifier.height(12.dp))

                            // BOTÃO SALVE O PLANETA
                            Button(
                                onClick = { /* TODO: Navegar pra tela de impacto */ },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(50.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = VerdeNeon.copy(alpha = 0.2f)),
                                shape = RoundedCornerShape(24.dp)
                            ) {
                                Text("🌍  Salve o Planeta", color = VerdeNeon, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                            }
                        }
                    }
                }
            }
        }
    }
}