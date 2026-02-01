package com.alentadev.shopping.feature.lists.data.remote

import com.alentadev.shopping.feature.lists.domain.entity.ShoppingList
import com.alentadev.shopping.feature.lists.domain.entity.ListStatus
import com.alentadev.shopping.feature.lists.data.dto.ListSummaryDto
import javax.inject.Inject

/**
 * Data source remoto para obtener listas desde la API
 * Se comunica directamente con ListsApi
 */
class ListsRemoteDataSource @Inject constructor(
    private val listsApi: ListsApi
) {

    /**
     * Obtiene las listas activas del servidor
     * @return Lista de ShoppingList del servidor
     * @throws Exception si hay error de red o servidor
     */
    suspend fun getActiveLists(): List<ShoppingList> {
        val dtos = listsApi.getActiveLists(status = "ACTIVE")
        return dtos.map { it.toDomain() }
    }

    /**
     * Obtiene una lista específica del servidor con sus detalles
     * @param listId ID de la lista
     * @return ShoppingList con detalles
     * @throws Exception si hay error de red o servidor
     */
    suspend fun getListDetail(listId: String): ShoppingList {
        val dto = listsApi.getListDetail(listId)
        return dto.toDomain()
    }

    /**
     * Convierte ListSummaryDto a ShoppingList (domain)
     */
    private fun ListSummaryDto.toDomain(): ShoppingList {
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
}

