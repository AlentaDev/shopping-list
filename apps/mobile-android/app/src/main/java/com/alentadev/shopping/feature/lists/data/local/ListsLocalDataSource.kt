package com.alentadev.shopping.feature.lists.data.local

import com.alentadev.shopping.feature.lists.domain.entity.ShoppingList
import com.alentadev.shopping.feature.lists.domain.entity.ListStatus
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

/**
 * Data source local para acceso a listas guardadas en Room
 * Se usa para offline-first: caché local de listas
 */
class ListsLocalDataSource @Inject constructor(
    private val listDao: ListDao
) {

    /**
     * Obtiene las listas activas guardadas localmente en tiempo real
     * @return Flow de lista de listas activas (observable)
     */
    fun getActiveListsFlow(): Flow<List<ShoppingList>> {
        return listDao.getActiveListsFlow().map { entities ->
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
        listDao.insertList(list.toEntity())
    }

    /**
     * Guarda múltiples listas (batch insert)
     * @param lists Lista de ShoppingList a guardar
     */
    suspend fun saveLists(lists: List<ShoppingList>) {
        listDao.insertLists(lists.map { it.toEntity() })
    }

    /**
     * Elimina todas las listas locales
     * Útil para logout
     */
    suspend fun deleteAll() {
        listDao.deleteAll()
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
            updatedAt = updatedAt,
            itemCount = itemCount
        )
    }

    private fun ShoppingList.toEntity(): ListEntity {
        return ListEntity(
            id = id,
            title = title,
            status = status.name,
            updatedAt = updatedAt,
            itemCount = itemCount,
            syncedAt = System.currentTimeMillis()
        )
    }
}

