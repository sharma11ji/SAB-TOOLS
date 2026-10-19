package com.aistudio.sabtools.data

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "timber_receipts")
data class TimberReceiptEntity(
    @PrimaryKey val id: String,
    val number: String,
    val date: String,
    val customerName: String,
    val customerMobile: String,
    val village: String,
    val shopName: String,
    val shopAddress: String,
    val shopMobile: String,
    val unit: String, // "CFT" or "CBM"
    val defaultRate: Double,
    val advance: Double,
    val labour: Double,
    val transport: Double,
    val cft: Double,
    val volume: Double,
    val woodValue: Double,
    val total: Double,
    val balance: Double,
    val status: String, // "paid" or "pending"
    val rawRowsJson: String,
    val createdAt: Long = System.currentTimeMillis(),
    val lastPaymentAt: String? = null
)

@Entity(tableName = "round_receipts")
data class RoundReceiptEntity(
    @PrimaryKey val id: String,
    val date: String,
    val customerName: String,
    val customerAddress: String,
    val customerPhone: String,
    val storeName: String,
    val unit: String,
    val pieces: Int,
    val volume: Double,
    val rate: Double?,
    val amount: Double?,
    val rawRowsJson: String,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "store_profile")
data class StoreProfileEntity(
    @PrimaryKey val id: Int = 1,
    val storeName: String = "",
    val ownerName: String = "",
    val address: String = "",
    val mobile: String = ""
)
