package com.ecofuturo.esuda.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.navigation.NavController
import com.ecofuturo.esuda.components.BottomBar
import com.ecofuturo.esuda.components.MenuDrawer
import com.ecofuturo.esuda.data.BeneficiosData
import com.ecofuturo.esuda.data.UsuarioLogado
import com.ecofuturo.esuda.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TrocarMoedasScreen(navController: NavController) {
    val context = LocalContext.current
    val usuario = UsuarioLogado.getUsuario()
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    var moedasUsuario by remember { mutableStateOf(usuario.moedas) }

    // CORRIGIDO: Recarrega moedas toda vez que voltar pra tela
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                moedasUsuario = UsuarioLogado.getUsuario().moedas
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    val tipoUsuario = usuario.tipo

    val idsComunidadeExterna = listOf(1, 2, 3, 9)

    val itensDisponiveis = BeneficiosData.beneficios.filter { beneficio ->
        val ativoEComEstoque = beneficio.ativo && beneficio.estoque > 0
        if (tipoUsuario == "Comunidade Externa") {
            ativoEComEstoque && beneficio.id in idsComunidadeExterna
        } else {
            ativoEComEstoque
        }
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            MenuDrawer(
                navController = navController,
                tipoUsuario = usuario.tipo,
                rotaAtual = "trocar_moedas",
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
                            "ECOFUTURO\nESUDA",
                            color = VerdeNeon,
                            fontWeight = FontWeight.Bold,
                            lineHeight = 18.sp,
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
            bottomBar = { BottomBar(navController = navController, rotaAtual = "trocar_moedas") },
            containerColor = Preto
        ) { padding ->
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .background(Brush.verticalGradient(listOf(Color(0xFF0A0F1F), Color(0xFF1A1F2F))))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF2A3A4A)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Row(
                            modifier = Modifier.padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("💰", fontSize = 32.sp)
                            Spacer(modifier = Modifier.width(12.dp))
                            Column {
                                Text("Suas EcoMoedas", color = Cinza, fontSize = 12.sp)
                                Text(
                                    "$moedasUsuario",
                                    color = Color(0xFFFFD700),
                                    fontSize = 24.sp,
                                    fontWeight = FontWeight.Bold
                                )
                                Text(tipoUsuario, color = VerdeNeon, fontSize = 10.sp)
                            }
                        }
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("🔄", fontSize = 24.sp)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "Trocar Moedas",
                            color = Branco,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    if (tipoUsuario == "Comunidade Externa") {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            "Você tem acesso a ${itensDisponiveis.size} benefícios",
                            color = Cinza,
                            fontSize = 12.sp
                        )
                    }

                    Spacer(modifier = Modifier.height(16.dp))

                    LazyVerticalGrid(
                        columns = GridCells.Fixed(2),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(itensDisponiveis) { item ->
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                colors = CardDefaults.cardColors(containerColor = Color(0xFF2A3A4A).copy(alpha = 0.7f)),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Column(
                                    modifier = Modifier.padding(12.dp),
                                    horizontalAlignment = Alignment.CenterHorizontally
                                ) {
                                    Text(item.nome, color = Branco, fontSize = 13.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center, maxLines = 2)
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(item.descricao, color = Cinza, fontSize = 10.sp, textAlign = TextAlign.Center, maxLines = 2)
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text("Válido: ${item.validadeDias} dias", color = VerdeNeon, fontSize = 9.sp)
                                    Text("Estoque: ${item.estoque}", color = Cinza, fontSize = 9.sp)
                                    Spacer(modifier = Modifier.height(8.dp))

                                    val podeTrocar = moedasUsuario >= item.custoMoedas
                                    Button(
                                        onClick = {
                                            if (moedasUsuario >= item.custoMoedas) {
                                                // CORRIGIDO: 1 salvamento só - moedas + doadas juntos!
                                                UsuarioLogado.registrarTroca(item.custoMoedas)
                                                moedasUsuario = moedasUsuario - item.custoMoedas
                                                Toast.makeText(context, "Trocado: ${item.nome}!", Toast.LENGTH_SHORT).show()
                                            } else {
                                                Toast.makeText(context, "Moedas insuficientes!", Toast.LENGTH_SHORT).show()
                                            }
                                        },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = if (podeTrocar) VerdeNeon else Color(0xFF4A4A4A)
                                        ),
                                        enabled = podeTrocar,
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(8.dp)
                                    ) {
                                        Text(
                                            "${item.custoMoedas} 💰",
                                            color = if (podeTrocar) Preto else Cinza,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}