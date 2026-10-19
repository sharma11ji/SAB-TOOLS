package com.aistudio.sabtools.model

data class TimberRowItem(
    val id: String,
    val wood: String,
    val length: Double,
    val girth: Double,
    val rate: Double
)

data class TimberTotals(
    val unit: String,
    val volumes: List<Double>,
    val volume: Double,
    val amounts: List<Double>,
    val cft: Double,
    val woodValue: Double,
    val total: Double,
    val labour: Double,
    val transport: Double,
    val advance: Double,
    val balance: Double,
    val valid: Boolean
)

data class PaymentState(
    val total: Double,
    val paid: Double,
    val balance: Double,
    val status: String // "paid" or "pending"
)

data class CustomerSummary(
    val key: String,
    val name: String,
    val village: String,
    val phone: String,
    val total: Double,
    val pending: Double,
    val lastDate: String,
    val receipts: List<CustomerReceiptItem>
)

data class CustomerReceiptItem(
    val receiptId: String,
    val receiptNumber: String,
    val date: String,
    val total: Double,
    val balance: Double,
    val status: String
)

data class SalesReportData(
    val count: Int,
    val total: Double,
    val paid: Double,
    val pending: Double,
    val topCustomers: List<TopCustomerItem>
)

data class TopCustomerItem(
    val key: String,
    val name: String,
    val village: String,
    val count: Int,
    val total: Double,
    val pending: Double
)
