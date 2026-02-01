package com.alentadev.shopping.feature.lists.data.local

import com.alentadev.shopping.feature.lists.domain.entity.ShoppingList
import com.alentadev.shopping.feature.lists.domain.entity.ListStatus
import com.alentadev.shopping.core.data.database.entity.ListEntity
import com.alentadev.shopping.core.data.database.dao.ListEntityDao
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

/**
 * Data source local para acceso a listas guardadas en Room
 * Se usa para offline-first: caché local de listas
 */
class ListsLocalDataSource @Inject constructor(
    private val listDao: ListEntityDao
) {

    /**
     * Obtiene las listas activas guardadas localmente en tiempo real
     * @return Flow de lista de listas activas (observable)
     */
    fun getActiveListsFlow(): Flow<List<ShoppingList>> {
        return listDao.getListsByStatusFlow("ACTIVE").map { entities ->
            entities.map { it.toDomain() }
        }
    }

    /**
     * Obtiene una lista específica del cache local
     * @param listId ID de la lista
     * @return ShoppingList o null si no existe
     */
    suspend fun getListById(listId: String): ShoppingList? {
        return listDao.getListById(listId)?.toDomain()
    }

    /**
     * Guarda una lista en la base de datos local
     * Si ya existe, la reemplaza
     * @param list ShoppingList a guardar
     */
    suspend fun saveList(list: ShoppingList) {
        listDao.insert(list.toEntity())
    }

    /**
     * Guarda múltiples listas (batch insert)
     * @param lists Lista de ShoppingList a guardar
     */
    suspend fun saveLists(lists: List<ShoppingList>) {
        listDao.insertAll(lists.map { it.toEntity() })
    }

    /**
     * Elimina todas las listas locales
     * Útil para logout
     */
    suspend fun deleteAll() {
        listDao.deleteAll()
    }

    /**
     * Obtiene listas activas localmente una sola vez (sin Flow)
     */
    suspend fun getActiveListsOnce(): List<ShoppingList> {
        return listDao.getListsByStatus("ACTIVE").map { it.toDomain() }
    }

    // Mappers domain ↔ entity

    private fun ListEntity.toDomain(): ShoppingList {
        return ShoppingList(
            id = id,
            title = title,
            status = when (status) {
                "DRAFT" -> ListStatus.DRAFT
                "ACTIVE" -> ListStatus.ACTIVE
                "COMPLETED" -> ListStatus.COMPLETED
                else -> ListStatus.ACTIVE
            },
            updatedAt = updatedAt.toLongOrNull() ?: 0L,
            itemCount = 0  // No disponible en la entidad global, usar 0 por defecto
        )
    }

    private fun ShoppingList.toEntity(): ListEntity {
        return ListEntity(
            id = id,
            title = title,
            status = status.name,
            updatedAt = updatedAt.toString(),
            syncedAt = System.currentTimeMillis()
        )
    }
}
