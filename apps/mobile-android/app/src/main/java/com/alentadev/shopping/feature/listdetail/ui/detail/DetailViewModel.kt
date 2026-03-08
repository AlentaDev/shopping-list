package com.alentadev.shopping.feature.listdetail.ui.detail

import android.util.Log
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.alentadev.shopping.core.network.NetworkMonitor
import com.alentadev.shopping.core.network.resolveConnectivity
import com.alentadev.shopping.feature.listdetail.domain.usecase.CalculateTotalUseCase
import com.alentadev.shopping.feature.listdetail.domain.usecase.CheckItemUseCase
import com.alentadev.shopping.feature.listdetail.domain.usecase.CompleteListResult
import com.alentadev.shopping.feature.listdetail.domain.usecase.CompleteListUseCase
import com.alentadev.shopping.feature.listdetail.domain.usecase.DetectRemoteChangesUseCase
import com.alentadev.shopping.feature.listdetail.domain.usecase.GetListDetailUseCase
import com.alentadev.shopping.feature.listdetail.domain.usecase.RefreshDetailDecision
import com.alentadev.shopping.feature.listdetail.domain.usecase.RefreshListDetailIfNeededUseCase
import com.alentadev.shopping.feature.listdetail.domain.usecase.SyncCheckResult
import com.alentadev.shopping.feature.listdetail.domain.usecase.SyncCheckUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.launch
import retrofit2.HttpException
import javax.inject.Inject

@HiltViewModel
class DetailViewModel @Inject constructor(
    private val getListDetailUseCase: GetListDetailUseCase,
    private val checkItemUseCase: CheckItemUseCase,
    private val calculateTotalUseCase: CalculateTotalUseCase,
    private val syncCheckUseCase: SyncCheckUseCase,
    private val detectRemoteChangesUseCase: DetectRemoteChangesUseCase,
    private val refreshListDetailIfNeededUseCase: RefreshListDetailIfNeededUseCase,
    private val completeListUseCase: CompleteListUseCase,
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

    private val _syncSnackbarEvents = MutableSharedFlow<SyncSnackbarEvent>(extraBufferCapacity = 2)
    val syncSnackbarEvents: SharedFlow<SyncSnackbarEvent> = _syncSnackbarEvents.asSharedFlow()

    private val _uiEvents = MutableSharedFlow<DetailUiEvent>(extraBufferCapacity = 1)
    val uiEvents: SharedFlow<DetailUiEvent> = _uiEvents.asSharedFlow()

    private var refreshJob: Job? = null
    private var hasEmittedCompletionNavigation = false

    init {
        loadListDetail()
        observeConnectivity()
    }

    private fun observeConnectivity() {
        viewModelScope.launch {
            var wasConnected = networkMonitor.isCurrentlyConnected()
            networkMonitor.isConnected.collect { flowConnected ->
                val connectivity = networkMonitor.resolveConnectivity(flowConnected)
                _isConnected.value = connectivity.effectiveConnected
                if (connectivity.flowConnected != connectivity.currentConnected) {
                    Log.w(TAG, "failure_category type=connectivity_mismatch listId=$listId flowConnected=${connectivity.flowConnected} currentConnected=${connectivity.currentConnected}")
                }

                if (connectivity.effectiveConnected && !wasConnected) {
                    detectRemoteChanges()
                    triggerBackgroundRefresh("reconnect")
                }
                wasConnected = connectivity.effectiveConnected
            }
        }
    }

    fun loadListDetail() {
        viewModelScope.launch {
            if (_uiState.value !is ListDetailUiState.Success) {
                _uiState.value = ListDetailUiState.Loading
            }
            var hasTriggeredEntryRefresh = false
            val connectivity = networkMonitor.resolveConnectivity(flowConnected = _isConnected.value)
            if (connectivity.flowConnected != connectivity.currentConnected) {
                Log.w(TAG, "failure_category type=connectivity_mismatch listId=$listId flowConnected=${connectivity.flowConnected} currentConnected=${connectivity.currentConnected}")
            }
            Log.d(TAG, "refresh_started resource=detail listId=$listId trigger=entry effectiveConnected=${connectivity.effectiveConnected}")
            getListDetailUseCase(listId, preferCache = true)
                .catch { e ->
                    Log.e(TAG, "loadListDetail failed", e)
                    _uiState.value = ListDetailUiState.Error(e.message ?: "Error al cargar la lista")
                }
                .collect { listDetail ->
                    val total = calculateTotalUseCase(listDetail)
                    val currentState = _uiState.value as? ListDetailUiState.Success
                    _uiState.value = ListDetailUiState.Success(
                        listDetail = listDetail,
                        total = total,
                        fromCache = true,
                        hasRemoteChanges = currentState?.hasRemoteChanges ?: false,
                        syncStatus = currentState?.syncStatus ?: SyncStatus.IDLE,
                        hasPermanentRefreshError = currentState?.hasPermanentRefreshError ?: false,
                        showCompleteConfirmation = currentState?.showCompleteConfirmation ?: false,
                        isCompleting = currentState?.isCompleting ?: false,
                        completeListError = currentState?.completeListError
                    )
                    if (connectivity.effectiveConnected && !hasTriggeredEntryRefresh) {
                        triggerBackgroundRefresh("entry")
                        hasTriggeredEntryRefresh = true
                    }
                }
        }
    }

    fun onCompleteListRequested() {
        val current = _uiState.value as? ListDetailUiState.Success ?: return
        _uiState.value = current.copy(showCompleteConfirmation = true, completeListError = null, syncStatus = SyncStatus.IDLE)
    }

    fun dismissCompleteDialog() {
        val current = _uiState.value as? ListDetailUiState.Success ?: return
        _uiState.value = current.copy(showCompleteConfirmation = false)
    }

    fun confirmCompleteList() {
        val current = _uiState.value as? ListDetailUiState.Success ?: return
        if (current.isCompleting || !current.showCompleteConfirmation) return

        val checkedIds = current.listDetail.items.filter { it.checked }.map { it.id }
        _uiState.value = current.copy(isCompleting = true, completeListError = null)

        viewModelScope.launch {
            val result = runCatching { completeListUseCase(listId, checkedIds) }
                .getOrDefault(CompleteListResult.ServerError)

            val latest = _uiState.value as? ListDetailUiState.Success ?: return@launch
            when (result) {
                CompleteListResult.Success,
                CompleteListResult.Offline -> {
                    _uiState.value = latest.copy(
                        isCompleting = false,
                        showCompleteConfirmation = false,
                        completeListError = null
                    )
                    if (!hasEmittedCompletionNavigation) {
                        hasEmittedCompletionNavigation = true
                        _uiEvents.tryEmit(DetailUiEvent.ListCompleted)
                    }
                }
                else -> {
                    _uiState.value = latest.copy(
                        isCompleting = false,
                        showCompleteConfirmation = false,
                        completeListError = result.toUiError()
                    )
                }
            }
        }
    }

    private fun CompleteListResult.toUiError(): CompleteListError = when (this) {
        CompleteListResult.Offline -> CompleteListError.OFFLINE
        CompleteListResult.NoConnection -> CompleteListError.NO_CONNECTION
        CompleteListResult.InvalidTransition -> CompleteListError.INVALID_TRANSITION
        CompleteListResult.Unauthorized -> CompleteListError.UNAUTHORIZED
        CompleteListResult.Forbidden -> CompleteListError.FORBIDDEN
        CompleteListResult.NotFound -> CompleteListError.NOT_FOUND
        CompleteListResult.ServerError -> CompleteListError.SERVER_ERROR
        CompleteListResult.Success -> CompleteListError.UNKNOWN
    }

    private fun triggerBackgroundRefresh(trigger: String) {
        if (refreshJob?.isActive == true) {
            Log.d(TAG, "refresh_dedup resource=detail listId=$listId hit=true trigger=$trigger")
            return
        }
        Log.d(TAG, "refresh_dedup resource=detail listId=$listId hit=false trigger=$trigger")
        refreshJob = viewModelScope.launch {
            _syncSnackbarEvents.tryEmit(SyncSnackbarEvent.Show)
            updateSyncStatus(SyncStatus.SYNCING)
            try {
                val decision = refreshListDetailIfNeededUseCase(listId)
                Log.d(TAG, "refresh_decision listId=$listId decision=$decision")
                if (decision != RefreshDetailDecision.SKIP_EQUAL) {
                    detectRemoteChanges()
                }
                val current = _uiState.value as? ListDetailUiState.Success
                if (current != null) {
                    _uiState.value = current.copy(hasPermanentRefreshError = false)
                }
            } catch (exception: HttpException) {
                if (exception.code() == 403 || exception.code() == 404) {
                    Log.w(TAG, "failure_category type=permanent code=${exception.code()} listId=$listId")
                    val current = _uiState.value as? ListDetailUiState.Success
                    if (current != null) {
                        _uiState.value = current.copy(hasPermanentRefreshError = true)
                    }
                }
            } catch (exception: Exception) {
                Log.w(TAG, "failure_category type=transient listId=$listId", exception)
            } finally {
                updateSyncStatus(SyncStatus.IDLE)
                _syncSnackbarEvents.tryEmit(SyncSnackbarEvent.Hide)
                Log.d(TAG, "refresh_finished resource=detail listId=$listId")
            }
        }
    }

    fun toggleItemCheck(itemId: String, checked: Boolean) {
        viewModelScope.launch {
            try {
                val connectivity = networkMonitor.resolveConnectivity(flowConnected = _isConnected.value)
                checkItemUseCase(listId, itemId, checked)
                if (connectivity.effectiveConnected) {
                    updateSyncStatus(SyncStatus.SYNCING)
                    when (syncCheckUseCase(listId, itemId, checked)) {
                        SyncCheckResult.Success -> updateSyncStatus(SyncStatus.SUCCESS)
                        SyncCheckResult.TransientFailure, SyncCheckResult.PermanentFailure -> updateSyncStatus(SyncStatus.IDLE)
                    }
                }
            } catch (e: Exception) {
                Log.e(TAG, "toggleItemCheck failed", e)
                updateSyncStatus(SyncStatus.ERROR)
            }
        }
    }

    private suspend fun detectRemoteChanges() {
        try {
            val hasRemoteChanges = detectRemoteChangesUseCase(listId)
            val currentState = _uiState.value as? ListDetailUiState.Success
            if (currentState != null && hasRemoteChanges) {
                _uiState.value = currentState.copy(hasRemoteChanges = true)
            }
        } catch (_: Exception) {
        }
    }

    private fun updateSyncStatus(status: SyncStatus) {
        val currentState = _uiState.value as? ListDetailUiState.Success
        if (currentState != null) {
            _uiState.value = currentState.copy(syncStatus = status)
        }
    }

    fun retry() {
        loadListDetail()
    }
}

sealed interface SyncSnackbarEvent {
    data object Show : SyncSnackbarEvent
    data object Hide : SyncSnackbarEvent
}

sealed interface DetailUiEvent {
    data object ListCompleted : DetailUiEvent
}
