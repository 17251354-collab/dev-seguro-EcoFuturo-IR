package com.ecofuturo.esuda.screens

import android.widget.Toast
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.ecofuturo.esuda.R
import com.ecofuturo.esuda.components.BottomBar
import com.ecofuturo.esuda.components.MenuDrawer
import com.ecofuturo.esuda.data.AtividadeRegistrada
import com.ecofuturo.esuda.data.AtividadesData
import com.ecofuturo.esuda.data.UsuarioLogado
import com.ecofuturo.esuda.ui.theme.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

data class TipoTransporte(
    val nome: String,
    val emoji: String,
    val moedasPorKm: Double,
    val co2PorKm: Double
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(navController: NavController) {
    val context = LocalContext.current
    // CORRIGIDO: recarrega o saldo quando voltar pra tela
    var usuario by remember { mutableStateOf(UsuarioLogado.getUsuario()) }
    LaunchedEffect(Unit) {
        usuario = UsuarioLogado.getUsuario()
    }
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    var transporteSelecionado by remember { mutableStateOf<TipoTransporte?>(null) }
    var distancia by remember { mutableStateOf("") }
    var dataSelecionada by remember { mutableStateOf(SimpleDateFormat("dd/MM/yyyy", Locale.getDefault()).format(Date())) }
    var expanded by remember { mutableStateOf(false) }
    var saldoUsuario by remember { mutableStateOf(usuario.moedas.toDouble()) }

    // Atualiza o saldo se o usuário mudar
    LaunchedEffect(usuario) {
        saldoUsuario = usuario.moedas.toDouble()
    }

    val opcoesTransporte = listOf(
        TipoTransporte("Bicicleta", "🚴", 0.5, 0.15),
        TipoTransporte("Caminhada", "🚶", 0.4, 0.12),
        TipoTransporte("Transporte Público", "🚌", 0.3, 0.08),
        TipoTransporte("Carro Elétrico", "⚡", 0.2, 0.05)
    )

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            MenuDrawer(
                navController = navController,
                tipoUsuario = usuario.tipo,
                rotaAtual = "dashboard",
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
                            Image(
                                painter = painterResource(id = R.drawable.logo_semfundo),
                                contentDescription = "Logo EcoFuturo",
                                modifier = Modifier.size(28.dp)
                            )
                            Spacer(Modifier.width(8.dp))
                            Column {
                                Text("ECOFUTURO", color = VerdeNeon, fontWeight = FontWeight.Bold, fontSize = 13.sp, lineHeight = 15.sp)
                                Text("ESUDA", color = VerdeNeon, fontWeight = FontWeight.Bold, fontSize = 11.sp)
                            }
                        }
                    },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(Icons.Filled.Menu, "Menu", tint = Branco)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Preto)
                )
            },
            bottomBar = { BottomBar(navController = navController, rotaAtual = "dashboard") },
            containerColor = Preto
        ) { padding ->
            Column(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
                Box(
                    modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(20.dp)).background(FundoCard.copy(alpha = 0.7f)).border(1.dp, VerdeNeon.copy(alpha = 0.3f), RoundedCornerShape(20.dp)).padding(20.dp)
                ) {
                    Column {
                        Text("Bem-vindo(a),", color = Branco, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                        Text("${usuario.nome}!", color = VerdeNeon, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                        Spacer(Modifier.height(16.dp))
                        Box(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(VerdeNeon.copy(alpha = 0.15f)).padding(12.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("💰", fontSize = 20.sp)
                                Spacer(Modifier.width(8.dp))
                                Column {
                                    Text("Seu saldo atual:", color = Branco, fontSize = 14.sp)
                                    Text("${String.format("%.2f", saldoUsuario)} moedas", color = VerdeNeon, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                        Spacer(Modifier.height(24.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("🌱", fontSize = 20.sp)
                            Spacer(Modifier.width(8.dp))
                            Text("Registrar Atividade\nSustentável", color = Branco, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.height(16.dp))
                        ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
                            OutlinedTextField(
                                value = transporteSelecionado?.let { "${it.emoji} ${it.nome} (${it.moedasPorKm} moedas/km)" } ?: "",
                                onValueChange = {}, readOnly = true,
                                placeholder = { Text("Selecione o transporte...", color = Cinza) },
                                modifier = Modifier.fillMaxWidth().menuAnchor(),
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                                colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = VerdeNeon, unfocusedBorderColor = Cinza, focusedTextColor = Branco, unfocusedTextColor = Branco)
                            )
                            ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }, modifier = Modifier.background(FundoCard)) {
                                opcoesTransporte.forEach { opcao ->
                                    DropdownMenuItem(
                                        text = { Text("${opcao.emoji} ${opcao.nome} (${opcao.moedasPorKm} moedas/km)", color = Branco) },
                                        onClick = { transporteSelecionado = opcao; expanded = false }
                                    )
                                }
                            }
                        }
                        Spacer(Modifier.height(12.dp))
                        OutlinedTextField(value = distancia, onValueChange = { distancia = it }, placeholder = { Text("Distância (km)", color = Cinza) }, modifier = Modifier.fillMaxWidth(), colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = VerdeNeon, unfocusedBorderColor = Cinza, focusedTextColor = Branco, unfocusedTextColor = Branco))
                        Spacer(Modifier.height(12.dp))
                        OutlinedTextField(value = dataSelecionada, onValueChange = { dataSelecionada = it }, placeholder = { Text("Data", color = Cinza) }, modifier = Modifier.fillMaxWidth(), colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = VerdeNeon, unfocusedBorderColor = Cinza, focusedTextColor = Branco, unfocusedTextColor = Branco))
                        Spacer(Modifier.height(20.dp))
                        Button(
                            onClick = {
                                val km = distancia.toDoubleOrNull() ?: 0.0
                                if (transporteSelecionado != null && km > 0) {
                                    val moedasGanhas = transporteSelecionado!!.moedasPorKm * km
                                    val co2 = transporteSelecionado!!.co2PorKm * km
                                    saldoUsuario += moedasGanhas
                                    UsuarioLogado.atualizarMoedas(saldoUsuario.toInt())
                                    AtividadesData.adicionar(
                                        AtividadeRegistrada(
                                            tipo = transporteSelecionado!!.nome,
                                            emoji = transporteSelecionado!!.emoji,
                                            distanciaKm = km,
                                            moedasGanhas = moedasGanhas,
                                            co2Reduzido = co2,
                                            data = dataSelecionada
                                        )
                                    )
                                    Toast.makeText(context, "Atividade registrada! +${String.format("%.1f", moedasGanhas)} moedas", Toast.LENGTH_SHORT).show()
                                    distancia = ""
                                    transporteSelecionado = null
                                }
                            },
                            modifier = Modifier.fillMaxWidth().height(50.dp),
                            colors = ButtonDefaults.buttonColors(containerColor = VerdeNeon),
                            shape = RoundedCornerShape(12.dp),
                            enabled = transporteSelecionado != null && distancia.isNotEmpty()
                        ) {
                            Text("Registrar", color = Preto, fontSize = 16.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        }
    }
}