package com.alentadev.shopping.core.data.database

import androidx.room.Database
import androidx.room.RoomDatabase
import com.alentadev.shopping.core.data.database.entity.UserEntity
import com.alentadev.shopping.core.data.database.entity.ListEntity
import com.alentadev.shopping.core.data.database.entity.ItemEntity
import com.alentadev.shopping.core.data.database.entity.SyncMetadataEntity
import com.alentadev.shopping.core.data.database.dao.UserDao
import com.alentadev.shopping.core.data.database.dao.ListEntityDao
import com.alentadev.shopping.core.data.database.dao.ItemEntityDao
import com.alentadev.shopping.core.data.database.dao.SyncMetadataDao

@Database(
    entities = [
        UserEntity::class,
        ListEntity::class,
        ItemEntity::class,
        SyncMetadataEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun listEntityDao(): ListEntityDao
    abstract fun itemEntityDao(): ItemEntityDao
    abstract fun syncMetadataDao(): SyncMetadataDao
}

