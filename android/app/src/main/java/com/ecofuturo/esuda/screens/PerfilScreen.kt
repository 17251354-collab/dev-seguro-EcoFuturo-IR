package com.ecofuturo.esuda.screens

import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.ecofuturo.esuda.components.BottomBar
import com.ecofuturo.esuda.components.MenuDrawer
import com.ecofuturo.esuda.data.UsuarioLogado
import com.ecofuturo.esuda.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PerfilScreen(navController: NavController) {
    val usuario = UsuarioLogado.getUsuario()
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    var senhaVisivel by remember { mutableStateOf(false) }
    var showDialogExcluir by remember { mutableStateOf(false) }

    val senhaUsuario = "••••••••"

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            MenuDrawer(
                navController = navController,
                tipoUsuario = usuario.tipo,
                rotaAtual = "perfil",
                onClose = { scope.launch { drawerState.close() } },
                onLogout = { navController.navigate("login") { popUpTo(0) { inclusive = true } } }
            )
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            "PERFIL",
                            color = VerdeNeon,
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(Icons.Filled.Menu, "Menu", tint = Branco)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Preto)
                )
            },
            bottomBar = {
                BottomBar(navController = navController, rotaAtual = "perfil")
            },
            containerColor = Preto
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .background(Brush.verticalGradient(listOf(Preto, Color(0xFF0A0F1F))))
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Spacer(Modifier.height(16.dp))

                Box(
                    modifier = Modifier
                        .size(100.dp)
                        .clip(RoundedCornerShape(50.dp))
                        .background(VerdeNeon.copy(alpha = 0.2f))
                        .border(2.dp, VerdeNeon, RoundedCornerShape(50.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        if (usuario.nome.isNotEmpty()) usuario.nome.first().toString().uppercase() else "?",
                        color = VerdeNeon,
                        fontSize = 40.sp,
                        fontWeight = FontWeight.Bold
                    )
                }

                Spacer(Modifier.height(16.dp))

                Text(
                    usuario.nome,
                    color = Branco,
                    fontSize = 24.sp,
                    fontWeight = FontWeight.Bold
                )

                Text(
                    usuario.tipo,
                    color = VerdeNeon,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )

                Spacer(Modifier.height(32.dp))

                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(RoundedCornerShape(16.dp))
                        .background(FundoCard.copy(alpha = 0.7f))
                        .border(1.dp, Cinza.copy(alpha = 0.3f), RoundedCornerShape(16.dp))
                        .padding(20.dp)
                ) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("📝", fontSize = 20.sp)
                            Spacer(Modifier.width(8.dp))
                            Text(
                                "Dados Cadastrais",
                                color = Branco,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        Spacer(Modifier.height(20.dp))

                        CampoPerfil(label = "Nome Completo", valor = usuario.nome)

                        Spacer(Modifier.height(16.dp))

                        CampoPerfil(label = "E-mail", valor = usuario.email)

                        Spacer(Modifier.height(16.dp))

                        // SENHA - sem ícone
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Text("Senha", color = Cinza, fontSize = 12.sp)
                                Spacer(Modifier.height(4.dp))
                                Text(
                                    if (senhaVisivel) senhaUsuario else "••••••••",
                                    color = Branco,
                                    fontSize = 16.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            }
                            TextButton(onClick = { senhaVisivel = !senhaVisivel }) {
                                Text(
                                    if (senhaVisivel) "🙈" else "👁️",
                                    fontSize = 20.sp
                                )
                            }
                        }

                        HorizontalDivider(
                            modifier = Modifier.padding(vertical = 12.dp),
                            color = Cinza.copy(alpha = 0.3f)
                        )

                        CampoPerfil(label = "Tipo de Usuário", valor = usuario.tipo)

                        Spacer(Modifier.height(16.dp))

                        CampoPerfil(
                            label = "Saldo de Moedas",
                            valor = "${usuario.moedas} moedas",
                            corValor = VerdeNeon
                        )
                    }
                }

                Spacer(Modifier.height(24.dp))

                OutlinedButton(
                    onClick = { showDialogExcluir = true },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = Color(0xFFFF5252)
                    ),
                    border = BorderStroke(1.dp, Color(0xFFFF5252)),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Excluir Conta", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }

                Spacer(Modifier.height(32.dp))
            }
        }
    }

    if (showDialogExcluir) {
        AlertDialog(
            onDismissRequest = { showDialogExcluir = false },
            title = { Text("Excluir Conta", color = Branco) },
            text = {
                Text(
                    "Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.",
                    color = Cinza
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        Toast.makeText(context, "Conta excluída com sucesso", Toast.LENGTH_SHORT).show()
                        navController.navigate("login") { popUpTo(0) { inclusive = true } }
                        showDialogExcluir = false
                    }
                ) {
                    Text("Excluir", color = Color(0xFFFF5252), fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { showDialogExcluir = false }) {
                    Text("Cancelar", color = Cinza)
                }
            },
            containerColor = FundoCard,
            shape = RoundedCornerShape(16.dp)
        )
    }
}

@Composable
fun CampoPerfil(label: String, valor: String, corValor: Color = Branco) {
    Column {
        Text(label, color = Cinza, fontSize = 12.sp)
        Spacer(Modifier.height(4.dp))
        Text(
            valor,
            color = corValor,
            fontSize = 16.sp,
            fontWeight = FontWeight.Medium
        )
        HorizontalDivider(
            modifier = Modifier.padding(top = 12.dp),
            color = Cinza.copy(alpha = 0.3f)
        )
    }
}