package com.alentadev.shopping.feature.listdetail.ui.detail

import com.alentadev.shopping.feature.listdetail.domain.entity.ListDetail

/**
 * Estado de sincronización de cambios
 */
enum class SyncStatus {
    IDLE,      // Sin sincronización en curso
    SYNCING,   // Sincronizando cambios
    SUCCESS,   // Sincronización exitosa
    ERROR      // Error en sincronización
}

/**
 * Estado de la UI para la pantalla de detalle de lista
 *
 * Estados posibles:
 * - Loading: Cargando detalle inicial
 * - Success: Detalle cargado con éxito (con información de cache/sync/cambios remotos)
 * - Error: Error al cargar
 */
sealed class ListDetailUiState {
    /**
     * Estado inicial: Cargando detalle de la lista
     */
    object Loading : ListDetailUiState()

    /**
     * Estado exitoso: Detalle cargado
     *
     * @param listDetail Detalle completo de la lista con items
     * @param total Total calculado de items marcados (en EUR)
     * @param fromCache True si los datos vienen del cache local (sin conexión)
     * @param hasRemoteChanges True si la lista fue modificada en el servidor
     * @param syncStatus Estado actual de la sincronización de cambios
     */
    data class Success(
        val listDetail: ListDetail,
        val total: Double,
        val fromCache: Boolean = false,
        val hasRemoteChanges: Boolean = false,
        val syncStatus: SyncStatus = SyncStatus.IDLE
    ) : ListDetailUiState()

    /**
     * Estado de error: No se pudo cargar el detalle
     *
     * @param message Mensaje de error para mostrar al usuario
     */
    data class Error(val message: String) : ListDetailUiState()
}

