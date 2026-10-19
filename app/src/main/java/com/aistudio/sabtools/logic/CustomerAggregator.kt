package com.aistudio.sabtools.logic

import com.aistudio.sabtools.data.TimberReceiptEntity
import com.aistudio.sabtools.model.CustomerReceiptItem
import com.aistudio.sabtools.model.CustomerSummary

object CustomerAggregator {
    private fun clean(s: String?): String {
        return (s ?: "").trim().replace("\\s+".toRegex(), " ").lowercase()
    }

    private fun phoneDigits(s: String?): String {
        return (s ?: "").filter { it.isDigit() }
    }

    fun buildCustomerSummaries(receipts: List<TimberReceiptEntity>): List<CustomerSummary> {
        val map = mutableMapOf<String, CustomerSummary>()

        for (receipt in receipts) {
            val key = "${clean(receipt.customerName)}|${clean(receipt.village)}"
            val paymentState = PaymentLedger.computePaymentState(receipt.total, receipt.advance)

            val existing = map[key]
            val receiptItem = CustomerReceiptItem(
                receiptId = receipt.id,
                receiptNumber = receipt.number,
                date = receipt.date,
                total = receipt.total,
                balance = paymentState.balance,
                status = paymentState.status
            )

            if (existing == null) {
                map[key] = CustomerSummary(
                    key = key,
                    name = receipt.customerName.trim(),
                    village = receipt.village.trim(),
                    phone = receipt.customerMobile.trim(),
                    total = receipt.total,
                    pending = paymentState.balance,
                    lastDate = receipt.date,
                    receipts = listOf(receiptItem)
                )
            } else {
                val updatedReceipts = existing.receipts + receiptItem
                val updatedTotal = Math.round((existing.total + receipt.total) * 100.0) / 100.0
                val updatedPending = Math.round((existing.pending + paymentState.balance) * 100.0) / 100.0
                val updatedPhone = if (receipt.customerMobile.isNotBlank()) receipt.customerMobile.trim() else existing.phone
                val lastDate = if (receipt.date >= existing.lastDate) receipt.date else existing.lastDate

                map[key] = existing.copy(
                    total = updatedTotal,
                    pending = updatedPending,
                    phone = updatedPhone,
                    lastDate = lastDate,
                    receipts = updatedReceipts.sortedByDescending { it.date }
                )
            }
        }

        return map.values.sortedWith(
            compareByDescending<CustomerSummary> { it.lastDate }
                .thenBy { it.name }
        )
    }

    fun filterCustomers(customers: List<CustomerSummary>, query: String): List<CustomerSummary> {
        val q = clean(query)
        val digits = phoneDigits(query)
        if (q.isBlank()) return customers

        return customers.filter { c ->
            clean(c.name).contains(q) ||
                    clean(c.village).contains(q) ||
                    (digits.length >= 3 && phoneDigits(c.phone).contains(digits))
        }
    }
}
