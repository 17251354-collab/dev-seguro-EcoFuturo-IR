package com.ecofuturo.esuda.data

import android.content.Context
import androidx.compose.runtime.mutableStateListOf
import org.json.JSONArray
import org.json.JSONObject

data class AtividadeRegistrada(
    val tipo: String,
    val emoji: String,
    val distanciaKm: Double,
    val moedasGanhas: Double,
    val co2Reduzido: Double,
    val data: String
)

object AtividadesData {
    // CORRIGIDO: agora é uma lista que o Compose observa e atualiza o gráfico
    val atividades = mutableStateListOf<AtividadeRegistrada>()
    private var prefs: android.content.SharedPreferences? = null

    fun init(context: Context) {
        if (prefs == null) {
            prefs = context.getSharedPreferences("ecofuturo_prefs", Context.MODE_PRIVATE)
            carregar()
        }
    }

    fun adicionar(atividade: AtividadeRegistrada) {
        atividades.add(atividade)
        salvar()
    }

    private fun salvar() {
        val p = prefs ?: return
        val jsonArray = JSONArray()
        for (a in atividades) {
            val obj = JSONObject()
            obj.put("tipo", a.tipo)
            obj.put("emoji", a.emoji)
            obj.put("distanciaKm", a.distanciaKm)
            obj.put("moedasGanhas", a.moedasGanhas)
            obj.put("co2Reduzido", a.co2Reduzido)
            obj.put("data", a.data)
            jsonArray.put(obj)
        }
        p.edit().putString("atividades_salvas", jsonArray.toString()).apply()
    }

    private fun carregar() {
        val p = prefs ?: return
        val json = p.getString("atividades_salvas", null) ?: return
        try {
            val array = JSONArray(json)
            atividades.clear()
            for (i in 0 until array.length()) {
                val obj = array.getJSONObject(i)
                atividades.add(
                    AtividadeRegistrada(
                        tipo = obj.getString("tipo"),
                        emoji = obj.getString("emoji"),
                        distanciaKm = obj.getDouble("distanciaKm"),
                        moedasGanhas = obj.getDouble("moedasGanhas"),
                        co2Reduzido = obj.getDouble("co2Reduzido"),
                        data = obj.getString("data")
                    )
                )
            }
        } catch (e: Exception) { }
    }
}