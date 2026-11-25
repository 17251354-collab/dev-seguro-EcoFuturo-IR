package com.ecofuturo.esuda.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.ecofuturo.esuda.components.BottomBar
import com.ecofuturo.esuda.components.MenuDrawer
import com.ecofuturo.esuda.data.UsuarioLogado
import com.ecofuturo.esuda.model.Usuario
import com.ecofuturo.esuda.ui.theme.*
import kotlinx.coroutines.launch
import java.util.UUID

// Dados globais do app (para o admin gerenciar usuários)
object AdminDadosApp {
    val usuarios = mutableStateListOf<Usuario>()

    init {
        // APENAS ADMIN PRÉ-CADASTRADO - SEM USUÁRIOS DE EXEMPLO
        usuarios.add(
            Usuario(
                id = "admin_001",
                nome = "Administrador",
                email = "admin@ecofuturo.com",
                senha = "admin123",
                tipo = "Admin",
                moedas = 0
            )
        )
        // NENHUM OUTRO USUÁRIO PRÉ-CADASTRADO
    }

    fun adicionarUsuario(usuario: Usuario) {
        usuarios.add(usuario)
    }

    fun removerUsuario(index: Int) {
        usuarios.removeAt(index)
    }

    fun atualizarUsuario(index: Int, usuario: Usuario) {
        usuarios[index] = usuario
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminUsuariosScreen(navController: NavController) {
    val usuarioAdmin = UsuarioLogado.getUsuario()
    val context = LocalContext.current
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    var nome by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var senha by remember { mutableStateOf("") }
    var tipoExpanded by remember { mutableStateOf(false) }
    var tipoSelecionado by remember { mutableStateOf("") }
    val tipos = listOf("Aluno", "Professor", "Funcionário", "Comunidade Externa")

    var editandoIndex by remember { mutableStateOf(-1) }
    var nomeEdit by remember { mutableStateOf("") }
    var emailEdit by remember { mutableStateOf("") }
    var tipoEdit by remember { mutableStateOf("") }
    var expandedTipoEdit by remember { mutableStateOf(false) }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            MenuDrawer(
                navController = navController,
                tipoUsuario = usuarioAdmin.tipo,
                rotaAtual = "admin_usuarios",
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
                            "GERENCIAR USUÁRIOS",
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
                BottomBar(navController = navController, rotaAtual = "admin_usuarios")
            },
            containerColor = Preto
        ) { padding ->
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .background(Preto)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // CARD PARA ADICIONAR USUÁRIO
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = FundoCard.copy(alpha = 0.7f)),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(modifier = Modifier.padding(20.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text("➕", fontSize = 24.sp)
                                Spacer(Modifier.width(8.dp))
                                Text(
                                    "Adicionar Novo Usuário",
                                    color = Branco,
                                    fontSize = 20.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            }

                            Spacer(Modifier.height(20.dp))

                            OutlinedTextField(
                                value = nome,
                                onValueChange = { nome = it },
                                label = { Text("Nome Completo", color = Cinza) },
                                modifier = Modifier.fillMaxWidth(),
                                colors = adminTextFieldColors(),
                                shape = RoundedCornerShape(12.dp),
                                singleLine = true
                            )

                            Spacer(Modifier.height(12.dp))

                            OutlinedTextField(
                                value = email,
                                onValueChange = { email = it },
                                label = { Text("E-mail", color = Cinza) },
                                modifier = Modifier.fillMaxWidth(),
                                colors = adminTextFieldColors(),
                                shape = RoundedCornerShape(12.dp),
                                singleLine = true
                            )

                            Spacer(Modifier.height(12.dp))

                            OutlinedTextField(
                                value = senha,
                                onValueChange = { senha = it },
                                label = { Text("Senha", color = Cinza) },
                                visualTransformation = PasswordVisualTransformation(),
                                modifier = Modifier.fillMaxWidth(),
                                colors = adminTextFieldColors(),
                                shape = RoundedCornerShape(12.dp),
                                singleLine = true
                            )

                            Spacer(Modifier.height(12.dp))

                            ExposedDropdownMenuBox(
                                expanded = tipoExpanded,
                                onExpandedChange = { tipoExpanded = !tipoExpanded }
                            ) {
                                OutlinedTextField(
                                    value = tipoSelecionado,
                                    onValueChange = {},
                                    readOnly = true,
                                    label = { Text("Tipo de Usuário", color = Cinza) },
                                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = tipoExpanded) },
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .menuAnchor(),
                                    colors = adminTextFieldColors(),
                                    shape = RoundedCornerShape(12.dp)
                                )
                                ExposedDropdownMenu(
                                    expanded = tipoExpanded,
                                    onDismissRequest = { tipoExpanded = false },
                                    modifier = Modifier.background(FundoCard)
                                ) {
                                    tipos.forEach { tipo ->
                                        DropdownMenuItem(
                                            text = { Text(tipo, color = Branco) },
                                            onClick = {
                                                tipoSelecionado = tipo
                                                tipoExpanded = false
                                            }
                                        )
                                    }
                                }
                            }

                            Spacer(Modifier.height(20.dp))

                            Button(
                                onClick = {
                                    if (nome.isNotBlank() && email.isNotBlank() && senha.isNotBlank() && tipoSelecionado.isNotBlank()) {
                                        val novoUsuario = Usuario(
                                            id = UUID.randomUUID().toString(),
                                            nome = nome,
                                            email = email,
                                            senha = senha,
                                            tipo = tipoSelecionado,
                                            moedas = 0
                                        )
                                        AdminDadosApp.adicionarUsuario(novoUsuario)
                                        nome = ""
                                        email = ""
                                        senha = ""
                                        tipoSelecionado = ""
                                        Toast.makeText(context, "Usuário cadastrado!", Toast.LENGTH_SHORT).show()
                                    } else {
                                        Toast.makeText(context, "Preencha todos os campos", Toast.LENGTH_SHORT).show()
                                    }
                                },
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .height(50.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF3B82F6)),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Text("Cadastrar", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Branco)
                            }
                        }
                    }
                }

                // LISTA DE USUÁRIOS
                item {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text("📋", fontSize = 24.sp)
                        Spacer(Modifier.width(8.dp))
                        Text(
                            "Lista de Usuários (${AdminDadosApp.usuarios.size})",
                            color = Branco,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold
                        )
                    }
                }

                items(AdminDadosApp.usuarios.indices.toList()) { index ->
                    val user = AdminDadosApp.usuarios[index]
                    val isEditando = editandoIndex == index

                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = FundoCard.copy(alpha = 0.5f)),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            if (isEditando) {
                                // MODO EDIÇÃO
                                OutlinedTextField(
                                    value = nomeEdit,
                                    onValueChange = { nomeEdit = it },
                                    label = { Text("Nome", color = Cinza) },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = adminTextFieldColors(),
                                    shape = RoundedCornerShape(8.dp)
                                )
                                Spacer(Modifier.height(8.dp))
                                OutlinedTextField(
                                    value = emailEdit,
                                    onValueChange = { emailEdit = it },
                                    label = { Text("Email", color = Cinza) },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = adminTextFieldColors(),
                                    shape = RoundedCornerShape(8.dp)
                                )
                                Spacer(Modifier.height(8.dp))

                                ExposedDropdownMenuBox(
                                    expanded = expandedTipoEdit,
                                    onExpandedChange = { expandedTipoEdit = !expandedTipoEdit }
                                ) {
                                    OutlinedTextField(
                                        value = tipoEdit,
                                        onValueChange = {},
                                        readOnly = true,
                                        label = { Text("Tipo", color = Cinza) },
                                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedTipoEdit) },
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .menuAnchor(),
                                        colors = adminTextFieldColors(),
                                        shape = RoundedCornerShape(8.dp)
                                    )
                                    ExposedDropdownMenu(
                                        expanded = expandedTipoEdit,
                                        onDismissRequest = { expandedTipoEdit = false },
                                        modifier = Modifier.background(FundoCard)
                                    ) {
                                        tipos.forEach { tipo ->
                                            DropdownMenuItem(
                                                text = { Text(tipo, color = Branco) },
                                                onClick = {
                                                    tipoEdit = tipo
                                                    expandedTipoEdit = false
                                                }
                                            )
                                        }
                                    }
                                }

                                Spacer(Modifier.height(8.dp))

                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Button(
                                        onClick = {
                                            AdminDadosApp.atualizarUsuario(
                                                index,
                                                user.copy(
                                                    nome = nomeEdit,
                                                    email = emailEdit,
                                                    tipo = tipoEdit
                                                )
                                            )
                                            editandoIndex = -1
                                            Toast.makeText(context, "Usuário atualizado!", Toast.LENGTH_SHORT).show()
                                        },
                                        colors = ButtonDefaults.buttonColors(containerColor = VerdeNeon),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Text("Salvar", color = Preto, fontWeight = FontWeight.Bold)
                                    }
                                    Button(
                                        onClick = { editandoIndex = -1 },
                                        colors = ButtonDefaults.buttonColors(containerColor = Cinza),
                                        modifier = Modifier.weight(1f)
                                    ) {
                                        Text("Cancelar", color = Branco, fontWeight = FontWeight.Bold)
                                    }
                                }
                            } else {
                                // MODO VISUALIZAÇÃO
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(
                                            user.nome,
                                            color = Branco,
                                            fontSize = 16.sp,
                                            fontWeight = FontWeight.Bold
                                        )
                                        Text(
                                            user.email,
                                            color = Cinza,
                                            fontSize = 12.sp
                                        )
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text("💰 ", color = Color(0xFFFFD700), fontSize = 12.sp)
                                            Text(
                                                "${user.moedas} moedas",
                                                color = Color(0xFFFFD700),
                                                fontSize = 12.sp,
                                                fontWeight = FontWeight.Bold
                                            )
                                        }
                                        Text(
                                            user.tipo,
                                            color = VerdeNeon,
                                            fontSize = 12.sp
                                        )
                                    }

                                    Row {
                                        IconButton(onClick = {
                                            editandoIndex = index
                                            nomeEdit = user.nome
                                            emailEdit = user.email
                                            tipoEdit = user.tipo
                                        }) {
                                            Icon(Icons.Filled.Edit, "Editar", tint = VerdeNeon)
                                        }
                                        IconButton(onClick = {
                                            AdminDadosApp.removerUsuario(index)
                                            Toast.makeText(context, "Usuário excluído!", Toast.LENGTH_SHORT).show()
                                        }) {
                                            Icon(Icons.Filled.Delete, "Excluir", tint = Color(0xFFFF5252))
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
}

@Composable
fun adminTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = VerdeNeon,
    unfocusedBorderColor = Cinza,
    focusedTextColor = Branco,
    unfocusedTextColor = Branco,
    cursorColor = VerdeNeon,
    focusedLabelColor = VerdeNeon,
    unfocusedLabelColor = Cinza
)