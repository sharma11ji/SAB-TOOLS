package com.aistudio.sabtools.logic

import com.aistudio.sabtools.data.TimberReceiptEntity
import com.aistudio.sabtools.model.SalesReportData
import com.aistudio.sabtools.model.TopCustomerItem
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import kotlin.math.roundToInt

enum class ReportPeriod(val title: String) {
    TODAY("Today"),
    THIS_WEEK("This week"),
    THIS_MONTH("This month"),
    ALL_TIME("All time")
}

object SalesReporter {
    private val dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd")

    fun buildReport(
        receipts: List<TimberReceiptEntity>,
        period: ReportPeriod,
        customFrom: String? = null,
        customTo: String? = null
    ): SalesReportData {
        val today = LocalDate.now()
        val (fromDate, toDate) = when (period) {
            ReportPeriod.TODAY -> Pair(today.format(dateFormatter), today.format(dateFormatter))
            ReportPeriod.THIS_WEEK -> {
                val monday = today.minusDays(((today.dayOfWeek.value - 1) % 7).toLong())
                Pair(monday.format(dateFormatter), today.format(dateFormatter))
            }
            ReportPeriod.THIS_MONTH -> {
                val firstDay = today.withDayOfMonth(1)
                Pair(firstDay.format(dateFormatter), today.format(dateFormatter))
            }
            ReportPeriod.ALL_TIME -> {
                if (customFrom != null && customTo != null) {
                    Pair(customFrom, customTo)
                } else {
                    Pair(null, null)
                }
            }
        }

        val filteredReceipts = receipts.filter { receipt ->
            val date = receipt.date
            val matchesFrom = fromDate == null || date >= fromDate
            val matchesTo = toDate == null || date <= toDate
            matchesFrom && matchesTo
        }

        var total = 0.0
        var paid = 0.0
        var pending = 0.0

        val customerMap = mutableMapOf<String, TopCustomerItem>()

        for (receipt in filteredReceipts) {
            val paymentState = PaymentLedger.computePaymentState(receipt.total, receipt.advance)
            total += paymentState.total
            paid += paymentState.paid
            pending += paymentState.balance

            val key = "${receipt.customerName.trim().lowercase()}|${receipt.village.trim().lowercase()}"
            val existing = customerMap[key]
            if (existing == null) {
                customerMap[key] = TopCustomerItem(
                    key = key,
                    name = receipt.customerName.trim(),
                    village = receipt.village.trim(),
                    count = 1,
                    total = paymentState.total,
                    pending = paymentState.balance
                )
            } else {
                customerMap[key] = existing.copy(
                    count = existing.count + 1,
                    total = ((existing.total + paymentState.total) * 100.0).roundToInt() / 100.0,
                    pending = ((existing.pending + paymentState.balance) * 100.0).roundToInt() / 100.0
                )
            }
        }

        val topCustomers = customerMap.values.sortedWith(
            compareByDescending<TopCustomerItem> { it.total }
                .thenBy { it.name }
        )

        return SalesReportData(
            count = filteredReceipts.size,
            total = (total * 100.0).roundToInt() / 100.0,
            paid = (paid * 100.0).roundToInt() / 100.0,
            pending = (pending * 100.0).roundToInt() / 100.0,
            topCustomers = topCustomers
        )
    }
}
