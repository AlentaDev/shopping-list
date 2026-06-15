package com.alentadev.shopping.core.data.database

import androidx.sqlite.db.SupportSQLiteDatabase
import androidx.sqlite.db.SupportSQLiteOpenHelper
import androidx.sqlite.db.framework.FrameworkSQLiteOpenHelperFactory
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class AppDatabaseProviderNameMigrationTest {

    @Test
    fun migration6To7_addsProviderNameAndPreservesExistingListData() {
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val databaseName = "provider-name-migration-${System.currentTimeMillis()}"
        val factory = FrameworkSQLiteOpenHelperFactory()

        context.deleteDatabase(databaseName)

        createVersion6Database(factory, context, databaseName)

        val migratedHelper = factory.create(
            SupportSQLiteOpenHelper.Configuration.builder(context)
                .name(databaseName)
                .callback(
                    object : SupportSQLiteOpenHelper.Callback(7) {
                        override fun onCreate(db: SupportSQLiteDatabase) = Unit

                        override fun onUpgrade(
                            db: SupportSQLiteDatabase,
                            oldVersion: Int,
                            newVersion: Int
                        ) {
                            if (oldVersion == 6 && newVersion == 7) {
                                MIGRATION_6_7.migrate(db)
                            }
                        }
                    }
                )
                .build()
        )

        val db = migratedHelper.writableDatabase
        try {
            db.query("PRAGMA table_info(lists)").use { cursor ->
                val columnNames = mutableListOf<String>()
                val nameIndex = cursor.getColumnIndex("name")
                while (cursor.moveToNext()) {
                    columnNames += cursor.getString(nameIndex)
                }
                assertTrue(columnNames.contains("providerName"))
            }

            db.query("SELECT id, title, itemCount, providerName FROM lists WHERE id = 'list-1'").use { cursor ->
                assertTrue(cursor.moveToFirst())
                assertEquals("list-1", cursor.getString(cursor.getColumnIndexOrThrow("id")))
                assertEquals("Compra semanal", cursor.getString(cursor.getColumnIndexOrThrow("title")))
                assertEquals(3, cursor.getInt(cursor.getColumnIndexOrThrow("itemCount")))
                assertEquals("", cursor.getString(cursor.getColumnIndexOrThrow("providerName")))
            }
        } finally {
            db.close()
        }

        migratedHelper.close()
        context.deleteDatabase(databaseName)
    }

    private fun createVersion6Database(
        factory: FrameworkSQLiteOpenHelperFactory,
        context: android.content.Context,
        databaseName: String
    ) {
        val helper = factory.create(
            SupportSQLiteOpenHelper.Configuration.builder(context)
                .name(databaseName)
                .callback(
                    object : SupportSQLiteOpenHelper.Callback(6) {
                        override fun onCreate(db: SupportSQLiteDatabase) {
                            db.execSQL(
                                """
                                CREATE TABLE IF NOT EXISTS lists (
                                    id TEXT NOT NULL PRIMARY KEY,
                                    title TEXT NOT NULL,
                                    status TEXT NOT NULL,
                                    updatedAt TEXT NOT NULL,
                                    itemCount INTEGER NOT NULL DEFAULT 0,
                                    syncedAt INTEGER NOT NULL DEFAULT 0
                                )
                                """.trimIndent()
                            )
                            db.execSQL(
                                "INSERT INTO lists (id, title, status, updatedAt, itemCount, syncedAt) VALUES ('list-1', 'Compra semanal', 'ACTIVE', '1000', 3, 5000)"
                            )
                        }

                        override fun onUpgrade(
                            db: SupportSQLiteDatabase,
                            oldVersion: Int,
                            newVersion: Int
                        ) = Unit
                    }
                )
                .build()
        )

        helper.writableDatabase.close()
        helper.close()
    }
}
