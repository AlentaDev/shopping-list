package com.alentadev.shopping.core.data.database

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
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
    version = 3,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun listEntityDao(): ListEntityDao
    abstract fun itemEntityDao(): ItemEntityDao
    abstract fun syncMetadataDao(): SyncMetadataDao
}


val MIGRATION_2_3 = object : Migration(2, 3) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE lists ADD COLUMN itemCount INTEGER NOT NULL DEFAULT 0")
    }
}
