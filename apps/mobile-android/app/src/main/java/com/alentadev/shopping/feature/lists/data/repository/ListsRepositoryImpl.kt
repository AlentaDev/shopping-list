package com.alentadev.shopping.feature.lists.data.repository

import com.alentadev.shopping.feature.lists.domain.entity.ShoppingList
import com.alentadev.shopping.feature.lists.domain.repository.ListsRepository
import com.alentadev.shopping.feature.lists.data.remote.ListsRemoteDataSource
import com.alentadev.shopping.feature.lists.data.local.ListsLocalDataSource
import kotlinx.coroutines.flow.Flow
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
     * Obtiene listas activas con estrategia offline-first
     * 1. Devuelve caché local si existe
     * 2. Intenta actualizar desde servidor
     * 3. Guarda actualización en local
     * @return Flow observable de listas activas
     */
    override fun getActiveListsFlow(): Flow<List<ShoppingList>> {
        return localDataSource.getActiveListsFlow()
    }

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
        } catch (e: Exception) {
            // Si falla, intenta usar caché (aunque retorna vacío si no existe)
            throw e
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
        } catch (e: Exception) {
            localDataSource.getListById(listId)
        }
    }
}

