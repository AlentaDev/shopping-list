package com.alentadev.shopping.core.data.database

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase
import com.alentadev.shopping.core.data.database.entity.UserEntity
import com.alentadev.shopping.core.data.database.entity.ListEntity
import com.alentadev.shopping.core.data.database.entity.ItemEntity
import com.alentadev.shopping.core.data.database.entity.SyncMetadataEntity
import com.alentadev.shopping.core.data.database.entity.PendingSyncEntity
import com.alentadev.shopping.core.data.database.dao.UserDao
import com.alentadev.shopping.core.data.database.dao.ListEntityDao
import com.alentadev.shopping.core.data.database.dao.ItemEntityDao
import com.alentadev.shopping.core.data.database.dao.SyncMetadataDao
import com.alentadev.shopping.core.data.database.dao.PendingSyncDao

@Database(
    entities = [
        UserEntity::class,
        ListEntity::class,
        ItemEntity::class,
        SyncMetadataEntity::class,
        PendingSyncEntity::class
    ],
    version = 4,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun listEntityDao(): ListEntityDao
    abstract fun itemEntityDao(): ItemEntityDao
    abstract fun syncMetadataDao(): SyncMetadataDao
    abstract fun pendingSyncDao(): PendingSyncDao
}



val MIGRATION_2_3 = object : Migration(2, 3) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE lists ADD COLUMN itemCount INTEGER NOT NULL DEFAULT 0")
    }
}


val MIGRATION_3_4 = object : Migration(3, 4) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL(
            """
            CREATE TABLE IF NOT EXISTS pending_sync (
                operationId TEXT NOT NULL PRIMARY KEY,
                listId TEXT NOT NULL,
                itemId TEXT NOT NULL,
                checked INTEGER NOT NULL,
                localUpdatedAt INTEGER NOT NULL,
                retryCount INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'pending'
            )
            """.trimIndent()
        )
        database.execSQL(
            "CREATE UNIQUE INDEX IF NOT EXISTS index_pending_sync_listId_itemId ON pending_sync(listId, itemId)"
        )
    }
}
