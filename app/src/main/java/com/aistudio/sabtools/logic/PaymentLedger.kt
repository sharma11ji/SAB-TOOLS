package com.aistudio.sabtools.logic

import com.aistudio.sabtools.model.PaymentState
import com.aistudio.sabtools.model.TimberRowItem
import com.aistudio.sabtools.model.TimberTotals
import java.text.NumberFormat
import java.util.Locale
import kotlin.math.max
import kotlin.math.roundToInt

object PaymentLedger {
    fun formatCurrency(amount: Double): String {
        return try {
            val format = NumberFormat.getCurrencyInstance(Locale("en", "IN"))
            format.maximumFractionDigits = 2
            format.minimumFractionDigits = 0
            format.format(amount)
        } catch (_: Exception) {
            "₹" + String.format(Locale.US, "%.2f", amount)
        }
    }

    fun calculateTimberTotals(
        rows: List<TimberRowItem>,
        defaultRate: Double,
        advance: Double,
        labour: Double,
        transport: Double,
        unit: String
    ): TimberTotals {
        val isCbm = unit.equals("CBM", ignoreCase = true)
        val cfts = rows.map { row ->
            WoodCalculations.roundLogCft(row.length, row.girth) ?: 0.0
        }
        val volumes = cfts.map { cft ->
            if (isCbm) cft / WoodCalculations.CBM_TO_CFT else cft
        }
        val amounts = volumes.mapIndexed { index, vol ->
            val rowRate = if (rows[index].rate > 0) rows[index].rate else defaultRate
            ((vol * rowRate * 100.0).roundToInt()) / 100.0
        }

        val totalCft = cfts.sum()
        val totalVolume = volumes.sum()
        val woodValue = ((amounts.sum() * 100.0).roundToInt()) / 100.0
        val grandTotal = ((((woodValue + labour + transport) * 100.0).roundToInt()) / 100.0)
        val paid = ((advance * 100.0).roundToInt()) / 100.0
        val balance = max(0.0, ((((grandTotal - paid) * 100.0).roundToInt()) / 100.0))

        return TimberTotals(
            unit = if (isCbm) "CBM" else "CFT",
            volumes = volumes,
            volume = totalVolume,
            amounts = amounts,
            cft = totalCft,
            woodValue = woodValue,
            total = grandTotal,
            labour = labour,
            transport = transport,
            advance = paid,
            balance = balance,
            valid = rows.isNotEmpty() && totalVolume > 0
        )
    }

    fun computePaymentState(total: Double, advance: Double): PaymentState {
        val balance = max(0.0, ((total - advance) * 100.0).roundToInt() / 100.0)
        return PaymentState(
            total = total,
            paid = advance,
            balance = balance,
            status = if (balance <= 0.01) "paid" else "pending"
        )
    }
}
