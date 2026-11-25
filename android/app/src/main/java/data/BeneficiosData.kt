package com.ecofuturo.esuda.data

import com.ecofuturo.esuda.model.Beneficio

object BeneficiosData {
    val beneficios = listOf(
        Beneficio(1, 1, "EcoBag", "Bolsa ecológica sustentável", 100, 180, 25, true, true),
        Beneficio(2, 2, "Café na Delta Expresso", "Café grátis na cafeteria", 150, 30, 30, true, false),
        Beneficio(3, 3, "Ingresso de Cinema", "Entrada para cinema", 250, 60, 15, true, false),
        Beneficio(4, 2, "Vale-refeição de R$50", "Voucher alimentação", 500, 30, 10, true, false),
        Beneficio(5, 1, "Camiseta EcoFuturo ESUDA", "Camiseta oficial do projeto", 750, 180, 20, true, true),
        Beneficio(6, 4, "Desconto 50% na Livraria Jaqueira", "Desconto em livros", 950, 60, 12, true, false),
        Beneficio(7, 1, "Bolsa 100% ESUDA", "Bolsa integral na faculdade", 980, 365, 5, true, true),
        Beneficio(8, 1, "Desconto 50% na Matrícula ESUDA", "Desconto na matrícula", 980, 90, 8, true, true),
        Beneficio(9, 5, "Fone de Ouvido Gamer", "Headset gamer premium", 2300, 120, 5, true, false)
    )
}