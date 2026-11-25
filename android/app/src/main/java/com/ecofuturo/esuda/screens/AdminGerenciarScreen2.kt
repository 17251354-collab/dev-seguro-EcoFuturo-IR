package com.ecofuturo.esuda.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.ecofuturo.esuda.components.BottomBar
import com.ecofuturo.esuda.components.MenuDrawer
import com.ecofuturo.esuda.data.UsuarioLogado
import com.ecofuturo.esuda.ui.theme.*
import kotlinx.coroutines.launch

data class ParceiroAdmin(
    val id: Int,
    val nome: String,
    val categoria: String,
    val desconto: Int
)

data class BeneficioAdmin(
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
fun AdminGerenciarScreen(navController: NavController) {
    val usuario = UsuarioLogado.getUsuario()
    val context = LocalContext.current
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    var nomeParceiro by remember { mutableStateOf("") }
    val parceiros = remember {
        mutableStateListOf(
            ParceiroAdmin(1, "Faculdade Esuda", "Educação", 0),
            ParceiroAdmin(2, "Nagem", "Varejo", 0),
            ParceiroAdmin(3, "Livraria Jaqueira", "Educação", 50),
            ParceiroAdmin(4, "Cafeteria Delta Expresso", "Alimentação", 0)
        )
    }

    val beneficios = remember {
        mutableStateListOf(
            BeneficioAdmin(1, 1, "EcoBag", "Bolsa ecológica sustentável", 100, 180, 25, true),
            BeneficioAdmin(2, 2, "Café na Delta Expresso", "Café grátis na cafeteria", 150, 30, 30, true),
            BeneficioAdmin(3, 3, "Ingresso de Cinema", "Entrada para cinema", 250, 60, 15, true),
            BeneficioAdmin(4, 2, "Vale-refeição de R$50", "Voucher alimentação", 500, 30, 10, true),
            BeneficioAdmin(5, 1, "Camiseta EcoFuturo ESUDA", "Camiseta oficial do projeto", 750, 180, 20, false),
            BeneficioAdmin(6, 4, "Desconto 50% na Livraria Jaqueira", "Desconto em livros", 950, 60, 12, true),
            BeneficioAdmin(7, 1, "Bolsa 100% ESUDA", "Bolsa integral na faculdade", 980, 365, 5, false),
            BeneficioAdmin(8, 1, "Desconto 50% na Matrícula ESUDA", "Desconto na matrícula", 980, 90, 8, false),
            BeneficioAdmin(9, 5, "Fone de Ouvido Gamer", "Headset gamer premium", 2300, 120, 5, true)
        )
    }

    var showDialogBeneficio by remember { mutableStateOf(false) }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            MenuDrawer(
                navController = navController,
                tipoUsuario = usuario.tipo,
                rotaAtual = "admin_gerenciar",
                onClose = { scope.launch { drawerState.close() } },
                onLogout = { navController.navigate("login") { popUpTo(0) { inclusive = true } } }
            )
        }
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("GERENCIAR", color = VerdeNeon, fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(Icons.Filled.Menu, "Menu", tint = Branco)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(containerColor = Preto)
                )
            },
            bottomBar = { BottomBar(navController = navController, rotaAtual = "admin_gerenciar") },
            floatingActionButton = {
                FloatingActionButton(onClick = { showDialogBeneficio = true }, containerColor = VerdeNeon) {
                    Icon(Icons.Default.Add, "Adicionar Benefício", tint = Preto)
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
                        Text("Gerenciar\nParceiros e\nBenefícios", color = Branco, fontSize = 24.sp, fontWeight = FontWeight.Bold, lineHeight = 28.sp)
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
                                            parceiros.add(ParceiroAdmin(novoId, nomeParceiro, "Geral", 0))
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

                item {
                    Text("🎁 Benefícios (${beneficios.size})", color = Branco, fontSize = 18.sp, fontWeight = FontWeight.Bold)
                }

                itemsIndexed(beneficios) { index, beneficio ->
                    BeneficioAdminItem(
                        index = index + 1,
                        beneficio = beneficio,
                        onDelete = { beneficios.remove(beneficio) },
                        onUpdateEstoque = { novoEstoque ->
                            val idx = beneficios.indexOf(beneficio)
                            beneficios[idx] = beneficio.copy(estoque = novoEstoque)
                        }
                    )
                    Divider(color = Color(0xFF2A4A2A), thickness = 1.dp)
                }
            }
        }
    }

    if (showDialogBeneficio) {
        AdicionarBeneficioAdminDialog(
            onDismiss = { showDialogBeneficio = false },
            onConfirm = { novoBeneficio ->
                val novoId = (beneficios.maxOfOrNull { it.id } ?: 0) + 1
                beneficios.add(novoBeneficio.copy(id = novoId))
                showDialogBeneficio = false
            }
        )
    }
}

@Composable
fun BeneficioAdminItem(
    index: Int,
    beneficio: BeneficioAdmin,
    onDelete: () -> Unit,
    onUpdateEstoque: (Int) -> Unit
) {
    var estoqueTemp by remember { mutableStateOf(beneficio.estoque.toString()) }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(if (beneficio.ativo) Color(0xFF2A4A2A) else Color(0xFF3A2A2A))
            .padding(vertical = 12.dp, horizontal = 16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text("$index", color = Color.White, fontSize = 16.sp, modifier = Modifier.width(24.dp))

        Column(modifier = Modifier.weight(1f)) {
            Text(beneficio.nome, color = Color.White, fontWeight = FontWeight.SemiBold)
            Spacer(Modifier.height(4.dp))
            Text("Estoque:", color = Color.Gray, fontSize = 12.sp)
            OutlinedTextField(
                value = estoqueTemp,
                onValueChange = {
                    estoqueTemp = it
                    it.toIntOrNull()?.let { onUpdateEstoque(it) }
                },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                modifier = Modifier.width(80.dp).height(52.dp),
                textStyle = LocalTextStyle.current.copy(color = Color.White, fontSize = 14.sp),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Color(0xFF00FF66),
                    unfocusedBorderColor = Color.Gray,
                    focusedContainerColor = Color(0xFF1A3A1A),
                    unfocusedContainerColor = Color(0xFF1A3A1A)
                )
            )
        }

        Column(horizontalAlignment = Alignment.End) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("💰", fontSize = 16.sp)
                Spacer(Modifier.width(4.dp))
                Text("${beneficio.custoMoedas}", color = Color(0xFFFFD700), fontWeight = FontWeight.Bold, fontSize = 18.sp)
            }
            if (!beneficio.ativo) {
                Text("INATIVO", color = Color.Red, fontSize = 10.sp)
            }
            IconButton(onClick = onDelete) {
                Icon(Icons.Default.Delete, "Excluir", tint = Color.Red)
            }
        }
    }
}

@Composable
fun AdicionarBeneficioAdminDialog(
    onDismiss: () -> Unit,
    onConfirm: (BeneficioAdmin) -> Unit
) {
    var nome by remember { mutableStateOf("") }
    var descricao by remember { mutableStateOf("") }
    var custo by remember { mutableStateOf("") }
    var estoque by remember { mutableStateOf("") }
    var validade by remember { mutableStateOf("") }
    var idParceiro by remember { mutableStateOf("1") }
    var ativo by remember { mutableStateOf(true) }

    AlertDialog(
        onDismissRequest = onDismiss,
        containerColor = Color(0xFF2A4A2A),
        title = { Text("Novo Benefício", color = Color.White) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                OutlinedTextField(value = nome, onValueChange = { nome = it }, label = { Text("Nome") }, colors = textFieldColorsAdmin())
                OutlinedTextField(value = descricao, onValueChange = { descricao = it }, label = { Text("Descrição") }, colors = textFieldColorsAdmin())
                OutlinedTextField(value = custo, onValueChange = { custo = it }, label = { Text("Custo em Moedas") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), colors = textFieldColorsAdmin())
                OutlinedTextField(value = estoque, onValueChange = { estoque = it }, label = { Text("Estoque") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), colors = textFieldColorsAdmin())
                OutlinedTextField(value = validade, onValueChange = { validade = it }, label = { Text("Validade em Dias") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), colors = textFieldColorsAdmin())
                OutlinedTextField(value = idParceiro, onValueChange = { idParceiro = it }, label = { Text("ID Parceiro") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), colors = textFieldColorsAdmin())
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = ativo, onCheckedChange = { ativo = it }, colors = CheckboxDefaults.colors(checkedColor = Color(0xFF00FF66)))
                    Text("Ativo", color = Color.White)
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onConfirm(
                        BeneficioAdmin(
                            id = 0,
                            idParceiro = idParceiro.toIntOrNull() ?: 1,
                            nome = nome,
                            descricao = descricao,
                            custoMoedas = custo.toIntOrNull() ?: 0,
                            validadeDias = validade.toIntOrNull() ?: 30,
                            estoque = estoque.toIntOrNull() ?: 0,
                            ativo = ativo
                        )
                    )
                },
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF00FF66))
            ) { Text("Salvar", color = Color.Black) }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) { Text("Cancelar", color = Color.White) }
        }
    )
}

@Composable
fun textFieldColorsAdmin() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = Color(0xFF00FF66),
    unfocusedBorderColor = Color.Gray,
    focusedLabelColor = Color(0xFF00FF66),
    unfocusedLabelColor = Color.Gray,
    focusedTextColor = Color.White,
    unfocusedTextColor = Color.White
)