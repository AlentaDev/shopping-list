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

enum class CompleteListError {
    OFFLINE,
    NO_CONNECTION,
    INVALID_TRANSITION,
    UNAUTHORIZED,
    FORBIDDEN,
    NOT_FOUND,
    SERVER_ERROR,
    UNKNOWN
}

/**
 * Estado de la UI para la pantalla de detalle de lista
 */
sealed class ListDetailUiState {
    object Loading : ListDetailUiState()

    data class Success(
        val listDetail: ListDetail,
        val total: Double,
        val fromCache: Boolean = false,
        val hasRemoteChanges: Boolean = false,
        val syncStatus: SyncStatus = SyncStatus.IDLE,
        val hasPermanentRefreshError: Boolean = false,
        val showCompleteConfirmation: Boolean = false,
        val isCompleting: Boolean = false,
        val completeListError: CompleteListError? = null
    ) : ListDetailUiState()

    data class Error(val message: String) : ListDetailUiState()
}
