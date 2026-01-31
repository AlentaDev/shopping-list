package com.alentadev.shopping.core.data.di

import android.content.Context
import androidx.room.Room
import com.alentadev.shopping.core.data.database.AppDatabase
import com.alentadev.shopping.core.data.database.dao.UserDao
import com.alentadev.shopping.core.data.database.dao.ListEntityDao
import com.alentadev.shopping.core.data.database.dao.ItemEntityDao
import com.alentadev.shopping.core.data.database.dao.SyncMetadataDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Singleton
    @Provides
    fun provideAppDatabase(
        @ApplicationContext context: Context
    ): AppDatabase {
        return Room.databaseBuilder(
            context,
            AppDatabase::class.java,
            "shopping_list_db"
        ).build()
    }

    @Singleton
    @Provides
    fun provideUserDao(database: AppDatabase): UserDao = database.userDao()

    @Singleton
    @Provides
    fun provideListEntityDao(database: AppDatabase): ListEntityDao = database.listEntityDao()

    @Singleton
    @Provides
    fun provideItemEntityDao(database: AppDatabase): ItemEntityDao = database.itemEntityDao()

    @Singleton
    @Provides
    fun provideSyncMetadataDao(database: AppDatabase): SyncMetadataDao = database.syncMetadataDao()
}

