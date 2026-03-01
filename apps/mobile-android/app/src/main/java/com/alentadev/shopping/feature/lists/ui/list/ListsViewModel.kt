package com.alentadev.shopping.feature.lists.ui.list

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

    private val _uiState = MutableStateFlow<ListsUiState>(ListsUiState.Loading)
    val uiState: StateFlow<ListsUiState> = _uiState.asStateFlow()

    private val _isConnected = MutableStateFlow(true)
    val isConnected: StateFlow<Boolean> = _isConnected.asStateFlow()

    init {
        // Observar cambios de conectividad
        viewModelScope.launch {
            networkMonitor.isConnected.collect { connected ->
                _isConnected.value = connected
            }
        }
    }

    fun loadLists() {
        viewModelScope.launch {
            _uiState.value = ListsUiState.Loading
            try {
                if (!_isConnected.value) {
                    val cachedLists = listsRepository.getCachedActiveLists()
                    _uiState.value = if (cachedLists.isEmpty()) {
                        ListsUiState.Empty(isOffline = true)
                    } else {
                        ListsUiState.Success(
                            lists = cachedLists,
                            fromCache = true
                        )
                    }
                    return@launch
                }

                val result = listsRepository.getActiveListsWithSource()
                _uiState.value = if (result.lists.isEmpty()) {
                    ListsUiState.Empty(isOffline = false)
                } else {
                    ListsUiState.Success(
                        lists = result.lists,
                        fromCache = result.fromCache
                    )
                }
            } catch (e: Exception) {
                _uiState.value = ListsUiState.Error(e.message ?: "Error desconocido")
            }
        }
    }

    fun refreshLists() {
        viewModelScope.launch {
            try {
                val lists = refreshListsUseCase.execute()
                _uiState.value = if (lists.isEmpty()) {
                    ListsUiState.Empty(isOffline = false)
                } else {
                    ListsUiState.Success(
                        lists = lists,
                        fromCache = false
                    )
                }
            } catch (e: Exception) {
                _uiState.value = ListsUiState.Error(e.message ?: "Error al refrescar")
            }
        }
    }
}
