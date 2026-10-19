package com.aistudio.sabtools.data

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import kotlinx.coroutines.flow.Flow

@Dao
interface ReceiptDao {
    @Query("SELECT * FROM timber_receipts ORDER BY date DESC, createdAt DESC")
    fun getAllTimberReceipts(): Flow<List<TimberReceiptEntity>>

    @Query("SELECT * FROM timber_receipts WHERE id = :id LIMIT 1")
    suspend fun getTimberReceiptById(id: String): TimberReceiptEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTimberReceipt(receipt: TimberReceiptEntity)

    @Update
    suspend fun updateTimberReceipt(receipt: TimberReceiptEntity)

    @Query("DELETE FROM timber_receipts WHERE id = :id")
    suspend fun deleteTimberReceipt(id: String)

    @Query("SELECT * FROM round_receipts ORDER BY createdAt DESC")
    fun getAllRoundReceipts(): Flow<List<RoundReceiptEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRoundReceipt(receipt: RoundReceiptEntity)

    @Query("DELETE FROM round_receipts WHERE id = :id")
    suspend fun deleteRoundReceipt(id: String)
}

@Dao
interface StoreProfileDao {
    @Query("SELECT * FROM store_profile WHERE id = 1 LIMIT 1")
    fun getStoreProfile(): Flow<StoreProfileEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun saveStoreProfile(profile: StoreProfileEntity)
}
