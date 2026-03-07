package com.alentadev.shopping.feature.lists.ui.list

import android.util.Log
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.alentadev.shopping.feature.lists.domain.repository.ListsRepository
import com.alentadev.shopping.feature.lists.domain.usecase.GetActiveListsUseCase
import com.alentadev.shopping.feature.lists.domain.usecase.RefreshListsUseCase
import com.alentadev.shopping.core.network.NetworkMonitor
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

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

    private val _isConnected = MutableStateFlow(true)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    init {
        // Observar cambios de conectividad
        viewModelScope.launch {
            networkMonitor.isConnected.collect { connected ->
                _isConnected.value = connected
                Log.d(TAG, "networkMonitor changed: isConnected=$connected")
            }
        }
    }

    fun loadLists() {
        viewModelScope.launch {
            _uiState.value = ListsUiState.Loading
            Log.d(TAG, "loadLists started - isConnected=${_isConnected.value}")
            try {
                if (!_isConnected.value) {
                    Log.d(TAG, "loadLists offline -> reading cached active lists")
                    val cachedLists = listsRepository.getCachedActiveLists()
                    _uiState.value = if (cachedLists.isEmpty()) {
                        Log.d(TAG, "loadLists offline -> cache empty")
                        ListsUiState.Empty(isOffline = true)
                    } else {
                        Log.d(TAG, "loadLists offline -> cache hit size=${cachedLists.size}")
                        ListsUiState.Success(
                            lists = cachedLists,
                            fromCache = true
                        )
                    }
                    return@launch
                }

                Log.d(TAG, "loadLists online -> fetching active lists with source")
                val result = listsRepository.getActiveListsWithSource()
                _uiState.value = if (result.lists.isEmpty()) {
                    Log.d(TAG, "loadLists online -> no active lists")
                    ListsUiState.Empty(isOffline = false)
                } else {
                    Log.d(TAG, "loadLists online -> success size=${result.lists.size}, fromCache=${result.fromCache}")
                    ListsUiState.Success(
                        lists = result.lists,
                        fromCache = result.fromCache
                    )
                }
            } catch (e: Exception) {
                Log.e(TAG, "loadLists failed", e)
                _uiState.value = ListsUiState.Error(e.message ?: "Error desconocido")
            }
        }
    }

    fun refreshLists() {
        viewModelScope.launch {
            Log.d(TAG, "refreshLists started")
            try {
                val lists = refreshListsUseCase.execute()
                Log.d(TAG, "refreshLists success size=${lists.size}")
                _uiState.value = if (lists.isEmpty()) {
                    ListsUiState.Empty(isOffline = false)
                } else {
                    ListsUiState.Success(
                        lists = lists,
                        fromCache = false
                    )
                }
            } catch (e: Exception) {
                Log.e(TAG, "refreshLists failed", e)
                _uiState.value = ListsUiState.Error(e.message ?: "Error al refrescar")
            }
        }
    }
}
