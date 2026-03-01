package com.alentadev.shopping.feature.listdetail.data.di

import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import com.alentadev.shopping.feature.listdetail.data.repository.ListDetailRepositoryImpl
import com.alentadev.shopping.feature.listdetail.data.remote.ListDetailApi
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class ListDetailModule {

    /**
     * Bind ListDetailRepositoryImpl a la interfaz ListDetailRepository
     * para inyección de dependencias con Hilt
     */
    @Binds
    @Singleton
    abstract fun bindListDetailRepository(
        impl: ListDetailRepositoryImpl
    ): ListDetailRepository

    companion object {
        /**
         * Provee ListDetailApi (Retrofit interface)
         * Obtenida del Retrofit singleton
         */
        @Provides
        @Singleton
        fun provideListDetailApi(retrofit: Retrofit): ListDetailApi {
            return retrofit.create(ListDetailApi::class.java)
        }
    }
}

