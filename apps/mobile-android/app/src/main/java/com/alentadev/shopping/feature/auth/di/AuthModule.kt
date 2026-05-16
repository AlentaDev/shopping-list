package com.alentadev.shopping.feature.auth.di

import com.alentadev.shopping.feature.auth.data.local.AuthLocalDataSource
import com.alentadev.shopping.feature.auth.data.remote.AuthRemoteDataSource
import com.alentadev.shopping.feature.auth.data.repository.AuthRepositoryImpl
import com.alentadev.shopping.feature.auth.domain.repository.AuthRepository
import com.alentadev.shopping.core.session.LogoutLocalDataCleaner
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.Dispatchers
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AuthModule {

    @Singleton
    @Provides
    fun provideAuthRepository(
        remoteDataSource: AuthRemoteDataSource,
        localDataSource: AuthLocalDataSource,
        logoutLocalDataCleaner: LogoutLocalDataCleaner
    ): AuthRepository {
        return AuthRepositoryImpl(remoteDataSource, localDataSource, logoutLocalDataCleaner)
    }

    @Singleton
    @Provides
    fun provideCoroutineDispatcher(): CoroutineDispatcher = Dispatchers.IO
}
