package com.alentadev.shopping.feature.listdetail.domain.usecase

import com.alentadev.shopping.feature.listdetail.domain.repository.ListDetailRepository
import javax.inject.Inject

/**
 * Caso de uso para detectar si la lista fue modificada remotamente
 *
 * Compara el timestamp local con el del servidor para saber
 * si ha habido cambios en la web que deberían sincronizarse.
 */
class DetectRemoteChangesUseCase @Inject constructor(
    private val repository: ListDetailRepository
) {
    /**
     * Detecta si la lista fue modificada en el servidor
     *
     * Compara el timestamp local con el remoto y retorna
     * true si ha habido cambios que el usuario debe revisar.
     *
     * @param listId ID de la lista
     * @return true si hay cambios remotos detectados, false en caso contrario
     * @throws IllegalArgumentException si listId está vacío
     * @throws Exception si hay error al detectar cambios
     */
    suspend operator fun invoke(listId: String): Boolean {
        require(listId.isNotBlank()) { "El ID de la lista no puede estar vacío" }

        return try {
            // En FASE 3.5, la detección de cambios remotos es básica:
            // Se implementará completamente en FASE 5 con comparación de timestamps
            // Por ahora, retornamos false (no hay cambios remotos detectados)
            // La lógica será:
            // 1. Obtener timestamp local del snapshot
            // 2. Obtener timestamp remoto del servidor
            // 3. Comparar y retornar true si remoto > local
            false
        } catch (e: Exception) {
            // Error al detectar: asumir que hay cambios (être conservador)
            throw e
        }
    }
}

