package com.alentadev.shopping.core.data.database.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Update
import com.alentadev.shopping.core.data.database.entity.UserEntity
import com.alentadev.shopping.core.data.database.entity.ListEntity
import com.alentadev.shopping.core.data.database.entity.ItemEntity
import com.alentadev.shopping.core.data.database.entity.SyncMetadataEntity
import kotlinx.coroutines.flow.Flow

// ============================================================================
// USER DAO
// ============================================================================

@Dao
interface UserDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(user: UserEntity)

    @Query("SELECT * FROM users WHERE id = :id")
    suspend fun getUserById(id: String): UserEntity?

    @Query("SELECT * FROM users LIMIT 1")
    suspend fun getUser(): UserEntity?

    @Update
    suspend fun update(user: UserEntity)

    @Delete
    suspend fun delete(user: UserEntity)

    @Query("DELETE FROM users")
    suspend fun deleteAll()
}

// ============================================================================
// LIST DAO
// ============================================================================

@Dao
interface ListEntityDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(list: ListEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(lists: List<ListEntity>)

    @Query("SELECT * FROM lists WHERE id = :id")
    suspend fun getListById(id: String): ListEntity?

    @Query("SELECT * FROM lists WHERE status = :status ORDER BY updatedAt DESC")
    suspend fun getListsByStatus(status: String): List<ListEntity>

    @Query("SELECT * FROM lists ORDER BY updatedAt DESC")
    fun getAllListsFlow(): Flow<List<ListEntity>>

    @Query("SELECT * FROM lists WHERE status = :status ORDER BY updatedAt DESC")
    fun getListsByStatusFlow(status: String): Flow<List<ListEntity>>

    @Query("SELECT * FROM lists WHERE id = :id")
    fun getListByIdFlow(id: String): Flow<ListEntity?>

    @Update
    suspend fun update(list: ListEntity)

    @Delete
    suspend fun delete(list: ListEntity)

    @Query("DELETE FROM lists WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM lists")
    suspend fun deleteAll()
}

// ============================================================================
// ITEM DAO
// ============================================================================

@Dao
interface ItemEntityDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(item: ItemEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<ItemEntity>)

    @Query("SELECT * FROM items WHERE id = :id")
    suspend fun getItemById(id: String): ItemEntity?

    @Query("SELECT * FROM items WHERE listId = :listId ORDER BY name ASC")
    suspend fun getItemsByListId(listId: String): List<ItemEntity>

    @Query("SELECT * FROM items WHERE listId = :listId ORDER BY name ASC")
    fun getItemsByListIdFlow(listId: String): Flow<List<ItemEntity>>

    @Query("SELECT * FROM items WHERE listId = :listId AND checked = 1")
    suspend fun getCheckedItemsByListId(listId: String): List<ItemEntity>

    @Update
    suspend fun update(item: ItemEntity)

    @Query("UPDATE items SET checked = :checked WHERE id = :id")
    suspend fun updateCheckStatus(id: String, checked: Boolean)

    @Delete
    suspend fun delete(item: ItemEntity)

    @Query("DELETE FROM items WHERE id = :id")
    suspend fun deleteById(id: String)

    @Query("DELETE FROM items WHERE listId = :listId")
    suspend fun deleteByListId(listId: String)

    @Query("DELETE FROM items")
    suspend fun deleteAll()
}

// ============================================================================
// SYNC METADATA DAO
// ============================================================================

@Dao
interface SyncMetadataDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insert(metadata: SyncMetadataEntity)

    @Query("SELECT * FROM sync_metadata WHERE key = :key")
    suspend fun getByKey(key: String): SyncMetadataEntity?

    @Query("SELECT value FROM sync_metadata WHERE key = :key")
    suspend fun getValueByKey(key: String): String?

    @Update
    suspend fun update(metadata: SyncMetadataEntity)

    @Delete
    suspend fun delete(metadata: SyncMetadataEntity)

    @Query("DELETE FROM sync_metadata")
    suspend fun deleteAll()
}

