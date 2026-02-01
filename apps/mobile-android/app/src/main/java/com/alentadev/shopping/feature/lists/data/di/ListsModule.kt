package com.alentadev.shopping.feature.lists.data.di

import com.alentadev.shopping.feature.lists.domain.repository.ListsRepository
import com.alentadev.shopping.feature.lists.data.repository.ListsRepositoryImpl
import com.alentadev.shopping.feature.lists.data.remote.ListsApi
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import retrofit2.Retrofit
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class ListsModule {

    /**
     * Bind ListsRepositoryImpl a la interfaz ListsRepository
     * para inyección de dependencias con Hilt
     */
    @Binds
    @Singleton
    abstract fun bindListsRepository(
        impl: ListsRepositoryImpl
    ): ListsRepository

    companion object {
        /**
         * Provee ListsApi (Retrofit interface)
         * Obtenida del Retrofit singleton
         */
        @Provides
        @Singleton
        fun provideListsApi(retrofit: Retrofit): ListsApi {
            return retrofit.create(ListsApi::class.java)
        }
    }
}



