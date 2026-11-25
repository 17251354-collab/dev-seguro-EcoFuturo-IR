package com.ecofuturo.esuda.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
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

data class Parceiro(
    val id: Int,
    val nome: String,
    val categoria: String,
    val desconto: Int
)

data class BeneficioParceiro(
    val id: Int,
    val idParceiro: Int,
    val nome: String,
    val descricao: String,
    val custoMoedas: Int,
    val validadeDias: Int,
    val estoque: Int,
    val ativo: Boolean
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ParceirosScreen(navController: NavController) {  // ← NOME MUDADO
    val usuario = UsuarioLogado.getUsuario()
    val context = LocalContext.current
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    var nomeParceiro by remember { mutableStateOf("") }
    val parceiros = remember {
        mutableStateListOf(
            Parceiro(1, "Faculdade Esuda", "Educação", 0),
            Parceiro(2, "Nagem", "Varejo", 0),
            Parceiro(3, "Livraria Jaqueira", "Educação", 50),
            Parceiro(4, "Cafeteria Delta Expresso", "Alimentação", 0)
        )
    }

    val beneficios = remember {
        mutableStateListOf(
            BeneficioParceiro(1, 1, "EcoBag", "Bolsa ecológica sustentável", 100, 180, 25, true),
            BeneficioParceiro(2, 2, "Café na Delta Expresso", "Café grátis na cafeteria", 150, 30, 30, true),
            BeneficioParceiro(3, 3, "Ingresso de Cinema", "Entrada para cinema", 250, 60, 15, true),
            BeneficioParceiro(4, 2, "Vale-refeição de R$50", "Voucher alimentação", 500, 30, 10, true),
            BeneficioParceiro(5, 1, "Camiseta EcoFuturo ESUDA", "Camiseta oficial do projeto", 750, 180, 20, false),
            BeneficioParceiro(6, 4, "Desconto 50% na Livraria Jaqueira", "Desconto em livros", 950, 60, 12, true),
            BeneficioParceiro(7, 1, "Bolsa 100% ESUDA", "Bolsa integral na faculdade", 980, 365, 5, false),
            BeneficioParceiro(8, 1, "Desconto 50% na Matrícula ESUDA", "Desconto na matrícula", 980, 90, 8, false),
            BeneficioParceiro(9, 5, "Fone de Ouvido Gamer", "Headset gamer premium", 2300, 120, 5, true)
        )
    }

    var showDialogBeneficio by remember { mutableStateOf(false) }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            MenuDrawer(
                navController = navController,
                tipoUsuario = usuario.tipo,
                rotaAtual = "parceiros",  // ← ROTA MUDADA
                onClose = { scope.launch { drawerState.close() } },
                onLogout = { navController.navigate("login") { popUpTo(0) { inclusive = true } } }
            )
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("PARCEIROS", color = VerdeNeon, fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(Icons.Filled.Menu, "Menu", tint = Branco)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Preto)
                )
            },
            bottomBar = { BottomBar(navController = navController, rotaAtual = "parceiros") },
            floatingActionButton = {
                FloatingActionButton(onClick = { showDialogBeneficio = true }, containerColor = VerdeNeon) {
                    Icon(Icons.Default.Add, "Adicionar", tint = Preto)
                }
            },
            containerColor = Preto
        ) { padding ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .background(Brush.verticalGradient(listOf(Color(0xFF0A0F1F), Color(0xFF1A1F2F))))
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("🤝", fontSize = 28.sp)
                        Spacer(Modifier.width(8.dp))
                        Text("Parceiros", color = Branco, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                    }
                }

                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF2A3A4A).copy(alpha = 0.7f)),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            Text("🏢 Parceiros (${parceiros.size})", color = Branco, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                            Spacer(Modifier.height(12.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                OutlinedTextField(
                                    value = nomeParceiro,
                                    onValueChange = { nomeParceiro = it },
                                    placeholder = { Text("Nome do Parceiro", color = Cinza) },
                                    modifier = Modifier.weight(1f),
                                    colors = OutlinedTextFieldDefaults.colors(
                                        focusedBorderColor = VerdeNeon,
                                        unfocusedBorderColor = Cinza,
                                        focusedTextColor = Branco,
                                        unfocusedTextColor = Branco
                                    ),
                                    shape = RoundedCornerShape(8.dp),
                                    singleLine = true
                                )

                                Button(
                                    onClick = {
                                        if (nomeParceiro.isNotBlank()) {
                                            val novoId = (parceiros.maxOfOrNull { it.id } ?: 0) + 1
                                            parceiros.add(Parceiro(novoId, nomeParceiro, "Geral", 0))
                                            nomeParceiro = ""
                                            Toast.makeText(context, "Parceiro adicionado", Toast.LENGTH_SHORT).show()
                                        }
                                    },
                                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF4A90E2)),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Text("Adicionar", color = Branco, fontWeight = FontWeight.Bold)
                                }
                            }

                            Spacer(Modifier.height(12.dp))

                            Row(
                                modifier = Modifier.fillMaxWidth().background(Color(0xFF3A5A6A)).padding(12.dp)
                            ) {
                                Text("PARCEIRO", color = Branco, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                                Text("AÇÕES", color = Branco, fontWeight = FontWeight.Bold)
                            }

                            parceiros.forEach { parceiro ->
                                Row(
                                    modifier = Modifier.fillMaxWidth().padding(12.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text("🏢 ${parceiro.nome}", color = Branco, fontSize = 14.sp, modifier = Modifier.weight(1f))
                                    IconButton(onClick = { parceiros.remove(parceiro) }) {
                                        Icon(Icons.Default.Delete, "Excluir", tint = Color(0xFFFF6B6B))
                                    }
                                }
                                Divider(color = Cinza.copy(alpha = 0.2f))
                            }
                        }
                    }
                }
            }
        }
    }

    if (showDialogBeneficio) {
        AlertDialog(
            onDismissRequest = { showDialogBeneficio = false },
            containerColor = Color(0xFF2A4A2A),
            title = { Text("Adicionar", color = Color.White) },
            text = { Text("Funcionalidade em desenvolvimento", color = Color.White) },
            confirmButton = {
                Button(onClick = { showDialogBeneficio = false }) {
                    Text("Fechar", color = Color.Black)
                }
            }
        )
    }
}