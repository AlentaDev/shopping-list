package com.alentadev.shopping.feature.sync.application

import com.alentadev.shopping.feature.auth.domain.usecase.ObserveSessionUseCase
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.collect
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
    private val syncCoordinator: SyncCoordinator
) {
    fun start(scope: CoroutineScope): Job {
        return scope.launch {
            observeSessionUseCase.execute()
                .distinctUntilChanged()
                .collect { session ->
                    if (session?.isAuthenticated == true) {
                        syncCoordinator.startForAuthenticatedSession()
                    } else {
                        syncCoordinator.cancel()
                    }
                }
        }
    }
}
