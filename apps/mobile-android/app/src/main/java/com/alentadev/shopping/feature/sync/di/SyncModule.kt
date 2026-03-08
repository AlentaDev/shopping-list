package com.alentadev.shopping.feature.sync.di

import com.alentadev.shopping.feature.sync.application.ListsWarmupService
import com.alentadev.shopping.feature.sync.application.ListsWarmupServiceImpl
import com.alentadev.shopping.feature.sync.application.SyncCoordinator
import com.alentadev.shopping.feature.sync.application.SyncCoordinatorImpl
import com.alentadev.shopping.feature.sync.domain.DefaultRefreshDecisionPolicy
import com.alentadev.shopping.feature.sync.domain.RefreshDecisionPolicy
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class SyncModule {

    @Binds
    @Singleton
    abstract fun bindSyncCoordinator(impl: SyncCoordinatorImpl): SyncCoordinator

    @Binds
    @Singleton
    abstract fun bindListsWarmupService(impl: ListsWarmupServiceImpl): ListsWarmupService

    @Binds
    @Singleton
    abstract fun bindRefreshDecisionPolicy(impl: DefaultRefreshDecisionPolicy): RefreshDecisionPolicy
}
