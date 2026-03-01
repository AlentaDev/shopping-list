package com.alentadev.shopping.feature.listdetail.domain.usecase

import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import javax.inject.Inject

/**
 * Caso de uso para sincronizar un check de item con el servidor
 *
 * Intenta enviar el cambio de check al servidor.
 * Si no hay red, el cambio se queda local (offline-first).
 */
class SyncCheckUseCase @Inject constructor(
    private val repository: ListDetailRepository
) {
    /**
     * Intenta sincronizar un cambio de check con el servidor
     *
     * @param listId ID de la lista
     * @param itemId ID del item
     * @param checked Nuevo estado del check
     * @return true si la sincronización fue exitosa, false si falló (sin red)
     * @throws IllegalArgumentException si los IDs están vacíos
     */
    suspend operator fun invoke(
        listId: String,
        itemId: String,
        checked: Boolean
    ): Boolean {
        // Validar inputs
        require(listId.isNotBlank()) { "El ID de la lista no puede estar vacío" }
        require(itemId.isNotBlank()) { "El ID del item no puede estar vacío" }

        android.util.Log.d("SyncCheckUseCase", "🔄 Iniciando sincronización - listId: $listId, itemId: $itemId, checked: $checked")

        // Intentar sincronizar con el servidor
        return try {
            repository.syncItemCheck(listId, itemId, checked)
            android.util.Log.d("SyncCheckUseCase", "✅ Sincronización exitosa")
            true // Sincronización exitosa
        } catch (e: Exception) {
            android.util.Log.e("SyncCheckUseCase", "❌ Error en sincronización: ${e.message}", e)
            // Sin red o error del servidor: el cambio ya está local
            false // Sincronización falló
        }
    }
}


