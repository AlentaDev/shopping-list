package com.alentadev.shopping.feature.sync.application

import com.alentadev.shopping.core.network.NetworkMonitor
import com.alentadev.shopping.feature.auth.domain.usecase.ObserveSessionUseCase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Guardrail: auth no puede importar internals de sync/lists/listdetail.
 * Sync puede observar estado de sesión, pero nunca alterar el dominio de auth.
 */
@Singleton
class AppSessionSyncObserver @Inject constructor(
    private val observeSessionUseCase: ObserveSessionUseCase,
    private val networkMonitor: NetworkMonitor,
    private val syncCoordinator: SyncCoordinator
) {
    @Volatile
    private var isAuthenticated = false

    fun start(scope: CoroutineScope): Job {
        val sessionJob = scope.launch {
            observeSessionUseCase.execute()
                .distinctUntilChanged()
                .collect { session ->
                    if (session?.isAuthenticated == true) {
                        isAuthenticated = true
                        syncCoordinator.startForAuthenticatedSession()
                    } else {
                        isAuthenticated = false
                        syncCoordinator.cancel()
                    }
                }
        }

        scope.launch {
            var wasConnected = networkMonitor.isCurrentlyConnected()
            networkMonitor.isConnected
                .distinctUntilChanged()
                .collect { connected ->
                    if (connected && !wasConnected && isAuthenticated) {
                        syncCoordinator.flushPendingQueue()
                    }
                    wasConnected = connected
                }
        }

        return sessionJob
    }

    fun onAppForeground() {
        if (isAuthenticated) {
            syncCoordinator.flushPendingQueue()
        }
    }
}
