package com.ecofuturo.esuda.model

import java.io.Serializable

data class Usuario(
    val id: String,
    val nome: String,
    val email: String,
    val senha: String,
    val tipo: String,  // Aluno, Professor, Funcionário, Comunidade Externa, Admin
    val moedas: Int,
    val moedasDoadas: Double = 0.0, // NOVO: pra Moedas Doadas não ficar 0
    val activities: MutableList<Atividade> = mutableListOf(),
    val vouchers: MutableList<VoucherData> = mutableListOf()
) : Serializable

data class Atividade(
    val id: String,
    val transport: String, // Bicicleta, Caminhada, Transporte Público, Carro Elétrico
    val distance: Double, // em km
    val coins: Double, // moedas ganhas
    val date: String,
    val co2Reduzido: Double = 0.0 // NOVO: calculado pela distância
) {
    // Pra não precisar trocar o RelatorioScreen inteiro:
    // ele pode usar .tipo, .moedasGanhas que vão apontar pros campos certos
    val tipo: String get() = transport
    val moedasGanhas: Int get() = coins.toInt()
}

data class VoucherData(
    val id: String,
    val benefitId: Int,
    val benefitName: String,
    val cost: Int,
    val redeemDate: String,
    val expirationDate: String,
    val status: String  // reserved, pending, used, expired
)