package com.ecofuturo.esuda.data

import androidx.compose.runtime.mutableStateListOf
import com.ecofuturo.esuda.screens.StatusVoucher
import com.ecofuturo.esuda.screens.Voucher

object VouchersData {
    val vouchers = mutableStateListOf<Voucher>()

    fun adicionar(voucher: Voucher) {
        vouchers.add(0, voucher)
    }
    fun remover(id: String) {
        vouchers.removeAll { it.id == id }
    }
    fun marcarUsado(id: String) {
        val i = vouchers.indexOfFirst { it.id == id }
        if (i != -1) {
            vouchers[i] = vouchers[i].copy(
                status = StatusVoucher.USADO,
                dataUso = System.currentTimeMillis()
            )
        }
    }
}