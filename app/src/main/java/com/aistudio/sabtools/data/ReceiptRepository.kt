package com.aistudio.sabtools.data

import com.aistudio.sabtools.model.StoreProfileData
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class ReceiptRepository(private val db: AppDatabase) {
    private val receiptDao = db.receiptDao()
    private val storeProfileDao = db.storeProfileDao()

    val allTimberReceipts: Flow<List<TimberReceiptEntity>> = receiptDao.getAllTimberReceipts()
    val allRoundReceipts: Flow<List<RoundReceiptEntity>> = receiptDao.getAllRoundReceipts()

    suspend fun saveTimberReceipt(receipt: TimberReceiptEntity) {
        receiptDao.insertTimberReceipt(receipt)
    }

    suspend fun updateTimberReceipt(receipt: TimberReceiptEntity) {
        receiptDao.updateTimberReceipt(receipt)
    }

    suspend fun deleteTimberReceipt(id: String) {
        receiptDao.deleteTimberReceipt(id)
    }

    suspend fun saveRoundReceipt(receipt: RoundReceiptEntity) {
        receiptDao.insertRoundReceipt(receipt)
    }

    suspend fun deleteRoundReceipt(id: String) {
        receiptDao.deleteRoundReceipt(id)
    }

    val storeProfile: Flow<StoreProfileData> = storeProfileDao.getStoreProfile().map { entity ->
        StoreProfileData(
            storeName = entity?.storeName ?: "",
            ownerName = entity?.ownerName ?: "",
            address = entity?.address ?: "",
            mobile = entity?.mobile ?: ""
        )
    }

    suspend fun saveStoreProfile(data: StoreProfileData) {
        storeProfileDao.saveStoreProfile(
            StoreProfileEntity(
                id = 1,
                storeName = data.storeName,
                ownerName = data.ownerName,
                address = data.address,
                mobile = data.mobile
            )
        )
    }
}
