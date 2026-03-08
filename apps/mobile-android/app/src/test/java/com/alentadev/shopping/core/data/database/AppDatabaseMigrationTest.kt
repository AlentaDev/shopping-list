package com.alentadev.shopping.core.data.database

import androidx.sqlite.db.SupportSQLiteDatabase
import io.mockk.mockk
import io.mockk.verify
import org.junit.Test

class AppDatabaseMigrationTest {

    @Test
    fun `migration 3 to 4 creates pending sync table and unique index`() {
        val database = mockk<SupportSQLiteDatabase>(relaxed = true)

        MIGRATION_3_4.migrate(database)

        verify {
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
}
