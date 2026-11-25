package com.ecofuturo.esuda.models

import com.ecofuturo.esuda.model.Usuario

data class UsuarioLogin(
    val id: String,
    val nome: String,
    val email: String,
    val senha: String,
    val tipo: String,
    val moedas: Int
)

fun UsuarioLogin.toUsuarioModel(): Usuario {
    return Usuario(
        id = this.id,
        nome = this.nome,
        email = this.email,
        senha = this.senha,
        tipo = this.tipo,
        moedas = this.moedas
    )
}

fun UsuarioLogin.toJson(): String {
    return "${id}|${nome}|${email}|${senha}|${tipo}|${moedas}"
}

fun jsonToUsuarioLogin(json: String): UsuarioLogin {
    val parts = json.split("|")
    return UsuarioLogin(
        id = parts.getOrElse(0) { "" },
        nome = parts.getOrElse(1) { "" },
        email = parts.getOrElse(2) { "" },
        senha = parts.getOrElse(3) { "" },
        tipo = parts.getOrElse(4) { "" },
        moedas = parts.getOrElse(5) { "0" }.toIntOrNull() ?: 0
    )
}