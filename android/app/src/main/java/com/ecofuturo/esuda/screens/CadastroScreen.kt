package com.ecofuturo.esuda.screens

import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.ecofuturo.esuda.data.DadosApp
import com.ecofuturo.esuda.model.Usuario
import com.ecofuturo.esuda.ui.theme.*
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CadastroScreen(navController: NavController) {
    val context = LocalContext.current
    var nome by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var senha by remember { mutableStateOf("") }
    var confirmarSenha by remember { mutableStateOf("") }
    var tipoExpanded by remember { mutableStateOf(false) }
    var tipoSelecionado by remember { mutableStateOf("") }
    val tipos = listOf("Aluno", "Professor", "Funcionário", "Comunidade Externa")

    Box(
        modifier = Modifier.fillMaxSize().background(Brush.verticalGradient(listOf(Preto, Color(0xFF000000)))),
        contentAlignment = Alignment.Center
    ) {
        Card(
            modifier = Modifier.fillMaxWidth(0.9f).wrapContentHeight(),
            colors = CardDefaults.cardColors(containerColor = Color(0xFF1A1A1A).copy(alpha = 0.9f)),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(modifier = Modifier.padding(24.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Cadastrar", color = Branco, fontSize = 24.sp, fontWeight = FontWeight.Bold)
                    Icon(
                        imageVector = Icons.Default.Close,
                        contentDescription = "Fechar",
                        tint = Branco,
                        modifier = Modifier.clickable { navController.popBackStack() }
                    )
                }

                Spacer(modifier = Modifier.height(24.dp))

                OutlinedTextField(
                    value = nome,
                    onValueChange = { nome = it },
                    placeholder = { Text("Nome Completo", color = Cinza) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = VerdeNeon,
                        unfocusedBorderColor = Cinza,
                        focusedTextColor = Branco,
                        unfocusedTextColor = Branco
                    ),
                    shape = RoundedCornerShape(8.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    placeholder = { Text("E-mail", color = Cinza) },
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = VerdeNeon,
                        unfocusedBorderColor = Cinza,
                        focusedTextColor = Branco,
                        unfocusedTextColor = Branco
                    ),
                    shape = RoundedCornerShape(8.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = senha,
                    onValueChange = { senha = it },
                    placeholder = { Text("Senha", color = Cinza) },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = VerdeNeon,
                        unfocusedBorderColor = Cinza,
                        focusedTextColor = Branco,
                        unfocusedTextColor = Branco
                    ),
                    shape = RoundedCornerShape(8.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(16.dp))

                OutlinedTextField(
                    value = confirmarSenha,
                    onValueChange = { confirmarSenha = it },
                    placeholder = { Text("Confirmar Senha", color = Cinza) },
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = VerdeNeon,
                        unfocusedBorderColor = Cinza,
                        focusedTextColor = Branco,
                        unfocusedTextColor = Branco
                    ),
                    shape = RoundedCornerShape(8.dp),
                    singleLine = true
                )

                Spacer(modifier = Modifier.height(16.dp))

                ExposedDropdownMenuBox(
                    expanded = tipoExpanded,
                    onExpandedChange = { tipoExpanded = !tipoExpanded }
                ) {
                    OutlinedTextField(
                        value = tipoSelecionado,
                        onValueChange = {},
                        readOnly = true,
                        placeholder = { Text("Você é...", color = Cinza) },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = tipoExpanded) },
                        modifier = Modifier.fillMaxWidth().menuAnchor(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = VerdeNeon,
                            unfocusedBorderColor = Cinza,
                            focusedTextColor = Branco,
                            unfocusedTextColor = Branco
                        ),
                        shape = RoundedCornerShape(8.dp)
                    )
                    ExposedDropdownMenu(
                        expanded = tipoExpanded,
                        onDismissRequest = { tipoExpanded = false },
                        modifier = Modifier.background(Color(0xFF2A2A2A))
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

                Spacer(modifier = Modifier.height(24.dp))

                Button(
                    onClick = {
                        when {
                            nome.isBlank() || email.isBlank() || senha.isBlank() || tipoSelecionado.isBlank() -> {
                                Toast.makeText(context, "Preencha todos os campos", Toast.LENGTH_SHORT).show()
                            }
                            senha != confirmarSenha -> {
                                Toast.makeText(context, "As senhas não coincidem", Toast.LENGTH_SHORT).show()
                            }
                            DadosApp.usuarios.any { it.email == email } -> {
                                Toast.makeText(context, "Email já cadastrado", Toast.LENGTH_SHORT).show()
                            }
                            else -> {
                                val novoUsuario = Usuario(
                                    id = UUID.randomUUID().toString(),
                                    nome = nome,
                                    email = email,
                                    senha = senha,
                                    tipo = tipoSelecionado,
                                    moedas = 0
                                )
                                DadosApp.adicionarUsuario(novoUsuario)
                                Toast.makeText(context, "Cadastro realizado com sucesso! Faça login.", Toast.LENGTH_LONG).show()
                                navController.popBackStack()
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = VerdeNeon),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Cadastrar", color = Preto, fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    "Já tem conta? Entrar",
                    color = VerdeNeon,
                    fontSize = 14.sp,
                    modifier = Modifier.align(Alignment.CenterHorizontally).clickable { navController.popBackStack() }
                )
            }
        }
    }
}