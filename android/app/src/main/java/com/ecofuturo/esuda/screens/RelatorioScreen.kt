package com.ecofuturo.esuda.screens

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
import com.ecofuturo.esuda.data.AtividadesData
import com.ecofuturo.esuda.data.UsuarioLogado
import com.ecofuturo.esuda.ui.theme.*
import kotlinx.coroutines.launch

data class DadosAtividade(
    val tipo: String,
    val emoji: String,
    val co2Reduzido: Double
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RelatorioScreen(navController: NavController) {
    // CORRIGIDO: recarrega TODA VEZ que voltar pra tela
    var usuario by remember { mutableStateOf(UsuarioLogado.getUsuario()) }
    val lifecycleOwner = LocalLifecycleOwner.current
    DisposableEffect(lifecycleOwner) {
        val observer = LifecycleEventObserver { _, event ->
            if (event == Lifecycle.Event.ON_RESUME) {
                usuario = UsuarioLogado.getUsuario()
            }
        }
        lifecycleOwner.lifecycle.addObserver(observer)
        onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
    }

    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    val atividades = AtividadesData.atividades
    val co2ReduzidoTotal = atividades.sumOf { it.co2Reduzido }
    val atividadesRegistradas = atividades.size
    val totalMoedasGanhas = atividades.sumOf { it.moedasGanhas }

    val moedasDoadas = usuario.moedasDoadas

    val dadosPorTipo = listOf(
        DadosAtividade("Bicicleta", "🚴", atividades.filter { it.tipo == "Bicicleta" }.sumOf { it.co2Reduzido }),
        DadosAtividade("Caminhada", "🚶", atividades.filter { it.tipo == "Caminhada" }.sumOf { it.co2Reduzido }),
        DadosAtividade("Transporte Público", "🚌", atividades.filter { it.tipo == "Transporte Público" }.sumOf { it.co2Reduzido }),
        DadosAtividade("Carro Elétrico", "⚡", atividades.filter { it.tipo == "Carro Elétrico" }.sumOf { it.co2Reduzido })
    )
    val maxCo2 = (dadosPorTipo.maxOfOrNull { it.co2Reduzido } ?: 0.0).coerceAtLeast(1.0)

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            MenuDrawer(navController = navController, tipoUsuario = usuario.tipo, rotaAtual = "relatorios", onClose = { scope.launch { drawerState.close() } }, onLogout = { navController.navigate("login") { popUpTo(0) { inclusive = true } } })
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("RELATÓRIOS", color = VerdeNeon, fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                    navigationIcon = { IconButton(onClick = { scope.launch { drawerState.open() } }) { Icon(Icons.Filled.Menu, "Menu", tint = Branco) } },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Preto)
                )
            },
            bottomBar = { BottomBar(navController = navController, rotaAtual = "relatorios") },
            containerColor = Preto
        ) { padding ->
            Column(modifier = Modifier.fillMaxSize().padding(padding).background(Brush.verticalGradient(listOf(Preto, Color(0xFF0A0F1F)))).verticalScroll(rememberScrollState()).padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Spacer(Modifier.height(16.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text("👥", fontSize = 28.sp)
                    Spacer(Modifier.width(8.dp))
                    Text("Impacto da\nComunidade (Total Geral)", color = Branco, fontSize = 24.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center, lineHeight = 28.sp)
                }
                Spacer(Modifier.height(32.dp))
                CardImpacto(emoji = "🌍", titulo = "CO₂ Reduzido", valor = String.format("%.2f", co2ReduzidoTotal), unidade = "kg de CO₂", corValor = VerdeNeon)
                Spacer(Modifier.height(16.dp))
                CardImpacto(emoji = "📊", titulo = "Atividades", valor = atividadesRegistradas.toString(), unidade = "registradas", corValor = Color(0xFF42A5F5))
                Spacer(Modifier.height(16.dp))
                CardImpacto(emoji = "💰", titulo = "Moedas Ganhas", valor = String.format("%.0f", totalMoedasGanhas.toDouble()), unidade = "moedas totais", corValor = Color(0xFFFFD700))
                Spacer(Modifier.height(16.dp))
                CardImpacto(emoji = "🤝", titulo = "Moedas Doadas", valor = String.format("%.2f", moedasDoadas).replace(".", ","), unidade = "moedas", corValor = Color(0xFFFFD700))
                Spacer(Modifier.height(24.dp))
                Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(FundoCard.copy(alpha = 0.7f)).border(1.dp, Cinza.copy(alpha = 0.3f), RoundedCornerShape(16.dp)).padding(20.dp)) {
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("📊", fontSize = 20.sp)
                            Spacer(Modifier.width(8.dp))
                            Text("CO₂ Reduzido por\nTipo de Atividade", color = Branco, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.height(20.dp))
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text("kg de CO₂", color = Cinza, fontSize = 10.sp)
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(modifier = Modifier.size(12.dp).background(VerdeNeon))
                                Spacer(Modifier.width(4.dp))
                                Text("CO₂ Reduzido (kg)", color = Cinza, fontSize = 10.sp)
                            }
                        }
                        Spacer(Modifier.height(8.dp))
                        Row {
                            Column(horizontalAlignment = Alignment.End, modifier = Modifier.padding(end = 8.dp)) {
                                Text(String.format("%.1f", maxCo2), color = Cinza, fontSize = 10.sp)
                                Spacer(Modifier.height(80.dp))
                                Text("0", color = Cinza, fontSize = 10.sp)
                            }
                            Row(modifier = Modifier.weight(1f), horizontalArrangement = Arrangement.SpaceEvenly, verticalAlignment = Alignment.Bottom) {
                                dadosPorTipo.forEach { dado ->
                                    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(60.dp)) {
                                        Box(modifier = Modifier.width(40.dp).height(100.dp), contentAlignment = Alignment.BottomCenter) {
                                            val altura = ((dado.co2Reduzido / maxCo2) * 100.0).toFloat().coerceAtLeast(2f)
                                            Box(modifier = Modifier.fillMaxWidth().height(altura.dp).clip(RoundedCornerShape(topStart = 4.dp, topEnd = 4.dp)).background(if (dado.co2Reduzido > 0) VerdeNeon else Cinza.copy(alpha = 0.3f)))
                                        }
                                        Spacer(Modifier.height(4.dp))
                                        Text(dado.emoji, fontSize = 14.sp)
                                        Text(dado.tipo, color = Branco, fontSize = 8.sp, textAlign = TextAlign.Center, maxLines = 2)
                                        Text(String.format("%.2f", dado.co2Reduzido), color = Cinza, fontSize = 8.sp)
                                    }
                                }
                            }
                        }
                    }
                }
                Spacer(Modifier.height(32.dp))
            }
        }
    }
}

@Composable
fun CardImpacto(emoji: String, titulo: String, valor: String, unidade: String, corValor: Color) {
    Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp)).background(FundoCard.copy(alpha = 0.7f)).border(1.dp, Cinza.copy(alpha = 0.3f), RoundedCornerShape(16.dp)).padding(24.dp), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(emoji, fontSize = 40.sp)
            Spacer(Modifier.height(12.dp))
            Text(titulo, color = Branco, fontSize = 16.sp, fontWeight = FontWeight.Medium)
            Spacer(Modifier.height(8.dp))
            Text(valor, color = corValor, fontSize = 36.sp, fontWeight = FontWeight.Bold)
            Text(unidade, color = Cinza, fontSize = 14.sp)
        }
    }
}