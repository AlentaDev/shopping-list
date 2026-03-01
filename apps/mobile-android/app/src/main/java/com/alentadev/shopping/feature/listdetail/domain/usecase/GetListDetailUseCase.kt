package com.alentadev.shopping.feature.listdetail.domain.usecase

import com.alentadev.shopping.feature.listdetail.domain.entity.ListDetail
import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

/**
 * Caso de uso: Obtener detalle de una lista
 *
 * Responsabilidades:
 * - Validar el ID de la lista
 * - Delegar al repositorio para obtener el detalle
 * - Manejar errores de validación
 *
 * Patrón: Single Responsibility Principle
 */
class GetListDetailUseCase @Inject constructor(
    private val repository: ListDetailRepository
) {
    /**
     * Ejecuta el caso de uso
     *
     * @param listId ID de la lista (debe ser no vacío)
     * @return Flow con el detalle de la lista
     * @throws IllegalArgumentException si listId es vacío
     * @throws Exception si hay error al obtener la lista
     */
    operator fun invoke(listId: String, preferCache: Boolean = false): Flow<ListDetail> {
        require(listId.isNotBlank()) { "El ID de la lista no puede estar vacío" }
        return if (preferCache) {
            repository.getCachedListDetail(listId)
        } else {
            repository.getListDetail(listId)
        }
    }
}

