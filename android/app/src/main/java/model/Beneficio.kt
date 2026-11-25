package com.ecofuturo.esuda.model

data class Beneficio(
    val id: Int,
    val idParceiro: Int,
    val nome: String,
    val descricao: String,
    val custoMoedas: Int,
    val validadeDias: Int,
    val estoque: Int,
    val ativo: Boolean,
    val publicoExterno: Boolean = false  // true = Comunidade Externa pode ver
)