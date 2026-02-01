package com.alentadev.shopping.feature.lists.domain.usecase

import com.alentadev.shopping.feature.lists.domain.entity.ShoppingList
import com.alentadev.shopping.feature.lists.domain.repository.ListsRepository
import javax.inject.Inject

/**
 * Caso de uso para obtener las listas activas del usuario
 * Recupera solo listas con status=ACTIVE
 */
class GetActiveListsUseCase @Inject constructor(
    private val listsRepository: ListsRepository
) {
    /**
     * Obtiene todas las listas activas
     * @return Lista de ShoppingList con status ACTIVE
     * @throws Exception si hay error de red o persistencia
     */
    suspend fun execute(): List<ShoppingList> {
        val allLists = listsRepository.getActiveLists()

        // Validar que todas sean activas (defensa en profundidad)
        require(allLists.all { it.isActive() }) {
            "El repositorio devolvió listas que no son activas"
        }

        // Ordenar por fecha de actualización (más recientes primero)
        return allLists.sortedByDescending { it.updatedAt }
    }
}

