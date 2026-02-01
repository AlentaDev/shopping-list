package com.alentadev.shopping.feature.auth.di

import com.alentadev.shopping.feature.auth.data.local.AuthLocalDataSource
import com.alentadev.shopping.feature.auth.data.remote.AuthRemoteDataSource
import com.alentadev.shopping.feature.auth.data.repository.AuthRepositoryImpl
import com.alentadev.shopping.feature.auth.domain.repository.AuthRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AuthModule {

    @Singleton
    @Provides
    fun provideAuthRepository(
        remoteDataSource: AuthRemoteDataSource,
        localDataSource: AuthLocalDataSource
    ): AuthRepository {
        return AuthRepositoryImpl(remoteDataSource, localDataSource)
    }
}

