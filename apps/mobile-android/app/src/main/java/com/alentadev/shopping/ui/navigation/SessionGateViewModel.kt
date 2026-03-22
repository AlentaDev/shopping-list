package com.alentadev.shopping.ui.navigation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
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
import javax.inject.Inject

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
                        _state.value = AuthBootstrapState.Unauthenticated
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
                    resolvePersistedSession()
                }
        }
    }

    private suspend fun resolvePersistedSession() {
        if (!connectivityGate.isOnline()) {
            _state.value = AuthBootstrapState.OfflineRecoverable
            return
        }

        _state.value = AuthBootstrapState.Checking
        _state.value = try {
            getCurrentUserUseCase.execute()
            AuthBootstrapState.Authenticated
        } catch (_: Exception) {
            AuthBootstrapState.Unauthenticated
        }
    }
}
