package com.ecofuturo.esuda.screens

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.ecofuturo.esuda.components.MenuDrawer
import com.ecofuturo.esuda.data.BeneficiosData
import com.ecofuturo.esuda.data.UsuarioLogado
import com.ecofuturo.esuda.data.VouchersData
import com.ecofuturo.esuda.ui.theme.*
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CatalogoScreen(navController: NavController) {
    val context = LocalContext.current
    val usuario = UsuarioLogado.getUsuario()
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()
    var saldoAtual by remember { mutableStateOf(usuario.moedas) }

    val beneficiosFiltrados = if (usuario.tipo == "Comunidade Externa") {
        BeneficiosData.beneficios.filter { it.ativo && it.estoque > 0 && it.publicoExterno }
    } else {
        BeneficiosData.beneficios.filter { it.ativo && it.estoque > 0 }
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            MenuDrawer(navController = navController, tipoUsuario = usuario.tipo, rotaAtual = "beneficios",
                onClose = { scope.launch { drawerState.close() } },
                onLogout = { navController.navigate("login") { popUpTo(0) { inclusive = true } } })
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Catálogo de Benefícios", fontWeight = FontWeight.Bold, color = Branco) },
                    navigationIcon = { IconButton(onClick = { scope.launch { drawerState.open() } }) { Icon(Icons.Filled.Menu, "Menu", tint = VerdeNeon) } },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Preto)
                )
            },
            containerColor = Preto
        ) { padding ->
            LazyColumn(modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                item {
                    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color(0xFF2A3A4A)), shape = RoundedCornerShape(12.dp)) {
                        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                            Column {
                                Text("💰 Seu saldo", color = Cinza, fontSize = 12.sp)
                                Text("$saldoAtual moedas", color = Color(0xFFFFD700), fontSize = 20.sp, fontWeight = FontWeight.Bold)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("${beneficiosFiltrados.size} benefícios", color = VerdeNeon, fontSize = 12.sp)
                                Text("Tipo: ${usuario.tipo}", color = Cinza, fontSize = 10.sp)
                            }
                        }
                    }
                }
                items(beneficiosFiltrados) { beneficio ->
                    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = FundoCard), shape = RoundedCornerShape(16.dp)) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(beneficio.nome, color = Branco, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(4.dp))
                            Text(beneficio.descricao, color = Cinza, fontSize = 12.sp)
                            Spacer(Modifier.height(8.dp))
                            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                                Text("⏰ Voucher vale 30 dias", color = Cinza, fontSize = 10.sp)
                                Text("📦 Estoque: ${beneficio.estoque}", color = Cinza, fontSize = 10.sp)
                            }
                            Spacer(Modifier.height(12.dp))
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Text("💰 ${beneficio.custoMoedas} moedas", color = VerdeNeon, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                                val podeResgatar = saldoAtual >= beneficio.custoMoedas && beneficio.estoque > 0
                                Button(
                                    onClick = {
                                        if (saldoAtual >= beneficio.custoMoedas) {
                                            // CORRIGIDO: Agora desconta E soma em Moedas Doadas
                                            UsuarioLogado.registrarTroca(beneficio.custoMoedas)
                                            saldoAtual -= beneficio.custoMoedas
                                            val agora = System.currentTimeMillis()
                                            val voucher = Voucher(
                                                nome = beneficio.nome,
                                                custoMoedas = beneficio.custoMoedas.toDouble(),
                                                dataReserva = agora,
                                                dataValidade = agora + 30L * 24L * 60L * 60L * 1000L,
                                                status = StatusVoucher.RESERVADO
                                            )
                                            VouchersData.adicionar(voucher)
                                            Toast.makeText(context, "Voucher reservado! Vale por 30 dias", Toast.LENGTH_LONG).show()
                                            navController.navigate("resgates")
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = if (podeResgatar) VerdeNeon else Cinza),
                                    enabled = podeResgatar, shape = RoundedCornerShape(12.dp)
                                ) {
                                    Text(if (podeResgatar) "RESGATAR" else "MOEDAS INSUFICIENTES", color = if (podeResgatar) Preto else Branco, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}