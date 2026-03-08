package com.alentadev.shopping.feature.sync.application

import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SyncCoordinatorImpl @Inject constructor(
    private val listsWarmupService: ListsWarmupService,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO
) : SyncCoordinator {
    private val scope = CoroutineScope(SupervisorJob() + dispatcher)
    private var warmUpJob: Job? = null

    override fun startForAuthenticatedSession() {
        warmUpJob?.cancel()
        warmUpJob = scope.launch {
            runCatching { listsWarmupService.warmUp() }
        }
    }

    override fun cancel() {
        warmUpJob?.cancel()
        warmUpJob = null
    }

    fun clear() {
        cancel()
        scope.cancel()
    }
}
