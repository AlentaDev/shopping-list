package com.alentadev.shopping.ui.navigation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import android.util.Log
import com.alentadev.shopping.core.network.ConnectivityGate
import com.alentadev.shopping.core.network.NetworkMonitor
import com.alentadev.shopping.feature.auth.domain.usecase.GetCurrentUserUseCase
import com.alentadev.shopping.feature.auth.domain.usecase.ObserveSessionUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collect
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.launch
import java.io.IOException
import javax.inject.Inject
import retrofit2.HttpException

private const val TAG = "SessionGateViewModel"

@HiltViewModel
class SessionGateViewModel @Inject constructor(
    private val observeSessionUseCase: ObserveSessionUseCase,
    private val getCurrentUserUseCase: GetCurrentUserUseCase,
    private val connectivityGate: ConnectivityGate,
    private val networkMonitor: NetworkMonitor
) : ViewModel() {

    private val _state = MutableStateFlow<AuthBootstrapState>(AuthBootstrapState.Unknown)
    val state: StateFlow<AuthBootstrapState> = _state.asStateFlow()

    private var hasRetriedCurrentRecoverableWindow = false

    private fun transitionTo(newState: AuthBootstrapState, reason: String) {
        val previous = _state.value
        if (previous != newState) {
            Log.d(TAG, "session_state_transition from=$previous to=$newState reason=$reason")
        }
        _state.value = newState
    }

    init {
        observeStartupSession()
        observeReconnectForRecoverableState()
    }

    private fun observeStartupSession() {
        viewModelScope.launch {
            observeSessionUseCase.execute()
                .distinctUntilChanged()
                .collectLatest { session ->
                    if (session == null) {
                        hasRetriedCurrentRecoverableWindow = false
                        transitionTo(AuthBootstrapState.Unauthenticated, reason = "persisted_session_missing")
                        return@collectLatest
                    }

                    resolvePersistedSession()
                }
        }
    }

    private fun observeReconnectForRecoverableState() {
        viewModelScope.launch {
            var wasConnected = true
            networkMonitor.isConnected
                .distinctUntilChanged()
                .collect { connected ->
                    if (!connected) {
                        wasConnected = false
                        hasRetriedCurrentRecoverableWindow = false
                        return@collect
                    }

                    val reconnected = !wasConnected && connected
                    wasConnected = true
                    if (!reconnected) return@collect
                    if (_state.value != AuthBootstrapState.OfflineRecoverable) return@collect
                    if (hasRetriedCurrentRecoverableWindow) return@collect

                    hasRetriedCurrentRecoverableWindow = true
                    Log.d(TAG, "session_validation_retry trigger=reconnect")
                    resolvePersistedSession()
                }
        }
    }

    private suspend fun resolvePersistedSession() {
        if (!connectivityGate.isOnline()) {
            transitionTo(AuthBootstrapState.OfflineRecoverable, reason = "connectivity_gate_offline")
            return
        }

        transitionTo(AuthBootstrapState.Checking, reason = "remote_validation_started")
        val nextState = try {
            getCurrentUserUseCase.execute()
            AuthBootstrapState.Authenticated
        } catch (exception: Exception) {
            if (isDefinitiveAuthFailure(exception)) {
                AuthBootstrapState.Unauthenticated
            } else {
                AuthBootstrapState.OfflineRecoverable
            }
        }
        transitionTo(nextState, reason = "remote_validation_finished")
    }

    private fun isDefinitiveAuthFailure(exception: Exception): Boolean {
        return when (exception) {
            is HttpException -> exception.code() == 401 || exception.code() == 403
            is IllegalStateException -> true
            is IOException -> false
            else -> false
        }
    }
}
