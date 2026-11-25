package com.ecofuturo.esuda.data

import androidx.compose.runtime.mutableStateListOf
import com.ecofuturo.esuda.model.Usuario

object DadosApp {
    val usuarios = mutableStateListOf<Usuario>()

    init {
        // APENAS ADMIN PRÉ-CADASTRADO - NÃO APARECE NA LISTA DE GERENCIAR
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
    }

    fun adicionarUsuario(usuario: Usuario) {
        if (usuario.tipo != "Admin") {  // Não permite cadastrar outro Admin
            usuarios.add(usuario)
        }
    }

    fun buscarUsuario(email: String, senha: String): Usuario? {
        return usuarios.find { it.email == email && it.senha == senha }
    }

    fun listarUsuariosComuns(): List<Usuario> {
        return usuarios.filter { it.tipo != "Admin" }
    }

    fun removerUsuario(email: String) {
        usuarios.removeAll { it.email == email && it.tipo != "Admin" }
    }

    fun atualizarUsuario(email: String, nome: String, tipo: String) {
        val index = usuarios.indexOfFirst { it.email == email && it.tipo != "Admin" }
        if (index != -1) {
            usuarios[index] = usuarios[index].copy(nome = nome, tipo = tipo)
        }
    }
}