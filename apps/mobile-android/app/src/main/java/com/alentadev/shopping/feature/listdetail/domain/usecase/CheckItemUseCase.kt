package com.alentadev.shopping.feature.listdetail.domain.usecase

import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import javax.inject.Inject

/**
 * Caso de uso: Marcar/desmarcar un item de la lista
 *
 * Responsabilidades:
 * - Validar IDs de lista e item
 * - Alternar el estado checked del item (toggle)
 * - Delegar al repositorio para actualizar offline-first
 *
 * Patrón: Single Responsibility Principle
 * Operación offline-first: se actualiza localmente sin necesidad de conexión
 */
class CheckItemUseCase @Inject constructor(
    private val repository: ListDetailRepository
) {
    /**
     * Ejecuta el caso de uso para marcar/desmarcar un item
     *
     * @param listId ID de la lista (debe ser no vacío)
     * @param itemId ID del item (debe ser no vacío)
     * @param checked Nuevo estado de checked (true = marcado, false = desmarcado)
     * @throws IllegalArgumentException si listId o itemId son vacíos
     * @throws Exception si hay error al actualizar
     */
    suspend operator fun invoke(listId: String, itemId: String, checked: Boolean) {
        require(listId.isNotBlank()) { "El ID de la lista no puede estar vacío" }
        require(itemId.isNotBlank()) { "El ID del item no puede estar vacío" }

        android.util.Log.d("CheckItemUseCase", "📝 Actualizando item local - listId: $listId, itemId: $itemId, checked: $checked")
        repository.updateItemChecked(listId, itemId, checked)
        android.util.Log.d("CheckItemUseCase", "✅ Item actualizado localmente")
    }
}

