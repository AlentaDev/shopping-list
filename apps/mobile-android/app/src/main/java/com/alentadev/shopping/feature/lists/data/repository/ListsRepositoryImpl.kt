package com.alentadev.shopping.feature.lists.data.repository

import com.alentadev.shopping.core.data.network.DataSource
import com.alentadev.shopping.core.data.network.OfflineFirstExecutor
import com.alentadev.shopping.core.data.network.OfflineFirstResult
import com.alentadev.shopping.feature.lists.data.local.ListsLocalDataSource
import com.alentadev.shopping.feature.lists.data.remote.ListsRemoteDataSource
import com.alentadev.shopping.feature.lists.domain.entity.ActiveListsResult
import com.alentadev.shopping.feature.lists.domain.entity.ShoppingList
import com.alentadev.shopping.feature.lists.domain.repository.ListsRepository
import javax.inject.Inject

/**
 * Implementación de ListsRepository
 * Combina remote + local con estrategia offline-first
 */
class ListsRepositoryImpl @Inject constructor(
    private val remoteDataSource: ListsRemoteDataSource,
    private val localDataSource: ListsLocalDataSource,
    private val offlineFirstExecutor: OfflineFirstExecutor
) : ListsRepository {

    /**
     * Obtiene listas activas una sola vez
     * Intenta obtener del servidor, si falla devuelve error
     * @return Lista de listas activas
     */
    override suspend fun getActiveLists(): List<ShoppingList> {
        val lists = remoteDataSource.getActiveLists()
        localDataSource.saveLists(lists)
        return lists
    }

    /**
     * Recarga las listas desde el servidor (manual refresh)
     * Actualiza el caché local
     * @return Lista actualizada desde servidor
     * @throws Exception si hay error de red (sin fallback)
     */
    override suspend fun refreshActiveLists(): List<ShoppingList> {
        val lists = remoteDataSource.getActiveLists()
        localDataSource.saveLists(lists)
        return lists
    }

    /**
     * Obtiene una lista específica por ID
     * Intenta servidor primero, luego caché
     * @param listId ID de la lista
     * @return ShoppingList o null
     */
    override suspend fun getListById(listId: String): ShoppingList? {
        return when (
            val result = offlineFirstExecutor.execute(
                isOnlineNow = { true },
                fetchRemote = { remoteDataSource.getListDetail(listId) },
                saveRemote = { },
                readLocal = { localDataSource.getListById(listId) }
            )
        ) {
            is OfflineFirstResult.Success -> result.data
            is OfflineFirstResult.Error -> throw result.throwable
        }
    }

    /**
     * Obtiene listas activas con fuente preferida
     * 1. Intenta obtener del servidor y guardar en caché
     * 2. Si falla, obtiene de la caché local
     * @return Resultado con listas y origen (servidor/caché)
     */
    override suspend fun getCachedActiveLists(): List<ShoppingList> {
        return localDataSource.getActiveListsOnce()
    }

    override suspend fun getActiveListsWithSource(): ActiveListsResult {
        return when (
            val result = offlineFirstExecutor.execute(
                isOnlineNow = { true },
                fetchRemote = { remoteDataSource.getActiveLists() },
                saveRemote = { lists -> localDataSource.saveLists(lists) },
                readLocal = { localDataSource.getActiveListsOnce() }
            )
        ) {
            is OfflineFirstResult.Success -> ActiveListsResult(
                lists = result.data,
                fromCache = result.source == DataSource.CACHE
            )

            is OfflineFirstResult.Error -> throw result.throwable
        }
    }
}
