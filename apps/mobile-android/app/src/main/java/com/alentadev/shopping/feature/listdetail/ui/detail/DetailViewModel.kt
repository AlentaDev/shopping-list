package com.alentadev.shopping.feature.listdetail.ui.detail

import android.util.Log
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.alentadev.shopping.core.network.NetworkMonitor
import com.alentadev.shopping.core.network.resolveConnectivity
import com.alentadev.shopping.feature.listdetail.domain.usecase.CalculateTotalUseCase
import com.alentadev.shopping.feature.listdetail.domain.usecase.CheckItemUseCase
import com.alentadev.shopping.feature.listdetail.domain.usecase.DetectRemoteChangesUseCase
import com.alentadev.shopping.feature.listdetail.domain.usecase.GetListDetailUseCase
import com.alentadev.shopping.feature.listdetail.domain.usecase.SyncCheckUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.launch
import javax.inject.Inject

/**
 * ViewModel para la pantalla de detalle de lista
 *
 * Responsabilidades:
 * - Cargar detalle de lista con items (offline-first)
 * - Gestionar checks de items y sincronización
 * - Detectar cambios remotos cuando se recupera conexión
 * - Calcular total de items marcados
 * - Exponer estado reactivo a la UI con información de offline/sync
 *
 * Patrón: MVVM con StateFlow + NetworkMonitor para offline-first
 */
@HiltViewModel
class DetailViewModel @Inject constructor(
    private val getListDetailUseCase: GetListDetailUseCase,
    private val checkItemUseCase: CheckItemUseCase,
    private val calculateTotalUseCase: CalculateTotalUseCase,
    private val syncCheckUseCase: SyncCheckUseCase,
    private val detectRemoteChangesUseCase: DetectRemoteChangesUseCase,
    private val networkMonitor: NetworkMonitor,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private companion object {
        const val TAG = "DetailViewModel"
    }

    private val listId: String = checkNotNull(savedStateHandle["listId"]) {
        "El ID de la lista es requerido"
    }

    private val _uiState = MutableStateFlow<ListDetailUiState>(ListDetailUiState.Loading)
    val uiState: StateFlow<ListDetailUiState> = _uiState.asStateFlow()

    private val _isConnected = MutableStateFlow(networkMonitor.isCurrentlyConnected())
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    init {
        loadListDetail()
        observeConnectivity()
    }

    /**
     * Observa cambios de conectividad de la red
     * Cuando se recupera conexión, intenta detectar cambios remotos
     */
    private fun observeConnectivity() {
        viewModelScope.launch {
            var wasConnected = true
            networkMonitor.isConnected.collect { connected ->
                _isConnected.value = connected

                // Si acaba de recuperarse la conexión
                if (connected && !wasConnected) {
                    detectRemoteChanges()
                }
                wasConnected = connected
            }
        }
    }

    /**
     * Carga el detalle de la lista
     *
     * Observa cambios en el Flow del repositorio para actualizar
     * el estado cuando cambien los checks localmente.
     * Detecta si los datos vienen del cache local (sin conexión).
     */
    fun loadListDetail() {
        viewModelScope.launch {
            _uiState.value = ListDetailUiState.Loading
            val connectivity = networkMonitor.resolveConnectivity(flowConnected = _isConnected.value)
            Log.d(TAG, "loadListDetail started - flowConnected=${connectivity.flowConnected}, currentConnected=${connectivity.currentConnected}, effectiveConnected=${connectivity.effectiveConnected}")
            val shouldUseCacheOnly = !connectivity.effectiveConnected
            getListDetailUseCase(listId, preferCache = shouldUseCacheOnly)
                .catch { e ->
                    Log.e(TAG, "loadListDetail failed", e)
                    _uiState.value = ListDetailUiState.Error(
                        e.message ?: "Error al cargar la lista"
                    )
                }
                .collect { listDetail ->
                    val total = calculateTotalUseCase(listDetail)
                    val currentState = _uiState.value

                    // Mantener estado de offline y cambios remotos al actualizar
                    val fromCache = (currentState as? ListDetailUiState.Success)?.fromCache ?: shouldUseCacheOnly
                    val hasRemoteChanges = (currentState as? ListDetailUiState.Success)?.hasRemoteChanges ?: false
                    val syncStatus = (currentState as? ListDetailUiState.Success)?.syncStatus ?: SyncStatus.IDLE

                    _uiState.value = ListDetailUiState.Success(
                        listDetail = listDetail,
                        total = total,
                        fromCache = fromCache,
                        hasRemoteChanges = hasRemoteChanges,
                        syncStatus = syncStatus
                    )
                }
        }
    }

    /**
     * Marca/desmarca un item de la lista
     *
     * Operación offline-first: se actualiza localmente siempre.
     * Si hay conexión, se intenta sincronizar con el servidor.
     *
     * @param itemId ID del item a marcar/desmarcar
     * @param checked Nuevo estado (true = marcado, false = desmarcado)
     */
    fun toggleItemCheck(itemId: String, checked: Boolean) {
        viewModelScope.launch {
            try {
                val connectivity = networkMonitor.resolveConnectivity(flowConnected = _isConnected.value)
                Log.d(TAG, "toggleItemCheck started - itemId=$itemId, checked=$checked, flowConnected=${connectivity.flowConnected}, currentConnected=${connectivity.currentConnected}, effectiveConnected=${connectivity.effectiveConnected}")

                // Actualizar localmente
                Log.d(TAG, "toggleItemCheck -> updating local state")
                checkItemUseCase(listId, itemId, checked)
                Log.d(TAG, "toggleItemCheck -> local update success")

                // Intentar sincronizar si hay conexión
                if (connectivity.effectiveConnected) {
                    Log.d(TAG, "toggleItemCheck -> syncing with backend")
                    updateSyncStatus(SyncStatus.SYNCING)

                    val syncSuccess = syncCheckUseCase(listId, itemId, checked)
                    Log.d(TAG, "toggleItemCheck -> sync result success=$syncSuccess")

                    updateSyncStatus(if (syncSuccess) SyncStatus.SUCCESS else SyncStatus.IDLE)
                } else {
                    Log.d(TAG, "toggleItemCheck -> offline, local only")
                }

                // El Flow del repositorio emitirá el estado actualizado
            } catch (e: Exception) {
                Log.e(TAG, "toggleItemCheck failed", e)
                // Los errores se ignoran porque la operación es local
                updateSyncStatus(SyncStatus.ERROR)
            }
        }
    }

    /**
     * Detecta si la lista fue modificada remotamente
     * Se ejecuta automáticamente cuando se recupera la conexión
     */
    private suspend fun detectRemoteChanges() {
        try {
            val hasRemoteChanges = detectRemoteChangesUseCase(listId)
            if (hasRemoteChanges) {
                // Actualizar estado con flag de cambios remotos
                val currentState = _uiState.value as? ListDetailUiState.Success
                if (currentState != null) {
                    _uiState.value = currentState.copy(
                        hasRemoteChanges = true
                    )
                }
            }
        } catch (e: Exception) {
            // Error al detectar cambios, ignorar silenciosamente
        }
    }

    /**
     * Actualiza el estado de sincronización
     */
    private fun updateSyncStatus(status: SyncStatus) {
        val currentState = _uiState.value as? ListDetailUiState.Success
        if (currentState != null) {
            _uiState.value = currentState.copy(syncStatus = status)
        }
    }

    /**
     * Reintentar cargar la lista (botón de retry)
     */
    fun retry() {
        loadListDetail()
    }
}

