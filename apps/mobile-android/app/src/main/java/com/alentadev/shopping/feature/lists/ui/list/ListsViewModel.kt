package com.alentadev.shopping.feature.lists.ui.list

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.alentadev.shopping.core.network.NetworkMonitor
import com.alentadev.shopping.core.network.resolveConnectivity
import com.alentadev.shopping.feature.lists.domain.repository.ListsRepository
import com.alentadev.shopping.feature.lists.domain.usecase.GetActiveListsUseCase
import com.alentadev.shopping.feature.lists.domain.usecase.RefreshListsUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import javax.inject.Inject
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

@HiltViewModel
class ListsViewModel @Inject constructor(
    private val getActiveListsUseCase: GetActiveListsUseCase,
    private val refreshListsUseCase: RefreshListsUseCase,
    private val listsRepository: ListsRepository,
    private val networkMonitor: NetworkMonitor
) : ViewModel() {

    private companion object {
        const val TAG = "ListsViewModel"
    }

    private val _uiState = MutableStateFlow<ListsUiState>(ListsUiState.Loading)
    val uiState: StateFlow<ListsUiState> = _uiState.asStateFlow()

    private val _isConnected = MutableStateFlow(networkMonitor.isCurrentlyConnected())
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    private val _syncSnackbarEvents = MutableSharedFlow<ListSyncSnackbarEvent>(extraBufferCapacity = 2)
    val syncSnackbarEvents: SharedFlow<ListSyncSnackbarEvent> = _syncSnackbarEvents.asSharedFlow()

    private var refreshJob: Job? = null
    private var wasEffectivelyConnected = networkMonitor.isCurrentlyConnected()

    init {
        viewModelScope.launch {
            networkMonitor.isConnected.collect { flowConnected ->
                val connectivity = networkMonitor.resolveConnectivity(flowConnected)
                _isConnected.value = connectivity.effectiveConnected
                Log.d(TAG, "connectivity effectiveConnected=${connectivity.effectiveConnected}")
                if (connectivity.flowConnected != connectivity.currentConnected) {
                    Log.w(TAG, "failure_category type=connectivity_mismatch flowConnected=${connectivity.flowConnected} currentConnected=${connectivity.currentConnected}")
                }

                if (connectivity.effectiveConnected && !wasEffectivelyConnected) {
                    triggerBackgroundRefresh("reconnect")
                }
                wasEffectivelyConnected = connectivity.effectiveConnected
            }
        }
    }

    fun loadLists() {
        viewModelScope.launch {
            if (_uiState.value !is ListsUiState.Success) {
                _uiState.value = ListsUiState.Loading
            }
            val connectivity = networkMonitor.resolveConnectivity(flowConnected = _isConnected.value)
            if (connectivity.flowConnected != connectivity.currentConnected) {
                Log.w(TAG, "failure_category type=connectivity_mismatch flowConnected=${connectivity.flowConnected} currentConnected=${connectivity.currentConnected}")
            }
            try {
                val cachedLists = listsRepository.getCachedActiveLists()
                _uiState.value = if (cachedLists.isEmpty()) {
                    ListsUiState.Empty(isOffline = !connectivity.effectiveConnected)
                } else {
                    ListsUiState.Success(lists = cachedLists, fromCache = true)
                }
                if (connectivity.effectiveConnected) {
                    triggerBackgroundRefresh("entry")
                }
            } catch (e: Exception) {
                _uiState.value = ListsUiState.Error(e.message ?: "Error desconocido")
            }
        }
    }

    private fun triggerBackgroundRefresh(trigger: String) {
        if (refreshJob?.isActive == true) {
            Log.d(TAG, "refresh_dedup resource=lists hit=true trigger=$trigger")
            return
        }
        Log.d(TAG, "refresh_dedup resource=lists hit=false trigger=$trigger")
        refreshJob = viewModelScope.launch {
            _syncSnackbarEvents.tryEmit(ListSyncSnackbarEvent.Show)
            try {
                val lists = refreshListsUseCase.execute()
                _uiState.value = if (lists.isEmpty()) {
                    ListsUiState.Empty(isOffline = false)
                } else {
                    ListsUiState.Success(lists = lists, fromCache = false)
                }
            } catch (_: Exception) {
                // mantener snapshot local
            } finally {
                _syncSnackbarEvents.tryEmit(ListSyncSnackbarEvent.Hide)
            }
        }
    }

    fun refreshLists() {
        viewModelScope.launch {
            val connectivity = networkMonitor.resolveConnectivity(flowConnected = _isConnected.value)
            try {
                if (!connectivity.effectiveConnected) {
                    val cachedLists = listsRepository.getCachedActiveLists()
                    _uiState.value = if (cachedLists.isEmpty()) {
                        ListsUiState.Empty(isOffline = true)
                    } else {
                        ListsUiState.Success(lists = cachedLists, fromCache = true)
                    }
                    return@launch
                }
                val lists = refreshListsUseCase.execute()
                _uiState.value = if (lists.isEmpty()) ListsUiState.Empty(isOffline = false) else ListsUiState.Success(lists = lists, fromCache = false)
            } catch (e: Exception) {
                _uiState.value = ListsUiState.Error(e.message ?: "Error al refrescar")
            }
        }
    }
}

sealed interface ListSyncSnackbarEvent {
    data object Show : ListSyncSnackbarEvent
    data object Hide : ListSyncSnackbarEvent
}
