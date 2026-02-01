package com.alentadev.shopping.feature.lists.domain.usecase

import com.alentadev.shopping.feature.lists.domain.entity.ShoppingList
import com.alentadev.shopping.feature.lists.domain.repository.ListsRepository
import javax.inject.Inject

/**
 * Caso de uso para refrescar (recargar) las listas activas desde el servidor
 * Útil para operaciones manual del usuario (pull-to-refresh)
 */
class RefreshListsUseCase @Inject constructor(
    private val listsRepository: ListsRepository
) {
    /**
     * Recarga las listas activas desde el servidor
     * Puede fallar si no hay conexión de red
     * @return Lista de ShoppingList actualizada desde servidor
     * @throws Exception si hay error de red o servidor
     */
    suspend fun execute(): List<ShoppingList> {
        return listsRepository.refreshActiveLists()
    }
}

