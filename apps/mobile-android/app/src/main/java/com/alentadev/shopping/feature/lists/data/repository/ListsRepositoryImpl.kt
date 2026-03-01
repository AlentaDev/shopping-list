package com.alentadev.shopping.feature.lists.data.repository

import com.alentadev.shopping.feature.lists.domain.entity.ShoppingList
import com.alentadev.shopping.feature.lists.domain.repository.ListsRepository
import com.alentadev.shopping.feature.lists.data.remote.ListsRemoteDataSource
import com.alentadev.shopping.feature.lists.data.local.ListsLocalDataSource
import javax.inject.Inject

/**
 * Implementación de ListsRepository
 * Combina remote + local con estrategia offline-first
 */
class ListsRepositoryImpl @Inject constructor(
    private val remoteDataSource: ListsRemoteDataSource,
    private val localDataSource: ListsLocalDataSource
) : ListsRepository {


    /**
     * Obtiene listas activas una sola vez
     * Intenta obtener del servidor, si falla usa caché
     * @return Lista de listas activas
     */
    override suspend fun getActiveLists(): List<ShoppingList> {
        return try {
            // Intenta obtener del servidor
            val lists = remoteDataSource.getActiveLists()
            // Guarda en local para caché
            localDataSource.saveLists(lists)
            lists
        } catch (exception: Exception) {
            // Si falla, relanza la excepción sin fallback a caché
            throw exception
        }
    }

    /**
     * Recarga las listas desde el servidor (manual refresh)
     * Actualiza el caché local
     * @return Lista actualizada desde servidor
     * @throws Exception si hay error de red (sin fallback)
     */
    override suspend fun refreshActiveLists(): List<ShoppingList> {
        // Obtiene del servidor (sin fallback local)
        val lists = remoteDataSource.getActiveLists()
        // Guarda en local para próxima vez
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
        return try {
            remoteDataSource.getListDetail(listId)
        } catch (_: Exception) {
            localDataSource.getListById(listId)
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

    override suspend fun getActiveListsWithSource(): com.alentadev.shopping.feature.lists.domain.entity.ActiveListsResult {
        return try {
            val lists = remoteDataSource.getActiveLists()
            localDataSource.saveLists(lists)
            com.alentadev.shopping.feature.lists.domain.entity.ActiveListsResult(
                lists = lists,
                fromCache = false
            )
        } catch (_: Exception) {
            val cached = localDataSource.getActiveListsOnce()
            com.alentadev.shopping.feature.lists.domain.entity.ActiveListsResult(
                lists = cached,
                fromCache = true
            )
        }
    }
}
