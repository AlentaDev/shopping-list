package com.alentadev.shopping.core.session.di

import com.alentadev.shopping.core.session.LogoutLocalDataCleaner
import com.alentadev.shopping.feature.lists.data.cleanup.ListsLogoutLocalDataCleaner
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class SessionCleanupModule {

    @Binds
    @Singleton
    abstract fun bindLogoutLocalDataCleaner(
        impl: ListsLogoutLocalDataCleaner
    ): LogoutLocalDataCleaner
}
