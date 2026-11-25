package com.ecofuturo.esuda.data

import android.content.Context
import com.ecofuturo.esuda.model.Usuario

object UsuarioLogado {
    private var prefs: android.content.SharedPreferences? = null

    fun init(context: Context) {
        if (prefs == null) {
            prefs = context.getSharedPreferences("ecofuturo_prefs", Context.MODE_PRIVATE)
        }
    }

    fun setUsuario(usuario: Usuario) {
        val p = prefs ?: return
        p.edit().apply {
            putString("id", usuario.id)
            putString("nome", usuario.nome)
            putString("email", usuario.email)
            putString("senha", usuario.senha)
            putString("tipo", usuario.tipo)
            putInt("moedas", usuario.moedas)
            putFloat("moedasDoadas", usuario.moedasDoadas.toFloat())
            apply()
        }
    }

    fun atualizarMoedas(novasMoedas: Int) {
        val atual = getUsuario()
        setUsuario(atual.copy(moedas = novasMoedas))
    }

    fun adicionarMoedasDoadas(valor: Double) {
        val atual = getUsuario()
        val novoTotal = atual.moedasDoadas + valor
        setUsuario(atual.copy(moedasDoadas = novoTotal))
    }

    // FUNÇÃO NOVA - Usa essa na hora de trocar!
    fun registrarTroca(custoMoedas: Int) {
        val atual = getUsuario()
        val novasMoedas = atual.moedas - custoMoedas
        val novasDoadas = atual.moedasDoadas + custoMoedas.toDouble()
        setUsuario(atual.copy(moedas = novasMoedas, moedasDoadas = novasDoadas))
    }

    fun getUsuario(): Usuario {
        val p = prefs
        if (p == null) {
            return Usuario("", "", "", "", "", 0, 0.0)
        }
        return Usuario(
            p.getString("id", "") ?: "",
            p.getString("nome", "") ?: "",
            p.getString("email", "") ?: "",
            p.getString("senha", "") ?: "",
            p.getString("tipo", "") ?: "",
            p.getInt("moedas", 0),
            p.getFloat("moedasDoadas", 0f).toDouble()
        )
    }

    fun isAdmin(): Boolean {
        return getUsuario().tipo == "Admin"
    }

    fun logout() {
        prefs?.edit()?.clear()?.apply()
    }
}